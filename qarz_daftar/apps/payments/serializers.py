from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="debt.customer.full_name", read_only=True)
    business_name = serializers.CharField(source="debt.business.name", read_only=True)
    debt_total    = serializers.DecimalField(
        source="debt.total_amount", max_digits=15, decimal_places=2, read_only=True
    )

    class Meta:
        model = Payment
        fields = [
            "id", "debt", "customer_name", "business_name", "debt_total",
            "amount", "payment_method", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        debt = attrs.get("debt") or getattr(self.instance, "debt", None)
        amount = attrs.get("amount")
        if debt and amount:
            existing_paid = debt.paid_amount
            # If updating, subtract current payment
            if self.instance:
                existing_paid -= self.instance.amount
            if existing_paid + amount > debt.total_amount:
                raise serializers.ValidationError(
                    {"amount": f"Total payments would exceed debt total ({debt.total_amount})."}
                )
        return attrs

    def validate_debt(self, debt):
        request = self.context.get("request")
        if request and not request.user.is_superuser:
            if debt.business != request.user.business:
                raise serializers.ValidationError("Debt does not belong to your business.")
        return debt
