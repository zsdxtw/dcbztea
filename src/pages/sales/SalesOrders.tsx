import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
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
  if (o.distributeMode === 'grab') return '转派-抢单';
  if (o.distributeMode === 'compare') return '转派-比单';
  return '—';
}

/** 地区展示（省 / 市） */
function regionText(o: ExternalOrder): string {
  return o.customerRegion || '—';
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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
    return true;
  }), [families, keyword, filterChannel, filterDistribute, filterShip, filterSettle]);

  const totalPages = Math.max(1, Math.ceil(filteredFamilies.length / pageSize));
  const pagedFamilies = filteredFamilies.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [keyword, filterChannel, filterDistribute, filterShip, filterSettle, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { setExpanded(new Set()); }, [tab]);

  const toggleExpand = (rootCode: string) => setExpanded((prev) => {
    const n = new Set(prev);
    if (n.has(rootCode)) n.delete(rootCode); else n.add(rootCode);
    return n;
  });

  const poDocs = usePurchaseStore((st) => st.docs);

  
  /* 列表网格列定义（母单行 + 表头共用，保证对齐） */
  const GRID = '28px 168px 104px 130px 110px 116px 104px 88px 112px 100px 100px 96px 64px';

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
        actions={<Button onClick={() => navigate('/sales/order-entry')}>+ 新建销售单</Button>}
      />
      <div className="content-body">
        {/* Tab：全部销售单（母单聚合总览）/ 分发订单（自营接单 + 履约跟踪） */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <button className={`tab-card-simple${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>
            全部母销售单
            <span className="tab-card-simple-count">{families.length} 张</span>
          </button>
        </div>

        {/* ── 全部销售单 Tab：母单一行 + 展开子单 ── */}
        {tab === 'all' && (<>
          <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
            展示<strong>全部母销售单</strong>：以<strong>手工录入</strong>或<strong>直连推送</strong>的母销售单（SO）为一行（三状态为该母销售单含全部子履约单的聚合），点击母销售单行展开其下全部子履约单（FO）；未拆分的母销售单即履约单；点击「查看」进入销售单履约详情页。
            逐单分发操作请前往「<strong>销售单管理 → 销售单分发</strong>」；履约进度跟踪见「销售单履约」。
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
            <input className="filter-input" placeholder="搜索原始/履约销售单号、客户、平台单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 280 }} />
            <select className="filter-select" value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>
              <option value="">全部来源</option>
              <option value="manual">手工录入</option>
              <option value="push">直连推送</option>
            </select>
            <select className="filter-select" value={filterDistribute} onChange={(e) => setFilterDistribute(e.target.value)}>
              <option value="">全部分发状态</option>
              <option value="待分发">待分发</option>
              <option value="分发中">分发中</option>
              <option value="已分发">已分发</option>
            </select>
            <select className="filter-select" value={filterShip} onChange={(e) => setFilterShip(e.target.value)}>
              <option value="">全部发货状态</option>
              <option value="未发货">未发货</option>
              <option value="部分发货">部分发货</option>
              <option value="全部发货">全部发货</option>
            </select>
            <select className="filter-select" value={filterSettle} onChange={(e) => setFilterSettle(e.target.value)}>
              <option value="">全部结算状态</option>
              <option value="未结算">未结算</option>
              <option value="部分结算">部分结算</option>
              <option value="已结算">已结算</option>
            </select>
          </div>

          <Card style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 1320 }}>
                {/* 表头 */}
                <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-neutral-100)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-500)', background: 'var(--color-neutral-50)' }}>
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

                {pagedFamilies.map((f) => {
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
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/sales/sales-orders/${f.rootCode}`); }}>查看</Button>
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
                                  <Button size="sm" variant="ghost" onClick={() => navigate(`/sales/sales-orders/${f.rootCode}?child=${c.code}`)}>查看</Button>
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

    </>
  );
}
