from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, filters as df
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view

from core.mixins import SoftDeleteMixin
from core.permissions import BelongsToUserBusiness, IsSubscriptionActive
from .models import Payment
from .serializers import PaymentSerializer


class PaymentFilter(FilterSet):
    debt = df.UUIDFilter(field_name="debt__id")
    method = df.CharFilter(field_name="payment_method")
    date_from = df.DateFilter(field_name="created_at__date", lookup_expr="gte")
    date_to = df.DateFilter(field_name="created_at__date", lookup_expr="lte")

    class Meta:
        model = Payment
        fields = ["debt", "payment_method", "date_from", "date_to"]


@extend_schema_view(
    list=extend_schema(summary="List payments", tags=["Payments"]),
    create=extend_schema(summary="Record payment", tags=["Payments"]),
    retrieve=extend_schema(summary="Get payment", tags=["Payments"]),
    update=extend_schema(summary="Update payment", tags=["Payments"]),
    partial_update=extend_schema(summary="Patch payment", tags=["Payments"]),
    destroy=extend_schema(summary="Delete payment (soft)", tags=["Payments"]),
)
class PaymentViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("debt__customer", "debt__business").all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, BelongsToUserBusiness, IsSubscriptionActive]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = PaymentFilter
    search_fields = ["debt__customer__full_name", "notes"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        if user.business:
            return qs.filter(debt__business=user.business)
        return qs.none()
