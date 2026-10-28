import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/ContentArea';

/* ── 页面组件 ── */
import DashboardOverview from './pages/dashboard/DashboardOverview';
import DashboardTodo from './pages/dashboard/DashboardTodo';
import DashboardShortcuts from './pages/dashboard/DashboardShortcuts';
import DashboardNotifications from './pages/dashboard/DashboardNotifications';
import DashboardOperationLog from './pages/dashboard/DashboardOperationLog';

import PurchaseOverview from './pages/purchase/PurchaseOverview';
import PurchaseOrders from './pages/purchase/PurchaseOrders';
import PurchasePricing from './pages/purchase/PurchasePricing';
import PurchaseInbound from './pages/purchase/PurchaseInbound';
import PurchaseSuppliers from './pages/purchase/PurchaseSuppliers';
import PurchaseSupplierApprovals from './pages/purchase/PurchaseSupplierApprovals';
import PurchaseStoreOverview from './pages/purchase/PurchaseStoreOverview';
import PurchasePartnerStores from './pages/purchase/PurchasePartnerStores';
import PartnerScores from './pages/purchase/PartnerScores';
import PurchaseReconciliation from './pages/purchase/PurchaseReconciliation';
import PurchaseReturn from './pages/purchase/PurchaseReturn';

import SalesOverview from './pages/sales/SalesOverview';
import SalesOrders from './pages/sales/SalesOrders';
import ExternalOrders from './pages/sales/ExternalOrders';
import OrderEntry from './pages/sales/OrderEntry';
import OrderShipping from './pages/sales/OrderShipping';
import OrderSettlement from './pages/sales/OrderSettlement';
import CompareManage from './pages/sales/CompareManage';
import SalesPricing from './pages/sales/SalesPricing';
import SalesReconciliation from './pages/sales/SalesReconciliation';
import SalesCustomers from './pages/sales/SalesCustomers';
import SalesStores from './pages/sales/SalesStores';
import SalesReturn from './pages/sales/SalesReturn';
import SalesReports from './pages/sales/SalesReports';
import SalesCustomerAccounts from './pages/sales/SalesCustomerAccounts';

import InventoryOverview from './pages/inventory/InventoryOverview';
import InventoryPurchaseInbound from './pages/inventory/InventoryPurchaseInbound';
import InventorySalesOutbound from './pages/inventory/InventorySalesOutbound';
import InventoryOtherIO from './pages/inventory/InventoryOtherIO';
import InventoryTransfer from './pages/inventory/InventoryTransfer';
import InventoryCheck from './pages/inventory/InventoryCheck';
import InventoryIORecord from './pages/inventory/InventoryIORecord';
import InventoryAlertSettings from './pages/inventory/InventoryAlertSettings';
import InventorySettings from './pages/inventory/InventorySettings';

import ProductOverview from './pages/product/ProductOverview';
import ProductTeaCategory from './pages/product/ProductTeaCategory';
import ProductTeaList from './pages/product/ProductTeaList';
import ProductManageTea from './pages/product/ProductManageTea';
import ProductManageTeaware from './pages/product/ProductManageTeaware';
import ProductManagePeripheral from './pages/product/ProductManagePeripheral';
import ProductManageOther from './pages/product/ProductManageOther';
import ProductTeaDetail from './pages/product/ProductTeaDetail';
import ProductCategory from './pages/product/ProductCategory';
import ProductBrand from './pages/product/ProductBrand';
import ProductBrandDetail from './pages/product/ProductBrandDetail';
import ProductPrice from './pages/product/ProductPrice';
import ProductNewArrivals from './pages/product/ProductNewArrivals';

import FinanceOverview from './pages/finance/FinanceOverview';
import FinancePurchasePayment from './pages/finance/FinancePurchasePayment';
import FinanceSalesCollection from './pages/finance/FinanceSalesCollection';
import FinanceOtherReceivable from './pages/finance/FinanceOtherReceivable';
import FinanceOtherPayable from './pages/finance/FinanceOtherPayable';
import FinanceInvoice from './pages/finance/FinanceInvoice';
import FinanceCost from './pages/finance/FinanceCost';
import FinanceExpense from './pages/finance/FinanceExpense';
import FinanceBalance from './pages/finance/FinanceBalance';

