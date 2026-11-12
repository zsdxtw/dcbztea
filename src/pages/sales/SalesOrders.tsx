import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { customerItems } from '../../data/customers';
import { PROVINCE_NAMES, getCityNames, getDistricts, regionTextOf } from '../../data/regions';
import { EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS, EXTERNAL_STATUS_LABELS, EXTERNAL_STATUS_COLORS, TRANSFER_SOURCE_LABELS, platformLabelOf } from '../../data/externalOrders';
import { PARTNER_ORDER_STATUS_LABELS } from '../../data/partner';
import {
  buildFamilies, familyStatesOf, shipStateOf, settleStateOf, FAMILY_STATE_COLORS,
} from '../../utils/salesOrderFamily';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (text: string) => {
  const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[text] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{text}</span>
  );
};

/** 单笔状态（分发沿用状态机文案；发货/结算三态） */
const orderDistributePill = (o: ExternalOrder) => {
  const key = o.processStatus === 'completed' ? '已分发·已完成' : EXTERNAL_STATUS_LABELS[o.processStatus] ?? o.processStatus;
  const c = key === '已分发·已完成'
    ? FAMILY_STATE_COLORS['已分发·已完成']
    : { bg: EXTERNAL_STATUS_COLORS[o.processStatus]?.bg ?? '#F5F5F5', color: EXTERNAL_STATUS_COLORS[o.processStatus]?.color ?? '#9E9E9E' };
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
  const [filterDistribute, setFilterDistribute] = useState('');
  const [filterShip, setFilterShip] = useState('');
  const [filterSettle, setFilterSettle] = useState('');
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
  const [viewRoot, setViewRoot] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  /* ── Tab：全部销售单 / 分发订单 ── */
  const [tab, setTab] = useState<'all' | 'flow'>('all');
  const selfPendingCount = flowOrders.filter((o) => o.processStatus === 'self_pending').length;

  const families = useMemo(() => buildFamilies(flowOrders), [flowOrders]);

  const filteredFamilies = useMemo(() => families.filter((f) => {
    const kw = keyword.trim();
    if (kw && ![f.mother, ...f.children].some((o) =>
      o.code.includes(kw) || (o.parentCode ?? '').includes(kw) || o.customerName.includes(kw) || (o.externalOrderNo ?? '').includes(kw),
    )) return false;
    if (filterChannel && f.mother.sourceChannel !== filterChannel) return false;
    const st = familyStatesOf(f);
    if (filterDistribute && st.distribute !== filterDistribute) return false;
    if (filterShip && st.ship !== filterShip) return false;
    if (filterSettle && st.settle !== filterSettle) return false;
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
  }), [families, keyword, filterChannel, filterDistribute, filterShip, filterSettle, applied]);

  const totalPages = Math.max(1, Math.ceil(filteredFamilies.length / pageSize));
  const pagedFamilies = filteredFamilies.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [keyword, filterChannel, filterDistribute, filterShip, filterSettle, applied, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { setExpanded(new Set()); }, [tab]);

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

  const toggleExpand = (rootCode: string) => setExpanded((prev) => {
    const n = new Set(prev);
    if (n.has(rootCode)) n.delete(rootCode); else n.add(rootCode);
    return n;
  });

  const poDocs = usePurchaseStore((st) => st.docs);

  
  /* 列表网格列定义（母单行 + 表头共用，保证对齐） */
  const GRID = '34px 24px 168px 104px 130px 110px 116px 104px 88px 112px 100px 100px 96px 64px';

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
        {/* ── 全部销售单 Tab：母单一行 + 展开子单 ── */}
        {tab === 'all' && (<>
          <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
            展示<strong>全部母销售单</strong>：以<strong>手工录入</strong>或<strong>直连推送</strong>的母销售单（SO）为一行（三状态为该母销售单含全部子履约单的聚合），点击母销售单行展开其下全部子履约单（FO）；未拆分的母销售单即履约单；点击「查看」进入销售单履约详情页。
            逐单分发操作请前往「<strong>销售单管理 → 销售单分发</strong>」；履约进度跟踪见「销售单履约」。
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span className="so-f-label">关键词：</span>
            <input className="filter-input" placeholder="搜索原始/履约销售单号、客户、平台单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 260 }} />
            <span className="so-f-label">来源：</span>
            <select className="filter-select" value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>
              <option value="">全部来源</option>
              <option value="manual">手工录入</option>
              <option value="push">直连推送</option>
            </select>
            <span className="so-f-label">分发状态：</span>
            <select className="filter-select" value={filterDistribute} onChange={(e) => setFilterDistribute(e.target.value)}>
              <option value="">全部分发状态</option>
              <option value="待分发">待分发</option>
              <option value="分发中">分发中</option>
              <option value="已分发">已分发</option>
            </select>
            <span className="so-f-label">发货状态：</span>
            <select className="filter-select" value={filterShip} onChange={(e) => setFilterShip(e.target.value)}>
              <option value="">全部发货状态</option>
              <option value="未发货">未发货</option>
              <option value="部分发货">部分发货</option>
              <option value="全部发货">全部发货</option>
            </select>
            <span className="so-f-label">结算状态：</span>
            <select className="filter-select" value={filterSettle} onChange={(e) => setFilterSettle(e.target.value)}>
              <option value="">全部结算状态</option>
              <option value="未结算">未结算</option>
              <option value="部分结算">部分结算</option>
              <option value="已结算">已结算</option>
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
            <span className="so-f-label">收件人：</span>
            <input className="filter-input" placeholder="全部收件人" value={draftReceiver} onChange={(e) => setDraftReceiver(e.target.value)} style={{ width: 110 }} />

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
          </div>

          <Card style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 1320 }}>
                {/* 表头 */}
                <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-neutral-100)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-500)', background: 'var(--color-neutral-50)' }}>
                  <span>序号</span>
                  <span />
                  <span>母销售单号</span>
                  <span>来源</span>
                  <span>客户</span>
                  <span>地区</span>
                  <span>收件人</span>
                  <span style={{ textAlign: 'right' }}>金额（含子履约单）</span>
                  <span style={{ textAlign: 'center' }}>子单数</span>
                  <span>分发状态</span>
                  <span>发货状态</span>
                  <span>结算状态</span>
                  <span>录入时间</span>
                  <span style={{ textAlign: 'center' }}>操作</span>
                </div>

                {pagedFamilies.map((f, famIdx) => {
                  const open = expanded.has(f.rootCode);
                  const st = familyStatesOf(f);
                  const amount = (f.children.length > 0 ? f.children : f.all).reduce((s, o) => s + o.totalAmount, 0);
                  return (
                    <div key={f.rootCode} style={{ borderBottom: '1px solid var(--color-neutral-100)' }}>
                      {/* 母销售单行（点击整行展开/收起履约单） */}
                      <div
                        style={{ display: 'grid', gridTemplateColumns: GRID, gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', background: open ? 'var(--color-neutral-50)' : 'transparent' }}
                        onClick={() => toggleExpand(f.rootCode)}
                      >
                        <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{(page - 1) * pageSize + famIdx + 1}</span>
                        <svg viewBox="0 0 16 16" fill="none" style={{ width: 12, height: 12, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s', color: 'var(--color-neutral-400)' }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="cell-mono-emph">{f.rootCode}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{f.mother.externalOrderNo}</span></span>
                        <span style={{ fontSize: 'var(--text-sm)' }}>
                          {platformLabelOf(f.mother)}
                          <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: f.mother.sourceChannel === 'push' ? '#7B1FA2' : '#0F64B5' }}>{EXTERNAL_CHANNEL_LABELS[f.mother.sourceChannel]}</span>
                        </span>
                        <span className="cell-emph">{f.mother.customerName}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{f.mother.customerType}</span></span>
                        <span style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{regionText(f.mother)}</span>
                        <span className="cell-emph" style={{ fontSize: 'var(--text-sm)' }}>{f.mother.receiver}</span>
                        <span className="mono" style={{ fontWeight: 'var(--font-semibold)', textAlign: 'right' }}>{money(amount)}</span>
                        <span style={{ textAlign: 'center' }}>
                          {f.children.length > 0
                            ? <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#E3F2FD', color: '#0F64B5', whiteSpace: 'nowrap' }}>{f.children.length} 单</span>
                            : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>未拆分</span>}
                        </span>
                        {pill(st.distribute)}
                        {pill(st.ship)}
                        {pill(st.settle)}
                        <span className="cell-muted" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{f.mother.entryTime}</span>
                        <span style={{ textAlign: 'center' }}>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setViewRoot(f.rootCode); }}>查看</Button>
                        </span>
                      </div>

                      {/* 履约单展开区（母销售单下全部履约单，各展示自身内容） */}
                      {open && (
                        <div style={{ background: 'var(--color-neutral-50)', padding: 'var(--space-2) var(--space-4) var(--space-3)' }}>
                          {f.children.length === 0 ? (
                            <div style={{ padding: 'var(--space-2) 0 var(--space-2) 28px', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>未拆分 · 单一销售单（点击「查看」进入详情）</div>
                          ) : (
                            <Table
                              headers={['子履约单号', '分发路径', '合作商 / 跟单人', '商品', '金额', '分发状态', '发货状态', '结算状态', '操作']}
                              rows={f.children.map((c) => [
                                <span key="c" className="cell-mono-emph">{c.code}</span>,
                                <span key="p" style={{ fontSize: 'var(--text-sm)' }}>{pathLabel(c)}</span>,
                                <span key="w" style={{ fontSize: 'var(--text-sm)' }}>{c.partnerName ?? (c.path === 'self' ? `自营${c.follower ? ` · ${c.follower}` : ''}` : '—')}</span>,
                                <span key="i" style={{ whiteSpace: 'nowrap', fontSize: 'var(--text-sm)' }}>{c.items[0].productName}{c.items.length > 1 ? ` 等${c.items.length}种` : ''} ×{c.items.reduce((s, it) => s + it.quantity, 0)}</span>,
                                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(c.totalAmount)}</span>,
                                orderDistributePill(c),
                                pill(shipStateOf(c, poDocs.filter((d) => d.childOrderId === c.id))),
                                pill(settleStateOf(c)),
                                <div key="act" className="row-actions">
                                  <Button size="sm" variant="ghost" onClick={() => setViewRoot(f.rootCode)}>查看</Button>
                                </div>,
                              ])}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {pagedFamilies.length === 0 && (
                  <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>当前筛选条件下暂无销售订单</div>
                )}
              </div>
            </div>
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
        </>)}
      </div>

      {/* ── 销售单详情抽屉（参照客户管理抽屉样式） ── */}
      <DetailDrawer
        open={!!viewRoot}
        onClose={() => setViewRoot(null)}
        badge="SO"
        title={viewRoot ?? ''}
        statusTag={(() => {
          const fam = families.find((f) => f.rootCode === viewRoot);
          if (!fam) return null;
          const st = familyStatesOf(fam);
          return <>{pill(st.distribute)}{pill(st.ship)}{pill(st.settle)}</>;
        })()}
        subtitle={(() => {
          const fam = families.find((f) => f.rootCode === viewRoot);
          if (!fam) return '';
          const m = fam.mother;
          return `${platformLabelOf(m)} · ${m.customerName}（${m.customerType}） · ${m.receiver} ${m.receiverPhone}`;
        })()}
        mode="view"
      >
        {(() => {
          const fam = families.find((f) => f.rootCode === viewRoot);
          if (!fam) return null;
          const m = fam.mother;
          const children = fam.children;
          const amount = (children.length > 0 ? children : fam.all).reduce((s, o) => s + o.totalAmount, 0);
          return (
            <>
              {/* 原始销售单信息 */}
              <DrawerSection title="母销售单信息">
                <InfoGrid cols={3}>
                  <InfoItem label="母销售单号" emph mono>{fam.rootCode}</InfoItem>
                  <InfoItem label="来源">{platformLabelOf(m)}{<span style={{ display: 'block', fontSize: 'var(--text-xs)', color: m.sourceChannel === 'push' ? '#7B1FA2' : '#0F64B5' }}>{EXTERNAL_CHANNEL_LABELS[m.sourceChannel]}</span>}</InfoItem>
                  <InfoItem label="销售路径">{m.salesPath === 'via_platform' ? '经平台销售' : '直接销售'}</InfoItem>
                  <InfoItem label="客户下单时间">{m.customerOrderTime ?? '—'}</InfoItem>
                  <InfoItem label="客户侧订单号" mono>{m.customerOrderNo ?? '—'}</InfoItem>
                  {m.platformCustomerName && <InfoItem label="平台客户">{m.platformCustomerName}</InfoItem>}
                  <InfoItem label="客户" emph>{m.customerName}<span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{m.customerType}</span></InfoItem>
                  <InfoItem label="客户区域">{regionText(m)}</InfoItem>
                  <InfoItem label="订单金额（含子履约单）" emph mono valueStyle={{ color: 'var(--color-module-current-base)' }}>{`¥${amount.toLocaleString()}`}</InfoItem>
                  <InfoItem label="子履约单数">{children.length > 0 ? `${children.length} 单` : '未拆分（即履约单）'}</InfoItem>
                  <InfoItem label="录入时间 / 人">{m.entryTime} · {m.operator}</InfoItem>
                  <InfoItem label="收货人">{m.receiver}</InfoItem>
                  <InfoItem label="联系电话" mono>{m.receiverPhone}</InfoItem>
                  <InfoItem label="收货地址" span={3}>{m.receiverAddress || '—'}</InfoItem>
                  <InfoItem label="备注" span={3}>{m.remark || '—'}</InfoItem>
                </InfoGrid>
              </DrawerSection>

              {/* 商品明细（母销售单全量） */}
              <DrawerSection title={`商品明细（母销售单全量 ${m.items.length} 种）`}>
                <table className="detail-inline-table">
                  <thead><tr><th>商品名称</th><th>规格</th><th>数量</th><th>销售实价</th><th>小计</th></tr></thead>
                  <tbody>
                    {m.items.map((it, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                        <td>{it.spec}</td>
                        <td className="mono">{it.quantity}</td>
                        <td className="mono">¥{it.price.toLocaleString()}</td>
                        <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>¥{(it.price * it.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DrawerSection>

              {/* 子履约单履约情况 */}
              <DrawerSection title={children.length > 0 ? `子履约单（${children.length}）` : '履约情况（未拆分，母销售单即履约单）'}>
                {children.length > 0 ? (
                  <table className="detail-inline-table">
                    <thead><tr><th>子履约单号</th><th>分发路径</th><th>履约主体</th><th>金额</th><th>分发状态</th><th>发货状态</th><th>结算状态</th></tr></thead>
                    <tbody>
                      {children.map((c) => (
                        <tr key={c.id}>
                          <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{c.code}</td>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{pathLabel(c)}</td>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{c.partnerName ?? (c.path === 'self' ? `自营${c.follower ? ` · ${c.follower}` : ''}` : '—')}</td>
                          <td className="mono">¥{c.totalAmount.toLocaleString()}</td>
                          <td>{orderDistributePill(c)}</td>
                          <td>{pill(shipStateOf(c, poDocs.filter((d) => d.childOrderId === c.id)))}</td>
                          <td>{pill(settleStateOf(c))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <InfoGrid cols={3}>
                    <InfoItem label="分发状态">{pill(familyStatesOf(fam).distribute)}</InfoItem>
                    <InfoItem label="发货状态">{pill(shipStateOf(m, poDocs.filter((d) => d.childOrderId === m.id)))}</InfoItem>
                    <InfoItem label="结算状态">{pill(settleStateOf(m))}</InfoItem>
                  </InfoGrid>
                )}
              </DrawerSection>

              {/* 处理轨迹（母销售单） */}
              <DrawerSection title="处理轨迹">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 280, overflowY: 'auto' }}>
                  {m.history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', alignItems: 'baseline' }}>
                      <span className="mono" style={{ color: 'var(--color-neutral-400)', flexShrink: 0 }}>{h.time}</span>
                      <span style={{ fontWeight: 'var(--font-medium)', flexShrink: 0 }}>{h.action}</span>
                      {h.detail && <span style={{ color: 'var(--color-neutral-500)' }}>{h.detail}</span>}
                    </div>
                  ))}
                </div>
              </DrawerSection>
            </>
          );
        })()}
      </DetailDrawer>
    </>
  );
}
