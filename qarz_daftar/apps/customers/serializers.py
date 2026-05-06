from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    total_debt      = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_remaining = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    business_name   = serializers.CharField(source="business.name", read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id", "business", "business_name", "full_name", "phone", "address",
            "notes", "is_active", "total_debt", "total_remaining", "created_at",
        ]
        read_only_fields = ["id", "business", "created_at"]

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["business"] = request.user.business
        return super().create(validated_data)
