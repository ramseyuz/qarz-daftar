from django.contrib import admin
from django.utils.html import format_html
from .models import Business


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = [
        "name", "phone", "is_active", "logo_preview",
        "total_debt_amount", "total_remaining_amount", "created_at",
    ]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "phone", "address"]
    readonly_fields = ["id", "created_at", "updated_at", "logo_preview"]
    ordering = ["name"]

    fieldsets = (
        ("Basic Info", {"fields": ("id", "name", "phone", "address", "description")}),
        ("Media", {"fields": ("logo", "logo_preview")}),
        ("Status", {"fields": ("is_active",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" width="50" height="50" />', obj.logo.url)
        return "—"

    logo_preview.short_description = "Logo"
