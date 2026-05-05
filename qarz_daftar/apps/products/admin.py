from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "business", "price", "unit", "is_active", "created_at"]
    list_filter = ["is_active", "business"]
    search_fields = ["name", "description"]
    readonly_fields = ["id", "created_at", "updated_at"]
    autocomplete_fields = ["business"]
