from django.contrib.auth import get_user_model
from rest_framework import generics, status, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView as BaseTokenRefreshView,
)
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, extend_schema_view

from core.permissions import IsSuperAdmin, IsBusinessOwner
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserAdminSerializer,
    UserAdminCreateSerializer,
    OwnerEmployeeSerializer,
    OwnerEmployeeCreateSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


@extend_schema(tags=["Auth"])
class RegisterView(generics.CreateAPIView):
    """Register a new Business Owner account."""

    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Auto-generate tokens on registration
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "status": "success",
                "message": "Registration successful.",
                "data": UserProfileSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Auth"])
class LoginView(TokenObtainPairView):
    """Obtain JWT access + refresh tokens."""

    serializer_class = CustomTokenObtainPairSerializer


@extend_schema(tags=["Auth"])
class TokenRefreshView(BaseTokenRefreshView):
    """Refresh the access token using a valid refresh token."""
    pass


@extend_schema(tags=["Auth"])
class LogoutView(APIView):
    """Blacklist the refresh token to log out."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"status": "success", "message": "Logged out successfully."})
        except Exception:
            return Response(
                {"status": "error", "message": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


@extend_schema(tags=["Auth"])
class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated user's profile."""

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


@extend_schema(tags=["Auth"])
class ChangePasswordView(APIView):
    """Change the authenticated user's password."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"status": "error", "message": "Old password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"status": "success", "message": "Password changed successfully."})


@extend_schema_view(
    list=extend_schema(summary="List all users", tags=["Users"]),
    create=extend_schema(summary="Create user", tags=["Users"]),
    retrieve=extend_schema(summary="Get user", tags=["Users"]),
    update=extend_schema(summary="Update user", tags=["Users"]),
    partial_update=extend_schema(summary="Patch user", tags=["Users"]),
    destroy=extend_schema(summary="Delete user", tags=["Users"]),
)
class UsersViewSet(viewsets.ModelViewSet):
    """
    Superadmin: full CRUD over all users.
    Owner: CRUD over employees of their own business (subject to max_users limit).
    """

    queryset = User.objects.select_related("business").order_by("-date_joined")

    def get_permissions(self):
        return [IsBusinessOwner()]

    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin:
            return User.objects.select_related("business").order_by("-date_joined")
        if user.is_owner and user.business:
            return User.objects.filter(
                business=user.business, role=User.Role.EMPLOYEE
            ).select_related("business").order_by("-date_joined")
        return User.objects.none()

    def get_serializer_class(self):
        if self.request.user.is_superadmin:
            return UserAdminCreateSerializer if self.action == "create" else UserAdminSerializer
        return OwnerEmployeeCreateSerializer if self.action == "create" else OwnerEmployeeSerializer

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])