import StatisticsSales from './pages/statistics/StatisticsSales';
import StatisticsBrandAnalysis from './pages/statistics/StatisticsBrandAnalysis';
import StatisticsPurchase from './pages/statistics/StatisticsPurchase';
import StatisticsInventory from './pages/statistics/StatisticsInventory';
import StatisticsFinance from './pages/statistics/StatisticsFinance';
import StatisticsTeaCategory from './pages/statistics/StatisticsTeaCategory';
import StatisticsYearOnYear from './pages/statistics/StatisticsYearOnYear';

import SettingsSystem from './pages/settings/SettingsSystem';
import SettingsRoles from './pages/settings/SettingsRoles';
import SettingsLogs from './pages/settings/SettingsLogs';
import SettingsAbout from './pages/settings/SettingsAbout';
import SettingsUserManagement from './pages/settings/SettingsUserManagement';
import SettingsDataBackup from './pages/settings/SettingsDataBackup';
import SettingsUnit from './pages/settings/SettingsUnit';

import PersonnelOrganization from './pages/personnel/PersonnelOrganization';
import PersonnelTeaProfessional from './pages/personnel/PersonnelTeaProfessional';
import PersonnelEmployee from './pages/personnel/PersonnelEmployee';
import PersonnelStreamer from './pages/personnel/PersonnelStreamer';

/* ── 合作商终端（独立后台） ── */
import PartnerLogin from './pages/partner/PartnerLogin';
import PartnerRegister from './pages/partner/PartnerRegister';
import PartnerLayout from './pages/partner/PartnerLayout';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import PartnerOrders from './pages/partner/PartnerOrders';
import PartnerQuotes from './pages/partner/PartnerQuotes';
import PartnerGrab from './pages/partner/PartnerGrab';
import PartnerReports from './pages/partner/PartnerReports';
import PartnerCustomers from './pages/partner/PartnerCustomers';
import PartnerSettlement from './pages/partner/PartnerSettlement';
import PartnerAccountPage from './pages/partner/PartnerAccountPage';
import PartnerProfile from './pages/partner/PartnerProfile';

