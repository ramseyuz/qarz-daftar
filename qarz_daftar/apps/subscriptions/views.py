from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from core.permissions import IsSuperAdmin
from .models import SubscriptionPlan, Subscription
from .serializers import SubscriptionPlanSerializer, SubscriptionSerializer


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset           = SubscriptionPlan.objects.all()
    serializer_class   = SubscriptionPlanSerializer
    permission_classes = [IsSuperAdmin]


class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.select_related("business", "plan").all()
    serializer_class   = SubscriptionSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ["business", "is_active"]
