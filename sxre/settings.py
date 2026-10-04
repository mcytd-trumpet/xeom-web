from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-only-change-me-in-prod")
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    'daphne',
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "core",
    "channels",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
]

ROOT_URLCONF = "sxre.urls"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR / "public"],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": []},
}]

WSGI_APPLICATION = "sxre.wsgi.application"
ASGI_APPLICATION = "sxre.asgi.application"

# ---- Channels 频道层 ----
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [("127.0.0.1", 6379)]},
    },
}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ---- Redis：Session + 缓存 ----
# 若本机没装 Redis，把 USE_REDIS=0 环境变量设上，自动回退到内存缓存。
USE_REDIS = os.environ.get("USE_REDIS", "1") == "1"
REDIS_URL = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/1")

if USE_REDIS:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        }
    }
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"
else:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
    SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 7200
SESSION_SAVE_EVERY_REQUEST = True

STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "public"]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LANGUAGE_CODE = "zh-hans"
TIME_ZONE = "Asia/Shanghai"
USE_I18N = True
USE_TZ = True


# ---- 服务器命令执行 ----
# None = 允许任意命令（危险！只在自己内网机器上用）
# 列表 = 只允许这些命令的第一个词，例如 ["ls","df","systemctl","journalctl"]
SERVER_EXEC_WHITELIST = None
SERVER_EXEC_TIMEOUT = 30
SERVER_EXEC_OUTPUT_LIMIT = 20000
