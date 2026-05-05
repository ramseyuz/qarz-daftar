from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "debt", "amount", "payment_method", "created_at"
    ]
    list_filter = ["payment_method", "created_at"]
    search_fields = ["debt__customer__full_name", "notes"]
    readonly_fields = ["id", "created_at", "updated_at"]
    date_hierarchy = "created_at"
    autocomplete_fields = ["debt"]
