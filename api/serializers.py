# 这是 api/serializers.py 文件的内容 (V2 - 100% 修复版)

from django.utils import timezone # 🚩 1. 确保文件顶部有这一行导入
from rest_framework import serializers
# 🚩 V15 修复: 导入所有我们需要的模型
from .models import Member, Level, Voucher, VoucherType, Transaction, RechargeTier, Reward_Points_Store, Reward_Balance_Store, Announcement 
# 🚩 1. 添加这一行新导入！

#
# --- V7/V15 会员门户 API 验证器 ---
#
class MemberRegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)
    dob = serializers.DateField() # ⬅️ 确保这一行存在
    class Meta:
        model = Member
        fields = ['email', 'phone', 'nickname', 'dob', 'password', 'password2']
        extra_kwargs = {'password': {'write_only': True},
                        'dob': {'required': True, 'allow_null': False}}
        

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("两次输入的密码不匹配 (Passwords do not match)")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')

        
        # 🚩 V73 修复: 创建用户时，强制记录“已同意”和“当前时间”
        # (因为只有点击了前端的“同意”按钮，请求才会发过来，所以这里直接设为 True)
        user = Member.objects.create_user(
            **validated_data,
            isTermsAgreed=True,
            termsAgreedTime=timezone.now()
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})

class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = ['levelName', 'themeName', 'pointMultiplier']

class MemberProfileSerializer(serializers.ModelSerializer):
    level = LevelSerializer(read_only=True) 
    
    # 🚩 V35 新增: 允许写入密码，但在读取资料时隐藏它 (write_only)
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = Member
        fields = [
            'memberId', 'email', 'phone', 'nickname', 'dob',
            'level', 'loyaltyPoints', 'lifetimePoints', 'avatarUrl', 
            'flair', 'socialOptIn', 'balance', 'balanceExpiryDate',
            'password', 'levelExpiryDate' # 🚩 V35: 添加 password 字段
        ]
        read_only_fields = [
            'memberId', 'level', 'loyaltyPoints', 
            'lifetimePoints', 'balance', 'balanceExpiryDate', 'levelExpiryDate'
            # 注意：email 现在允许修改了
        ]

    # 🚩 V35 新增: 重写 update 方法以支持密码加密
    def update(self, instance, validated_data):
        # 1. 取出密码 (如果用户没填，就是 None)
        password = validated_data.pop('password', None)
        
        # 2. 更新其他普通字段 (nickname, email, phone...)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # 3. 如果用户填了新密码，进行加密保存
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance

class VoucherTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoucherType
        fields = ['name', 'value', 'threshold']

class VoucherSerializer(serializers.ModelSerializer):
    voucherType = VoucherTypeSerializer(read_only=True) 
    class Meta:
        model = Voucher
        fields = ['voucherId', 'voucherType', 'status', 'expiryDate']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['timestamp', 'type', 'amount', 'discountApplied', 'pointsEarned']
        ordering = ['-timestamp']

#
# --- V2 / V4 / V15 后勤 API 验证器 ---
#
class AdminMemberSearchSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=50)
    memberId = serializers.UUIDField(required=False)
    
    def validate(self, data):
        # 🚩 验证逻辑：确保 phone 和 memberId 至少提供一个
        if not data.get('phone') and not data.get('memberId'):
            raise serializers.ValidationError("Either phone or memberId must be provided for search.")
        
        return data

class AdminRechargeSerializer(serializers.Serializer):
    tier_id = serializers.IntegerField()

class AdminConsumeSerializer(serializers.Serializer):
    # 🚩 V15 修复: 必须使用 serializers.DecimalField
    amount = serializers.DecimalField(max_digits=10, decimal_places=2) 

class AdminTrackSpendSerializer(serializers.Serializer):
    # 🚩 V15 修复: 必须使用 serializers.DecimalField
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

