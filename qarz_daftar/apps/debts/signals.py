"""
Signals: keep Debt.paid_amount in sync whenever a Payment is saved/deleted.
"""
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


@receiver(post_save, sender="payments.Payment")
def update_debt_on_payment_save(sender, instance, **kwargs):
    _sync_debt(instance.debt)


@receiver(post_delete, sender="payments.Payment")
def update_debt_on_payment_delete(sender, instance, **kwargs):
    _sync_debt(instance.debt)


def _sync_debt(debt):
    from django.db.models import Sum
    from apps.payments.models import Payment

    total_paid = (
        Payment.objects.filter(debt=debt).aggregate(s=Sum("amount"))["s"] or 0
    )
    debt.paid_amount = total_paid
    debt.recalculate()
    debt.save(update_fields=["paid_amount", "remaining_amount", "status"])
