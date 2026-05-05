"""
Business (tenant) model — the root of the multi-tenant hierarchy.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel
from phonenumber_field.modelfields import PhoneNumberField


class Business(BaseModel):
    """
    Represents a shop, café, or retail store.
    All other records belong to a Business.
    """

    name = models.CharField(max_length=200, verbose_name=_("Business name"))
    phone = PhoneNumberField(verbose_name=_("Phone number"))
    address = models.TextField(blank=True, verbose_name=_("Address"))
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="business_logos/", null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = _("Business")
        verbose_name_plural = _("Businesses")
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def total_debt_amount(self):
        from apps.debts.models import Debt
        from django.db.models import Sum
        result = Debt.objects.filter(customer__business=self).aggregate(
            total=Sum("total_amount")
        )
        return result["total"] or 0

    @property
    def total_remaining_amount(self):
        from apps.debts.models import Debt
        from django.db.models import Sum
        result = Debt.objects.filter(
            customer__business=self, status__in=["unpaid", "partial"]
        ).aggregate(total=Sum("remaining_amount"))
        return result["total"] or 0
