import { useState, useEffect, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import StatusTag, { orderStatusToVariant, orderStatusLabel } from '../../components/common/StatusTag';
import FilterBar, { FilterInput, FilterSelect } from '../../components/business/FilterBar';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { TeaCategory, OrderStatus, PersonRoleType } from '../../types';
import type { StatCardData, SalesOrderItem, CustomerItem } from '../../types';
import { getSalesDefaultPrice, getPersonalMinPrice } from '../../data/prices';
import { teaProducts } from '../../data/teaProducts';
import { employees, getEmployeeName, getAllPersonOptions, getPersonName, PERSON_TYPE_LABELS } from '../../data/organization';
import DeptEmployeeSelect from '../../components/business/DeptEmployeeSelect';
import { customerItems, CUSTOMER_TYPE_LABELS as GLOBAL_CUSTOMER_LABELS, CUSTOMER_TYPE_DESC, generateOrderContactId } from '../../data/customers';
import { platformItems } from '../../data/platforms';
import { streamers } from '../../data/streamers';
import { generateCustomerCode } from '../../utils/customerCode';
import { useOrderFlowStore, getSelfPurchaseEstimate } from '../../stores/orderFlowStore';
import {
  EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS, EXTERNAL_STATUS_LABELS, EXTERNAL_STATUS_COLORS, TRANSFER_SOURCE_LABELS,
} from '../../data/externalOrders';
import { PARTNER_ORDER_STATUS_LABELS } from '../../data/partner';
import type { ExternalOrder } from '../../types';

/* ── 工具函数 ── */
function categoryToTeaCategory(category: string): TeaCategory {
  const prefix = category.split('-')[0];
  const map: Record<string, TeaCategory> = {
    '绿茶': TeaCategory.GREEN, '红茶': TeaCategory.RED, '青茶': TeaCategory.OOLONG,
    '白茶': TeaCategory.WHITE, '黄茶': TeaCategory.YELLOW, '黑茶': TeaCategory.DARK,
    '花草茶': TeaCategory.FLOWER,
  };
  return map[prefix] ?? TeaCategory.GREEN;
}

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('en-US')}`;
}

/* 价格来源标签 */
const SOURCE_LABELS: Record<'vip' | 'sales' | 'market', string> = {
  vip: 'VIP', sales: '销售', market: '市场',
};
const SOURCE_COLORS: Record<'vip' | 'sales' | 'market', string> = {
  vip: '#CB405D', sales: 'var(--color-module-current-base)', market: 'var(--color-text-tertiary)',
};

/* ── 统计卡片 ── */
const stats: StatCardData[] = [
  {
    label: '订单总数', value: '58',
    trend: { direction: 'up', value: '+8 单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    label: '销售总额', value: '1,285,600', unit: '¥',
    trend: { direction: 'up', value: '12.5%' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    label: '待审核', value: '5',
    trend: { direction: 'down', value: '2 单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 8h4M7 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  },
  {
    label: '运输中', value: '3',
    trend: { direction: 'up', value: '+1 单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M2 12h10l4-4H6L2 12zM6 8l2-4h8l-2 4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  },
];

/* ── 客户类型 ── */
type CustomerType = 'direct' | 'channel' | 'personal' | 'platform' | 'guest';

const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  direct: '直营客户',
  channel: '渠道客户',
  personal: '个人客户',
  platform: '平台客户',
  guest: '游客客户',
};

/* 新客户下拉选项（直营/渠道加"企业"后缀） */
const CUSTOMER_TYPE_DROPDOWN_OPTIONS: { value: CustomerType; label: string }[] = [
  { value: 'direct', label: '直营客户（企业）' },
  { value: 'channel', label: '渠道客户（企业）' },
  { value: 'personal', label: '个人客户' },
  { value: 'platform', label: '平台客户' },
  { value: 'guest', label: '游客客户' },
];

/* 客户类型标签颜色映射 */
const customerTypeColors: Record<CustomerType, { bg: string; color: string; border: string }> = {
  direct: { bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
  channel: { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' },
  personal: { bg: '#F3E5F5', color: '#7B1FA2', border: '#CE93D8' },
  platform: { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7' },
  guest: { bg: '#ECEFF1', color: '#455A64', border: '#B0BEC5' },
};

/* ── Mock 订单数据 ── */
export interface SalesOrderRecord {
  id: string;
  code: string;
  customer: string;
  customerType: CustomerType;
  product: string;
  teaCategory: TeaCategory;
  quantity: string;
  unitPrice: string;
  amount: string;
  date: string;
  status: OrderStatus;
  contactPerson: string;
  contactPhone: string;
  deliveryAddress: string;
  remark: string;
  products: SalesOrderItem[];
  timeline: { time: string; event: string; operator: string }[];
  /** 跟单人 ID（负责订单跟进，可为员工/茶人/带货人） */
  followerId?: string;
  /** 跟单人类型 */
  followerType?: PersonRoleType;
  /** 跟单人姓名 */
  followerName?: string;
  /** 带货人 ID */
  streamerId?: string;
  /** 带货人姓名 */
  streamerName?: string;
  /** 拓客人 ID（原主办人） */
  developerId?: string;
  /** 拓客人类型 */
  developerType?: PersonRoleType;
  /** 拓客人姓名 */
  developerName?: string;
  /** 销售场景（1-6） */
  scenario?: number;
  /** 平台扣点（仅场景2） */
  platformDeductionRate?: number;
}

export const orderData: SalesOrderRecord[] = [
  {
    id: '1', code: 'SO-2025-0242', customer: '华茗堂茶庄', customerType: 'direct',
    product: '明前龙井', teaCategory: TeaCategory.GREEN, quantity: '30 kg', unitPrice: '¥ 580/50g', amount: '¥ 34,800',
    date: '2025-07-12', status: OrderStatus.PENDING,
    contactPerson: '王经理', contactPhone: '0571-87651234', deliveryAddress: '杭州市西湖区龙井路88号',
    remark: '需冷藏运输，指定顺丰',
    followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 1,
    products: [
      { productId: '1', name: '明前龙井 — 特级', teaCategory: TeaCategory.GREEN, quantity: '20 kg', marketPrice: 580, defaultPrice: 452, actualSalesPrice: 452, priceSource: 'sales', amount: '¥ 23,200' },
      { productId: '2', name: '碧螺春 — 一级', teaCategory: TeaCategory.GREEN, quantity: '10 kg', marketPrice: 420, defaultPrice: 328, actualSalesPrice: 328, priceSource: 'sales', amount: '¥ 11,600' },
    ],
    timeline: [
      { time: '2025-07-12 09:30', event: '客户下单', operator: '系统' },
      { time: '2025-07-12 10:15', event: '订单确认', operator: '李销售' },
    ],
  },
  {
    id: '2', code: 'SO-2025-0241', customer: '雅韵茶社', customerType: 'channel',
    product: '金骏眉', teaCategory: TeaCategory.RED, quantity: '15 kg', unitPrice: '¥ 1,200/50g', amount: '¥ 36,000',
    date: '2025-07-11', status: OrderStatus.APPROVED,
    contactPerson: '赵总', contactPhone: '0599-51234567', deliveryAddress: '武夷山市度假区茶博园6号',
    remark: '长期合作客户，月结',
    followerId: 'emp-9', followerType: 'employee', followerName: '张伟', scenario: 3,
    products: [
      { productId: '7', name: '金骏眉 — 特级', teaCategory: TeaCategory.RED, quantity: '15 kg', marketPrice: 1280, defaultPrice: 1024, actualSalesPrice: 1024, priceSource: 'sales', amount: '¥ 36,000' },
    ],
    timeline: [
      { time: '2025-07-11 14:00', event: '客户下单', operator: '系统' },
      { time: '2025-07-11 14:30', event: '订单确认', operator: '张销售' },
      { time: '2025-07-11 16:00', event: '审核通过', operator: '陈经理' },
    ],
  },
  {
    id: '3', code: 'SO-2025-0240', customer: '清心茶坊', customerType: 'direct',
    product: '凤凰单丛', teaCategory: TeaCategory.OOLONG, quantity: '40 kg', unitPrice: '¥ 560/50g', amount: '¥ 44,800',
    date: '2025-07-10', status: OrderStatus.SHIPPING,
    contactPerson: '林老板', contactPhone: '0768-2345678', deliveryAddress: '潮州市湘桥区太平路168号',
    remark: '分两批发货',
    followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 1,
    products: [
      { productId: '12', name: '凤凰单丛 — 特级', teaCategory: TeaCategory.OOLONG, quantity: '25 kg', marketPrice: 560, defaultPrice: 426, actualSalesPrice: 426, priceSource: 'sales', amount: '¥ 28,000' },
      { productId: '10', name: '大红袍 — 特级', teaCategory: TeaCategory.OOLONG, quantity: '15 kg', marketPrice: 720, defaultPrice: 547, actualSalesPrice: 547, priceSource: 'sales', amount: '¥ 16,800' },
    ],
    timeline: [
      { time: '2025-07-10 10:00', event: '客户下单', operator: '系统' },
      { time: '2025-07-10 10:30', event: '订单确认', operator: '李销售' },
      { time: '2025-07-10 14:00', event: '审核通过', operator: '陈经理' },
      { time: '2025-07-11 09:00', event: '已发货', operator: '赵仓管' },
    ],
  },
  {
    id: '4', code: 'SO-2025-0239', customer: '品茗轩', customerType: 'platform',
    product: '白毫银针', teaCategory: TeaCategory.WHITE, quantity: '20 kg', unitPrice: '¥ 960/50g', amount: '¥ 38,400',
    date: '2025-07-09', status: OrderStatus.COMPLETED,
    contactPerson: '张女士', contactPhone: '0593-5678901', deliveryAddress: '福鼎市太姥山镇茶都路22号',
    remark: '已签收，客户满意',
    followerId: undefined, followerName: undefined, scenario: 5,
    products: [
      { productId: '13', name: '白毫银针 — 特级', teaCategory: TeaCategory.WHITE, quantity: '20 kg', marketPrice: 960, defaultPrice: 787, actualSalesPrice: 787, priceSource: 'sales', amount: '¥ 38,400' },
    ],
    timeline: [
      { time: '2025-07-09 08:30', event: '客户下单', operator: '系统' },
      { time: '2025-07-09 09:00', event: '订单确认', operator: '张销售' },
      { time: '2025-07-09 11:00', event: '审核通过', operator: '陈经理' },
      { time: '2025-07-10 08:00', event: '已发货', operator: '赵仓管' },
      { time: '2025-07-11 14:00', event: '已签收', operator: '客户' },
    ],
  },
  {
    id: '5', code: 'SO-2025-0238', customer: '翠竹茶行', customerType: 'channel',
    product: '六堡茶', teaCategory: TeaCategory.DARK, quantity: '50 kg', unitPrice: '¥ 180/50g', amount: '¥ 18,000',
    date: '2025-07-08', status: OrderStatus.COMPLETED,
    contactPerson: '周经理', contactPhone: '0774-7234567', deliveryAddress: '梧州市万秀区西江路56号',
    remark: '季度采购，常规订单',
    followerId: 'emp-9', followerType: 'employee', followerName: '张伟', scenario: 3,
    products: [
      { productId: '33', name: '六堡茶 — 二级', teaCategory: TeaCategory.DARK, quantity: '30 kg', marketPrice: 280, defaultPrice: 210, actualSalesPrice: 210, priceSource: 'sales', amount: '¥ 10,800' },
      { productId: '18', name: '熟普洱 — 三级', teaCategory: TeaCategory.DARK, quantity: '20 kg', marketPrice: 260, defaultPrice: 195, actualSalesPrice: 195, priceSource: 'sales', amount: '¥ 7,200' },
    ],
    timeline: [
      { time: '2025-07-08 09:00', event: '客户下单', operator: '系统' },
      { time: '2025-07-08 09:30', event: '订单确认', operator: '李销售' },
      { time: '2025-07-08 14:00', event: '审核通过', operator: '陈经理' },
      { time: '2025-07-09 08:30', event: '已发货', operator: '赵仓管' },
      { time: '2025-07-10 16:00', event: '已签收', operator: '客户' },
    ],
  },
  {
    id: '6', code: 'SO-2025-0237', customer: '和风茶屋', customerType: 'direct',
    product: '君山银针', teaCategory: TeaCategory.YELLOW, quantity: '10 kg', unitPrice: '¥ 880/50g', amount: '¥ 17,600',
    date: '2025-07-07', status: OrderStatus.PENDING,
    contactPerson: '何老板', contactPhone: '0730-8234567', deliveryAddress: '岳阳市君山区洞庭大道99号',
    remark: '新客户首单，需提供样品检测报告',
    followerId: undefined, followerName: undefined, scenario: 1,
    products: [
      { productId: '16', name: '君山银针 — 特级', teaCategory: TeaCategory.YELLOW, quantity: '10 kg', marketPrice: 880, defaultPrice: 695, actualSalesPrice: 695, priceSource: 'sales', amount: '¥ 17,600' },
    ],
    timeline: [
      { time: '2025-07-07 11:00', event: '客户下单', operator: '系统' },
    ],
  },
  {
    id: '7', code: 'SO-2025-0236', customer: '云隐茶庄', customerType: 'channel',
    product: '正山小种', teaCategory: TeaCategory.RED, quantity: '25 kg', unitPrice: '¥ 480/50g', amount: '¥ 24,000',
    date: '2025-07-06', status: OrderStatus.APPROVED,
    contactPerson: '江总', contactPhone: '0599-5234567', deliveryAddress: '武夷山市星村镇茶场路12号',
    remark: '有机认证产品，需附证书',
    followerId: 'emp-8',  followerName: '王强', scenario: 3,
    products: [
      { productId: '6', name: '正山小种 — 特级', teaCategory: TeaCategory.RED, quantity: '25 kg', marketPrice: 480, defaultPrice: 384, actualSalesPrice: 384, priceSource: 'sales', amount: '¥ 24,000' },
    ],
    timeline: [
      { time: '2025-07-06 09:30', event: '客户下单', operator: '系统' },
      { time: '2025-07-06 10:00', event: '订单确认', operator: '张销售' },
      { time: '2025-07-06 15:00', event: '审核通过', operator: '陈经理' },
    ],
  },
  {
    id: '8', code: 'SO-2025-0235', customer: '茗香斋', customerType: 'platform',
    product: '铁观音', teaCategory: TeaCategory.OOLONG, quantity: '60 kg', unitPrice: '¥ 320/50g', amount: '¥ 38,400',
    date: '2025-07-05', status: OrderStatus.SHIPPING,
    contactPerson: '吴经理', contactPhone: '0595-2345678', deliveryAddress: '安溪县凤城镇茶都路188号',
    remark: '清香型，真空包装',
    followerId: 'emp-9', followerType: 'employee', followerName: '张伟', scenario: 5,
    products: [
      { productId: '11', name: '铁观音 — 一级', teaCategory: TeaCategory.OOLONG, quantity: '40 kg', marketPrice: 320, defaultPrice: 243, actualSalesPrice: 243, priceSource: 'sales', amount: '¥ 25,600' },
      { productId: '11', name: '铁观音 — 二级', teaCategory: TeaCategory.OOLONG, quantity: '20 kg', marketPrice: 320, defaultPrice: 243, actualSalesPrice: 243, priceSource: 'sales', amount: '¥ 12,800' },
    ],
    timeline: [
      { time: '2025-07-05 08:00', event: '客户下单', operator: '系统' },
      { time: '2025-07-05 08:30', event: '订单确认', operator: '李销售' },
      { time: '2025-07-05 10:00', event: '审核通过', operator: '陈经理' },
      { time: '2025-07-06 09:00', event: '已发货', operator: '赵仓管' },
    ],
  },
  {
    id: '9', code: 'SO-2025-0234', customer: '华茗堂茶庄', customerType: 'direct',
    product: '祁门红茶', teaCategory: TeaCategory.RED, quantity: '35 kg', unitPrice: '¥ 520/50g', amount: '¥ 36,400',
    date: '2025-07-04', status: OrderStatus.COMPLETED,
    contactPerson: '王经理', contactPhone: '0571-87651234', deliveryAddress: '杭州市西湖区龙井路88号',
    remark: '月度补货订单',
    followerId: 'emp-8', followerType: 'employee', followerName: '王强', scenario: 1,
    products: [
      { productId: '9', name: '祁门红茶 — 特级', teaCategory: TeaCategory.RED, quantity: '35 kg', marketPrice: 520, defaultPrice: 416, actualSalesPrice: 416, priceSource: 'sales', amount: '¥ 36,400' },
    ],
    timeline: [
      { time: '2025-07-04 09:00', event: '客户下单', operator: '系统' },
      { time: '2025-07-04 09:30', event: '订单确认', operator: '张销售' },
      { time: '2025-07-04 11:00', event: '审核通过', operator: '陈经理' },
      { time: '2025-07-05 08:30', event: '已发货', operator: '赵仓管' },
      { time: '2025-07-06 15:00', event: '已签收', operator: '客户' },
    ],
  },
  {
    id: '10', code: 'SO-2025-0233', customer: '雅韵茶社', customerType: 'channel',
    product: '玫瑰花茶', teaCategory: TeaCategory.FLOWER, quantity: '20 kg', unitPrice: '¥ 128/50g', amount: '¥ 5,120',
    date: '2025-07-03', status: OrderStatus.CANCELLED,
    contactPerson: '赵总', contactPhone: '0599-51234567', deliveryAddress: '武夷山市度假区茶博园6号',
    remark: '客户取消，改订茉莉花茶',
    followerId: undefined, followerName: undefined, scenario: 3,
    products: [
      { productId: '24', name: '玫瑰花茶 — 一级', teaCategory: TeaCategory.FLOWER, quantity: '20 kg', marketPrice: 158, defaultPrice: 122, actualSalesPrice: 122, priceSource: 'sales', amount: '¥ 5,120' },
    ],
    timeline: [
      { time: '2025-07-03 10:00', event: '客户下单', operator: '系统' },
      { time: '2025-07-03 14:00', event: '客户取消', operator: '客户' },
    ],
  },
];

export default function SalesOrders() {
  const [orders, setOrders] = useState<SalesOrderRecord[]>(orderData);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderRecord | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [codeSeq, setCodeSeq] = useState(243);

  /* ── 流转订单 Tab（订单处理分流出的自营/分发订单） ── */
  const [tab, setTab] = useState<'sales' | 'flow'>('sales');
  const flowOrders = useOrderFlowStore((s) => s.orders);
  const flowStore = useOrderFlowStore;
  const selfPendingCount = flowOrders.filter((o) => o.processStatus === 'self_pending').length;

  /** 自营接单弹窗（填跟单人 + 选采购供应商） */
  const [accepting, setAccepting] = useState<ExternalOrder | null>(null);
  const [acceptFollower, setAcceptFollower] = useState('');
  const [acceptSupplier, setAcceptSupplier] = useState('');
  const [acceptError, setAcceptError] = useState('');
  const acceptEstimates = useMemo(
    () => (accepting ? getSelfPurchaseEstimate(accepting.items) : []),
    [accepting],
  );

  /** 流转订单：待接单（自营/分发）+ 执行中/已完成 */
  const visibleFlowOrders = useMemo(
    () => flowOrders.filter((o) => ['self_pending', 'distribute_pending', 'processed', 'completed'].includes(o.processStatus)),
    [flowOrders],
  );

  const flowStatusPill = (o: ExternalOrder) => {
    if (o.processStatus === 'self_pending') {
      return <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: EXTERNAL_STATUS_COLORS.self_pending.bg, color: EXTERNAL_STATUS_COLORS.self_pending.color }}>待接单（自营）</span>;
    }
    if (o.processStatus === 'distribute_pending') {
      return <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: EXTERNAL_STATUS_COLORS.distribute_pending.bg, color: EXTERNAL_STATUS_COLORS.distribute_pending.color }}>待接单（合作商）</span>;
    }
    // 已处理 / 已完成统一展示为已处理（子状态区分执行进度）
    const sub = o.processStatus === 'completed'
      ? (o.path === 'self' ? '已完成' : '已结算')
      : o.path === 'self'
        ? (o.selfChain?.outboundCode ? '已发货' : o.selfChain?.inboundCode ? '已入库' : '采购中')
        : (o.partnerStatus ? PARTNER_ORDER_STATUS_LABELS[o.partnerStatus] : '执行中');
    return (
      <span>
        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: EXTERNAL_STATUS_COLORS.processed.bg, color: EXTERNAL_STATUS_COLORS.processed.color }}>已处理</span>
        <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>{sub}</span>
      </span>
    );
  };

  const confirmAcceptSelf = () => {
    if (!accepting) return;
    if (!acceptFollower) {
      setAcceptError('请选择跟单人');
      return;
    }
    if (!acceptSupplier) {
      setAcceptError('请选择采购供应商');
      return;
    }
    const est = acceptEstimates.find((e) => e.supplierId === acceptSupplier)!;
    const followerName = getEmployeeName(acceptFollower);
    const res = flowStore.getState().acceptSelfOrder(accepting.id, {
      supplierId: est.supplierId,
      supplierName: est.supplierName,
      follower: followerName,
    });
    if (res.ok) {
      setAccepting(null);
      setAcceptFollower('');
      setAcceptSupplier('');
      setAcceptError('');
    } else {
      setAcceptError(res.msg);
    }
  };

  const handleView = (order: SalesOrderRecord) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedOrder(null);
  };

  const handleCreate = (order: SalesOrderRecord) => {
    orderData.unshift(order);
    setOrders(prev => [order, ...prev]);
    setCodeSeq(s => s + 1);
    setShowCreate(false);
  };

  return (
    <>
      <ContentHeader
        title="销售订单"
        breadcrumbs={['销售', '销售订单']}
        actions={<Button onClick={() => setShowCreate(true)}><PlusIcon />新建销售单</Button>}
      />
      <div className="content-body">
        {/* Tab：销售订单 / 流转订单（订单处理分流出的自营/分发订单） */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <button className={`tab-card-simple${tab === 'sales' ? ' active' : ''}`} onClick={() => setTab('sales')}>
            销售订单
            <span className="tab-card-simple-count">{orders.length} 单</span>
          </button>
          <button className={`tab-card-simple${tab === 'flow' ? ' active' : ''}`} onClick={() => setTab('flow')}>
            流转订单
            <span className="tab-card-simple-count">自营待接单 {selfPendingCount} / 共 {visibleFlowOrders.length} 单</span>
          </button>
        </div>

        {/* ── 流转订单 Tab ── */}
        {tab === 'flow' && (
          <Card style={{ padding: 0 }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7 }}>
              来自<strong>订单生成&流转</strong>分流：自营待接单订单点击「接单」进入自营执行（接单时填写跟单人并生成采购订单）；
              分发类订单由合作商终端接单履约，此处仅<strong>跟踪进度</strong>，管理后台不做操作。
            </div>
            <Table
              headers={['订单编号', '订单类型', '客户', '商品', '订单金额', '状态', '跟单人 / 合作商', '录入时间', '操作']}
              rows={visibleFlowOrders.map((o) => [
                <span key="c" className="cell-mono-emph">{o.code}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{EXTERNAL_PLATFORM_LABELS[o.platform]} · {EXTERNAL_CHANNEL_LABELS[o.sourceChannel]}</span></span>,
                o.path === 'self'
                  ? <span key="t" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#E3F2FD', color: '#0F64B5' }}>自营</span>
                  : <span key="t" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#E0F2F1', color: '#00695C' }}>{o.transferSource ? TRANSFER_SOURCE_LABELS[o.transferSource] : '分发'}</span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="i" style={{ whiteSpace: 'nowrap' }}>{o.items[0].productName}{o.items.length > 1 ? ` 等${o.items.length}种` : ''}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{formatMoney(o.totalAmount)}</span>,
                flowStatusPill(o),
                <span key="w" style={{ fontSize: 'var(--text-sm)' }}>{o.path === 'self' ? (o.follower ?? '—') : (o.partnerName ?? '—')}</span>,
                <span key="d" className="cell-muted">{o.entryTime}</span>,
                <div key="act" className="row-actions">
                  {o.processStatus === 'self_pending' && (
                    <Button size="sm" onClick={() => { setAccepting(o); setAcceptFollower(''); setAcceptSupplier(''); setAcceptError(''); }}>接单</Button>
                  )}
                  {o.processStatus === 'distribute_pending' && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>等合作商接单</span>}
                  {(o.processStatus === 'processed' || o.processStatus === 'completed') && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.path === 'self' ? '自营执行中' : '合作商履约中'}</span>}
                </div>,
              ])}
            />
          </Card>
        )}

        {/* ── 销售订单 Tab（原有） ── */}
        {tab === 'sales' && (<>
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        <FilterBar>
          <FilterInput placeholder="搜索订单编号、客户..." />
          <FilterSelect options={['全部状态', '待审核', '待确认', '运输中', '已完成', '已取消']} />
          <FilterSelect options={['全部茶类', '绿茶', '白茶', '黄茶', '青茶', '红茶', '黑茶', '花草茶']} />
          <FilterSelect options={['全部客户类型', '直营客户', '渠道客户', '个人客户', '平台客户', '游客客户']} />
          <FilterSelect options={['全部时间', '今日', '本周', '本月', '近3月']} />
        </FilterBar>

        <Card>
          <Table
            headers={['订单编号', '客户', '客户类型', '跟单人', '带货人', '拓客人', '商品', '茶类', '数量', '单价', '金额', '下单日期', '状态', '操作']}
            rows={orders.map((o) => {
              const ctColor = customerTypeColors[o.customerType];
              return [
              <span className="mono">{o.code}</span>,
              o.customer,
              <span style={{
                padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                background: ctColor.bg, color: ctColor.color, border: `1px solid ${ctColor.border}`,
              }}>{CUSTOMER_TYPE_LABELS[o.customerType]}</span>,
              <span key="follower" style={{ fontSize: 'var(--text-sm)', color: o.followerName ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}>{o.followerName ? o.followerType ? `${o.followerName}（${PERSON_TYPE_LABELS[o.followerType]}）` : o.followerName : '—'}</span>,
              <span key="streamer" style={{ fontSize: 'var(--text-sm)', color: o.streamerName ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}>{o.streamerName ?? '—'}</span>,
              <span key="host" style={{ fontSize: 'var(--text-sm)', color: o.developerName ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}>{o.developerName ? o.developerType ? `${o.developerName}（${PERSON_TYPE_LABELS[o.developerType]}）` : o.developerName : '—'}</span>,
              o.product,
              <Tag category={o.teaCategory} />,
              <span className="mono">{o.quantity}</span>,
              <span className="mono">{o.unitPrice}</span>,
              <span className="mono">{o.amount}</span>,
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{o.date}</span>,
              <StatusTag variant={orderStatusToVariant(o.status)} label={orderStatusLabel(o.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(o)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(o)}>编辑</Button>
              </div>,
            ];})}
          />
        </Card>
        </>)}
      </div>

      {/* 自营接单弹窗（流转订单：填跟单人 + 选采购供应商，生成采购订单） */}
      {accepting && (
        <div className="category-dialog-overlay" onClick={() => setAccepting(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '94vw' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>接单（自营）</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              接单后订单 <strong className="mono">{accepting.code}</strong>（{accepting.customerName} · {formatMoney(accepting.totalAmount)}）进入<strong>已处理</strong>，
              按「以销定采」生成采购订单并开始自营执行流程。
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>跟单人 *</label>
              <DeptEmployeeSelect value={acceptFollower} onChange={(v: string) => { setAcceptFollower(v); setAcceptError(''); }} placeholder="选择员工" style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>采购供应商 *（按采购价预估，低价在前）</label>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)' }}>
                {acceptEstimates.slice(0, 6).map((e) => (
                  <label key={e.supplierId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '8px 12px', borderBottom: '1px solid var(--color-neutral-100)', cursor: 'pointer', background: acceptSupplier === e.supplierId ? 'var(--color-module-current-lightest)' : undefined }}>
                    <input type="radio" name="accept-supplier" checked={acceptSupplier === e.supplierId} onChange={() => { setAcceptSupplier(e.supplierId); setAcceptError(''); }} />
                    <span style={{ flex: 1, fontWeight: 'var(--font-medium)' }}>{e.supplierName}</span>
                    <span className="mono" style={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{formatMoney(e.amount)}</span>
                  </label>
                ))}
              </div>
            </div>
            {acceptError && (
              <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{acceptError}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setAccepting(null)}>取消</Button>
              <Button onClick={confirmAcceptSelf}>确认接单</Button>
            </div>
          </div>
        </div>
      )}

      {/* 新建销售单抽屉 */}
      {showCreate && (
        <CreateSalesDrawer
          nextNumber={codeSeq}
          onCancel={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {/* 订单详情抽屉 */}
      <DetailDrawer
        open={showDetail && !!selectedOrder}
        onClose={handleCloseDetail}
        badge="SO"
        title={selectedOrder?.code}
        statusTag={selectedOrder && <StatusTag variant={orderStatusToVariant(selectedOrder.status)} label={orderStatusLabel(selectedOrder.status)} />}
        subtitle={selectedOrder && `${selectedOrder.customer} · ${selectedOrder.date}`}
        mode="view"
      >
        {selectedOrder && (
          <>
            <DrawerSection title="基本信息">
              <InfoGrid cols={3}>
                <InfoItem label="订单编号" emph mono>{selectedOrder.code}</InfoItem>
                <InfoItem label="客户" emph>{selectedOrder.customer}</InfoItem>
                <InfoItem label="客户类型">
                  {(() => { const c = customerTypeColors[selectedOrder.customerType]; return (
                  <span style={{
                    padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                  }}>{CUSTOMER_TYPE_LABELS[selectedOrder.customerType]}</span>); })()}
                </InfoItem>
                <InfoItem label="跟单人">{selectedOrder.followerName ? selectedOrder.followerType ? `${selectedOrder.followerName}（${PERSON_TYPE_LABELS[selectedOrder.followerType]}）` : selectedOrder.followerName : '—'}</InfoItem>
                <InfoItem label="带货人">{selectedOrder.streamerName ?? '—'}</InfoItem>
                <InfoItem label="拓客人">{selectedOrder.developerName ? selectedOrder.developerType ? `${selectedOrder.developerName}（${PERSON_TYPE_LABELS[selectedOrder.developerType]}）` : selectedOrder.developerName : '—'}</InfoItem>
                <InfoItem label="下单日期">{selectedOrder.date}</InfoItem>
                <InfoItem label="联系人">{selectedOrder.contactPerson}</InfoItem>
                <InfoItem label="联系电话" mono>{selectedOrder.contactPhone}</InfoItem>
                <InfoItem label="收货地址" span={3}>{selectedOrder.deliveryAddress}</InfoItem>
                <InfoItem label="备注" span={3}>{selectedOrder.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="商品明细">
              <table className="detail-inline-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>茶类</th>
                    <th>数量</th>
                    <th style={{ textAlign: 'right' }}>市场价</th>
                    <th style={{ textAlign: 'right' }}>默认价</th>
                    <th style={{ textAlign: 'right' }}>销售实价</th>
                    <th style={{ textAlign: 'right' }}>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.products.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{p.name}</td>
                      <td><Tag category={p.teaCategory} /></td>
                      <td className="mono">{p.quantity}</td>
                      <td className="mono" style={{ textAlign: 'right', color: 'var(--color-text-tertiary)' }}>{formatMoney(p.marketPrice)}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>
                        {formatMoney(p.defaultPrice)}
                        <span style={{
                          marginLeft: 6, padding: '0 6px', borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                          background: 'var(--color-bg-tertiary)', color: SOURCE_COLORS[p.priceSource],
                          border: `1px solid ${SOURCE_COLORS[p.priceSource]}30`,
                        }}>{SOURCE_LABELS[p.priceSource]}</span>
                      </td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>{formatMoney(p.actualSalesPrice)}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{p.amount}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 'var(--font-semibold)' }}>
                    <td colSpan={6} style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>合计</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--color-module-current-base)' }}>{selectedOrder.amount}</td>
                  </tr>
                </tbody>
              </table>
            </DrawerSection>

            <DrawerSection title="操作日志">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {selectedOrder.timeline.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: i === selectedOrder.timeline.length - 1 ? 'var(--color-module-current-lightest)' : 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', border: i === selectedOrder.timeline.length - 1 ? '1px solid var(--color-module-current-light)' : '1px solid transparent' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-md)',
                      background: i === selectedOrder.timeline.length - 1 ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
                      color: i === selectedOrder.timeline.length - 1 ? '#fff' : 'var(--color-text-tertiary)',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{step.event}</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }} className="mono">{step.time}</span>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>操作人：{step.operator}</div>
                    </div>
                  </div>
                ))}
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </>
  );
}

/* ── 新建销售单抽屉 ── */
function CreateSalesDrawer({ nextNumber, onCancel, onSave }: {
  nextNumber: number;
  onCancel: () => void;
  onSave: (order: SalesOrderRecord) => void;
}) {
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [actualSalesPrice, setActualSalesPrice] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [remark, setRemark] = useState('');
  const [contactSelect, setContactSelect] = useState<string>('');

  // 客户搜索与选择
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerType, setCustomerType] = useState<CustomerType | ''>('');
  const [newCustomerShortName, setNewCustomerShortName] = useState('');

  // 跟单人（可为员工/茶人/带货人）
  const [followerId, setFollowerId] = useState('');
  const [followerType, setFollowerType] = useState<PersonRoleType | ''>('');
  // 带货人（独立字段）
  const [streamerId, setStreamerId] = useState('');

  // 构建客户选项列表（所有客户 + 平台客户）
  const allCustomerOptions = useMemo(() => {
    const customers = customerItems.map(c => ({ id: c.id, name: c.shortName || c.name, type: c.type }));
    const platforms = platformItems.map(p => ({ id: p.id, name: p.shortName || p.name, type: 'platform' as const }));
    return [...customers, ...platforms];
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return allCustomerOptions;
    return allCustomerOptions.filter(c => c.name.includes(customerSearch));
  }, [customerSearch, allCustomerOptions]);

  const handleSelectCustomer = (selectedId: string) => {
    if (selectedId === 'new') {
      setIsNewCustomer(true);
      setCustomerId('');
      setCustomerType('');
      setNewCustomerShortName('');
    } else {
      setIsNewCustomer(false);
      setCustomerId(selectedId);
      const selected = allCustomerOptions.find(c => c.id === selectedId);
      if (selected) {
        setCustomerType(selected.type);
      }
    }
    setShowCustomerDropdown(false);
    setCustomerSearch('');
  };

  // 清除客户选择
  const handleClearCustomer = () => {
    setCustomerId('');
    setIsNewCustomer(false);
    setCustomerType('');
    setNewCustomerShortName('');
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  // 获取选中客户的详细信息（拓客人、联系人、电话、等级）
  const selectedCustomerInfo = useMemo(() => {
    if (!customerId || isNewCustomer) return null;
    const customer = customerItems.find(c => c.id === customerId);
    if (customer) {
      const developerName = customer.developerId
        ? getPersonName(customer.developerId, customer.developerType)
        : undefined;
      return { hostName: developerName ?? '—', contactPerson: customer.contactPerson || '—', contactPhone: customer.contactPhone || '—', level: customer.level || '—' };
    }
    const platform = platformItems.find(p => p.id === customerId);
    if (platform) {
      const developerName = platform.developerId
        ? getPersonName(platform.developerId, platform.developerType)
        : undefined;
      return { hostName: developerName ?? '—', contactPerson: platform.contactPerson || '—', contactPhone: platform.contactPhone || '—', level: '—' };
    }
    return null;
  }, [customerId, isNewCustomer]);

  const selectedCustomer = useMemo(() => customerItems.find(c => c.id === customerId) || null, [customerId]);
  const isDirectCustomer = selectedCustomer?.type === 'direct';
  const orderContactOptions = selectedCustomer?.orderContacts || [];

  const selectedProduct = teaProducts.find(p => p.id === productId);
  const marketPrice = selectedProduct?.marketPrice ?? 0;
  const hasCustomer = !!(customerId || isNewCustomer);
  const defaultResult = productId && hasCustomer
    ? (customerId ? getSalesDefaultPrice(productId, customerId) : { price: selectedProduct?.salesPrice || marketPrice, source: 'sales' as const })
    : null;
  const defaultPrice = defaultResult?.price ?? 0;
  const priceSource = defaultResult?.source ?? 'market';

  // 商品或客户变化时，销售实价自动带出默认价（VIP价 > 销售价 > 市场价）
  useEffect(() => {
    if (productId && hasCustomer) {
      if (customerId) {
        const { price } = getSalesDefaultPrice(productId, customerId);
        setActualSalesPrice(String(price));
      } else {
        setActualSalesPrice(String(selectedProduct?.salesPrice || marketPrice));
      }
    } else {
      setActualSalesPrice('');
    }
  }, [productId, customerId, isNewCustomer]);

  useEffect(() => {
    setContactSelect('');
    if (isDirectCustomer && orderContactOptions.length === 1) {
      const only = orderContactOptions[0];
      setContactSelect(only.id);
      setContactPerson(only.name);
      setContactPhone(only.phone || '');
      setDeliveryAddress(only.address || '');
    }
  }, [customerId]);

  const handleContactSelectChange = (id: string) => {
    setContactSelect(id);
    if (id === 'new') {
      setContactPerson('');
      setContactPhone('');
      setDeliveryAddress('');
    } else {
      const contact = orderContactOptions.find(c => c.id === id);
      if (contact) {
        setContactPerson(contact.name);
        setContactPhone(contact.phone || '');
        setDeliveryAddress(contact.address || '');
      }
    }
  };

  const qtyNum = Number(quantity) || 0;
  const actualNum = Number(actualSalesPrice) || 0;
  const amountNum = qtyNum * actualNum;

  // 个人客户最低销售价校验：销售实价不得低于该客户等级对应的最低销售价
  const personalMinPrice = useMemo(() => {
    if (!isNewCustomer && customerId && selectedCustomer?.type === 'personal' && productId) {
      return getPersonalMinPrice(productId, selectedCustomer.level || 'C级');
    }
    return 0;
  }, [isNewCustomer, customerId, selectedCustomer, productId]);
  const isBelowMinPrice = personalMinPrice > 0 && actualNum < personalMinPrice;

  const canSave = (isNewCustomer ? (!!customerType && !!newCustomerShortName.trim()) : !!customerId) && !!productId && qtyNum > 0 && actualNum > 0 && !!orderDate && !isBelowMinPrice;

  // 根据客户类型获取销售场景
  const getScenarioByType = (type: CustomerType): number => {
    const map: Record<CustomerType, number> = { direct: 1, channel: 3, personal: 4, platform: 5, guest: 6 };
    return map[type];
  };

  const handleSave = () => {
    if (!canSave || !selectedProduct) return;
    if (isNewCustomer && !customerType) return;
    const now = new Date();
    const timeStr = `${orderDate} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const customerName = isNewCustomer
      ? newCustomerShortName.trim()
      : (allCustomerOptions.find(c => c.id === customerId)?.name ?? '新客户');
    const followerName = followerId && followerType ? getPersonName(followerId, followerType) : undefined;
    const streamerName = streamerId ? streamers.find(s => s.id === streamerId)?.name : undefined;

    // 新客户联动添加到客户管理列表
    let orderHostId: string | undefined;
    let orderHostType: PersonRoleType | undefined;
    let orderHostName: string | undefined;
    if (isNewCustomer) {
      const newCustId = `c_${Date.now()}`;
      const newCustomer: CustomerItem = {
        id: newCustId,
        name: newCustomerShortName.trim(),
        shortName: newCustomerShortName.trim(),
        customerCode: generateCustomerCode(customerType as CustomerType, newCustomerShortName.trim(), customerItems.length + 1),
        type: customerType as CustomerType,
        region: '', province: '', city: '', district: '',
        contactPerson: contactPerson || '', contactPhone: contactPhone || '', contactEmail: '', contactAddress: deliveryAddress || '',
        level: 'B级', orders: 1, totalAmount: amountNum, platformIds: [],
        cooperationDate: orderDate, status: 'active',
        settlementMethod: '月结', taxNo: '', source: '线上咨询', remark: '由销售订单新增',
        bankAccounts: [], invoiceInfos: [],
      };
      customerItems.push(newCustomer);
    } else {
      // 已有客户：从客户档案获取拓客人信息
      const customer = customerItems.find(c => c.id === customerId);
      if (customer) {
        orderHostId = customer.developerId;
        orderHostType = customer.developerType;
        orderHostName = customer.developerId
          ? getPersonName(customer.developerId, customer.developerType)
          : undefined;

        if (isDirectCustomer && contactPerson && !orderContactOptions.find(c => c.name === contactPerson)) {
          const newContact = {
            id: generateOrderContactId(customer.id, (customer.orderContacts?.length || 0) + 1),
            name: contactPerson,
            phone: contactPhone || undefined,
            address: deliveryAddress || undefined,
            remark: '由销售订单自动添加',
            autoCreated: true,
          };
          if (!customer.orderContacts) customer.orderContacts = [];
          customer.orderContacts.push(newContact);
        }
      } else {
        const platform = platformItems.find(p => p.id === customerId);
        if (platform) {
          orderHostId = platform.developerId;
          orderHostType = platform.developerType;
          orderHostName = platform.developerId
            ? getPersonName(platform.developerId, platform.developerType)
            : undefined;
        }
      }
    }

    const order: SalesOrderRecord = {
      id: `so_${Date.now()}`,
      code: `SO-2025-${String(nextNumber).padStart(4, '0')}`,
      customer: customerName,
      customerType: customerType as CustomerType,
      product: selectedProduct.name,
      teaCategory: categoryToTeaCategory(selectedProduct.category),
      quantity: `${qtyNum} ${selectedProduct.packageUnit}`,
      unitPrice: `¥${actualNum}/${selectedProduct.packageUnit}`,
      amount: formatMoney(amountNum),
      date: orderDate,
      status: OrderStatus.PENDING,
      contactPerson: contactPerson || '—',
      contactPhone: contactPhone || '—',
      deliveryAddress: deliveryAddress || '—',
      remark,
      followerId: followerId || undefined,
      followerType: followerType || undefined,
      followerName,
      streamerId: streamerId || undefined,
      streamerName,
      developerId: orderHostId,
      developerType: orderHostType,
      developerName: orderHostName,
      scenario: getScenarioByType(customerType as CustomerType),
      products: [{
        productId: selectedProduct.id,
        name: `${selectedProduct.name} — ${selectedProduct.grade}`,
        teaCategory: categoryToTeaCategory(selectedProduct.category),
        quantity: `${qtyNum} ${selectedProduct.packageUnit}`,
        marketPrice,
        defaultPrice,
        actualSalesPrice: actualNum,
        priceSource,
        amount: formatMoney(amountNum),
      }],
      timeline: [{ time: timeStr, event: '客户下单', operator: '系统' }],
    };
    onSave(order);
  };

  // 只读价格展示框样式
  const readOnlyPriceStyle: React.CSSProperties = {
    height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)',
    border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
  };

  // 只读文本框样式（客户类型反显）
  const readOnlyFieldStyle: React.CSSProperties = {
    height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)',
    border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
  };

  return (
    <div className="drawer-overlay" onClick={onCancel}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">新建销售单</span>
          <button className="drawer-close" onClick={onCancel}>
            <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="drawer-body">
          {/* 客户与商品 */}
          <div className="drawer-section-title">客户与商品</div>
          <div className="drawer-form-row">
            <div className="drawer-form-field" style={{ flex: 2 }}>
              <label className="drawer-label">选择客户 *</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="filter-input"
                  style={{ width: '100%', paddingRight: 28 }}
                  value={isNewCustomer ? '新客户' : (allCustomerOptions.find(c => c.id === customerId)?.name || customerSearch)}
                  onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); if (e.target.value === '') { setCustomerId(''); setIsNewCustomer(false); } }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="搜索或选择客户"
                />
                {(customerId || isNewCustomer || customerSearch) && (
                  <button type="button" onClick={handleClearCustomer} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-neutral-400)', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                )}
                {showCustomerDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: 240, overflowY: 'auto', background: '#fff', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: 500, color: '#0F64B5', borderBottom: '1px solid var(--color-border-secondary)' }} onClick={() => handleSelectCustomer('new')}>+ 新客户</div>
                    {filteredCustomers.map(c => (
                      <div key={c.id} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onClick={() => handleSelectCustomer(c.id)}>
                        <span>{c.name}</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{GLOBAL_CUSTOMER_LABELS[c.type]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {isNewCustomer && (
              <div className="drawer-form-field">
                <label className="drawer-label">客户类型 *</label>
                <select className="filter-select" style={{ width: '100%' }} value={customerType} onChange={(e) => setCustomerType(e.target.value as CustomerType)}>
                  <option value="">请选择客户类型</option>
                  {CUSTOMER_TYPE_DROPDOWN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            )}
          </div>
          {isNewCustomer && (
            <div className="drawer-form-row">
              <div className="drawer-form-field">
                <label className="drawer-label">客户简称 *</label>
                <input className="filter-input" style={{ width: '100%' }} value={newCustomerShortName} onChange={(e) => setNewCustomerShortName(e.target.value)} placeholder="请输入客户简称（将同步至客户管理）" />
              </div>
            </div>
          )}
          {selectedCustomerInfo && (
            <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', border: '1px solid var(--color-module-current-light)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              <div><span style={{ color: 'var(--color-text-tertiary)' }}>拓客人：</span><span style={{ fontWeight: 'var(--font-medium)' }}>{selectedCustomerInfo.hostName}</span></div>
              <div><span style={{ color: 'var(--color-text-tertiary)' }}>联系人：</span>{selectedCustomerInfo.contactPerson}</div>
              <div><span style={{ color: 'var(--color-text-tertiary)' }}>联系电话：</span>{selectedCustomerInfo.contactPhone}</div>
              <div><span style={{ color: 'var(--color-text-tertiary)' }}>等级：</span>{selectedCustomerInfo.level}</div>
            </div>
          )}

          {isDirectCustomer && (
            <div className="drawer-form-row">
              <div className="drawer-form-field">
                <label className="drawer-label">下单人</label>
                <select className="filter-select" style={{ width: '100%' }} value={contactSelect} onChange={(e) => handleContactSelectChange(e.target.value)}>
                  <option value="">请选择下单人</option>
                  {orderContactOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.department ? `(${c.department})` : ''}</option>
                  ))}
                  <option value="new">+ 新增收件人</option>
                </select>
              </div>
            </div>
          )}
          <div className="drawer-form-row">
            <div className="drawer-form-field">
              <label className="drawer-label">商品 *</label>
              <select className="filter-select" style={{ width: '100%' }} value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">请选择商品</option>
                {teaProducts.map((p) => <option key={p.id} value={p.id}>{p.name}（{p.brand}）</option>)}
              </select>
            </div>
          </div>
          {selectedProduct && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>
              规格：{selectedProduct.spec} · 品牌：{selectedProduct.brand} · 包装单位：{selectedProduct.packageUnit}
            </div>
          )}

          {/* 价格信息 */}
          <div className="drawer-section-title">价格信息</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div>
              <label className="drawer-label">市场价</label>
              <div style={readOnlyPriceStyle} className="mono">{marketPrice ? formatMoney(marketPrice) : '—'}</div>
            </div>
            <div>
              <label className="drawer-label">默认价（带来源）</label>
              <div style={{ ...readOnlyPriceStyle, gap: 'var(--space-2)' }}>
                <span className="mono">{defaultPrice ? formatMoney(defaultPrice) : '—'}</span>
                {defaultPrice > 0 && (
                  <span style={{
                    padding: '0 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                    background: 'var(--color-neutral-0)', color: SOURCE_COLORS[priceSource], border: `1px solid ${SOURCE_COLORS[priceSource]}30`,
                  }}>{SOURCE_LABELS[priceSource]}</span>
                )}
              </div>
            </div>
            <div>
              <label className="drawer-label">销售实价（可调整）*</label>
              <input
                type="number"
                className="filter-input"
                style={{
                  width: '100%', height: 34,
                  borderColor: isBelowMinPrice ? '#CB405D' : 'var(--color-module-current-base)',
                  background: 'var(--color-module-current-lightest)',
                  fontWeight: 'var(--font-semibold)',
                  color: isBelowMinPrice ? '#CB405D' : 'var(--color-module-current-base)',
                }}
                value={actualSalesPrice}
                onChange={(e) => setActualSalesPrice(e.target.value)}
                placeholder="0"
                disabled={!productId || !hasCustomer}
              />
              {personalMinPrice > 0 && (
                <div style={{ fontSize: 'var(--text-xs)', marginTop: 4, color: isBelowMinPrice ? '#CB405D' : 'var(--color-text-tertiary)' }}>
                  {isBelowMinPrice
                    ? `⚠ 销售实价不得低于该客户等级（${selectedCustomer?.level}）最低销售价 ${formatMoney(personalMinPrice)}`
                    : `该客户等级（${selectedCustomer?.level}）最低销售价：${formatMoney(personalMinPrice)}`}
                </div>
              )}
            </div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field">
              <label className="drawer-label">数量 *</label>
              <input
                type="number"
                className="filter-input"
                style={{ width: '100%' }}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="请输入数量"
              />
            </div>
            <div className="drawer-form-field">
              <label className="drawer-label">金额（自动计算）</label>
              <div
                className="mono"
                style={{
                  height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)',
                  border: '1px solid var(--color-module-current-base)', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-module-current-lightest)', fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-bold)', color: 'var(--color-module-current-base)',
                }}
              >
                {amountNum > 0 ? formatMoney(amountNum) : '—'}
              </div>
            </div>
          </div>

          {/* 订单信息 */}
          <div className="drawer-section-title">订单信息</div>
          <div className="drawer-form-row">
            <div className="drawer-form-field">
              <label className="drawer-label">下单日期 *</label>
              <input type="date" className="filter-input" style={{ width: '100%' }} value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </div>
            <div className="drawer-form-field">
              <label className="drawer-label">联系人</label>
              <input className="filter-input" style={{ width: '100%' }} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="请输入联系人" />
            </div>
          </div>
          {/* 跟单人 + 带货人 */}
          <div className="drawer-form-row">
            <div className="drawer-form-field">
              <label className="drawer-label">跟单人</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <select className="filter-select" style={{ width: 120 }} value={followerType} onChange={(e) => { setFollowerType(e.target.value as PersonRoleType | ''); setFollowerId(''); }}>
                  <option value="">请选择</option>
                  {Object.entries(PERSON_TYPE_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
                {followerType ? (
                  <select className="filter-select" style={{ flex: 1 }} value={followerId} onChange={(e) => setFollowerId(e.target.value)}>
                    <option value="">请选择</option>
                    {getAllPersonOptions().filter(p => p.type === followerType).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>请先选择类型</div>
                )}
              </div>
            </div>
            <div className="drawer-form-field">
              <label className="drawer-label">带货人</label>
              <select className="filter-select" style={{ width: '100%' }} value={streamerId} onChange={(e) => setStreamerId(e.target.value)}>
                <option value="">请选择带货人</option>
                {streamers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field">
              <label className="drawer-label">联系电话</label>
              <input className="filter-input" style={{ width: '100%' }} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="请输入联系电话" />
            </div>
            <div className="drawer-form-field">
              <label className="drawer-label">收货地址</label>
              <input className="filter-input" style={{ width: '100%' }} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="请输入收货地址" />
            </div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field" style={{ flex: 1 }}>
              <label className="drawer-label">备注</label>
              <input className="filter-input" style={{ width: '100%' }} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="选填" />
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <Button variant="ghost" onClick={onCancel}>取消</Button>
          <Button onClick={handleSave} disabled={!canSave}>确认下单</Button>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
