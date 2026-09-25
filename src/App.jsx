import { Navigate, Route, Routes, Outlet } from 'react-router-dom';
import { OrderProvider, useOrder } from './context/OrderContext';
import ShopPage from './pages/ShopPage';
import UploadPage from './pages/UploadPage';
import FilesPage from './pages/FilesPage';
import ConfigurePage from './pages/ConfigurePage';
import SummaryPage from './pages/SummaryPage';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import ConfirmationPage from './pages/ConfirmationPage';
import TrackingPage from './pages/TrackingPage';
import StatusPage from './pages/StatusPage';
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import OwnerOrdersPage from './pages/owner/OwnerOrdersPage';
import OwnerPricingPage from './pages/owner/OwnerPricingPage';
import OwnerShopPage from './pages/owner/OwnerShopPage';
import OwnerOrderDetailPage from './pages/owner/OwnerOrderDetailPage';
import OwnerReportsPage from './pages/owner/OwnerReportsPage';
import OwnerInventoryPage from './pages/owner/OwnerInventoryPage';
import OwnerStaffPage from './pages/owner/OwnerStaffPage';
import OwnerNotificationsPage from './pages/owner/OwnerNotificationsPage';
import OwnerLoginPage from './pages/owner/OwnerLoginPage';
import CustomerLoginPage from './pages/customer/CustomerLoginPage';
import AccountEntryPage from './pages/customer/AccountEntryPage';
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import CustomerOrderDetailPage from './pages/customer/CustomerOrderDetailPage';
import PaymentPage from './pages/PaymentPage';

function OwnerGuard() {
  const { auth } = useOrder();
  return auth.signedIn && auth.role === 'owner' ? <Outlet /> : <Navigate to="/owner/login" replace />;
}

export default function App() {
  return (
    <OrderProvider>
      <Routes>
        <Route path="/" element={<ShopPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/configure/:fileId" element={<ConfigurePage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/customer" element={<CustomerDetailsPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/tracking/:jobId" element={<TrackingPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/account" element={<AccountEntryPage />} />
        <Route path="/login" element={<CustomerLoginPage />} />
        <Route path="/orders" element={<CustomerOrdersPage />} />
        <Route path="/profile" element={<CustomerProfilePage />} />
        <Route path="/orders/:id" element={<CustomerOrderDetailPage />} />
        <Route path="/owner/login" element={<OwnerLoginPage />} />
        <Route element={<OwnerGuard />}>
          <Route path="/owner" element={<OwnerDashboardPage />} />
          <Route path="/owner/orders" element={<OwnerOrdersPage />} />
          <Route path="/owner/orders/:id" element={<OwnerOrderDetailPage />} />
          <Route path="/owner/pricing" element={<OwnerPricingPage />} />
          <Route path="/owner/shop" element={<OwnerShopPage />} />
          <Route path="/owner/reports" element={<OwnerReportsPage />} />
          <Route path="/owner/inventory" element={<OwnerInventoryPage />} />
          <Route path="/owner/staff" element={<OwnerStaffPage />} />
          <Route path="/owner/notifications" element={<OwnerNotificationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OrderProvider>
  );
}
