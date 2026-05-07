from django.utils import timezone
from rest_framework import serializers
from .models import Business


class BusinessSerializer(serializers.ModelSerializer):
    total_debt_amount      = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_remaining_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    user_count             = serializers.SerializerMethodField()
    customer_count         = serializers.SerializerMethodField()
    subscription           = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            "id", "name", "phone", "address", "description",
            "logo", "is_active", "max_users", "user_count", "customer_count",
            "total_debt_amount", "total_remaining_amount",
            "subscription", "created_at",
        ]
        read_only_fields = ["id", "created_at", "user_count", "customer_count", "subscription"]

    def get_user_count(self, obj):
        return obj.users.filter(role="employee", is_active=True).count()

    def get_customer_count(self, obj):
        return obj.customers.filter(is_deleted=False).count()

    def get_subscription(self, obj):
        today = timezone.now().date()
        sub = obj.subscriptions.filter(is_active=True).order_by("-end_date").first()
        if not sub:
            return None
        return {
            "id":             str(sub.id),
            "plan_name":      sub.plan.name,
            "end_date":       sub.end_date.isoformat(),
            "is_valid":       sub.end_date >= today,
            "days_remaining": max(0, (sub.end_date - today).days),
            "max_users":      sub.plan.max_users,
            "max_customers":  sub.plan.max_customers,
            "max_debts":      sub.plan.max_debts,
        }


class BusinessCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ["name", "phone", "address", "description", "logo"]

    def create(self, validated_data):
        business = Business.objects.create(**validated_data)
        # Bind the creating user to this business
        request = self.context.get("request")
        if request and request.user:
            request.user.business = business
            request.user.save(update_fields=["business"])
        return business
