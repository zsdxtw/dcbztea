import { ModuleKey, MenuItem, ModuleConfig } from '../types';

/* ── 顶栏 Tab 图标 ── */

export const DashboardTabIcon = () => (
  <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>
);
export const PurchaseTabIcon = () => (
  <svg viewBox="0 0 18 18" fill="none"><path d="M3 5h12l-1.2 8H4.2L3 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
export const SalesTabIcon = () => (
  <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const InventoryTabIcon = () => (
  <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12M7 5V3h4v2" stroke="currentColor" strokeWidth="1.3"/></svg>
);
export const ProductTabIcon = () => (
  <svg viewBox="0 0 18 18" fill="none"><path d="M9 2L3 5v8l6 3 6-3V5L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 8l6-3M9 8v10M9 8L3 5" stroke="currentColor" strokeWidth="1.3"/></svg>
);
export const FinanceTabIcon = () => (
  <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h2M5 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
export const StatisticsTabIcon = () => (
  <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="9" width="3" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="7.5" y="5" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="12" y="3" width="3" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.3"/></svg>
);
export const SettingsTabIcon = () => (
  <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);

/* ── 侧边栏菜单图标 ── */

const OverviewIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 7v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const TodoIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const ShortcutsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="14" cy="14" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M4 4l5 5M9 4L4 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const OrdersIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h6M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const CreateOrderIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h4M7 9h4M7 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M13 11v4M11 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const InboundIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="6" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 3v5M7 6l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const SuppliersIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a5 5 0 0110 0M14 10h4M16 8v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const OutboundIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="6" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 13V8M7 10l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const CustomersIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="15" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
);
const StoreIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M3 8l1.5-4h11L17 8M3 8v9h14V8M3 8h14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 17v-5h4v5" stroke="currentColor" strokeWidth="1.3"/></svg>
);
const PlatformIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="6" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6V4a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0113 4v2" stroke="currentColor" strokeWidth="1.2"/><path d="M10 9.5v2M9 10.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const StockIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h14M7 5V3h6v2" stroke="currentColor" strokeWidth="1.3"/></svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const WarehouseSettingsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const ProductListIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="4" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 8h12M8 4v12" stroke="currentColor" strokeWidth="1.2"/></svg>
);
const CategoryIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M3 5h8M3 10h5M3 15h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="14" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.3"/></svg>
);
const NotificationIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M10 3a5 5 0 015 5v3l2 2H3l2-2V8a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3"/></svg>
);
const QualityIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M10 2L3 6v8l7 4 7-4V6L10 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const QuotationIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h6M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M8 15l1 1 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const TraceabilityIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M3 10h3M14 10h3M10 3v3M10 14v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.3"/><circle cx="3" cy="10" r="1.5" fill="currentColor"/><circle cx="17" cy="10" r="1.5" fill="currentColor"/></svg>
);
const GradeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.7 5.1 17.2l.9-5.5-4-3.9L7.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
);
const TeaCategoryAnalysisIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 3v7h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.0" strokeDasharray="2 2"/></svg>
);
const SpecsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
);
const PriceIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M10 3v14M6 7h8M6 13h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="14" cy="13" r="3" stroke="currentColor" strokeWidth="1.3"/></svg>
);
const ReceivableIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M4 7l6-4 6 4v6l-6 4-6-4V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
);
const RecordsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 7h6M7 10h4M7 13h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const ReconciliationIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7l2 2 3-3M5 13h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const SalesAnalysisIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 3 2 4-6 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const BrandAnalysisIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M10 3l6 3.5v7L10 17l-6-3.5v-7L10 3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.0"/></svg>
);
const PurchaseAnalysisIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="10" width="4" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="6" width="4" height="11" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="13" y="3" width="4" height="14" rx="0.5" stroke="currentColor" strokeWidth="1.3"/></svg>
);
const InventoryAnalysisIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 3v7h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const FinanceReportIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 14V9M10 14V6M13 14V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const SystemSettingsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const RolesIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="12" y="5" width="5" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
);
const LogsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h6M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const AboutIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 7v1M10 10v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const DashboardOverviewIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>
);

