import json
import subprocess
from functools import wraps
from pathlib import Path
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Q

from .models import Account, Group, Member, Role, ROLE_LEVEL, AuditLog


def _body(request):
    try:
        return json.loads(request.body or b"{}")
    except Exception:
        return {}


def current_account(request):
    uid = request.session.get("uid")
    if not uid:
        return None
    return Account.objects.filter(id=uid, is_active=True).first()


def require(min_level):
    def deco(view):
        @wraps(view)
        def wrap(request, *args, **kwargs):
            acc = current_account(request)
            if not acc:
                return JsonResponse({"error": "未登录"}, status=401)
            if acc.level < min_level:
                return JsonResponse({"error": "权限不足"}, status=403)
            request.account = acc
            return view(request, *args, **kwargs)
        return wrap
    return deco


def glass(request):
    html = (Path(settings.BASE_DIR) / "public" / "glass.html").read_bytes()
    return HttpResponse(html, content_type="text/html; charset=utf-8")


def index(request):
    html = (Path(settings.BASE_DIR) / "public" / "index.html").read_bytes()
    return HttpResponse(html, content_type="text/html; charset=utf-8")

def mc(request):
    html = (Path(settings.BASE_DIR) / "public" / "mc.html").read_bytes()
    return HttpResponse(html, content_type="text/html; charset=utf-8")


# ---------- session ----------
@require_http_methods(["GET"])
def session_view(request):
    acc = current_account(request)
    if not acc:
        return JsonResponse({"loggedIn": False})
    return JsonResponse({
        "loggedIn": True,
        "username": acc.username,
        "display_name": acc.display_name or acc.username,
        "role": acc.role,
        "level": acc.level,
        "isSuper": acc.role == Role.SUPER,
        "canManageContent": acc.level >= ROLE_LEVEL["sub"],
        "canManageGroup": acc.level >= ROLE_LEVEL["operator"],
    })


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    d = _body(request)
    u = (d.get("username") or "").strip()
    p = (d.get("password") or "").strip()
    if not u or not p:
        return JsonResponse({"error": "请输入账号和密码"}, status=400)
    acc = Account.objects.filter(username=u, is_active=True).first()
    if not acc or not acc.check_password(p):
        return JsonResponse({"error": "账号或密码错误"}, status=401)
    request.session["uid"] = acc.id
    request.session.set_expiry(7200)
    return JsonResponse({
        "ok": True,
        "username": acc.username,
        "display_name": acc.display_name or acc.username,
        "role": acc.role,
        "level": acc.level,
        "isSuper": acc.role == Role.SUPER,
        "canManageContent": acc.level >= ROLE_LEVEL["sub"],
        "canManageGroup": acc.level >= ROLE_LEVEL["operator"],
    })


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    request.session.flush()
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["POST"])
def register_view(request):
    d = _body(request)
    u = (d.get("username") or "").strip()
    p = (d.get("password") or "").strip()
    p2 = (d.get("password2") or "").strip()
    if not u or not p:
        return JsonResponse({"error": "请填写用户名和密码"}, status=400)
    if len(u) < 2 or len(p) < 6:
        return JsonResponse({"error": "用户名至少2位，密码至少6位"}, status=400)
    if p2 and p != p2:
        return JsonResponse({"error": "两次输入的密码不一致"}, status=400)
    if Account.objects.filter(username=u).exists():
        return JsonResponse({"error": "该用户名已被占用"}, status=400)

    acc = Account(
        username=u,
        role=Role.VIEWER,
        show_in_team=False,
        helper_flag=0,
    )
    acc.set_password(p)
    acc.save()

    request.session["uid"] = acc.id
    request.session.set_expiry(7200)
    return JsonResponse({
        "ok": True,
        "username": acc.username,
        "display_name": acc.display_name or acc.username,
        "role": acc.role,
        "level": acc.level,
        "isSuper": False,
        "canManageContent": False,
        "canManageGroup": False,
    })


@csrf_exempt
@require_http_methods(["POST"])
def change_password(request):
    acc = current_account(request)
    if not acc:
        return JsonResponse({"error": "未登录"}, status=401)
    d = _body(request)
    old = (d.get("oldPassword") or "").strip()
    new = (d.get("newPassword") or "").strip()
    if not old or not new:
        return JsonResponse({"error": "请填写完整"}, status=400)
    if len(new) < 6:
        return JsonResponse({"error": "新密码至少6位"}, status=400)
    if not acc.check_password(old):
        return JsonResponse({"error": "原密码错误"}, status=401)
    acc.set_password(new)
    acc.save(update_fields=["password_hash"])
    return JsonResponse({"ok": True})


