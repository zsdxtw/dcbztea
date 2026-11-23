import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection } from '../../components/common/DetailDrawer';
import Pagination from '../../components/common/Pagination';
import SalesOrderEntryModal from '../../components/business/SalesOrderEntryModal';
import SplitDraftBuilder, { type DraftFulfillment } from '../../components/business/SplitDraftBuilder';
import ReportMatchDialog from '../../components/business/ReportMatchDialog';
import DispatchDialog from '../../components/business/DispatchDialog';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePriceStore } from '../../stores/priceStore';
import { buildFamilies, FAMILY_STATE_COLORS } from '../../utils/salesOrderFamily';
import { SalesOrderDetailTabs } from './SalesOrderDetail';
import { EXTERNAL_CHANNEL_LABELS, EXTERNAL_PLATFORM_LABELS, platformLabelOf } from '../../data/externalOrders';
import { regionTextOf } from '../../data/regions';
import type { ExternalOrder, ExternalOrderItem } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;
const CUSTOMER_TYPES = ['直营客户', '渠道客户', '平台客户', '个人客户'];
const PAGE_SIZE = 10;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const regionText = (o: ExternalOrder) => regionTextOf(o.customerRegion, o.receiverAddress);
const totalQty = (items: ExternalOrderItem[]) => items.reduce((s, it) => s + it.quantity, 0);

interface EditForm {
  customerName: string;
  customerType: string;
  customerRegion: string;
  externalOrderNo: string;
  customerOrderNo: string;
  customerOrderTime: string;
  receiver: string;
  receiverPhone: string;
  receiverAddress: string;
  remark: string;
  items: ExternalOrderItem[];
}

/**
 * 销售 · 销售单处理
 * 手工录入 / 平台直连推送的销售单第一站：查看、修改、取消、拆单、分发、匹配报备。
 * 拆单与分发均先在前端预生成履约单 TAB，确认后才落库。
 */
