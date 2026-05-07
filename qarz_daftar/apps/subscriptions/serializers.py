from datetime import timedelta
from rest_framework import serializers
from .models import SubscriptionPlan, Subscription


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SubscriptionPlan
        fields = [
            "id", "name", "price", "duration_days",
            "max_users", "max_customers", "max_debts",
            "description", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name     = serializers.CharField(source="plan.name",     read_only=True)
    business_name = serializers.CharField(source="business.name", read_only=True)
    is_expired    = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Subscription
        fields = [
            "id", "business", "business_name", "plan", "plan_name",
            "start_date", "end_date", "is_active", "is_expired",
            "days_remaining", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        # Auto-compute end_date from start_date + plan.duration_days if not given
        if "end_date" not in attrs and "plan" in attrs and "start_date" in attrs:
            attrs["end_date"] = attrs["start_date"] + timedelta(days=attrs["plan"].duration_days)
        if attrs.get("end_date") and attrs.get("start_date"):
            if attrs["end_date"] < attrs["start_date"]:
                raise serializers.ValidationError({"end_date": "end_date must be after start_date."})
        return attrs
