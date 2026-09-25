/**
 * Role-Based Access Control (RBAC) & Route Guard Helpers
 */

export type UserRole = 'admin' | 'cashier';

export enum Permission {
  VIEW_ORDERS = 'orders:view',
  CREATE_POS_ORDER = 'orders:create_pos',
  UPDATE_ORDER_STATUS = 'orders:update_status',
  CANCEL_ORDER = 'orders:cancel',
  DELETE_ORDER = 'orders:delete',
  MANAGE_SHIFTS = 'shifts:manage',

  VIEW_REPORTS = 'reports:view',
  VIEW_BRANCH_STATS = 'reports:branch_stats',
  MANAGE_PRODUCTS = 'products:manage',
  MANAGE_CATEGORIES = 'categories:manage',
  MANAGE_COUPONS = 'coupons:manage',
  MANAGE_REVIEWS = 'reviews:manage',

  MANAGE_USERS = 'users:manage',
  MANAGE_ROLES = 'roles:manage',
  MANAGE_PERMISSIONS = 'permissions:manage',
  MANAGE_BRANCHES = 'branches:manage',
  MANAGE_SETTINGS = 'settings:manage',
  VIEW_AUDIT_LOGS = 'audit:view',
  MANAGE_SECURITY = 'security:manage',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  cashier: [
    Permission.VIEW_ORDERS,
    Permission.CREATE_POS_ORDER,
    Permission.UPDATE_ORDER_STATUS,
    Permission.MANAGE_SHIFTS,
  ],
  admin: [
    Permission.VIEW_ORDERS,
    Permission.CREATE_POS_ORDER,
    Permission.UPDATE_ORDER_STATUS,
    Permission.CANCEL_ORDER,
    Permission.DELETE_ORDER,
    Permission.MANAGE_SHIFTS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_BRANCH_STATS,
    Permission.MANAGE_PRODUCTS,
    Permission.MANAGE_CATEGORIES,
    Permission.MANAGE_COUPONS,
    Permission.MANAGE_REVIEWS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_PERMISSIONS,
    Permission.MANAGE_BRANCHES,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_SECURITY,
  ],
};

export interface UserSessionData {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  branchId?: string;
  branchName?: string;
  email?: string;
  avatar?: string;
  mfaEnabled?: boolean;
  sessionId: string;
  sessionExpiresAt: number;
}

/**
 * Checks if a user has a specific permission
 */
export function hasPermission(user: UserSessionData | null | undefined, permission: Permission): boolean {
  if (!user || !user.role) return false;
  // Normalize super_admin -> admin
  const normalizedRole: UserRole = (user.role === ('super_admin' as any) ? 'admin' : user.role) as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes(permission);
}

/**
 * Checks if a user has all of the required permissions
 */
export function hasAllPermissions(user: UserSessionData | null | undefined, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

/**
 * Checks if a user has at least one of the required permissions
 */
export function hasAnyPermission(user: UserSessionData | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/**
 * Checks if a user can access a specific route/view
 */
export function canAccessView(user: UserSessionData | null | undefined, viewName: string): boolean {
  if (!user) return false;

  const normalizedRole: UserRole = (user.role === ('super_admin' as any) ? 'admin' : user.role) as UserRole;

  switch (viewName) {
    case 'cashier':
      // Cashier, Manager, Admin can all access cashier POS view
      return true;

    case 'manager':
    case 'admin':
      // Admin can access admin dashboard
      return normalizedRole === 'admin';

    case 'admin/users':
    case 'admin/settings':
    case 'admin/audit':
    case 'admin/security':
      return normalizedRole === 'admin';

    default:
      return true;
  }
}

/**
 * Branch Isolation: Validates if an order belongs to the user's branch
 */
export function isOrderAccessibleByBranch(user: UserSessionData | null | undefined, orderBranchId?: string): boolean {
  if (!user) return false;
  const normalizedRole: UserRole = (user.role === ('super_admin' as any) ? 'admin' : user.role) as UserRole;

  // Admins have global visibility across all branches
  if (normalizedRole === 'admin') return true;

  // If user has no specific branch locked, allow all
  if (!user.branchId) return true;

  // If order has no branchId assigned, it's global or default
  if (!orderBranchId) return true;

  return user.branchId === orderBranchId;
}