/* ── 新增侧边栏菜单图标 ── */

const OperationLogIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 7h6M7 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="14" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M12.5 14l1 1 2-2" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ReturnIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M4 8h9a3 3 0 010 6H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M7 5L4 8l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const PriceTrendIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 3 2 4-6 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 4h3v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const PerformanceIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.7 5.1 17.2l.9-5.5-4-3.9L7.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M10 8v4M10 14v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const LocationIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h14" stroke="currentColor" strokeWidth="1.3"/><rect x="5" y="11" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.0"/><rect x="10" y="11" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.0"/></svg>
);
const InboundRecordIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="6" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 3v5M7 6l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="13" r="1" fill="currentColor"/><circle cx="10" cy="13" r="1" fill="currentColor"/><circle cx="13" cy="13" r="1" fill="currentColor"/></svg>
);
const OutboundRecordIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="6" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 13V8M7 10l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="13" r="1" fill="currentColor"/><circle cx="13" cy="13" r="1" fill="currentColor"/></svg>
);
const AlertSettingsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M10 3a5 5 0 015 5v3l2 2H3l2-2V8a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="2" r="1" fill="currentColor"/></svg>
);
const ProductCategoryIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="12" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5.5h4M8 14.5h4M5.5 8v4M14.5 8v4" stroke="currentColor" strokeWidth="1.0"/></svg>
);
const BrandIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M10 2L3 5v5c0 5 3.5 7.5 7 9 3.5-1.5 7-4 7-9V5L10 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const UnitIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M4 8h12" stroke="currentColor" strokeWidth="1.2"/><path d="M8 4v4" stroke="currentColor" strokeWidth="1.2"/><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.0"/></svg>
);
const CollectionIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M14 13l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const PaymentIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M4 13l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const ExpenseIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 7h6M7 10h4M7 13h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M13 12l2 2M15 12l-2 2" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"/></svg>
);
const InvoiceIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6h6M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M8 15l1 1 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const AccountIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 9h2M5 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="14" cy="10" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>
);
const YearOnYearIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M3 14l4-4 3 2 4-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 16l4-4 3 2 4-6" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2"/><path d="M14 4h3v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const UserManagementIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="15" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M13 15a4 4 0 015 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const DataBackupIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M10 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const PersonnelTabIcon = () => (
  <svg viewBox="0 0 18 18" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1 15a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="14" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M12 14a4 4 0 015 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const TeaProfessionalIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.3"/><path d="M3 18a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M14 4l2-2M16 4l-2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const OrgChartIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><rect x="8" y="2" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="13" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="13" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="14" y="13" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 6v3M10 9H4v4M10 9h6v4" stroke="currentColor" strokeWidth="1.2"/></svg>
);
const EmployeeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1 17a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="15" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M13 16a4 4 0 015 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const StreamerIcon = () => (
  <svg viewBox="0 0 20 20" fill="none"><path d="M3 10l2 2 4-6 4 8 2-4h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/></svg>
);

/* ── 模块配置 ── */

