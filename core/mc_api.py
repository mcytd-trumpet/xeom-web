import json, time
import redis
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.urls import path

_r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)
ROOM_PREFIX = "mc_room:"
ROOM_TTL = 3600


def rooms_list(request):
    rooms = []
    try:
        for key in _r.scan_iter(ROOM_PREFIX + "*"):
            data = _r.get(key)
            if data:
                try:
                    rooms.append(json.loads(data))
                except Exception:
                    pass
    except Exception as e:
        return JsonResponse({"rooms": [], "error": str(e)})
    rooms.sort(key=lambda x: x.get("time", 0), reverse=True)
    return JsonResponse({"rooms": rooms})


@csrf_exempt
def room_register(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "bad json"}, status=400)
    code = str(data.get("code", "")).upper()
    host = str(data.get("host", "Player"))[:16]
    if not code or len(code) < 4 or len(code) > 8:
        return JsonResponse({"error": "bad code"}, status=400)
    info = {"code": code, "host": host, "time": int(time.time()), "players": 1}
    _r.setex(ROOM_PREFIX + code, ROOM_TTL, json.dumps(info))
    return JsonResponse({"ok": True, "room": info})


@csrf_exempt
def room_unregister(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "bad json"}, status=400)
    code = str(data.get("code", "")).upper()
    if code:
        try:
            _r.delete(ROOM_PREFIX + code)
        except Exception:
            pass
    return JsonResponse({"ok": True})


urlpatterns = [
    path("rooms/", rooms_list),
    path("rooms/register/", room_register),
    path("rooms/unregister/", room_unregister),
]
