/**
 * 销售 · 销售退货（管理后台退货管理）
 * 数据源 = returnStore（与合作商终端退货管理同一数据源，登记 / 受理 / 推进双向同步）。
 * 退货发起关联：销售单（已确收履约单才可发起）；财务（发起时不冲减，详情预告冲减 / 钱包路径）；采购（定位关联采购单）。
 * 退货完成关联：财务 = 冲减所属销售结算单应收（未办结）/ 退货标记（已办结）/ 预付客户退款回钱包；
 * 采购 = 自动定位关联采购单生成采购退货联动记录（单号 / 合作商 / 金额 / 日期）。
 * 设计见 docs/销售单结算流程设计建议.md（退货冲减相关章节）。
 */
import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useReturnStore } from '../../stores/returnStore';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useSettlementStore } from '../../stores/settlementStore';
import { soRootOf } from '../../utils/orderCodes';
import type { PartnerReturn, PartnerReturnStatus } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const STATUS_VARIANT: Record<PartnerReturnStatus, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'warning', accepted: 'info', rejected: 'error', shipped: 'info', received: 'warning', completed: 'success',
};
const STATUS_LABEL: Record<PartnerReturnStatus, string> = {
  pending: '待受理', accepted: '已受理（待寄回）', rejected: '已拒绝', shipped: '客户已寄回', received: '已收货（待处理）', completed: '已完成',
};

type Tab = '' | 'pending' | 'processing' | 'received' | 'completed' | 'rejected';