# ---------- 序列化 ----------
def _serialize_groups():
    return [
        {
            "key": g.key,
            "title": g.title,
            "members": [m.to_dict() for m in g.members.all()],
        }
        for g in Group.objects.all()
    ]


def _serialize_team():
    # show_in_team=True 或 helper_flag=1 都会出现在核心创始组
    qs = (Account.objects
          .filter(is_active=True)
          .filter(Q(show_in_team=True) | Q(helper_flag=1))
          .order_by("team_order", "id"))
    return [a.to_team_dict() for a in qs]


# ---------- 核心创始组（账号驱动） ----------
@require_http_methods(["GET"])
def team_collection(request):
    return JsonResponse({"members": _serialize_team()})


@require_http_methods(["GET"])
@require(ROLE_LEVEL["operator"])
def team_manage_collection(request):
    qs = Account.objects.all().order_by("-show_in_team", "team_order", "id")
    return JsonResponse({"members": [a.to_team_dict() for a in qs]})


@csrf_exempt
@require_http_methods(["PATCH"])
@require(ROLE_LEVEL["operator"])
def team_member_detail(request, account_id):
    acc = Account.objects.filter(id=account_id).first()
    if not acc:
        return JsonResponse({"error": "账号不存在"}, status=404)
    d = _body(request)
    if "display_name" in d:
        acc.display_name = (d["display_name"] or "").strip()[:64]
    if "title" in d:
        acc.title = (d["title"] or "").strip()[:64]
    if "bio" in d:
        acc.bio = (d["bio"] or "").strip()
    if "avatar" in d:
        acc.avatar = (d["avatar"] or "").strip()[:3]
    if "qq" in d:
        acc.qq = (d["qq"] or "").strip()[:255]
    if "coolapk" in d:
        acc.coolapk = (d["coolapk"] or "").strip()[:255]
    if "show_in_team" in d:
        acc.show_in_team = bool(d["show_in_team"])
    if "helper_flag" in d:
        try:
            acc.helper_flag = int(d["helper_flag"])
        except (TypeError, ValueError):
            acc.helper_flag = 0
    if "team_order" in d:
        try:
            acc.team_order = int(d["team_order"])
        except (TypeError, ValueError):
            pass
    acc.save()
    return JsonResponse({"ok": True, "members": _serialize_team()})


# ---------- 成员（其他分组） ----------
@csrf_exempt
@require_http_methods(["GET", "POST"])
def members_collection(request):
    if request.method == "GET":
        return JsonResponse({"groups": _serialize_groups()})

    acc = current_account(request)
    if not acc:
        return JsonResponse({"error": "未登录"}, status=401)
    if acc.level < ROLE_LEVEL["sub"]:
        return JsonResponse({"error": "权限不足"}, status=403)

    d = _body(request)
    avatar = (d.get("avatar") or "").strip()[:3]
    name = (d.get("name") or "").strip()
    role = (d.get("role") or "").strip()
    group_key = (d.get("group") or "").strip()
    desc = (d.get("desc") or "").strip()
    qq = (d.get("qq") or "").strip()
    coolapk = (d.get("coolapk") or "").strip()

    if not all([avatar, name, role, group_key, desc, qq, coolapk]):
        return JsonResponse({"error": "请填写完整的成员信息"}, status=400)

    g = Group.objects.filter(key=group_key).first()
    if not g:
        return JsonResponse({"error": "分组不存在"}, status=400)

    Member.objects.create(
        avatar=avatar, name=name, role=role,
        group=g, desc=desc, qq=qq, coolapk=coolapk,
    )
    return JsonResponse({"ok": True, "groups": _serialize_groups()})


@csrf_exempt
@require_http_methods(["DELETE"])
@require(ROLE_LEVEL["sub"])
def member_detail(request, member_id):
    m = Member.objects.filter(id=member_id).first()
    if not m:
        return JsonResponse({"error": "成员不存在"}, status=404)
    m.delete()
    return JsonResponse({"ok": True, "groups": _serialize_groups()})


# ---------- 分组 ----------
@require_http_methods(["GET"])
def groups_collection(request):
    return JsonResponse({"groups": _serialize_groups()})


