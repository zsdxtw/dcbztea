/**
 * 采购 · 采购结算（采购结算单确认页，对账阶段 · 应付线）
 * 负责对账阶段的确认：确认对账（合作商终端在线确认为主；未开终端的品牌商等由后台代确认）、登记异议。
 * 结算阶段（收票 / 付款）在财务菜单；本页只读展示其进度。
 * 设计见 docs/销售单结算流程设计建议.md 第六节、9.1（阶段显性化）。
 */
import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import PurchaseStatementCreateDialog from '../../components/business/PurchaseStatementCreateDialog';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useSettlementStore } from '../../stores/settlementStore';
import type { PurchaseStatement } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const STATUS_LABELS: Record<PurchaseStatement['status'], string> = {
  pending: '待确认', confirmed: '已确认', disputed: '有异议', closed: '已办结',
};
const STATUS_VARIANT: Record<PurchaseStatement['status'], 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning', confirmed: 'success', disputed: 'error', closed: 'default',
};
function stageOf(s: PurchaseStatement): '对账中' | '结算中' | '已办结' {
  if (s.status === 'closed') return '已办结';
  if (s.status === 'confirmed') return '结算中';
  return '对账中';
}

type DialogKind = 'dispute' | null;

export default function PurchaseReconciliation() {
  const poDocs = usePurchaseStore((s) => s.docs);
  const purchaseStatements = useSettlementStore((s) => s.purchaseStatements);
  const store = useSettlementStore;
  const [msg, setMsg] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [reason, setReason] = useState('');

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 4500); };
  const run = (res: { ok: boolean; msg: string }) => { flash(res.msg); if (res.ok) setDialog(null); };

  const paidOf = (s: PurchaseStatement) => s.payments.reduce((acc, p) => acc + p.amount, 0);

  const filtered = useMemo(() => purchaseStatements.filter((s) => {
    if (status && s.status !== status) return false;
    const k = keyword.trim();
    if (k && !(s.code.includes(k) || s.supplierName.includes(k) || s.lines.some((l) => l.poCode.includes(k) || l.orderCode.includes(k)))) return false;
    return true;
  }), [purchaseStatements, status, keyword]);

  const current = selectedId ? purchaseStatements.find((s) => s.id === selectedId) ?? null : null;

  const statusPill = (s: PurchaseStatement) => <StatusTag variant={STATUS_VARIANT[s.status]} label={STATUS_LABELS[s.status]} />;

  return (
    <>
      <ContentHeader title="采购结算" breadcrumbs={['采购', '采购结算']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          本页负责采购结算单的<strong>对账阶段</strong>：后台代确认、登记异议（<strong>未开立合作商终端的品牌商等合作商一律由后台代确认</strong>；
          有终端的合作商在终端「结算管理」在线确认）。结算单确认后金额锁定，<strong>结算阶段</strong>（收票登记、付款登记、办结）在财务菜单完成，本页只读展示其进度。
          采购结算单通过「+ 生成采购结算单」弹窗生成；采购单维度的结算状态见「采购单结算」页。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="filter-input" placeholder="搜索结算单号、合作商、采购单号、履约单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 340 }} />
          <span style={{ marginLeft: 'auto' }} />
          <Button onClick={() => setCreateOpen(true)}>+ 生成采购结算单</Button>
          <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map((k) => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
          </select>
        </div>

        <PurchaseStatementCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />

        <Card style={{ padding: 0 }}>
          <Table
            headers={['结算单号', '合作商', '确认方式', '付款节点', '账期', '结算金额', '已收票（财务）', '已付款（财务）', '阶段', '状态', '操作']}
            rows={filtered.map((s) => {
              const stage = stageOf(s);
              const paid = paidOf(s);
              return [
                <span key="c" className="cell-mono-emph">{s.code}</span>,
                <span key="s" className="cell-emph">{s.supplierName}</span>,
                <span key="ht" style={{ fontSize: 'var(--text-xs)', color: s.hasTerminal ? 'var(--color-neutral-500)' : '#E65100', fontWeight: s.hasTerminal ? 400 : 500 }}>{s.hasTerminal ? '终端在线确认' : '后台代确认'}</span>,
                <span key="ps" style={{ fontSize: 'var(--text-xs)' }}>{s.paymentStage === 'prepaid' ? '发货前' : '签收后'}</span>,
                <span key="p" className="cell-muted" style={{ fontSize: 'var(--text-xs)' }}>{s.period}</span>,
                <span key="a" className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(s.amount)}</span>,
                <span key="i" className="mono" style={{ color: s.invoices.length > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(s.invoices.reduce((acc, i) => acc + i.amount, 0))}</span>,
                <span key="pd" className="mono" style={{ color: paid > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(paid)}</span>,
                <span key="st" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: stage === '已办结' ? '#E8F5E9' : stage === '结算中' ? '#FBF3E2' : '#E3F2FD', color: stage === '已办结' ? '#01795D' : stage === '结算中' ? '#9A7A1C' : '#0F64B5', whiteSpace: 'nowrap' }}>{stage}</span>,
                statusPill(s),
                <div key="act" className="row-actions">
                  {s.status === 'pending' && <Button size="sm" onClick={() => run(store.getState().confirmPurchaseStatement(s.id))}>后台代确认</Button>}
                  {s.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => { setSelectedId(s.id); setReason(''); setDialog('dispute'); }}>登记异议</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(s.id)}>查看</Button>
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无采购结算单（在「采购单结算」勾选采购单生成后展示）。
            </div>
          )}
        </Card>
      </div>

      {/* ── 结算单详情抽屉（对账段 + 结算段两段式） ── */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="CG"
        title={current?.code ?? ''}
        statusTag={current ? statusPill(current) : null}
        subtitle={current ? `${current.supplierName} · 阶段：${stageOf(current)} · 付款节点：${current.paymentStage === 'prepaid' ? '发货前（先款后货）' : '签收后'}` : ''}
        footer={current && current.status === 'pending' ? (
          <>
            <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>
            <Button variant="ghost" onClick={() => { setSelectedId(current.id); setReason(''); setDialog('dispute'); }}>登记异议</Button>
            <Button onClick={() => run(store.getState().confirmPurchaseStatement(current.id))}>后台代确认</Button>
          </>
        ) : <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>}
      >
        {current && (
          <>
            {/* 对账段 */}
            <DrawerSection title="对账阶段（业务确认）">
              <InfoGrid cols={4}>
                <InfoItem label="合作商" emph>{current.supplierName}</InfoItem>
                <InfoItem label="合作商终端">{current.hasTerminal ? '已开立（终端在线确认）' : '未开立（后台代确认）'}</InfoItem>
                <InfoItem label="付款节点">{current.paymentStage === 'prepaid' ? '发货前（先款后货）' : '签收后'}</InfoItem>
                <InfoItem label="账期">{current.period}</InfoItem>
                <InfoItem label="结算金额" mono>{money(current.amount)}</InfoItem>
                {current.paymentStage === 'prepaid' && <InfoItem label="发货前应付" mono>{money(current.prepaidAmount ?? 0)}</InfoItem>}
                {current.confirmedBy && <InfoItem label="确认人">{current.confirmedBy}</InfoItem>}
                {current.confirmedAt && <InfoItem label="确认时间">{current.confirmedAt}</InfoItem>}
                {current.disputeReason && <InfoItem label="异议原因" span={2}>{current.disputeReason}</InfoItem>}
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`对账明细（${current.lines.length} 张采购单）`}>
              <table className="detail-inline-table">
                <thead><tr><th>采购单号</th><th>关联履约单</th><th>采购金额</th></tr></thead>
                <tbody>
                  {current.lines.map((l) => (
                    <tr key={l.poId}>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{l.poCode}</td>
                      <td className="mono" style={{ fontSize: 'var(--text-sm)' }}>{l.orderCode}</td>
                      <td className="mono">{money(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>

            {/* 结算段（财务，只读） */}
            <DrawerSection title={`结算阶段（财务 · ${stageOf(current) === '已办结' ? '已办结' : '进行中'}）`}>
              <InfoGrid cols={4}>
                <InfoItem label="已收票" mono>{money(current.invoices.reduce((acc, i) => acc + i.amount, 0))}</InfoItem>
                <InfoItem label="已付款" mono>{money(current.payments.reduce((acc, p) => acc + p.amount, 0))}</InfoItem>
                <InfoItem label="未付余额" mono>{money(current.amount - current.payments.reduce((acc, p) => acc + p.amount, 0))}</InfoItem>
                <InfoItem label="办结时间">{current.closedAt ?? '—'}</InfoItem>
              </InfoGrid>
              {(current.invoices.length > 0 || current.payments.length > 0) && (
                <table className="detail-inline-table" style={{ marginTop: 'var(--space-3)' }}>
                  <thead><tr><th>类型</th><th>发票号 / 账户</th><th>金额</th><th>日期</th><th>备注</th></tr></thead>
                  <tbody>
                    {current.invoices.map((i) => (
                      <tr key={i.id}><td>进项发票</td><td className="mono">{i.invoiceNo}</td><td className="mono">{money(i.amount)}</td><td className="mono">{i.date}</td><td className="cell-muted">—</td></tr>
                    ))}
                    {current.payments.map((p) => (
                      <tr key={p.id}><td>付款</td><td>{p.account ?? '—'}</td><td className="mono">{money(p.amount)}</td><td className="mono">{p.date}</td><td className="cell-muted">{p.remark ?? '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>
                收票 / 付款登记在财务菜单（发票管理、付款管理）操作；本页只读展示进度。采购结算单办结时其下采购单置为已结算。
              </div>
            </DrawerSection>

            <DrawerSection title={`操作记录（${current.ops.length}）`}>
              <table className="detail-inline-table">
                <thead><tr><th style={{ width: 120 }}>时间</th><th style={{ width: 160 }}>操作人</th><th>动作</th><th>说明</th></tr></thead>
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

      {/* ── 登记异议弹窗 ── */}
      {dialog === 'dispute' && current && (
        <div className="category-dialog-overlay" onClick={() => setDialog(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>登记异议 · {current.code}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              登记后可调整明细并重新确认（合作商终端或后台代确认）。
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>异议原因 *</label>
              <input className="filter-input" value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setDialog(null)}>关闭</Button>
              <Button disabled={!reason.trim()} onClick={() => run(store.getState().disputePurchaseStatement(current.id, reason))}>确认</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
