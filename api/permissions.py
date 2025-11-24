# 这是 api/permissions.py 文件的内容

from rest_framework import permissions

class IsStaffUser(permissions.BasePermission):
    """
    V2 蓝图: 自定义权限，只允许 'is_staff=True' 的用户访问
    """
    def has_permission(self, request, view):
        # 1. 必须已认证 (有 Token)
        # 2. 必须是 'is_staff'
        return request.user and request.user.is_authenticated and request.user.is_staff