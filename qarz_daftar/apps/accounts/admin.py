from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = [
        "email", "get_full_name", "role", "business", "is_active", "created_at"
    ]
    list_filter = ["role", "is_active", "is_staff", "business"]
    search_fields = ["email", "username", "first_name", "last_name", "phone"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at", "last_login"]

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "email", "phone", "avatar")}),
        (_("Business"), {"fields": ("role", "business")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active", "is_staff", "is_superuser",
                    "groups", "user_permissions",
                ),
            },
        ),
        (_("Timestamps"), {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username", "email", "first_name", "last_name",
                    "role", "business", "password1", "password2",
                ),
            },
        ),
    )
