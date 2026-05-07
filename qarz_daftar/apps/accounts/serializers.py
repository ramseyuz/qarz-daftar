from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm password")

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "phone", "role", "password", "password2",
        ]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    business_name      = serializers.CharField(source="business.name", read_only=True)
    subscription_valid = serializers.SerializerMethodField()
    subscription_end   = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "phone", "role", "business", "business_name", "avatar",
            "subscription_valid", "subscription_end", "created_at",
        ]
        read_only_fields = ["id", "email", "role", "business", "created_at",
                            "subscription_valid", "subscription_end"]

    def get_subscription_valid(self, obj):
        if obj.is_superadmin or not obj.business:
            return True
        return obj.business.subscription_is_valid

    def get_subscription_end(self, obj):
        if obj.is_superadmin or not obj.business:
            return None
        sub = obj.business.current_subscription
        return sub.end_date.isoformat() if sub else None


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login with username + password. Extends JWT payload with role and business info."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Replace the default email field with a username field
        self.fields.pop(User.USERNAME_FIELD, None)
        self.fields["username"] = serializers.CharField()

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        token["business_id"] = str(user.business_id) if user.business_id else None
        return token

    def validate(self, attrs):
        # Look up user by username, swap in their email so the parent can authenticate
        username = attrs.pop("username", None)
        try:
            user = User.objects.get(username=username)
            attrs[User.USERNAME_FIELD] = user.email
        except User.DoesNotExist:
            attrs[User.USERNAME_FIELD] = username  # let parent raise the auth error
        data = super().validate(attrs)
        data["user"] = {
            "id": str(self.user.id),
            "email": self.user.email,
            "full_name": self.user.get_full_name(),
            "role": self.user.role,
            "business_id": str(self.user.business_id) if self.user.business_id else None,
            "avatar": self.user.avatar.url if self.user.avatar else None,
        }
        return data


class UserAdminSerializer(serializers.ModelSerializer):
    """Read/update serializer for superadmin user management."""
    business_name = serializers.CharField(source="business.name", read_only=True)
    new_password  = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "phone", "role", "is_active", "is_superuser",
            "business", "business_name", "date_joined", "new_password",
        ]
        read_only_fields = ["id", "date_joined"]

    def update(self, instance, validated_data):
        new_password = validated_data.pop("new_password", None)
        instance = super().update(instance, validated_data)
        if new_password:
            instance.set_password(new_password)
            instance.save(update_fields=["password"])
        return instance


class UserAdminCreateSerializer(serializers.ModelSerializer):
    """Create-only serializer for superadmin — sets password."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            "email", "username", "first_name", "last_name",
            "phone", "role", "is_active", "is_superuser",
            "business", "password",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class OwnerEmployeeSerializer(serializers.ModelSerializer):
    """Owner views/updates employees in their own business."""
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "phone", "is_active", "date_joined", "new_password",
        ]
        read_only_fields = ["id", "email", "username", "date_joined"]

    def update(self, instance, validated_data):
        new_password = validated_data.pop("new_password", None)
        instance = super().update(instance, validated_data)
        if new_password:
            instance.set_password(new_password)
            instance.save(update_fields=["password"])
        return instance


class OwnerEmployeeCreateSerializer(serializers.ModelSerializer):
    """Owner creates employees for their own business, subject to max_users limit."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["email", "username", "first_name", "last_name", "phone", "password"]

    def validate(self, attrs):
        owner = self.context["request"].user
        business = owner.business
        if business:
            current_count = User.objects.filter(
                business=business, role=User.Role.EMPLOYEE, is_active=True
            ).count()
            if current_count >= business.max_users:
                raise serializers.ValidationError(
                    f"Employee limit reached ({business.max_users}). "
                    "Ask your administrator to increase the limit."
                )
        return attrs

    def create(self, validated_data):
        owner = self.context["request"].user
        password = validated_data.pop("password")
        user = User(role=User.Role.EMPLOYEE, business=owner.business, **validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        return attrs
