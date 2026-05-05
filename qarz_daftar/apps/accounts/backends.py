from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class UsernameOrEmailBackend(ModelBackend):
    """Allow login with either username or email."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        # SimpleJWT passes email as the USERNAME_FIELD key, not 'username'
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        if username is None or password is None:
            return None

        # Try username first, then email
        user = (
            User.objects.filter(username=username).first()
            or User.objects.filter(email=username).first()
        )
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
