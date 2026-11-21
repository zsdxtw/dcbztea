import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HScrollBox from '../../components/common/HScrollBox';
import DetailDrawer, { DrawerSection } from '../../components/common/DetailDrawer';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { usePriceStore } from '../../stores/priceStore';
import { customerItems } from '../../data/customers';
import { PROVINCE_NAMES, getCityNames, getDistricts, regionTextOf } from '../../data/regions';
import { EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS, EXTERNAL_STATUS_LABELS, EXTERNAL_STATUS_COLORS, TRANSFER_SOURCE_LABELS, platformLabelOf } from '../../data/externalOrders';
import {
  buildFamilies, familyStatesOf, fulfillStateOf, settleStateOf, invoiceStateOf, FAMILY_STATE_COLORS, fulfillmentUnitsOf,
} from '../../utils/salesOrderFamily';
import type { ExternalOrder } from '../../types';
import { SalesOrderDetailTabs } from './SalesOrderDetail';

const money = (n: number) => `¥${n.toLocaleString()}`;
/** 列表展示日期；详情页用 fmtDateTime 展示日期+时分秒（演示数据不足 10 位时补齐演示时分秒） */
const fmtDate = (v?: string) => (v ?? '').slice(0, 10);
const fmtDateTime = (v?: string) => (!v ? '—' : v.length > 10 ? v : `${v} 09:12:00`);

const pill = (text: string) => {
  const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[text] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{text}</span>
  );
};

/** 单笔分发状态药丸（分发状态 7 态文案 + 配色） */
const orderDistributePill = (o: ExternalOrder) => {
  const key = EXTERNAL_STATUS_LABELS[o.processStatus] ?? o.processStatus;
  const c = { bg: EXTERNAL_STATUS_COLORS[o.processStatus]?.bg ?? '#F5F5F5', color: EXTERNAL_STATUS_COLORS[o.processStatus]?.color ?? '#9E9E9E' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{key}</span>
  );
};

/** 路径标签（与销售单分发页口径一致） */
function pathLabel(o: ExternalOrder): string {
  if (o.processStatus === 'report_match_pending') return '转派-报备';
  if (o.path === 'self') return '自营';
  if (o.transferSource) return TRANSFER_SOURCE_LABELS[o.transferSource];
  if (o.distributeMode === 'compare') return '转派-比单';
  return '—';
}

/** 地区展示：省 / 市 / 区（共享助手，见 data/regions.regionTextOf） */
function regionText(o: ExternalOrder): string {
  return regionTextOf(o.customerRegion, o.receiverAddress);
}

/**
 * 销售 · 销售单管理
 * 全部销售单总览：以母销售单（手工录入 / 直连推送）为一行，点击展开该母销售单下全部子履约单；
 * 母销售单行含三状态（分发 / 发货 / 结算），「查看」进入销售单履约详情页。分发订单 Tab 保留自营接单与履约跟踪。
 */
