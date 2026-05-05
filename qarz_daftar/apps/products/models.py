from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel


class Product(BaseModel):
    business = models.ForeignKey(
        "businesses.Business",
        on_delete=models.CASCADE,
        related_name="products",
        verbose_name=_("Business"),
    )
    name = models.CharField(max_length=200, verbose_name=_("Product name"))
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name=_("Price"),
    )
    unit = models.CharField(max_length=50, default="pcs", verbose_name=_("Unit"))
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Product")
        verbose_name_plural = _("Products")
        ordering = ["name"]
        unique_together = [("business", "name")]

    def __str__(self):
        return f"{self.name} ({self.price})"
