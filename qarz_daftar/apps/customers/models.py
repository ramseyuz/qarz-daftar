"""
Customer (debtor) model.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField
from core.models import BaseModel


class Customer(BaseModel):
    """
    A customer / debtor tied to a specific business.
    """

    business = models.ForeignKey(
        "businesses.Business",
        on_delete=models.CASCADE,
        related_name="customers",
        verbose_name=_("Business"),
    )
    full_name = models.CharField(max_length=255, verbose_name=_("Full name"))
    phone = PhoneNumberField(verbose_name=_("Phone number"), db_index=True)
    address = models.TextField(blank=True, verbose_name=_("Address"))
    notes = models.TextField(blank=True, verbose_name=_("Notes"))
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = _("Customer")
        verbose_name_plural = _("Customers")
        ordering = ["full_name"]
        # A phone number must be unique per business
        unique_together = [("business", "phone")]
        indexes = [
            models.Index(fields=["business", "full_name"]),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.phone})"

    @property
    def total_debt(self):
        from django.db.models import Sum
        result = self.debts.filter(
            is_deleted=False
        ).aggregate(total=Sum("total_amount"))
        return result["total"] or 0

    @property
    def total_remaining(self):
        from django.db.models import Sum
        result = self.debts.filter(
            is_deleted=False, status__in=["unpaid", "partial"]
        ).aggregate(total=Sum("remaining_amount"))
        return result["total"] or 0