export const MODULE_CONFIGS: Record<ModuleKey, ModuleConfig> = {
  [ModuleKey.DASHBOARD]: {
    key: ModuleKey.DASHBOARD,
    label: '工作台',
    menus: [
      { key: 'overview', label: '首页概览', icon: <DashboardOverviewIcon /> },
      { key: 'todo', label: '待办事项', icon: <TodoIcon /> },
      { key: 'shortcuts', label: '快捷入口', icon: <ShortcutsIcon /> },
      { key: 'dashboard-notifications', label: '消息通知', icon: <NotificationIcon /> },
      { key: 'dashboard-operation-log', label: '操作日志', icon: <OperationLogIcon /> },
    ],
  },
  [ModuleKey.PURCHASE]: {
    key: ModuleKey.PURCHASE,
    label: '采购',
    menus: [
      { key: 'purchase-overview', label: '采购概览', icon: <OverviewIcon /> },
      { key: 'purchase-orders', label: '采购订单', icon: <OrdersIcon /> },
      { key: 'purchase-pricing', label: '采购报（调）价', icon: <PriceIcon /> },
      { key: 'purchase-inbound', label: '入库管理', icon: <InboundIcon /> },
      { key: 'purchase-suppliers', label: '供应商管理', icon: <SuppliersIcon /> },
      { key: 'purchase-reconciliation', label: '供应商对账', icon: <ReconciliationIcon /> },
      { key: 'purchase-return', label: '采购退货', icon: <ReturnIcon /> },
    ],
  },
  [ModuleKey.SALES]: {
    key: ModuleKey.SALES,
    label: '销售',
    menus: [
      { key: 'sales-overview', label: '销售概览', icon: <OverviewIcon /> },
      { key: 'sales-order-create', label: '销售下单', icon: <CreateOrderIcon /> },
      { key: 'sales-orders', label: '销售订单', icon: <OrdersIcon /> },
      { key: 'sales-pricing', label: '销售报（调）价', icon: <QuotationIcon /> },
      { key: 'sales-customers', label: '客户管理', icon: <CustomersIcon /> },
      { key: 'sales-reconciliation', label: '客户对账', icon: <ReconciliationIcon /> },
      { key: 'sales-return', label: '销售退货', icon: <ReturnIcon /> },
    ],
  },
  [ModuleKey.INVENTORY]: {
    key: ModuleKey.INVENTORY,
    label: '仓储',
    menus: [
      { key: 'inventory-overview', label: '仓储概览', icon: <OverviewIcon /> },
      { key: 'inventory-stock', label: '库存管理', icon: <StockIcon />, children: [
        { key: 'inventory-purchase-inbound', label: '采购入库', icon: <InboundIcon /> },
        { key: 'inventory-sales-outbound', label: '销售出库', icon: <OutboundIcon /> },
        { key: 'inventory-other-io', label: '其他出入库', icon: <InboundRecordIcon /> },
        { key: 'inventory-transfer', label: '库存调拨', icon: <TraceabilityIcon /> },
      ] },
      { key: 'inventory-check', label: '库存盘点', icon: <CheckIcon /> },
      { key: 'inventory-io-record', label: '出入库记录', icon: <InboundRecordIcon /> },
      { key: 'inventory-warehouse-settings', label: '仓库设置', icon: <WarehouseSettingsIcon /> },
      { key: 'inventory-alert-settings', label: '预警设置', icon: <AlertSettingsIcon /> },
    ],
  },
  [ModuleKey.PRODUCT]: {
    key: ModuleKey.PRODUCT,
    label: '商品',
    menus: [
      { key: 'product-overview', label: '商品概览', icon: <OverviewIcon /> },
      { key: 'product-manage', label: '商品管理', icon: <ProductListIcon />, children: [
        { key: 'product-manage-tea', label: '茶叶', icon: <ProductListIcon /> },
        { key: 'product-manage-teaware', label: '茶具', icon: <ProductListIcon /> },
        { key: 'product-manage-peripheral', label: '茶周边', icon: <ProductListIcon /> },
        { key: 'product-manage-other', label: '其他', icon: <ProductListIcon /> },
      ] },
      { key: 'product-category', label: '分类管理', icon: <ProductCategoryIcon /> },
      { key: 'product-brand', label: '品牌管理', icon: <BrandIcon /> },
      { key: 'product-price', label: '价格管理', icon: <PriceIcon /> },
      { key: 'product-tea-category', label: '茶叶档案', icon: <CategoryIcon />, children: [
        { key: 'product-tea-seven', label: '六大茶类', icon: <CategoryIcon /> },
        { key: 'product-tea-list', label: '茶种大全', icon: <CategoryIcon /> },
      ] },
    ],
  },
  [ModuleKey.FINANCE]: {
    key: ModuleKey.FINANCE,
    label: '财务',
    menus: [
      { key: 'finance-overview', label: '财务概览', icon: <OverviewIcon /> },
      { key: 'finance-settlement', label: '结算管理', icon: <PaymentIcon />, children: [
        { key: 'finance-purchase-payment', label: '采购付款', icon: <PaymentIcon /> },
        { key: 'finance-sales-collection', label: '销售回款', icon: <CollectionIcon /> },
        { key: 'finance-other-receivable', label: '其他应收', icon: <ReceivableIcon /> },
        { key: 'finance-other-payable', label: '其他应付', icon: <ExpenseIcon /> },
      ] },
      { key: 'finance-invoice', label: '发票管理', icon: <InvoiceIcon /> },
      { key: 'finance-cost', label: '成本核算', icon: <FinanceReportIcon /> },
      { key: 'finance-expense', label: '费用管理', icon: <ExpenseIcon /> },
      { key: 'finance-balance', label: '余额管理', icon: <AccountIcon /> },
    ],
  },
  [ModuleKey.STATISTICS]: {
    key: ModuleKey.STATISTICS,
    label: '统计',
    menus: [
      { key: 'statistics-sales', label: '销售分析', icon: <SalesAnalysisIcon /> },
      { key: 'statistics-brand', label: '品牌分析', icon: <BrandAnalysisIcon /> },
      { key: 'statistics-purchase', label: '采购分析', icon: <PurchaseAnalysisIcon /> },
      { key: 'statistics-inventory', label: '库存分析', icon: <InventoryAnalysisIcon /> },
      { key: 'statistics-finance', label: '财务报表', icon: <FinanceReportIcon /> },
      { key: 'statistics-tea-category', label: '茶类分析', icon: <TeaCategoryAnalysisIcon /> },
      { key: 'statistics-year-on-year', label: '同比环比', icon: <YearOnYearIcon /> },
    ],
  },
  [ModuleKey.SETTINGS]: {
    key: ModuleKey.SETTINGS,
    label: '系统',
    menus: [
      { key: 'settings-system', label: '系统设置', icon: <SystemSettingsIcon /> },
      { key: 'settings-roles', label: '角色权限', icon: <RolesIcon /> },
      { key: 'settings-logs', label: '操作日志', icon: <LogsIcon /> },
      { key: 'settings-about', label: '关于', icon: <AboutIcon /> },
      { key: 'settings-user-management', label: '用户管理', icon: <UserManagementIcon /> },
      { key: 'settings-data-backup', label: '数据备份', icon: <DataBackupIcon /> },
      { key: 'settings-unit', label: '单位设置', icon: <UnitIcon /> },
    ],
  },
  [ModuleKey.PERSONNEL]: {
    key: ModuleKey.PERSONNEL,
    label: '人员',
    menus: [
      { key: 'personnel-organization', label: '组织架构', icon: <OrgChartIcon /> },
      { key: 'personnel-employee', label: '员工管理', icon: <EmployeeIcon /> },
      { key: 'personnel-tea-professional', label: '茶人管理', icon: <TeaProfessionalIcon /> },
      { key: 'personnel-streamer', label: '带货人管理', icon: <StreamerIcon /> },
      { key: 'personnel-stores', label: '门店管理', icon: <StoreIcon /> },
    ],
  },
};