/* ── 客户终端（独立后台） ── */
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerProducts from './pages/customer/CustomerProducts';
import CustomerCart from './pages/customer/CustomerCart';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerAccountPage from './pages/customer/CustomerAccountPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      /* ── 工作台 ── */
      { path: 'dashboard', element: <DashboardOverview /> },
      { path: 'dashboard/overview', element: <DashboardOverview /> },
      { path: 'dashboard/todo', element: <DashboardTodo /> },
      { path: 'dashboard/shortcuts', element: <DashboardShortcuts /> },
      { path: 'dashboard/dashboard-notifications', element: <DashboardNotifications /> },
      { path: 'dashboard/dashboard-operation-log', element: <DashboardOperationLog /> },
      /* ── 采购 ── */
      { path: 'purchase', element: <PurchaseOverview /> },
      { path: 'purchase/purchase-overview', element: <PurchaseOverview /> },
      { path: 'purchase/purchase-orders', element: <PurchaseOrders /> },
      { path: 'purchase/purchase-pricing', element: <PurchasePricing /> },
      { path: 'purchase/purchase-inbound', element: <PurchaseInbound /> },
      { path: 'purchase/purchase-suppliers', element: <Navigate to="/purchase/purchase-supplier-list" replace /> },
      { path: 'purchase/purchase-supplier-approvals', element: <PurchaseSupplierApprovals /> },
      { path: 'purchase/purchase-supplier-list', element: <PurchaseSuppliers /> },
      { path: 'purchase/purchase-partner-stores', element: <PurchasePartnerStores /> },
      { path: 'purchase/purchase-partner-scores', element: <PartnerScores /> },
      { path: 'purchase/partner-reports', element: <SalesReports /> },
      { path: 'purchase/purchase-store-overview', element: <PurchaseStoreOverview /> },
      { path: 'purchase/purchase-reconciliation', element: <PurchaseReconciliation /> },
      { path: 'purchase/purchase-return', element: <PurchaseReturn /> },
      /* ── 销售 ── */
      { path: 'sales', element: <SalesOverview /> },
      { path: 'sales/sales-overview', element: <SalesOverview /> },
      { path: 'sales/sales-order-create', element: <Navigate to="/sales/order-entry" replace /> },
      { path: 'sales/order-entry', element: <OrderEntry /> },
      { path: 'sales/order-processing', element: <Navigate to="/sales/order-distribute" replace /> },
      { path: 'sales/order-distribute', element: <ExternalOrders /> },
      { path: 'sales/order-shipping', element: <OrderShipping /> },
      { path: 'sales/order-settlement', element: <OrderSettlement /> },
      { path: 'sales/sales-orders', element: <SalesOrders /> },
      { path: 'sales/compare-manage', element: <CompareManage /> },
      { path: 'sales/sales-reports', element: <Navigate to="/purchase/partner-reports" replace /> },
      { path: 'sales/sales-pricing', element: <SalesPricing /> },
      { path: 'sales/sales-customers', element: <SalesCustomers /> },
      { path: 'sales/sales-customer-accounts', element: <SalesCustomerAccounts /> },
      { path: 'sales/sales-platforms', element: <Navigate to="/sales/sales-customers" replace /> },
      { path: 'sales/sales-reconciliation', element: <SalesReconciliation /> },
      { path: 'sales/sales-return', element: <SalesReturn /> },
      /* ── 仓储 ── */
      { path: 'inventory', element: <InventoryOverview /> },
      { path: 'inventory/inventory-overview', element: <InventoryOverview /> },
      { path: 'inventory/inventory-purchase-inbound', element: <InventoryPurchaseInbound /> },
      { path: 'inventory/inventory-sales-outbound', element: <InventorySalesOutbound /> },
      { path: 'inventory/inventory-other-io', element: <InventoryOtherIO /> },
      { path: 'inventory/inventory-transfer', element: <InventoryTransfer /> },
      { path: 'inventory/inventory-check', element: <InventoryCheck /> },
      { path: 'inventory/inventory-io-record', element: <InventoryIORecord /> },
      { path: 'inventory/inventory-warehouse-settings', element: <InventorySettings /> },
      { path: 'inventory/inventory-alert-settings', element: <InventoryAlertSettings /> },
      /* ── 商品 ── */
      { path: 'product', element: <ProductOverview /> },
      { path: 'product/product-overview', element: <ProductOverview /> },
      { path: 'product/product-manage', element: <Navigate to="product-manage-tea" replace /> },
      { path: 'product/product-category', element: <ProductCategory /> },
      { path: 'product/product-manage-tea', element: <ProductManageTea /> },
      { path: 'product/product-manage-teaware', element: <ProductManageTeaware /> },
      { path: 'product/product-manage-peripheral', element: <ProductManagePeripheral /> },
      { path: 'product/product-manage-other', element: <ProductManageOther /> },
      { path: 'product/product-tea-detail/:id', element: <ProductTeaDetail /> },
      { path: 'product/product-tea-category', element: <ProductTeaCategory /> },
      { path: 'product/product-tea-seven', element: <ProductTeaCategory /> },
      { path: 'product/product-tea-list', element: <ProductTeaList /> },
      { path: 'product/product-brand', element: <ProductBrand /> },
      { path: 'product/product-brand/:id', element: <ProductBrandDetail /> },
      { path: 'product/product-price', element: <ProductPrice /> },
      { path: 'product/product-new-arrivals', element: <ProductNewArrivals /> },
      /* ── 财务 ── */
      { path: 'finance', element: <FinanceOverview /> },
      { path: 'finance/finance-overview', element: <FinanceOverview /> },
      { path: 'finance/finance-purchase-payment', element: <FinancePurchasePayment /> },
      { path: 'finance/finance-sales-collection', element: <FinanceSalesCollection /> },
      { path: 'finance/finance-other-receivable', element: <FinanceOtherReceivable /> },
      { path: 'finance/finance-other-payable', element: <FinanceOtherPayable /> },
      { path: 'finance/finance-invoice', element: <FinanceInvoice /> },
      { path: 'finance/finance-cost', element: <FinanceCost /> },
      { path: 'finance/finance-expense', element: <FinanceExpense /> },
      { path: 'finance/finance-balance', element: <FinanceBalance /> },
      /* ── 统计 ── */
      { path: 'statistics', element: <StatisticsSales /> },
      { path: 'statistics/statistics-sales', element: <StatisticsSales /> },
      { path: 'statistics/statistics-brand', element: <StatisticsBrandAnalysis /> },
      { path: 'statistics/statistics-purchase', element: <StatisticsPurchase /> },
      { path: 'statistics/statistics-inventory', element: <StatisticsInventory /> },
      { path: 'statistics/statistics-finance', element: <StatisticsFinance /> },
      { path: 'statistics/statistics-tea-category', element: <StatisticsTeaCategory /> },
      { path: 'statistics/statistics-year-on-year', element: <StatisticsYearOnYear /> },
      /* ── 系统 ── */
      { path: 'settings', element: <SettingsSystem /> },
      { path: 'settings/settings-system', element: <SettingsSystem /> },
      { path: 'settings/settings-roles', element: <SettingsRoles /> },
      { path: 'settings/settings-logs', element: <SettingsLogs /> },
      { path: 'settings/settings-about', element: <SettingsAbout /> },
      { path: 'settings/settings-user-management', element: <SettingsUserManagement /> },
      { path: 'settings/settings-data-backup', element: <SettingsDataBackup /> },
      { path: 'settings/settings-unit', element: <SettingsUnit /> },
      /* ── 人员 ── */
      { path: 'personnel', element: <PersonnelOrganization /> },
      { path: 'personnel/personnel-organization', element: <PersonnelOrganization /> },
      { path: 'personnel/personnel-employee', element: <PersonnelEmployee /> },
      { path: 'personnel/personnel-tea-professional', element: <PersonnelTeaProfessional /> },
      { path: 'personnel/personnel-streamer', element: <PersonnelStreamer /> },
      { path: 'personnel/personnel-stores', element: <SalesStores /> },
    ],
  },
  /* ── 合作商终端（独立布局：登录页 + 注册页 + 5 个一级菜单） ── */
  { path: '/partner/login', element: <PartnerLogin /> },
  { path: '/partner/register', element: <PartnerRegister /> },
  {
    path: '/partner',
    element: <PartnerLayout />,
    children: [
      { index: true, element: <Navigate to="/partner/dashboard" replace /> },
      { path: 'dashboard', element: <PartnerDashboard /> },
      { path: 'orders', element: <PartnerOrders /> },
      { path: 'quotes', element: <PartnerQuotes /> },
      { path: 'grab', element: <PartnerGrab /> },
      { path: 'reports', element: <PartnerReports /> },
      { path: 'customers', element: <PartnerCustomers /> },
      { path: 'settlement', element: <PartnerSettlement /> },
      { path: 'account', element: <PartnerAccountPage /> },
      /* 设置菜单：合作商信息分区子页（仓库信息免审批直接保存）；门店信息为一级菜单 */
      { path: 'profile', element: <Navigate to="/partner/profile/basic" replace /> },
      { path: 'profile/basic', element: <PartnerProfile section="basic" /> },
      /* 联系信息已并入基本信息 */
      { path: 'profile/contact', element: <Navigate to="/partner/profile/basic" replace /> },
      { path: 'profile/warehouse', element: <PartnerProfile section="warehouse" /> },
      { path: 'profile/store', element: <PartnerProfile section="store" /> },
      { path: 'profile/qualification', element: <PartnerProfile section="qualification" /> },
      { path: 'profile/finance', element: <PartnerProfile section="finance" /> },
    ],
  },
  /* ── 客户终端（独立布局：登录页 + 工作台/商品/购物车/订单/账号） ── */
  { path: '/customer/login', element: <CustomerLogin /> },
  {
    path: '/customer',
    element: <CustomerLayout />,
    children: [
      { index: true, element: <Navigate to="/customer/dashboard" replace /> },
      { path: 'dashboard', element: <CustomerDashboard /> },
      { path: 'products', element: <CustomerProducts /> },
      { path: 'cart', element: <CustomerCart /> },
      { path: 'orders', element: <CustomerOrders /> },
      { path: 'account', element: <CustomerAccountPage /> },
    ],
  },
]);
