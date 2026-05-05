"""
Reusable ViewSet mixins for multi-tenant data isolation.
"""


class BusinessScopedMixin:
    """
    Automatically filters querysets so each business only sees its own data.

    Subclass must set `business_field` (default: "business") which is the
    lookup path from the model to the Business FK.
    """

    business_field: str = "business"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        if not hasattr(user, "business") or user.business is None:
            return qs.none()
        return qs.filter(**{self.business_field: user.business})


class SoftDeleteMixin:
    """
    Overrides `destroy` to soft-delete (set is_deleted=True) instead of
    physically removing the row.
    """

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted"])
