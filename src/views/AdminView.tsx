import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Order, OrderStatus, Category, Coupon, Offer, Branch, CartItem, PaymentMethod, ProductSize, CartItemAddon, CustomerReview, toEnglishDigits, normalizePhone } from '../types';
import { AdminLogin } from '../components/AdminLogin';
import { PeakHoursChart } from '../components/PeakHoursChart';
import { ShiftManagementView } from '../components/ShiftManagementView';
import { UsersManagementTab } from '../components/UsersManagementTab';
import { CustomersManagementTab } from '../components/CustomersManagementTab';
import { AuditLogsTab } from '../components/AuditLogsTab';
import { SecuritySettingsTab } from '../components/SecuritySettingsTab';
import { PixelTrackerSettings } from '../components/PixelTrackerSettings';
import { DeliveryZonesManager } from '../components/DeliveryZonesManager';
import { SalesAnalyticsView } from '../components/SalesAnalyticsView';
import { BlacklistManager } from '../components/BlacklistManager';
import { soundManager } from '../utils/audio';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Layers,
  Percent,
  Star,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Printer,
  PhoneCall,
  MessageCircle,
  DollarSign,
  TrendingUp,
  X,
  LogOut,
  Link as LinkIcon,
  Check,
  Store,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChefHat,
  Bike,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Eye,
  MapPin,
  Flame,
  Image as ImageIcon,
  Upload,
  Filter,
  Copy,
  Sliders,
  ExternalLink,
  ChevronLeft,
  Bell,
  ArrowRightLeft,
  Unlock,
  Lock,
  Banknote,
  Receipt,
  Users,
  UserCog,
  Shield,
  Activity,
  KeyRound,
  Globe,
  Menu,
  BarChart3,
  UserX,
  ShieldAlert,
} from 'lucide-react';

// Sound alert helper using SoundEffects with auto-unlocked AudioContext & rich multi-part bell chime
const playChimeSound = () => {
  soundManager.unlockAudio();
  soundManager.playNewOrderAlert();
};

