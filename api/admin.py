from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.db import models  # Keep this if you use models.* fields in forms, though not strictly needed here
from .models import (
    Member, Level, Voucher, VoucherType, Transaction, 
    RechargeTier, Reward_Points_Store, Reward_Balance_Store, 
    Announcement, FinancialLedger
)

# -----------------------------------------------------------
# 1. Identity & Permissions (Member)
# -----------------------------------------------------------

# Custom Forms for Member creation/editing
class MemberCreationForm(UserCreationForm):
    class Meta:
        model = Member
        # Defined fields, excluding username
        fields = ('email', 'phone', 'nickname', 'dob', 'is_staff', 'role')

class MemberChangeForm(UserChangeForm):
    class Meta:
        model = Member
        fields = ('email', 'phone', 'nickname', 'dob', 'is_staff', 'role')

# Register Member with the custom Admin class
@admin.register(Member)
class MemberAdmin(BaseUserAdmin):
    # Tell Django Admin to use our custom forms
    form = MemberChangeForm
    add_form = MemberCreationForm 

    # List View
    list_display = ('email', 'nickname', 'phone', 'role', 'level', 'balance', 'is_staff', 'is_superuser')
    list_display_links = ('email', 'nickname')
    list_filter = ('role', 'is_staff', 'is_superuser', 'level')
    search_fields = ('email', 'phone', 'nickname')
    ordering = ('email',)

    # Detail View Layout
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('nickname', 'phone', 'dob', 'avatarUrl')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Membership', {'fields': ('level', 'loyaltyPoints', 'lifetimePoints', 'balance', 'balanceExpiryDate')}),
        ('Legal', {'fields': ('isTermsAgreed', 'termsAgreedTime')}),
    )

    # Add User View Layout
    # FIX: Removed 'confirm_password' from fields list to prevent FieldError. 
    # UserCreationForm handles the password matching logic.
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone', 'nickname', 'dob'), 
        }),
    )

# -----------------------------------------------------------
# 2. Loyalty & Social (Level)
# -----------------------------------------------------------
@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ['levelId', 'levelName', 'minPoints', 'pointMultiplier', 'unlock_Social', 'unlock_Avatar']

# -----------------------------------------------------------
# 3. Finance & Transactions
# -----------------------------------------------------------
@admin.register(RechargeTier)
class RechargeTierAdmin(admin.ModelAdmin):
    list_display = ['amount', 'grantVoucherType', 'grantVoucherCount']

@admin.register(VoucherType)
class VoucherTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'value', 'threshold', 'expiryDays', 'costOfGoods', 'stockCount']
    search_fields = ['name']

@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['voucherId', 'member', 'voucherType', 'status', 'expiryDate']
    search_fields = ['member__nickname', 'member__phone']
    list_filter = ['status', 'voucherType']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'member', 'type', 'amount', 'pointsEarned', 'staff']
    search_fields = ['member__nickname', 'member__phone']
    list_filter = ['type', 'staff']

# -----------------------------------------------------------
# 4. Stores
# -----------------------------------------------------------
@admin.register(Reward_Points_Store)
class PointsStoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'pointsCost', 'linkedVoucherType', 'isActive']

@admin.register(Reward_Balance_Store)
class BalanceStoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'balancePrice', 'linkedVoucherType', 'isActive']
    list_filter = ('isActive',)
    search_fields = ('name',)

# -----------------------------------------------------------
# 5. Announcements
# -----------------------------------------------------------
@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'actionUrl', 'displayOrder', 'isActive', 'expiryDate']
    list_filter = ['isActive']
    search_fields = ['title']
    ordering = ['displayOrder']

# -----------------------------------------------------------
# 6. Financial Ledger
# -----------------------------------------------------------
@admin.register(FinancialLedger)
class FinancialLedgerAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'type', 'amount', 'description', 'relatedMember', 'relatedTransaction')
    list_filter = ('type',)
    search_fields = ('description', 'relatedMember__nickname', 'relatedMember__phone')
    ordering = ('-timestamp',) 
    
    # Read-only permissions
    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False