declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    TiktokAnalyticsObject?: any;
  }
}

export interface PixelEventLog {
  id: string;
  timestamp: string;
  eventName: string;
  platform: 'Meta' | 'TikTok' | 'Both';
  data: Record<string, any>;
  status: 'sent' | 'queued' | 'error';
  details?: string;
}

let activeFacebookId: string | null = null;
let activeFacebookTestCode: string | null = null;
let activeTiktokId: string | null = null;
const eventLogs: PixelEventLog[] = [];
type EventLogListener = (logs: PixelEventLog[]) => void;
const logListeners: Set<EventLogListener> = new Set();

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

// Send event to backend server endpoint for Meta Conversions API (CAPI)
export async function sendCapiEventToServer(
  eventName: string,
  eventId: string,
  customData: Record<string, any> = {},
  userData: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return;

  const pixelId = activeFacebookId || localStorage.getItem('fb_pixel_id') || '';
  const accessToken = localStorage.getItem('fb_capi_access_token') || '';
  const testCode = activeFacebookTestCode || getUrlTestEventCode();

  if (!pixelId) return;

  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');

  try {
    const res = await fetch('/api/pixel/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pixelId,
        accessToken,
        testEventCode: testCode,
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        userData: {
          fbp,
          fbc,
          ...userData,
        },
        customData,
      }),
    });
    const data = await res.json();
    if (data.success) {
      console.log(
        `%c[Meta CAPI Server] Successfully sent ${eventName} event | EventID: ${eventId}`,
        'color: #34A853; font-weight: bold; background: #e6f4ea; padding: 2px 6px; border-radius: 4px;'
      );
    } else if (data.warning) {
      console.log(`[Meta CAPI Note] ${data.warning}`);
    } else {
      console.warn(`[Meta CAPI Warning] ${eventName}:`, data.error);
    }
  } catch (err) {
    console.error(`[Meta CAPI Server Fetch Error] ${eventName}:`, err);
  }
}

