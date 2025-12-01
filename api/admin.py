# api/admin.py - 修复无法添加账号的问题

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import (
    Member, Level, Voucher, VoucherType, Transaction, 
    RechargeTier, Reward_Points_Store, Reward_Balance_Store, 
    Announcement, FinancialLedger
)

# 1. 自定义表单
class MemberCreationForm(UserCreationForm):
    class Meta:
        model = Member
        fields = ('email', 'phone', 'nickname', 'role', 'is_staff', 'is_superuser')

class MemberChangeForm(UserChangeForm):
    class Meta:
        model = Member
        fields = ('email', 'phone', 'nickname', 'role', 'is_staff', 'is_superuser')

# 2. Member Admin 配置
@admin.register(Member)
class MemberAdmin(BaseUserAdmin):
    form = MemberChangeForm
    add_form = MemberCreationForm

    list_display = ('email', 'nickname', 'phone', 'role', 'level', 'balance', 'is_staff')
    list_filter = ('role', 'is_staff', 'level')
    search_fields = ('email', 'phone', 'nickname')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('nickname', 'phone', 'dob', 'avatarUrl')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Membership', {'fields': ('level', 'loyaltyPoints', 'lifetimePoints', 'balance', 'balanceExpiryDate')}),
        ('Legal', {'fields': ('isTermsAgreed', 'termsAgreedTime')}),
    )

    # 🚩 核心修复：这里只保留 'password'，删除了会导致报错的 'password_2'
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone', 'role', 'is_staff', 'is_superuser', 'password'), 
        }),
    )

# 3. 注册其他模型
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