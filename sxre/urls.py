from django.urls import path, include
from core import views

urlpatterns = [
    path('api/mc/', include('core.mc_api')),
    path("", views.index, name="index"),
    path("glass", views.glass, name="glass"),
    path("api/", include("core.urls")),
    path("mc", views.mc, name="mc"),
    path("mc/", views.mc, name="mc")
]
