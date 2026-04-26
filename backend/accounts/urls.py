from django.urls import path

from accounts.views import login_view, me_view, register_view


urlpatterns = [
    path("register/", register_view),
    path("login/", login_view),
    path("me/", me_view),
]