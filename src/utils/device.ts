export interface DeviceInfo {
  deviceId: string;
  macAddress: string;
  ipAddress: string;
  deviceModel: string;
  registeredAt: string;
}

const DEVICE_STORAGE_KEY = 'frank_device_meta_v1';
const DEVICE_ORDERS_KEY = 'frank_my_device_order_ids_v1';

export const getOrCreateDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'DEV-9104',
      macAddress: '4C:D5:77:2A:90:E1',
      ipAddress: '197.38.112.45',
      deviceModel: 'Web Browser',
      registeredAt: new Date().toISOString(),
    };
  }

  try {
    const cached = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // ignore
  }

  // Generate realistic unique MAC and Device ID
  const hex = '0123456789ABCDEF';
  const genByte = () => hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)];
  const mac = `4C:${genByte()}:${genByte()}:${genByte()}:${genByte()}:${genByte()}`;
  const randomDevNum = Math.floor(1000 + Math.random() * 9000);
  const devId = `DEV-${randomDevNum}`;
  
  // Egyptian ISP IP Range simulation (e.g. 197.38.xx.xx or 156.204.xx.xx)
  const ip = `197.38.${Math.floor(10 + Math.random() * 85)}.${Math.floor(5 + Math.random() * 240)}`;

  let model = 'متصفح الإنترنت';
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) model = 'Android Phone / Tablet';
    else if (/iphone|ipad|ipod/i.test(ua)) model = 'Apple iPhone / iPad';
    else if (/windows/i.test(ua)) model = 'Windows PC';
    else if (/macintosh/i.test(ua)) model = 'Apple Mac';
    else model = 'هذا الجهاز';
  }

  const newDevice: DeviceInfo = {
    deviceId: devId,
    macAddress: mac,
    ipAddress: ip,
    deviceModel: model,
    registeredAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(newDevice));
  } catch (e) {}

  return newDevice;
};

export const getMyDeviceOrderIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEVICE_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

export const saveOrderToMyDevice = (orderId: string) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getMyDeviceOrderIds();
    if (!current.includes(orderId)) {
      const updated = [orderId, ...current];
      localStorage.setItem(DEVICE_ORDERS_KEY, JSON.stringify(updated));
    }
  } catch (e) {}
};
