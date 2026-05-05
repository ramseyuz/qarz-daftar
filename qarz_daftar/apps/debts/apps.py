from django.apps import AppConfig


class DebtsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.debts"
    verbose_name = "Debts"

    def ready(self):
        import apps.debts.signals  # noqa: F401
