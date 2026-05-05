from rest_framework import viewsets, permissions
from drf_spectacular.utils import extend_schema, extend_schema_view

from core.mixins import BusinessScopedMixin
from core.permissions import IsSuperAdmin, IsBusinessOwner
from .models import Business
from .serializers import BusinessSerializer, BusinessCreateSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List businesses",
        description="Super admins see all; owners see only their own.",
        tags=["Business"],
    ),
    create=extend_schema(
        summary="Create a business",
        description="Creates a new business and binds the requesting user to it.",
        tags=["Business"],
    ),
    retrieve=extend_schema(summary="Retrieve a business", tags=["Business"]),
    update=extend_schema(summary="Update a business (full)", tags=["Business"]),
    partial_update=extend_schema(summary="Update a business (partial)", tags=["Business"]),
    destroy=extend_schema(summary="Soft-delete a business", tags=["Business"]),
)
class BusinessViewSet(BusinessScopedMixin, viewsets.ModelViewSet):
    queryset = Business.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return BusinessCreateSerializer
        return BusinessSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Business.objects.all()
        if user.business:
            return Business.objects.filter(id=user.business_id)
        return Business.objects.none()

    def get_permissions(self):
        if self.action in ["create"]:
            return [permissions.IsAuthenticated()]
        if self.action in ["destroy"]:
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]
