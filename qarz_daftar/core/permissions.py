from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSuperAdmin(BasePermission):
    """Only super-admin users (is_staff + is_superuser)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsBusinessOwner(BasePermission):
    """User must be authenticated and have role=OWNER."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("owner", "superadmin")
        )


class IsOwnerOrReadOnly(BasePermission):
    """Object-level: only the business owner can write; others can read."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # obj must expose `.business` or `.owner` attribute
        business = getattr(obj, "business", None) or getattr(obj, "owner", None)
        if business is None:
            return False
        return business == request.user.business


class BelongsToUserBusiness(BasePermission):
    """
    Ensures the object belongs to the requesting user's business.
    Works for any model with a `business` FK.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        business = getattr(obj, "business", None)
        if business is None:
            # For Payment → debt.business, Customer → business
            debt = getattr(obj, "debt", None)
            if debt:
                business = getattr(debt, "business", None)
        return business == request.user.business