@csrf_exempt
@require_http_methods(["PUT"])
@require(ROLE_LEVEL["operator"])
def group_detail(request, key):
    g = Group.objects.filter(key=key).first()
    if not g:
        return JsonResponse({"error": "分组不存在"}, status=404)
    d = _body(request)
    title = (d.get("title") or "").strip()
    if not title:
        return JsonResponse({"error": "标题不能为空"}, status=400)
    g.title = title
    g.save(update_fields=["title"])
    return JsonResponse({"ok": True, "groups": _serialize_groups()})


# ---------- 账号（仅超管） ----------
@csrf_exempt
@require_http_methods(["GET", "POST"])
@require(ROLE_LEVEL["super"])
def accounts_collection(request):
    if request.method == "GET":
        return JsonResponse({
            "accounts": [
                {**a.to_dict(), "is_active": a.is_active}
                for a in Account.objects.all().order_by("role", "id")
            ],
            "roles": [{"value": r.value, "label": r.label} for r in Role],
        })

    d = _body(request)
    u = (d.get("username") or "").strip()
    p = (d.get("password") or "").strip()
    role = (d.get("role") or "").strip()
    if not u or not p or role not in Role.values:
        return JsonResponse({"error": "请填写完整，角色需合法"}, status=400)
    if len(u) < 2 or len(p) < 6:
        return JsonResponse({"error": "用户名至少2位，密码至少6位"}, status=400)
    if Account.objects.filter(username=u).exists():
        return JsonResponse({"error": "该用户名已存在"}, status=400)
    acc = Account(username=u, role=role)
    acc.set_password(p)
    acc.save()
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["DELETE", "PATCH"])
@require(ROLE_LEVEL["super"])
def account_detail(request, account_id):
    acc = Account.objects.filter(id=account_id).first()
    if not acc:
        return JsonResponse({"error": "账号不存在"}, status=404)
    if acc.id == request.account.id:
        return JsonResponse({"error": "不能操作自己"}, status=400)
    if request.method == "DELETE":
        acc.delete()
        return JsonResponse({"ok": True})
    d = _body(request)
    if "role" in d:
        if d["role"] not in Role.values:
            return JsonResponse({"error": "非法角色"}, status=400)
        acc.role = d["role"]
    if "is_active" in d:
        acc.is_active = bool(d["is_active"])
    if d.get("password"):
        if len(d["password"]) < 6:
            return JsonResponse({"error": "密码至少6位"}, status=400)
        acc.set_password(d["password"])
    acc.save()
    return JsonResponse({"ok": True})


# ---------- 服务器控制台 ----------
@csrf_exempt
@require_http_methods(["POST"])
@require(ROLE_LEVEL["operator"])
def server_exec(request):
    d = _body(request)
    cmd = (d.get("command") or "").strip()
    password = (d.get("password") or "").strip()
    if not cmd:
        return JsonResponse({"error": "命令不能为空"}, status=400)
    if not request.account.check_password(password):
        return JsonResponse({"error": "二次密码验证失败"}, status=401)
    if len(cmd) > 4000:
        return JsonResponse({"error": "命令过长"}, status=400)

    whitelist = getattr(settings, "SERVER_EXEC_WHITELIST", None)
    if whitelist:
        first = cmd.split()[0] if cmd.split() else ""
        if first not in whitelist:
            return JsonResponse(
                {"error": f"命令 {first} 不在白名单内"},
                status=403,
            )

    timeout = getattr(settings, "SERVER_EXEC_TIMEOUT", 30)
    limit = getattr(settings, "SERVER_EXEC_OUTPUT_LIMIT", 20000)

    try:
        r = subprocess.run(
            cmd, shell=True, capture_output=True, text=True,
            timeout=timeout, cwd=str(Path(settings.BASE_DIR)),
        )
        out, err, code = r.stdout, r.stderr, r.returncode
    except subprocess.TimeoutExpired:
        out, err, code = "", f"执行超时（>{timeout}s）", 124
    except Exception as e:
        out, err, code = "", str(e), 1

    AuditLog.objects.create(
        account=request.account,
        username=request.account.username,
        command=cmd,
        exit_code=code,
    )
    return JsonResponse({
        "ok": True,
        "stdout": out[-limit:],
        "stderr": err[-limit:],
        "exit_code": code,
    })


@require_http_methods(["GET"])
@require(ROLE_LEVEL["operator"])
def audit_list(request):
    qs = AuditLog.objects.all()[:100]
    return JsonResponse({
        "logs": [
            {
                "id": x.id,
                "username": x.username,
                "command": x.command,
                "exit_code": x.exit_code,
                "created_at": x.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for x in qs
        ]
    })
