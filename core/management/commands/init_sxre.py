from django.core.management.base import BaseCommand
from core.models import Account, Group, Member, Role

GROUPS = [
    ("core", "核心创始组", 0),
    ("dev", "开发工程师组", 1),
    ("design", "视觉设计组", 2),
    ("test", "测试适配组", 3),
    ("new", "新加入成员", 4),
]

DEFAULT_MEMBERS = [
    ("core", "SX", "SX", "系统架构师",
     "SXRE工作室发起者，8年安卓底层开发经验，项目总负责人。",
     "https://qm.qq.com/cgi-bin/qm/qr?k=xxx", "https://www.coolapk.com/u/xxx"),
    ("core", "RE", "RE", "内核开发专家",
     "深耕Linux内核，精通C/C++，负责全机型底层适配。",
     "https://qm.qq.com/cgi-bin/qm/qr?k=xxx", "https://www.coolapk.com/u/xxx"),
    ("core", "AI", "AI工程师", "智能模块研发",
     "精通Python与机器学习，主导AI Root模块开发。",
     "https://qm.qq.com/cgi-bin/qm/qr?k=xxx", "https://www.coolapk.com/u/xxx"),
    ("core", "UI", "视觉设计师", "美学体验打造",
     "多年安卓UI设计经验，负责全产品线视觉体系。",
     "https://qm.qq.com/cgi-bin/qm/qr?k=xxx", "https://www.coolapk.com/u/xxx"),
    ("core", "QA", "测试工程师", "全设备适配验证",
     "上百台安卓设备测试经验，保障产品全机型稳定运行。",
     "https://qm.qq.com/cgi-bin/qm/qr?k=xxx", "https://www.coolapk.com/u/xxx"),
]


class Command(BaseCommand):
    help = "初始化 SXRE 项目：默认超管、分组、示例成员"

    def handle(self, *args, **options):
        if not Account.objects.filter(role=Role.SUPER).exists():
            a = Account(username="admin", role=Role.SUPER)
            a.set_password("sxre-demo-2026")
            a.save()
            self.stdout.write(self.style.SUCCESS(
                "已创建超级管理员: admin / sxre-demo-2026"
            ))
        else:
            self.stdout.write("超级管理员已存在，跳过")

        for key, title, order in GROUPS:
            Group.objects.get_or_create(
                key=key, defaults={"title": title, "order": order}
            )

        if Member.objects.count() == 0:
            for i, (gk, avatar, name, role, desc, qq, cool) in enumerate(DEFAULT_MEMBERS):
                g = Group.objects.get(key=gk)
                Member.objects.create(
                    group=g, avatar=avatar, name=name, role=role,
                    desc=desc, qq=qq, coolapk=cool, order=i,
                )
            self.stdout.write("示例成员已导入")

        self.stdout.write(self.style.SUCCESS("初始化完成"))
