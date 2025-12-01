from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.db import models
# 👇 这里导入了模型，不需要在下面重新写一遍 class Member...
from .models import (
    Member, Level, Voucher, VoucherType, Transaction, 
    RechargeTier, Reward_Points_Store, Reward_Balance_Store, 
    Announcement, FinancialLedger
)

# -----------------------------------------------------------
# 1. 自定义表单 (Custom Forms)
# -----------------------------------------------------------
class MemberCreationForm(UserCreationForm):
    class Meta:
        model = Member
        fields = ('email', 'phone', 'nickname', 'role', 'is_staff', 'is_superuser')

class MemberChangeForm(UserChangeForm):
    class Meta:
        model = Member
        fields = ('email', 'phone', 'nickname', 'role', 'is_staff', 'is_superuser')

# -----------------------------------------------------------
# 2. Member Admin 配置
# -----------------------------------------------------------
@admin.register(Member)
class MemberAdmin(BaseUserAdmin):
    form = MemberChangeForm
    add_form = MemberCreationForm

    list_display = ('email', 'nickname', 'phone', 'role', 'level', 'balance', 'is_staff')
    list_filter = ('role', 'is_staff', 'level')
    search_fields = ('email', 'phone', 'nickname')
    ordering = ('email',)

    # 修改用户时的界面
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('nickname', 'phone', 'dob', 'avatarUrl')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Membership', {'fields': ('level', 'loyaltyPoints', 'lifetimePoints', 'balance', 'balanceExpiryDate')}),
        ('Legal', {'fields': ('isTermsAgreed', 'termsAgreedTime')}),
    )

    # 🚩 添加新用户时的界面 (修复了 500 错误)
    # 这里的 fields 必须只包含数据库里有的或者是 form 处理过的
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone', 'role', 'is_staff', 'is_superuser', 'password', 'password_2'), 
        }),
    )

# -----------------------------------------------------------
# 3. 其他模型注册
# -----------------------------------------------------------
@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ['levelId', 'levelName', 'minPoints', 'pointMultiplier']

@admin.register(VoucherType)
class VoucherTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'value', 'expiryDays', 'stockCount']

@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['voucherId', 'member', 'voucherType', 'status']
    search_fields = ['member__nickname']
    list_filter = ['status']

@admin.register(RechargeTier)
class RechargeTierAdmin(admin.ModelAdmin):
    list_display = ['amount', 'grantVoucherType', 'grantVoucherCount']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'member', 'type', 'amount']
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
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False