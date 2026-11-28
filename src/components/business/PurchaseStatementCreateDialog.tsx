/**
 * 生成采购结算单弹窗（采购 → 采购结算「生成采购结算单」）
 * 样式参照新建销售单弹窗（通栏标题栏 + 可滚动内容区 + 底部操作栏）。
 * 内容 = 勾选同一合作商的采购单，按付款节点（发货前 / 签收后）生成采购结算单。
 */
import { useMemo, useState } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useSettlementStore, purchaseStatementOfPo } from '../../stores/settlementStore';
import { useSupplierStore } from '../../stores/supplierStore';
import type { PurchaseDoc } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

export default function PurchaseStatementCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const poDocs = usePurchaseStore((s) => s.docs);
  const purchaseStatements = useSettlementStore((s) => s.purchaseStatements);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const store = useSettlementStore;
  const [msg, setMsg] = useState('');
  const [genSupplier, setGenSupplier] = useState('');
  const [genStage, setGenStage] = useState<'prepaid' | 'after_receipt'>('after_receipt');
  const [genPeriod, setGenPeriod] = useState('');
  const [genPicked, setGenPicked] = useState<Set<string>>(new Set());

  const hasTerminal = (supplierId: string) => !!suppliers.find((s) => s.id === supplierId)?.terminal?.enabled;
  const defaultStage = (supplierId: string): 'prepaid' | 'after_receipt' => {
    const st = suppliers.find((x) => x.id === supplierId);
    return st?.settlementMethod === 'prepaid' ? 'prepaid' : 'after_receipt';
  };

  /** 生成候选：所选合作商下、未纳入任何未办结结算单的采购单 */
  const candidates = useMemo(() => {
    if (!genSupplier) return [] as PurchaseDoc[];
    return poDocs.filter((d) => d.supplierId === genSupplier && !purchaseStatementOfPo(purchaseStatements, d.id)?.id);
  }, [genSupplier, poDocs, purchaseStatements]);

  const genAmount = candidates.filter((d) => genPicked.has(d.id)).reduce((s, d) => s + d.amount, 0);
  const genSupplierName = candidates[0]?.supplierName ?? '';
  const genHasTerminal = hasTerminal(genSupplier);

  if (!open) return null;

  const submit = () => {
    if (!genSupplier || genPicked.size === 0) return;
    const res = store.getState().generatePurchaseStatement({
      supplierId: genSupplier,
      supplierName: genSupplierName,
      hasTerminal: genHasTerminal,
      poIds: [...genPicked],
      period: genPeriod,
      paymentStage: genStage,
      prepaidRatio: 100,
    });
    if (res.ok) { onClose(); return; }
    setMsg(res.msg);
  };

  const stageText = (d: PurchaseDoc) => (d.status === 'confirmed' ? '已确认' : d.status === 'delivered' ? '已签收' : d.status === 'received' ? '已入库' : d.status);

  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 1180, maxWidth: '94vw', height: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 通栏标题栏（参照新建销售单弹窗） */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-neutral-200)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>生成采购结算单</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>采购 / 采购结算 · 勾选同一合作商的采购单生成；确认对账在本页列表进行</div>
          </div>
          <button className="drawer-close" onClick={onClose} title="关闭">
            <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* 可滚动内容区 */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 'var(--space-5) var(--space-6)' }}>
          <div style={{ marginBottom: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="filter-select" style={{ minWidth: 220 }} value={genSupplier} onChange={(e) => { setGenSupplier(e.target.value); setGenStage(defaultStage(e.target.value)); setGenPicked(new Set()); }}>
              <option value="">选择合作商</option>
              {suppliers.filter((s) => poDocs.some((d) => d.supplierId === s.id && !purchaseStatementOfPo(purchaseStatements, d.id)?.id)).map((s) => {
                const cnt = poDocs.filter((d) => d.supplierId === s.id && !purchaseStatementOfPo(purchaseStatements, d.id)?.id).length;
                return <option key={s.id} value={s.id}>{s.name}（{cnt} 单{hasTerminal(s.id) ? '' : ' · 未开终端'}）</option>;
              })}
            </select>
            {genSupplier && (
              <>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>付款节点：</span>
                <button className={`tab-card-simple${genStage === 'prepaid' ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setGenStage('prepaid')}>发货前</button>
                <button className={`tab-card-simple${genStage === 'after_receipt' ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setGenStage('after_receipt')}>签收后</button>
                <input className="filter-input" placeholder="账期说明（如 2026-11，仅作参考）" value={genPeriod} onChange={(e) => setGenPeriod(e.target.value)} style={{ width: 220 }} />
                <span style={{ fontSize: 'var(--text-xs)', color: genHasTerminal ? 'var(--color-neutral-400)' : '#E65100', fontWeight: genHasTerminal ? 400 : 500 }}>
                  {genHasTerminal ? '有合作商终端 · 终端在线确认' : '未开合作商终端 · 后台代确认'}
                </span>
              </>
            )}
          </div>

          {genSupplier && candidates.length > 0 && (
            <Card style={{ padding: 0 }}>
              <div style={{ padding: '0 14px 6px' }}>
                <table className="detail-inline-table">
                  <thead>
                    <tr><th style={{ width: 44 }}>纳入</th><th>采购单号</th><th>关联履约单</th><th>状态</th><th>采购金额</th></tr>
                  </thead>
                  <tbody>
                    {candidates.map((d) => {
                      const checked = genPicked.has(d.id);
                      return (
                        <tr key={d.id}>
                          <td style={{ textAlign: 'center' }}>
                            <input type="checkbox" checked={checked} onChange={() => setGenPicked((prev) => { const n = new Set(prev); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n; })} />
                          </td>
                          <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{d.code}</td>
                          <td className="mono" style={{ fontSize: 'var(--text-sm)' }}>{d.childOrderCode}</td>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{stageText(d)}</td>
                          <td className="mono">{money(d.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          {genSupplier && candidates.length === 0 && (
            <div style={{ padding: 'var(--space-5)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>该合作商暂无可纳入结算单的采购单。</div>
          )}
        </div>

        {/* 底部操作栏（参照新建销售单弹窗：左侧错误/摘要，右侧按钮） */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-6)', borderTop: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-0)', flexShrink: 0 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--text-sm)' }}>
            {msg
              ? <span style={{ color: '#C62828' }}>{msg}</span>
              : genPicked.size > 0
                ? <span style={{ color: 'var(--color-neutral-500)' }}>已选 {genPicked.size} 张 · 合计 <strong className="mono">{money(genAmount)}</strong></span>
                : <span style={{ color: 'var(--color-neutral-400)' }}>请选择合作商并勾选待结算采购单</span>}
          </span>
          <span style={{ display: 'flex', gap: 'var(--space-3)', flexShrink: 0 }}>
            <Button variant="ghost" onClick={onClose}>关闭</Button>
            <Button disabled={genPicked.size === 0} onClick={submit}>生成采购结算单</Button>
          </span>
        </div>
      </div>
    </div>
  );
}