class AdminRedeemVoucherSerializer(serializers.Serializer):
    """ V13/V5 蓝图: "智能"核销 (bill_amount 现在是可选的) """
    voucher_id = serializers.UUIDField() 

    # 🚩 修复：设为“非必需”，并提供一个默认值
    bill_amount = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False, # ⬅️ 不再必需
        default=0       # ⬅️ 默认为 0
    ) 

class RechargeTierSerializer(serializers.ModelSerializer):
    """ V4 蓝图: 只读的充值档位 (用于前端显示) """
    class Meta:
        model = RechargeTier
        fields = ['id', 'amount', 'grantVoucherCount'] # "id: 1, amount: 300, count: 3"
        # (粘贴在 api/serializers.py 文件的最底部)

#
# --- V12/V15 会员商城 API 验证器 ---
#

# 在 api/serializers.py (替换这个 Class)

class PointsStoreItemSerializer(serializers.ModelSerializer):
    """ V12 蓝图: "积分商城"商品 (已修复 V5 - 绝对 URL) """
    
    # 🚩 1. 覆盖 imageUrl 字段
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Reward_Points_Store
        fields = ['id', 'name', 'description', 'imageUrl', 'pointsCost'] 

    # 🚩 2. 添加 'get' 方法
    def get_imageUrl(self, obj):
        if obj.imageUrl:
            # 'request' 由 DRF 自动传入 context
            request = self.context.get('request')
            if request:
                # build_absolute_uri() 会自动添加 'http://127.0.0.1:8000'
                return request.build_absolute_uri(obj.imageUrl)
            # (如果 request 为空，作为备用方案返回原始路径)
            return obj.imageUrl 
        return None # 如果没有图片，返回 None

class PointsRedeemSerializer(serializers.Serializer):
    """ V12 蓝图: "积分商城"兑换 (输入) """
    reward_id = serializers.IntegerField() # 要兑换的商品 ID

#
# --- V12 社交 API 验证器 ---
#

class SocialProfileSerializer(serializers.ModelSerializer):
    """ V12 蓝图: "社交画廊"资料 (只读, 最小化) """

    # 🚩 V12: 我们需要嵌套的"等级名称"
    # (我们使用 'source=' 来告诉它在 'level' 字段中查找 'levelName')
    levelName = serializers.CharField(source='level.levelName', read_only=True)

    class Meta:
        model = Member
        # V12 隐私: 只显示这些"安全"的字段
        fields = ['nickname', 'avatarUrl', 'flair', 'levelName']
        # (粘贴在 api/serializers.py 文件的最底部)

class AvatarUploadSerializer(serializers.Serializer):
    """ V8 蓝图: "头像上传"的验证器 """
    # Django Rest Framework (DRF) 的文件字段
    avatar = serializers.ImageField()
    # --- V16 (Admin) 商城管理 ---



class RewardPointsStoreAdminSerializer(serializers.ModelSerializer):
    """
    V16 蓝图: (已修复 V5 - 读/写安全)
    """

    # 🚩 修复 1：(用于“写入” Write)
    # 我们在 Meta 外部显式定义 "linkedVoucherType"，
    # 告诉它期望一个来自 VoucherType 表的“主键 (ID)”
    linkedVoucherType = serializers.PrimaryKeyRelatedField(
        queryset=VoucherType.objects.all(),
        allow_null=True,  # 允许为 null (匹配 V5 蓝图)
        required=False    # 设为非必需
    )

    # 🚩 修复 2：(用于“读取” Read)
    # 我们添加一个“只读”字段，用于显示名称
    linkedVoucherType_name = serializers.CharField(
        source='linkedVoucherType.name', 
        read_only=True, 
        allow_null=True 
    )

    class Meta:
        model = Reward_Points_Store
        fields = [
            'id', 
            'name', 
            'description', 
            'imageUrl', 
            'pointsCost', 
            'linkedVoucherType',      # ⬅️ (这是我们的“写入”字段)
            'linkedVoucherType_name', # ⬅️ (这是我们的“读取”字段)
            'isActive'
        ]
        # (我们不再需要 extra_kwargs)
        
    
