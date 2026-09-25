import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { initMetaPixel, initTiktokPixel, trackPageView } from './lib/pixel';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ToastContainer } from './components/ToastContainer';
import { ExitIntentSnackbar } from './components/ExitIntentSnackbar';
import { MandatoryPhoneModal } from './components/MandatoryPhoneModal';

// Views
import { HomeView } from './views/HomeView';
import { MenuView } from './views/MenuView';
import { OffersView } from './views/OffersView';
import { OrderTrackingView } from './views/OrderTrackingView';
import { UserProfileView } from './views/UserProfileView';
import { BranchesView } from './views/BranchesView';
import { AboutView } from './views/AboutView';
import { AdminView } from './views/AdminView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { ForbiddenView } from './views/ForbiddenView';

const MainContent: React.FC = () => {
  const { currentView, settings } = useApp();

  useEffect(() => {
    initMetaPixel(settings?.facebookPixelId, settings?.facebookTestEventCode, settings?.facebookCapiAccessToken);
    initTiktokPixel(settings?.tiktokPixelId);
    trackPageView(currentView);
  }, [currentView, settings?.facebookPixelId, settings?.facebookTestEventCode, settings?.facebookCapiAccessToken, settings?.tiktokPixelId]);

  // If in Password Reset flow
  if (currentView === 'reset-password' as any) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-zinc-900 flex flex-col font-sans selection:bg-[#E51E2A] selection:text-white">
        <main className="flex-1">
          <ResetPasswordView />
        </main>
        <ToastContainer />
      </div>
    );
  }

  // If Forbidden route
  if (currentView === 'forbidden' as any) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-zinc-900 flex flex-col font-sans selection:bg-[#E51E2A] selection:text-white">
        <main className="flex-1">
          <ForbiddenView />
        </main>
        <ToastContainer />
      </div>
    );
  }

  // If in Admin portal, render dedicated standalone Admin & POS environment
  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-[#ffffff] text-zinc-900 flex flex-col font-sans selection:bg-[#E51E2A] selection:text-white">
        <main className="flex-1">
          <AdminView />
        </main>
        {/* Receipt Modal for Thermal POS Printing */}
        <ReceiptModal />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-zinc-900 flex flex-col font-sans selection:bg-[#E51E2A] selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Dynamic View Container */}
      <main className="flex-1">
        {currentView === 'home' && <HomeView />}
        {currentView === 'menu' && <MenuView />}
        {currentView === 'offers' && <OffersView />}
        {currentView === 'tracking' && <OrderTrackingView />}
        {currentView === 'profile' && <UserProfileView />}
        {currentView === 'branches' && <BranchesView />}
        {currentView === 'about' && <AboutView />}
      </main>

      {/* Global Modals & Drawers */}
      <ProductModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderConfirmationModal />
      <ReceiptModal />
      <ToastContainer />
      <ExitIntentSnackbar />
      <MandatoryPhoneModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AuthProvider>
  );
}
