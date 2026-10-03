from django.urls import path
from . import views

urlpatterns = [
    path("session", views.session_view),
    path("login", views.login_view),
    path("register", views.register_view),
    path("logout", views.logout_view),
    path("change-password", views.change_password),

    # 核心创始组（账号驱动）
    path("team", views.team_collection),
    path("team/manage", views.team_manage_collection),
    path("team/<int:account_id>", views.team_member_detail),

    # 其他分组成员
    path("members", views.members_collection),
    path("members/<int:member_id>", views.member_detail),

    path("groups", views.groups_collection),
    path("groups/<str:key>", views.group_detail),

    path("server/exec", views.server_exec),
    path("server/audit", views.audit_list),

    path("accounts", views.accounts_collection),
    path("accounts/<int:account_id>", views.account_detail),
]
