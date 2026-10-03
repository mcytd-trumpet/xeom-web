from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class Role(models.TextChoices):
    SUPER    = "super",    "超级管理员"
    OPERATOR = "operator", "运营者"
    SUB      = "sub",      "子管理员"
    VIEWER   = "viewer",   "普通用户"


ROLE_LEVEL = {"super": 100, "operator": 80, "sub": 50, "viewer": 10}


class Account(models.Model):
    username = models.CharField(max_length=64, unique=True)
    display_name = models.CharField(max_length=64, blank=True, default="")
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.VIEWER)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # ---- 核心创始组展示字段 ----
    title        = models.CharField(max_length=64, blank=True, default="")   # 特殊头衔
    bio          = models.TextField(blank=True, default="")                  # 简介
    avatar       = models.CharField(max_length=8, blank=True, default="")    # 头像缩写
    qq           = models.CharField(max_length=255, blank=True, default="")
    coolapk      = models.CharField(max_length=255, blank=True, default="")
    show_in_team = models.BooleanField(default=False)                        # 是否展示
    helper_flag  = models.IntegerField(default=0)                            # 0=普通, 1=帮助成员(特殊值1才显示)
    team_order   = models.IntegerField(default=0)                            # 排序

    def set_password(self, raw):
        self.password_hash = make_password(raw)

    def check_password(self, raw):
        return check_password(raw, self.password_hash)

    @property
    def level(self):
        return ROLE_LEVEL.get(self.role, 0)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name or self.username,
            "role": self.role,
        }

    def to_team_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name or self.username,
            "avatar": self.avatar or (self.display_name or self.username)[:2],
            "title": self.title,
            "bio": self.bio,
            "qq": self.qq,
            "coolapk": self.coolapk,
            "role": self.role,
            "show_in_team": self.show_in_team,
            "helper_flag": self.helper_flag,
            "team_order": self.team_order,
        }


class Group(models.Model):
    key = models.CharField(max_length=32, unique=True)
    title = models.CharField(max_length=64)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def to_dict(self):
        return {"key": self.key, "title": self.title}


class Member(models.Model):
    avatar = models.CharField(max_length=8)
    name = models.CharField(max_length=64)
    role = models.CharField(max_length=64)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="members")
    desc = models.TextField()
    qq = models.CharField(max_length=255, blank=True, default="")
    coolapk = models.CharField(max_length=255, blank=True, default="")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def to_dict(self):
        return {
            "id": self.id,
            "avatar": self.avatar,
            "name": self.name,
            "role": self.role,
            "desc": self.desc,
            "qq": self.qq,
            "coolapk": self.coolapk,
            "group": self.group.key,
        }


class AuditLog(models.Model):
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True)
    username = models.CharField(max_length=64)
    command = models.TextField()
    exit_code = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]