class VoucherTypeAdminSerializer(serializers.ModelSerializer):
    """
    V16 蓝图: 后勤人员"管理"代金券模板时使用的验证器
    (用于创建、查看、修改模板)
    """
    class Meta:
        model = VoucherType
        # 'id' 是只读的，其他字段都是可写的
        fields = [
            'id', 
            'name', 
            'value', 
            'threshold', 
            'expiryDays',
            'costOfGoods',  # ⬅️ 添加
            'stockCount'    # ⬅️ 添加
        ]
        read_only_fields = ['id']



class RewardBalanceStoreAdminSerializer(serializers.ModelSerializer):
    """
    V16 蓝图: (已修复 V5 - 读/写安全)
    """

    # 🚩 修复 1：(用于“写入” Write)
    linkedVoucherType = serializers.PrimaryKeyRelatedField(
        queryset=VoucherType.objects.all(),
        allow_null=True,  # 允许为 null
        required=False    # 设为非必需
    )

    # 🚩 修复 2：(用于“读取” Read)
    linkedVoucherType_name = serializers.CharField(
        source='linkedVoucherType.name', 
        read_only=True, 
        allow_null=True
    )

    class Meta:
        model = Reward_Balance_Store
        fields = [
            'id', 
            'name', 
            'description', 
            'imageUrl', 
            'balancePrice', 
            'linkedVoucherType',      # ⬅️ (这是我们的“写入”字段)
            'linkedVoucherType_name', # ⬅️ (这是我们的“读取”字段)
            'isActive'
        ]
        # (我们不再需要 extra_kwargs)


# --- 请确保 api/serializers.py 里有这两个类 ---

# 1. 给会员用的 (只读，把图片转成链接)
class AnnouncementSerializer(serializers.ModelSerializer):
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'imageUrl', 'actionUrl', 'displayOrder']

    def get_imageUrl(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


# 2. 给后勤用的 (你刚才删掉的就是这个！必须加回来！)
# (Django 报错说找不到它，就是因为它不见了)
class AnnouncementAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        # 管理员需要看到所有字段，并且需要上传 'image'
        fields = [
            'id', 
            'title', 
            'image', 
            'content',     # 🚩 对应 models.py 的 ImageField
            'actionUrl', 
            'displayOrder', 
            'isActive', 
            'expiryDate'
        ]
        read_only_fields = ['id']

    


class RedeemBalanceSerializer(serializers.Serializer):
    """ V5 蓝图: "余额商城"兑换 (输入) """
    item_id = serializers.IntegerField()  # 要兑换的商品 ID (来自 Reward_Balance_Store)        

class AnnouncementImageUploadSerializer(serializers.Serializer):
    """ V16 蓝图: "横幅图片上传"的验证器 """
    # DRF 的文件字段
    image = serializers.ImageField()



class BalanceStoreItemSerializer(serializers.ModelSerializer):
    """ V5 蓝图: "余额商城"商品 (已修复 V5 - 绝对 URL) """
    
    linkedVoucherType_name = serializers.CharField(
        source='linkedVoucherType.name', 
        read_only=True,
        allow_null=True
    )
    
    # 🚩 1. 覆盖 imageUrl 字段
    imageUrl = serializers.SerializerMethodField()
    
    class Meta:
        model = Reward_Balance_Store
        fields = [
            'id', 
            'name', 
            'description', 
            'imageUrl', # ⬅️ 现在是 SerializerMethodField
            'balancePrice',
            'linkedVoucherType_name',
            'isActive'
        ]

    # 🚩 2. 添加 'get' 方法
    def get_imageUrl(self, obj):
        if obj.imageUrl:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imageUrl)
            return obj.imageUrl
        return None