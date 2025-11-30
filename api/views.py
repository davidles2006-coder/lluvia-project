from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from .serializers import TransactionSerializer # 确保导入了这个
import os 
import uuid 
from rest_framework import serializers # 引入 serializers 供内部类使用
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.db.models import Q
from django.contrib.auth import get_user_model
User = get_user_model()

# 导入我们所有的模型
from .models import (
    Member, Level, Voucher, VoucherType, Transaction, RechargeTier,
    Reward_Points_Store, Reward_Balance_Store, Announcement,
    FinancialLedger
)

# 导入我们所有的权限
from .permissions import IsStaffUser

# 导入我们所有的验证器
from .serializers import (
    MemberRegisterSerializer, LoginSerializer, MemberProfileSerializer, VoucherSerializer, 
    TransactionSerializer, AdminMemberSearchSerializer, AdminRechargeSerializer, 
    AdminConsumeSerializer, AdminTrackSpendSerializer, AdminRedeemVoucherSerializer, 
    SocialProfileSerializer, AvatarUploadSerializer, PointsStoreItemSerializer, PointsRedeemSerializer, 
    RewardPointsStoreAdminSerializer, VoucherTypeAdminSerializer, RewardBalanceStoreAdminSerializer,
    AnnouncementAdminSerializer,AnnouncementSerializer,RedeemBalanceSerializer,
    AnnouncementImageUploadSerializer, BalanceStoreItemSerializer
)


# V11 "辅助"函数 (放在顶部以便所有视图都可以调用它)
def update_member_level(member):
    """
    V11 蓝图 - 核心自动升级逻辑 
    """
    possible_levels = Level.objects.filter(minPoints__lte=member.lifetimePoints).order_by('-minPoints')

    if possible_levels.exists():
        new_level = possible_levels.first()
        if new_level.levelId > member.level.levelId:
            member.level = new_level

# --- 积分计算辅助函数 (请确保这段代码存在) ---
def get_points_for_spend(member, spend_amount):
    """ 
    V11 蓝图 - 积分计算逻辑 
    修复: 强制将 multiplier 转为 float，防止与 Decimal 类型冲突报错
    """
    # 1. 如果没有等级，默认 1倍
    if not member.level:
         return int(spend_amount) 
    
    # 2. 核心修复: 强制转换类型 (Decimal -> float)
    multiplier = float(member.level.pointMultiplier)
    
    # 3. 计算结果
    points_earned = spend_amount * multiplier
    return int(points_earned)


#
# --- V7/V15 会员门户 API ---
#

