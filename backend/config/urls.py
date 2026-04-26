from django.contrib import admin
from django.urls import include, path

from config.views import health_check


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/auth/", include("accounts.urls")),
    path("api/learning/", include("learning.urls")),
]