/** 获取指定模块的菜单列表 */
export function getModuleMenus(key: ModuleKey): MenuItem[] {
  return MODULE_CONFIGS[key]?.menus ?? [];
}

/** 顶栏模块 Tab 列表（含图标组件） */
export const TOPNAV_TABS: Array<{ key: ModuleKey; label: string; icon: React.ReactNode }> = [
  { key: ModuleKey.DASHBOARD, label: '工作台', icon: <DashboardTabIcon /> },
  { key: ModuleKey.PURCHASE, label: '采购', icon: <PurchaseTabIcon /> },
  { key: ModuleKey.SALES, label: '销售', icon: <SalesTabIcon /> },
  { key: ModuleKey.PRODUCT, label: '商品', icon: <ProductTabIcon /> },
  { key: ModuleKey.INVENTORY, label: '仓储', icon: <InventoryTabIcon /> },
  { key: ModuleKey.PERSONNEL, label: '人员', icon: <PersonnelTabIcon /> },
  { key: ModuleKey.FINANCE, label: '财务', icon: <FinanceTabIcon /> },
  { key: ModuleKey.STATISTICS, label: '统计', icon: <StatisticsTabIcon /> },
  { key: ModuleKey.SETTINGS, label: '系统', icon: <SettingsTabIcon /> },
];
