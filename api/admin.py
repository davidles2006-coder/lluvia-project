# 这是 api/admin.py 文件的内容

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from . import models # 从我们这个文件夹导入 models.py

# 
# 1. 身份与权限 (V7)
#
@admin.register(models.Member)
class MemberAdmin(BaseUserAdmin):
    # 定义在列表页显示哪些字段
    list_display = ('email', 'nickname', 'phone', 'role', 'level', 'balance', 'is_staff', 'is_superuser')
    
    # 定义哪些字段可以点击进入编辑
    list_display_links = ('email', 'nickname')
    
    # 定义过滤器 (右侧侧边栏)
    list_filter = ('role', 'is_staff', 'is_superuser', 'level')
    
    # 定义搜索框能搜什么
    search_fields = ('email', 'phone', 'nickname')
    
    # 详情页的字段排列
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('nickname', 'phone', 'dob', 'avatarUrl')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Membership', {'fields': ('level', 'loyaltyPoints', 'lifetimePoints', 'balance', 'balanceExpiryDate')}),
        ('Legal', {'fields': ('isTermsAgreed', 'termsAgreedTime')}),
    )
    
    # 创建新用户页面的字段
   
    
  
# 
# 2. 忠诚度与社交 (V11/V12)
#
@admin.register(models.Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ['levelId', 'levelName', 'minPoints', 'pointMultiplier', 'unlock_Social', 'unlock_Avatar']
    # 警告：不要随意修改这里的 minPoints 或 multiplier！
    # 这是我们的 V11/V12 "规则手册"

# 
# 3. 财务与交易 (V4)
#
@admin.register(models.RechargeTier)
class RechargeTierAdmin(admin.ModelAdmin):
    list_display = ['amount', 'grantVoucherType', 'grantVoucherCount']
    # V4 充值档位设置

@admin.register(models.VoucherType)
class VoucherTypeAdmin(admin.ModelAdmin):
    # 🚩 修复 admin.E108 错误：我们现在可以安全地显示所有字段
    list_display = ['name', 'value', 'threshold', 'expiryDays', 'costOfGoods', 'stockCount']
    search_fields = ['name']

@admin.register(models.Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['voucherId', 'member', 'voucherType', 'status', 'expiryDate']
    search_fields = ['member__nickname', 'member__phone']
    list_filter = ['status', 'voucherType']
    # 查看所有会员持有的券

@admin.register(models.Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'member', 'type', 'amount', 'pointsEarned', 'staff']
    search_fields = ['member__nickname', 'member__phone']
    list_filter = ['type', 'staff']
    # V15 总账本

# 
# 4. 商城 (V15)
#
@admin.register(models.Reward_Points_Store)
class PointsStoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'pointsCost', 'linkedVoucherType', 'isActive']
    # V12 积分商城 (用积分兑换)

@admin.register(models.Reward_Balance_Store)
class BalanceStoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'balancePrice', 'linkedVoucherType', 'isActive']
    list_filter = ('isActive',)
    search_fields = ('name',)
    # V15 余额商城 (用余额购买)

# 5. 广告 (V16) - 🚩 我们唯一需要添加的新模型
#
@admin.register(models.Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = [
'title', 'actionUrl', 'displayOrder', 'isActive', 'expiryDate'
]
    list_filter = [
'isActive'
]
    search_fields = [
'title'
]
    ordering = [
'displayOrder'
]


# (粘贴到 api/admin.py 的末尾)
#
# 6. 公司财务 (V3 蓝图)
#
@admin.register(models.FinancialLedger)
class FinancialLedgerAdmin(admin.ModelAdmin):
    """
    V3 蓝图: "公司账本"的后台视图
    """
    list_display = ('timestamp', 'type', 'amount', 'description', 'relatedMember', 'relatedTransaction')
    list_filter = ('type',)
    search_fields = ('description', 'relatedMember__nickname', 'relatedMember__phone')
    ordering = ('-timestamp',) 
    
    # 设为只读
    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False