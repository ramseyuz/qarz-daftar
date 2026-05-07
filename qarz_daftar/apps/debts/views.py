import io
from datetime import date

from django.db.models import Sum, Count, Q
from django.http import HttpResponse
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, filters as df
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from rest_framework.exceptions import PermissionDenied
from core.mixins import BusinessScopedMixin, SoftDeleteMixin
from core.permissions import BelongsToUserBusiness, IsSubscriptionActive
from .models import Debt, DebtItem
from .serializers import DebtSerializer, DebtCreateWithItemsSerializer, DebtItemSerializer


class DebtFilter(FilterSet):
    status = df.CharFilter(field_name="status")
    exclude_status = df.CharFilter(method="filter_exclude_status")
    customer = df.UUIDFilter(field_name="customer__id")

    def filter_exclude_status(self, queryset, name, value):
        return queryset.exclude(status=value)
    date_from = df.DateFilter(field_name="created_at__date", lookup_expr="gte")
    date_to = df.DateFilter(field_name="created_at__date", lookup_expr="lte")
    min_amount = df.NumberFilter(field_name="total_amount", lookup_expr="gte")
    max_amount = df.NumberFilter(field_name="total_amount", lookup_expr="lte")
    overdue = df.BooleanFilter(method="filter_overdue")

    def filter_overdue(self, queryset, name, value):
        if value:
            return queryset.filter(
                due_date__lt=date.today(),
                status__in=["unpaid", "partial"]
            )
        return queryset

    class Meta:
        model = Debt
        fields = ["status", "exclude_status", "customer", "date_from", "date_to"]