export default function SalesReturn() {
  const returns = useReturnStore((s) => s.returns);
  const setStatus = useReturnStore((s) => s.setStatus);
  const orders = useOrderFlowStore((s) => s.orders);
  const poDocs = usePurchaseStore((s) => s.docs);
  const salesStatements = useSettlementStore((s) => s.salesStatements);
  const wallets = useSettlementStore((s) => s.wallets);

  const [tab, setTab] = useState<Tab>('');
  const [keyword, setKeyword] = useState('');
  const [view, setView] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 4500); };

  const inTab = (r: PartnerReturn) => {
    if (tab === '') return true;
    if (tab === 'processing') return ['accepted', 'shipped'].includes(r.status);
    return r.status === tab;
  };
  const countOf = (k: Tab) => returns.filter((r) => (k === '' ? true : k === 'processing' ? ['accepted', 'shipped'].includes(r.status) : r.status === k)).length;

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    return returns.filter(inTab).filter((r) => (!kw ? true : r.code.includes(kw) || r.customerName.includes(kw) || r.sourceOrderCode.includes(kw) || r.supplierName.includes(kw)));
  }, [returns, tab, keyword]);

  /** 财务联动推导：所属销售结算单 / 冲减记录 / 办结标记 / 钱包退款 */
  const financeOf = (r: PartnerReturn) => {
    const root = soRootOf(r.sourceOrderCode);
    const stmt = salesStatements.find((s) => s.lines.some((l) => l.orderCode === r.sourceOrderCode || l.orderCode === root || l.orderId === r.sourceOrderCode));
    const adjust = stmt?.adjustments.find((a) => a.refCode === r.code);
    const closedNotice = stmt?.status === 'closed' && stmt.closedReturnNotice?.includes(r.code) ? stmt.closedReturnNotice : undefined;
    const walletTxn = wallets.find((w) => w.customerName === r.customerName)?.txns.find((t) => t.refCode === r.code);
    return { stmt, adjust, closedNotice, walletTxn };
  };

  /** 采购联动推导：退货单采购联动记录 + 关联采购单当前状态 */
  const purchaseOf = (r: PartnerReturn) => {
    const po = poDocs.find((d) => d.childOrderCode === r.sourceOrderCode || d.motherCode === soRootOf(r.sourceOrderCode));
    return { linkage: r.purchaseLinkage, po };
  };

  const act = (r: PartnerReturn, status: PartnerReturnStatus, note: string) => {
    setStatus(r.id, status, note);
    flash(`${r.code} ${STATUS_LABEL[status]}`);
  };

  const tabBtn = (k: Tab, label: string) => (
    <button key={k || 'all'} className={`tab-card-simple${tab === k ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setTab(k)}>
      {label}
      <span className="tab-card-simple-count">{countOf(k)}</span>
    </button>
  );

  const current = returns.find((r) => r.id === view) ?? null;

  return (
    <>
      <ContentHeader
        title="销售退货"
        breadcrumbs={['销售', '销售退货']}
        actions={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>退货发起在合作商终端「退货管理」登记（管理后台受理推进）</span>}
      />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          退货单由合作商终端登记（管理后台同步可见、可受理推进）。<strong>退货完成（退款类）自动联动</strong>：
          财务侧冲减所属销售结算单应收（已办结结算单改为退货标记待处理；预付客户退款回预存钱包）；
          采购侧定位关联采购单生成<strong>采购退货联动记录</strong>。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {([['', '全部'], ['pending', '待受理'], ['processing', '处理中'], ['received', '已收货'], ['completed', '已完成'], ['rejected', '已拒绝']] as const).map(([k, label]) => tabBtn(k, label))}
          <input className="filter-input" placeholder="搜索退货单号、客户、销售单号、合作商..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 300 }} />
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['退货单号', '关联销售单', '客户', '处理合作商', '退货商品', '退款金额', '处理方案', '状态', '财务联动', '采购联动', '操作']}
            rows={filtered.map((r2) => {
              const fin = financeOf(r2);
              const pur = purchaseOf(r2);
              const finText = r2.status === 'rejected' ? '已驳回'
                : fin.closedNotice ? '办结后退货待处理'
                  : fin.adjust ? `已冲减 ${money(fin.adjust.amount)}`
                    : fin.walletTxn ? '已退回钱包'
                      : r2.status === 'completed' ? '—' : '完成后冲减';
              return [
                <span key="c" className="cell-mono-emph">{r2.code}</span>,
                <span key="o" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r2.sourceOrderCode}</span>,
                <span key="t" className="cell-emph">{r2.customerName}</span>,
                <span key="s" style={{ fontSize: 'var(--text-sm)' }}>{r2.supplierName}</span>,
                <span key="i" style={{ fontSize: 'var(--text-sm)' }}>{r2.items.map((it) => `${it.productName}×${it.quantity}`).join('、')}</span>,
                <span key="a" className="mono" style={{ color: '#CB405D', fontWeight: 'var(--font-medium)' }}>{money(r2.refundAmount)}</span>,
                <StatusTag key="sl" variant={r2.solution === 'refund' ? 'warning' : 'info'} label={r2.solution === 'refund' ? '退款' : '换货'} />,
                <StatusTag key="st" variant={STATUS_VARIANT[r2.status]} label={STATUS_LABEL[r2.status]} />,
                <span key="f" style={{ fontSize: 'var(--text-xs)', color: fin.closedNotice ? '#E65100' : fin.adjust || fin.walletTxn ? '#01795D' : 'var(--color-neutral-400)' }}>{finText}</span>,
                <span key="pu" className="mono" style={{ fontSize: 'var(--text-xs)', color: pur.linkage ? 'var(--color-neutral-800)' : 'var(--color-neutral-400)' }}>
                  {pur.linkage ? `${pur.linkage.poCode}（退货 ${money(pur.linkage.amount)}）` : r2.status === 'completed' ? '—' : '待定位'}
                </span>,
                <div key="act" className="row-actions">
                  {r2.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => act(r2, 'accepted', '管理后台受理 · 通知客户寄回')}>受理</Button>
                      <Button size="sm" variant="ghost" onClick={() => act(r2, 'rejected', '管理后台核实后拒绝')}>拒绝</Button>
                    </>
                  )}
                  {r2.status === 'received' && (
                    <Button size="sm" onClick={() => act(r2, 'completed', r2.solution === 'refund' ? '质检通过 · 退款完成（自动冲减应收 / 采购联动）' : '换货补发完成')}>完成处理</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setView(r2.id)}>查看</Button>
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>当前分类下暂无退货单</div>
          )}
        </Card>
      </div>

      {/* 退货详情抽屉 */}
      <DetailDrawer
        open={!!current}
        onClose={() => setView(null)}
        badge="TH"
        title={current?.code}
        statusTag={current && <StatusTag variant={STATUS_VARIANT[current.status]} label={STATUS_LABEL[current.status]} />}
        subtitle={current && `${current.customerName} · ${current.supplierName} · ${current.applyTime}`}
        mode="view"
      >
        {current && (() => {
          const fin = financeOf(current);
          const pur = purchaseOf(current);
          const poStage = pur.po ? (pur.po.status === 'settled' ? '已结算' : pur.po.status === 'delivered' ? '已签收' : pur.po.status) : null;
          return (
            <>
              <DrawerSection title="退货信息">
                <InfoGrid cols={4}>
                  <InfoItem label="退货单号" emph mono>{current.code}</InfoItem>
                  <InfoItem label="关联销售单" mono>{current.sourceOrderCode}</InfoItem>
                  <InfoItem label="客户" emph>{current.customerName}</InfoItem>
                  <InfoItem label="处理合作商">{current.supplierName}</InfoItem>
                  <InfoItem label="处理方案"><StatusTag variant={current.solution === 'refund' ? 'warning' : 'info'} label={current.solution === 'refund' ? '退款' : '换货'} /></InfoItem>
                  <InfoItem label="退款金额" mono valueStyle={{ color: '#CB405D', fontWeight: 'var(--font-semibold)' }}>{money(current.refundAmount)}</InfoItem>
                  <InfoItem label="发起日期">{current.applyTime}</InfoItem>
                  <InfoItem label="状态"><StatusTag variant={STATUS_VARIANT[current.status]} label={STATUS_LABEL[current.status]} /></InfoItem>
                  {current.items.map((it, i) => (
                    <InfoItem key={i} label={`退货商品${current.items.length > 1 ? i + 1 : ''}`} span={2} emph>{it.productName}（{it.spec}）× {it.quantity} · 单价 {money(it.price)}</InfoItem>
                  ))}
                </InfoGrid>
                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', lineHeight: 1.7 }}>
                  退货原因：{current.reason}
                </div>
              </DrawerSection>

              <DrawerSection title="财务联动">
                <InfoGrid cols={4}>
                  <InfoItem label="所属销售结算单" mono>{fin.stmt ? fin.stmt.code : '—（未纳入结算单）'}</InfoItem>
                  <InfoItem label="结算单状态">{fin.stmt ? (fin.stmt.status === 'closed' ? '已办结' : fin.stmt.status === 'confirmed' ? '已确认' : fin.stmt.status === 'disputed' ? '有异议' : '待确认') : '—'}</InfoItem>
                  {fin.adjust && <InfoItem label="应收冲减" span={2} mono emph>已冲减 {money(fin.adjust.amount)}（{fin.adjust.reason}）</InfoItem>}
                  {fin.closedNotice && <InfoItem label="办结后退货标记" span={2} emph valueStyle={{ color: '#E65100' }}>{fin.closedNotice}</InfoItem>}
                  {fin.walletTxn && <InfoItem label="预存钱包退款" span={2} mono emph>已退回钱包 {money(fin.walletTxn.amount)}</InfoItem>}
                  {current.status !== 'completed' && !fin.adjust && (
                    <InfoItem label="完成时处理" span={2} valueStyle={{ color: 'var(--color-neutral-500)' }}>
                      退款类退货完成时自动冲减{fin.stmt ? `结算单 ${fin.stmt.code}` : '所属对账单'}应收{current.customerName && '；预付客户退款回预存钱包'}
                    </InfoItem>
                  )}
                </InfoGrid>
              </DrawerSection>

              <DrawerSection title="采购联动">
                <InfoGrid cols={4}>
                  <InfoItem label="关联采购单" mono emph>{pur.po ? pur.po.code : '—'}</InfoItem>
                  <InfoItem label="合作商">{pur.po?.supplierName ?? current.supplierName}</InfoItem>
                  <InfoItem label="采购单状态">{poStage ?? '—'}</InfoItem>
                  {pur.linkage && <InfoItem label="采购退货联动" span={2} mono emph>退货 {money(pur.linkage.amount)}（{pur.linkage.date}）</InfoItem>}
                </InfoGrid>
                {!pur.po && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>
                    未定位到关联采购单（如全库存直发或种子外订单），完成时不生成采购退货联动。
                  </div>
                )}
              </DrawerSection>

              <DrawerSection title="处理轨迹">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {current.history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
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
