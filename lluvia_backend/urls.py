# 这是 lluvia_backend/urls.py 文件的内容 (V3 - 包含 Media 配置)

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# 🚩 V8 修复: 导入 settings 和 static
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # 1. 我们的 V2 Admin 后台
    path('admin/', admin.site.urls),

    # 2. 我们的 V15 API (将所有 /api/ 请求转交给 'api.urls')
    path('api/', include('api.urls')), 

    # 3. 我们的 V15 API 自动文档
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# 🚩 V8 修复: 在开发环境中服务媒体文件 (如头像)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)