from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid

# 
# 1. 身份与权限 (V7)
#
class MemberManager(BaseUserManager):
    """
    自定义会员管理器，用于处理 V7 蓝图（使用 Email 登录）
    """
    def create_user(self, email, phone, password=None, **extra_fields):
        if not email:
            raise ValueError('会员必须有一个 Email 地址')
        if not phone:
            raise ValueError('会员必须有一个电话号码')

        email = self.normalize_email(email)
        user = self.model(email=email, phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone, password, **extra_fields):
        # 超级管理员账户，我们自己（开发者）使用
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, phone, password, **extra_fields)

# api/models.py (完整的 Member 类，包含 V147 修复)

class Member(AbstractBaseUser, PermissionsMixin):
    """
    V147 终极版: 包含等级保护、法律证据和角色权限自动化
    """
    memberId = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True) 
    phone = models.CharField(max_length=50, unique=True) 
    nickname = models.CharField(max_length=100, blank=True)
    dob = models.DateField(null=True, blank=True) 

    # 🚩 V77: 员工角色定义 (用于 RBAC)
    ROLE_CHOICES = [
        ('MEMBER', '普通会员'),
        ('CASHIER', '收银员'),
        ('STORE_MANAGER', '店长/运营'),
        ('ACCOUNT_MANAGER', '财务经理'),
        ('SUPERUSER', '超级管理员'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')

    # V73: 法律证据字段
    isTermsAgreed = models.BooleanField(default=False) 
    termsAgreedTime = models.DateTimeField(null=True, blank=True) 

    # V11: 忠诚度核心
    level = models.ForeignKey('Level', on_delete=models.SET_NULL, null=True, blank=True) 
    loyaltyPoints = models.BigIntegerField(default=0) 
    lifetimePoints = models.BigIntegerField(default=0) 

    # V8/V12: 个性化与社交
    avatarUrl = models.URLField(max_length=1024, blank=True)
    flair = models.CharField(max_length=100, blank=True)
    socialOptIn = models.BooleanField(default=False)

    # V4: 财务
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    balanceExpiryDate = models.DateField(null=True, blank=True)

    # 补回丢失的字段，并允许为空
    preferredLanguage = models.CharField(max_length=5, default='en', null=True, blank=True)

    # Django 必需字段
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) 
    createdAt = models.DateTimeField(auto_now_add=True)

    objects = MemberManager()

    USERNAME_FIELD = 'email' 
    REQUIRED_FIELDS = ['phone', 'nickname'] 
    
    # -----------------------------------------------
    # 🚩 核心逻辑 Methods (V76 & V147)
    # -----------------------------------------------

    # api/models.py -> Member 类 -> update_member_level 方法

    def update_member_level(self):
        from .models import Level 
        
        # 🚩 V161 修复: 员工不需要等级
        # 如果角色不是普通会员 (即是员工)，强制清空等级，并直接结束
        if self.role != 'MEMBER':
            self.level = None
            return

        # --- 以下是针对 MEMBER (普通会员) 的正常逻辑 ---

        # 1. 如果当前没有 Level，先赋 Bronze
        if not self.level:
            try:
                self.level = Level.objects.get(levelName='Bronze')
            except Level.DoesNotExist:
                return 

        # 2. 根据积分计算等级
        calculated_level = Level.objects.filter(
            minPoints__lte=self.lifetimePoints
        ).order_by('-minPoints').first()

        if calculated_level:
            # 3. 只升不降保护
            if calculated_level.minPoints > self.level.minPoints:
                self.level = calculated_level


    def save(self, *args, **kwargs):
        # 自动更新等级
        self.update_member_level() 
        
        # 🚩 权限自动控制逻辑
        if self.role == 'MEMBER':
            self.is_staff = False  # 会员绝对不能是员工
        elif self.role in ['CASHIER', 'STORE_MANAGER', 'ACCOUNT_MANAGER', 'SUPERUSER']:
            self.is_staff = True   # 只有这些人才是员工
        
        super().save(*args, **kwargs)
# 
# 2. 忠诚度与社交 (V11/V12)
#
class Level(models.Model):
    """
    V12 等级定义表 (我们的"规则手册")
    """
    levelId = models.AutoField(primary_key=True)
    levelName = models.CharField(max_length=50, unique=True)
    minPoints = models.BigIntegerField() # 升级所需 "XP"
    pointMultiplier = models.DecimalField(max_digits=3, decimal_places=1) # 1.0, 1.5...

    # V11/V12 功能解锁
    themeName = models.CharField(max_length=50, blank=True)
    unlock_Social = models.BooleanField(default=False)
    unlock_Avatar = models.BooleanField(default=False)
    unlock_Games = models.BooleanField(default=False)

    def __str__(self):
        return self.levelName

#
# 3. 财务与交易 (V4)
#
class RechargeTier(models.Model):
    """
    V4 充值档位表 (后勤后台读取)
    """
    amount = models.IntegerField(unique=True) # 300, 500, 1000
    grantVoucherType = models.ForeignKey('VoucherType', on_delete=models.SET_NULL, null=True)
    grantVoucherCount = models.IntegerField() # 3, 5, 10

    def __str__(self):
        return f"充值 {self.amount} 送 {self.grantVoucherCount} 张"

class VoucherType(models.Model):
    name = models.CharField(max_length=255)
    value = models.DecimalField(max_digits=10, decimal_places=2) 
    threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0) 
    
    # 🚩 修复 admin.E108 错误：确保这一行存在！
    expiryDays = models.IntegerField(default=90) 
    
    # 🚩 修复 V5 蓝图：添加成本和库存
    costOfGoods = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        default=0
    )
    stockCount = models.IntegerField(
        null=True, 
        blank=True,
        default=None 
    )

    def __str__(self):
        return self.name

