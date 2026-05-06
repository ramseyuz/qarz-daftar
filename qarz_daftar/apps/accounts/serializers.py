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
    business_name = serializers.CharField(source="business.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "phone", "role", "business", "business_name", "avatar", "created_at",
        ]
        read_only_fields = ["id", "email", "role", "business", "created_at"]


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


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        return attrs
