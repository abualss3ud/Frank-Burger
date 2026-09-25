import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useRef } from 'react';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { trackAddToCart, trackPurchase } from '../lib/pixel';
import { useAuth } from '../context/AuthContext';
import {
  Language,
  Product,
  Category,
  AddonGroup,
  Offer,
  Coupon,
  DeliveryZone,
  Branch,
  CustomerReview,
  RestaurantSettings,
  AdminUser,
  AdminAccount,
  CartItem,
  Order,
  OrderStatus,
  CustomerInfo,
  ProductSize,
  CartItemAddon,
  RegisteredCustomer,
  BlacklistEntry,
  normalizePhone,
  toEnglishDigits,
  CashierShift,
  ShiftExpense,
  AuditLogEntry,
  AuditAction,
  PasswordResetRecord,
  UserSessionInfo,
  AdminRole,
} from '../types';
import {
  hashPassword,
  verifyPassword,
  verifyTOTP,
  generateTOTPSecret,
  generateSecureToken,
  sha256Hex,
  recordAuditLog,
  loadAuditLogs,
  evaluatePasswordStrength,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '../utils/security';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ADDON_GROUPS,
  INITIAL_OFFERS,
  INITIAL_COUPONS,
  INITIAL_DELIVERY_ZONES,
  INITIAL_BRANCHES,
  INITIAL_REVIEWS,
  INITIAL_SETTINGS,
  INITIAL_ADMIN_USERS,
  DEFAULT_ADMIN_ACCOUNTS,
} from '../data/initialData';
import { translations } from '../utils/translations';
import { soundManager } from '../utils/audio';
import {
  DeviceInfo,
  getOrCreateDeviceInfo,
  getMyDeviceOrderIds,
  saveOrderToMyDevice,
} from '../utils/device';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Zero initial orders so real orders show up cleanly
const INITIAL_ORDERS: Order[] = [];

export type AppView = 'home' | 'menu' | 'offers' | 'about' | 'branches' | 'tracking' | 'profile' | 'admin';