const AdminDashboard: React.FC = () => {
  const {
    adminUser,
    logoutAdmin,
    setCurrentView,
    orders,
    updateOrderStatus,
    deleteOrder,
    clearAllOrders,
    createOrder,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    categories,
    addCategory,
    deleteCategory,
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    reviews,
    addReview,
    updateReview,
    toggleApproveReview,
    deleteReview,
    settings,
    updateSettings,
    branches,
    updateBranch,
    setActiveReceiptOrder,
    addonGroups,
    shifts,
    activeShift,
    openShift,
    closeShift,
    addShiftExpense,
    registeredCustomers,
    language,
    syncStatus,
    addToast,
    deliveryZones,
    blacklist,
    addToBlacklist,
    isPhoneBlacklisted,
    getOrderProductsTotal,
  } = useApp();

  const isRestricted = adminUser?.role === 'cashier';

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'shifts' | 'sales_reports' | 'products' | 'categories' | 'coupons' | 'reviews' | 'delivery_zones' | 'settings' | 'users' | 'customers' | 'blacklist' | 'audit_logs' | 'security'
  >(() => (isRestricted ? 'orders' : 'overview'));

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Search & Filter States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

  // Reviews management state
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);

  // Review fields
  const [revCustomerName, setRevCustomerName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revCommentAr, setRevCommentAr] = useState('');
  const [revCommentEn, setRevCommentEn] = useState('');
  const [revCustomerAvatar, setRevCustomerAvatar] = useState('');
  const [revIsApproved, setRevIsApproved] = useState(true);

  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revCustomerName.trim() || !revCommentAr.trim() || !revCommentEn.trim()) {
      alert('الرجاء ملء الحقول الإجبارية');
      return;
    }
    addReview({
      customerName: revCustomerName,
      customerAvatar: revCustomerAvatar || undefined,
      rating: revRating,
      commentAr: revCommentAr,
      commentEn: revCommentEn,
      isApproved: revIsApproved,
    });
    showFeedbackBanner('تمت إضافة رأي العميل بنجاح');
    // reset
    setRevCustomerName('');
    setRevRating(5);
    setRevCommentAr('');
    setRevCommentEn('');
    setRevCustomerAvatar('');
    setRevIsApproved(true);
    setIsAddReviewModalOpen(false);
  };

  const handleEditReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    if (!revCustomerName.trim() || !revCommentAr.trim() || !revCommentEn.trim()) {
      alert('الرجاء ملء الحقول الإجبارية');
      return;
    }
    updateReview(editingReview.id, {
      customerName: revCustomerName,
      customerAvatar: revCustomerAvatar || undefined,
      rating: revRating,
      commentAr: revCommentAr,
      commentEn: revCommentEn,
      isApproved: revIsApproved,
    });
    showFeedbackBanner('تم تعديل رأي العميل بنجاح');
    // reset
    setEditingReview(null);
    setRevCustomerName('');
    setRevRating(5);
    setRevCommentAr('');
    setRevCommentEn('');
    setRevCustomerAvatar('');
    setRevIsApproved(true);
    setIsEditReviewModalOpen(false);
  };

  const openEditReviewModal = (r: CustomerReview) => {
    setEditingReview(r);
    setRevCustomerName(r.customerName);
    setRevRating(r.rating);
    setRevCommentAr(r.commentAr);
    setRevCommentEn(r.commentEn);
    setRevCustomerAvatar(r.customerAvatar || '');
    setRevIsApproved(r.isApproved);
    setIsEditReviewModalOpen(true);
  };

  // POS In-Restaurant Order States
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [posCustomerName, setPosCustomerName] = useState('زبون صالة');
  const [posCustomerPhone, setPosCustomerPhone] = useState('01000000000');
  const [posTableNumber, setPosTableNumber] = useState('1');
  const [posOrderType, setPosOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [posPaymentMethod, setPosPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [posSelectedCategory, setPosSelectedCategory] = useState<string>('all');
  const [posProductSearch, setPosProductSearch] = useState('');

  // POS Product Configuration Modal State
  const [posConfigProduct, setPosConfigProduct] = useState<Product | null>(null);
  const [posConfigSelectedSize, setPosConfigSelectedSize] = useState<ProductSize | undefined>(undefined);
  const [posConfigSelectedAddons, setPosConfigSelectedAddons] = useState<CartItemAddon[]>([]);
  const [posConfigSpecialInstructions, setPosConfigSpecialInstructions] = useState('');
  const [posConfigQty, setPosConfigQty] = useState(1);

  const posCartSubtotal = posCart.reduce((sum, item) => sum + item.totalPrice, 0);
  const posCartTotal = posCartSubtotal;

  const handleAddProductToPos = (prod: Product) => {
    // If product has sizes or allowed add-ons, open configuration modal
    if ((prod.availableSizes && prod.availableSizes.length > 0) || (prod.allowedAddonIds && prod.allowedAddonIds.length > 0)) {
      const defSize = prod.availableSizes?.find(s => s.isDefault) || prod.availableSizes?.[0];
      setPosConfigProduct(prod);
      setPosConfigSelectedSize(defSize);
      setPosConfigSelectedAddons([]);
      setPosConfigSpecialInstructions('');
      setPosConfigQty(1);
    } else {
      // Add directly
      const newItem: CartItem = {
        cartItemId: `${prod.id}-${Date.now()}`,
        productId: prod.id,
        product: prod,
        selectedAddons: [],
        quantity: 1,
        unitPrice: prod.price,
        totalPrice: prod.price,
      };
      setPosCart(prev => [...prev, newItem]);
    }
  };

  const handleConfirmConfiguredProduct = () => {
    if (!posConfigProduct) return;
    const sizeMod = posConfigSelectedSize ? posConfigSelectedSize.priceModifier : 0;
    const addonsSum = posConfigSelectedAddons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = Math.max(0, posConfigProduct.price + sizeMod + addonsSum);
    const totalPrice = unitPrice * posConfigQty;

    const newItem: CartItem = {
      cartItemId: `${posConfigProduct.id}-${Date.now()}-${Math.random()}`,
      productId: posConfigProduct.id,
      product: posConfigProduct,
      selectedSize: posConfigSelectedSize,
      selectedAddons: posConfigSelectedAddons,
      specialInstructions: posConfigSpecialInstructions.trim() || undefined,
      quantity: posConfigQty,
      unitPrice,
      totalPrice,
    };

    setPosCart(prev => [...prev, newItem]);
    setPosConfigProduct(null);
  };

  const handleUpdatePosQty = (cartItemId: string, delta: number) => {
    setPosCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return {
          ...item,
          quantity: newQty,
          totalPrice: item.unitPrice * newQty,
        };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const handlePlacePosOrder = async () => {
    if (posCart.length === 0) {
      alert('يرجى إضافة أصناف إلى الطلب أولاً');
      return;
    }

    const newOrder = await createOrder({
      customer: {
        name: posCustomerName || 'زبون صالة',
        phone: posCustomerPhone || '01000000000',
        addressStreet: posOrderType === 'pickup' ? `طاولة رقم ${posTableNumber} - صالة ومطعم` : 'توصيل سريع - فرع المطعم',
        pickupBranchId: branches[0]?.id || null,
      },
      items: posCart,
      orderType: posOrderType,
      status: 'pending',
      paymentMethod: posPaymentMethod,
      paymentStatus: 'paid',
      subtotal: posCartSubtotal,
      discount: 0,
      deliveryFee: 0,
      tax: 0,
      total: posCartTotal,
      branchId: branches[0]?.id,
      estimatedDeliveryTime: '10-15 دقيقة',
    });

    setActiveReceiptOrder(newOrder);
    setPosCart([]);
    setIsPosModalOpen(false);
  };

  const filteredPosProducts = products.filter(p => {
    const matchesCat = posSelectedCategory === 'all' || p.categoryId === posSelectedCategory;
    const matchesSearch = p.nameAr.toLowerCase().includes(posProductSearch.toLowerCase()) || p.nameEn.toLowerCase().includes(posProductSearch.toLowerCase());
    return matchesCat && matchesSearch && p.isAvailable;
  });

  // Interactive UI states
  const [copiedLink, setCopiedLink] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrdersCount, setLastOrdersCount] = useState(orders.length);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Product Add / Edit Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    price: 120,
    categoryId: categories[0]?.id || '',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    calories: 680,
    isBestSeller: false,
    isAvailable: true,
    isSpicy: false,
  });

  // Category Add Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({
    nameAr: '',
    nameEn: '',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  });

  // Coupon Add Modal state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minOrder: 150,
    isActive: true,
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  // Request notification permission and unlock audio
  const requestNotificationsAndAudio = async () => {
    soundManager.unlockAudio();
    soundManager.playNewOrderAlert();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          showFeedbackBanner('🔔 تم تفعيل إشعارات المتصفح والتنبيه الصوتي بنجاح!');
          new Notification('🍔 تم تفعيل تنبيهات الطلبات بنجاح!', {
            body: 'ستصلك إشعارات فورية ورنين جرس عند وصول أي طلب جديد في المطعم.',
            icon: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=120&h=120&q=80',
          });
        }
      } catch {
        // ignore
      }
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          setNotificationPermission(perm);
        });
      }
    }
  }, []);

  // Listen for real-time order events dispatched across the app / tabs / Firestore
  useEffect(() => {
    console.log('[DASHBOARD] Initializing AdminView listener');
    const handleNewOrderIncoming = (e: Event) => {
      const customEvt = e as CustomEvent<Order>;
      const newOrder = customEvt.detail;
      console.log(`[DASHBOARD] Received frank_new_order_event for ID: ${newOrder?.id}`);
      if (isRestricted || soundEnabled) {
        soundManager.unlockAudio();
        soundManager.playNewOrderAlert();
      }
      if (newOrder) {
        showFeedbackBanner(`🍔 طلب جديد وصل الآن! #${newOrder.id} (${newOrder.total} ج.م)`);
      } else {
        showFeedbackBanner('🍔 تم استلام طلب جديد في النظام!');
      }

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && newOrder) {
        try {
          new Notification(`🍔 طلب جديد #${newOrder.id} - ${newOrder.customer?.name || 'زبون'}`, {
            body: `بقيمة ${newOrder.total} ج.م | ${newOrder.orderType === 'delivery' ? 'توصيل' : 'استلام / صالة'} | اضغط للمعاينة`,
            icon: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=120&h=120&q=80',
            tag: `order-${newOrder.id}`,
          });
        } catch {
          // fallback
        }
      }
    };

    window.addEventListener('frank_new_order_event', handleNewOrderIncoming);
    
    return () => window.removeEventListener('frank_new_order_event', handleNewOrderIncoming);
  }, [soundEnabled, isRestricted]);

  // Handle auto sound notify & Browser Notification on new orders
  useEffect(() => {
    // Consolidated real-time alerts into the event listener above.
    // We just track the length for stats and UI consistency.
    setLastOrdersCount(orders.length);
  }, [orders, lastOrdersCount]);

  const showFeedbackBanner = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleCopyAdminLink = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${window.location.pathname}#admin`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Metrics calculation
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const preparingOrdersCount = orders.filter((o) => o.status === 'preparing' || o.status === 'confirmed').length;
  const outForDeliveryCount = orders.filter((o) => o.status === 'out_for_delivery' || o.status === 'ready').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status filter
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) {
        return false;
      }
      // Type filter
      if (orderTypeFilter !== 'all' && o.orderType !== orderTypeFilter) {
        return false;
      }
      // Search query filter
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.trim().toLowerCase();
        const normQ = normalizePhone(orderSearchQuery) || toEnglishDigits(orderSearchQuery).trim().toLowerCase();
        const matchesId = o.id?.toLowerCase().includes(q) || (normQ && o.id?.toLowerCase().includes(normQ));
        const matchesName = o.customer?.name?.toLowerCase().includes(q);
        const matchesPhone = o.customer?.phone && (
          o.customer.phone.includes(q) ||
          (normQ && o.customer.phone.includes(normQ)) ||
          (normQ && normalizePhone(o.customer.phone).includes(normQ))
        );
        const matchesStreet = o.customer?.addressStreet?.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesPhone && !matchesStreet) {
          return false;
        }
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderTypeFilter, orderSearchQuery]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productCategoryFilter !== 'all' && p.categoryId !== productCategoryFilter) {
        return false;
      }
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.trim().toLowerCase();
        const matchesAr = p.nameAr?.toLowerCase().includes(q);
        const matchesEn = p.nameEn?.toLowerCase().includes(q);
        if (!matchesAr && !matchesEn) return false;
      }
      return true;
    });
  }, [products, productCategoryFilter, productSearchQuery]);

  // Product Actions
  const handleOpenNewProduct = () => {
    setEditingProductId(null);
    setProdForm({
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      price: 120,
      categoryId: categories[0]?.id || '',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      calories: 680,
      isBestSeller: false,
      isAvailable: true,
      isSpicy: false,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProdForm({ ...prod });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.nameAr || !prodForm.price) return;

    if (editingProductId) {
      updateProduct(editingProductId, prodForm);
      showFeedbackBanner('تم تحديث الصنف بنجاح');
    } else {
      addProduct({
        nameAr: prodForm.nameAr || 'صنف جديد',
        nameEn: prodForm.nameEn || prodForm.nameAr || 'New Item',
        descriptionAr: prodForm.descriptionAr || '',
        descriptionEn: prodForm.descriptionEn || '',
        price: Number(prodForm.price) || 100,
        categoryId: prodForm.categoryId || categories[0]?.id || 'burgers',
        image: prodForm.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        calories: Number(prodForm.calories) || 600,
        isBestSeller: Boolean(prodForm.isBestSeller),
        isAvailable: prodForm.isAvailable !== false,
        isSpicy: Boolean(prodForm.isSpicy),
      });
      showFeedbackBanner('تمت إضافة صنف جديد للقائمة');
    }
    setIsProductModalOpen(false);
  };

  // Category Actions
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.nameAr) return;
    addCategory({
      nameAr: catForm.nameAr,
      nameEn: catForm.nameEn || catForm.nameAr,
      image: catForm.image,
    });
    setCatForm({ nameAr: '', nameEn: '', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' });
    setIsCategoryModalOpen(false);
    showFeedbackBanner('تمت إضافة القسم الجديد');
  };

  // Coupon Actions
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue) return;

    addCoupon({
      code: couponForm.code.trim().toUpperCase(),
      discountType: couponForm.discountType || 'percentage',
      discountValue: Number(couponForm.discountValue),
      minOrder: Number(couponForm.minOrder || 0),
      isActive: true,
    });
    setCouponForm({
      code: '',
      discountType: 'percentage',
      discountValue: 15,
      minOrder: 150,
      isActive: true,
    });
    setIsCouponModalOpen(false);
    showFeedbackBanner('تم إنشاء كود الخصم الجديد');
  };

  // Status mapping in Arabic
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'جديد معلق',
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: Clock,
        };
      case 'confirmed':
        return {
          label: 'تم التأكيد',
          bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          icon: CheckCircle2,
        };
      case 'preparing':
        return {
          label: 'قيد التحضير بالمطبخ',
          bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
          icon: ChefHat,
        };
      case 'ready':
        return {
          label: 'جاهز للاستلام',
          bg: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
          icon: CheckCircle2,
        };
      case 'out_for_delivery':
        return {
          label: 'خرج للتوصيل مع المندوب',
          bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          icon: Bike,
        };
      case 'delivered':
        return {
          label: 'تم التسليم بنجاح',
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
        };
      case 'cancelled':
        return {
          label: 'طلب ملغي',
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: X,
        };
      default:
        return {
          label: status,
          bg: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
          icon: Clock,
        };
    }
  };

  const getPaymentMethodNameAr = (method: string) => {
    switch (method) {
      case 'cash_on_delivery':
        return 'نقداً عند الاستلام (كاش)';
      case 'instapay':
        return 'إنستاباي (InstaPay)';
      case 'card_on_delivery':
        return 'بطاقة ائتمان عند الاستلام (POS)';
      case 'vodafone_cash_instapay':
        return 'فودافون كاش / إنستاباي';
      case 'online_card':
        return 'دفع إلكتروني مباشر';
      default:
        return method;
    }
  };

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6 text-start font-sans select-none">
      {/* Dynamic Feedback Banner */}
      {actionSuccessMessage && (
        <div className="fixed top-4 start-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Top Header Bar */}
      <header className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Restaurant Identity & Live Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 justify-between sm:justify-start w-full sm:w-auto">
            <img 
              src="https://res.cloudinary.com/fwxyu7hh/image/upload/v1787696964/Artboard_2_9x.png" 
              alt="Frank Burger" 
              className="h-10 sm:h-12 md:h-16 w-auto object-contain shrink-0"
            />
            
            {/* Real-time Sync Status Indicator & Audio Enabler */}
            <button 
              onClick={() => {
                soundManager.unlockAudio();
                setSoundEnabled(true);
                addToast(language === 'ar' ? 'تم تفعيل التنبيهات الصوتية بنجاح' : 'Audio alerts activated', 'success');
              }}
              title={language === 'ar' ? 'اضغط لتفعيل الصوت' : 'Click to enable sound'}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm transition-all active:scale-95 hover:brightness-95 shrink-0 ${
                syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 cursor-pointer' : 
                syncStatus === 'connecting' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse cursor-wait' : 
                'bg-red-50 text-red-600 border-red-100 cursor-not-allowed'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : syncStatus === 'connecting' ? 'bg-amber-500' : 'bg-red-500'}`} />
              <span>{syncStatus === 'synced' ? (language === 'ar' ? 'متصل (تفعيل الصوت)' : 'LIVE SYNC') : (language === 'ar' ? 'جاري الاتصال' : 'CONNECTING')}</span>
            </button>
          </div>
          
          <div className="text-start sm:border-r sm:border-zinc-200 sm:pr-4">
            {!isRestricted && (
              <>
                <h1 className="text-base sm:text-lg md:text-xl font-black text-zinc-900 font-heading tracking-tight">
                  لوحة تحكم وإدارة المطعم
                </h1>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">
                  لوحة تحكم المسئول الأعلى — {settings.restaurantNameAr}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Controls & User Identity */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start sm:justify-end border-t border-zinc-100 pt-3 md:pt-0 md:border-t-0">
          {/* Active Logged-in User Badge */}
          {adminUser && (
            <div className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-xs shrink-0">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                adminUser.role === 'cashier' ? 'bg-amber-500 text-zinc-950' : 'bg-[#E51E2A] text-white'
              }`}>
                {adminUser.role === 'cashier' ? <ChefHat className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </div>
              <div className="text-start">
                <span className="font-bold text-zinc-900 block leading-tight text-[10px] sm:text-[11px]">{adminUser.name}</span>
                <span className="text-[9px] sm:text-[10px] text-zinc-500 block leading-none font-mono">@{adminUser.username}</span>
              </div>
            </div>
          )}

          {/* Active Shift Status Pill - Cashier Only */}
          {adminUser?.role === 'cashier' && (
            <button
              onClick={() => setActiveTab('shifts')}
              title="إدارة الوردية وتسليم الكاشير"
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border shrink-0 ${
                activeShift
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              {activeShift ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <Unlock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">وردية: {activeShift.cashierName}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-[11px]">فتح وردية كاشير</span>
                </>
              )}
            </button>
          )}

          {/* Sidebar Toggle for Mobile */}
          {!isRestricted && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 rounded-xl px-3 py-2 flex items-center gap-1.5 transition-all cursor-pointer font-bold active:scale-95 shrink-0"
            >
              {isSidebarOpen ? <X className="w-3.5 h-3.5 text-[#E51E2A]" /> : <Menu className="w-3.5 h-3.5 text-[#E51E2A]" />}
              <span className="text-[11px]">{isSidebarOpen ? 'إغلاق' : 'القائمة'}</span>
            </button>
          )}

          <button
            onClick={logoutAdmin}
            title="تسجيل الخروج من لوحة التحكم"
            className="text-xs bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 rounded-xl px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer font-bold shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[11px]">خروج</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout with Sidebar & Content Area */}
      <div className={isRestricted ? 'w-full space-y-6' : 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'}>
        {/* Sidebar Navigation - Only if not restricted */}
        {!isRestricted && (
          <>
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            <aside className={`bg-white p-4 space-y-4 transition-all duration-300 ${
              isSidebarOpen 
                ? 'fixed inset-y-0 right-0 z-[60] w-72 h-screen overflow-y-auto shadow-2xl border-l border-zinc-200 block lg:static lg:col-span-3 lg:h-auto lg:w-auto lg:shadow-sm lg:border lg:rounded-2xl lg:z-0 lg:sticky lg:top-6' 
                : 'hidden lg:block lg:col-span-3 lg:border lg:border-zinc-200 lg:rounded-2xl lg:shadow-sm lg:sticky lg:top-6 lg:h-auto lg:z-0 lg:static'
            }`}>
            <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                قائمة التنقل السريع
              </span>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="space-y-1.5">

            {/* Overview - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer relative ${
                  activeTab === 'overview'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>الرئيسية والإحصائيات</span>
                </div>
                <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'overview' ? 'text-zinc-900' : 'text-zinc-500'}`} />
              </button>
            )}

            {/* Orders Management - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer relative ${
                  activeTab === 'orders'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>إدارة الطلبات الحية</span>
                </div>
                <div className="flex items-center gap-2">
                  {pendingOrdersCount > 0 && (
                    <span className="bg-[#E51E2A] text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm shadow-[#E51E2A]/20">
                      {pendingOrdersCount}
                    </span>
                  )}
                  <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'orders' ? 'text-zinc-900' : 'text-zinc-500'}`} />
                </div>
              </button>
            )}

            {/* Shifts - Super Admin Only (View Reports) */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('shifts');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer relative ${
                  activeTab === 'shifts'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span>تقارير الورديات</span>
                </div>
                <div className="flex items-center gap-2">
                  {activeShift ? (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      activeTab === 'shifts' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      نشطة
                    </span>
                  ) : (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      activeTab === 'shifts' ? 'bg-white/20 text-zinc-900' : 'bg-zinc-200 text-zinc-600'
                    }`}>
                      مغلقة
                    </span>
                  )}
                  <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'shifts' ? 'text-zinc-900' : 'text-zinc-500'}`} />
                </div>
              </button>
            )}

            {/* Sales & Product Popularity Reports - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('sales_reports');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer relative ${
                  activeTab === 'sales_reports'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>تقارير المبيعات والأصناف</span>
                </div>
                <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'sales_reports' ? 'text-zinc-900' : 'text-zinc-500'}`} />
              </button>
            )}

            {/* Products - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('products');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="w-4 h-4 shrink-0" />
                  <span>قائمة الطعام والأسعار</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    activeTab === 'products' ? 'bg-white/20 text-zinc-900' : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {products.length}
                  </span>
                  <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'products' ? 'text-zinc-900' : 'text-zinc-500'}`} />
                </div>
              </button>
            )}

            {/* Categories - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('categories');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'categories'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>أقسام المنيو</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    activeTab === 'categories' ? 'bg-white/20 text-zinc-900' : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {categories.length}
                  </span>
                  <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'categories' ? 'text-zinc-900' : 'text-zinc-500'}`} />
                </div>
              </button>
            )}

            {/* Coupons - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('coupons');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'coupons'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Percent className="w-4 h-4 shrink-0" />
                  <span>كوبونات الخصم</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    activeTab === 'coupons' ? 'bg-white/20 text-zinc-900' : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {coupons.length}
                  </span>
                  <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'coupons' ? 'text-zinc-900' : 'text-zinc-500'}`} />
                </div>
              </button>
            )}

            {/* Reviews - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('reviews');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 shrink-0" />
                  <span>تقييمات وآراء العملاء</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    activeTab === 'reviews' ? 'bg-white/20 text-zinc-900' : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {reviews.length}
                  </span>
                  <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'reviews' ? 'text-zinc-900' : 'text-zinc-500'}`} />
                </div>
              </button>
            )}

            {/* Delivery Zones - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('delivery_zones');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'delivery_zones'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bike className="w-4 h-4 shrink-0" />
                  <span>مناطق وأسعار التوصيل</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    activeTab === 'delivery_zones' ? 'bg-white/20 text-zinc-900' : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {deliveryZones.length}
                  </span>
                  <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'delivery_zones' ? 'text-zinc-900' : 'text-zinc-500'}`} />
                </div>
              </button>
            )}

            {/* Settings - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>إعدادات المطعم والفروع</span>
                </div>
                <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'settings' ? 'text-zinc-900' : 'text-zinc-500'}`} />
              </button>
            )}

            {/* Users Management - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('users');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCog className="w-4 h-4 shrink-0" />
                  <span>حسابات موظفي لوحة التحكم</span>
                </div>
                <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'users' ? 'text-zinc-900' : 'text-zinc-500'}`} />
              </button>
            )}

            {/* Customers Management - Super Admin & Cashier */}
            <button
              onClick={() => {
                setActiveTab('customers');
                setIsSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-[#E51E2A] text-white shadow-md'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>قائمة العملاء والزبائن</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  activeTab === 'customers' ? 'bg-white/20 text-zinc-900' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {registeredCustomers?.length || 0}
                </span>
                <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'customers' ? 'text-zinc-900' : 'text-zinc-500'}`} />
              </div>
            </button>

            {/* Blacklist Management - Super Admin & Cashier */}
            <button
              onClick={() => {
                setActiveTab('blacklist');
                setIsSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'blacklist'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserX className="w-4 h-4 shrink-0 text-rose-500" />
                <span>القائمة السوداء (Blacklist)</span>
              </div>
              <div className="flex items-center gap-2">
                {blacklist.length > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    activeTab === 'blacklist' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {blacklist.length}
                  </span>
                )}
                <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'blacklist' ? 'text-zinc-900' : 'text-zinc-500'}`} />
              </div>
            </button>

            {/* Audit Logs - Super Admin Only */}
            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('audit_logs');
                  setIsSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'audit_logs'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>سجلات الأمان والتدقيق</span>
                </div>
                <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'audit_logs' ? 'text-zinc-900' : 'text-zinc-500'}`} />
              </button>
            )}

            {/* Security & 2FA Settings - Available for all */}
            <button
              onClick={() => {
                setActiveTab('security');
                setIsSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#E51E2A] text-white shadow-md'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 shrink-0" />
                <span>الأمان والتحقق بخطوتين (2FA)</span>
              </div>
              <ChevronLeft className={`w-3.5 h-3.5 ${activeTab === 'security' ? 'text-zinc-900' : 'text-zinc-500'}`} />
            </button>
          </nav>

          {/* Role Helper Info Box */}
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-1">
            <div className="font-bold text-zinc-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#E51E2A]" />
              <span>صلاحيات الحساب</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              {adminUser?.role === 'cashier' 
                ? 'أنت مسجل كـ "كاشير ومسئول طلبات". مهامك مقتصرة على متابعة الطلبات الحية، تجهيزها، وإرسال تحديثات الحالة للعملاء أولاً بأول.'
                : 'أنت مسجل كـ "المسئول الأعلى". لديك صلاحيات كاملة لإدارة المنيو، الأسعار، الإحصائيات، الكوبونات، والإعدادات.'}
            </p>
          </div>
        </aside>
      </>
    )}

        {/* Main Content Area */}
        <main className={isRestricted ? 'w-full space-y-6' : 'lg:col-span-9 space-y-6'}>
          {/* Cashier Top Navigation Bar - for Cashier user role */}
          {isRestricted && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-2 flex items-center gap-2 shadow-sm">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>شاشة الطلبات الحية (POS / KDS)</span>
                {pendingOrdersCount > 0 && (
                  <span className="bg-white text-[#E51E2A] text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('shifts')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'shifts'
                    ? 'bg-[#E51E2A] text-white shadow-md'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>إدارة الوردية وتسليم الكاشير</span>
                {activeShift ? (
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    نشطة
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    مغلقة
                  </span>
                )}
              </button>
            </div>
          )}

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & PERFORMANCE STATS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Revenue */}
            <div className="bg-white border border-zinc-200 p-4 rounded-2xl space-y-2 shadow-md relative overflow-hidden">
              <div className="flex justify-between items-center text-zinc-500 text-xs font-semibold">
                <span>إجمالي المبيعات النشطة</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 font-mono flex items-baseline gap-1.5">
                <span>{totalRevenue.toLocaleString()}</span>
                <span className="text-xs text-[#E51E2A] font-sans font-bold">جنيه مصري</span>
              </div>
              <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>شامل كافة الطلبات المكتملة والحالية</span>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white border border-zinc-200 p-4 rounded-2xl space-y-2 shadow-md relative overflow-hidden">
              <div className="flex justify-between items-center text-zinc-500 text-xs font-semibold">
                <span>إجمالي عدد الطلبات</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 font-mono flex items-baseline gap-1.5">
                <span>{totalOrdersCount}</span>
                <span className="text-xs text-zinc-500 font-sans font-normal">طلب</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                <span className="text-blue-400 font-bold">{preparingOrdersCount + outForDeliveryCount}</span> قيد التنفيذ والتوصيل حالياً
              </div>
            </div>

            {/* Pending Orders */}
            <div className="bg-white border border-zinc-200 p-4 rounded-2xl space-y-2 shadow-md relative overflow-hidden">
              <div className="flex justify-between items-center text-zinc-500 text-xs font-semibold">
                <span>طلبات جديدة بانتظار التأكيد</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono flex items-baseline gap-1.5">
                <span>{pendingOrdersCount}</span>
                <span className="text-xs text-amber-500/80 font-sans font-bold">جديد</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                {pendingOrdersCount > 0 ? (
                  <span className="text-amber-400 font-bold animate-pulse">يرجى قبول وتأكيد الطلبات فوراً</span>
                ) : (
                  <span className="text-emerald-400">تمت معالجة جميع الطلبات الواردة</span>
                )}
              </div>
            </div>

            {/* Average Basket Value */}
            <div className="bg-white border border-zinc-200 p-4 rounded-2xl space-y-2 shadow-md relative overflow-hidden">
              <div className="flex justify-between items-center text-zinc-500 text-xs font-semibold">
                <span>متوسط قيمة الفاتورة</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 font-mono flex items-baseline gap-1.5">
                <span>{avgOrderValue}</span>
                <span className="text-xs text-[#E51E2A] font-sans font-bold">جنيه / طلب</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                معدل إنفاق العميل للوجبة الواحدة
              </div>
            </div>
          </div>

          {/* Quick Actions Shortcuts Grid */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>إجراءات سريعة ومباشرة</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setOrderStatusFilter('pending');
                }}
                className="p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-start transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-zinc-900 group-hover:text-amber-400 transition-colors">
                  مراجعة الطلبات المعلقة
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                  {pendingOrdersCount} طلب بانتظار التأكيد
                </div>
              </button>

              <button
                onClick={handleOpenNewProduct}
                className="p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-start transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#E51E2A]/15 text-[#E51E2A] flex items-center justify-center mb-2">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-zinc-900 group-hover:text-[#E51E2A] transition-colors">
                  إضافة صنف جديد للمنيو
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  تحديد السعر والصورة والوصف
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('coupons');
                  setIsCouponModalOpen(true);
                }}
                className="p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-start transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2">
                  <Percent className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-zinc-900 group-hover:text-purple-400 transition-colors">
                  إنشاء كود خصم جديد
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  حملات ترويجية للعملاء
                </div>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className="p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-start transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2">
                  <Settings className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-zinc-900 group-hover:text-blue-400 transition-colors">
                  تعديل أرقام الفرع وساعات العمل
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  الواتساب، الفروع، والضريبة
                </div>
              </button>

              <button
                onClick={() => setActiveTab('sales_reports')}
                className="p-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/60 border border-emerald-200 text-start transition-all cursor-pointer group col-span-1 sm:col-span-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    جديد 📊
                  </span>
                </div>
                <div className="text-xs font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                  إجمالي المبيعات وترتيب الأصناف (الأكثر والأقل طلباً)
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  احتساب صافي المبيعات بدون رسوم التوصيل وتحديد فترات زمنية مخصصة
                </div>
              </button>

              <button
                onClick={() => setActiveTab('blacklist')}
                className="p-3 rounded-xl bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200 text-start transition-all cursor-pointer group col-span-1 sm:col-span-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                    <UserX className="w-4 h-4" />
                  </div>
                  {blacklist.length > 0 && (
                    <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      {blacklist.length} أرقام محظورة
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-zinc-900 group-hover:text-rose-700 transition-colors">
                  إدارة القائمة السوداء (Blacklist)
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  حظر الأرقام المسيئة ومنع استقبال الطلبات الوهمية
                </div>
              </button>
            </div>
          </div>

          {/* Peak Hours Statistical Chart */}
          <PeakHoursChart orders={orders} />

          {/* Recent Orders Live Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 font-heading">
                  أحدث الطلبات الواردة للمطعم
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-500 font-mono">
                  {orders.length} طلب إجمالي
                </span>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs text-[#E51E2A] hover:underline font-bold cursor-pointer"
              >
                عرض كافة الطلبات ←
              </button>
            </div>

            <div className="divide-y divide-[#202028]">
              {orders.slice(0, 5).map((o) => {
                const badge = getStatusBadge(o.status);
                const BadgeIcon = badge.icon;
                return (
                  <div key={o.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-zinc-900 text-sm">#{o.id}</span>
                        <span className="font-bold text-zinc-900">{o.customer?.name || 'عميل'}</span>
                        <span className="text-zinc-500 text-[11px]" dir="ltr">
                          {o.customer?.phone || ''}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            o.orderType === 'delivery'
                              ? 'bg-blue-500/15 text-blue-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {o.orderType === 'delivery' ? 'توصيل منزلي 🛵' : 'استلام من الفرع 🏬'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                        <span>{o.items.length} أصناف</span>
                        <span>•</span>
                        <span>{new Date(o.orderDate).toLocaleTimeString('ar-EG')}</span>
                        <span>•</span>
                        <span className="text-zinc-500 truncate max-w-[200px]">
                          {o.customer?.addressStreet || 'استلام فرع'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-end">
                        <div className="font-mono font-black text-zinc-900 text-sm">
                          {o.products_total ?? (o.deliveryFee > 0 && o.total > o.deliveryFee ? o.total - o.deliveryFee : o.total)} <span className="text-[10px] text-[#E51E2A] font-sans">ج.م</span>
                        </div>
                        {o.deliveryFee > 0 && (
                          <div className="text-[10px] text-zinc-500 font-mono font-semibold">
                            + {o.deliveryFee} ج توصيل
                          </div>
                        )}
                        <div className="text-[10px] text-zinc-500">
                          {getPaymentMethodNameAr(o.paymentMethod)}
                        </div>
                      </div>

                      <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${badge.bg}`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </div>

                      <button
                        onClick={() => setActiveReceiptOrder(o)}
                        title="طباعة إيصال حراري للطلب"
                        className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-900 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE ORDERS MANAGEMENT (KDS & POS) */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* POS In-Store Order Button Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-2xl p-4 shadow-md">
            <div>
              <h3 className="font-black text-sm text-zinc-900">إدارة الطلبات الحية (KDS / POS)</h3>
              <p className="text-xs text-zinc-500">متابعة الطلبات، الحالات، وتسجيل طلبات الزبائن داخل المطعم مع الطباعة الفورية</p>
            </div>
            <button
              onClick={() => setIsPosModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#E51E2A]/25 cursor-pointer shrink-0 transition-all"
            >
              <span>➕ طلب جديد (POS مطعم)</span>
            </button>
          </div>

          {/* Top Search & Filter Bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-3.5 shadow-md">
            {/* Search Input and Type filter */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-zinc-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="ابحث برقم الطلب (مثال FB-1234) أو اسم العميل أو رقم الهاتف..."
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-[#E51E2A] rounded-xl py-2.5 ps-10 pe-3 text-xs sm:text-sm text-zinc-900 placeholder-zinc-500 outline-none transition-all"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Order Type Toggle */}
              <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200 shrink-0">
                <button
                  onClick={() => setOrderTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    orderTypeFilter === 'all' ? 'bg-[#E51E2A] text-white' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  الكل ({orders.length})
                </button>
                <button
                  onClick={() => setOrderTypeFilter('delivery')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    orderTypeFilter === 'delivery' ? 'bg-blue-600 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  توصيل 🛵 ({orders.filter((o) => o.orderType === 'delivery').length})
                </button>
                <button
                  onClick={() => setOrderTypeFilter('pickup')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    orderTypeFilter === 'pickup' ? 'bg-amber-600 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  استلام فرع 🏬 ({orders.filter((o) => o.orderType === 'pickup').length})
                </button>
              </div>
            </div>

            {/* Status Pills with Quick Count Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'كافة الطلبات', count: orders.length },
                { id: 'pending', label: 'معلق جديد', count: pendingOrdersCount, alert: pendingOrdersCount > 0 },
                { id: 'confirmed', label: 'تم التأكيد', count: orders.filter((o) => o.status === 'confirmed').length },
                { id: 'preparing', label: 'قيد التحضير بالمطبخ', count: orders.filter((o) => o.status === 'preparing').length },
                { id: 'out_for_delivery', label: 'خرج للتوصيل', count: orders.filter((o) => o.status === 'out_for_delivery').length },
                { id: 'delivered', label: 'تم التسليم', count: deliveredCount },
                { id: 'cancelled', label: 'ملغي', count: orders.filter((o) => o.status === 'cancelled').length },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderStatusFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderStatusFilter === f.id
                      ? 'bg-[#E51E2A] text-white shadow-md shadow-[#E51E2A]/20'
                      : 'bg-zinc-50 text-zinc-500 hover:text-zinc-900 border border-zinc-200'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      f.alert
                        ? 'bg-amber-400 text-black font-black animate-pulse'
                        : orderStatusFilter === f.id
                        ? 'bg-zinc-900/30 text-zinc-900'
                        : 'bg-zinc-200 text-zinc-500'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtered Orders List */}
          <div className="space-y-3.5">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl text-zinc-500 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                <div className="text-sm font-bold text-zinc-900">لا توجد طلبات تطابق الفلتر أو البحث حالياً</div>
                <div className="text-xs text-zinc-500">جرب تغيير حالة الفلتر أو البحث باسم آخر</div>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                const BadgeIcon = badge.icon;
                const orderMinutesAgo = Math.floor((Date.now() - new Date(order.orderDate).getTime()) / 60000);
                const isDelayed = order.status !== 'delivered' && order.status !== 'cancelled' && orderMinutesAgo > 30;

                return (
                  <div
                    key={order.id}
                    className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg transition-all ${
                      order.status === 'pending'
                        ? 'border-amber-500/50 bg-amber-50/50'
                        : isDelayed
                        ? 'border-rose-500/40 bg-rose-50/50'
                        : 'border-zinc-200'
                    }`}
                  >
                    {/* Header Row: Order ID, Type, Date, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#22222a]">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-base font-black text-zinc-900 font-mono bg-white border border-zinc-200 px-2.5 py-1 rounded-xl">
                          #{order.id}
                        </span>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 ${
                            order.orderType === 'delivery'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {order.orderType === 'delivery' ? (
                            <>
                              <Bike className="w-3.5 h-3.5" />
                              <span>توصيل للمنزل</span>
                            </>
                          ) : (
                            <>
                              <Store className="w-3.5 h-3.5" />
                              <span>استلام من الفرع</span>
                            </>
                          )}
                        </span>

                        <div className="text-xs text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{new Date(order.orderDate).toLocaleTimeString('ar-EG')}</span>
                          <span className="text-zinc-500 font-mono text-[11px]">
                            (منذ {orderMinutesAgo} دقيقة)
                          </span>
                        </div>

                        {order.cashierName && (
                          <span className="text-xs px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 bg-zinc-100 text-zinc-700 border border-zinc-200">
                            <ChefHat className="w-3 h-3 text-amber-600" />
                            <span>كاشير: {order.cashierName}</span>
                          </span>
                        )}

                        {isDelayed && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>تنبيه: متأخر</span>
                          </span>
                        )}
                      </div>

                      {/* Print Thermal Receipt & Quick Status Selector */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setActiveReceiptOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-zinc-500" />
                          <span>طباعة بون</span>
                        </button>

                        <select
                          value={order.status}
                          onChange={(e) => {
                            updateOrderStatus(order.id, e.target.value as OrderStatus);
                            showFeedbackBanner(`تم تحديث حالة الطلب #${order.id}`);
                          }}
                          className="bg-white text-xs font-bold text-zinc-900 border border-zinc-200 rounded-xl py-1.5 px-3 focus:outline-none focus:border-[#E51E2A] cursor-pointer"
                        >
                          <option value="pending">معلق جديد ⏳</option>
                          <option value="confirmed">تم التأكيد ✓</option>
                          <option value="preparing">قيد التحضير بالمطبخ 👨‍🍳</option>
                          <option value="ready">جاهز للاستلام 📦</option>
                          <option value="out_for_delivery">خرج للتوصيل 🛵</option>
                          <option value="delivered">تم التسليم بنجاح 🎉</option>
                          <option value="cancelled">ملغي ❌</option>
                        </select>
                      </div>
                    </div>

                    {/* Customer & Address Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 text-xs">
                      {/* Customer Name */}
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-semibold mb-0.5">اسم العميل:</span>
                        <div className="font-bold text-zinc-900 text-sm">
                          {order.customer?.name || 'عميل غير مسجل'}
                        </div>
                      </div>

                      {/* Phone & Instant WhatsApp & Blacklist Action */}
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-semibold mb-0.5">رقم الهاتف والتواصل:</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <a
                            href={`tel:${order.customer?.phone || ''}`}
                            className="text-[#E51E2A] hover:underline font-mono font-bold flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-zinc-200"
                          >
                            <PhoneCall className="w-3 h-3 text-[#E51E2A]" />
                            <span dir="ltr">{order.customer?.phone || ''}</span>
                          </a>

                          {order.customer?.phone && (
                            <a
                              href={`https://wa.me/20${order.customer.phone.replace(/^0+/, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="محادثة واتساب سريعة"
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {order.customer?.phone && (
                            isPhoneBlacklisted(order.customer.phone) ? (
                              <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded border border-rose-200">
                                🚫 محظور
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (order.customer?.phone && window.confirm(`هل أنت متأكد من حظر رقم ${order.customer.phone} وإضافته للقائمة السوداء؟`)) {
                                    addToBlacklist(order.customer.phone, 'طلب وهمي / ملغي من لوحة التحكم', order.customer.name);
                                  }
                                }}
                                title="حظر هذا الرقم لمنع الطلبات الوهمية"
                                className="px-1.5 py-0.5 rounded-md text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-[10px] font-bold border border-zinc-200 bg-white flex items-center gap-1 cursor-pointer"
                              >
                                <UserX className="w-3 h-3 text-rose-500" />
                                <span>حظر</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Address & Delivery Notes */}
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-semibold mb-0.5">
                          {order.orderType === 'delivery' ? 'عنوان التوصيل:' : 'فرع الاستلام:'}
                        </span>
                        <div className="text-zinc-900 font-medium">
                          {order.orderType === 'delivery' ? (
                            <>
                              <span className="block truncate">{order.customer?.addressStreet || 'العنوان غير محدد'}</span>
                              {order.customer?.addressBuilding && (
                                <span className="text-zinc-500 text-[11px] block">
                                  عمارة: {order.customer.addressBuilding} {order.customer.addressFloor ? `• طابق: ${order.customer.addressFloor}` : ''}
                                </span>
                              )}
                              {order.customer?.addressNotes && (
                                <span className="text-amber-400 text-[10px] block mt-0.5">
                                  ملاحظة: {order.customer.addressNotes}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-amber-400 font-bold">استلام مباشر من الفرع</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div className="space-y-1.5 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                      <div className="text-[11px] font-bold text-zinc-500 mb-1 border-b border-[#22222a] pb-1 flex justify-between">
                        <span>الأصناف المطلوبة ({order.items.length})</span>
                        <span>السعر الإجمالي</span>
                      </div>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs text-zinc-900">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="w-5 h-5 rounded-md bg-[#E51E2A]/20 text-[#E51E2A] flex items-center justify-center font-mono text-[11px]">
                                {item.quantity}x
                              </span>
                              <span>{item.product?.nameAr || 'صنف'}</span>
                              {item.selectedSize && (
                                <span className="text-zinc-500 text-[11px] font-normal">
                                  ({item.selectedSize.nameAr})
                                </span>
                              )}
                            </div>

                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              <div className="text-[11px] text-zinc-500 ps-6">
                                + إضافات: {item.selectedAddons.map((a) => a.nameAr).join('، ')}
                              </div>
                            )}

                            {item.specialInstructions && (
                              <div className="text-[10px] text-amber-400 ps-6 italic">
                                ملاحظة خاصة: "{item.specialInstructions}"
                              </div>
                            )}
                          </div>

                          <span className="font-mono font-bold text-zinc-900">
                            {item.totalPrice} <span className="text-[10px] text-zinc-500">ج.م</span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Financials & Stage Advancer Buttons */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                      {/* Financials Summary */}
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-zinc-500 text-[10px] block">طريقة الدفع:</span>
                          <span className="font-bold text-zinc-900">
                            {getPaymentMethodNameAr(order.paymentMethod)}
                          </span>
                        </div>

                        {order.paymentProofUrl && (
                          <>
                            <div className="h-6 w-px bg-[#262630]" />
                            <div>
                              <span className="text-zinc-500 text-[10px] block">إيصال التحويل:</span>
                              <button
                                onClick={() => {
                                  const win = window.open();
                                  if (win) {
                                    win.document.write(`<img src="${order.paymentProofUrl}" style="max-width:100%; height:auto;" />`);
                                  }
                                }}
                                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                              >
                                عرض إيصال إنستاباي 📸
                              </button>
                            </div>
                          </>
                        )}

                        <div className="h-6 w-px bg-zinc-200" />

                        <div>
                          <span className="text-zinc-500 text-[10px] block">قيمة المنتجات:</span>
                          <span className="text-sm font-bold text-zinc-900 font-mono">
                            {order.products_total ?? (order.deliveryFee > 0 && order.total > order.deliveryFee ? order.total - order.deliveryFee : order.total)} <span className="text-[10px] text-zinc-500 font-sans">ج</span>
                          </span>
                        </div>

                        {order.deliveryFee > 0 && (
                          <>
                            <div className="h-6 w-px bg-zinc-200" />
                            <div>
                              <span className="text-zinc-500 text-[10px] block">خدمة التوصيل:</span>
                              <span className="text-sm font-bold text-blue-600 font-mono">
                                + {order.deliveryFee} <span className="text-[10px] text-zinc-500 font-sans">ج</span>
                              </span>
                            </div>
                          </>
                        )}

                        <div className="h-6 w-px bg-zinc-200" />

                        <div>
                          <span className="text-zinc-500 text-[10px] block font-bold">الإجمالي للتحصيل:</span>
                          <span className="text-base font-black text-zinc-900 font-mono">
                            {(order.products_total ?? (order.deliveryFee > 0 && order.total > order.deliveryFee ? order.total - order.deliveryFee : order.total)) + (order.deliveryFee || 0)} <span className="text-xs text-[#E51E2A] font-sans font-bold">جنيه</span>
                          </span>
                        </div>
                      </div>

                      {/* 1-Click Fast Stage Advance Workflow */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => {
                              updateOrderStatus(order.id, 'confirmed');
                              showFeedbackBanner(`تم تأكيد الطلب #${order.id}`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-zinc-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>قبول وتأكيد الطلب</span>
                          </button>
                        )}

                        {(order.status === 'pending' || order.status === 'confirmed') && (
                          <button
                            onClick={() => {
                              updateOrderStatus(order.id, 'preparing');
                              showFeedbackBanner(`تم تحويل الطلب #${order.id} للمطبخ`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-zinc-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>بدء التحضير بالمطبخ</span>
                          </button>
                        )}

                        {order.status === 'preparing' && order.orderType === 'delivery' && (
                          <button
                            onClick={() => {
                              updateOrderStatus(order.id, 'out_for_delivery');
                              showFeedbackBanner(`الطلب #${order.id} خرج مع المندوب للتوصيل`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-zinc-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>تسليم للمندوب (خروج للتوصيل)</span>
                          </button>
                        )}

                        {order.status === 'preparing' && order.orderType === 'pickup' && (
                          <button
                            onClick={() => {
                              updateOrderStatus(order.id, 'ready');
                              showFeedbackBanner(`الطلب #${order.id} جاهز للاستلام بالفرع`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-zinc-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>جاهز للاستلام بالفرع</span>
                          </button>
                        )}

                        {(order.status === 'out_for_delivery' || order.status === 'ready') && (
                          <button
                            onClick={() => {
                              updateOrderStatus(order.id, 'delivered');
                              showFeedbackBanner(`تم تسليم الطلب #${order.id} بنجاح`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تم التسليم بنجاح</span>
                          </button>
                        )}

                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من رغبتك في إلغاء الطلب #${order.id}؟`)) {
                                updateOrderStatus(order.id, 'cancelled');
                                showFeedbackBanner(`تم إلغاء الطلب #${order.id}`);
                              }
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                          >
                            إلغاء الطلب
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من رغبتك في حذف الطلب #${order.id} نهائياً؟`)) {
                              deleteOrder(order.id);
                              showFeedbackBanner(`تم حذف الطلب #${order.id}`);
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-rose-50 text-zinc-700 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                          title="حذف الطلب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: SHIFTS & CASHIER HANDOVER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'shifts' && (
        <ShiftManagementView />
      )}

      {/* ========================================================================= */}
      {/* TAB: SALES REPORTS & PRODUCT POPULARITY RANKING */}
      {/* ========================================================================= */}
      {activeTab === 'sales_reports' && (
        <SalesAnalyticsView />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRODUCTS & MENU MANAGER */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Top Bar: Search, Category Filter, Add Button */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="ابحث عن صنف بالاسم..."
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-[#E51E2A] rounded-xl py-2 ps-10 pe-3 text-xs sm:text-sm text-zinc-900 placeholder-zinc-500 outline-none transition-all"
              />
            </div>

            {/* Category Select Filter */}
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#E51E2A] cursor-pointer shrink-0"
            >
              <option value="all">كافة الأقسام ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr} ({products.filter((p) => p.categoryId === c.id).length})
                </option>
              ))}
            </select>

            {/* Add New Product Button */}
            <button
              onClick={handleOpenNewProduct}
              className="px-4 py-2 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-lg shadow-[#E51E2A]/25"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد</span>
            </button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredProducts.map((p) => {
              const cat = categories.find((c) => c.id === p.categoryId);
              return (
                <div
                  key={p.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-3.5 flex gap-3.5 items-center justify-between shadow-md hover:border-[#383846] transition-all"
                >
                  {/* Product Image */}
                  <img
                    src={p.image}
                    alt={p.nameAr}
                    className="w-16 h-16 rounded-xl object-cover bg-zinc-900 shrink-0 border border-zinc-200"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 truncate font-heading">
                        {p.nameAr}
                      </h4>
                      {p.isBestSeller && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 shrink-0">
                          أكثر طلباً
                        </span>
                      )}
                      {p.isSpicy && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-bold shrink-0">
                          🌶️ حار
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-zinc-500 truncate">
                      {cat?.nameAr || 'قسم عام'} • {p.calories || 600} سعرة
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs font-mono font-black text-[#E51E2A]">
                        {p.price} <span className="text-[10px] font-sans font-normal text-zinc-500">جنيه</span>
                      </div>

                      {/* Stock Switch */}
                      <button
                        onClick={() => {
                          toggleProductAvailability(p.id);
                          showFeedbackBanner(
                            p.isAvailable ? `تم تحديد الصنف "${p.nameAr}" كغير متوفر` : `تم تحديد الصنف "${p.nameAr}" كمتوفر`
                          );
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer border ${
                          p.isAvailable
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                        }`}
                      >
                        {p.isAvailable ? 'متوفر بالمطبخ' : 'نفد المخزون'}
                      </button>
                    </div>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex flex-col gap-1.5 shrink-0 border-s border-[#22222a] ps-2.5">
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      title="تعديل بيانات وسعر الصنف"
                      className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف الصنف "${p.nameAr}"؟`)) {
                          deleteProduct(p.id);
                          showFeedbackBanner('تم حذف الصنف من المنيو');
                        }
                      }}
                      title="حذف الصنف نهائياً"
                      className="p-2 rounded-xl bg-zinc-50 hover:bg-rose-900/30 text-zinc-500 hover:text-rose-400 border border-zinc-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CATEGORIES */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-2xl p-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 font-heading">
                أقسام قائمة الطعام (Categories)
              </h2>
              <p className="text-xs text-zinc-500">
                تنظيم وجبات وأصناف المنيو في أقسام مريحة للعميل
              </p>
            </div>

            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="p-4 bg-white border border-zinc-200 rounded-2xl flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={cat.image}
                      alt={cat.nameAr}
                      className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-zinc-200"
                    />
                    <div>
                      <div className="text-sm font-bold text-zinc-900">{cat.nameAr}</div>
                      <div className="text-xs text-zinc-500 font-sans">{cat.nameEn}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-white text-zinc-700 px-2.5 py-1 rounded-xl border border-zinc-200">
                      {count} صنف
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف قسم "${cat.nameAr}"؟`)) {
                          deleteCategory(cat.id);
                          showFeedbackBanner('تم حذف القسم');
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: COUPONS */}
      {/* ========================================================================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-2xl p-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 font-heading">
                كوبونات وأكواد الخصم الترويجية
              </h2>
              <p className="text-xs text-zinc-500">
                إنشاء عروض ترويجية ونسب خصم لتشجيع العملاء
              </p>
            </div>

            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء كود خصم جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-white border border-zinc-200 rounded-2xl flex items-center justify-between gap-3 shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-mono font-black text-[#E51E2A] bg-amber-50 border border-[#E51E2A]/30 px-2 py-0.5 rounded-lg">
                      {c.code}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(c.code);
                        showFeedbackBanner(`تم نسخ الكود ${c.code}`);
                      }}
                      className="text-zinc-500 hover:text-zinc-900 p-1 cursor-pointer"
                      title="نسخ الكود"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-zinc-900 font-bold">
                    {c.discountType === 'percentage'
                      ? `خصم ${c.discountValue}% من الإجمالي`
                      : `خصم مباشر ${c.discountValue} جنيه`}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    الحد الأدنى للطلب: {c.minOrder || 0} جنيه
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => {
                      updateCoupon(c.id, { isActive: !c.isActive });
                      showFeedbackBanner(c.isActive ? 'تم تعطيل الكود' : 'تم تفعيل الكود');
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-lg font-bold cursor-pointer ${
                      c.isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}
                  >
                    {c.isActive ? 'مفعل وشغال' : 'معطل مؤقتاً'}
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`هل أنت متأكد من حذف كود الخصم "${c.code}"؟`)) {
                        deleteCoupon(c.id);
                        showFeedbackBanner('تم حذف الكود');
                      }
                    }}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: REVIEWS MODERATION */}
      {/* ========================================================================= */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-zinc-900 font-heading">
                مراجعة تقييمات وآراء العملاء
              </h2>
              <p className="text-xs text-zinc-500">
                الموافقة على آراء العملاء لعرضها على واجهة المتجر الرئيسية أو إضافة آراء يدوية
              </p>
            </div>
            <button
              onClick={() => {
                setRevCustomerName('');
                setRevRating(5);
                setRevCommentAr('');
                setRevCommentEn('');
                setRevCustomerAvatar('');
                setRevIsApproved(true);
                setIsAddReviewModalOpen(true);
              }}
              className="px-4 py-2 bg-[#E51E2A] text-white text-xs font-bold rounded-xl hover:bg-[#c41520] transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-center font-heading"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة رأي جديد</span>
            </button>
          </div>

          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="p-4 bg-white border border-zinc-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {r.customerAvatar && (
                      <img src={r.customerAvatar} alt={r.customerName} className="w-6 h-6 rounded-full object-cover" />
                    )}
                    <span className="font-bold text-zinc-900 text-sm">{r.customerName}</span>
                    <div className="flex text-amber-400">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">{r.date}</span>
                  </div>
                  <div className="space-y-1 mt-1 text-xs">
                    <p className="text-zinc-700 italic"><span className="text-[10px] text-zinc-400 mr-1 font-sans">AR:</span> "{r.commentAr}"</p>
                    <p className="text-zinc-500 italic"><span className="text-[10px] text-zinc-400 mr-1 font-sans">EN:</span> "{r.commentEn}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={() => {
                      toggleApproveReview(r.id);
                      showFeedbackBanner(r.isApproved ? 'تم إخفاء التقييم' : 'تمت الموافقة ونشر التقييم');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      r.isApproved
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:text-zinc-900'
                    }`}
                  >
                    {r.isApproved ? 'معروض بالمتجر ✓' : 'مخفي (انقر للموافقة)'}
                  </button>

                  <button
                    onClick={() => openEditReviewModal(r)}
                    className="p-2 text-zinc-500 hover:text-blue-500 cursor-pointer rounded-xl bg-zinc-50 border border-zinc-200"
                    title="تعديل الرأي"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
                        deleteReview(r.id);
                        showFeedbackBanner('تم حذف التقييم');
                      }
                    }}
                    className="p-2 text-zinc-500 hover:text-rose-400 cursor-pointer rounded-xl bg-zinc-50 border border-zinc-200"
                    title="حذف الرأي"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Review Modal */}
          {isAddReviewModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
              <div className="bg-white border border-zinc-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-lg font-black text-zinc-900 font-heading mb-4">
                  إضافة رأي عميل جديد
                </h3>
                <form onSubmit={handleAddReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">اسم العميل *</label>
                    <input
                      type="text"
                      required
                      value={revCustomerName}
                      onChange={(e) => setRevCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E51E2A] text-zinc-800"
                      placeholder="مثال: أحمد محمد"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">رابط صورة العميل (اختياري)</label>
                    <input
                      type="url"
                      value={revCustomerAvatar}
                      onChange={(e) => setRevCustomerAvatar(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E51E2A] text-zinc-800"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">التقييم (عدد النجوم) *</label>
                    <select
                      value={revRating}
                      onChange={(e) => setRevRating(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E51E2A] text-zinc-800"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 نجوم)</option>
                      <option value="4">⭐⭐⭐⭐ (4 نجوم)</option>
                      <option value="3">⭐⭐⭐ (3 نجوم)</option>
                      <option value="2">⭐⭐ (نجمتان)</option>
                      <option value="1">⭐ (نجمة واحدة)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">التعليق باللغة العربية *</label>
                    <textarea
                      required
                      rows={3}
                      value={revCommentAr}
                      onChange={(e) => setRevCommentAr(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E51E2A] text-zinc-800"
                      placeholder="اكتب رأي العميل بالعربية هنا..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">التعليق باللغة الإنجليزية *</label>
                    <textarea
                      required
                      rows={3}
                      value={revCommentEn}
                      onChange={(e) => setRevCommentEn(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E51E2A] text-zinc-800"
                      placeholder="Write customer comment in English..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="revApprovedCheckbox"
                      checked={revIsApproved}
                      onChange={(e) => setRevIsApproved(e.target.checked)}
                      className="rounded text-[#E51E2A] focus:ring-[#E51E2A]"
                    />
                    <label htmlFor="revApprovedCheckbox" className="text-xs font-bold text-zinc-700 cursor-pointer">
                      نشر الرأي وعرضه في المتجر فوراً
                    </label>
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddReviewModalOpen(false)}
                      className="px-4 py-2 border border-zinc-300 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer font-heading"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#E51E2A] text-white text-xs font-bold rounded-xl hover:bg-[#c41520] transition-colors cursor-pointer font-heading"
                    >
                      حفظ ونشر
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Review Modal */}
          {isEditReviewModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
              <div className="bg-white border border-zinc-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-lg font-black text-zinc-900 font-heading mb-4">
                  تعديل رأي العميل
                </h3>
                <form onSubmit={handleEditReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">اسم العميل *</label>
                    <input
                      type="text"
                      required
                      value={revCustomerName}
                      onChange={(e) => setRevCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E51E2A] text-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">رابط صورة العميل (اختياري)</label>
                    <input
                      type="url"
                      value={revCustomerAvatar}
                      onChange={(e) => setRevCustomerAvatar(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E51E2A] text-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">التقييم (عدد النجوم) *</label>
                    <select
                      value={revRating}
                      onChange={(e) => setRevRating(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E51E2A] text-zinc-800"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 نجوم)</option>
                      <option value="4">⭐⭐⭐⭐ (4 نجوم)</option>
                      <option value="3">⭐⭐⭐ (3 نجوم)</option>
                      <option value="2">⭐⭐ (نجمتان)</option>
                      <option value="1">⭐ (نجمة واحدة)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">التعليق باللغة العربية *</label>
                    <textarea
                      required
                      rows={3}
                      value={revCommentAr}
                      onChange={(e) => setRevCommentAr(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E51E2A] text-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">التعليق باللغة الإنجليزية *</label>
                    <textarea
                      required
                      rows={3}
                      value={revCommentEn}
                      onChange={(e) => setRevCommentEn(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E51E2A] text-zinc-800"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="revEditApprovedCheckbox"
                      checked={revIsApproved}
                      onChange={(e) => setRevIsApproved(e.target.checked)}
                      className="rounded text-[#E51E2A] focus:ring-[#E51E2A]"
                    />
                    <label htmlFor="revEditApprovedCheckbox" className="text-xs font-bold text-zinc-700 cursor-pointer">
                      عرض في المتجر (موافق عليه)
                    </label>
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditReviewModalOpen(false)}
                      className="px-4 py-2 border border-zinc-300 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer font-heading"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#E51E2A] text-white text-xs font-bold rounded-xl hover:bg-[#c41520] transition-colors cursor-pointer font-heading"
                    >
                      حفظ التغييرات
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: SETTINGS & BRANCHES */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Hero Image & Banner Settings */}
          <div className="col-span-1 lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-md">
            <h2 className="text-base font-bold text-zinc-900 font-heading flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#E51E2A]" />
              <span>صورة البرجر الرئيسية بالصفحة الرئيسية (Hero Image)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  معاينة الصورة الحالية:
                </label>
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-black aspect-video max-h-52 shadow-inner group">
                  <img
                    src={settings.heroImage || 'https://res.cloudinary.com/fwxyu7hh/image/upload/v1787756297/Imgess.jpg'}
                    alt="Hero Burger Preview"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    رابط الصورة المباشر (URL):
                  </label>
                  <input
                    type="text"
                    value={settings.heroImage || ''}
                    onChange={(e) => updateSettings({ heroImage: e.target.value })}
                    placeholder="https://res.cloudinary.com/..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3 text-zinc-900 font-mono outline-none focus:border-[#E51E2A]"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    يمكنك لصق أي رابط صورة مباشر من Cloudinary أو أي موقع استضافة.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                  <label className="px-4 py-2.5 rounded-xl bg-[#E51E2A] hover:bg-[#c41420] text-white text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-2 shadow-md shadow-[#E51E2A]/20">
                    <Upload className="w-4 h-4" />
                    <span>رفع صورة جديدة من جهازك</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateSettings({ heroImage: reader.result as string });
                            showFeedbackBanner('تم تحديث وحفظ صورة البرجر الرئيسية بنجاح!');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ heroImage: 'https://res.cloudinary.com/fwxyu7hh/image/upload/v1787756297/Imgess.jpg' });
                      showFeedbackBanner('تم استعادة الصورة الافتراضية');
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer border border-zinc-200"
                  >
                    استعادة الصورة الافتراضية
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* General Store Settings Form */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 font-heading flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#E51E2A]" />
                <span>إعدادات الاتصال والخدمة العامة</span>
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  رقم الهاتف الرئيسي للفرع:
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => updateSettings({ phone: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 font-mono outline-none focus:border-[#E51E2A]"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  رقم خط الواتساب الساخن للطلبات:
                </label>
                <input
                  type="text"
                  value={settings.whatsapp}
                  onChange={(e) => updateSettings({ whatsapp: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 font-mono outline-none focus:border-[#E51E2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    حد التوصيل المجاني (جنيه):
                  </label>
                  <input
                    type="number"
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) => updateSettings({ freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 font-mono outline-none focus:border-[#E51E2A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    نسبة الضريبة المضافة (%):
                  </label>
                  <input
                    type="number"
                    value={settings.taxPercentage}
                    onChange={(e) => updateSettings({ taxPercentage: Number(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 font-mono outline-none focus:border-[#E51E2A]"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-zinc-100">
              <button
                onClick={() => showFeedbackBanner('تم حفظ الإعدادات بنجاح!')}
                className="w-full px-4 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
              >
                حفظ كافة الإعدادات
              </button>
            </div>
          </div>

          {/* SEO & Favicon Settings */}
          <div className="col-span-1 lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-5 space-y-5 shadow-md">
            <h2 className="text-base font-bold text-zinc-900 font-heading flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#E51E2A]" />
              <span>إعدادات تحسين محركات البحث والأيقونة (SEO & Favicon)</span>
            </h2>
            <p className="text-xs text-zinc-500 -mt-2">
              تحكم في كيفية ظهور متجرك في نتائج بحث جوجل، وفي علامات تبويب المتصفح وأشرطة العناوين.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Website Favicon (أيقونة الموقع في المتصفح) */}
              <div className="space-y-4 border-l border-zinc-100 pl-0 md:pl-6">
                <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider font-heading">
                  أيقونة المتصفح (Browser Favicon)
                </h3>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <div className="w-16 h-16 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center p-2.5 overflow-hidden flex-shrink-0">
                    <img
                      src={settings.faviconUrl || 'https://res.cloudinary.com/fwxyu7hh/image/upload/v1787696322/Logoo.png'}
                      alt="Favicon Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/fwxyu7hh/image/upload/v1787696322/Logoo.png';
                      }}
                    />
                  </div>

                  <div className="space-y-2 text-xs flex-1 w-full">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        رابط الأيقونة المباشر:
                      </label>
                      <input
                        type="url"
                        value={settings.faviconUrl || ''}
                        onChange={(e) => updateSettings({ faviconUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="w-full bg-white border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 font-mono outline-none focus:border-[#E51E2A] text-[11px]"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-1.5 rounded-lg bg-[#E51E2A] hover:bg-[#c41420] text-white text-[10px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع أيقونة جديدة</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                updateSettings({ faviconUrl: reader.result as string });
                                showFeedbackBanner('تم تحديث أيقونة المتصفح بنجاح!');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          updateSettings({ faviconUrl: 'https://res.cloudinary.com/fwxyu7hh/image/upload/v1787696322/Logoo.png' });
                          showFeedbackBanner('تمت استعادة الأيقونة الافتراضية للمتجر');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-[10px] font-bold transition-colors border border-zinc-300"
                      >
                        استعادة الافتراضية
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-zinc-700 text-xs mb-1">
                      عنوان التبويب بالعربية (Tab Title - AR):
                    </label>
                    <input
                      type="text"
                      value={settings.seoTitleAr || ''}
                      onChange={(e) => updateSettings({ seoTitleAr: e.target.value })}
                      placeholder="فرانك برجر | البرجر على أصوله"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 text-xs outline-none focus:border-[#E51E2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 text-xs mb-1">
                      عنوان التبويب بالإنجليزية (Tab Title - EN):
                    </label>
                    <input
                      type="text"
                      value={settings.seoTitleEn || ''}
                      onChange={(e) => updateSettings({ seoTitleEn: e.target.value })}
                      placeholder="Frank Burger | Real Bold Gourmet Burgers"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 text-xs outline-none focus:border-[#E51E2A]"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Meta Description & Keywords */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider font-heading">
                  بيانات الأرشفة ومحركات البحث (SEO Meta Tags)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-zinc-700 text-xs mb-1">
                      وصف الموقع بالعربية (Meta Description - AR):
                    </label>
                    <textarea
                      rows={2}
                      value={settings.seoDescriptionAr || ''}
                      onChange={(e) => updateSettings({ seoDescriptionAr: e.target.value })}
                      placeholder="اكتب وصفًا دقيقًا لمتجرك ليظهر أسفل العنوان في محرك بحث جوجل..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 text-xs outline-none focus:border-[#E51E2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 text-xs mb-1">
                      وصف الموقع بالإنجليزية (Meta Description - EN):
                    </label>
                    <textarea
                      rows={2}
                      value={settings.seoDescriptionEn || ''}
                      onChange={(e) => updateSettings({ seoDescriptionEn: e.target.value })}
                      placeholder="Write website description for English search results..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 text-xs outline-none focus:border-[#E51E2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 text-xs mb-1">
                      الكلمات الدلالية بالعربية (Meta Keywords - AR):
                    </label>
                    <input
                      type="text"
                      value={settings.seoKeywordsAr || ''}
                      onChange={(e) => updateSettings({ seoKeywordsAr: e.target.value })}
                      placeholder="فرانك برجر, برجر اسيوط, مطعم برجر"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 text-xs outline-none focus:border-[#E51E2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 text-xs mb-1">
                      الكلمات الدلالية بالإنجليزية (Meta Keywords - EN):
                    </label>
                    <input
                      type="text"
                      value={settings.seoKeywordsEn || ''}
                      onChange={(e) => updateSettings({ seoKeywordsEn: e.target.value })}
                      placeholder="frank burger, burger assiut, restaurant"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-zinc-900 text-xs outline-none focus:border-[#E51E2A]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">
                * يتم تفعيل وتحديث الأيقونة والبيانات في المتصفح وبطاقات النشر أوتوماتيكياً ولحظياً بمجرد الحفظ.
              </span>
              <button
                type="button"
                onClick={() => showFeedbackBanner('تم حفظ وتطبيق كافة إعدادات SEO والأيقونة بنجاح!')}
                className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer font-heading"
              >
                تطبيق وحفظ إعدادات الـ SEO
              </button>
            </div>
          </div>

          {/* Tracking Settings */}
          <PixelTrackerSettings />

          {/* Branches Manager */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-md">
            <h2 className="text-base font-bold text-zinc-900 font-heading flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>فروع مطعم فرانك برجر</span>
            </h2>

            <div className="space-y-3">
              {branches.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#E51E2A]" />
                      <span>{b.nameAr}</span>
                    </div>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 text-[11px]">
                      مفتوح ويستقبل طلبات
                    </span>
                  </div>

                  <div className="text-zinc-500">{b.addressAr}</div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-[#262632]">
                    <span dir="ltr" className="font-mono text-zinc-700">
                      📞 {b.phone}
                    </span>
                    <span>ساعات العمل: {b.openingHoursAr}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Zones Manager embedded in Settings */}
          <div className="col-span-1 lg:col-span-2">
            <DeliveryZonesManager />
          </div>
        </div>
      )}

      {/* Delivery Zones Dedicated Tab */}
      {activeTab === 'delivery_zones' && <DeliveryZonesManager />}

      {/* Users Management Tab */}
      {activeTab === 'users' && <UsersManagementTab />}

      {/* Customers Management Tab */}
      {activeTab === 'customers' && <CustomersManagementTab />}

      {/* Blacklist Management Tab */}
      {activeTab === 'blacklist' && <BlacklistManager />}

      {/* Audit Logs Tab */}
      {activeTab === 'audit_logs' && <AuditLogsTab />}

      {/* Security & 2FA Settings Tab */}
      {activeTab === 'security' && <SecuritySettingsTab />}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT PRODUCT MODAL (ARABIC) */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <h3 className="text-base font-black text-zinc-900 font-heading">
                {editingProductId ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد لقائمة الطعام'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              {/* Name Arabic & English */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">اسم الصنف بالعربي *</label>
                  <input
                    type="text"
                    value={prodForm.nameAr || ''}
                    onChange={(e) => setProdForm({ ...prodForm, nameAr: e.target.value })}
                    placeholder="مثال: فرانك دبل سماش برجر"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 outline-none focus:border-[#E51E2A]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">الاسم بالإنجليزي</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={prodForm.nameEn || ''}
                    onChange={(e) => setProdForm({ ...prodForm, nameEn: e.target.value })}
                    placeholder="Frank Double Smash Burger"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 outline-none focus:border-[#E51E2A]"
                  />
                </div>
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">السعر (جنيه مصري) *</label>
                  <input
                    type="number"
                    value={prodForm.price || ''}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 font-mono font-bold outline-none focus:border-[#E51E2A]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">القسم</label>
                  <select
                    value={prodForm.categoryId || categories[0]?.id}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 outline-none focus:border-[#E51E2A] cursor-pointer font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description Arabic */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">الوصف والمكونات بالعربي</label>
                <textarea
                  rows={2}
                  value={prodForm.descriptionAr || ''}
                  onChange={(e) => setProdForm({ ...prodForm, descriptionAr: e.target.value })}
                  placeholder="شريحتان من اللحم البقري الطازج مع جبن الشيدر الذائب والصوص السري..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 outline-none focus:border-[#E51E2A]"
                />
              </div>

              {/* Image URL with live preview */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">رابط صورة الوجبة (URL)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    value={prodForm.image || ''}
                    onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 font-mono text-[11px] outline-none focus:border-[#E51E2A]"
                  />
                  {prodForm.image && (
                    <img
                      src={prodForm.image}
                      alt="معاينة"
                      className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-zinc-200 shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Calories & Badges */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">السعرات</label>
                  <input
                    type="number"
                    value={prodForm.calories || 650}
                    onChange={(e) => setProdForm({ ...prodForm, calories: Number(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2 text-zinc-900 font-mono"
                  />
                </div>

                <div className="col-span-2 flex flex-col justify-center gap-1.5 ps-2">
                  <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodForm.isBestSeller || false}
                      onChange={(e) => setProdForm({ ...prodForm, isBestSeller: e.target.checked })}
                      className="accent-[#E51E2A] w-4 h-4"
                    />
                    <span className="font-semibold">تمييز كـ "الأكثر مبيعاً ⭐"</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodForm.isSpicy || false}
                      onChange={(e) => setProdForm({ ...prodForm, isSpicy: e.target.checked })}
                      className="accent-[#E51E2A] w-4 h-4"
                    />
                    <span className="font-semibold">صنف حار وسبايسي 🌶️</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-50 text-zinc-700 font-bold border border-zinc-200 cursor-pointer hover:bg-zinc-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold cursor-pointer shadow-lg shadow-[#E51E2A]/25"
                >
                  حفظ الصنف في المنيو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD CATEGORY MODAL (ARABIC) */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <h3 className="text-base font-black text-zinc-900 font-heading">
                إضافة قسم منيو جديد
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">اسم القسم بالعربي *</label>
                <input
                  type="text"
                  value={catForm.nameAr}
                  onChange={(e) => setCatForm({ ...catForm, nameAr: e.target.value })}
                  placeholder="مثال: وجبات التوفير"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 outline-none focus:border-[#E51E2A]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">اسم القسم بالإنجليزي</label>
                <input
                  type="text"
                  dir="ltr"
                  value={catForm.nameEn}
                  onChange={(e) => setCatForm({ ...catForm, nameEn: e.target.value })}
                  placeholder="Value Meals"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 outline-none focus:border-[#E51E2A]"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">رابط صورة القسم (URL)</label>
                <input
                  type="url"
                  dir="ltr"
                  value={catForm.image}
                  onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 font-mono text-[11px] outline-none focus:border-[#E51E2A]"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-50 text-zinc-700 font-bold border border-zinc-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold"
                >
                  إضافة القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD COUPON MODAL (ARABIC) */}
      {/* ========================================================================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <h3 className="text-base font-black text-zinc-900 font-heading">
                إنشاء كود خصم جديد
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">كود الخصم (Promo Code) *</label>
                <input
                  type="text"
                  dir="ltr"
                  value={couponForm.code || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="FRANK25"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 font-mono uppercase font-black outline-none focus:border-[#E51E2A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">نوع الخصم</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        discountType: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 outline-none focus:border-[#E51E2A] cursor-pointer font-bold"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (جنيه)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">قيمة الخصم *</label>
                  <input
                    type="number"
                    value={couponForm.discountValue || 15}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 font-mono font-bold outline-none focus:border-[#E51E2A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">الحد الأدنى للطلب (جنيه)</label>
                <input
                  type="number"
                  value={couponForm.minOrder || 100}
                  onChange={(e) => setCouponForm({ ...couponForm, minOrder: Number(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 font-mono outline-none focus:border-[#E51E2A]"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-50 text-zinc-700 font-bold border border-zinc-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold"
                >
                  تفعيل وحفظ الكود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POS IN-RESTAURANT ORDER MODAL */}
      {/* ========================================================================= */}
      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white border-b border-zinc-200 text-zinc-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#E51E2A] text-white flex items-center justify-center font-black text-xs shadow-md shadow-[#E51E2A]/20">POS</span>
                <div>
                  <h3 className="font-black text-base text-zinc-900">نقطة بيع المطعم (تسجيل طلب داخل الصالة / تيك أواي)</h3>
                  <p className="text-xs text-zinc-500">اختر الأصناف، حدد رقم الطاولة أو العميل، وأنشئ الطلب مع الطباعة الفورية</p>
                </div>
              </div>
              <button
                onClick={() => setIsPosModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
              {/* Left Side: Menu Items Catalog (7 Cols) */}
              <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col border-e border-zinc-200 overflow-y-auto space-y-4">
                {/* Search & Categories */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute inset-y-0 start-3 my-auto w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={posProductSearch}
                      onChange={(e) => setPosProductSearch(e.target.value)}
                      placeholder="ابحث عن وجبة، برجر، مشروب..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 ps-10 pe-3 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#E51E2A] outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setPosSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                        posSelectedCategory === 'all'
                          ? 'bg-[#E51E2A] text-white shadow-sm'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      الكل ({products.length})
                    </button>
                    {categories.filter(c => c.isActive).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setPosSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                          posSelectedCategory === cat.id
                            ? 'bg-[#E51E2A] text-white shadow-sm'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {cat.nameAr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredPosProducts.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => handleAddProductToPos(prod)}
                      className="group bg-zinc-50 hover:bg-white border border-zinc-200 hover:border-[#E51E2A]/50 rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div className="space-y-2">
                        <div className="w-full h-24 rounded-xl overflow-hidden bg-zinc-200 relative">
                          <img
                            src={prod.image}
                            alt={prod.nameAr}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <h4 className="font-bold text-xs text-zinc-900 line-clamp-1">{prod.nameAr}</h4>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-200/60">
                        <span className="font-mono font-black text-xs text-[#E51E2A]">{prod.price} ج.م</span>
                        <span className="w-6 h-6 rounded-lg bg-[#E51E2A]/10 text-[#E51E2A] flex items-center justify-center font-bold text-sm">+</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Order Summary & Cart (5 Cols) */}
              <div className="lg:col-span-5 bg-zinc-50 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <h4 className="font-black text-sm text-zinc-900 flex items-center gap-2">
                      <span>🧾 تفاصيل الطلب الحالي</span>
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-200 text-zinc-800 text-xs font-mono font-bold">
                      {posCart.reduce((s, i) => s + i.quantity, 0)} أصناف
                    </span>
                  </div>

                  {/* Customer / Table Info */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 mb-1">اسم العميل</label>
                      <input
                        type="text"
                        value={posCustomerName}
                        onChange={(e) => setPosCustomerName(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl p-2 text-xs text-zinc-900 outline-none focus:border-[#E51E2A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 mb-1">رقم الطاولة</label>
                      <input
                        type="text"
                        value={posTableNumber}
                        onChange={(e) => setPosTableNumber(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl p-2 text-xs font-mono font-bold text-zinc-900 outline-none focus:border-[#E51E2A]"
                      />
                    </div>
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-2 max-h-[190px] overflow-y-auto pe-1">
                    {posCart.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-xs font-semibold">
                        لم تقم بإضافة أي أصناف للطلب بعد.<br />انقر على الوجبات من القائمة لإضافتها.
                      </div>
                    ) : (
                      posCart.map(item => (
                        <div key={item.cartItemId} className="bg-white border border-zinc-200 rounded-xl p-3 space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-zinc-900">{item.product.nameAr}</span>
                            <span className="font-mono text-xs font-black text-[#E51E2A]">{item.totalPrice} ج.م</span>
                          </div>

                          {/* Size & Add-ons breakdown */}
                          <div className="text-[11px] text-zinc-500 space-y-0.5">
                            {item.selectedSize && (
                              <div className="text-zinc-700 font-medium">الحجم: <span className="text-[#E51E2A] font-bold">{item.selectedSize.nameAr}</span></div>
                            )}
                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              <div className="text-zinc-600">
                                الإضافات: {item.selectedAddons.map(a => a.nameAr).join(', ')}
                              </div>
                            )}
                            {item.specialInstructions && (
                              <div className="text-amber-600 italic">ملاحظة: {item.specialInstructions}</div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                            <span className="text-[10px] text-zinc-400 font-mono">القطعة: {item.unitPrice} ج.م</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdatePosQty(item.cartItemId, -1)}
                                className="w-5 h-5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono text-xs font-bold text-zinc-900 w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdatePosQty(item.cartItemId, 1)}
                                className="w-5 h-5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer Totals & Payment Method & Checkout Button */}
                <div className="space-y-3 pt-4 border-t border-zinc-200 mt-4">
                  {/* Order Type & Payment Method Selectors */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 mb-1">نوع الطلب</label>
                      <select
                        value={posOrderType}
                        onChange={(e) => setPosOrderType(e.target.value as 'pickup' | 'delivery')}
                        className="w-full bg-white border border-zinc-200 rounded-xl p-2 text-xs font-bold text-zinc-900 outline-none focus:border-[#E51E2A]"
                      >
                        <option value="pickup">صالة / مطعم (Dine-in)</option>
                        <option value="delivery">تيك أواي سريع</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 mb-1">طريقة الدفع</label>
                      <select
                        value={posPaymentMethod}
                        onChange={(e) => setPosPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full bg-white border border-zinc-200 rounded-xl p-2 text-xs font-bold text-zinc-900 outline-none focus:border-[#E51E2A]"
                      >
                        <option value="cash_on_delivery">نقدي (كاش الصندوق)</option>
                        <option value="instapay">إنستاباي (InstaPay)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>المجموع الفرعي:</span>
                      <span className="font-mono font-bold">{posCartSubtotal} ج.م</span>
                    </div>
                    <div className="flex justify-between text-zinc-900 font-black text-sm pt-2 border-t border-zinc-200">
                      <span>الإجمالي النهائي:</span>
                      <span className="font-mono text-[#E51E2A] text-base">{posCartTotal} ج.م</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlacePosOrder}
                    disabled={posCart.length === 0}
                    className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                      posCart.length === 0
                        ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                        : 'bg-[#E51E2A] hover:bg-[#c81520] text-white shadow-[#E51E2A]/25 cursor-pointer'
                    }`}
                  >
                    <span>🖨️ تأكيد الطلب وطباعة الفاتورة الفورية</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POS PRODUCT CONFIGURATION MODAL (Sizes & Add-ons) */}
      {/* ========================================================================= */}
      {posConfigProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-zinc-200 text-zinc-900 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-sm text-zinc-900">تخصيص وجبة: {posConfigProduct.nameAr}</h3>
                <p className="text-[11px] text-zinc-500">اختر الحجم والإضافات المطلوبة قبل الإضافة</p>
              </div>
              <button
                onClick={() => setPosConfigProduct(null)}
                className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Sizes */}
              {posConfigProduct.availableSizes && posConfigProduct.availableSizes.length > 0 && (
                <div className="space-y-2">
                  <label className="block font-bold text-zinc-800">اختر الحجم:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {posConfigProduct.availableSizes.map(size => (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => setPosConfigSelectedSize(size)}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          posConfigSelectedSize?.id === size.id
                            ? 'border-[#E51E2A] bg-[#E51E2A]/5 text-[#E51E2A]'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <div>{size.nameAr}</div>
                        <div className="font-mono text-[11px] text-zinc-500">+{size.priceModifier} ج.م</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {posConfigProduct.allowedAddonIds && posConfigProduct.allowedAddonIds.length > 0 && (
                <div className="space-y-3">
                  <label className="block font-bold text-zinc-800">الإضافات المتاحة:</label>
                  {addonGroups
                    .filter(group => posConfigProduct.allowedAddonIds?.includes(group.id))
                    .map(group => (
                      <div key={group.id} className="space-y-1.5 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                        <span className="font-bold text-zinc-900 block">{group.titleAr}</span>
                        <div className="grid grid-cols-2 gap-2">
                          {group.options.map(opt => {
                            const isSelected = posConfigSelectedAddons.some(a => a.optionId === opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setPosConfigSelectedAddons(prev => prev.filter(a => a.optionId !== opt.id));
                                  } else {
                                    setPosConfigSelectedAddons(prev => [
                                      ...prev,
                                      {
                                        groupId: group.id,
                                        groupTitleAr: group.titleAr,
                                        groupTitleEn: group.titleEn,
                                        optionId: opt.id,
                                        nameAr: opt.nameAr,
                                        nameEn: opt.nameEn,
                                        price: opt.price,
                                      }
                                    ]);
                                  }
                                }}
                                className={`p-2 rounded-xl border flex items-center justify-between text-start transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#E51E2A] bg-[#E51E2A]/10 text-zinc-900 font-bold'
                                    : 'border-zinc-200 bg-white text-zinc-700'
                                }`}
                              >
                                <span>{opt.nameAr}</span>
                                <span className="font-mono text-[11px] text-[#E51E2A]">+{opt.price} ج.م</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Special Instructions */}
              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-800">ملاحظات خاصة (بدون بصل، مستوي جيداً...)</label>
                <input
                  type="text"
                  value={posConfigSpecialInstructions}
                  onChange={(e) => setPosConfigSpecialInstructions(e.target.value)}
                  placeholder="أدخل أي ملاحظات خاصة بالوجبة..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 outline-none focus:border-[#E51E2A]"
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-zinc-800">الكمية:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPosConfigQty(Math.max(1, posConfigQty - 1))}
                    className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm w-6 text-center">{posConfigQty}</span>
                  <button
                    type="button"
                    onClick={() => setPosConfigQty(posConfigQty + 1)}
                    className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
              <div className="font-mono font-black text-sm text-[#E51E2A]">
                الإجمالي: {Math.max(0, (posConfigProduct.price + (posConfigSelectedSize?.priceModifier || 0) + posConfigSelectedAddons.reduce((s, a) => s + a.price, 0)) * posConfigQty)} ج.م
              </div>
              <button
                type="button"
                onClick={handleConfirmConfiguredProduct}
                className="px-5 py-2.5 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs shadow-lg shadow-[#E51E2A]/25 cursor-pointer"
              >
                إضافة إلى السلة
              </button>
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
};

export const AdminView: React.FC = () => {
  const { adminUser } = useApp();

  if (!adminUser) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
};
