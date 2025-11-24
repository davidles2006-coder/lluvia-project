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
    
    # 🚩 V39 修复：这里改成了 'store/redeem_balance/' 以匹配 React 前端！
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

    # 🚩 V4/V10 消费 API
    path('admin/consume/<uuid:memberId>/', views.AdminConsumeView.as_view(), name='admin-consume-balance'),
    path('admin/track/<uuid:memberId>/', views.AdminTrackSpendView.as_view(), name='admin-track-cash'),

    # ... V4/V12 核销 API ...
    path('admin/redeem_voucher/', views.AdminRedeemVoucherView.as_view(), name='admin-redeem-voucher'),

    # ... V16 后勤 - 商城管理 API ...
    path('admin/store/points/', views.AdminPointsStoreListView.as_view(), name='admin-store-points-list'),
    path('admin/store/points/<int:pk>/', views.AdminPointsStoreDetailView.as_view(), name='admin-store-points-detail'),
    path('admin/store/points/upload/', views.PointsStoreImageUploadView.as_view(), name='admin-store-points-upload'),

    # ... V16 后勤 - 代金券模板管理 API ...
    path('admin/voucher-types/', views.AdminVoucherTypeListView.as_view(), name='admin-vouchertypes-list'),
    path('admin/voucher-types/<int:pk>/', views.AdminVoucherTypeDetailView.as_view(), name='admin-vouchertypes-detail'),

    # ... V16 后勤 - 余额商城管理 API ...
    path('admin/store/balance/', views.AdminBalanceStoreListView.as_view(), name='admin-store-balance-list'),
    path('admin/store/balance/<int:pk>/', views.AdminBalanceStoreDetailView.as_view(), name='admin-store-balance-detail'),
    
    # 余额商城 GET (列表)
    path('store/balance/', views.GetBalanceStoreView.as_view(), name='store-balance-list'),
    
    path('admin/store/balance/upload/', views.BalanceStoreImageUploadView.as_view(), name='admin-store-balance-upload'),

    # 🚩 V16 后勤 - 广告横幅管理 API
    path('admin/announcements/', views.AdminAnnouncementListView.as_view(), name='admin-announcements-list'),
    path('admin/announcements/<int:pk>/', views.AdminAnnouncementDetailView.as_view(), name='admin-announcements-detail'),
    path('admin/announcement/upload/', views.AnnouncementImageUploadView.as_view(), name='admin-announcement-upload'),

    path('admin/reports/', views.FinancialReportView.as_view(), name='admin-reports'),

    path('auth/password/reset/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]