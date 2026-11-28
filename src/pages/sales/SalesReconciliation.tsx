/**
 * 销售 · 销售结算（销售结算单确认页，对账阶段）
 * 负责对账阶段的确认：确认对账、登记异议、差异调整（客户发起对账）、退货冲减。
 * 结算阶段（开票 / 收款）在财务菜单；本页只读展示其进度。
 * 设计见 docs/销售单结算流程设计建议.md 第五节、9.1（阶段显性化）。
 */
import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import SalesStatementCreateDialog from '../../components/business/SalesStatementCreateDialog';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import {
  useSettlementStore, netOf, invoicedOf, receivedOf,
} from '../../stores/settlementStore';
import { RECEIPT_METHOD_LABELS } from '../../types';
import type { SalesStatement, StatementStatus } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const STATUS_VARIANT: Record<StatementStatus, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning', confirmed: 'success', disputed: 'error', closed: 'default',
};
const STATUS_LABELS: Record<StatementStatus, string> = {
  pending: '待确认', confirmed: '已确认', disputed: '有异议', closed: '已办结',
};
/** 单据阶段（两单制的对账 / 结算两段）：派生显示 */
function stageOf(s: SalesStatement): '对账中' | '结算中' | '已办结' {
  if (s.status === 'closed') return '已办结';
  if (s.status === 'confirmed') return '结算中';
  return '对账中';
}

type DialogKind = 'adjust' | 'dispute' | null;

