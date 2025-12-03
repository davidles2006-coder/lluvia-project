from django.urls import path
from . import views 

urlpatterns = [
    # --- V7/V15 会员门户 API ---
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/avatar/', views.AvatarUploadView.as_view(), name='profile-avatar'),
    path('profile/vouchers/', views.MyVouchersView.as_view(), name='my-vouchers'),
    path('profile/transactions/', views.MyTransactionsView.as_view(), name='my-transactions'),
    
    # 🚩 V12 积分商城 API
    path('store/points/', views.GetPointsStoreView.as_view(), name='store-points-list'),
    path('store/redeem/', views.RedeemPointsView.as_view(), name='store-points-redeem'),
    path('store/redeem_balance/', views.RedeemBalanceView.as_view(), name='store-balance-redeem'), 

    # 🚩 V12 社交 API
    path('social/gallery/', views.SocialGalleryView.as_view(), name='social-gallery'),
    path('announcements/', views.MemberAnnouncementListView.as_view(), name='member-announcements-list'),
    path('announcements/<int:pk>/', views.MemberAnnouncementDetailView.as_view(), name='member-announcement-detail'),

    # --- V2/V4/V10/V12 后勤门户 API ---
    path('admin/login/', views.StaffLoginView.as_view(), name='admin-login'),
    path('admin/search/', views.AdminMemberSearchView.as_view(), name='admin-search'),
    path('admin/tiers/', views.GetRechargeTiersView.as_view(), name='admin-get-tiers'),
    path('admin/recharge/<uuid:memberId>/', views.AdminRechargeView.as_view(), name='admin-recharge'),
    path('admin/consume/<uuid:memberId>/', views.AdminConsumeView.as_view(), name='admin-consume-balance'),
    path('admin/track/<uuid:memberId>/', views.AdminTrackSpendView.as_view(), name='admin-track-cash'),
    path('admin/redeem_voucher/', views.AdminRedeemVoucherView.as_view(), name='admin-redeem-voucher'),

    # ... V16 后勤 - 商城管理 API ...
    path('admin/store/points/', views.AdminPointsStoreListView.as_view(), name='admin-store-points-list'),
    path('admin/store/points/<int:pk>/', views.AdminPointsStoreDetailView.as_view(), name='admin-store-points-detail'),
    path('admin/store/points/upload/', views.PointsStoreImageUploadView.as_view(), name='admin-store-points-upload'),

    path('admin/voucher-types/', views.AdminVoucherTypeListView.as_view(), name='admin-vouchertypes-list'),
    path('admin/voucher-types/<int:pk>/', views.AdminVoucherTypeDetailView.as_view(), name='admin-vouchertypes-detail'),

    path('admin/store/balance/', views.AdminBalanceStoreListView.as_view(), name='admin-store-balance-list'),
    path('admin/store/balance/<int:pk>/', views.AdminBalanceStoreDetailView.as_view(), name='admin-store-balance-detail'),
    path('store/balance/', views.GetBalanceStoreView.as_view(), name='store-balance-list'),
    path('admin/store/balance/upload/', views.BalanceStoreImageUploadView.as_view(), name='admin-store-balance-upload'),

    path('admin/announcements/', views.AdminAnnouncementListView.as_view(), name='admin-announcements-list'),
    path('admin/announcements/<int:pk>/', views.AdminAnnouncementDetailView.as_view(), name='admin-announcements-detail'),
    path('admin/announcement/upload/', views.AnnouncementImageUploadView.as_view(), name='admin-announcement-upload'),

    path('admin/reports/', views.FinancialReportView.as_view(), name='admin-reports'),

    # ==========================================
    # 🚩 核心修复区：密码重置路由
    # ==========================================
    
    # 1. 发送邮件 (对应 ForgotPasswordPage.js)
    path('auth/password/reset/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    
    # 2. 确认重置 (对应 PasswordResetConfirmPage.js)
    # 🚩 必须改成 password_reset/confirm/ 以匹配前端请求！
    path('password_reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # ==========================================
    # 🚩 新增：游戏 API (防止老虎机玩不了)
    # ==========================================
    path('game/play/', views.GamePlayView.as_view(), name='game-play'),
]