export default function SalesOrderProcessing() {
  const orders = useOrderFlowStore((s) => s.orders);
  const products = usePriceStore((s) => s.products);
  const store = useOrderFlowStore;

  const [entryOpen, setEntryOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterPath, setFilterPath] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState('');
  const [cancelOf, setCancelOf] = useState<ExternalOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  /** 拆单弹窗 */
  const [splitOf, setSplitOf] = useState<ExternalOrder | null>(null);
  const [splitDrafts, setSplitDrafts] = useState<DraftFulfillment[]>([]);
  const [splitSelected, setSplitSelected] = useState<string | null>(null);
  const [splitNotice, setSplitNotice] = useState('');

  /** 分发弹窗 */
  const [dispatchOf, setDispatchOf] = useState<ExternalOrder | null>(null);

  /** 报备匹配弹窗 */
  const [reportCtx, setReportCtx] = useState<{ orderId: string; items: ExternalOrderItem[] } | null>(null);

  const [msg, setMsg] = useState('');
  const flash = (text: string) => {
    setMsg(text);
    window.setTimeout(() => setMsg(''), 4500);
  };

  /** 待处理销售单：未分发、未生成履约单、未取消 */
  const rows = useMemo(
    () => orders.filter((o) => !o.parentCode && o.dispatchState === 'unprocessed' && o.processStatus === 'unprocessed'),
    [orders],
  );

  const filtered = useMemo(() => rows.filter((o) => {
    const kw = keyword.trim();
    if (kw && !o.code.includes(kw) && !(o.externalOrderNo ?? '').includes(kw)
      && !o.customerName.includes(kw) && !o.receiver.includes(kw)) return false;
    if (filterChannel && o.sourceChannel !== filterChannel) return false;
    if (filterPath && (o.salesPath ?? 'direct') !== filterPath) return false;
    return true;
  }), [rows, keyword, filterChannel, filterPath]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [keyword, filterChannel, filterPath, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const families = useMemo(() => buildFamilies(orders), [orders]);
  const detailOrder = detailId ? orders.find((o) => o.id === detailId) ?? null : null;
  const detailFamily = detailOrder ? families.find((f) => f.rootCode === detailOrder.code) ?? null : null;
  const dispatchOrder = dispatchOf ? orders.find((o) => o.id === dispatchOf.id) ?? null : null;

  const brandCountOf = (items: ExternalOrderItem[]) =>
    new Set(items.map((it) => products.find((p) => p.id === it.productId)?.brand
      ?? products.find((p) => p.name === it.productName)?.brand ?? '其他')).size;

  const openEdit = (o: ExternalOrder) => {
    if (o.sourceChannel !== 'manual') return;
    setDetailId(o.id);
    setEditError('');
    setEditForm({
      customerName: o.customerName,
      customerType: o.customerType,
      customerRegion: o.customerRegion,
      externalOrderNo: o.externalOrderNo ?? '',
      customerOrderNo: o.customerOrderNo ?? '',
      customerOrderTime: o.customerOrderTime ?? '',
      receiver: o.receiver,
      receiverPhone: o.receiverPhone,
      receiverAddress: o.receiverAddress,
      remark: o.remark ?? '',
      items: o.items.map((it) => ({ ...it })),
    });
  };

  const saveEdit = () => {
    if (!detailOrder || !editForm) return;
    if (!editForm.customerName.trim() || !editForm.receiver.trim() || !editForm.receiverPhone.trim()) {
      setEditError('客户名称、收货人、联系电话不能为空');
      return;
    }
    if (editForm.items.length === 0) { setEditError('请至少保留一条商品明细'); return; }
    if (editForm.items.some((it) => it.quantity <= 0)) { setEditError('商品数量必须大于 0'); return; }
    const res = store.getState().updateOrder(detailOrder.id, {
      customerName: editForm.customerName.trim(),
      customerType: editForm.customerType,
      customerRegion: editForm.customerRegion.trim(),
      externalOrderNo: editForm.externalOrderNo.trim() || undefined,
      customerOrderNo: editForm.customerOrderNo.trim() || undefined,
      customerOrderTime: editForm.customerOrderTime.trim() || undefined,
      receiver: editForm.receiver.trim(),
      receiverPhone: editForm.receiverPhone.trim(),
      receiverAddress: editForm.receiverAddress.trim(),
      remark: editForm.remark.trim() || undefined,
      items: editForm.items,
    });
    if (!res.ok) { setEditError(res.msg); return; }
    setEditForm(null);
    flash('销售单已修改');
  };

  const confirmCancel = () => {
    if (!cancelOf) return;
    if (!cancelReason.trim()) { window.alert('请填写取消原因'); return; }
    const res = store.getState().cancelOrder(cancelOf.id, cancelReason);
    setCancelOf(null);
    setCancelReason('');
    setDetailId(null);
    if (res.ok) flash(res.msg);
    else window.alert(res.msg);
  };

  const openDispatch = (o: ExternalOrder) => setDispatchOf(o);

  const confirmSplit = () => {
    if (!splitOf) return;
    if (splitDrafts.length === 0) {
      setSplitNotice('请至少生成 1 张履约单 TAB（填写本次拆出数量后点「拆出」）');
      return;
    }
    const res = store.getState().splitSalesOrderToFulfillments(splitOf.id, splitDrafts.map((d) => d.items));
    if (!res.ok) { window.alert(res.msg); return; }
    setSplitOf(null);
    setSplitDrafts([]);
    setSplitSelected(null);
    setSplitNotice('');
    flash(res.msg);
  };

  const openReportForRow = (o: ExternalOrder) => {
    setReportCtx({ orderId: o.id, items: o.items });
  };

  const confirmReport = (codes: string[]) => {
    if (!reportCtx) return;
    const order = orders.find((o) => o.id === reportCtx.orderId);
    if (!order) { setReportCtx(null); return; }
    if (codes.length === 0) { setReportCtx(null); flash('请至少勾选一条报备记录'); return; }
    // 人工匹配：整单生成一张履约单后直接转出至所选报备合作商（无中间待确认状态）
    const res = store.getState().splitSalesOrderToFulfillments(order.id, [reportCtx.items]);
    const child = res.created?.[0];
    if (!res.ok || !child) { setReportCtx(null); window.alert(res.msg); return; }
    const r = store.getState().matchReportManual(child.id, codes);
    setReportCtx(null);
    flash(r.ok ? r.msg : `${r.msg}（履约单保持待分发）`);
  };

  const reportOrder = reportCtx ? orders.find((o) => o.id === reportCtx.orderId) ?? null : null;

  return (
    <>
      <ContentHeader title="销售单处理" breadcrumbs={['销售', '销售单管理', '销售单处理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          销售单处理是销售订单进入系统的<strong>第一站</strong>：<strong>手工录入</strong>与<strong>平台直连推送</strong>的订单一律先进入本页。
          可查看详情、修改（手工单）、取消；<strong>拆单</strong>先预生成履约单 TAB，确认后落库；<strong>分发</strong>可先拆单，再为每张履约单 TAB 预确定分发方式（自营（淡茶半盏）/ 转派-报备 / 转派-比单 / 转派-指定），点击「确认拆单并分发」后生成全部履约单：已预确定的同步分发，未预确定的进入待分发；
          <strong>匹配报备</strong>由人工处理：打开报备匹配弹窗人工勾选命中的报备记录（订单 / 商品 / 地区），确认后整单直接转出至报备合作商。未送分发的销售单不进入履约单分发。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', background: '#E8F5E9', color: '#01795D', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{msg}</div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
          <input className="filter-input" placeholder="搜索销售单号、平台单号、客户、收货人..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 300 }} />
          <select className="filter-select" value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>
            <option value="">全部来源</option>
            <option value="manual">手工录入</option>
            <option value="push">直连推送</option>
          </select>
          <select className="filter-select" value={filterPath} onChange={(e) => setFilterPath(e.target.value)}>
            <option value="">全部销售路径</option>
            <option value="direct">直接销售</option>
            <option value="via_platform">经平台销售</option>
          </select>
          <span style={{ marginLeft: 'auto' }}>
            <Button onClick={() => setEntryOpen(true)}>+ 新建销售单</Button>
          </span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['序号', '销售单号', '订单来源', '销售路径', '客户', '收货人 / 地区', '品牌/数量', '总金额', '订单状态', '录入时间', '操作']}
            rows={pagedRows.map((o, idx) => [
              <span key="no" className="mono cell-muted">{(page - 1) * pageSize + idx + 1}</span>,
              <span key="c" className="cell-mono-emph" style={{ whiteSpace: 'nowrap' }}>
                {o.code}
                <span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.externalOrderNo ?? '—'}</span>
              </span>,
              <span key="src" style={{ fontSize: 'var(--text-sm)' }}>
                {o.salesPath === 'via_platform'
                  ? (o.platformCustomerName ?? (o.platform ? EXTERNAL_PLATFORM_LABELS[o.platform] : '经平台销售'))
                  : '淡茶半盏'}
                <span style={{ display: 'block', marginTop: 2 }}>
                  {pill(o.sourceChannel === 'push' ? '#F3E5F5' : '#E3F2FD', o.sourceChannel === 'push' ? '#7B1FA2' : '#0F64B5', EXTERNAL_CHANNEL_LABELS[o.sourceChannel])}
                </span>
              </span>,
              <span key="sp">
                {o.salesPath === 'via_platform'
                  ? pill('#E3F2FD', '#0F64B5', '经平台销售')
                  : pill('#E8F5E9', '#2E7D32', '直接销售')}
              </span>,
              <span key="cu" className="cell-emph">
                {o.customerName}
                <span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.customerType}</span>
              </span>,
              <span key="rcv" style={{ minWidth: 0 }}>
                <span className="cell-emph" style={{ fontSize: 'var(--text-sm)', display: 'block' }}>{o.receiver}</span>
                <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', whiteSpace: 'nowrap' }}>{regionText(o)}</span>
              </span>,
              <span key="items" className="mono" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{brandCountOf(o.items)}种/{totalQty(o.items)}份</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{money(o.totalAmount)}</span>,
              <span key="st">
                {(() => {
                  const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)['未处理'] ?? { bg: '#FFF3E0', color: '#B26A00' };
                  return pill(c.bg, c.color, '未处理');
                })()}
              </span>,
              <span key="t" className="cell-muted" style={{ whiteSpace: 'nowrap' }}>{o.entryTime.slice(0, 10)}</span>,
              <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                <Button size="sm" variant="ghost" onClick={() => setDetailId(o.id)}>查看</Button>
                <Button size="sm" onClick={() => openDispatch(o)}>分发</Button>
                <Button size="sm" onClick={() => { setSplitOf(o); setSplitDrafts([]); setSplitSelected(null); setSplitNotice(''); }}>拆单</Button>
                <Button size="sm" variant="danger" onClick={() => openReportForRow(o)}>匹配报备</Button>
              </div>,
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无待处理销售单。新建销售单或平台直连推送的订单将进入此处。
            </div>
          )}
        </Card>

        {filtered.length > 0 && (
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} label="张销售单" />
        )}
      </div>

      <SalesOrderEntryModal open={entryOpen} onClose={() => setEntryOpen(false)} />

      {/* ── 详情抽屉 ── */}
      <DetailDrawer
        open={!!detailOrder}
        onClose={() => { setDetailId(null); setEditForm(null); setEditError(''); }}
        badge="SO"
        title={detailOrder?.code ?? ''}
        subtitle={detailOrder ? `${platformLabelOf(detailOrder)} · ${detailOrder.customerName}（${detailOrder.customerType}） · ${detailOrder.receiver}` : ''}
        footer={detailOrder && (editForm ? (
          <>
            <Button variant="ghost" onClick={() => { setDetailId(null); setEditForm(null); setEditError(''); }}>关闭</Button>
            <Button variant="ghost" onClick={() => { setEditForm(null); setEditError(''); }}>取消修改</Button>
            <Button onClick={saveEdit}>保存修改</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setDetailId(null)}>关闭</Button>
            {detailOrder.sourceChannel === 'manual' && <Button variant="ghost" onClick={() => openEdit(detailOrder)}>修改</Button>}
            <Button
              style={{ background: 'var(--color-module-current-secondary)', borderColor: 'var(--color-module-current-secondary)', color: '#fff' }}
              onClick={() => { setCancelOf(detailOrder); setCancelReason(''); }}
            >取消订单</Button>
          </>
        ))}
      >
        {editForm ? (
          <>
            <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7 }}>
              灰色字段为不可修改项；白色输入框为可修改字段，修改后点击「保存修改」。
            </div>
            {editError && (
              <div style={{ marginBottom: 'var(--space-3)', padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{editError}</div>
            )}
            <DrawerSection title="订单信息">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3) var(--space-4)' }}>
                <div>
                  <label className="drawer-label">销售单号</label>
                  <input className="filter-input" style={{ width: '100%' }} value={detailOrder?.code ?? ''} disabled />
                </div>
                <div>
                  <label className="drawer-label">订单来源</label>
                  <input className="filter-input" style={{ width: '100%' }} value={detailOrder?.sourceChannel === 'push' ? '直连推送' : '手工录入'} disabled />
                </div>
                <div>
                  <label className="drawer-label">销售路径</label>
                  <input className="filter-input" style={{ width: '100%' }} value={detailOrder?.salesPath === 'via_platform' ? '经平台销售' : '直接销售'} disabled />
                </div>
                <div>
                  <label className="drawer-label">录入时间</label>
                  <input className="filter-input" style={{ width: '100%' }} value={detailOrder?.entryTime ?? ''} disabled />
                </div>
                <div>
                  <label className="drawer-label">录入人</label>
                  <input className="filter-input" style={{ width: '100%' }} value={detailOrder?.operator ?? ''} disabled />
                </div>
                <div>
                  <label className="drawer-label">总金额</label>
                  <input className="filter-input mono" style={{ width: '100%' }} value={money(editForm.items.reduce((s, it) => s + it.price * it.quantity, 0))} disabled />
                </div>
                <div>
                  <label className="drawer-label">客户名称 *</label>
                  <input className="filter-input" style={{ width: '100%' }} value={editForm.customerName} onChange={(e) => setEditForm((f) => (f ? { ...f, customerName: e.target.value } : f))} />
                </div>
                <div>
                  <label className="drawer-label">客户类型</label>
                  <select className="filter-input" style={{ width: '100%' }} value={editForm.customerType} onChange={(e) => setEditForm((f) => (f ? { ...f, customerType: e.target.value } : f))}>
                    {[...new Set([...CUSTOMER_TYPES, editForm.customerType])].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="drawer-label">客户区域</label>
                  <input className="filter-input" style={{ width: '100%' }} value={editForm.customerRegion} onChange={(e) => setEditForm((f) => (f ? { ...f, customerRegion: e.target.value } : f))} />
                </div>
                <div>
                  <label className="drawer-label">平台订单号</label>
                  <input className="filter-input" style={{ width: '100%' }} value={editForm.externalOrderNo} onChange={(e) => setEditForm((f) => (f ? { ...f, externalOrderNo: e.target.value } : f))} />
                </div>
                <div>
                  <label className="drawer-label">客户侧订单号</label>
                  <input className="filter-input" style={{ width: '100%' }} value={editForm.customerOrderNo} onChange={(e) => setEditForm((f) => (f ? { ...f, customerOrderNo: e.target.value } : f))} />
                </div>
                <div>
                  <label className="drawer-label">客户下单时间</label>
                  <input className="filter-input" placeholder="YYYY-MM-DD HH:mm" style={{ width: '100%' }} value={editForm.customerOrderTime} onChange={(e) => setEditForm((f) => (f ? { ...f, customerOrderTime: e.target.value } : f))} />
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title="收货信息">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3) var(--space-4)' }}>
                <div>
                  <label className="drawer-label">收货人 *</label>
                  <input className="filter-input" style={{ width: '100%' }} value={editForm.receiver} onChange={(e) => setEditForm((f) => (f ? { ...f, receiver: e.target.value } : f))} />
                </div>
                <div>
                  <label className="drawer-label">联系电话 *</label>
                  <input className="filter-input" style={{ width: '100%' }} value={editForm.receiverPhone} onChange={(e) => setEditForm((f) => (f ? { ...f, receiverPhone: e.target.value } : f))} />
                </div>
                <div>
                  <label className="drawer-label">收货地址</label>
                  <input className="filter-input" style={{ width: '100%' }} value={editForm.receiverAddress} onChange={(e) => setEditForm((f) => (f ? { ...f, receiverAddress: e.target.value } : f))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="drawer-label">备注</label>
                  <input className="filter-input" style={{ width: '100%' }} value={editForm.remark} onChange={(e) => setEditForm((f) => (f ? { ...f, remark: e.target.value } : f))} />
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title="商品明细">
              <table className="detail-inline-table">
                <thead><tr><th>商品名称</th><th>规格</th><th style={{ width: 100 }}>数量</th><th style={{ width: 120 }}>销售实价</th><th style={{ width: 110 }}>小计</th><th style={{ width: 70 }}>操作</th></tr></thead>
                <tbody>
                  {editForm.items.map((it, i) => (
                    <tr key={`${it.productId}-${i}`}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                      <td>{it.spec}</td>
                      <td><input className="filter-input mono" type="number" min={1} style={{ width: 72 }} value={it.quantity}
                        onChange={(e) => setEditForm((f) => (f ? { ...f, items: f.items.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) || 0 } : x)) } : f))} /></td>
                      <td><input className="filter-input mono" type="number" min={0} style={{ width: 92 }} value={it.price}
                        onChange={(e) => setEditForm((f) => (f ? { ...f, items: f.items.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) || 0 } : x)) } : f))} /></td>
                      <td className="mono">{money(it.price * it.quantity)}</td>
                      <td><Button size="sm" variant="ghost" disabled={editForm.items.length <= 1}
                        onClick={() => setEditForm((f) => (f ? { ...f, items: f.items.filter((_, j) => j !== i) } : f))}>删除</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>
          </>
        ) : detailFamily && (
          <>
            <div style={{ marginBottom: 'var(--space-4)', padding: '10px 14px', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', lineHeight: 1.7 }}>
              该销售单尚未生成履约单。点击「分发」可先拆单再选择方向；点击「拆单」仅预生成履约单，确认后进入履约单分发。
            </div>
            <SalesOrderDetailTabs family={detailFamily} poDocs={[]} initialTab="info" showStates={false} />
          </>
        )}
      </DetailDrawer>

      {/* ── 拆单弹窗（预生成） ── */}
      {splitOf && (
        <div className="category-dialog-overlay" onClick={() => setSplitOf(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 980, maxWidth: '94vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', flexShrink: 0 }}>拆单 · {splitOf.code}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7, flexShrink: 0 }}>
              填写拆出数量后点击「拆出」预生成履约单 TAB；可生成多张、删除后数量归还。未拆出的剩余数量作为末尾虚线「剩余部分」TAB，随确认一并生成履约单；无剩余数量时不显示该虚线 TAB。
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <SplitDraftBuilder
                items={splitOf.items}
                drafts={splitDrafts}
                onChange={(next) => { setSplitDrafts(next); setSplitNotice(''); }}
                selectedId={splitSelected}
                onSelect={setSplitSelected}
                remainderTab
                externalError={splitNotice}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexShrink: 0 }}>
              <Button variant="ghost" onClick={() => { setSplitOf(null); setSplitNotice(''); }}>关闭</Button>
              <Button onClick={confirmSplit}>确认拆单生成履约单</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 分发弹窗（拆单 + 四方向，与履约单分发共用） ── */}
      <DispatchDialog
        order={dispatchOrder}
        mode="sales"
        onClose={() => setDispatchOf(null)}
        onDone={flash}
      />

      {/* ── 报备匹配弹窗 ── */}
      <ReportMatchDialog
        open={!!reportCtx}
        order={reportOrder}
        items={reportCtx?.items ?? []}
        onClose={() => setReportCtx(null)}
        onConfirm={confirmReport}
        confirmLabel="确认匹配并转出"
      />

      {/* ── 取消销售单（必填原因，辅助色） ── */}
      {cancelOf && (
        <div className="category-dialog-overlay" onClick={() => setCancelOf(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 440 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>取消销售单</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              确认取消销售单 <strong className="mono">{cancelOf.code}</strong>（{cancelOf.customerName} · {money(cancelOf.totalAmount)}）？
              取消后不再进入分发与履约，销售单列表保留并显示已取消。
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>取消原因 *</label>
              <input className="filter-input" placeholder="请填写取消原因" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setCancelOf(null)}>关闭</Button>
              <Button
                style={{ background: 'var(--color-module-current-secondary)', borderColor: 'var(--color-module-current-secondary)', color: '#fff' }}
                onClick={confirmCancel}
              >确认取消</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