export default function SalesOrders() {
  const navigate = useNavigate();

  /* ── 全部销售单（母单聚合） ── */
  const flowOrders = useOrderFlowStore((s) => s.orders);
  const [keyword, setKeyword] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterPath, setFilterPath] = useState('');
  const [filterDistribute, setFilterDistribute] = useState('');
  const [filterFulfill, setFilterFulfill] = useState('');
  const [filterSettle, setFilterSettle] = useState('');
  const [filterInvoice, setFilterInvoice] = useState('');
  /* 新增筛选项:草稿态(输入)→ 点「查询」应用 */
  const [draftCustomer, setDraftCustomer] = useState('');
  const [draftReceiver, setDraftReceiver] = useState('');
  const [draftProv, setDraftProv] = useState('');
  const [draftCity, setDraftCity] = useState('');
  const [draftDist, setDraftDist] = useState('');
  const [draftEntryFrom, setDraftEntryFrom] = useState('');
  const [draftEntryTo, setDraftEntryTo] = useState('');
  const [draftOrderFrom, setDraftOrderFrom] = useState('');
  const [draftOrderTo, setDraftOrderTo] = useState('');
  const [applied, setApplied] = useState({
    customer: '', receiver: '', prov: '', city: '', dist: '', entryFrom: '', entryTo: '', orderFrom: '', orderTo: '',
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [view, setView] = useState<{ root: string; child?: string; edit?: boolean } | null>(null);
  /** 销售单信息修改（手工录入订单）：客户侧订单号/下单时间任意状态可改；收货信息/商品明细未分发前可改 */
  const [orderEdit, setOrderEdit] = useState<{
    customerOrderNo: string; customerOrderTime: string;
    receiver: string; receiverPhone: string; receiverAddress: string; remark: string;
    items: ExternalOrder['items'];
  } | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const families = useMemo(() => buildFamilies(flowOrders), [flowOrders]);

  const filteredFamilies = useMemo(() => families.filter((f) => {
    const kw = keyword.trim();
    if (kw && ![f.mother, ...f.children].some((o) =>
      o.code.includes(kw) || (o.parentCode ?? '').includes(kw) || o.customerName.includes(kw) || (o.externalOrderNo ?? '').includes(kw)
      || o.items.some((it) => it.productName.includes(kw)) || o.receiver.includes(kw) || o.receiverAddress.includes(kw),
    )) return false;
    if (filterChannel && f.mother.sourceChannel !== filterChannel) return false;
    if (filterPath && (f.mother.salesPath ?? 'direct') !== filterPath) return false;
    const st = familyStatesOf(f);
    if (filterDistribute && st.distribute !== filterDistribute) return false;
    if (filterFulfill && st.fulfill !== filterFulfill) return false;
    if (filterSettle && st.settle !== filterSettle) return false;
    if (filterInvoice && st.invoice !== filterInvoice) return false;
    // 新增筛选项(查询按钮应用)
    const a = applied;
    if (a.customer && f.mother.customerName !== a.customer) return false;
    if (a.receiver && ![f.mother, ...f.children].some((o) => (o.receiver ?? '').includes(a.receiver))) return false;
    if (a.prov || a.city || a.dist) {
      const addr = f.mother.receiverAddress ?? '';
      if (a.prov && !addr.includes(a.prov)) return false;
      if (a.city && !addr.includes(a.city)) return false;
      if (a.dist && !addr.includes(a.dist)) return false;
    }
    if (a.entryFrom && f.mother.entryTime.slice(0, 10) < a.entryFrom) return false;
    if (a.entryTo && f.mother.entryTime.slice(0, 10) > a.entryTo) return false;
    if (a.orderFrom || a.orderTo) {
      const t = (f.mother.customerOrderTime ?? '').slice(0, 10);
      if (!t) return false;
      if (a.orderFrom && t < a.orderFrom) return false;
      if (a.orderTo && t > a.orderTo) return false;
    }
    return true;
  }), [families, keyword, filterChannel, filterPath, filterDistribute, filterFulfill, filterSettle, filterInvoice, applied]);

  const totalPages = Math.max(1, Math.ceil(filteredFamilies.length / pageSize));
  const pagedFamilies = filteredFamilies.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [keyword, filterChannel, filterPath, filterDistribute, filterFulfill, filterSettle, filterInvoice, applied, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const applyFilters = () => {
    setApplied({
      customer: draftCustomer.trim(), receiver: draftReceiver.trim(),
      prov: draftProv, city: draftCity, dist: draftDist,
      entryFrom: draftEntryFrom, entryTo: draftEntryTo, orderFrom: draftOrderFrom, orderTo: draftOrderTo,
    });
    setPage(1);
  };
  const resetFilters = () => {
    setDraftCustomer(''); setDraftReceiver('');
    setDraftProv(''); setDraftCity(''); setDraftDist('');
    setDraftEntryFrom(''); setDraftEntryTo(''); setDraftOrderFrom(''); setDraftOrderTo('');
    setApplied({ customer: '', receiver: '', prov: '', city: '', dist: '', entryFrom: '', entryTo: '', orderFrom: '', orderTo: '' });
    setPage(1);
  };

  const startOrderEdit = (m: ExternalOrder) => setOrderEdit({
    customerOrderNo: m.customerOrderNo ?? '',
    customerOrderTime: (m.customerOrderTime ?? '').slice(0, 10),
    receiver: m.receiver,
    receiverPhone: m.receiverPhone,
    receiverAddress: m.receiverAddress,
    remark: m.remark ?? '',
    items: m.items.map((it) => ({ ...it })),
  });
  const saveOrderEdit = () => {
    if (!view?.root || !orderEdit) return;
    const fam = families.find((f) => f.rootCode === view.root);
    if (!fam) return;
    const patch: Partial<ExternalOrder> = {
      customerOrderNo: orderEdit.customerOrderNo || undefined,
      customerOrderTime: orderEdit.customerOrderTime || undefined,
    };
    const coreEditable = (fam.mother.processStatus === 'pending' || fam.mother.processStatus === 'report_match_pending') && fam.children.length === 0;
    if (coreEditable) {
      patch.receiver = orderEdit.receiver;
      patch.receiverPhone = orderEdit.receiverPhone;
      patch.receiverAddress = orderEdit.receiverAddress;
      patch.remark = orderEdit.remark || undefined;
      patch.items = orderEdit.items;
    }
    const res = useOrderFlowStore.getState().updateOrder(fam.mother.id, patch);
    if (res.ok) {
      setOrderEdit(null);
      setView((v) => (v ? { root: v.root, child: v.child } : v));
    } else {
      window.alert(res.msg);
    }
  };

  const toggleExpand = (rootCode: string) => setExpanded((prev) => {
    const n = new Set(prev);
    if (n.has(rootCode)) n.delete(rootCode); else n.add(rootCode);
    return n;
  });

  const poDocs = usePurchaseStore((st) => st.docs);
  const priceProducts = usePriceStore((st) => st.products);

  
  /* 列表网格列定义（母单行 + 表头共用，保证对齐） */
  const GRID = '34px 24px 168px 104px 96px 130px 140px 104px 88px 112px 100px 100px 100px 96px 64px';

  const pageBtn = (n: number) => (
    <button
      key={n}
      onClick={() => setPage(n)}
      style={{
        minWidth: 28, height: 28, padding: '0 6px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        border: `1px solid ${page === n ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
        background: page === n ? 'var(--color-module-current-base)' : 'var(--color-neutral-0)',
        color: page === n ? 'var(--color-neutral-0)' : 'var(--color-neutral-600)',
        fontSize: 'var(--text-sm)', fontWeight: 500, fontFamily: 'var(--font-family-mono)',
      }}
    >
      {n}
    </button>
  );

  return (
    <>
      <ContentHeader
        title="销售单列表"
        breadcrumbs={['销售', '销售单管理', '销售单列表']}
      />
      <div className="content-body">
        {/* ── 母销售单一行 + 展开子履约单 ── */}
        <>          <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
            展示<strong>全部母销售单</strong>：以<strong>手工录入</strong>或<strong>直连推送</strong>的母销售单（SO）为一行（分发/履约/结算/开票四状态为该母销售单含全部子履约单的聚合），点击母销售单行展开其下全部子履约单（FO）；未拆分的母销售单即履约单；点击「查看」进入销售单履约详情页。
            逐单分发操作请前往「<strong>销售单管理 → 销售单分发</strong>」；履约进度跟踪见「销售单履约」。
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span className="so-f-label">关键词：</span>
            <input className="filter-input" placeholder="搜索原始/履约销售单号、客户、平台单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 260 }} />
            <span className="so-f-label">订单来源：</span>
            <select className="filter-select" value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>
              <option value="">全部来源</option>
              <option value="manual">手工录入</option>
              <option value="push">直连推送</option>
            </select>
            <span className="so-f-label">销售路径：</span>
            <select className="filter-select" value={filterPath} onChange={(e) => setFilterPath(e.target.value)}>
              <option value="">全部路径</option>
              <option value="direct">直接销售</option>
              <option value="via_platform">经平台销售</option>
            </select>
            <span className="so-f-label">分发状态：</span>
            <select className="filter-select" value={filterDistribute} onChange={(e) => setFilterDistribute(e.target.value)}>
              <option value="">全部分发状态</option>
              <option value="未分发">未分发</option>
              <option value="分发中">分发中</option>
              <option value="部分已完成">部分已完成</option>
              <option value="全部已完成">全部已完成</option>
              <option value="已取消">已取消</option>
            </select>
            <span className="so-f-label">履约状态：</span>
            <select className="filter-select" value={filterFulfill} onChange={(e) => setFilterFulfill(e.target.value)}>
              <option value="">全部履约状态</option>
              <option value="未履约">未履约</option>
              <option value="履约中">履约中</option>
              <option value="部分已完成">部分已完成</option>
              <option value="全部已完成">全部已完成</option>
              <option value="已取消">已取消</option>
            </select>
            <span className="so-f-label">结算状态：</span>
            <select className="filter-select" value={filterSettle} onChange={(e) => setFilterSettle(e.target.value)}>
              <option value="">全部结算状态</option>
              <option value="未结算">未结算</option>
              <option value="结算中">结算中</option>
              <option value="部分已完成">部分已完成</option>
              <option value="全部已完成">全部已完成</option>
            </select>
            <span className="so-f-label">开票状态：</span>
            <select className="filter-select" value={filterInvoice} onChange={(e) => setFilterInvoice(e.target.value)}>
              <option value="">全部开票状态</option>
              <option value="未开票">未开票</option>
              <option value="开票中">开票中</option>
              <option value="部分已完成">部分已完成</option>
              <option value="全部已完成">全部已完成</option>
            </select>

            {/* 客户:下拉选择 + 输入自动匹配 */}
            <span className="so-f-label">客户：</span>
            <input
              className="filter-input" list="so-customer-list" placeholder="全部客户（可输入匹配）"
              value={draftCustomer} onChange={(e) => setDraftCustomer(e.target.value)} style={{ width: 170 }}
            />
            <datalist id="so-customer-list">
              {[...new Set(customerItems.map((c) => c.name))].map((n) => <option key={n} value={n} />)}
            </datalist>

            {/* 收件人 */}
            <span className="so-f-label">收货人：</span>
            <input className="filter-input" placeholder="全部收货人" value={draftReceiver} onChange={(e) => setDraftReceiver(e.target.value)} style={{ width: 110 }} />

            {/* 收件地区:省 / 市 / 县 */}
            <span className="so-f-label">收件地区：</span>
            <select className="filter-select" value={draftProv} onChange={(e) => { setDraftProv(e.target.value); setDraftCity(''); setDraftDist(''); }} style={{ width: 96 }}>
              <option value="">省份</option>
              {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="filter-select" disabled={!draftProv} value={draftCity} onChange={(e) => { setDraftCity(e.target.value); setDraftDist(''); }} style={{ width: 100 }}>
              <option value="">地市</option>
              {draftProv && getCityNames(draftProv).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="filter-select" disabled={!draftCity} value={draftDist} onChange={(e) => setDraftDist(e.target.value)} style={{ width: 100 }}>
              <option value="">区县</option>
              {draftProv && draftCity && getDistricts(draftProv, draftCity).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* 录入日期区间 */}
            <span className="so-f-label">录入日期：</span>
            <input className="filter-input" type="date" title="录入日期从" value={draftEntryFrom} onChange={(e) => setDraftEntryFrom(e.target.value)} style={{ width: 138 }} />
            <span style={{ color: 'var(--color-neutral-300)', flexShrink: 0 }}>~</span>
            <input className="filter-input" type="date" title="录入日期至" value={draftEntryTo} onChange={(e) => setDraftEntryTo(e.target.value)} style={{ width: 138 }} />

            {/* 客户下单日期区间 */}
            <span className="so-f-label">客户下单日期：</span>
            <input className="filter-input" type="date" title="客户下单日期从" value={draftOrderFrom} onChange={(e) => setDraftOrderFrom(e.target.value)} style={{ width: 138 }} />
            <span style={{ color: 'var(--color-neutral-300)', flexShrink: 0 }}>~</span>
            <input className="filter-input" type="date" title="客户下单日期至" value={draftOrderTo} onChange={(e) => setDraftOrderTo(e.target.value)} style={{ width: 138 }} />

            {/* 查询 / 重置 */}
            <Button size="sm" onClick={applyFilters}>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13, marginRight: 4 }}><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              查询
            </Button>
            <Button size="sm" variant="ghost" onClick={resetFilters}>重置</Button>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
              <Button onClick={() => navigate('/sales/order-entry')}>+ 新建销售单</Button>
            </span>
          </div>

          <Card style={{ padding: 0 }}>
            <HScrollBox>
              <div style={{ minWidth: 1690 }}>
                {/* 表头 */}
                <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', margin: 'var(--space-2) var(--space-3) 0', border: '1px solid var(--color-neutral-150)', borderRadius: 10, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-500)', background: 'var(--color-neutral-50)' }}>
                  <span>序号</span>
                  <span />
                  <span>销售单号</span>
                  <span>订单来源</span>
                  <span>销售路径</span>
                  <span>客户</span>
                  <span>收货人 / 地区</span>
                  <span style={{ textAlign: 'right' }}>总金额</span>
                  <span style={{ textAlign: 'center' }}>履约单数</span>
                  <span>分发状态</span>
                  <span>履约状态</span>
                  <span>结算状态</span>
                  <span>开票状态</span>
                  <span>录入时间</span>
                  <span style={{ textAlign: 'center' }}>操作</span>
                </div>

                {pagedFamilies.map((f, famIdx) => {
                  const open = expanded.has(f.rootCode);
                  const st = familyStatesOf(f);
                  const amount = (f.children.length > 0 ? f.children : f.all).reduce((s, o) => s + o.totalAmount, 0);
                  return (
                    <div key={f.rootCode} style={{ margin: 'var(--space-2) var(--space-3)', background: 'var(--color-neutral-0)', border: `1px solid ${open ? 'var(--color-module-current-light)' : 'var(--color-neutral-150)'}`, borderRadius: 10, overflow: 'hidden', boxShadow: open ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>
                      {/* 母销售单行（点击整行展开/收起履约单） */}
                      <div
                        style={{ display: 'grid', gridTemplateColumns: GRID, gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', background: open ? 'var(--color-neutral-50)' : 'transparent' }}
                        onClick={() => toggleExpand(f.rootCode)}
                      >
                        <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{(page - 1) * pageSize + famIdx + 1}</span>
                        <svg viewBox="0 0 16 16" fill="none" style={{ width: 12, height: 12, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s', color: 'var(--color-neutral-400)' }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="cell-mono-emph">{f.rootCode}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{f.mother.externalOrderNo}</span></span>
                        {/* 来源：直接销售=淡茶半盏 / 经平台销售=该平台（平台客户） */}
                        <span style={{ fontSize: 'var(--text-sm)' }}>
                          {f.mother.salesPath === 'via_platform'
                            ? (f.mother.platformCustomerName ?? (f.mother.platform ? EXTERNAL_PLATFORM_LABELS[f.mother.platform] : '经平台销售'))
                            : '淡茶半盏'}
                          <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: f.mother.sourceChannel === 'push' ? '#7B1FA2' : '#0F64B5' }}>{EXTERNAL_CHANNEL_LABELS[f.mother.sourceChannel]}</span>
                        </span>
                        <span>
                          {f.mother.salesPath === 'via_platform'
                            ? <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#E3F2FD', color: '#0F64B5', whiteSpace: 'nowrap' }}>经平台销售</span>
                            : <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#E8F5E9', color: '#2E7D32', whiteSpace: 'nowrap' }}>直接销售</span>}
                        </span>
                        <span className="cell-emph">{f.mother.customerName}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{f.mother.customerType}</span></span>
                        <span style={{ minWidth: 0 }}>
                          <span className="cell-emph" style={{ fontSize: 'var(--text-sm)', display: 'block' }}>{f.mother.receiver}</span>
                          <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', whiteSpace: 'nowrap' }}>{regionText(f.mother)}</span>
                        </span>
                        <span className="mono" style={{ fontWeight: 'var(--font-semibold)', textAlign: 'right' }}>{money(amount)}</span>
                        <span style={{ textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#E3F2FD', color: '#0F64B5', whiteSpace: 'nowrap' }}>{st.total} 单</span>
                        </span>
                        <span key="dg" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {pill(st.distribute)}
                          {st.active > 0 && <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{st.distributed}/{st.active}</span>}
                        </span>
                        <span key="fu" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {pill(st.fulfill)}
                          {st.active > 0 && <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{st.fulfilled}/{st.active}</span>}
                        </span>
                        <span key="se" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {pill(st.settle)}
                          {st.active > 0 && <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{st.settled}/{st.active}</span>}
                        </span>
                        <span key="in" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {pill(st.invoice)}
                          {st.active > 0 && <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{st.invoiced}/{st.active}</span>}
                        </span>
                        <span className="cell-muted" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{fmtDate(f.mother.entryTime)}</span>
                        <span style={{ textAlign: 'center' }}>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setView({ root: f.rootCode }); }}>查看</Button>
                          {f.mother.sourceChannel === 'manual' && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setView({ root: f.rootCode, edit: true }); startOrderEdit(f.mother); }}>修改</Button>
                          )}
                        </span>
                      </div>

                      {/* 履约单展开区：子行与母单行同列网格对齐（LY 徽标 + 迷你树形连接线 + 各列对齐母表头语义） */}
                      {open && (() => {
                        const units = fulfillmentUnitsOf(f);
                        return (
                        <div style={{ background: 'var(--color-neutral-50)' }}>
                          {/* 子单列表头（与主表头同款字样，底色与子单内容行一致） */}
                          <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-2) var(--space-4)', borderTop: '1px solid var(--color-neutral-150)', borderBottom: '1px solid var(--color-neutral-150)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-500)', background: 'var(--color-neutral-0)' }}>
                            <span /><span />
                            <span>履约单号（{units.length} 单）</span>
                            <span>分发方式</span>
                            <span style={{ gridColumn: 'span 2' }}>履约主体</span>
                            <span>物流进度</span>
                            <span>品牌数 / 总数量</span>
                            <span style={{ textAlign: 'right' }}>金额</span>
                            <span>生成时间</span>
                            <span>分发状态</span>
                            <span>履约状态</span>
                            <span>结算状态</span>
                            <span>开票状态</span>
                            <span style={{ textAlign: 'center' }}>操作</span>
                          </div>
                          {units.map((u, ui) => {
                            const pos = poDocs.filter((d) => d.childOrderId === u.underlying.id);
                            const pkgs = pos.flatMap((d) => d.packages.filter((x) => x.status !== 'void'));
                            const selfPkgs = (u.underlying.selfShipments ?? []);
                            const pkgTotal = pkgs.length + selfPkgs.length;
                            const delivered = pkgs.filter((x) => x.status === 'delivered' || x.status === 'confirmed').length
                              + selfPkgs.filter((x) => x.status === 'delivered' || x.status === 'confirmed').length;
                            const fulText = fulfillStateOf(u.underlying, pos);
                            const pendingDist = u.underlying.processStatus === 'pending';
                            /* 状态色：已确收/妥投=绿 / 履约中=琥珀 / 待分发默认履约=灰 / 已取消=红 */
                            const accent = u.underlying.processStatus === 'cancelled' ? '#C62828'
                              : ['全部已确收', '妥投'].includes(fulText) ? '#2E7D32'
                                : pendingDist && u.virtual ? '#B0B7B0' : '#E6A23C';
                            const badgeBg = accent === '#2E7D32' ? '#E8F5E9'
                              : accent === '#C62828' ? '#FFEBEE'
                                : pendingDist && u.virtual ? '#F0F2F0' : '#FFF8E9';
                            const isLast = ui === units.length - 1;
                            return (
                            <div key={u.code} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-2) var(--space-4)', borderTop: ui === 0 ? 'none' : '1px solid var(--color-neutral-150)', background: 'var(--color-neutral-0)' }}>
                              {/* LY 序号徽标（按履约状态着色） */}
                              <span style={{ width: 30, height: 24, borderRadius: 6, background: badgeBg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: accent === '#B0B7B0' ? 'var(--color-neutral-500)' : accent }}>LY{String(u.seq).padStart(2, '0')}</span>
                              </span>
                              {/* 迷你树形连接线：竖线贯通各行，横肘挂接本行（末行止于中点） */}
                              <span style={{ position: 'relative', alignSelf: 'stretch', display: 'block' }}>
                                <span style={{ position: 'absolute', left: 10, top: 0, bottom: isLast ? '50%' : 0, borderLeft: '2px solid var(--color-module-current-light)' }} />
                                <span style={{ position: 'absolute', left: 10, top: '50%', width: 9, borderTop: '2px solid var(--color-module-current-light)' }} />
                                <span style={{ position: 'absolute', left: 17, top: '50%', transform: 'translateY(-50%)', width: 7, height: 7, borderRadius: '50%', background: 'var(--color-neutral-0)', border: `2px solid ${accent === '#B0B7B0' ? 'var(--color-neutral-300)' : 'var(--color-module-current-base)'}` }} />
                              </span>
                              {/* 履约单号 */}
                              <span style={{ minWidth: 0 }}>
                                <span className="cell-mono-emph" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{u.code}</span>
                              </span>
                              {/* 分发路径 */}
                              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', whiteSpace: 'nowrap' }}>{pathLabel(u.underlying)}</span>
                              {/* 履约主体（跨 2 列，完整展示合作商全称；未分发显示待分发） */}
                              <span style={{ fontSize: 'var(--text-sm)', gridColumn: 'span 2', overflow: 'hidden', textOverflow: 'ellipsis' }} title={u.underlying.partnerName ?? ''}>
                                {u.underlying.partnerName ?? (u.underlying.path === 'self' ? '自营' : '待分发')}
                              </span>
                              {/* 物流进度 */}
                              <span style={{ minWidth: 0 }}>
                                {pkgTotal > 0 ? (
                                  <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap' }}>
                                    <span className="mono">{pkgTotal}</span> 包裹 · 妥投 <span className="mono" style={{ color: delivered === pkgTotal ? '#2E7D32' : '#9A7A1C' }}>{delivered}/{pkgTotal}</span>
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', whiteSpace: 'nowrap' }}>暂无发货包裹</span>
                                )}
                              </span>
                              {/* 品牌数 / 总数量：x=本单商品去重品牌数，y=本单商品总数量 */}
                              <span className="mono" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>
                                {new Set(u.underlying.items.map((it) => priceProducts.find((x) => x.id === it.productId)?.brand ?? priceProducts.find((x) => x.name === it.productName)?.brand ?? '—')).size}/{u.underlying.items.reduce((s, it) => s + it.quantity, 0)}
                              </span>
                              {/* 履约单金额（与母单「总金额」列对齐） */}
                              <span className="mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', textAlign: 'right' }}>{money(u.amount)}</span>
                              {/* 生成时间（列表展示日期；详情页展示日期+时分秒） */}
                              <span className="cell-muted mono" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{fmtDate(u.createdAt)}</span>
                              {/* 分发 / 发货 / 结算状态（与母表头同列对齐） */}
                              {orderDistributePill(u.underlying)}
                              {pill(fulText)}
                              {pill(settleStateOf(u.underlying, pos))}
                              {pill(invoiceStateOf(u.underlying))}
                              {/* 操作 */}
                              <span style={{ textAlign: 'center' }}>
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setView({ root: f.rootCode, child: u.underlying.code }); }}>查看</Button>
                              </span>
                            </div>
                            );
                          })}
                        </div>
                        );
                      })()}
                    </div>
                  );
                })}
                {pagedFamilies.length === 0 && (
                  <div style={{ margin: 'var(--space-2) var(--space-3)', padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', border: '1px dashed var(--color-neutral-150)', borderRadius: 10 }}>当前筛选条件下暂无销售订单</div>
                )}
              </div>
            </HScrollBox>
          </Card>

          {/* 分页 */}
          {filteredFamilies.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginRight: 'auto' }}>
                共 {filteredFamilies.length} 张母销售单 · 第 {page} / {totalPages} 页
              </span>
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => pageBtn(n))}
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
              <select className="filter-select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={10}>10 条/页</option>
                <option value={20}>20 条/页</option>
                <option value={50}>50 条/页</option>
              </select>
            </div>
          )}
        </>
      </div>

      {/* ── 销售单详情抽屉（销售单信息 / 履约单01… 分开 Tab 展示；子单进入默认定位该履约单 Tab） ── */}
      <DetailDrawer
        open={!!view}
        onClose={() => setView(null)}
        badge="SO"
        title={view?.root ?? ''}
        statusTag={(() => {
          const fam = families.find((f) => f.rootCode === view?.root);
          if (!fam) return null;
          const st = familyStatesOf(fam);
          return <>{pill(st.distribute)}{pill(st.fulfill)}{pill(st.settle)}{pill(st.invoice)}</>;
        })()}
        subtitle={(() => {
          const fam = families.find((f) => f.rootCode === view?.root);
          if (!fam) return '';
          const m = fam.mother;
          return `${platformLabelOf(m)} · ${m.customerName}（${m.customerType}） · ${m.receiver} ${m.receiverPhone}`;
        })()}
        mode="view"
        footer={(() => {
          const fam = families.find((f) => f.rootCode === view?.root);
          const manual = fam?.mother.sourceChannel === 'manual';
          if (view?.edit && orderEdit) {
            return (
              <>
                <Button variant="ghost" onClick={() => setOrderEdit(null)}>取消</Button>
                <Button onClick={saveOrderEdit}>保存修改</Button>
              </>
            );
          }
          return (
            <>
              <Button variant="ghost" onClick={() => setView(null)}>关闭</Button>
              {manual && (
                <Button onClick={() => {
                  const fam2 = families.find((f) => f.rootCode === view?.root);
                  if (fam2) startOrderEdit(fam2.mother);
                  setView((v) => (v ? { ...v, edit: true } : v));
                }}>修改</Button>
              )}
            </>
          );
        })()}
      >
        {(() => {
          const fam = families.find((f) => f.rootCode === view?.root);
          if (!fam) return null;
          const m = fam.mother;
          const coreEditable = (m.processStatus === 'pending' || m.processStatus === 'report_match_pending') && fam.children.length === 0;
          if (view?.edit && orderEdit) {
            return (
              <>
                <DrawerSection title="订单信息修改">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3) var(--space-4)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>客户侧订单号</label>
                      <input className="filter-input" style={{ width: '100%' }} value={orderEdit.customerOrderNo} onChange={(e) => setOrderEdit((f) => (f ? { ...f, customerOrderNo: e.target.value } : f))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>客户下单时间</label>
                      <input className="filter-input" type="date" style={{ width: '100%' }} value={orderEdit.customerOrderTime} onChange={(e) => setOrderEdit((f) => (f ? { ...f, customerOrderTime: e.target.value } : f))} />
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>客户侧订单号 / 客户下单时间在订单任何状态下都可修改</div>
                </DrawerSection>
                {coreEditable ? (
                  <>
                    <DrawerSection title="收货信息修改">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3) var(--space-4)' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>收货人</label>
                          <input className="filter-input" style={{ width: '100%' }} value={orderEdit.receiver} onChange={(e) => setOrderEdit((f) => (f ? { ...f, receiver: e.target.value } : f))} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>联系电话</label>
                          <input className="filter-input" style={{ width: '100%' }} value={orderEdit.receiverPhone} onChange={(e) => setOrderEdit((f) => (f ? { ...f, receiverPhone: e.target.value } : f))} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>收货地址</label>
                          <input className="filter-input" style={{ width: '100%' }} value={orderEdit.receiverAddress} onChange={(e) => setOrderEdit((f) => (f ? { ...f, receiverAddress: e.target.value } : f))} />
                        </div>
                        <div style={{ gridColumn: 'span 4' }}>
                          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>备注</label>
                          <input className="filter-input" style={{ width: '100%' }} value={orderEdit.remark} onChange={(e) => setOrderEdit((f) => (f ? { ...f, remark: e.target.value } : f))} />
                        </div>
                      </div>
                    </DrawerSection>
                    <DrawerSection title="商品明细修改">
                      <table className="detail-inline-table">
                        <thead><tr><th>商品名称</th><th>规格</th><th style={{ width: 100 }}>数量</th><th style={{ width: 120 }}>单价</th><th style={{ width: 110 }}>小计</th><th style={{ width: 70 }}>操作</th></tr></thead>
                        <tbody>
                          {orderEdit.items.map((it, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                              <td>{it.spec}</td>
                              <td><input className="filter-input mono" type="number" min={1} style={{ width: 72 }} value={it.quantity} onChange={(e) => setOrderEdit((f) => (f ? { ...f, items: f.items.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) || 0 } : x)) } : f))} /></td>
                              <td><input className="filter-input mono" type="number" min={0} style={{ width: 92 }} value={it.price} onChange={(e) => setOrderEdit((f) => (f ? { ...f, items: f.items.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) || 0 } : x)) } : f))} /></td>
                              <td className="mono">{money(it.price * it.quantity)}</td>
                              <td><Button size="sm" variant="ghost" onClick={() => setOrderEdit((f) => (f ? { ...f, items: f.items.filter((_, j) => j !== i) } : f))}>删除</Button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DrawerSection>
                  </>
                ) : (
                  <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7 }}>
                    订单已进入待接单 / 比单状态或已拆分，<strong>收货信息与商品明细不可修改</strong>；仅客户侧订单号 / 客户下单时间可修改。
                  </div>
                )}
              </>
            );
          }
          return (
            <SalesOrderDetailTabs
              key={`${fam.rootCode}-${view?.child ?? 'info'}`}
              family={fam}
              poDocs={poDocs}
              initialTab={view?.child ?? 'info'}
              showStates={false}
            />
          );
        })()}
      </DetailDrawer>
    </>
  );
}
