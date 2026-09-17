from django.apps import AppConfig


class GammesMaintenanceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "gammes_maintenance"

    def ready(self):
        import gammes_maintenance.signals  # noqa: F401