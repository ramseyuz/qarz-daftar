from rest_framework import serializers
from .models import Business


class BusinessSerializer(serializers.ModelSerializer):
    total_debt_amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    total_remaining_amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )

    class Meta:
        model = Business
        fields = [
            "id", "name", "phone", "address", "description",
            "logo", "is_active", "total_debt_amount",
            "total_remaining_amount", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


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
