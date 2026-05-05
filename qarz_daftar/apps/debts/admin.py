from django.contrib import admin
from django.utils.html import format_html
from .models import Debt, DebtItem


class DebtItemInline(admin.TabularInline):
    model = DebtItem
    extra = 0
    readonly_fields = ["total_price"]
    fields = ["product", "name", "quantity", "unit_price", "total_price"]


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = [
        "customer", "business", "total_amount", "paid_amount",
        "remaining_amount", "colored_status", "due_date", "created_at",
    ]
    list_filter = ["status", "business", "created_at", "due_date"]
    search_fields = ["customer__full_name", "customer__phone", "description"]
    readonly_fields = [
        "id", "remaining_amount", "status",
        "paid_amount", "created_at", "updated_at",
    ]
    autocomplete_fields = ["customer", "business"]
    inlines = [DebtItemInline]
    date_hierarchy = "created_at"

    fieldsets = (
        ("Debt Info", {
            "fields": ("id", "customer", "business", "description", "due_date")
        }),
        ("Financials", {
            "fields": ("total_amount", "paid_amount", "remaining_amount", "status")
        }),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def colored_status(self, obj):
        colors = {"paid": "green", "partial": "orange", "unpaid": "red"}
        color = colors.get(obj.status, "black")
        return format_html(
            '<span style="color:{}; font-weight:bold;">{}</span>',
            color, obj.get_status_display()
        )
    colored_status.short_description = "Status"


@admin.register(DebtItem)
class DebtItemAdmin(admin.ModelAdmin):
    list_display = ["name", "debt", "quantity", "unit_price", "total_price"]
    search_fields = ["name", "debt__customer__full_name"]
    readonly_fields = ["total_price", "id", "created_at"]