class Voucher(models.Model):
    voucherId = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    
    # 🚩 修复 V5 Bug：必须是 SET_NULL，否则你无法删除主产品
    voucherType = models.ForeignKey(VoucherType, on_delete=models.SET_NULL, null=True, blank=True)

    STATUS_CHOICES = [('unused', 'Unused'), ('used', 'Used'), ('expired', 'Expired')]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unused')

    issueDate = models.DateTimeField(auto_now_add=True)
    
    # 🚩 修复 1970-01-01 BUG：允许 NULL
    expiryDate = models.DateTimeField(null=True, blank=True) 
    
    usedDate = models.DateTimeField(null=True, blank=True)

    # 🚩 修复 V6 save() 逻辑和语法
    def save(self, *args, **kwargs):
        # 自动化 V7 蓝图 (0 天 = 365 天)
        
        if not self.expiryDate:
            try:
                # 1. 强制从数据库获取 VoucherType (避免缓存)
                voucher_type_instance = VoucherType.objects.get(pk=self.voucherType_id)
                expiry_days = voucher_type_instance.expiryDays
                
                # 🚩 
                # 🚩 终极修复：0 = 365
                # 🚩
                if expiry_days <= 0:
                    # 2. 如果天数为 0 (或更少)，则设为 365 天
                    self.expiryDate = timezone.now() + timezone.timedelta(days=365)
                else:
                    # 3. 否则 (例如 90)，则计算 90 天
                    self.expiryDate = timezone.now() + timezone.timedelta(days=expiry_days)
            
            except VoucherType.DoesNotExist:
                # (备用方案：如果模板被删了，默认给 90 天)
                self.expiryDate = timezone.now() + timezone.timedelta(days=90)
        
        super().save(*args, **kwargs) # ⬅️ 确保缩进正确

