from django import template
from django.db.models import Sum, Count, Q
from django.utils.timezone import now
from datetime import timedelta

register = template.Library()


@register.simple_tag
def get_dashboard_stats():
    try:
        from apps.debts.models import Debt
        from apps.customers.models import Customer
        from apps.payments.models import Payment

        qs = Debt.objects.filter(is_deleted=False)
        agg = qs.aggregate(
            cnt_all      = Count("id"),
            sum_amount   = Sum("total_amount"),
            sum_paid     = Sum("paid_amount"),
            sum_remaining= Sum("remaining_amount"),
            cnt_unpaid   = Count("id", filter=Q(status="unpaid")),
            cnt_partial  = Count("id", filter=Q(status="partial")),
            cnt_paid     = Count("id", filter=Q(status="paid")),
            sum_unpaid   = Sum("total_amount", filter=Q(status="unpaid")),
            sum_partial  = Sum("total_amount", filter=Q(status="partial")),
        )

        total_amount = float(agg["sum_amount"]  or 0)
        total_paid   = float(agg["sum_paid"]    or 0)
        collection_pct = round(total_paid / total_amount * 100) if total_amount else 0

        thirty_days_ago = now().date() - timedelta(days=30)
        recent_payments = float(
            Payment.objects
            .filter(created_at__date__gte=thirty_days_ago)
            .aggregate(t=Sum("amount"))["t"] or 0
        )

        return {
            "total_debts":     agg["cnt_all"]       or 0,
            "total_amount":    total_amount,
            "total_paid":      total_paid,
            "total_remaining": float(agg["sum_remaining"] or 0),
            "unpaid_count":    agg["cnt_unpaid"]    or 0,
            "partial_count":   agg["cnt_partial"]   or 0,
            "paid_count":      agg["cnt_paid"]      or 0,
            "unpaid_amount":   float(agg["sum_unpaid"]   or 0),
            "partial_amount":  float(agg["sum_partial"]  or 0),
            "collection_pct":  collection_pct,
            "customer_count":  Customer.objects.filter(is_active=True).count(),
            "recent_payments": recent_payments,
        }
    except Exception:
        return {}


@register.simple_tag
def get_recent_debts(limit=8):
    try:
        from apps.debts.models import Debt
        return (
            Debt.objects
            .filter(is_deleted=False)
            .select_related("customer")
            .order_by("-created_at")[:limit]
        )
    except Exception:
        return []


@register.filter
def fmt_uzs(value):
    try:
        n = int(float(value))
        formatted = f"{n:,}".replace(",", " ")
        return f"{formatted} UZS"
    except (ValueError, TypeError):
        return "0 UZS"
