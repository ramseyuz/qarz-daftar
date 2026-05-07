from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source="business.name", read_only=True)

    class Meta:
        model = Product
        fields = ["id", "business", "business_name", "name", "description", "price", "unit", "is_active", "created_at"]
        read_only_fields = ["id", "business", "created_at"]

    def create(self, validated_data):
        validated_data["business"] = self.context["request"].user.business
        return super().create(validated_data)
