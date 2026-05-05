from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["full_name", "phone", "business", "is_active", "total_debt", "total_remaining", "created_at"]
    list_filter = ["is_active", "business", "created_at"]
    search_fields = ["full_name", "phone"]
    readonly_fields = ["id", "created_at", "updated_at"]
    autocomplete_fields = ["business"]
