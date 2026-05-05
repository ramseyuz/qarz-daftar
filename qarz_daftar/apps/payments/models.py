from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel


class Payment(BaseModel):
    class Method(models.TextChoices):
        CASH = "cash", _("Cash")
        CARD = "card", _("Card")
        TRANSFER = "transfer", _("Bank Transfer")
        OTHER = "other", _("Other")

    debt = models.ForeignKey(
        "debts.Debt",
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name=_("Debt"),
    )
    amount = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(0.01)],
        verbose_name=_("Amount"),
    )
    payment_method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.CASH,
        verbose_name=_("Payment method"),
    )
    notes = models.TextField(blank=True, verbose_name=_("Notes"))

    class Meta:
        verbose_name = _("Payment")
        verbose_name_plural = _("Payments")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["debt", "created_at"]),
        ]

    def __str__(self):
        return f"{self.amount} via {self.payment_method} for {self.debt}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.amount and self.debt_id:
            remaining = self.debt.remaining_amount
            # Allow overpayment guard
            if self.amount > remaining:
                raise ValidationError(
                    {"amount": f"Payment ({self.amount}) exceeds remaining debt ({remaining})."}
                )
