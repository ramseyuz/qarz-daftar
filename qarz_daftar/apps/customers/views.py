from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view

from core.mixins import BusinessScopedMixin, SoftDeleteMixin
from core.permissions import BelongsToUserBusiness
from .models import Customer
from .serializers import CustomerSerializer


@extend_schema_view(
    list=extend_schema(summary="List customers", tags=["Customers"]),
    create=extend_schema(summary="Create customer", tags=["Customers"]),
    retrieve=extend_schema(summary="Get customer", tags=["Customers"]),
    update=extend_schema(summary="Update customer", tags=["Customers"]),
    partial_update=extend_schema(summary="Patch customer", tags=["Customers"]),
    destroy=extend_schema(summary="Delete customer", tags=["Customers"]),
)
class CustomerViewSet(SoftDeleteMixin, BusinessScopedMixin, viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("business").all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated, BelongsToUserBusiness]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["full_name", "phone", "address"]
    ordering_fields = ["full_name", "created_at"]
    ordering = ["full_name"]
