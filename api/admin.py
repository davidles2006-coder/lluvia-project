# api/admin.py - V150 (修复后台无法创建账号/无密码框问题)

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
from .models import (
    Member, Level, Voucher, VoucherType, Transaction, 
    RechargeTier, Reward_Points_Store, Reward_Balance_Store, 
    Announcement, FinancialLedger
)

# -----------------------------------------------------------
# 1. 自定义表单 (关键修复)
# -----------------------------------------------------------

# 创建用户时使用的表单 (包含密码)
class MemberCreationForm(UserCreationForm):
    class Meta:
        model = Member
        # 这里只列出非密码字段，密码字段由 UserCreationForm 自动添加
        fields = ('email', 'phone', 'nickname', 'role', 'is_staff', 'is_superuser')

# 修改用户时使用的表单
class MemberChangeForm(UserChangeForm):
    class Meta:
        model = Member
        fields = ('email', 'phone', 'nickname', 'role', 'is_staff', 'is_superuser')

# -----------------------------------------------------------
# 2. Member Admin 配置
# -----------------------------------------------------------
@admin.register(Member)
class MemberAdmin(BaseUserAdmin):
    # 指定表单
    form = MemberChangeForm
    add_form = MemberCreationForm

    # 列表页显示
    list_display = ('email', 'nickname', 'phone', 'role', 'level', 'balance', 'is_staff')
    list_filter = ('role', 'is_staff', 'level')
    search_fields = ('email', 'phone', 'nickname')
    ordering = ('email',)

    # 详情页布局 (修改现有用户)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('nickname', 'phone', 'dob', 'avatarUrl')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Membership', {'fields': ('level', 'loyaltyPoints', 'lifetimePoints', 'balance', 'balanceExpiryDate')}),
        ('Legal', {'fields': ('isTermsAgreed', 'termsAgreedTime')}),
    )

    # 🚩 核心修复：添加新用户页面的布局
    # 必须使用 'password' 和 'password_2' (这是 Django 默认的字段名)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone', 'role', 'is_staff', 'password', 'password_2'),
        }),
    )

# -----------------------------------------------------------
# 3. 其他模型注册 (保持不变)
# -----------------------------------------------------------
@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ['levelId', 'levelName', 'minPoints', 'pointMultiplier']

@admin.register(VoucherType)
class VoucherTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'value', 'expiryDays', 'costOfGoods', 'stockCount']

@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['voucherId', 'member', 'voucherType', 'status', 'expiryDate']
    search_fields = ['member__nickname', 'member__phone']
    list_filter = ['status']

@admin.register(RechargeTier)
class RechargeTierAdmin(admin.ModelAdmin):
    list_display = ['amount', 'grantVoucherType', 'grantVoucherCount']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'member', 'type', 'amount', 'staff']
    search_fields = ['member__nickname', 'member__phone']
    list_filter = ['type']

@admin.register(Reward_Points_Store)
class PointsStoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'pointsCost', 'isActive']

@admin.register(Reward_Balance_Store)
class BalanceStoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'balancePrice', 'isActive']

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'isActive', 'expiryDate']

@admin.register(FinancialLedger)
class FinancialLedgerAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'type', 'amount', 'description')
    
    # 只读权限
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False