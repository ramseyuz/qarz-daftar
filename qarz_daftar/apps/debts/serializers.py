from rest_framework import serializers
from .models import Debt, DebtItem
from apps.customers.serializers import CustomerSerializer
from apps.payments.models import Payment


class DebtItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebtItem
        fields = ["id", "product", "name", "quantity", "unit_price", "total_price"]
        read_only_fields = ["id", "total_price"]


class PaymentInlineSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.payments.models import Payment
        model = Payment
        fields = ["id", "amount", "payment_method", "created_at"]


class DebtSerializer(serializers.ModelSerializer):
    customer_detail = CustomerSerializer(source="customer", read_only=True)
    items = DebtItemSerializer(many=True, read_only=True)
    payments = PaymentInlineSerializer(many=True, read_only=True)

    class Meta:
        model = Debt
        fields = [
            "id", "customer", "customer_detail", "business",
            "description", "total_amount", "paid_amount",
            "remaining_amount", "status", "due_date",
            "items", "payments", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "business", "paid_amount",
            "remaining_amount", "status", "created_at", "updated_at",
        ]

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["business"] = request.user.business
        return super().create(validated_data)

    def validate_customer(self, customer):
        request = self.context["request"]
        if not request.user.is_superuser:
            if customer.business != request.user.business:
                raise serializers.ValidationError(
                    "Customer does not belong to your business."
                )
        return customer


class DebtCreateWithItemsSerializer(serializers.ModelSerializer):
    """Create a debt together with its line items in one request."""

    items = DebtItemSerializer(many=True, required=False)

    class Meta:
        model = Debt
        fields = [
            "id", "customer", "description",
            "total_amount", "due_date", "items",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        request = self.context["request"]
        validated_data["business"] = request.user.business
        debt = Debt.objects.create(**validated_data)
        for item_data in items_data:
            DebtItem.objects.create(debt=debt, **item_data)
        return debt