class Transaction(models.Model):
    """
    V15 总账本
    """
    transactionId = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True,related_name='member_transactions')

    TYPE_CHOICES = [
        ('RECHARGE', '代充值'),
        ('CONSUME_BALANCE', '余额消费 (现场)'),
        ('CONSUME_CASH', '现金/刷卡 (追踪)'),
        ('CONSUME_VOUCHER', '核销代金券'),
        ('REDEEM_MERCH', '余额商城消费'),
        ('REWARD_ISSUE', '积分兑换'),
        ('SYSTEM_ADJUST', '系统调整') # 用于修正
    ]
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)

    amount = models.DecimalField(max_digits=10, decimal_places=2) # +300, -90
    discountApplied = models.DecimalField(max_digits=10, decimal_places=2, default=0) # V4 10%折扣
    pointsEarned = models.BigIntegerField(default=0) # V11 赚的积分

    # 审计
    staff = models.ForeignKey('api.Member', on_delete=models.SET_NULL, null=True, blank=True,related_name='staff_transactions') # 关联到后勤
    relatedVoucher = models.ForeignKey(Voucher, on_delete=models.SET_NULL, null=True, blank=True)
    relatedProduct = models.ForeignKey('Reward_Balance_Store', on_delete=models.SET_NULL, null=True, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

#
# 4. 商城 (V15)
#
class Reward_Points_Store(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    imageUrl = models.CharField(max_length=1024, blank=True)
    pointsCost = models.BigIntegerField()
    
    # 🚩 修复 V5 Bug：必须是 SET_NULL
    linkedVoucherType = models.ForeignKey(
        VoucherType, 
        on_delete=models.SET_NULL, # ⬅️ 修复 DELETE 500
        null=True, 
        blank=True
    )
    
    isActive = models.BooleanField(default=True)
    
    # (我们 V4 蓝图中添加的 linkedBalanceItem 已被 V5 蓝图取代)

    def __str__(self):
        return f"{self.name} ({self.pointsCost} Pts)"

class Reward_Balance_Store(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    imageUrl = models.CharField(max_length=1024, blank=True)
    balancePrice = models.DecimalField(max_digits=10, decimal_places=2)
    isActive = models.BooleanField(default=True)

    # 🚩 修复 V5 Bug：必须是 SET_NULL
    linkedVoucherType = models.ForeignKey(
        VoucherType, 
        on_delete=models.SET_NULL, # ⬅️ 修复 DELETE 500
        null=True, 
        blank=True
    )

    def __str__(self):
        return f"{self.name} (${self.balancePrice})"
    
    #
# 5. 广告 (V16)
#

class Announcement(models.Model):
    """
    V46: 升级为支持真实图片上传
    """
    title = models.CharField(max_length=255)
    
    # 🚩 V46 修复: 改用 ImageField，支持文件上传
    # (注意: 之前是 imageUrl = CharField, 现在删掉了)
    image = models.ImageField(upload_to='announcements/', blank=True, null=True)
    
    # 🚩 V64 新增: 详情内容 (TextField 可以写很多字)
    content = models.TextField(blank=True, help_text="如果不填 Action URL，点击横幅将显示此内容")

    # 点击图片后跳转的链接 (例如跳转到商城)
    actionUrl = models.CharField(max_length=1024, blank=True) 
    
    displayOrder = models.IntegerField(default=0) 
    isActive = models.BooleanField(default=True) 
    expiryDate = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

#
# 6. 公司财务 (V3 蓝图)
#
class FinancialLedger(models.Model):
    """
    V3 蓝图: "公司账本"
    只记录对公司财务有影响的内部交易。
    (例如：商品成本、收入、运费、退款成本等)
    """
    ledgerId = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # 记录类型
    TYPE_CHOICES = [
        ('REVENUE_BALANCE', '余额收入'), # (例如，会员用 Stripe 充值了 $100)
        ('REVENUE_STORE', '商城销售收入'), # (例如，会员用 $30 余额购买了 T恤)
        ('COST_OF_GOODS', '商品成本支出'), # (例如，我们因 T恤 兑换支出了 $10)
        ('ADJUSTMENT', '财务调整')
    ]
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)

    # 金额
    amount = models.DecimalField(max_digits=10, decimal_places=2) # +100.00, -10.00
    
    # 描述
    description = models.CharField(max_length=255, blank=True)
    
    # 审计 (可选, 但推荐)
    # 我们可以把它关联到“触发”这笔交易的会员
    relatedMember = models.ForeignKey(
        Member, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    # 也可以关联到“源”交易
    relatedTransaction = models.ForeignKey(
        Transaction, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    def __str__(self):
        return f"[{self.type}] {self.amount}"