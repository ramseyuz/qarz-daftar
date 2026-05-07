from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel


class SubscriptionPlan(BaseModel):
    """Defines a subscription tier with pricing and resource limits."""

    name          = models.CharField(max_length=100, unique=True)
    price         = models.DecimalField(max_digits=12, decimal_places=2, help_text="Price in UZS")
    duration_days = models.PositiveIntegerField(help_text="How many days the plan lasts")
    max_users     = models.PositiveIntegerField(help_text="Max active employees")
    max_customers = models.PositiveIntegerField(help_text="Max customers")
    max_debts     = models.PositiveIntegerField(help_text="Max debts")
    description   = models.TextField(blank=True)
    is_active     = models.BooleanField(default=True)

    class Meta:
        ordering = ["price"]
        verbose_name = _("Subscription Plan")
        verbose_name_plural = _("Subscription Plans")

    def __str__(self):
        return self.name


class Subscription(BaseModel):
    """A specific plan assigned to a business by a superadmin."""

    business   = models.ForeignKey(
        "businesses.Business",
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan       = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="subscriptions",
    )
    start_date = models.DateField()
    end_date   = models.DateField()
    is_active  = models.BooleanField(default=True)
    notes      = models.TextField(blank=True)

    class Meta:
        ordering = ["-end_date"]
        verbose_name = _("Subscription")
        verbose_name_plural = _("Subscriptions")

    def __str__(self):
        return f"{self.business.name} — {self.plan.name} (until {self.end_date})"

    @property
    def is_expired(self):
        return timezone.now().date() > self.end_date

    @property
    def is_valid(self):
        return self.is_active and not self.is_expired

    @property
    def days_remaining(self):
        return max(0, (self.end_date - timezone.now().date()).days)
