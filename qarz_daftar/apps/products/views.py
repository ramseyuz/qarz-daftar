from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view

from core.mixins import BusinessScopedMixin, SoftDeleteMixin
from .models import Product
from .serializers import ProductSerializer


@extend_schema_view(
    list=extend_schema(summary="List products", tags=["Products"]),
    create=extend_schema(summary="Create product", tags=["Products"]),
    retrieve=extend_schema(summary="Get product", tags=["Products"]),
    update=extend_schema(summary="Update product", tags=["Products"]),
    partial_update=extend_schema(summary="Patch product", tags=["Products"]),
    destroy=extend_schema(summary="Delete product", tags=["Products"]),
)
class ProductViewSet(SoftDeleteMixin, BusinessScopedMixin, viewsets.ModelViewSet):
    queryset = Product.objects.select_related("business").all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "price", "created_at"]
    ordering = ["name"]