@extend_schema_view(
    list=extend_schema(summary="List debts", tags=["Debts"]),
    create=extend_schema(summary="Create debt", tags=["Debts"]),
    retrieve=extend_schema(summary="Get debt", tags=["Debts"]),
    update=extend_schema(summary="Update debt", tags=["Debts"]),
    partial_update=extend_schema(summary="Patch debt", tags=["Debts"]),
    destroy=extend_schema(summary="Delete debt (soft)", tags=["Debts"]),
)
class DebtViewSet(SoftDeleteMixin, BusinessScopedMixin, viewsets.ModelViewSet):
    queryset = (
        Debt.objects
        .select_related("customer", "business")
        .prefetch_related("items", "payments")
        .all()
    )
    permission_classes = [permissions.IsAuthenticated, BelongsToUserBusiness, IsSubscriptionActive]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DebtFilter
    search_fields = ["customer__full_name", "customer__phone", "description"]
    ordering_fields = ["created_at", "total_amount", "remaining_amount"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return DebtCreateWithItemsSerializer
        return DebtSerializer

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_superadmin and user.business:
            sub = user.business.current_subscription
            if sub:
                limit   = sub.plan.max_debts
                current = Debt.objects.filter(business=user.business, is_deleted=False).count()
                if current >= limit:
                    raise PermissionDenied(
                        f"Debt limit reached ({limit}). Upgrade your plan."
                    )
        super().perform_create(serializer)

    @extend_schema(summary="Summary stats for this business", tags=["Debts"])
    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        qs = self.get_queryset()
        stats = qs.aggregate(
            total_debts=Count("id"),
            total_amount=Sum("total_amount"),
            total_paid=Sum("paid_amount"),
            total_remaining=Sum("remaining_amount"),
            unpaid_count=Count("id", filter=Q(status="unpaid")),
            partial_count=Count("id", filter=Q(status="partial")),
            paid_count=Count("id", filter=Q(status="paid")),
        )
        return Response({"status": "success", "data": stats})

    @extend_schema(summary="Export debts to Excel", tags=["Debts"])
    @action(detail=False, methods=["get"], url_path="export/excel")
    def export_excel(self, request):
        try:
            import openpyxl
            from openpyxl.styles import Font, PatternFill, Alignment
        except ImportError:
            return Response({"error": "openpyxl not installed."}, status=500)

        qs = self.filter_queryset(self.get_queryset())
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Debts"

        headers = [
            "Customer", "Phone", "Total Amount", "Paid Amount",
            "Remaining", "Status", "Due Date", "Created At"
        ]
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill("solid", fgColor="2E7D32")

        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

        for row_num, debt in enumerate(qs, 2):
            ws.cell(row=row_num, column=1, value=debt.customer.full_name)
            ws.cell(row=row_num, column=2, value=str(debt.customer.phone))
            ws.cell(row=row_num, column=3, value=float(debt.total_amount))
            ws.cell(row=row_num, column=4, value=float(debt.paid_amount))
            ws.cell(row=row_num, column=5, value=float(debt.remaining_amount))
            ws.cell(row=row_num, column=6, value=debt.status)
            ws.cell(row=row_num, column=7, value=str(debt.due_date) if debt.due_date else "")
            ws.cell(row=row_num, column=8, value=debt.created_at.strftime("%Y-%m-%d"))

        for col in ws.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            ws.column_dimensions[col[0].column_letter].width = max_len + 4

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="debts.xlsx"'
        return response


@extend_schema_view(
    list=extend_schema(summary="List debt items", tags=["Debts"]),
    create=extend_schema(summary="Add debt item", tags=["Debts"]),
    retrieve=extend_schema(summary="Get debt item", tags=["Debts"]),
    update=extend_schema(summary="Update debt item", tags=["Debts"]),
    destroy=extend_schema(summary="Delete debt item", tags=["Debts"]),
)
class DebtItemViewSet(BusinessScopedMixin, viewsets.ModelViewSet):
    queryset = DebtItem.objects.select_related("debt", "product").all()
    serializer_class = DebtItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    business_field = "debt__business"

    def get_queryset(self):
        qs = super().get_queryset()
        debt_id = self.request.query_params.get("debt")
        if debt_id:
            qs = qs.filter(debt_id=debt_id)
        return qs


@extend_schema(summary="Monthly/daily debt report", tags=["Reports"])
class DebtReportView(APIView):
    """Aggregated debt report — summary + last 12 months."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models.functions import TruncMonth
        user = request.user
        qs = Debt.objects.all()
        if not user.is_superuser and user.business:
            qs = qs.filter(business=user.business)

        # ── Status summary ────────────────────────────────
        agg = qs.aggregate(
            s_total_debts=Count("id"),
            s_total_amount=Sum("total_amount"),
            s_total_paid=Sum("paid_amount"),
            s_total_remaining=Sum("remaining_amount"),
            s_unpaid_count=Count("id", filter=Q(status="unpaid")),
            s_partial_count=Count("id", filter=Q(status="partial")),
            s_paid_count=Count("id", filter=Q(status="paid")),
            # unpaid_amount  = total still owed across unpaid + partial debts
            # partial_amount = total already paid on partial debts
            # paid_amount    = total collected from fully paid debts
            s_unpaid_amount=Sum("remaining_amount", filter=Q(status__in=["unpaid", "partial"])),
            s_partial_amount=Sum("paid_amount", filter=Q(status="partial")),
            s_paid_amount=Sum("total_amount", filter=Q(status="paid")),
        )

        summary = {
            "total_debts":     agg["s_total_debts"] or 0,
            "total_amount":    float(agg["s_total_amount"] or 0),
            "total_paid":      float(agg["s_total_paid"] or 0),
            "total_remaining": float(agg["s_total_remaining"] or 0),
            "unpaid_count":    agg["s_unpaid_count"] or 0,
            "partial_count":   agg["s_partial_count"] or 0,
            "paid_count":      agg["s_paid_count"] or 0,
            "unpaid_amount":   float(agg["s_unpaid_amount"] or 0),
            "partial_amount":  float(agg["s_partial_amount"] or 0),
            "paid_amount":     float(agg["s_paid_amount"] or 0),
        }

        # ── Monthly (last 12 months) ──────────────────────
        monthly_qs = (
            qs.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(
                total=Sum("total_amount"),
                paid=Sum("paid_amount"),
                remaining=Sum("remaining_amount"),
                count=Count("id"),
            )
            .order_by("month")[:12]
        )
        monthly = [
            {
                "month":     row["month"].strftime("%b %Y") if row["month"] else "",
                "total":     float(row["total"] or 0),
                "paid":      float(row["paid"] or 0),
                "remaining": float(row["remaining"] or 0),
                "count":     row["count"],
            }
            for row in monthly_qs
        ]

        return Response({"status": "success", "summary": summary, "monthly": monthly})