export default function SalesSettlementConfirm() {
  const orders = useOrderFlowStore((s) => s.orders);
  const statements = useSettlementStore((s) => s.salesStatements);
  const store = useSettlementStore;
  const [msg, setMsg] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [form, setForm] = useState<{ amount: string; reason: string }>({ amount: '', reason: '' });

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 4500); };
  const run = (res: { ok: boolean; msg: string }) => { flash(res.msg); if (res.ok) setDialog(null); };

  const filtered = useMemo(() => statements.filter((s) => {
    if (status && s.status !== status) return false;
    const k = keyword.trim();
    if (k) {
      const hit = s.code.includes(k) || s.settleTarget.includes(k) || s.lines.some((l) => l.orderCode.includes(k)) || (s.customerStatementNo ?? '').includes(k);
      if (!hit) return false;
    }
    return true;
  }), [statements, status, keyword]);

  const current = selectedId ? statements.find((s) => s.id === selectedId) ?? null : null;

  const stagePill = (s: SalesStatement) => {
    const stage = stageOf(s);
    const tone = stage === '已办结' ? { bg: '#E8F5E9', color: '#01795D' } : stage === '结算中' ? { bg: '#FBF3E2', color: '#9A7A1C' } : { bg: '#E3F2FD', color: '#0F64B5' };
    return <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: tone.bg, color: tone.color, whiteSpace: 'nowrap' }}>{stage}</span>;
  };
  const statusPill = (s: SalesStatement) => <StatusTag variant={STATUS_VARIANT[s.status]} label={STATUS_LABELS[s.status]} />;

  return (
    <>
      <ContentHeader title="销售结算" breadcrumbs={['销售', '销售结算']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          本页负责销售结算单的<strong>对账阶段</strong>：确认对账、登记异议、差异调整与退货冲减。
          结算单确认后金额锁定，<strong>结算阶段</strong>（开票登记、收款登记、办结）在财务菜单完成，本页只读展示其进度。
          结算单通过「+ 生成销售结算单」弹窗生成（淡茶发起 / 客户发起对账）；履约单维度的结算进度见「履约单结算」页。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="filter-input" placeholder="搜索结算单号、结算对象、履约单号、客户对账单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 320 }} />
          <span style={{ marginLeft: 'auto' }} />
          <Button onClick={() => setCreateOpen(true)}>+ 生成销售结算单</Button>
          <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {(Object.keys(STATUS_LABELS) as StatementStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
          </select>
        </div>

        <SalesStatementCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />

        <Card style={{ padding: 0 }}>
          <Table
            headers={['结算单号', '来源', '结算对象', '客户类型', '账期', '结算净额', '已开票（财务）', '已收款（财务）', '阶段', '状态', '操作']}
            rows={filtered.map((s) => {
              const net = netOf(s);
              const stage = stageOf(s);
              return [
                <span key="c" className="cell-mono-emph">{s.code}</span>,
                s.source === 'customer'
                  ? <span key="src" style={{ fontSize: 'var(--text-xs)' }}><span style={{ color: '#E65100', fontWeight: 'var(--font-medium)' }}>客户发起对账</span><span className="mono" style={{ display: 'block', color: 'var(--color-neutral-400)' }}>{s.customerStatementNo}</span></span>
                  : <span key="src" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>淡茶发起</span>,
                <span key="t" className="cell-emph">{s.settleTarget}</span>,
                <span key="ct" style={{ fontSize: 'var(--text-sm)' }}>{s.customerType}</span>,
                <span key="p" className="cell-muted" style={{ fontSize: 'var(--text-xs)' }}>{s.period}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(net)}</span>,
                <span key="i" className="mono" style={{ color: invoicedOf(s) > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(invoicedOf(s))}</span>,
                <span key="r" className="mono" style={{ color: receivedOf(s) > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(receivedOf(s))}</span>,
                stagePill(s),
                statusPill(s),
                <div key="act" className="row-actions">
                  {s.status === 'pending' && <Button size="sm" onClick={() => run(store.getState().confirmSalesStatement(s.id))}>确认对账</Button>}
                  {s.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => { setSelectedId(s.id); setForm({ amount: '', reason: '' }); setDialog('dispute'); }}>登记异议</Button>}
                  {stage === '对账中' && <Button size="sm" variant="ghost" onClick={() => { setSelectedId(s.id); setForm({ amount: '', reason: '' }); setDialog('adjust'); }}>差异调整</Button>}
                  {s.status !== 'closed' && <Button size="sm" variant="ghost" onClick={() => { setSelectedId(s.id); setForm({ amount: '', reason: '' }); setDialog('adjust'); }}>退货冲减</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(s.id)}>查看</Button>
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无销售结算单（在「销售单管理 → 履约单结算」生成或登记客户发起对账后展示）。
            </div>
          )}
        </Card>
      </div>

      {/* ── 结算单详情抽屉（对账段 + 结算段两段式） ── */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="JS"
        title={current?.code ?? ''}
        statusTag={current ? statusPill(current) : null}
        subtitle={current ? `${current.settleTarget} · ${current.customerType} · 阶段：${stageOf(current)}` : ''}
        footer={current && current.status === 'pending' ? (
          <>
            <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>
            <Button variant="ghost" onClick={() => { setSelectedId(current.id); setForm({ amount: '', reason: '' }); setDialog('dispute'); }}>登记异议</Button>
            <Button onClick={() => run(store.getState().confirmSalesStatement(current.id))}>确认对账</Button>
          </>
        ) : <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>}
      >
        {current && (
          <>
            {/* 对账段 */}
            <DrawerSection title="对账阶段（业务确认）">
              <InfoGrid cols={4}>
                <InfoItem label="来源">{current.source === 'customer' ? '客户发起对账' : '淡茶发起'}</InfoItem>
                <InfoItem label="结算对象" emph>{current.settleTarget}</InfoItem>
                <InfoItem label="客户类型">{current.customerType}</InfoItem>
                <InfoItem label="账期">{current.period}</InfoItem>
                {current.source === 'customer' && <InfoItem label="客户对账单号" mono>{current.customerStatementNo}</InfoItem>}
                {current.source === 'customer' && <InfoItem label="客户对账金额" mono>{money(current.customerAmount ?? 0)}</InfoItem>}
                <InfoItem label="结算金额" mono>{money(current.amount)}</InfoItem>
                <InfoItem label="退货冲减" mono>{money(current.adjustments.reduce((s, a) => s + a.amount, 0))}</InfoItem>
                <InfoItem label="结算净额" mono emph>{money(netOf(current))}</InfoItem>
                {current.confirmedBy && <InfoItem label="确认人">{current.confirmedBy}</InfoItem>}
                {current.confirmedAt && <InfoItem label="确认时间">{current.confirmedAt}</InfoItem>}
                {current.disputeReason && <InfoItem label="异议原因" span={3}>{current.disputeReason}</InfoItem>}
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`对账明细（${current.lines.length} 行）`}>
              <table className="detail-inline-table">
                <thead><tr><th>履约单号</th><th>计入金额</th></tr></thead>
                <tbody>
                  {current.lines.map((l) => (
                    <tr key={l.orderId}>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{l.orderCode}</td>
                      <td className="mono">{money(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>

            {/* 结算段（财务，只读） */}
            <DrawerSection title={`结算阶段（财务 · ${stageOf(current) === '已办结' ? '已办结' : '进行中'}）`}>
              <InfoGrid cols={4}>
                <InfoItem label="已开票" mono>{money(invoicedOf(current))}</InfoItem>
                <InfoItem label="已收款" mono>{money(receivedOf(current))}</InfoItem>
                <InfoItem label="未收余额" mono>{money(netOf(current) - receivedOf(current))}</InfoItem>
                <InfoItem label="办结时间">{current.closedAt ?? '—'}</InfoItem>
              </InfoGrid>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>
                开票 / 收款登记在财务菜单（发票管理、收款管理）操作；本页只读展示进度。
              </div>
              {(current.invoices.length > 0 || current.receipts.length > 0) && (
                <table className="detail-inline-table" style={{ marginTop: 'var(--space-3)' }}>
                  <thead><tr><th>类型</th><th>发票号 / 方式</th><th>金额</th><th>日期</th><th>备注</th></tr></thead>
                  <tbody>
                    {current.invoices.map((i) => (
                      <tr key={i.id}><td>销项发票</td><td className="mono">{i.invoiceNo}</td><td className="mono">{money(i.amount)}</td><td className="mono">{i.date}</td><td className="cell-muted">{i.remark ?? '—'}</td></tr>
                    ))}
                    {current.receipts.map((r) => (
                      <tr key={r.id}><td>客户回款</td><td>{RECEIPT_METHOD_LABELS[r.method]}</td><td className="mono">{money(r.amount)}</td><td className="mono">{r.date}</td><td className="cell-muted">{r.remark ?? '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </DrawerSection>

            {current.adjustments.length > 0 && (
              <DrawerSection title={`差异调整 / 退货冲减（${current.adjustments.length}）`}>
                <table className="detail-inline-table">
                  <thead><tr><th>日期</th><th>金额</th><th>原因</th><th>关联单号</th></tr></thead>
                  <tbody>
                    {current.adjustments.map((a) => (
                      <tr key={a.id}><td className="mono">{a.date}</td><td className="mono" style={{ color: '#CB405D' }}>-{money(a.amount)}</td><td>{a.reason}</td><td className="mono">{a.refCode ?? '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </DrawerSection>
            )}

            <DrawerSection title={`操作记录（${current.ops.length}）`}>
              <table className="detail-inline-table">
                <thead><tr><th style={{ width: 120 }}>时间</th><th style={{ width: 130 }}>操作人</th><th>动作</th><th>说明</th></tr></thead>
                <tbody>
                  {current.ops.map((o, i) => (
                    <tr key={i}><td className="mono">{o.time}</td><td>{o.operator}</td><td>{o.action}</td><td className="cell-muted">{o.detail ?? '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* ── 差异调整 / 冲减 / 异议 弹窗 ── */}
      {dialog && current && (
        <div className="category-dialog-overlay" onClick={() => setDialog(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              {dialog === 'adjust' ? `差异调整 / 退货冲减 · ${current.code}` : `登记异议 · ${current.code}`}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              结算净额 {money(netOf(current))} · 已开票 {money(invoicedOf(current))} · 已收款 {money(receivedOf(current))}
              {dialog === 'adjust' && ' · 冲减后净额减少，已收金额超出净额时需先与客户确认退款'}
              {dialog === 'dispute' && ' · 登记后可调整明细并重新确认'}
            </div>
            {dialog === 'adjust' && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>冲减金额 *</label>
                <input className="filter-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
              </div>
            )}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>{dialog === 'adjust' ? '原因 *（退货单号可填关联单号）' : '异议原因 *'}</label>
              <input className="filter-input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setDialog(null)}>关闭</Button>
              <Button
                disabled={dialog === 'adjust' && (!form.reason.trim() || !(Number(form.amount) > 0)) || dialog === 'dispute' && !form.reason.trim()}
                onClick={() => {
                  if (dialog === 'adjust') run(store.getState().adjustSalesStatement(current.id, { amount: Number(form.amount), reason: form.reason }));
                  else run(store.getState().disputeSalesStatement(current.id, form.reason));
                }}
              >确认</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
