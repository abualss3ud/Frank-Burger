import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminAccount, AdminRole } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  Receipt,
  Crown,
  KeyRound,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Search,
  Lock,
  Mail,
  User,
  Shield,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Download,
} from 'lucide-react';
import { evaluatePasswordStrength } from '../utils/security';

export const UsersManagementTab: React.FC = () => {
  const {
    adminAccounts,
    adminUser,
    branches,
    createAdminAccount,
    updateAdminAccount,
    deleteAdminAccount,
    language,
    addToast,
  } = useApp();

  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminRole>('all');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: 'cashier' as AdminRole,
    branchId: branches[0]?.id || '',
    password: '',
    securityPin: '2026',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Accounts
  const filteredAccounts = adminAccounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.email && acc.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || acc.role === roleFilter;

    let matchesDate = true;
    if (startDate || endDate) {
      if (acc.createdAt) {
        const createdDate = new Date(acc.createdAt);
        createdDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (createdDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (createdDate > end) matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesRole && matchesDate;
  });

  const handleExportCSV = () => {
    if (filteredAccounts.length === 0) {
      addToast(isAr ? 'لا توجد بيانات لتصديرها' : 'No data to export', 'error');
      return;
    }

    // Headers
    const headers = isAr 
      ? ['الاسم الكامل', 'اسم المستخدم', 'البريد الإلكتروني', 'الصلاحية', 'الفرع', 'حالة المصادقة الثنائية (2FA)', 'تاريخ الإنشاء']
      : ['Full Name', 'Username', 'Email', 'Role', 'Branch', '2FA Status', 'Created At'];

    // Map rows
    const rows = filteredAccounts.map(acc => {
      const roleText = acc.role === 'super_admin' 
        ? (isAr ? 'مسؤول أعلى' : 'Super Admin') 
        : (isAr ? 'كاشير' : 'Cashier');
      const branchText = acc.branchNameAr || (acc.role === 'super_admin' ? (isAr ? 'كافة الفروع' : 'All Branches') : (isAr ? 'فرع فريال' : 'Feryal'));
      const mfaStatus = acc.mfaEnabled 
        ? (isAr ? 'مفعلة ✓' : 'Active') 
        : (isAr ? 'غير مفعلة' : 'Disabled');
      const creationDate = acc.createdAt 
        ? new Date(acc.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')
        : '';

      return [
        acc.name,
        acc.username,
        acc.email || `${acc.username}@frankburger.com`,
        roleText,
        branchText,
        mfaStatus,
        creationDate
      ];
    });

    // Convert to CSV string with BOM for Excel Arabic support
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `registered_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(isAr ? 'تم تصدير ملف CSV بنجاح' : 'CSV exported successfully', 'success');
  };

  const openCreateModal = () => {
    setEditingAccountId(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      role: 'cashier',
      branchId: branches[0]?.id || '',
      password: '',
      securityPin: '2026',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (acc: AdminAccount) => {
    setEditingAccountId(acc.id);
    setFormData({
      name: acc.name,
      username: acc.username,
      email: acc.email || '',
      role: acc.role,
      branchId: acc.branchId || branches[0]?.id || '',
      password: '', // Leave blank unless changing
      securityPin: acc.securityPin || '2026',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.username.trim()) {
      setFormError(isAr ? 'يرجى كتابة الاسم واسم المستخدم' : 'Please provide name and username');
      return;
    }

    if (!editingAccountId) {
      if (!formData.password) {
        setFormError(isAr ? 'يرجى تعيين كلمة مرور للحساب الجديد' : 'Please provide password');
        return;
      }

      const strength = evaluatePasswordStrength(formData.password);
      if (!strength.isStrong) {
        setFormError(isAr ? strength.feedbackAr : strength.feedbackEn);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingAccountId) {
        const patch: Partial<AdminAccount> = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          branchId: formData.branchId,
          branchNameAr: branches.find((b) => b.id === formData.branchId)?.nameAr,
          securityPin: formData.securityPin.trim(),
        };

        if (formData.password) {
          const strength = evaluatePasswordStrength(formData.password);
          if (!strength.isStrong) {
            setFormError(isAr ? strength.feedbackAr : strength.feedbackEn);
            setIsSubmitting(false);
            return;
          }
          patch.password = formData.password;
        }

        const res = await updateAdminAccount(editingAccountId, patch);
        setIsSubmitting(false);

        if (res.success) {
          addToast(isAr ? 'تم تحديث بيانات الحساب بنجاح' : 'User updated successfully', 'success');
          setIsModalOpen(false);
        } else {
          setFormError(res.message);
        }
      } else {
        const selectedBranch = branches.find((b) => b.id === formData.branchId);
        const res = await createAdminAccount({
          name: formData.name.trim(),
          username: formData.username.trim().toLowerCase(),
          email: formData.email.trim().toLowerCase() || `${formData.username.trim().toLowerCase()}@frankburger.com`,
          role: formData.role,
          branchId: formData.branchId,
          branchNameAr: selectedBranch?.nameAr,
          password: formData.password,
          securityPin: formData.securityPin.trim(),
          avatar:
            formData.role === 'cashier'
              ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80'
              : formData.role === 'super_admin'
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        });
        setIsSubmitting(false);

        if (res.success) {
          addToast(isAr ? 'تم إنشاء الحساب الجديد بنجاح' : 'User created successfully', 'success');
          setIsModalOpen(false);
        } else {
          setFormError(res.message);
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err?.message || (isAr ? 'فشل حفظ الحساب' : 'Failed to save account'));
    }
  };

  const handleDelete = async (acc: AdminAccount) => {
    if (adminAccounts.length <= 1) {
      addToast(isAr ? 'لا يمكن حذف الحساب الوحيد بالنظام' : 'Cannot delete the only account', 'error');
      return;
    }

    if (acc.username === adminUser?.username) {
      addToast(isAr ? 'لا يمكنك حذف حسابك الحالي المسجل به' : 'Cannot delete your active account', 'error');
      return;
    }

    if (window.confirm(isAr ? `هل أنت متأكد من حذف الحساب (@${acc.username})؟` : `Delete account @${acc.username}?`)) {
      const res = await deleteAdminAccount(acc.id);
      if (res.success) {
        addToast(isAr ? 'تم حذف الحساب بنجاح' : 'Account deleted', 'success');
      } else {
        addToast(res.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#E51E2A] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 font-heading">
                {isAr ? 'إدارة المستخدمين والموظفين والصلاحيات' : 'User & Access Management'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isAr
                  ? 'التحكم في حسابات الكاشير، المديرين، ومسؤولي الفروع بنظام الصلاحيات (RBAC)'
                  : 'Manage Cashier, Manager, and Super Admin accounts with strict RBAC'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-3 rounded-2xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs shadow-lg shadow-[#E51E2A]/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAr ? 'إضافة موظف / مستخدم جديد' : 'Add New Account'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم، اسم المستخدم، البريد الإلكتروني...' : 'Search by name, username, email...'}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none transition-all"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
          </div>

          {/* Date Filter & Clear Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] text-zinc-500 font-bold">{isAr ? 'من تاريخ:' : 'From:'}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs text-zinc-800 focus:outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] text-zinc-500 font-bold">{isAr ? 'إلى تاريخ:' : 'To:'}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs text-zinc-800 focus:outline-none cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#E51E2A] rounded-xl text-[11px] font-bold transition-all cursor-pointer"
              >
                {isAr ? 'مسح التصفية' : 'Clear Filter'}
              </button>
            )}
          </div>
        </div>

        {/* Role Filters & Statistics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-100 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                roleFilter === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({adminAccounts.length})
            </button>
            <button
              onClick={() => setRoleFilter('super_admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                roleFilter === 'super_admin'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              {isAr ? 'مسؤول أعلى' : 'Admin'}
            </button>
            <button
              onClick={() => setRoleFilter('cashier')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                roleFilter === 'cashier'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {isAr ? 'كاشير' : 'Cashier'}
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 font-medium">
            {isAr 
              ? `يظهر ${filteredAccounts.length} من أصل ${adminAccounts.length} مستخدم` 
              : `Showing ${filteredAccounts.length} of ${adminAccounts.length} users`}
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((acc) => {
          const isSuperAdmin = acc.role === 'super_admin' || acc.role === 'admin';
          const isCashier = acc.role === 'cashier';

          return (
            <div
              key={acc.id}
              className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
            >
              {/* Top Role Indicator Stripe */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isSuperAdmin
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />

              {/* User Header */}
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      acc.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={acc.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-zinc-200 shadow-2xs"
                  />
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 leading-tight">{acc.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono mt-0.5">
                      <span>@{acc.username}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isSuperAdmin
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {isSuperAdmin ? (
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      <span>{isAr ? 'مسؤول أعلى' : 'Super Admin'}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Receipt className="w-3 h-3" />
                      <span>{isAr ? 'الكاشير' : 'Cashier'}</span>
                    </span>
                  )}
                </span>
              </div>

              {/* Details Details Grid */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-zinc-600 border-b border-zinc-200/30 sm:border-b-0 pb-1.5 sm:pb-0">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isAr ? 'البريد:' : 'Email:'}</span>
                  </span>
                  <span className="font-mono text-zinc-900 font-medium break-all text-start sm:text-end">{acc.email || `${acc.username}@frankburger.com`}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-zinc-600 border-b border-zinc-200/30 sm:border-b-0 pb-1.5 sm:pb-0">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isAr ? 'الفرع المخصص:' : 'Branch:'}</span>
                  </span>
                  <span className="font-bold text-zinc-800 text-start sm:text-end">
                    {acc.branchNameAr || (isSuperAdmin ? (isAr ? 'كافة الفروع' : 'All Branches') : (isAr ? 'فرع فريال' : 'Feryal'))}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-zinc-600 border-b border-zinc-200/30 sm:border-b-0 pb-1.5 sm:pb-0">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isAr ? 'المصادقة الثنائية (2FA):' : '2FA Status:'}</span>
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-[10px] self-start sm:self-auto ${
                      acc.mfaEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {acc.mfaEnabled ? (isAr ? 'مفعلة ✓' : 'Active') : (isAr ? 'غير مفعلة' : 'Disabled')}
                  </span>
                </div>

                {acc.createdAt && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-zinc-600 border-b border-zinc-200/30 sm:border-b-0 pb-1.5 sm:pb-0">
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{isAr ? 'تاريخ الإنشاء:' : 'Created At:'}</span>
                    </span>
                    <span className="font-bold text-zinc-800 text-start sm:text-end">
                      {new Date(acc.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {/* Password Field with Eye Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-zinc-600 border-t border-zinc-200/50 pt-2.5 mt-2">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <KeyRound className="w-3.5 h-3.5 text-[#E51E2A]" />
                    <span className="font-bold">{isAr ? 'كلمة المرور:' : 'Password:'}</span>
                  </span>
                  <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-mono text-zinc-900 font-bold bg-zinc-200/60 px-2 py-0.5 rounded-lg text-[11px] select-all break-all max-w-[150px] truncate sm:max-w-none">
                      {visiblePasswords[acc.id] ? (acc.plainPassword || acc.password || 'Password@2026!') : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVisiblePasswords(prev => ({ ...prev, [acc.id]: !prev[acc.id] }))}
                      className="p-1 hover:bg-zinc-200/80 rounded-lg text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                      title={isAr ? 'عرض/إخفاء كلمة المرور' : 'Show/Hide Password'}
                    >
                      {visiblePasswords[acc.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openEditModal(acc)}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تعديل' : 'Edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(acc)}
                  className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="حذف الحساب"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Create / Edit Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 relative animate-in fade-in zoom-in-95 duration-200 text-start">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pt-1">
              <h3 className="text-xl font-black text-zinc-900 font-heading">
                {editingAccountId
                  ? isAr ? 'تعديل بيانات المستخدم' : 'Edit User Account'
                  : isAr ? 'إضافة مستخدم / موظف جديد' : 'Add New Account'}
              </h3>
              <p className="text-xs text-zinc-500">
                {isAr
                  ? 'يرجى تحديد مستوى الصلاحية والفرع وتعيين كلمة مرور قوية'
                  : 'Assign role level, branch isolation, and strong security credentials'}
              </p>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">
                    {isAr ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: أحمد محمود"
                    className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">
                    {isAr ? 'اسم المستخدم (Login)' : 'Username'}
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!!editingAccountId}
                    placeholder="ahmed_cashier"
                    className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@frankburger.com"
                  className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none"
                />
              </div>

              {/* Role & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">
                    {isAr ? 'مستوى الصلاحية (Role)' : 'Role'}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                    className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none font-bold"
                  >
                    <option value="cashier">{isAr ? 'الكاشير (Cashier)' : 'Cashier'}</option>
                    <option value="super_admin">{isAr ? 'المسؤول الأعلى (Super Admin)' : 'Super Admin'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">
                    {isAr ? 'الفرع المخصص' : 'Branch Isolation'}
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none font-medium"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  {editingAccountId
                    ? isAr ? 'تغيير كلمة المرور (اتركها فارغة إذا لم ترد التغيير)' : 'New Password (Optional)'
                    : isAr ? 'كلمة المرور (12 حرفاً على الأقل)' : 'Password (Min 12 chars)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingAccountId ? '••••••••' : 'Password@2026!'}
                  className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none"
                  required={!editingAccountId}
                />
              </div>

              {/* PIN */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  {isAr ? 'رمز الأمان (PIN للعمليات السريعة)' : 'Security PIN'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.securityPin}
                  onChange={(e) => setFormData({ ...formData, securityPin: e.target.value })}
                  placeholder="2026"
                  className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-3 px-4 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{editingAccountId ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إنشاء الحساب' : 'Create User')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