class RegisterView(generics.CreateAPIView):
    """ V7 蓝图 - 会员注册 API (POST /api/register) """
    serializer_class = MemberRegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(ObtainAuthToken):
    """ V7 蓝图 - 会员登录 API (POST /api/login) """
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=400)

        Member = get_user_model()
        try:
            user = Member.objects.get(email=email)
            if not user.check_password(password):
                raise Member.DoesNotExist
        except Member.DoesNotExist:
            return Response({'error': 'Invalid credentials (Email or Password incorrect)'}, status=401)

        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'memberId': user.memberId,
            'email': user.email,
            'nickname': user.nickname
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    """ V15 蓝图 - 会员资料 API (GET/PUT /api/profile/) """
    serializer_class = MemberProfileSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class AvatarUploadView(generics.GenericAPIView):
    """
    V37 修复: 支持上传 (POST) 和移除 (DELETE) 头像
    """
    serializer_class = AvatarUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 上传头像 (保持不变)
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        avatar_file = serializer.validated_data['avatar']

        try:
            fs = FileSystemStorage(location=settings.MEDIA_ROOT)
            extension = avatar_file.name.split('.')[-1]
            file_name = f'avatars/{user.memberId}_{uuid.uuid4()}.{extension}'
            filename = fs.save(file_name, avatar_file)
            file_url = fs.url(filename)
            absolute_url = request.build_absolute_uri(file_url) # 包含 http://...:8000

            user.avatarUrl = absolute_url
            user.save()
        except Exception as e:
            return Response({'error': f'Upload failed: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'success': 'Avatar uploaded.', 'avatarUrl': user.avatarUrl}, status=status.HTTP_200_OK)

    # 🚩 V37 新增: 移除头像 (DELETE)
    def delete(self, request, *args, **kwargs):
        user = request.user
        # 将数据库中的 url 清空
        user.avatarUrl = ''
        user.save()
        return Response({'success': 'Avatar removed.'}, status=status.HTTP_200_OK)

class MyVouchersView(generics.ListAPIView):
    """ V4/V12: 获取"我的"所有代金券 (GET /api/profile/vouchers/) """
    serializer_class = VoucherSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user
        return Voucher.objects.filter(member=user, status='unused').order_by('expiryDate')


class MyTransactionsView(generics.ListAPIView):
    """ V15: 获取"我的"所有交易记录 (GET /api/profile/transactions/) """
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user
        return Transaction.objects.filter(member=user).order_by('-timestamp')


#
# --- V12 积分商城 API (MEMBER PORTAL) ---
#

class GetPointsStoreView(generics.ListAPIView):
    """ V12 蓝图: 获取所有可兑换积分商品 (GET /api/store/points/) """
    serializer_class = PointsStoreItemSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        # 仅返回 active=True 的商品
        return Reward_Points_Store.objects.filter(isActive=True).order_by('pointsCost')

class GetBalanceStoreView(generics.ListAPIView):
    """ V5 蓝图: 获取所有可购买的余额商城商品 (GET /api/store/balance/) """
    serializer_class = BalanceStoreItemSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        # 仅返回 active=True 的商品
        return Reward_Balance_Store.objects.filter(isActive=True).order_by('balancePrice'
)

class RedeemPointsView(generics.GenericAPIView):
    """ V12 蓝图: 积分兑换商品 (POST /api/store/redeem/) """
    serializer_class = PointsRedeemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member = request.user
        item_id = serializer.validated_data['reward_id'] 

        try:
         # 1. 找到“价格标签” (Points Store Item)
            item = Reward_Points_Store.objects.get(id=item_id, isActive=True) 
        except Reward_Points_Store.DoesNotExist:
            return Response({'error': 'Item not found or unavailable.'}, status=status.HTTP_404_NOT_FOUND)

         # 2. 检查会员积分
        if member.loyaltyPoints < item.pointsCost:
            return Response({'error': f'Insufficient points. Need {item.pointsCost}, but only have {member.loyaltyPoints}.'}, status=status.HTTP_400_BAD_REQUEST)

        # 🚩
        # 🚩 V3 蓝图：开始执行4动作（库存、发券、账本1、账本2）
        # 🚩

        # 3. 找到“主产品” (VoucherType)
        #    我们现在假设所有积分商城商品都必须关联一个 VoucherType
        if not item.linkedVoucherType:
            return Response({'error': 'Item configuration error: No linked product.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        product = item.linkedVoucherType # 这就是我们的 "T-Shirt Voucher"

        try:
            # ⚠️ 我们必须使用数据库“事务” (transaction.atomic)
            # 这能确保 4 个动作要么“全部成功”，要么“全部失败”
            # 这可以防止我们扣了库存但没发券，或者扣了积分但没扣库存

            with transaction.atomic():
 
                # 动作 1：[库存] 检查并扣减库存
                # (我们使用 select_for_update 来“锁定”这一行，防止多人同时兑换)
                product_to_update = VoucherType.objects.select_for_update().get(id=product.id)

                if product_to_update.stockCount is not None: # (None 代表无限库存)
                    if product_to_update.stockCount <= 0:
                        raise Exception('Sorry, this item is out of stock.') # 抛出异常来触发“回滚”

                    product_to_update.stockCount -= 1
                    product_to_update.save()

                # 动作 2：[发券] 创建代金券实例 (Voucher)
                new_voucher = Voucher.objects.create(
                    member=member,
                    voucherType=product_to_update
                    # (status='unused' 和 expiryDate 将由 models.py 自动处理)
                    )

                # 动作 3：[账本1] 记录会员消费 (Transaction)
                member_txn = Transaction.objects.create(
                    member=member,
                    type='REWARD_ISSUE', # 🚩 V15 模型中的类型
                    amount=0, # 余额变化为 0
                    pointsEarned=-item.pointsCost, # 扣除积分
                    relatedVoucher=new_voucher,
                    
                    )

                # 动作 4：[账本2] 记录公司成本 (FinancialLedger)
                if product_to_update.costOfGoods and product_to_update.costOfGoods > 0:
                    FinancialLedger.objects.create(
                        type='COST_OF_GOODS',
                        amount = -product_to_update.costOfGoods, # 记录负数 (支出)
                        description = f"Cost for {product_to_update.name} (Ref Txn: {member_txn.transactionId})",
                        relatedMember = member,
                        relatedTransaction = member_txn
                        )

                # 最后：扣除会员积分
                member.loyaltyPoints -= item.pointsCost
                member.save()

        # 捕获我们自己抛出的“库存不足”异常
        except Exception as e:
            # 如果事务失败 (例如 'Out of stock')，所有更改都会被“回滚”
            return Response({'error': f'Redemption failed: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        # 事务成功！
        return Response({
            'success': f'Successfully redeemed {item.name} for {item.pointsCost} points.',
            'new_points_balance': member.loyaltyPoints
            }, status=status.HTTP_200_OK)

#
# --- V12 社交 API (MEMBER PORTAL) ---
#

class SocialGalleryView(generics.ListAPIView):
    """ V12 蓝图: 社交画廊 API (GET /api/social/gallery/) """
    serializer_class = SocialProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # 获取所有设置了头像的会员
        return Member.objects.exclude(avatarUrl='').order_by('-loyaltyPoints')


# 
# --- V2 / V4 / V15 后勤 API (ADMIN PORTAL) ---
#


class StaffLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(username=email, password=password)

        if user and user.is_staff:
            token, _ = Token.objects.get_or_create(user=user)
            
            # 🚩 V77 逻辑: 确定角色
            # 如果是 Django 超级管理员，强制视为 SUPERUSER，否则用数据库里的 role
            current_role = 'SUPERUSER' if user.is_superuser else user.role

            return Response({
                'token': token.key,
                'nickname': user.nickname,
                'memberId': user.memberId,
                'role': current_role  # 🚩 把角色发给前端
            })
            
        return Response({'error': 'Invalid Credentials or Not Staff'}, status=status.HTTP_400_BAD_REQUEST)


class GetRechargeTiersView(generics.ListAPIView):
    """ V10 蓝图: 获取所有充值等级 (GET /api/admin/tiers/) """
    permission_classes = [permissions.AllowAny] 
    queryset = RechargeTier.objects.all().order_by('amount')
    
    # 最终修正：根据 models.py，使用 'amount' 和其他存在的字段
    class RechargeTierSerializer(serializers.ModelSerializer):
        class Meta:
            model = RechargeTier
            # RechargeTier 模型中存在的字段是 id, amount, grantVoucherType, grantVoucherCount
            fields = ('id', 'amount', 'grantVoucherType', 'grantVoucherCount') 
            # ⚠️ 注意：如果 grantVoucherType 字段是外键，你可能需要在 serializers.py 中定义它。
            # 如果它只是 ID，它将显示为 ID。
    
    serializer_class = RechargeTierSerializer




class AdminMemberSearchView(APIView):
    """
    V87 修复: 智能搜索 (防止用电话号码搜 UUID 导致崩溃)
    """
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def post(self, request):
        query = request.data.get('phone') or request.data.get('memberId')
        
        print(f"🔍 Searching for: {query}") # 调试日志

        if not query:
            return Response({'error': 'Please provide phone or memberId'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 🚩 核心修复: 判断 query 是否为有效的 UUID
            is_uuid = False
            try:
                uuid.UUID(str(query))
                is_uuid = True
            except ValueError:
                is_uuid = False

            # 构造查询条件
            if is_uuid:
                # 如果长得像 UUID，那就 ID 和 电话都搜
                search_filter = (Q(phone=query) | Q(memberId=query)) & Q(is_staff=False)
            else:
                # 🚩 如果不像 UUID (比如是电话号码)，绝对不要去搜 memberId，否则数据库会崩！
                # 这里我们使用 "模糊搜索" (contains) 来搜电话
                search_filter = Q(phone__icontains=query) & Q(is_staff=False)

            # 执行查询
            members = Member.objects.filter(search_filter)

            if not members.exists():
                return Response({'error': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

            # 取第一个结果
            member = members.first()

            # 获取关联数据
            vouchers = Voucher.objects.filter(member=member, status='unused').select_related('voucherType')
            profile_serializer = MemberProfileSerializer(member)
            voucher_serializer = VoucherSerializer(vouchers, many=True) 

            return Response({
                'profile': profile_serializer.data,
                'vouchers': voucher_serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
             print(f"🔥 Error: {str(e)}")
             return Response({'error': f'Database error: {str(e)}'
}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class AdminRechargeView(generics.GenericAPIView):
    """
    V180 商业逻辑: 
    1. 充值不加积分。
    2. 充值福利：
       - $300 -> 升级 Silver
       - $500 -> 升级 Gold
       - $1000 -> 升级 Platinum
       - 并延长有效期 1 年
    """
    serializer_class = AdminRechargeSerializer
    permission_classes = [IsStaffUser]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member_id = self.kwargs.get('memberId') 
        tier_id = serializer.validated_data['tier_id']

        try:
            member = Member.objects.get(memberId=member_id)
            tier = RechargeTier.objects.get(id=tier_id) 
        except (Member.DoesNotExist, RechargeTier.DoesNotExist):
            return Response({'error': 'Data not found.'}, status=status.HTTP_404_NOT_FOUND)

        # 🚩 1. 判定充值福利等级
        target_level_name = None
        if tier.amount >= 1000:
            target_level_name = 'Platinum'
        elif tier.amount >= 500:
            target_level_name = 'Gold'
        elif tier.amount >= 300:
            target_level_name = 'Silver'

        promo_message = ""

        try:
            with transaction.atomic():
                # 2. 加余额
                member.balance += tier.amount
                member.balanceExpiryDate = timezone.now() + timezone.timedelta(days=365)

                # 3. 处理等级跳级 (只升不降)
                if target_level_name:
                    try:
                        target_level = Level.objects.get(levelName=target_level_name)
                        current_min_points = member.level.minPoints if member.level else 0
                        
                        # 只有当目标等级 > 当前等级时，才执行升级
                        if target_level.minPoints > current_min_points:
                            member.level = target_level
                            # 🚩 升级福利：有效期设为 1 年后
                            member.levelExpiryDate = timezone.now().date() + timezone.timedelta(days=365)
                            promo_message = f" (UPGRADED to {target_level_name}!)"
                    except Level.DoesNotExist:
                        pass # 如果数据库没配这个等级，就忽略

                # 4. 保存 (models.py 的 update_member_level 会再次运行，但不会覆盖我们的升级)
                member.save()

                # 5. 记账
                Transaction.objects.create(
                    member=member,
                    staff=request.user,
                    type='RECHARGE',
                    amount=tier.amount,
                    pointsEarned=0 
                )

                # 6. 发券
                if tier.grantVoucherType and tier.grantVoucherCount > 0:
                    for _ in range(tier.grantVoucherCount):
                        Voucher.objects.create(
                            member=member,
                            voucherType=tier.grantVoucherType,
                        )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'success': f'Successfully recharged ${tier.amount}.{promo_message}'}, status=status.HTTP_200_OK)



class AdminConsumeView(generics.GenericAPIView):
    """
    V186 修复: 余额消费 -> 强制类型转换 (解决 Float vs Decimal 报错)
    """
    serializer_class = AdminConsumeSerializer
    permission_classes = [IsStaffUser]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member = Member.objects.get(memberId=self.kwargs.get('memberId'))
        bill_amount = serializer.validated_data['amount']

        # 🚩 核心修复：将金额强制转换为 Decimal 类型，防止与数据库字段冲突
        try:
            actual_spend = Decimal(str(bill_amount))
        except:
            return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)

        if member.balance < actual_spend:
            return Response({'error': f'Insufficient balance. Need ${actual_spend}.'}, status=status.HTTP_400_BAD_REQUEST)

        # 计算积分
        points_earned = get_points_for_spend(member, float(actual_spend))

        try:
            with transaction.atomic():
                # 1. 扣余额 (现在两个都是 Decimal，不会报错了)
                member.balance -= actual_spend
                
                # 2. 加积分
                member.loyaltyPoints += points_earned
                member.lifetimePoints += points_earned
                update_member_level(member)
                member.save()

                # 3. 记账
                Transaction.objects.create(
                    member=member,
                    staff=request.user,
                    type='CONSUME_BALANCE',
                    amount = -actual_spend,
                    discountApplied = 0,
                    pointsEarned = points_earned
                )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'success': f'Successfully consumed ${actual_spend}', 
            'points_earned': points_earned,
            'new_balance': member.balance
        }, status=status.HTTP_200_OK)


# api/views.py

class AdminTrackSpendView(generics.GenericAPIView):
    """
    V188 修复: 现金/刷卡 -> 类型强制转换 -> 解决 500 错误
    """
    serializer_class = AdminTrackSpendSerializer
    permission_classes = [IsStaffUser]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member = Member.objects.get(memberId=self.kwargs.get('memberId'))
        
        # 1. 获取金额 (确保是数字)
        try:
            spend_amount = float(serializer.validated_data['amount'])
        except:
            return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. 计算积分 (调用辅助函数，它已经修好了类型转换)
        # 确保 get_points_for_spend 函数在文件上方已经定义好了！
        points_earned = get_points_for_spend(member, spend_amount)

        try:
            with transaction.atomic():
                # 3. 加积分
                member.loyaltyPoints += points_earned
                member.lifetimePoints += points_earned
                update_member_level(member)
                member.save()

                # 4. 记账 (转回 Decimal 存入数据库)
                Transaction.objects.create(
                    member=member,
                    staff=request.user,
                    type='CONSUME_CASH',
                    amount = -Decimal(str(spend_amount)), # 记录负数
                    pointsEarned = points_earned
                )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'success': f'Tracked successfully. Earned {points_earned} pts.', 
            'points_earned': points_earned,
            'new_total_points': member.loyaltyPoints
        }, status=status.HTTP_200_OK)


class AdminRedeemVoucherView(generics.GenericAPIView):
    """ V13 蓝图: "智能"核销代金券 (POST /api/admin/redeem_voucher/) """
    serializer_class = AdminRedeemVoucherSerializer
    permission_classes = [IsStaffUser]

    # 在 api/views.py (替换 AdminRedeemVoucherView 的 post 方法)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        voucher_id = serializer.validated_data['voucher_id']
        # V5 修复：获取“可选”的账单金额
        bill_amount = serializer.validated_data['bill_amount'] 

        try:
            # (我们必须 select_related 'voucherType' 来检查它是什么类型)
            voucher = Voucher.objects.select_related('voucherType', 'member', 'member__level').get(voucherId=voucher_id)
            member = voucher.member
            product = voucher.voucherType # (这就是 "T-Shirt" 或 "$50 Off")

            # --- 检查代金券是否有效 (V13 逻辑) ---
            if voucher.status == 'used':
                return Response({'error': 'Voucher already used.'}, status=status.HTTP_400_BAD_REQUEST)
            if voucher.expiryDate < timezone.now():
                voucher.status = 'expired'
                voucher.save()
                return Response({'error': 'Voucher is expired.'}, status=status.HTTP_400_BAD_REQUEST)

            # --- 
            # --- V5 蓝图：智能核销逻辑
            # --- 
            
            # 检查：这是“产品券”(T-Shirt) 吗？
            # (我们检查 Value 是否为 0，并且 Cost 大于等于 0)
            is_product_voucher = (product.value == 0 and product.costOfGoods is not None and product.costOfGoods >= 0)

            if is_product_voucher:
                # --- 流程 A：核销“产品券” (T-Shirt) ---
                # (会员已付款，库存/成本已记录。我们只标记为"已使用")
                
                with transaction.atomic():
                    voucher.status = 'used'
                    voucher.usedDate = timezone.now()
                    voucher.save()
                
                # (我们不需要创建 Transaction 或 FinancialLedger)
                
                return Response({
                    'success': f'Product voucher "{product.name}" successfully redeemed.',
                    'points_earned': 0 # (核销时不产生积分)
                }, status=status.HTTP_200_OK)

            else:
                # --- 流程 B：核销“折扣券” ($50 Off) ---
                # (这是我们旧的 V13 逻辑，它需要 bill_amount)

                # 检查账单金额
                if bill_amount <= 0:
                    return Response({'error': 'Bill amount is required for discount vouchers.'}, status=status.HTTP_400_BAD_REQUEST)
                
                voucher_threshold = product.threshold
                if bill_amount < voucher_threshold:
                    return Response(
                        {'error': f'Bill amount (${bill_amount}) does not meet the voucher threshold (${voucher_threshold}).'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # 计算支付
                voucher_value = product.value
                cash_payment = bill_amount - voucher_value
                points_earned = 0
                if cash_payment > 0:
                    # (我们只在“现金支付”的部分计算积分)
                    points_earned = get_points_for_spend(member, cash_payment)

                with transaction.atomic():
                    voucher.status = 'used'
                    voucher.usedDate = timezone.now()
                    voucher.save()

                    member.loyaltyPoints += points_earned
                    member.lifetimePoints += points_earned

                    update_member_level(member)
                    member.save()

                    # 🚩 V5 终极修复：移除了非法的 'description' 字段
                    Transaction.objects.create(
                        member=voucher.member,
                        staff=request.user,
                        type='CONSUME_VOUCHER',
                        amount = -voucher_value,
                        relatedVoucher = voucher
                    )
                    if cash_payment > 0:
                        Transaction.objects.create(
                            member=member,
                            staff=request.user,
                            type='CONSUME_CASH',
                            amount = -cash_payment,
                            pointsEarned = points_earned
                        )

        except Voucher.DoesNotExist:
            return Response({'error': 'Voucher ID not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # 🚩 V5 修复：返回 'detail' (这样 React 才能捕获它)
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'success': f'Successfully redeemed {product.name} (Bill: ${bill_amount}, Paid Cash: ${cash_payment})',
            'points_earned': points_earned
        }, status=status.HTTP_200_OK)
    
#
# --- V16 后勤 API (Admin Portal - 商城管理) ---
#

class AdminPointsStoreListView(generics.ListCreateAPIView):
    """
    V16 蓝图: 管理积分商城 (LIST, CREATE)
    (GET /api/admin/store/points/) - 获取所有商品列表
    (POST /api/admin/store/points/) - 创建一个新商品
    """
    permission_classes = [IsStaffUser] # 按照约定，使用 IsStaffUser
    queryset = Reward_Points_Store.objects.all().order_by('-id') # 默认按最新创建排序
    serializer_class = RewardPointsStoreAdminSerializer # 使用我们刚创建的 Admin 验证器

class AdminPointsStoreDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    V16 蓝图: 管理积分商城 (GET, PUT, DELETE)
    (GET /api/admin/store/points/<id>/) - 获取单个商品详情
    (PUT /api/admin/store/points/<id>/) - 修改一个商品
    (DELETE /api/admin/store/points/<id>/) - 删除一个商品
    """
    permission_classes = [IsStaffUser] # 按照约定，使用 IsStaffUser
    queryset = Reward_Points_Store.objects.all()
    serializer_class = RewardPointsStoreAdminSerializer
    
    # lookup_field 默认为 'pk'，这正好匹配 <int:pk>
class AdminVoucherTypeListView(generics.ListCreateAPIView):
    """
    V16 蓝图: 管理代金券模板 (LIST, CREATE)
    (GET /api/admin/voucher-types/) - 获取所有模板列表
    (POST /api/admin/voucher-types/) - 创建一个新模板
    """
    permission_classes = [IsStaffUser] # 按照约定，使用 IsStaffUser
    queryset = VoucherType.objects.all().order_by('value') # 默认按面值排序
    serializer_class = VoucherTypeAdminSerializer # 使用我们刚创建的 Admin 验证器

class AdminVoucherTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    V16 蓝图: 管理代金券模板 (GET, PUT, DELETE)
    (GET /api/admin/voucher-types/<id>/) - 获取单个模板详情
    (PUT /api/admin/voucher-types/<id>/) - 修改一个模板
    (DELETE /api/admin/voucher-types/<id>/) - 删除一个模板
    """
    permission_classes = [IsStaffUser] # 按照约定，使用 IsStaffUser
    queryset = VoucherType.objects.all()
    serializer_class = VoucherTypeAdminSerializer
    # lookup_field 默认为 'pk'

class AdminBalanceStoreListView(generics.ListCreateAPIView):
    """
    V16 蓝图: 管理余额商城 (LIST, CREATE)
    (GET /api/admin/store/balance/) - 获取所有商品列表
    (POST /api/admin/store/balance/) - 创建一个新商品
    """
    permission_classes = [IsStaffUser] # 按照约定，使用 IsStaffUser
    queryset = Reward_Balance_Store.objects.all().order_by('-id')
    serializer_class = RewardBalanceStoreAdminSerializer # 使用新的 Admin 验证器

class AdminBalanceStoreDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    V16 蓝图: 管理余额商城 (GET, PUT, DELETE)
    (GET /api/admin/store/balance/<id>/) - 获取单个商品详情
    (PUT /api/admin/store/balance/<id>/) - 修改一个商品
    (DELETE /api/admin/store/balance/<id>/) - 删除一个商品
    """
    permission_classes = [IsStaffUser] # 按照约定，使用 IsStaffUser
    queryset = Reward_Balance_Store.objects.all()
    serializer_class = RewardBalanceStoreAdminSerializer
    # lookup_field 默认为 'pk'
class AdminAnnouncementListView(generics.ListCreateAPIView):
    """
    V16 蓝图: 管理广告横幅 (LIST, CREATE)
    (GET /api/admin/announcements/) - 获取所有横幅列表
    (POST /api/admin/announcements/) - 创建一个新横幅
    """
    permission_classes = [IsStaffUser] # 按照约定，使用 IsStaffUser
    queryset = Announcement.objects.all().order_by('displayOrder', '-id') # 按排序, 再按最新
    serializer_class = AnnouncementAdminSerializer # 使用新的 Admin 验证器

class AdminAnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    V16 蓝图: 管理广告横幅 (GET, PUT, DELETE)
    (GET /api/admin/announcements/<id>/) - 获取单个横幅详情
    (PUT /api/admin/announcements/<id>/) - 修改一个横幅
    (DELETE /api/admin/announcements/<id>/) - 删除一个横幅
    """
    permission_classes = [IsStaffUser] # 按照约定，使用 IsStaffUser
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementAdminSerializer


class AnnouncementImageUploadView(generics.GenericAPIView):
    """
    V16 蓝图: 横幅图片上传 (POST /api/admin/announcement/upload/)
    - 接收图片文件，保存到 /media/announcements/，并返回 URL。
    """
    serializer_class = AnnouncementImageUploadSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser] # 仅限后勤人员

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image_file = serializer.validated_data['image']
        
        try:
            fs = FileSystemStorage(location=settings.MEDIA_ROOT)

            # 4. 创建一个唯一的文件名
            extension = image_file.name.split('.')[-1]

            # 路径: announcements/uuid.ext
            file_name = f'announcements/{uuid.uuid4()}.{extension}'

            # 5. 保存文件 
            filename = fs.save(file_name, image_file)

        except Exception as e:
            return Response({'error': f'文件写入失败。错误信息: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 6. 返回完整的 URL
        image_url = settings.MEDIA_URL + filename
        return Response({'success': '图片上传成功。', 'imageUrl': image_url}, status=status.HTTP_200_OK)
    
        

# --- V16 会员 API (Member Portal - 广告) ---

class MemberAnnouncementListView(generics.ListAPIView):
    """
    V16/V45 蓝图: 会员获取广告横幅
    """
    permission_classes = [permissions.IsAuthenticated] 
    serializer_class = AnnouncementSerializer 

    def get_queryset(self):
        # 🚩 V45 修复测试：
        # 我们删除了所有关于 expiryDate 和 timezone 的代码。
        # 只要你在后台打了钩 (isActive=True)，它就必须显示！
        return Announcement.objects.filter(isActive=True).order_by('displayOrder', '-id')
    



# 🚩 V64: 获取单个公告详情
class MemberAnnouncementDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AnnouncementSerializer
    queryset = Announcement.objects.filter(isActive=True)





class RedeemBalanceView(generics.GenericAPIView):
    """
    V187 修复: 余额商城购买 -> 原价扣款 (无折扣) -> 类型安全
    """
    serializer_class = RedeemBalanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member = request.user
        item_id = serializer.validated_data['item_id']

        try:
            item = Reward_Balance_Store.objects.get(id=item_id, isActive=True) 
        except Reward_Balance_Store.DoesNotExist:
            return Response({'error': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not item.linkedVoucherType:
            return Response({'error': 'Configuration error.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        product = item.linkedVoucherType

        # 🚩 核心修改：移除折扣，确保是 Decimal 类型
        # item.balancePrice 本身就是 Decimal，但我们用 Decimal() 包裹一下以防万一
        actual_spend = Decimal(str(item.balancePrice))
        
        # 计算积分 (转成 float 传给辅助函数)
        points_earned = get_points_for_spend(member, float(actual_spend))

        if member.balance < actual_spend:
             return Response({'error': 'Insufficient balance.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 库存检查
                product_to_update = VoucherType.objects.select_for_update().get(id=product.id)
                if product_to_update.stockCount is not None:
                    if product_to_update.stockCount <= 0:
                        raise Exception('Out of stock.')
                    product_to_update.stockCount -= 1
                    product_to_update.save()

                # 发券
                new_voucher = Voucher.objects.create(member=member, voucherType=product_to_update)

                # 扣款 & 加分
                member.balance -= actual_spend
                member.loyaltyPoints += points_earned
                member.lifetimePoints += points_earned
                update_member_level(member)
                member.save()

                # 记账
                member_txn = Transaction.objects.create(
                    member=member,
                    type='REDEEM_MERCH',
                    amount = -actual_spend,
                    discountApplied = 0, # 无折扣
                    pointsEarned = points_earned,
                    relatedVoucher = new_voucher,
                )
                
                # 公司财务记录
                if product_to_update.costOfGoods and product_to_update.costOfGoods > 0:
                    FinancialLedger.objects.create(
                        type='COST_OF_GOODS',
                        amount = -product_to_update.costOfGoods,
                        description = f"Cost for {product_to_update.name}",
                        relatedTransaction = member_txn
                    )

                FinancialLedger.objects.create(
                    type='REVENUE_STORE',
                    amount = actual_spend,
                    description = f"Revenue for {item.name}",
                    relatedTransaction = member_txn
                )

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'success': 'Purchased successfully.', 'new_balance': member.balance}, status=status.HTTP_200_OK)
    


class PointsStoreImageUploadView(generics.GenericAPIView):
    """
    V5 蓝图: "积分商城"图片上传 (POST /api/admin/store/points/upload/)
    """
    serializer_class = AnnouncementImageUploadSerializer # 我们可以复用这个
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image_file = serializer.validated_data['image']
        
        try:
            fs = FileSystemStorage(location=settings.MEDIA_ROOT)
            # 路径: store_points/uuid.ext
            file_name = f'store_points/{uuid.uuid4()}.{image_file.name.split(".")[-1]}'
            filename = fs.save(file_name, image_file)
        except Exception as e:
            return Response({'error': f'文件写入失败: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        image_url = settings.MEDIA_URL + filename
        return Response({'success': '图片上传成功。', 'imageUrl': image_url}, status=status.HTTP_200_OK)


class BalanceStoreImageUploadView(generics.GenericAPIView):
    """
    V5 蓝图: "余额商城"图片上传 (POST /api/admin/store/balance/upload/)
    """
    serializer_class = AnnouncementImageUploadSerializer # 我们可以复用这个
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image_file = serializer.validated_data['image']
        
        try:
            fs = FileSystemStorage(location=settings.MEDIA_ROOT)
            # 路径: store_balance/uuid.ext
            file_name = f'store_balance/{uuid.uuid4()}.{image_file.name.split(".")[-1]}'
            filename = fs.save(file_name, image_file)
        except Exception as e:
            return Response({'error': f'文件写入失败: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        image_url = settings.MEDIA_URL + filename
        return Response({'success': '图片上传成功。', 'imageUrl': image_url}, status=status.HTTP_200_OK)
    


class FinancialReportView(generics.GenericAPIView):
    """
    V67 (调试版): 财务流水导出
    """
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def get(self, request, *args, **kwargs):
        # 1. 获取所有交易
        qs = Transaction.objects.all().select_related('member').order_by('-timestamp')
        
        # 🚩 调试日志: 在黑色窗口打印总数
        print(f"🔍 DEBUG: Total Transactions found in DB: {qs.count()}")

        # 2. 分类过滤
        recharge_qs = qs.filter(type='RECHARGE')
        balance_qs = qs.filter(type__in=['CONSUME_BALANCE', 'REDEEM_MERCH'])
        voucher_qs = qs.filter(type='CONSUME_VOUCHER')
        cash_qs = qs.filter(type='CONSUME_CASH')

        # 🚩 调试日志: 打印分类数量
        print(f"🔍 DEBUG: Recharges: {recharge_qs.count()}")
        print(f"🔍 DEBUG: Balance Usage: {balance_qs.count()}")

        # 3. 序列化 (转成 JSON)
        return Response({
            'recharges': self.serialize_transactions(recharge_qs),
            'balance_usage': self.serialize_transactions(balance_qs),
            'voucher_usage': self.serialize_transactions(voucher_qs),
            'cash_income': self.serialize_transactions(cash_qs)
        })

    def serialize_transactions(self, queryset):
        data = []
        for t in queryset:
            # 确保 member 存在，防止报错
            member_name = t.member.nickname if t.member else 'Unknown (Deleted)'
            member_email = t.member.email if t.member else '-'
            
            data.append({
                'id': str(t.transactionId), # 确保转成字符串
                'date': t.timestamp,
                'member_name': member_name,
                'member_email': member_email,
                'type': t.type,
                'amount': float(t.amount), # 确保转成数字
                'points': t.pointsEarned
            })
        return data     
    
    # api/views.py (底部追加)

class PasswordResetRequestView(APIView):
    """
    V74: 请求重置密码 (发送邮件)
    """
    permission_classes = [permissions.AllowAny] # 允许未登录用户访问

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # 为了安全，即使邮箱不存在，通常也返回成功，防止黑客扫号。
            # 但为了方便调试，我们这里先返回成功。
            return Response({'success': 'If account exists, email sent.'}, status=status.HTTP_200_OK)

        # 1. 生成 UID 和 Token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # 2. 生成前端重置链接 (注意端口是 3001!)
        reset_link = f"https://lluvia.app/reset/{uid}/{token}"

        # 3. 发送邮件
        subject = "LLUVIA Password Reset"
        message = f"Click the link to reset your password:\n\n{reset_link}\n\nIf you did not request this, please ignore."
        
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'success': 'Email sent'}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    V74: 确认重置密码 (修改数据库)
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid_b64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uid_b64 or not token or not new_password:
            return Response({'error': 'Missing data'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. 解码 UID
            uid = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=uid)

            # 2. 验证 Token 是否有效
            if not default_token_generator.check_token(user, token):
                return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

            # 3. 设置新密码
            user.set_password(new_password)
            user.save()
            return Response({'success': 'Password reset successfully'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': 'Invalid token or user'}, status=status.HTTP_400_BAD_REQUEST)