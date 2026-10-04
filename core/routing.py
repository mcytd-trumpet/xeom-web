from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/mc/(?P<room_code>[A-Z0-9]{4,8})/$', consumers.MCGameConsumer.as_asgi()),
]