function notifyListeners(newLog: PixelEventLog) {
  eventLogs.unshift(newLog);
  if (eventLogs.length > 50) eventLogs.pop();
  logListeners.forEach((fn) => {
    try {
      fn([...eventLogs]);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribePixelLogs(listener: EventLogListener) {
  logListeners.add(listener);
  listener([...eventLogs]);
  return () => {
    logListeners.delete(listener);
  };
}

export function getPixelLogs(): PixelEventLog[] {
  return [...eventLogs];
}

// Clean and extract numeric ID if user pasted full script tag or extra text
export function cleanPixelId(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // If user pasted numbers with spaces or hyphens
  const matches = trimmed.match(/\d{9,25}/);
  if (matches) return matches[0];
  return trimmed;
}

// Helper to get test event code from URL (?test_event_code=TEST...) or stored
export function getUrlTestEventCode(): string {
  if (typeof window === 'undefined') return '';
  try {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('test_event_code');
    if (urlCode) {
      localStorage.setItem('meta_test_event_code', urlCode);
      return urlCode;
    }
    return localStorage.getItem('meta_test_event_code') || '';
  } catch {
    return '';
  }
}

// Initialize Meta (Facebook) Pixel
export function initMetaPixel(pixelId?: string, testCode?: string, capiToken?: string) {
  if (typeof window === 'undefined') return;
  const idToUse = cleanPixelId(pixelId) || localStorage.getItem('fb_pixel_id') || '';
  const testEventCode = testCode?.trim() || getUrlTestEventCode();
  const capiAccessToken = capiToken?.trim() || localStorage.getItem('fb_capi_access_token') || '';

  if (testEventCode) {
    activeFacebookTestCode = testEventCode;
  }
  if (capiAccessToken) {
    localStorage.setItem('fb_capi_access_token', capiAccessToken);
  }

  if (!idToUse) return;
  localStorage.setItem('fb_pixel_id', idToUse);

  // 1. Inject Meta Pixel Base Code
  if (!window.fbq) {
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      t.id = 'facebook-jssdk';
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      } else {
        b.head.appendChild(t);
      }
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  }

  // 2. Initialize or Update Pixel Instance
  if (activeFacebookId !== idToUse) {
    try {
      // Disable automatic event detection and heuristic scraping to prevent Meta from auto-scraping total with shipping
      window.fbq('set', 'autoConfig', false, idToUse);

      if (activeFacebookTestCode) {
        window.fbq('init', idToUse, {}, { test_event_code: activeFacebookTestCode });
      } else {
        window.fbq('init', idToUse);
      }
      activeFacebookId = idToUse;
      console.log(
        `%c[Meta Pixel] Initialized successfully with ID: ${idToUse} ${activeFacebookTestCode ? `(Test Code: ${activeFacebookTestCode})` : ''} (autoConfig: false)`,
        'color: #1877F2; font-weight: bold; background: #eef4ff; padding: 2px 6px; border-radius: 4px;'
      );
    } catch (err) {
      console.error('[Meta Pixel] Error initializing:', err);
    }
  }
}

// Initialize TikTok Pixel
export function initTiktokPixel(pixelId?: string) {
  if (typeof window === 'undefined') return;
  const idToUse = pixelId?.trim() || localStorage.getItem('tt_pixel_id') || '';

  if (!idToUse) return;
  localStorage.setItem('tt_pixel_id', idToUse);

  if (!window.ttq) {
    (function (w: any, d: any, t: any) {
      w.TiktokAnalyticsObject = t;
      var ttq = (w[t] = w[t] || []);
      ttq.methods = [
        'page',
        'track',
        'identify',
        'instances',
        'debug',
        'on',
        'off',
        'once',
        'ready',
        'alias',
        'group',
        'enableCookie',
        'disableCookie',
        'holdConsent',
        'revokeConsent',
        'grantConsent',
      ];
      ttq.setAndDefer = function (t: any, e: any) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (var i = 0; i < ttq.methods.length; i++) {
        ttq.setAndDefer(ttq, ttq.methods[i]);
      }
      ttq.instance = function (t: any) {
        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) {
          ttq.setAndDefer(e, ttq.methods[n]);
        }
        return e;
      };
      ttq._t = ttq._t || {};
      ttq._t[t] = +new Date();
      ttq._o = ttq._o || {};
      ttq._i = ttq._i || {};
      ttq._i[t] = [];
      ttq._f = ttq._f || {};
      ttq._l = ttq._l || {};
      ttq._prev = ttq._prev || {};
      var s = d.createElement('script');
      s.type = 'text/javascript';
      s.async = !0;
      s.src = 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + idToUse;
      var a = d.getElementsByTagName('script')[0];
      if (a && a.parentNode) {
        a.parentNode.insertBefore(s, a);
      } else {
        d.head.appendChild(s);
      }
    })(window, document, 'ttq');
  }

  if (activeTiktokId !== idToUse) {
    try {
      window.ttq('load', idToUse);
      activeTiktokId = idToUse;
      console.log(
        `%c[TikTok Pixel] Loaded successfully with ID: ${idToUse}`,
        'color: #00f2fe; font-weight: bold; background: #000; padding: 2px 6px; border-radius: 4px;'
      );
    } catch (err) {
      console.error('[TikTok Pixel] Error loading:', err);
    }
  }
}

// Get active options with test code if available
function getMetaCustomOptions(customParams: Record<string, any> = {}) {
  const options: Record<string, any> = {};
  const testCode = activeFacebookTestCode || getUrlTestEventCode();
  if (testCode) {
    options.test_event_code = testCode;
  }
  return { ...customParams, ...options };
}

// 1. Track Page View
export function trackPageView(viewName?: string) {
  if (typeof window === 'undefined') return;
  const pageLabel = viewName || 'Home';
  const timestamp = new Date().toLocaleTimeString();
  const eventId = `pv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  // Make sure pixel is initialized if ID is stored in localStorage
  if (!activeFacebookId) {
    const savedId = localStorage.getItem('fb_pixel_id');
    if (savedId) initMetaPixel(savedId);
  }
  if (!activeTiktokId) {
    const savedId = localStorage.getItem('tt_pixel_id');
    if (savedId) initTiktokPixel(savedId);
  }

  // Meta Pixel (Client-Side)
  if (window.fbq) {
    try {
      const payload = getMetaCustomOptions({ page_name: pageLabel });
      window.fbq('track', 'PageView', payload, { eventID: eventId });
      console.log(`%c[Meta Pixel] Tracked PageView: ${pageLabel}`, 'color: #1877F2;');
    } catch (err) {
      console.error('[Meta Pixel] PageView tracking error:', err);
    }
  }

  // Meta Conversions API (Server-Side for iOS / Safari / AdBlocker bypass)
  sendCapiEventToServer('PageView', eventId, { page_name: pageLabel });

  // TikTok Pixel
  if (window.ttq) {
    try {
      window.ttq.page();
      console.log(`%c[TikTok Pixel] Tracked PageView: ${pageLabel}`, 'color: #00f2fe;');
    } catch (err) {
      console.error('[TikTok Pixel] PageView tracking error:', err);
    }
  }

  notifyListeners({
    id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp,
    eventName: 'PageView',
    platform: 'Both',
    data: { page: pageLabel },
    status: window.fbq || window.ttq ? 'sent' : 'queued',
  });
}

// 2. Track View Content (When opening a product modal)
export function trackViewContent(product: {
  id: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  price: number;
  category?: string;
}) {
  if (typeof window === 'undefined') return;
  const prodName = product.nameAr || product.nameEn || product.name || 'Burger Item';
  const prodPrice = Number(product.price) || 0;
  const prodCategory = product.category || 'Burgers';
  const timestamp = new Date().toLocaleTimeString();
  const eventId = `vc-${product.id}-${Date.now()}`;

  if (!activeFacebookId) {
    const savedId = localStorage.getItem('fb_pixel_id');
    if (savedId) initMetaPixel(savedId);
  }
  if (!activeTiktokId) {
    const savedId = localStorage.getItem('tt_pixel_id');
    if (savedId) initTiktokPixel(savedId);
  }

  // Meta Pixel
  if (window.fbq) {
    try {
      const payload = getMetaCustomOptions({
        content_name: prodName,
        content_category: prodCategory,
        content_ids: [String(product.id)],
        content_type: 'product',
        value: prodPrice,
        currency: 'EGP',
      });
      window.fbq('track', 'ViewContent', payload, { eventID: eventId });
      console.log(`%c[Meta Pixel] Tracked ViewContent: ${prodName} | ${prodPrice} EGP`, 'color: #1877F2;');
    } catch (err) {
      console.error('[Meta Pixel] ViewContent tracking error:', err);
    }
  }

  // Meta Conversions API (Server-Side)
  sendCapiEventToServer('ViewContent', eventId, {
    content_name: prodName,
    content_category: prodCategory,
    content_ids: [String(product.id)],
    content_type: 'product',
    value: prodPrice,
    currency: 'EGP',
  });

  // TikTok Pixel
  if (window.ttq) {
    try {
      window.ttq.track('ViewContent', {
        contents: [
          {
            content_id: String(product.id),
            content_type: 'product',
            content_name: prodName,
            price: prodPrice,
            quantity: 1,
            category: prodCategory,
          },
        ],
        value: prodPrice,
        currency: 'EGP',
      });
      console.log(`%c[TikTok Pixel] Tracked ViewContent: ${prodName} | ${prodPrice} EGP`, 'color: #00f2fe;');
    } catch (err) {
      console.error('[TikTok Pixel] ViewContent tracking error:', err);
    }
  }

  notifyListeners({
    id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp,
    eventName: 'ViewContent',
    platform: 'Both',
    data: { name: prodName, price: `${prodPrice} EGP`, id: product.id },
    status: window.fbq || window.ttq ? 'sent' : 'queued',
  });
}

// 3. Track Add To Cart
export function trackAddToCart(item: {
  id?: string;
  productId?: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  price: number;
  quantity?: number;
  category?: string;
}) {
  if (typeof window === 'undefined') return;
  const prodId = item.productId || item.id || 'prod';
  const prodName = item.nameAr || item.nameEn || item.name || 'Burger Item';
  const qty = item.quantity || 1;
  const itemPrice = Number(item.price) || 0;
  const totalVal = itemPrice * qty;
  const prodCategory = item.category || 'Burgers';
  const timestamp = new Date().toLocaleTimeString();
  const eventId = `atc-${prodId}-${Date.now()}`;

  if (!activeFacebookId) {
    const savedId = localStorage.getItem('fb_pixel_id');
    if (savedId) initMetaPixel(savedId);
  }
  if (!activeTiktokId) {
    const savedId = localStorage.getItem('tt_pixel_id');
    if (savedId) initTiktokPixel(savedId);
  }

  // Meta Pixel
  if (window.fbq) {
    try {
      const payload = getMetaCustomOptions({
        content_name: prodName,
        content_category: prodCategory,
        content_ids: [String(prodId)],
        content_type: 'product',
        value: totalVal,
        currency: 'EGP',
        quantity: qty,
      });
      window.fbq('track', 'AddToCart', payload, { eventID: eventId });
      console.log(`%c[Meta Pixel] Tracked AddToCart: ${prodName} (x${qty}) | Total: ${totalVal} EGP`, 'color: #1877F2;');
    } catch (err) {
      console.error('[Meta Pixel] AddToCart tracking error:', err);
    }
  }

  // Meta Conversions API (Server-Side)
  sendCapiEventToServer('AddToCart', eventId, {
    content_name: prodName,
    content_category: prodCategory,
    content_ids: [String(prodId)],
    content_type: 'product',
    value: totalVal,
    currency: 'EGP',
    quantity: qty,
  });

  // TikTok Pixel
  if (window.ttq) {
    try {
      window.ttq.track('AddToCart', {
        contents: [
          {
            content_id: String(prodId),
            content_type: 'product',
            content_name: prodName,
            price: itemPrice,
            quantity: qty,
            category: prodCategory,
          },
        ],
        value: totalVal,
        currency: 'EGP',
      });
      console.log(`%c[TikTok Pixel] Tracked AddToCart: ${prodName} (x${qty}) | Total: ${totalVal} EGP`, 'color: #00f2fe;');
    } catch (err) {
      console.error('[TikTok Pixel] AddToCart tracking error:', err);
    }
  }

  notifyListeners({
    id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp,
    eventName: 'AddToCart',
    platform: 'Both',
    data: { name: prodName, qty, total: `${totalVal} EGP` },
    status: window.fbq || window.ttq ? 'sent' : 'queued',
  });
}

// 4. Track Initiate Checkout
export function trackInitiateCheckout(cartItems: any[], totalValue: number) {
  if (typeof window === 'undefined') return;
  const numItems = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const itemIds = cartItems.map((item) => String(item.productId || item.product?.id || item.id || 'item'));
  const checkoutValue = Number(totalValue) || 0;
  const timestamp = new Date().toLocaleTimeString();
  const eventId = `ic-${Date.now()}`;

  if (!activeFacebookId) {
    const savedId = localStorage.getItem('fb_pixel_id');
    if (savedId) initMetaPixel(savedId);
  }
  if (!activeTiktokId) {
    const savedId = localStorage.getItem('tt_pixel_id');
    if (savedId) initTiktokPixel(savedId);
  }

  // Meta Pixel
  if (window.fbq) {
    try {
      const payload = getMetaCustomOptions({
        content_type: 'product',
        content_ids: itemIds,
        num_items: numItems,
        value: checkoutValue,
        currency: 'EGP',
      });
      window.fbq('track', 'InitiateCheckout', payload, { eventID: eventId });
      console.log(
        `%c[Meta Pixel] Tracked InitiateCheckout | Items: ${numItems} | Total: ${checkoutValue} EGP`,
        'color: #1877F2;'
      );
    } catch (err) {
      console.error('[Meta Pixel] InitiateCheckout tracking error:', err);
    }
  }

  // Meta Conversions API (Server-Side)
  sendCapiEventToServer('InitiateCheckout', eventId, {
    content_type: 'product',
    content_ids: itemIds,
    num_items: numItems,
    value: checkoutValue,
    currency: 'EGP',
  });

  // TikTok Pixel
  if (window.ttq) {
    try {
      const tiktokContents = cartItems.map((item) => ({
        content_id: String(item.productId || item.product?.id || item.id || 'item'),
        content_type: 'product',
        content_name: item.nameAr || item.nameEn || item.name || 'Burger Item',
        price: Number(item.price) || 0,
        quantity: item.quantity || 1,
      }));

      window.ttq.track('InitiateCheckout', {
        contents: tiktokContents,
        value: checkoutValue,
        currency: 'EGP',
      });
      console.log(
        `%c[TikTok Pixel] Tracked InitiateCheckout | Items: ${numItems} | Total: ${checkoutValue} EGP`,
        'color: #00f2fe;'
      );
    } catch (err) {
      console.error('[TikTok Pixel] InitiateCheckout tracking error:', err);
    }
  }

  notifyListeners({
    id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp,
    eventName: 'InitiateCheckout',
    platform: 'Both',
    data: { itemsCount: numItems, total: `${checkoutValue} EGP` },
    status: window.fbq || window.ttq ? 'sent' : 'queued',
  });
}

// 5. Track Complete Purchase
export function trackPurchase(order: {
  id: string;
  total: number;
  subtotal?: number;
  products_total?: number;
  deliveryFee?: number;
  shipping?: number;
  items?: any[];
  [key: string]: any;
}) {
  if (typeof window === 'undefined') return;

  // The definitive purchase value matching the exact order total displayed to the customer
  let purchaseValue = Number(order.total) || 0;

  if (purchaseValue <= 0) {
    if (typeof order.products_total === 'number' && order.products_total > 0) {
      purchaseValue = order.products_total + Number(order.deliveryFee || order.shipping || 0);
    } else if (typeof order.subtotal === 'number' && order.subtotal > 0) {
      purchaseValue = order.subtotal + Number(order.deliveryFee || order.shipping || 0);
    } else if (order.items && order.items.length > 0) {
      purchaseValue = order.items.reduce(
        (sum: number, item: any) => sum + (Number(item.totalPrice ?? item.price) || 0),
        0
      ) + Number(order.deliveryFee || order.shipping || 0);
    }
  }

  // Ensure clean rounded number
  purchaseValue = Math.round(purchaseValue * 100) / 100;

  const total = purchaseValue;
  const shipping = Number(order.deliveryFee ?? order.shipping ?? 0);
  const numItems = order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 1;
  const itemIds = order.items?.map((item: any) => String(item.productId || item.product?.id || item.id || 'item')) || [];
  const timestamp = new Date().toLocaleTimeString();

  if (!activeFacebookId) {
    const savedId = localStorage.getItem('fb_pixel_id');
    if (savedId) initMetaPixel(savedId);
  }
  if (!activeTiktokId) {
    const savedId = localStorage.getItem('tt_pixel_id');
    if (savedId) initTiktokPixel(savedId);
  }

  // Meta (Facebook) Pixel - Send actual total order purchase value matching order total
  if (window.fbq) {
    try {
      const payload = getMetaCustomOptions({
        content_type: 'product',
        content_ids: itemIds,
        num_items: numItems,
        value: purchaseValue, // Exact order total matching customer invoice & confirmation screen
        currency: 'EGP',
        order_id: order.id,
      });
      // Pass eventID and test_event_code for deduplication and test event tracking
      const eventOptions: Record<string, any> = { eventID: order.id };
      if (activeFacebookTestCode) {
        eventOptions.test_event_code = activeFacebookTestCode;
      }
      window.fbq('track', 'Purchase', payload, eventOptions);
      console.log(
        `%c[Meta Pixel] Tracked Purchase | Order: ${order.id} | Value: ${purchaseValue} EGP | Currency: EGP`,
        'color: #1877F2; font-weight: bold;'
      );
    } catch (err) {
      console.error('[Meta Pixel] Purchase tracking error:', err);
    }
  }

  // Meta Conversions API (Server-Side for 100% conversion tracking on iOS / Safari)
  sendCapiEventToServer(
    'Purchase',
    order.id,
    {
      content_type: 'product',
      content_ids: itemIds,
      num_items: numItems,
      value: purchaseValue,
      currency: 'EGP',
      order_id: order.id,
    },
    {
      phone: order.customer?.phone,
      name: order.customer?.name,
    }
  );

  // TikTok Pixel - Send actual total order purchase value
  if (window.ttq) {
    try {
      const tiktokContents =
        order.items?.map((item) => ({
          content_id: String(item.productId || item.product?.id || item.id || 'item'),
          content_type: 'product',
          content_name: item.nameAr || item.nameEn || item.name || 'Burger Item',
          price: Number(item.price) || 0,
          quantity: item.quantity || 1,
        })) || [];

      window.ttq.track('CompletePayment', {
        contents: tiktokContents,
        value: purchaseValue, // Exact order total matching customer invoice
        currency: 'EGP',
      });
      console.log(
        `%c[TikTok Pixel] Tracked CompletePayment (Purchase) | Order: ${order.id} | Value: ${purchaseValue} EGP`,
        'color: #00f2fe; font-weight: bold;'
      );
    } catch (err) {
      console.error('[TikTok Pixel] CompletePayment tracking error:', err);
    }
  }

  notifyListeners({
    id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp,
    eventName: 'Purchase',
    platform: 'Both',
    data: {
      orderId: order.id,
      value: `${purchaseValue} EGP`,
      order_total: `${purchaseValue} EGP`,
      shipping: `${shipping} EGP`,
      itemsCount: numItems,
    },
    status: window.fbq || window.ttq ? 'sent' : 'queued',
  });
}
