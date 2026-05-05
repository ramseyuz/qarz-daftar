from .base import *  # noqa

DEBUG = True

# Allow browsable API in development
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] += [  # noqa: F405
    "rest_framework.renderers.BrowsableAPIRenderer",
]

# Show emails in console
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Django debug toolbar (optional — install separately)
# INSTALLED_APPS += ["debug_toolbar"]
# MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]
# INTERNAL_IPS = ["127.0.0.1"]
