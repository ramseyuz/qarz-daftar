"""
Debt and DebtItem models with auto-calculated fields.
"""
from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel


class Debt(BaseModel):
    class Status(models.TextChoices):
        UNPAID = "unpaid", _("Unpaid")
        PARTIAL = "partial", _("Partial")
        PAID = "paid", _("Paid")

    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.CASCADE,
        related_name="debts",
        verbose_name=_("Customer"),
    )
    # ── Denormalized business for fast tenant filtering ─────────────────
    business = models.ForeignKey(
        "businesses.Business",
        on_delete=models.CASCADE,
        related_name="debts",
        verbose_name=_("Business"),
    )
    description = models.TextField(blank=True, verbose_name=_("Description"))
    total_amount = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name=_("Total amount"),
    )
    paid_amount = models.DecimalField(
        max_digits=15, decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Paid amount"),
    )
    remaining_amount = models.DecimalField(
        max_digits=15, decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Remaining amount"),
        editable=False,
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.UNPAID,
        db_index=True,
        verbose_name=_("Status"),
    )
    due_date = models.DateField(null=True, blank=True, verbose_name=_("Due date"))
    reminder_sent = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("Debt")
        verbose_name_plural = _("Debts")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business", "status"]),
            models.Index(fields=["customer", "status"]),
        ]

    def __str__(self):
        return f"{self.customer} — {self.total_amount} ({self.status})"

    def recalculate(self):
        """Recompute remaining_amount and status. Call after any payment change."""
        self.remaining_amount = self.total_amount - self.paid_amount
        if self.remaining_amount <= 0:
            self.remaining_amount = 0
            self.status = self.Status.PAID
        elif self.paid_amount == 0:
            self.status = self.Status.UNPAID
        else:
            self.status = self.Status.PARTIAL

    def save(self, *args, **kwargs):
        self.recalculate()
        # Auto-fill business from customer
        if not self.business_id and self.customer_id:
            self.business = self.customer.business
        super().save(*args, **kwargs)


class DebtItem(BaseModel):
    """Line items on a debt (product-based debts)."""

    debt = models.ForeignKey(
        Debt,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("Debt"),
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="debt_items",
        verbose_name=_("Product"),
    )
    name = models.CharField(
        max_length=200,
        verbose_name=_("Item name"),
        help_text="Snapshot of the product name at time of sale",
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    total_price = models.DecimalField(max_digits=15, decimal_places=2, editable=False)

    class Meta:
        verbose_name = _("Debt Item")
        verbose_name_plural = _("Debt Items")

    def __str__(self):
        return f"{self.name} × {self.quantity}"

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
