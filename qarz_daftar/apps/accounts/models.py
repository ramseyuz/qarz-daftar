"""
Custom User model with role-based access control.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel


class User(AbstractUser, TimeStampedModel):
    """
    Extended user model.
    Each user is tied to exactly one Business (except superadmins).
    """

    class Role(models.TextChoices):
        SUPERADMIN = "superadmin", _("Super Admin")
        OWNER = "owner", _("Business Owner")
        EMPLOYEE = "employee", _("Employee")

    email = models.EmailField(_("email address"), unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.OWNER,
        db_index=True,
    )
    business = models.ForeignKey(
        "businesses.Business",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        help_text=_("The business this user belongs to. Null only for super admins."),
    )
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    @property
    def is_superadmin(self):
        return self.role == self.Role.SUPERADMIN or self.is_superuser

    @property
    def is_owner(self):
        return self.role == self.Role.OWNER

    @property
    def is_employee(self):
        return self.role == self.Role.EMPLOYEE
