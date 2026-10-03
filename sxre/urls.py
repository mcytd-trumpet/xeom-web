from django.urls import path, include
from core import views

urlpatterns = [
    path("", views.index, name="index"),
    path("glass", views.glass, name="glass"),
    path("api/", include("core.urls")),
    path("mc", views.mc, name="mc"),
]