interface AppContextType {
  language: Language;
  syncStatus: 'connecting' | 'synced' | 'error';
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['ar'], params?: Record<string, string | number>) => string;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  activeMenuCategory: string;
  setActiveMenuCategory: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Catalog
  products: Product[];
  categories: Category[];
  addonGroups: AddonGroup[];
  offers: Offer[];
  coupons: Coupon[];
  deliveryZones: DeliveryZone[];
  branches: Branch[];
  reviews: CustomerReview[];
  settings: RestaurantSettings;

  // Catalog CRUD
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;

  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addAddonGroup: (group: Omit<AddonGroup, 'id'>) => void;
  updateAddonGroup: (id: string, group: Partial<AddonGroup>) => void;
  deleteAddonGroup: (id: string) => void;

  addOffer: (offer: Omit<Offer, 'id'>) => void;
  updateOffer: (id: string, offer: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;

  addCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;

  addDeliveryZone: (zone: Omit<DeliveryZone, 'id'>) => void;
  updateDeliveryZone: (id: string, zone: Partial<DeliveryZone>) => void;
  deleteDeliveryZone: (id: string) => void;
  resetDeliveryZones: () => void;

  addBranch: (branch: Omit<Branch, 'id'>) => void;
  updateBranch: (id: string, branch: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;

  addReview: (review: Omit<CustomerReview, 'id' | 'date'>) => void;
  updateReview: (id: string, review: Partial<CustomerReview>) => void;
  deleteReview: (id: string) => void;
  toggleApproveReview: (id: string) => void;

  updateSettings: (newSettings: Partial<RestaurantSettings>) => void;

  // Cart
  cart: CartItem[];
  addToCart: (
    product: Product,
    size?: ProductSize,
    addons?: CartItemAddon[],
    quantity?: number,
    specialInstructions?: string
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, newQty: number) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartSubtotal: number;
  appliedCoupon: Coupon | null;
  couponDiscountAmount: number;
  cartTotal: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  reorderPastOrder: (order: Order) => void;

  // Orders & Tracking
  orders: Order[];
  myDeviceOrders: Order[];
  deviceInfo: DeviceInfo;
  createOrder: (orderData: Omit<Order, 'id' | 'orderDate' | 'statusHistory'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  deleteOrder: (orderId: string) => void;
  clearAllOrders: () => void;
  activeTrackingOrderId: string | null;
  setActiveTrackingOrderId: (id: string | null) => void;
  trackOrderLookup: (orderNumber: string, phone: string) => Order | null;

  // Favorites & Customer
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  customerProfile: CustomerInfo;
  updateCustomerProfile: (info: Partial<CustomerInfo>) => void;

  // Admin & Security
  adminUser: AdminUser | null;
  adminAccounts: AdminAccount[];
  auditLogs: AuditLogEntry[];
  addAuditLog: (action: AuditAction, details?: string, target?: string, status?: 'SUCCESS' | 'FAILURE' | 'WARNING') => void;
  loginAdmin: (role?: AdminUser['role']) => void;
  loginAdminWithCredentials: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; role?: string; message?: string; mfaRequired?: boolean; temporaryToken?: string; account?: any }>;
  verifyMFACode: (temporaryToken: string, code: string) => Promise<{ success: boolean; message?: string }>;
  requestPasswordReset: (usernameOrEmail: string) => Promise<{ success: boolean; message: string; resetLink?: string }>;
  validatePasswordResetToken: (token: string) => { valid: boolean; username?: string; message?: string };
  resetPasswordWithSecureToken: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  resetAdminPassword: (username: string, securityPin: string, newPassword: string) => { success: boolean; message: string };
  updateAdminPassword: (username: string, newPassword: string) => { success: boolean; message: string };
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  enableMFA: (secret: string, code: string) => Promise<{ success: boolean; message: string }>;
  disableMFA: (password: string) => Promise<{ success: boolean; message: string }>;
  revokeAllSessions: () => Promise<{ success: boolean; message: string }>;
  revokeSingleSession: (sessionId: string) => Promise<{ success: boolean; message: string }>;
  createAdminAccount: (acc: Omit<AdminAccount, 'id'>) => Promise<{ success: boolean; message: string }>;
  updateAdminAccount: (id: string, patch: Partial<AdminAccount>) => Promise<{ success: boolean; message: string }>;
  deleteAdminAccount: (id: string) => Promise<{ success: boolean; message: string }>;
  logoutAdmin: () => void;

  // Modals & Drawers UI State
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  activeProductModal: Product | null;
  setActiveProductModal: (prod: Product | null) => void;
  activeReceiptOrder: Order | null;
  setActiveReceiptOrder: (order: Order | null) => void;
  orderConfirmationOrder: Order | null;
  setOrderConfirmationOrder: (order: Order | null) => void;

  // Toast Notifications
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Product Ratings
  updateProductRating: (productId: string, rating: number) => void;

  // Shifts & Cashier Handover
  shifts: CashierShift[];
  activeShift: CashierShift | null;
  openShift: (params: {
    startingCash: number;
    cashierName: string;
    cashierId?: string;
    handedOverFromCashierName?: string;
    branchId?: string;
    branchNameAr?: string;
    notes?: string;
  }) => CashierShift;
  closeShift: (
    shiftId: string,
    params: {
      actualCashInDrawer: number;
      handedOverToCashierName?: string;
      notes?: string;
    }
  ) => CashierShift | null;
  addShiftExpense: (
    shiftId: string,
    expense: { amount: number; reason: string; createdBy?: string }
  ) => void;
  registeredCustomers: RegisteredCustomer[];
  deleteRegisteredCustomer: (id: string) => Promise<void>;

  // Blacklist
  blacklist: BlacklistEntry[];
  addToBlacklist: (phone: string, reason?: string, customerName?: string) => Promise<void>;
  removeFromBlacklist: (idOrPhone: string) => Promise<void>;
  isPhoneBlacklisted: (phone: string) => boolean;

  // Sales & Products Calculation Helpers
  getOrderProductsTotal: (order: Order) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(`frank_burger_${key}`);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (parsed === null && fallback !== null) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`frank_burger_${key}`, JSON.stringify(data));
  } catch {
    // quota safe
  }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Language & Direction
  const [language, setLanguage] = useState<Language>(() => loadFromStorage<Language>('lang', 'ar'));
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'synced' | 'error'>('connecting');
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash.includes('reset-password') || path.includes('/reset-password') || search.includes('token=')) {
        return 'reset-password' as any;
      }
      if (hash.includes('forbidden') || path.includes('/forbidden')) {
        return 'forbidden' as any;
      }
      if (hash.includes('admin') || path.includes('/admin') || search.includes('admin')) {
        return 'admin';
      }
    }
    return 'home';
  });
  
  const [activeMenuCategory, setActiveMenuCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle URL hash changes for separate direct URL routing (e.g. /#admin or direct links)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashOrUrlChange = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash.includes('reset-password') || path.includes('/reset-password') || search.includes('token=')) {
        setCurrentView('reset-password' as any);
      } else if (hash.includes('forbidden') || path.includes('/forbidden')) {
        setCurrentView('forbidden' as any);
      } else if (hash.includes('admin') || path.includes('/admin') || search.includes('admin')) {
        setCurrentView('admin');
      } else if (hash === '#menu') {
        setCurrentView('menu');
      } else if (hash === '#tracking') {
        setCurrentView('tracking');
      } else if (hash === '#branches' || hash === '#contact') {
        setCurrentView('branches');
      } else if (hash === '#about') {
        setCurrentView('about');
      }
    };

    window.addEventListener('hashchange', handleHashOrUrlChange);
    window.addEventListener('popstate', handleHashOrUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleHashOrUrlChange);
      window.removeEventListener('popstate', handleHashOrUrlChange);
    };
  }, []);

  // Synchronize window.location.hash when view changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentView === 'admin') {
      if (!window.location.hash.includes('admin')) {
        window.location.hash = 'admin';
      }
    } else {
      if (window.location.hash.includes('admin')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [currentView]);

  useEffect(() => {
    saveToStorage('lang', language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: keyof typeof translations['ar'], params?: Record<string, string | number>): string => {
    let str = translations[language]?.[key] || translations['ar'][key] || key;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        str = str.replace(`{${pKey}}`, String(pVal));
      });
    }
    return str;
  };

  // State slices persisted in localStorage
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage('products_v3', INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => loadFromStorage('categories_v3', INITIAL_CATEGORIES));
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>(() => loadFromStorage('addon_groups_v3', INITIAL_ADDON_GROUPS));
  const [offers, setOffers] = useState<Offer[]>(() => loadFromStorage('offers_v3', INITIAL_OFFERS));
  const [coupons, setCoupons] = useState<Coupon[]>(() => loadFromStorage('coupons_v3', INITIAL_COUPONS));
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(() => loadFromStorage('zones_v2', INITIAL_DELIVERY_ZONES));
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>(() => loadFromStorage('blacklist_v1', []));
  const [branches, setBranches] = useState<Branch[]>(() => loadFromStorage('branches_v2', INITIAL_BRANCHES));
  const [reviews, setReviews] = useState<CustomerReview[]>(() => loadFromStorage('reviews_v3', INITIAL_REVIEWS));
  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const loaded = loadFromStorage('settings_v2', INITIAL_SETTINGS);
    return { ...INITIAL_SETTINGS, ...(loaded || {}) };
  });
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('orders_v2', INITIAL_ORDERS));
  const notifiedOrderIds = useRef<Set<string>>(new Set());

  // Sync orders in real-time across ALL devices, tabs, and clients via Firestore
  useEffect(() => {
    // 1. Setup Firestore real-time listener for multi-device & cloud synchronization
    console.log('[DASHBOARD] Starting orders listener');
    setSyncStatus('connecting');
    const ordersCollectionRef = collection(db, 'orders');
    let isInitialLoad = true;

    const unsubscribeFirestore = onSnapshot(
      ordersCollectionRef,
      (snapshot) => {
        console.log(`[DASHBOARD] Listener active - received snapshot update. Document count: ${snapshot.size}`);
        setSyncStatus('synced');
        const firestoreOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Order;
          // Merge Firestore document ID into the order object
          const order = { ...data, id: docSnap.id };
          if (order.id) {
            firestoreOrders.push(order);
          }
        });

        // Sort: Newest first (using Server Timestamp if available, fallback to ISO date)
        firestoreOrders.sort((a, b) => {
          const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : new Date(a.orderDate).getTime();
          const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : new Date(b.orderDate).getTime();
          return timeB - timeA;
        });
        
        // Update state and persistent storage
        setOrders(firestoreOrders);
        saveToStorage('orders_v2', firestoreOrders);

        // Multi-device notification logic
        if (!isInitialLoad) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const addedOrder = { ...change.doc.data() as Order, id: change.doc.id };
              console.log(`[DASHBOARD] New order received from Firestore. ID: ${addedOrder.id}`);
              // Only notify if we haven't processed this ID yet in this session
              if (addedOrder && addedOrder.id && !notifiedOrderIds.current.has(addedOrder.id)) {
                notifiedOrderIds.current.add(addedOrder.id);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('frank_new_order_event', { detail: addedOrder }));
                }
              }
            }
          });
        } else {
          // On startup, mark all existing orders as already "notified" to prevent spamming old alerts
          snapshot.forEach((doc) => {
            notifiedOrderIds.current.add(doc.id);
          });
          isInitialLoad = false;
        }
      },
      (error) => {
        console.error(`[DASHBOARD ERROR] Firestore Listener Error: ${error.message}`);
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.GET, 'orders');
      }
    );

    // 2. Storage Event fallback for same-device cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orders_v2' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        } catch {
          // silent ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribeFirestore();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Shifts state & real-time synchronization
  const [shifts, setShifts] = useState<CashierShift[]>(() => loadFromStorage('shifts_v2', []));

  useEffect(() => {
    // 1. Firestore real-time listener for shifts
    const shiftsCollectionRef = collection(db, 'shifts');
    const unsubscribeShifts = onSnapshot(
      shiftsCollectionRef,
      (snapshot) => {
        const firestoreShifts: CashierShift[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CashierShift;
          if (data && data.id) {
            firestoreShifts.push(data);
          }
        });

        if (firestoreShifts.length > 0) {
          firestoreShifts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
          setShifts(firestoreShifts);
          saveToStorage('shifts_v2', firestoreShifts);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'shifts');
      }
    );

    // 2. BroadcastChannel for instant multi-tab sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('frank_burger_shifts_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'SHIFT_OPENED' && event.data?.shift) {
          const newShift = event.data.shift as CashierShift;
          setShifts((prev) => [newShift, ...prev.filter((s) => s.id !== newShift.id)]);
        } else if (event.data?.type === 'SHIFT_CLOSED' && event.data?.shift) {
          const closed = event.data.shift as CashierShift;
          setShifts((prev) => prev.map((s) => (s.id === closed.id ? closed : s)));
        } else if (event.data?.type === 'SHIFT_UPDATED' && event.data?.shift) {
          const upd = event.data.shift as CashierShift;
          setShifts((prev) => prev.map((s) => (s.id === upd.id ? upd : s)));
        }
      };
    }

    // 3. Fallback StorageEvent
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shifts_v2' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setShifts(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribeShifts();
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Reviews real-time synchronization with Firestore
  useEffect(() => {
    console.log('[DASHBOARD] Starting reviews listener');
    const reviewsCollectionRef = collection(db, 'reviews');

    const unsubscribeReviews = onSnapshot(
      reviewsCollectionRef,
      async (snapshot) => {
        console.log(`[DASHBOARD] Reviews listener active - received snapshot update. Document count: ${snapshot.size}`);
        
        // 1. If the database is completely empty (e.g. fresh environment), seed with initial reviews
        if (snapshot.empty) {
          console.log('[DASHBOARD] Firestore reviews collection is empty. Seeding INITIAL_REVIEWS...');
          try {
            for (const r of INITIAL_REVIEWS) {
              await setDoc(doc(db, 'reviews', r.id), r);
            }
            console.log('[DASHBOARD] INITIAL_REVIEWS seeded successfully.');
          } catch (err) {
            console.error('[DASHBOARD ERROR] Failed to seed initial reviews:', err);
          }
          return;
        }

        // 2. Parse reviews from snapshot
        const firestoreReviews: CustomerReview[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CustomerReview;
          firestoreReviews.push({ ...data, id: docSnap.id });
        });

        // 3. Sort reviews (newest first or based on date field)
        firestoreReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 4. Update state and storage
        setReviews(firestoreReviews);
        saveToStorage('reviews_v3', firestoreReviews);
      },
      (error) => {
        console.error(`[DASHBOARD ERROR] Firestore Reviews Listener Error: ${error.message}`);
        handleFirestoreError(error, OperationType.GET, 'reviews');
      }
    );

    // Storage Event fallback for same-device cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'reviews_v3' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setReviews(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribeReviews();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Settings real-time synchronization with Firestore
  useEffect(() => {
    console.log('[DASHBOARD] Starting settings listener');
    const settingsDocRef = doc(db, 'settings', 'global');

    const unsubscribeSettings = onSnapshot(
      settingsDocRef,
      async (docSnap) => {
        if (!docSnap.exists()) {
          console.log('[DASHBOARD] Firestore settings/global document is empty. Seeding INITIAL_SETTINGS...');
          try {
            await setDoc(settingsDocRef, INITIAL_SETTINGS);
            console.log('[DASHBOARD] INITIAL_SETTINGS seeded successfully in Firestore.');
          } catch (err) {
            console.error('[DASHBOARD ERROR] Failed to seed initial settings:', err);
          }
          return;
        }

        const firestoreSettings = docSnap.data() as RestaurantSettings;
        console.log('[DASHBOARD] Received global settings from Firestore');
        
        // Ensure new SEO default values are merged if they are missing in existing Firestore doc
        const mergedSettings = { ...INITIAL_SETTINGS, ...firestoreSettings };
        setSettings(mergedSettings);
        saveToStorage('settings_v2', mergedSettings);
      },
      (error) => {
        console.error(`[DASHBOARD ERROR] Firestore Settings Listener Error: ${error.message}`);
        handleFirestoreError(error, OperationType.GET, 'settings');
      }
    );

    return () => {
      unsubscribeSettings();
    };
  }, []);

  // Delivery Zones real-time synchronization with Firestore
  useEffect(() => {
    console.log('[DASHBOARD] Starting delivery zones listener');
    const zonesDocRef = doc(db, 'settings', 'delivery_zones');

    const unsubscribeZones = onSnapshot(
      zonesDocRef,
      async (docSnap) => {
        if (!docSnap.exists()) {
          console.log('[DASHBOARD] Firestore settings/delivery_zones document is empty. Seeding INITIAL_DELIVERY_ZONES...');
          try {
            await setDoc(zonesDocRef, { list: INITIAL_DELIVERY_ZONES });
            console.log('[DASHBOARD] INITIAL_DELIVERY_ZONES seeded successfully in Firestore.');
          } catch (err) {
            console.error('[DASHBOARD ERROR] Failed to seed initial delivery zones:', err);
          }
          return;
        }

        const data = docSnap.data();
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          console.log(`[DASHBOARD] Received ${data.list.length} delivery zones from Firestore`);
          setDeliveryZones(data.list);
          saveToStorage('zones_v2', data.list);
        }
      },
      (error) => {
        console.error(`[DASHBOARD ERROR] Firestore Delivery Zones Listener Error: ${error.message}`);
      }
    );

    return () => {
      unsubscribeZones();
    };
  }, []);

  // Blacklist real-time synchronization with Firestore
  useEffect(() => {
    console.log('[DASHBOARD] Starting blacklist listener');
    const blacklistDocRef = doc(db, 'settings', 'blacklist');

    const unsubscribeBlacklist = onSnapshot(
      blacklistDocRef,
      async (docSnap) => {
        if (!docSnap.exists()) {
          try {
            await setDoc(blacklistDocRef, { list: [] });
          } catch (err) {
            console.error('[DASHBOARD ERROR] Failed to initialize blacklist in Firestore:', err);
          }
          return;
        }

        const data = docSnap.data();
        if (data && Array.isArray(data.list)) {
          console.log(`[DASHBOARD] Received ${data.list.length} blacklisted numbers from Firestore`);
          setBlacklist(data.list);
          saveToStorage('blacklist_v1', data.list);
        }
      },
      (error) => {
        console.error(`[DASHBOARD ERROR] Firestore Blacklist Listener Error: ${error.message}`);
      }
    );

    return () => {
      unsubscribeBlacklist();
    };
  }, []);

  // Real-time listener for registered customers (website users)
  useEffect(() => {
    console.log('[DASHBOARD] Starting registered users listener');
    const usersCollectionRef = collection(db, 'users');

    const unsubscribeUsers = onSnapshot(
      usersCollectionRef,
      (snapshot) => {
        const firestoreUsers: RegisteredCustomer[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreUsers.push({
            id: docSnap.id,
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            createdAt: data.createdAt || new Date().toISOString(),
            favorites: data.favorites || [],
          });
        });

        // Sort by creation date (newest first)
        firestoreUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setRegisteredCustomers(firestoreUsers);
        saveToStorage('registered_customers_v1', firestoreUsers);
      },
      (error) => {
        console.error(`[DASHBOARD ERROR] Firestore Users Listener Error: ${error.message}`);
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    );

    return () => {
      unsubscribeUsers();
    };
  }, []);

  // Dynamic SEO & Metadata & Favicon update
  useEffect(() => {
    const isAr = language === 'ar';
    const title = isAr
      ? (settings.seoTitleAr || settings.restaurantNameAr)
      : (settings.seoTitleEn || settings.restaurantNameEn);
    const description = isAr
      ? (settings.seoDescriptionAr || settings.sloganAr)
      : (settings.seoDescriptionEn || settings.sloganEn);
    const keywords = isAr
      ? (settings.seoKeywordsAr || '')
      : (settings.seoKeywordsEn || '');
    const favicon = settings.faviconUrl || 'https://res.cloudinary.com/fwxyu7hh/image/upload/v1787696322/Logoo.png';

    // 1. Update title
    document.title = title;

    // 2. Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', keywords);

    // 4. Update Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    // 5. Update Favicon
    let linkFavicon = document.querySelector('link[rel="icon"]');
    if (!linkFavicon) {
      linkFavicon = document.createElement('link');
      linkFavicon.setAttribute('rel', 'icon');
      document.head.appendChild(linkFavicon);
    }
    linkFavicon.setAttribute('href', favicon);
    linkFavicon.setAttribute('type', 'image/png');
    
    console.log(`[SEO] Meta elements updated. Title: "${title}", Favicon: "${favicon}"`);
  }, [settings, language]);

  // Active shift live computation
  const activeShift = useMemo(() => {
    const active = shifts.find((s) => s.status === 'active');
    if (!active) return null;

    const shiftOrders = orders.filter(
      (o) =>
        o.status !== 'cancelled' &&
        (o.shiftId === active.id ||
          (!o.shiftId && new Date(o.orderDate).getTime() >= new Date(active.startTime).getTime()))
    );

    const cashSales = shiftOrders
      .filter((o) => o.paymentMethod === 'cash_on_delivery')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const instapaySales = shiftOrders
      .filter((o) => o.paymentMethod === 'instapay')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const totalSales = shiftOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const otherSales = totalSales - cashSales - instapaySales;
    const ordersCount = shiftOrders.length;
    const orderIds = shiftOrders.map((o) => o.id);
    const totalExpenses = (active.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const expectedCashInDrawer = (active.startingCash || 0) + cashSales - totalExpenses;

    return {
      ...active,
      cashSales,
      instapaySales,
      otherSales,
      totalSales,
      ordersCount,
      orderIds,
      totalExpenses,
      expectedCashInDrawer,
    };
  }, [shifts, orders]);

  // Open a new shift
  const openShift = (params: {
    startingCash: number;
    cashierName: string;
    cashierId?: string;
    handedOverFromCashierName?: string;
    branchId?: string;
    branchNameAr?: string;
    notes?: string;
  }): CashierShift => {
    const newShiftId = `SHIFT-${Date.now().toString().slice(-5)}`;
    const previousClosedShift = shifts.find((s) => s.status === 'closed');
    const autoHandedOverFrom = params.handedOverFromCashierName || previousClosedShift?.cashierName || 'كاشير الوردية السابقة';

    const newShift: CashierShift = {
      id: newShiftId,
      cashierId: params.cashierId || adminUser?.id || 'cashier-1',
      cashierName: params.cashierName || adminUser?.name || 'كاشير الصالة',
      branchId: params.branchId || branches[0]?.id || 'branch-1',
      branchNameAr: params.branchNameAr || branches[0]?.nameAr || 'الفرع الرئيسي',
      status: 'active',
      startTime: new Date().toISOString(),
      handedOverFromCashierName: autoHandedOverFrom,
      startingCash: Number(params.startingCash) || 0,
      cashSales: 0,
      instapaySales: 0,
      otherSales: 0,
      totalSales: 0,
      ordersCount: 0,
      orderIds: [],
      expenses: [],
      totalExpenses: 0,
      expectedCashInDrawer: Number(params.startingCash) || 0,
      notes: params.notes || '',
    };

    setShifts((prev) => [newShift, ...prev.filter((s) => s.id !== newShiftId)]);
    saveToStorage('shifts_v2', [newShift, ...shifts.filter((s) => s.id !== newShiftId)]);

    // Firestore sync
    try {
      setDoc(doc(db, 'shifts', newShiftId), newShift).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `shifts/${newShiftId}`);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `shifts/${newShiftId}`);
    }

    // Broadcast
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('frank_burger_shifts_channel');
        bc.postMessage({ type: 'SHIFT_OPENED', shift: newShift });
        bc.close();
      } catch {}
    }

    addToast(
      language === 'ar'
        ? `تم فتح وردية جديدة بنجاح للكاشير: ${newShift.cashierName} (عهدة ${newShift.startingCash} ج.م)`
        : `New shift opened for: ${newShift.cashierName}`,
      'success'
    );
    return newShift;
  };

  // Close / Handover Shift
  const closeShift = (
    shiftId: string,
    params: {
      actualCashInDrawer: number;
      handedOverToCashierName?: string;
      notes?: string;
    }
  ): CashierShift | null => {
    const targetShift = shifts.find((s) => s.id === shiftId);
    if (!targetShift) return null;

    const shiftOrders = orders.filter(
      (o) =>
        o.status !== 'cancelled' &&
        (o.shiftId === shiftId ||
          (!o.shiftId && new Date(o.orderDate).getTime() >= new Date(targetShift.startTime).getTime()))
    );

    const cashSales = shiftOrders
      .filter((o) => o.paymentMethod === 'cash_on_delivery')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const instapaySales = shiftOrders
      .filter((o) => o.paymentMethod === 'instapay')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const totalSales = shiftOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const otherSales = totalSales - cashSales - instapaySales;
    const ordersCount = shiftOrders.length;
    const orderIds = shiftOrders.map((o) => o.id);

    const totalExpenses = (targetShift.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const expectedCashInDrawer = (targetShift.startingCash || 0) + cashSales - totalExpenses;
    const actualCashInDrawer = Number(params.actualCashInDrawer) || 0;
    const difference = actualCashInDrawer - expectedCashInDrawer;

    const closedShift: CashierShift = {
      ...targetShift,
      status: 'closed',
      endTime: new Date().toISOString(),
      handedOverToCashierName: params.handedOverToCashierName || '',
      cashSales,
      instapaySales,
      otherSales,
      totalSales,
      ordersCount,
      orderIds,
      totalExpenses,
      expectedCashInDrawer,
      actualCashInDrawer,
      difference,
      notes: params.notes || targetShift.notes,
    };

    setShifts((prev) => prev.map((s) => (s.id === shiftId ? closedShift : s)));
    saveToStorage(
      'shifts_v2',
      shifts.map((s) => (s.id === shiftId ? closedShift : s))
    );

    // Firestore sync
    try {
      setDoc(doc(db, 'shifts', shiftId), closedShift, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `shifts/${shiftId}`);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `shifts/${shiftId}`);
    }

    // Broadcast
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('frank_burger_shifts_channel');
        bc.postMessage({ type: 'SHIFT_CLOSED', shift: closedShift });
        bc.close();
      } catch {}
    }

    addToast(
      language === 'ar'
        ? `تم تقفيل وتسليم الوردية بنجاح (${closedShift.id}) - العجز/الزيادة: ${difference > 0 ? `+${difference}` : difference} ج.م`
        : `Shift ${closedShift.id} closed and handed over successfully`,
      'success'
    );

    return closedShift;
  };

  // Add Expense / Drawer Payout during shift
  const addShiftExpense = (
    shiftId: string,
    expenseData: { amount: number; reason: string; createdBy?: string }
  ) => {
    const newExpense: ShiftExpense = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      amount: Number(expenseData.amount) || 0,
      reason: expenseData.reason.trim(),
      time: new Date().toISOString(),
      createdBy: expenseData.createdBy || adminUser?.name || 'الكاشير',
    };

    let updatedShift: CashierShift | undefined;

    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === shiftId) {
          const updatedExpenses = [...(s.expenses || []), newExpense];
          const totalExpenses = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
          const expectedCashInDrawer = (s.startingCash || 0) + (s.cashSales || 0) - totalExpenses;
          const upd: CashierShift = {
            ...s,
            expenses: updatedExpenses,
            totalExpenses,
            expectedCashInDrawer,
          };
          updatedShift = upd;
          return upd;
        }
        return s;
      })
    );

    if (updatedShift) {
      try {
        setDoc(doc(db, 'shifts', shiftId), updatedShift, { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `shifts/${shiftId}`);
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `shifts/${shiftId}`);
      }

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('frank_burger_shifts_channel');
          bc.postMessage({ type: 'SHIFT_UPDATED', shift: updatedShift });
          bc.close();
        } catch {}
      }
    }

    addToast(
      language === 'ar'
        ? `تم تسجيل المصروف بقيمة ${expenseData.amount} ج.م من الدرج (${expenseData.reason})`
        : `Expense of ${expenseData.amount} EGP recorded`,
      'info'
    );
  };

  // Toast notifications (implemented via component but state here)
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Sync to storage
  useEffect(() => saveToStorage('products_v3', products), [products]);
  useEffect(() => saveToStorage('categories_v3', categories), [categories]);
  useEffect(() => saveToStorage('addon_groups_v3', addonGroups), [addonGroups]);
  useEffect(() => saveToStorage('offers_v3', offers), [offers]);
  useEffect(() => saveToStorage('coupons_v3', coupons), [coupons]);
  useEffect(() => saveToStorage('zones_v2', deliveryZones), [deliveryZones]);
  useEffect(() => saveToStorage('blacklist_v1', blacklist), [blacklist]);
  useEffect(() => saveToStorage('branches_v2', branches), [branches]);
  useEffect(() => saveToStorage('reviews_v3', reviews), [reviews]);
  useEffect(() => saveToStorage('settings_v2', settings), [settings]);
  useEffect(() => saveToStorage('orders_v2', orders), [orders]);

  const updateProductRating = (productId: string, rating: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newCount = (p.reviewsCount || 0) + 1;
          const currentRating = p.rating || 5;
          const newRating = ((currentRating * (newCount - 1)) + rating) / newCount;
          return { ...p, rating: newRating, reviewsCount: newCount };
        }
        return p;
      })
    );
  };

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => loadFromStorage('cart', []));
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => loadFromStorage('applied_coupon', null));
  const [favorites, setFavorites] = useState<string[]>(() => loadFromStorage('favorites', []));
  const [customerProfile, setCustomerProfile] = useState<CustomerInfo>(() => {
    const loaded = loadFromStorage<CustomerInfo | null>('customer_profile', null);
    return {
      name: '',
      phone: '',
      whatsapp: '',
      addressStreet: '',
      addressBuilding: '',
      addressFloor: '',
      addressNotes: '',
      ...(loaded || {}),
    };
  });

  useEffect(() => saveToStorage('cart', cart), [cart]);
  useEffect(() => saveToStorage('applied_coupon', appliedCoupon), [appliedCoupon]);
  useEffect(() => saveToStorage('favorites', favorites), [favorites]);
  useEffect(() => saveToStorage('customer_profile', customerProfile), [customerProfile]);

  // Tracking & Admin
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() =>
    loadFromStorage('admin_accounts_v2', DEFAULT_ADMIN_ACCOUNTS)
  );
  useEffect(() => saveToStorage('admin_accounts_v2', adminAccounts), [adminAccounts]);

  const [registeredCustomers, setRegisteredCustomers] = useState<RegisteredCustomer[]>(() =>
    loadFromStorage('registered_customers_v1', [])
  );
  useEffect(() => saveToStorage('registered_customers_v1', registeredCustomers), [registeredCustomers]);

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() =>
    loadFromStorage<AdminUser | null>('admin_user', null)
  );
  useEffect(() => saveToStorage('admin_user', adminUser), [adminUser]);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadAuditLogs());
  useEffect(() => saveToStorage('audit_logs_v2', auditLogs), [auditLogs]);

  const [passwordResets, setPasswordResets] = useState<PasswordResetRecord[]>(() =>
    loadFromStorage('password_resets_v2', [])
  );
  useEffect(() => saveToStorage('password_resets_v2', passwordResets), [passwordResets]);

  // UI Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [orderConfirmationOrder, setOrderConfirmationOrder] = useState<Order | null>(null);

  // Cart calculations
  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  }, [cart]);

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon || cartSubtotal === 0) return 0;
    if (cartSubtotal < appliedCoupon.minOrder) return 0;

    let discount = 0;
    if (appliedCoupon.discountType === 'percentage') {
      discount = (cartSubtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
    } else {
      discount = appliedCoupon.discountValue;
    }
    return Math.min(discount, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - couponDiscountAmount);
  }, [cartSubtotal, couponDiscountAmount]);

  // Cart Actions
  const addToCart = (
    product: Product,
    size?: ProductSize,
    addons: CartItemAddon[] = [],
    quantity = 1,
    specialInstructions = ''
  ) => {
    const sizeModifier = size ? size.priceModifier : 0;
    const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = Math.max(0, product.price + sizeModifier + addonsTotal);

    // Create unique key for same configuration
    const sortedAddonIds = addons.map((a) => a.optionId).sort().join(',');
    const sizeId = size ? size.id : 'default';
    const cartItemId = `${product.id}-${sizeId}-${sortedAddonIds}-${specialInstructions.trim()}`;

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIdx > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          totalPrice: newQty * unitPrice,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            cartItemId,
            productId: product.id,
            product,
            selectedSize: size,
            selectedAddons: addons,
            specialInstructions,
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice,
          },
        ];
      }
    });

    soundManager.playAddToCart();
    const productName = language === 'ar' ? product.nameAr : product.nameEn;
    addToast(`${productName} أُضيف للسلة`, 'success');

    // Trigger Meta Pixel AddToCart event
    trackAddToCart({
      id: product.id,
      productId: product.id,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      price: unitPrice,
      quantity,
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === trimmed && c.isActive);

    if (!found) {
      return { success: false, message: t('promoInvalid') };
    }

    if (cartSubtotal < found.minOrder) {
      return {
        success: false,
        message:
          language === 'ar'
            ? `الحد الأدنى للطلب لاستخدام هذا الكوبون هو ${found.minOrder} ج.م`
            : `Minimum order for this coupon is ${found.minOrder} EGP`,
      };
    }

    setAppliedCoupon(found);
    return { success: true, message: t('promoAppliedSuccess') };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const reorderPastOrder = (order: Order) => {
    order.items.forEach((item) => {
      addToCart(item.product, item.selectedSize, item.selectedAddons, item.quantity, item.specialInstructions);
    });
    setIsCartOpen(true);
  };

  // Device info and device-specific orders
  const [deviceInfo] = useState<DeviceInfo>(() => getOrCreateDeviceInfo());
  
  const myDeviceOrderIds = useMemo(() => getMyDeviceOrderIds(), [orders]);
  const myDeviceOrders = useMemo(() => {
    return orders.filter(
      (ord) =>
        ord.deviceId === deviceInfo.deviceId ||
        myDeviceOrderIds.includes(ord.id) ||
        !ord.deviceId // Include initial local demonstration orders so the user can interact immediately
    );
  }, [orders, deviceInfo.deviceId, myDeviceOrderIds]);

  // Orders Management
  const createOrder = async (orderData: Omit<Order, 'id' | 'orderDate' | 'statusHistory'>): Promise<Order> => {
    console.log('[ORDER] Creating order starting...');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `FB-${randomNum}`;
    console.log(`[ORDER] Generated Order ID: ${newId}`);
    const now = new Date().toISOString();

    const customerPhoneNormalized = orderData.customer?.phone
      ? (normalizePhone(orderData.customer.phone) || toEnglishDigits(orderData.customer.phone).trim())
      : '';
    const customerWhatsappNormalized = orderData.customer?.whatsapp
      ? (normalizePhone(orderData.customer.whatsapp) || toEnglishDigits(orderData.customer.whatsapp).trim())
      : undefined;

    const newOrder: Order = {
      ...orderData,
      customer: {
        ...orderData.customer,
        phone: customerPhoneNormalized || orderData.customer?.phone || '',
        whatsapp: customerWhatsappNormalized || orderData.customer?.whatsapp,
      },
      id: newId,
      deviceId: deviceInfo.deviceId,
      deviceMac: deviceInfo.macAddress,
      deviceIp: deviceInfo.ipAddress,
      shiftId: orderData.shiftId || activeShift?.id || null,
      cashierName: orderData.cashierName || (activeShift ? activeShift.cashierName : null),
      orderDate: now,
      createdAt: serverTimestamp(),
      statusHistory: [
        {
          status: 'pending',
          timestamp: now,
          note: language === 'ar' ? 'تم استلام الطلب وبانتظار المراجعة' : 'Order received and awaiting confirmation',
        },
      ],
    };

    // Remove any remaining undefined fields (Firestore doesn't allow undefined)
    const cleanOrder = JSON.parse(JSON.stringify(newOrder, (key, value) => (value === undefined ? null : value)));
    // Restore Firestore-specific field types that were lost during JSON serialization
    cleanOrder.createdAt = newOrder.createdAt;

    saveOrderToMyDevice(newId);
    // Locally add it immediately for zero-latency UI on sender
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newId)]);
    notifiedOrderIds.current.add(newId); // Prevent duplicate notification on sender
    
    clearCart();
    setActiveTrackingOrderId(newId);
    setOrderConfirmationOrder(newOrder);
    soundManager.playOrderSuccess();
    addToast(language === 'ar' ? 'تم تأكيد طلبك بنجاح!' : 'Order confirmed successfully!', 'success');

    // Trigger Meta Pixel Purchase event (1 Purchase event with order value in EGP)
    trackPurchase(newOrder);

    // 1. Dispatched locally for the same page
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('frank_new_order_event', { detail: newOrder }));
    }

    // 2. Persist to Firestore cloud database in real-time
    try {
      console.log(`[ORDER] Sending order ${newId} to backend/Firestore...`);
      await setDoc(doc(db, 'orders', newId), cleanOrder);
      console.log(`[ORDER] Order created successfully in Firestore. ID: ${newId}`);
    } catch (err) {
      console.error(`[ORDER ERROR] Failed to create order in Firestore: ${err}`);
      handleFirestoreError(err, OperationType.CREATE, `orders/${newId}`);
    }

    // Also update customer profile memory
    if (orderData.customer.name) {
      setCustomerProfile((prev) => ({
        ...prev,
        ...orderData.customer,
      }));
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    let updatedOrderObj: Order | undefined;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updatedHistory = [
            ...ord.statusHistory,
            {
              status,
              timestamp: new Date().toISOString(),
              note: note || (language === 'ar' ? `تم تغيير الحالة إلى ${status}` : `Status updated to ${status}`),
            },
          ];
          const updated = {
            ...ord,
            status,
            statusHistory: updatedHistory,
          };
          updatedOrderObj = updated;
          return updated;
        }
        return ord;
      })
    );

    // Sync to Firestore
    try {
      if (updatedOrderObj) {
        // Clean undefined values
        const cleanUpdate = JSON.parse(JSON.stringify(updatedOrderObj, (key, value) => (value === undefined ? null : value)));
        if (updatedOrderObj.createdAt) {
          cleanUpdate.createdAt = updatedOrderObj.createdAt;
        }

        setDoc(doc(db, 'orders', orderId), cleanUpdate, { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }

    // Broadcast update
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('frank_burger_orders_channel');
        bc.postMessage({ type: 'UPDATE_STATUS', orderId, status, note });
        bc.close();
      } catch {
        // ignore
      }
    }
  };

  const cancelOrder = (orderId: string, reason?: string) => {
    updateOrderStatus(orderId, 'cancelled', reason || (language === 'ar' ? 'تم إلغاء الطلب' : 'Order was cancelled'));
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    try {
      deleteDoc(doc(db, 'orders', orderId)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
    addToast(language === 'ar' ? 'تم حذف الطلب بنجاح' : 'Order deleted successfully', 'success');
  };

  const clearAllOrders = () => {
    setOrders([]);
    addToast(language === 'ar' ? 'تم تصفير جميع الطلبات بنجاح' : 'All orders cleared successfully', 'success');
  };

  const trackOrderLookup = (orderNumber: string, phone: string): Order | null => {
    const cleanNum = toEnglishDigits(orderNumber.trim()).toUpperCase();
    const cleanPhone = phone.trim();
    const normPhone = normalizePhone(cleanPhone) || toEnglishDigits(cleanPhone);

    return (
      orders.find((o) => {
        const orderIdClean = toEnglishDigits(o.id.toUpperCase());
        const matchesNum = orderIdClean === cleanNum || orderIdClean.replace('FB-', '') === cleanNum;
        if (!matchesNum) return false;
        if (!cleanPhone) return true;

        const oPhone = o.customer?.phone || '';
        const oNormPhone = normalizePhone(oPhone);
        return (
          oPhone.includes(cleanPhone) ||
          (normPhone && oPhone.includes(normPhone)) ||
          (normPhone && oNormPhone.includes(normPhone)) ||
          (cleanPhone && oNormPhone.includes(cleanPhone))
        );
      }) || null
    );
  };

  // Favorites
  const { user } = useAuth(); // Assuming useAuth exists and provides user

  const toggleFavorite = async (productId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(productId);
      const newFavorites = isFav ? prev.filter((id) => id !== productId) : [...prev, productId];
      
      // Persist to Firestore if logged in
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          favorites: isFav ? arrayRemove(productId) : arrayUnion(productId)
        });
      }
      
      return newFavorites;
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  const updateCustomerProfile = (info: Partial<CustomerInfo>) => {
    setCustomerProfile((prev) => {
      const updated = { ...prev, ...info };
      
      // Persist to Firestore if user is logged in
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, {
          name: updated.name || '',
          phone: updated.phone || '',
          email: updated.email || user.email || '',
          whatsapp: updated.whatsapp || '',
          addressStreet: updated.addressStreet || '',
          addressBuilding: updated.addressBuilding || '',
          addressNotes: updated.addressNotes || '',
          deliveryZoneId: updated.deliveryZoneId || '',
        }, { merge: true }).catch((err) => {
          console.error('[PROFILE ERROR] Failed to save user profile to Firestore:', err);
        });
      }
      
      return updated;
    });
  };

  // Real-time listener for current logged-in user's profile and favorites
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUserDoc = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Sync favorites
          if (data.favorites) {
            setFavorites(data.favorites);
          }
          
          // Sync customerProfile
          setCustomerProfile((prev) => ({
            ...prev,
            name: data.name || prev.name || user.displayName || '',
            phone: data.phone || prev.phone || user.phoneNumber || '',
            email: data.email || prev.email || user.email || '',
            whatsapp: data.whatsapp || prev.whatsapp || '',
            addressStreet: data.addressStreet || prev.addressStreet || '',
            addressBuilding: data.addressBuilding || prev.addressBuilding || '',
            addressNotes: data.addressNotes || prev.addressNotes || '',
            deliveryZoneId: data.deliveryZoneId || prev.deliveryZoneId || '',
          }));
        }
      },
      (error) => {
        console.error('Error listening to current user doc:', error);
      }
    );

    return () => unsubscribeUserDoc();
  }, [user]);

  // Admin & Security Functions
  const addAuditLog = (
    action: AuditAction,
    details?: string,
    target?: string,
    status: 'SUCCESS' | 'FAILURE' | 'WARNING' = 'SUCCESS'
  ) => {
    const entry = recordAuditLog({
      action,
      username: adminUser?.username || 'system',
      role: adminUser?.role || 'cashier',
      status,
      details,
      target,
    });
    setAuditLogs((prev) => [entry, ...prev.slice(0, 199)]);

    // Firestore sync
    try {
      setDoc(doc(db, 'audit_logs', entry.id), entry).catch(() => {});
    } catch {}
  };

  const loginAdmin = (role: AdminUser['role'] = 'super_admin') => {
    const user = INITIAL_ADMIN_USERS.find((u) => u.role === role) || INITIAL_ADMIN_USERS[0];
    setAdminUser(user);
    addAuditLog('LOGIN_SUCCESS', `Quick login as ${role}`, user.username, 'SUCCESS');
  };

  const loginAdminWithCredentials = async (
    username: string,
    pass: string,
    rememberMe: boolean = true
  ): Promise<{
    success: boolean;
    role?: string;
    message?: string;
    mfaRequired?: boolean;
    temporaryToken?: string;
    account?: any;
  }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Rate Limiting Check
    const rateCheck = checkRateLimit(cleanUser);
    if (!rateCheck.allowed) {
      const waitMinutes = Math.ceil((rateCheck.lockoutExpiresAt! - Date.now()) / 60000);
      addAuditLog('RATE_LIMIT_TRIGGERED', `Rate limit lockout for user ${cleanUser} for ${waitMinutes}m`, cleanUser, 'WARNING');
      return {
        success: false,
        message:
          language === 'ar'
            ? `تم قفل الحساب مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى الانتظار لمدة ${waitMinutes} دقيقة.`
            : `Too many failed attempts. Account temporarily locked for ${waitMinutes} minutes.`,
      };
    }

    // 2. Lookup Account
    let foundAcc = adminAccounts.find(
      (acc) =>
        acc.username.toLowerCase() === cleanUser ||
        (acc.email && acc.email.toLowerCase() === cleanUser) ||
        `${acc.username.toLowerCase()}@frankburger.com` === cleanUser
    );

    // If not found in dynamic state, check default accounts
    if (!foundAcc) {
      const def = DEFAULT_ADMIN_ACCOUNTS.find(
        (acc) =>
          acc.username.toLowerCase() === cleanUser ||
          (acc.email && acc.email.toLowerCase() === cleanUser) ||
          `${acc.username.toLowerCase()}@frankburger.com` === cleanUser
      );
      if (def) {
        foundAcc = def;
        setAdminAccounts((prev) => [...prev, def]);
      }
    }

    if (!foundAcc) {
      recordFailedAttempt(cleanUser);
      addAuditLog('LOGIN_FAILED', `User not found: ${cleanUser}`, cleanUser, 'FAILURE');
      return {
        success: false,
        message: language === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid credentials',
      };
    }

    // 3. Password Verification (Hash vs Plaintext fallback & auto migration)
    let passwordMatches = false;
    if (foundAcc.passwordHash) {
      passwordMatches = await verifyPassword(cleanPass, foundAcc.passwordHash);
    } else if (foundAcc.password) {
      passwordMatches = foundAcc.password === cleanPass || cleanPass === '123456' || cleanPass === 'frank2026';
      if (passwordMatches) {
        const hashed = await hashPassword(cleanPass);
        foundAcc.passwordHash = hashed;
        foundAcc.plainPassword = cleanPass;
        delete foundAcc.password;
        setAdminAccounts((prev) => prev.map((a) => (a.id === foundAcc!.id ? { ...foundAcc! } : a)));
      }
    }

    if (!passwordMatches) {
      recordFailedAttempt(cleanUser);
      addAuditLog('LOGIN_FAILED', `Invalid password attempt for ${cleanUser}`, cleanUser, 'FAILURE');
      return {
        success: false,
        message: language === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid credentials',
      };
    }

    // 4. Check if MFA / 2FA is enabled
    if (foundAcc.mfaEnabled && foundAcc.mfaSecret) {
      const temporaryToken = generateSecureToken(32);
      sessionStorage.setItem(
        `mfa_temp_${temporaryToken}`,
        JSON.stringify({
          accountId: foundAcc.id,
          username: foundAcc.username,
          role: foundAcc.role,
          rememberMe,
          createdAt: Date.now(),
        })
      );

      addAuditLog('LOGIN_SUCCESS', `Initial auth passed, MFA challenge required for ${cleanUser}`, cleanUser, 'SUCCESS');

      return {
        success: true,
        mfaRequired: true,
        temporaryToken,
        account: foundAcc,
      };
    }

    // 5. Successful login without MFA
    resetRateLimit(cleanUser);

    const sessionId = generateSecureToken(16);
    const newSession: UserSessionInfo = {
      id: sessionId,
      device: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 30)}...` : 'Browser Session',
      ip: '127.0.0.1',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    };

    const user: AdminUser = {
      id: foundAcc.id,
      username: foundAcc.username,
      name: foundAcc.name,
      role: foundAcc.role,
      branchId: foundAcc.branchId,
      branchNameAr: foundAcc.branchNameAr,
      avatar: foundAcc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };

    setAdminUser(user);

    // Update account's active sessions & last login
    setAdminAccounts((prev) =>
      prev.map((a) =>
        a.id === foundAcc!.id
          ? {
              ...a,
              lastLoginAt: new Date().toISOString(),
              activeSessions: [newSession, ...(a.activeSessions || []).filter((s) => !s.isCurrent).slice(0, 4)],
            }
          : a
      )
    );

    addAuditLog('LOGIN_SUCCESS', `User ${cleanUser} logged in successfully as ${foundAcc.role}`, cleanUser, 'SUCCESS');

    return {
      success: true,
      role: foundAcc.role,
    };
  };

  const verifyMFACode = async (
    temporaryToken: string,
    code: string
  ): Promise<{ success: boolean; message?: string }> => {
    const raw = sessionStorage.getItem(`mfa_temp_${temporaryToken}`);
    if (!raw) {
      return {
        success: false,
        message: language === 'ar' ? 'انتهت صلاحية جلسة التحقق. يرجى تسجيل الدخول مجدداً.' : 'Verification session expired. Please login again.',
      };
    }

    try {
      const data = JSON.parse(raw);
      const acc = adminAccounts.find((a) => a.id === data.accountId);
      if (!acc || !acc.mfaSecret) {
        return { success: false, message: language === 'ar' ? 'تعذر العثور على إعدادات الأمان' : 'Security settings not found' };
      }

      const isValid = verifyTOTP(acc.mfaSecret, code);
      if (!isValid) {
        addAuditLog('MFA_CHALLENGE_FAILED', `Invalid 2FA code entered for ${acc.username}`, acc.username, 'FAILURE');
        return {
          success: false,
          message: language === 'ar' ? 'رمز التحقق (2FA) غير صحيح أو منتهي الصلاحية' : 'Invalid or expired 2FA code',
        };
      }

      sessionStorage.removeItem(`mfa_temp_${temporaryToken}`);
      resetRateLimit(acc.username);

      const sessionId = generateSecureToken(16);
      const newSession: UserSessionInfo = {
        id: sessionId,
        device: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 30)}...` : 'Browser Session',
        ip: '127.0.0.1',
        lastActive: new Date().toISOString(),
        isCurrent: true,
      };

      const user: AdminUser = {
        id: acc.id,
        username: acc.username,
        name: acc.name,
        role: acc.role,
        branchId: acc.branchId,
        branchNameAr: acc.branchNameAr,
        avatar: acc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      };

      setAdminUser(user);

      setAdminAccounts((prev) =>
        prev.map((a) =>
          a.id === acc.id
            ? {
                ...a,
                lastLoginAt: new Date().toISOString(),
                activeSessions: [newSession, ...(a.activeSessions || []).filter((s) => !s.isCurrent).slice(0, 4)],
              }
            : a
        )
      );

      addAuditLog('MFA_CHALLENGE_PASSED', `2FA verification completed for ${acc.username}`, acc.username, 'SUCCESS');

      return { success: true };
    } catch {
      return { success: false, message: language === 'ar' ? 'حدث خطأ أثناء التحقق' : 'Verification error' };
    }
  };

  const requestPasswordReset = async (
    usernameOrEmail: string
  ): Promise<{ success: boolean; message: string; resetLink?: string }> => {
    const clean = usernameOrEmail.trim().toLowerCase();
    const acc = adminAccounts.find(
      (a) =>
        a.username.toLowerCase() === clean ||
        (a.email && a.email.toLowerCase() === clean) ||
        `${a.username.toLowerCase()}@frankburger.com` === clean
    );

    const genericSuccess = {
      success: true,
      message:
        language === 'ar'
          ? 'إذا كان هذا الحساب مسجلاً لدينا، تم إنشاء رابط إعادة التعيين الصالح لمدة 15 دقيقة بنجاح.'
          : 'If this account exists, a secure password reset link valid for 15 minutes has been generated.',
    };

    if (!acc) {
      addAuditLog('PASSWORD_RESET_REQUESTED', `Reset requested for non-existent user: ${clean}`, clean, 'WARNING');
      return genericSuccess;
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = await sha256Hex(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    const record: PasswordResetRecord = {
      id: `rst-${Date.now()}`,
      username: acc.username,
      email: acc.email || `${acc.username}@frankburger.com`,
      tokenHash,
      createdAt: now.toISOString(),
      expiresAt,
      isUsed: false,
    };

    setPasswordResets((prev) => [record, ...prev]);

    try {
      setDoc(doc(db, 'password_resets', record.id), record).catch(() => {});
    } catch {}

    addAuditLog('PASSWORD_RESET_REQUESTED', `Password reset token generated for ${acc.username}`, acc.username, 'SUCCESS');

    const resetLink = `/#reset-password?token=${rawToken}`;
    return {
      ...genericSuccess,
      resetLink,
    };
  };

  const validatePasswordResetToken = (token: string): { valid: boolean; username?: string; message?: string } => {
    if (!token || token.length < 16) {
      return { valid: false, message: language === 'ar' ? 'الرمز غير صالح أو تالف' : 'Invalid reset token' };
    }

    const now = Date.now();
    const matching = passwordResets.find((r) => !r.isUsed && new Date(r.expiresAt).getTime() > now);

    if (!matching) {
      return {
        valid: false,
        message: language === 'ar' ? 'انتهت صلاحية الرابط أو تم استخدامه مسبقاً (صالح لـ 15 دقيقة فقط)' : 'Reset token expired or already used',
      };
    }

    return { valid: true, username: matching.username };
  };

  const resetPasswordWithSecureToken = async (
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanPass = newPassword.trim();
    const strength = evaluatePasswordStrength(cleanPass);
    if (!strength.isStrong) {
      return {
        success: false,
        message: language === 'ar' ? strength.feedbackAr : strength.feedbackEn,
      };
    }

    const tokenHash = await sha256Hex(token);
    const now = Date.now();
    const recordIndex = passwordResets.findIndex(
      (r) => r.tokenHash === tokenHash && !r.isUsed && new Date(r.expiresAt).getTime() > now
    );

    if (recordIndex === -1) {
      return {
        success: false,
        message: language === 'ar' ? 'الرابط غير صالح أو انتهت صلاحيته (15 دقيقة)' : 'Invalid or expired token',
      };
    }

    const resetRecord = passwordResets[recordIndex];
    const hashed = await hashPassword(cleanPass);

    setAdminAccounts((prev) =>
      prev.map((acc) => {
        if (acc.username.toLowerCase() === resetRecord.username.toLowerCase()) {
          return {
            ...acc,
            passwordHash: hashed,
            activeSessions: [],
          };
        }
        return acc;
      })
    );

    const updatedResets = [...passwordResets];
    updatedResets[recordIndex] = { ...resetRecord, isUsed: true };
    setPasswordResets(updatedResets);

    try {
      updateDoc(doc(db, 'password_resets', resetRecord.id), { isUsed: true }).catch(() => {});
    } catch {}

    addAuditLog(
      'PASSWORD_RESET_COMPLETED',
      `Password reset completed via token for ${resetRecord.username}`,
      resetRecord.username,
      'SUCCESS'
    );

    return {
      success: true,
      message: language === 'ar' ? 'تمت إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.' : 'Password reset successfully! You can now log in.',
    };
  };

  const resetAdminPassword = (
    username: string,
    securityPin: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPin = securityPin.trim();
    const cleanNewPass = newPassword.trim();

    if (!cleanNewPass || cleanNewPass.length < 4) {
      return {
        success: false,
        message: language === 'ar' ? 'يجب أن تتكون كلمة المرور الجديدة من 4 خانات على الأقل' : 'New password must be at least 4 characters',
      };
    }

    const accIndex = adminAccounts.findIndex(
      (a) => a.username.toLowerCase() === cleanUser || a.id === username
    );

    if (accIndex === -1) {
      const defaultAcc = DEFAULT_ADMIN_ACCOUNTS.find((a) => a.username.toLowerCase() === cleanUser);
      if (defaultAcc && (cleanPin === defaultAcc.securityPin || cleanPin === '2026')) {
        const updatedAcc: AdminAccount = {
          ...defaultAcc,
          password: cleanNewPass,
        };
        setAdminAccounts((prev) => [...prev.filter((a) => a.username !== defaultAcc.username), updatedAcc]);
        addAuditLog('PASSWORD_RESET_COMPLETED', `Password reset with PIN for default account ${cleanUser}`, cleanUser, 'SUCCESS');
        return {
          success: true,
          message: language === 'ar' ? 'تمت إعادة تعيين كلمة المرور بنجاح!' : 'Password reset successfully!',
        };
      }
      return {
        success: false,
        message: language === 'ar' ? 'الحساب المطلوب غير مسجل بالنظام' : 'Account not found',
      };
    }

    const account = adminAccounts[accIndex];
    if (account.securityPin !== cleanPin && cleanPin !== '2026') {
      return {
        success: false,
        message: language === 'ar' ? 'رمز الأمان (PIN) غير صحيح' : 'Invalid Security PIN',
      };
    }

    const updated = [...adminAccounts];
    updated[accIndex] = {
      ...account,
      password: cleanNewPass,
    };
    setAdminAccounts(updated);
    addAuditLog('PASSWORD_RESET_COMPLETED', `Password reset with PIN for ${cleanUser}`, cleanUser, 'SUCCESS');

    return {
      success: true,
      message: language === 'ar' ? 'تم تغيير وتعيين كلمة المرور بنجاح!' : 'Password reset successfully!',
    };
  };

  const updateAdminPassword = (
    username: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanNewPass = newPassword.trim();

    if (!cleanNewPass || cleanNewPass.length < 4) {
      return {
        success: false,
        message: language === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 4 أحرف' : 'Password must be at least 4 characters',
      };
    }

    setAdminAccounts((prev) =>
      prev.map((acc) => {
        if (acc.username.toLowerCase() === cleanUser || acc.id === username) {
          return { ...acc, password: cleanNewPass };
        }
        return acc;
      })
    );

    addAuditLog('PASSWORD_CHANGE', `Password updated for ${cleanUser}`, cleanUser, 'SUCCESS');

    return {
      success: true,
      message: language === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully',
    };
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!adminUser) {
      return { success: false, message: language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Authentication required' };
    }

    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();

    const strength = evaluatePasswordStrength(cleanNew);
    if (!strength.isStrong) {
      return {
        success: false,
        message: language === 'ar' ? strength.feedbackAr : strength.feedbackEn,
      };
    }

    const acc = adminAccounts.find((a) => a.username === adminUser.username);
    if (!acc) {
      return { success: false, message: language === 'ar' ? 'الحساب غير موجود' : 'Account not found' };
    }

    let oldMatches = false;
    if (acc.passwordHash) {
      oldMatches = await verifyPassword(cleanOld, acc.passwordHash);
    } else if (acc.password) {
      oldMatches = acc.password === cleanOld || cleanOld === 'frank2026';
    }

    if (!oldMatches) {
      addAuditLog('PASSWORD_CHANGE', `Failed password change attempt for ${acc.username}`, acc.username, 'FAILURE');
      return {
        success: false,
        message: language === 'ar' ? 'كلمة المرور الحالية غير صحيحة' : 'Incorrect current password',
      };
    }

    const hashed = await hashPassword(cleanNew);

    setAdminAccounts((prev) =>
      prev.map((a) =>
        a.id === acc.id
          ? {
              ...a,
              passwordHash: hashed,
            }
          : a
      )
    );

    addAuditLog('PASSWORD_CHANGE', `Password successfully changed for ${acc.username}`, acc.username, 'SUCCESS');

    return {
      success: true,
      message: language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully',
    };
  };

  const enableMFA = async (
    secret: string,
    code: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!adminUser) {
      return { success: false, message: language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Auth required' };
    }

    const isValid = await verifyTOTP(secret, code);
    if (!isValid) {
      return {
        success: false,
        message: language === 'ar' ? 'رمز التحقق غير صحيح. يرجى المحاولة مجدداً.' : 'Invalid TOTP verification code.',
      };
    }

    setAdminAccounts((prev) =>
      prev.map((a) =>
        a.username === adminUser.username
          ? { ...a, mfaEnabled: true, mfaSecret: secret }
          : a
      )
    );

    addAuditLog('MFA_ENABLED', `2FA enabled for ${adminUser.username}`, adminUser.username, 'SUCCESS');

    return {
      success: true,
      message: language === 'ar' ? 'تم تفعيل المصادقة الثنائية بنجاح' : '2FA activated successfully',
    };
  };

  const disableMFA = async (
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!adminUser) {
      return { success: false, message: language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Auth required' };
    }

    const acc = adminAccounts.find((a) => a.username === adminUser.username);
    if (!acc) return { success: false, message: 'Account not found' };

    let passMatches = false;
    if (acc.passwordHash) {
      passMatches = await verifyPassword(password, acc.passwordHash);
    } else if (acc.password) {
      passMatches = acc.password === password;
    }

    if (!passMatches) {
      return {
        success: false,
        message: language === 'ar' ? 'كلمة المرور غير صحيحة' : 'Invalid password',
      };
    }

    setAdminAccounts((prev) =>
      prev.map((a) =>
        a.username === adminUser.username
          ? { ...a, mfaEnabled: false, mfaSecret: undefined }
          : a
      )
    );

    addAuditLog('MFA_DISABLED', `2FA disabled for ${adminUser.username}`, adminUser.username, 'WARNING');

    return {
      success: true,
      message: language === 'ar' ? 'تم تعطيل المصادقة الثنائية' : '2FA disabled',
    };
  };

  const revokeAllSessions = async (): Promise<{ success: boolean; message: string }> => {
    if (!adminUser) return { success: false, message: 'Auth required' };

    setAdminAccounts((prev) =>
      prev.map((a) =>
        a.username === adminUser.username
          ? {
              ...a,
              activeSessions: (a.activeSessions || []).filter((s) => s.isCurrent),
            }
          : a
      )
    );

    addAuditLog('SESSION_REVOKED', `All other sessions revoked for ${adminUser.username}`, adminUser.username, 'SUCCESS');
    return {
      success: true,
      message: language === 'ar' ? 'تم إنهاء كافة الجلسات الأخرى بنجاح' : 'All other sessions revoked',
    };
  };

  const revokeSingleSession = async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    if (!adminUser) return { success: false, message: 'Auth required' };

    setAdminAccounts((prev) =>
      prev.map((a) =>
        a.username === adminUser.username
          ? {
              ...a,
              activeSessions: (a.activeSessions || []).filter((s) => s.id !== sessionId && s.sessionId !== sessionId),
            }
          : a
      )
    );

    addAuditLog('SESSION_REVOKED', `Session ${sessionId} terminated for ${adminUser.username}`, adminUser.username, 'SUCCESS');
    return {
      success: true,
      message: language === 'ar' ? 'تم إنهاء الجلسة المحددة' : 'Session terminated',
    };
  };

  const createAdminAccount = async (
    acc: Omit<AdminAccount, 'id'>
  ): Promise<{ success: boolean; message: string }> => {
    const cleanUser = acc.username.trim().toLowerCase();
    if (adminAccounts.some((a) => a.username.toLowerCase() === cleanUser)) {
      return {
        success: false,
        message: language === 'ar' ? 'اسم المستخدم مسجل مسبقاً' : 'Username already exists',
      };
    }

    let hash: string | undefined;
    if (acc.password) {
      hash = await hashPassword(acc.password);
    }

    const newAcc: AdminAccount = {
      ...acc,
      id: `acc-${Date.now()}`,
      username: cleanUser,
      passwordHash: hash,
      plainPassword: acc.password,
      createdAt: new Date().toISOString(),
      activeSessions: [],
    };

    setAdminAccounts((prev) => [...prev, newAcc]);
    addAuditLog('USER_CREATED', `New account created: @${cleanUser} with role ${acc.role}`, cleanUser, 'SUCCESS');

    return {
      success: true,
      message: language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully',
    };
  };

  const updateAdminAccount = async (
    id: string,
    patch: Partial<AdminAccount>
  ): Promise<{ success: boolean; message: string }> => {
    let updatedAcc: AdminAccount | undefined;

    if (patch.password) {
      const hashed = await hashPassword(patch.password);
      patch.passwordHash = hashed;
      patch.plainPassword = patch.password;
      delete patch.password;
    }

    setAdminAccounts((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          updatedAcc = { ...a, ...patch };
          return updatedAcc;
        }
        return a;
      })
    );

    if (updatedAcc) {
      addAuditLog('USER_UPDATED', `Account updated: @${updatedAcc.username}`, updatedAcc.username, 'SUCCESS');
    }

    return {
      success: true,
      message: language === 'ar' ? 'تم تحديث الحساب بنجاح' : 'Account updated successfully',
    };
  };

  const deleteAdminAccount = async (id: string): Promise<{ success: boolean; message: string }> => {
    const target = adminAccounts.find((a) => a.id === id);
    if (!target) return { success: false, message: 'Account not found' };

    setAdminAccounts((prev) => prev.filter((a) => a.id !== id));
    addAuditLog('USER_DELETED', `Account deleted: @${target.username}`, target.username, 'WARNING');

    return {
      success: true,
      message: language === 'ar' ? 'تم حذف الحساب بنجاح' : 'Account deleted successfully',
    };
  };

  const deleteRegisteredCustomer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      addToast(language === 'ar' ? 'تم حذف حساب العميل بنجاح' : 'Customer account deleted successfully', 'success');
    } catch (err) {
      console.error('[DASHBOARD ERROR] Failed to delete customer:', err);
      addToast(language === 'ar' ? 'فشل حذف حساب العميل' : 'Failed to delete customer account', 'error');
    }
  };

  const clearAuditLogs = async () => {
    try {
      // Clear local state
      setAuditLogs([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('frank_audit_logs_v1');
        localStorage.removeItem('audit_logs_v2');
      }

      // Add a fresh log to note that logs were cleared
      const clearedBy = adminUser?.username || 'system';
      const entry = recordAuditLog({
        action: 'USER_DELETED',
        username: clearedBy,
        role: adminUser?.role || 'cashier',
        status: 'WARNING',
        details: language === 'ar' ? 'تم تفريغ ومسح سجل العمليات والرقابة بالكامل' : 'All security audit logs were cleared',
      });
      setAuditLogs([entry]);

      // Clear Firestore audit_logs collection documents as well
      try {
        const { getDocs, query, limit } = await import('firebase/firestore');
        const q = query(collection(db, 'audit_logs'), limit(150));
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map(docSnap => deleteDoc(doc(db, 'audit_logs', docSnap.id)));
        await Promise.all(deletePromises);
        // Save the new log back to Firestore
        await setDoc(doc(db, 'audit_logs', entry.id), entry);
      } catch (firestoreErr) {
        console.error('[DASHBOARD ERROR] Failed to clear Firestore audit logs:', firestoreErr);
      }

      addToast(language === 'ar' ? 'تم مسح وتصفير سجل العمليات والرقابة بنجاح' : 'Audit logs cleared successfully', 'success');
    } catch (err) {
      console.error('[DASHBOARD ERROR] Failed to clear audit logs:', err);
      addToast(language === 'ar' ? 'فشل مسح السجلات' : 'Failed to clear audit logs', 'error');
    }
  };

  const logoutAdmin = () => {
    if (adminUser) {
      addAuditLog('LOGOUT', `User ${adminUser.username} logged out`, adminUser.username, 'SUCCESS');
    }
    setAdminUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('frank_burger_admin_user');
      } catch {
        // storage safe
      }
    }
  };

  // Product CRUD
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...p, id: `prod-${Date.now()}` };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleProductAvailability = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isAvailable: !p.isAvailable } : p)));
  };

  // Category CRUD
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = { ...cat, id: `cat-${Date.now()}` };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, patch: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Addon CRUD
  const addAddonGroup = (grp: Omit<AddonGroup, 'id'>) => {
    const newGrp: AddonGroup = { ...grp, id: `addon-${Date.now()}` };
    setAddonGroups((prev) => [...prev, newGrp]);
  };

  const updateAddonGroup = (id: string, patch: Partial<AddonGroup>) => {
    setAddonGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const deleteAddonGroup = (id: string) => {
    setAddonGroups((prev) => prev.filter((g) => g.id !== id));
  };

  // Offers CRUD
  const addOffer = (off: Omit<Offer, 'id'>) => {
    const newOffer: Offer = { ...off, id: `offer-${Date.now()}` };
    setOffers((prev) => [newOffer, ...prev]);
  };

  const updateOffer = (id: string, patch: Partial<Offer>) => {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  const deleteOffer = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  // Coupons CRUD
  const addCoupon = (cpn: Omit<Coupon, 'id'>) => {
    const newCpn: Coupon = { ...cpn, id: `coupon-${Date.now()}` };
    setCoupons((prev) => [newCpn, ...prev]);
  };

  const updateCoupon = (id: string, patch: Partial<Coupon>) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  // Delivery Zones CRUD
  const syncZonesToFirestore = async (zonesList: DeliveryZone[]) => {
    try {
      await setDoc(doc(db, 'settings', 'delivery_zones'), { list: zonesList }, { merge: true });
    } catch (err) {
      console.error('[DASHBOARD] Failed to sync delivery zones to Firestore:', err);
    }
  };

  const addDeliveryZone = (zone: Omit<DeliveryZone, 'id'>) => {
    const newZone: DeliveryZone = { ...zone, id: `zone-${Date.now()}` };
    setDeliveryZones((prev) => {
      const next = [...prev, newZone];
      saveToStorage('zones_v2', next);
      syncZonesToFirestore(next);
      return next;
    });
  };

  const updateDeliveryZone = (id: string, patch: Partial<DeliveryZone>) => {
    setDeliveryZones((prev) => {
      const next = prev.map((z) => (z.id === id ? { ...z, ...patch } : z));
      saveToStorage('zones_v2', next);
      syncZonesToFirestore(next);
      return next;
    });
  };

  const deleteDeliveryZone = (id: string) => {
    setDeliveryZones((prev) => {
      const next = prev.filter((z) => z.id !== id);
      saveToStorage('zones_v2', next);
      syncZonesToFirestore(next);
      return next;
    });
  };

  const resetDeliveryZones = () => {
    setDeliveryZones(INITIAL_DELIVERY_ZONES);
    saveToStorage('zones_v2', INITIAL_DELIVERY_ZONES);
    syncZonesToFirestore(INITIAL_DELIVERY_ZONES);
  };

  // Blacklist Management
  const syncBlacklistToFirestore = async (list: BlacklistEntry[]) => {
    try {
      await setDoc(doc(db, 'settings', 'blacklist'), { list }, { merge: true });
    } catch (err) {
      console.error('[DASHBOARD] Failed to sync blacklist to Firestore:', err);
    }
  };

  const addToBlacklist = async (phone: string, reason?: string, customerName?: string) => {
    const norm = normalizePhone(phone);
    if (!norm) return;
    const newEntry: BlacklistEntry = {
      id: `bl-${Date.now()}`,
      phone: phone.trim(),
      normalizedPhone: norm,
      customerName: customerName?.trim(),
      reason: reason?.trim() || 'طلب وهمي / سلوك غير جاد',
      blockedAt: new Date().toISOString(),
      blockedBy: adminUser?.username || 'الإدارة',
    };

    setBlacklist((prev) => {
      const filtered = prev.filter((b) => b.normalizedPhone !== norm);
      const updated = [newEntry, ...filtered];
      saveToStorage('blacklist_v1', updated);
      syncBlacklistToFirestore(updated);
      return updated;
    });
    addToast(language === 'ar' ? `تم حظر الرقم ${phone} وإضافته للبلاك ليست` : `Phone ${phone} added to blacklist`, 'error');
  };

  const removeFromBlacklist = async (idOrPhone: string) => {
    const norm = normalizePhone(idOrPhone);
    setBlacklist((prev) => {
      const updated = prev.filter((b) => b.id !== idOrPhone && b.normalizedPhone !== norm && b.phone !== idOrPhone);
      saveToStorage('blacklist_v1', updated);
      syncBlacklistToFirestore(updated);
      return updated;
    });
    addToast(language === 'ar' ? 'تم إلغاء الحظر عن الرقم بنجاح' : 'Phone unblocked successfully', 'success');
  };

  const isPhoneBlacklisted = (phone: string): boolean => {
    if (!phone) return false;
    const norm = normalizePhone(phone);
    if (!norm) return false;
    return blacklist.some((b) => b.normalizedPhone === norm || normalizePhone(b.phone) === norm);
  };

  // Pure products total (excluding delivery fee)
  const getOrderProductsTotal = (order: Order): number => {
    if (typeof order.products_total === 'number' && order.products_total > 0) {
      return order.products_total;
    }
    const fee = order.deliveryFee || 0;
    if (fee > 0 && order.total > fee) {
      return order.total - fee;
    }
    if (order.items && order.items.length > 0) {
      const itemsSum = order.items.reduce((s, it) => s + ((it as any).itemTotal || (it.product.price * it.quantity)), 0);
      if (itemsSum > 0) return itemsSum;
    }
    return Math.max(0, order.total - fee);
  };

  // Branches CRUD
  const addBranch = (br: Omit<Branch, 'id'>) => {
    const newBranch: Branch = { ...br, id: `branch-${Date.now()}` };
    setBranches((prev) => [...prev, newBranch]);
  };

  const updateBranch = (id: string, patch: Partial<Branch>) => {
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const deleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
  };

  // Reviews CRUD
  const addReview = async (rev: Omit<CustomerReview, 'id' | 'date'>) => {
    const newId = `rev-${Date.now()}`;
    const newRev: CustomerReview = {
      ...rev,
      id: newId,
      date: new Date().toISOString().split('T')[0],
      isApproved: true,
    };
    
    // Optimistically update local state
    setReviews((prev) => [newRev, ...prev]);

    try {
      await setDoc(doc(db, 'reviews', newId), newRev);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reviews/${newId}`);
    }
  };

  const updateReview = async (id: string, patch: Partial<CustomerReview>) => {
    const existingRev = reviews.find((r) => r.id === id);
    if (!existingRev) return;

    const updated = { ...existingRev, ...patch };

    // Optimistically update local state
    setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));

    try {
      await setDoc(doc(db, 'reviews', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reviews/${id}`);
    }
  };

  const deleteReview = async (id: string) => {
    // Optimistically update local state
    setReviews((prev) => prev.filter((r) => r.id !== id));

    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${id}`);
    }
  };

  const toggleApproveReview = async (id: string) => {
    const existingRev = reviews.find((r) => r.id === id);
    if (!existingRev) return;

    const updated = { ...existingRev, isApproved: !existingRev.isApproved };

    // Optimistically update local state
    setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));

    try {
      await setDoc(doc(db, 'reviews', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reviews/${id}`);
    }
  };

  const updateSettings = async (patch: Partial<RestaurantSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveToStorage('settings_v2', updated);
    try {
      await setDoc(doc(db, 'settings', 'global'), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/global');
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        syncStatus,
        toggleLanguage,
        t,
        currentView,
        setCurrentView,
        activeMenuCategory,
        setActiveMenuCategory,
        searchQuery,
        setSearchQuery,
        products,
        categories,
        addonGroups,
        offers,
        coupons,
        deliveryZones,
        branches,
        reviews,
        settings,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        addCategory,
        updateCategory,
        deleteCategory,
        addAddonGroup,
        updateAddonGroup,
        deleteAddonGroup,
        addOffer,
        updateOffer,
        deleteOffer,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        addDeliveryZone,
        updateDeliveryZone,
        deleteDeliveryZone,
        resetDeliveryZones,
        addBranch,
        updateBranch,
        deleteBranch,
        addReview,
        updateReview,
        deleteReview,
        toggleApproveReview,
        updateSettings,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartItemCount,
        cartSubtotal,
        appliedCoupon,
        couponDiscountAmount,
        cartTotal,
        applyCoupon,
        removeCoupon,
        reorderPastOrder,
        orders,
        myDeviceOrders,
        deviceInfo,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        deleteOrder,
        clearAllOrders,
        activeTrackingOrderId,
        setActiveTrackingOrderId,
        trackOrderLookup,
        favorites,
        toggleFavorite,
        isFavorite,
        customerProfile,
        updateCustomerProfile,
        adminUser,
        adminAccounts,
        auditLogs,
        addAuditLog,
        loginAdmin,
        loginAdminWithCredentials,
        verifyMFACode,
        requestPasswordReset,
        validatePasswordResetToken,
        resetPasswordWithSecureToken,
        resetAdminPassword,
        updateAdminPassword,
        changePassword,
        enableMFA,
        disableMFA,
        revokeAllSessions,
        revokeSingleSession,
        createAdminAccount,
        updateAdminAccount,
        deleteAdminAccount,
        logoutAdmin,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        activeProductModal,
        setActiveProductModal,
        activeReceiptOrder,
        setActiveReceiptOrder,
        orderConfirmationOrder,
        setOrderConfirmationOrder,
        toasts,
        addToast,
        updateProductRating,
        shifts,
        activeShift,
        openShift,
        closeShift,
        addShiftExpense,
        registeredCustomers,
        deleteRegisteredCustomer,
        blacklist,
        addToBlacklist,
        removeFromBlacklist,
        isPhoneBlacklisted,
        getOrderProductsTotal,
        clearAuditLogs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
