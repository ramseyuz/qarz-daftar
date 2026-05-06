"""
All API v1 routes wired up in one place.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.accounts.views import (
    RegisterView,
    LoginView,
    LogoutView,
    TokenRefreshView,
    ProfileView,
    UsersViewSet,
)
from apps.businesses.views import BusinessViewSet
from apps.customers.views import CustomerViewSet
from apps.debts.views import DebtViewSet, DebtItemViewSet
from apps.payments.views import PaymentViewSet
from apps.debts.views import DebtReportView

router = DefaultRouter()
router.register(r"users",      UsersViewSet,   basename="user")
router.register(r"businesses", BusinessViewSet, basename="business")
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"debts", DebtViewSet, basename="debt")
router.register(r"debt-items", DebtItemViewSet, basename="debt-item")
router.register(r"payments", PaymentViewSet, basename="payment")

urlpatterns = [
    # ── Auth ───────────────────────────────────
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/profile/", ProfileView.as_view(), name="auth-profile"),

    # ── Reports ─────────────────────────────────
    path("reports/debts/", DebtReportView.as_view(), name="debt-report"),

    # ── Router ──────────────────────────────────
    path("", include(router.urls)),
]
