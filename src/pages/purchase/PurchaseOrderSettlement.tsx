/**
 * 采购 · 采购单结算（采购结算单生成页）
 * 按采购单展示结算进度：待预付（先款后货）/ 待结算（签收后）/ 结算中 / 已结算；
 * 勾选同一合作商的采购单生成采购结算单（付款节点默认取合作商档案结算方式，可改）。
 * 采购结算单的确认在「采购 → 采购结算」（终端 / 后台代确认），收票付款在财务。
 * 设计见 docs/销售单结算流程设计建议.md 第六节。
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useSettlementStore, purchaseStatementOfPo, purchasePaidOfPo } from '../../stores/settlementStore';
import { useSupplierStore } from '../../stores/supplierStore';

const money = (n: number) => `¥${n.toLocaleString()}`;

type Tab = 'prepaid' | 'pending' | 'settling' | 'closed';

/** 采购结算进度（派生）：待预付 / 待结算 / 结算中 / 已结算 */
function settleStageOf(
  poStage: 'none' | 'prepaid_open' | 'settling' | 'closed',
): '待预付' | '待结算' | '结算中' | '已结算' {
  if (poStage === 'prepaid_open') return '待预付';
  if (poStage === 'settling') return '结算中';
  if (poStage === 'closed') return '已结算';
  return '待结算';
}

export default function PurchaseOrderSettlement() {
  const navigate = useNavigate();
  const poDocs = usePurchaseStore((s) => s.docs);
  const purchaseStatements = useSettlementStore((s) => s.purchaseStatements);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const store = useSettlementStore;
  const [tab, setTab] = useState<Tab>('pending');
  const [keyword, setKeyword] = useState('');
  const [msg, setMsg] = useState('');
  /** 生成弹窗：按合作商勾选采购单 + 付款节点 */
  const [genSupplier, setGenSupplier] = useState('');
  const [genStage, setGenStage] = useState<'prepaid' | 'after_receipt'>('after_receipt');
  const [genPeriod, setGenPeriod] = useState('');
  const [genPicked, setGenPicked] = useState<Set<string>>(new Set());

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 5000); };

  const hasTerminal = (supplierId: string) => !!suppliers.find((s) => s.id === supplierId)?.terminal?.enabled;
  /** 默认付款节点：先款后货档案 → 发货前；其余 → 签收后 */
  const defaultStage = (supplierId: string): 'prepaid' | 'after_receipt' => {
    const s = suppliers.find((x) => x.id === supplierId);
    return s?.settlementMethod === 'prepaid' ? 'prepaid' : 'after_receipt';
  };

  /** 全部采购单（三种来源）的结算进度归类 */
  const rows = useMemo(() => poDocs.map((d) => {
    const st = purchaseStatementOfPo(purchaseStatements, d.id);
    const paid = purchasePaidOfPo(purchaseStatements, d.id);
    let stage: '待预付' | '待结算' | '结算中' | '已结算';
    if (st?.status === 'closed') stage = '已结算';
    else if (st && st.paymentStage === 'prepaid' && (st.prepaidAmount ?? 0) > 0 && st.payments.reduce((s, p) => s + p.amount, 0) >= (st.prepaidAmount ?? 0) - 0.001 && d.status !== 'delivered') stage = '待预付';
    else if (st) stage = '结算中';
    else if (d.status === 'confirmed' && d.deliveryMode === 'direct') stage = '待预付';
    else stage = '待结算';
    return { po: d, stage, stmt: st, paid };
  }), [poDocs, purchaseStatements]);

  const matchKw = (code: string, name: string) => (!keyword.trim() ? true : code.includes(keyword.trim()) || name.includes(keyword.trim()));

  const shown = rows.filter((r) => {
    if (!matchKw(r.po.code, r.po.supplierName)) return false;
    if (tab === 'prepaid') return r.stage === '待预付';
    if (tab === 'pending') return r.stage === '待结算';
    if (tab === 'settling') return r.stage === '结算中';
    return r.stage === '已结算';
  });

  /** 生成候选：所选合作商下、处于该合作商默认节点且未在未办结结算单中的采购单 */
  const genCandidates = useMemo(() => {
    if (!genSupplier) return [];
    return rows.filter((r) => r.po.supplierId === genSupplier && !r.stmt?.id).map((r) => r.po);
  }, [genSupplier, rows]);

  const genAmount = genCandidates.filter((d) => genPicked.has(d.id)).reduce((s, d) => s + d.amount, 0);
  const genSupplierName = genCandidates[0]?.supplierName ?? '';
  const genHasTerminal = hasTerminal(genSupplier);

  const submitGenerate = () => {
    const res = store.getState().generatePurchaseStatement({
      supplierId: genSupplier,
      supplierName: genSupplierName,
      hasTerminal: genHasTerminal,
      poIds: [...genPicked],
      period: genPeriod,
      paymentStage: genStage,
      prepaidRatio: 100,
    });
    flash(res.msg);
    if (res.ok) { setGenSupplier(''); setGenPicked(new Set()); setGenPeriod(''); }
  };

  const tabBtn = (key: Tab, label: string) => (
    <button key={key} className={`tab-card-simple${tab === key ? ' active' : ''}`} style={{ transition: 'none' }} onClick={() => setTab(key)}>
      {label}
      <span className="tab-card-simple-count">{rows.filter((r) => (key === 'prepaid' ? r.stage === '待预付' : key === 'pending' ? r.stage === '待结算' : key === 'settling' ? r.stage === '结算中' : r.stage === '已结算')).length} 单</span>
    </button>
  );

  return (
    <>
      <ContentHeader title="采购单结算" breadcrumbs={['采购', '采购管理', '采购单结算']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          本页负责<strong>生成采购结算单</strong>（对账阶段的起点）：勾选同一合作商的采购单，按付款节点（发货前 / 签收后）生成。
          付款节点默认取合作商档案结算方式（先款后货 = 发货前）。生成后到「采购 → 采购结算」确认对账（合作商终端在线确认，
          <strong>未开合作商终端的品牌商等由管理后台代确认</strong>）；收票、付款在财务菜单完成；<strong>采购单在采购结算单办结时置为已结算</strong>。
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {tabBtn('prepaid', '待预付')}
          {tabBtn('pending', '待结算')}
          {tabBtn('settling', '结算中')}
          {tabBtn('closed', '已结算')}
          <input className="filter-input" placeholder="搜索采购单号、合作商..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} />
        </div>

        {/* 生成结算单（所选页签下的采购单勾选生成） */}
        {shown.length > 0 && (
          <Card style={{ padding: 0, marginBottom: 'var(--space-4)' }}>
            <div style={{ padding: '10px 14px', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--color-neutral-100)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-neutral-700)' }}>
                {tab === 'prepaid' ? '先款后货：生成发货前结算单' : '生成采购结算单（签收后付款）'}
              </span>
              <select className="filter-select" style={{ minWidth: 220 }} value={genSupplier} onChange={(e) => { setGenSupplier(e.target.value); setGenStage(defaultStage(e.target.value)); setGenPicked(new Set()); }}>
                <option value="">选择合作商</option>
                {[...new Set(shown.map((r) => r.po.supplierId))].map((sid) => {
                  const name = shown.find((r) => r.po.supplierId === sid)!.po.supplierName;
                  const cnt = shown.filter((r) => r.po.supplierId === sid).length;
                  return <option key={sid} value={sid}>{name}（{cnt} 单{hasTerminal(sid) ? '' : ' · 未开终端'}）</option>;
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
            {genSupplier && genCandidates.length > 0 && (
              <div style={{ padding: '0 14px 6px' }}>
                <table className="detail-inline-table">
                  <thead>
                    <tr><th style={{ width: 44 }}>纳入</th><th>采购单号</th><th>关联履约单</th><th>状态</th><th>采购金额</th></tr>
                  </thead>
                  <tbody>
                    {genCandidates.map((d) => {
                      const checked = genPicked.has(d.id);
                      const stage = rows.find((r) => r.po.id === d.id)!.stage;
                      return (
                        <tr key={d.id}>
                          <td style={{ textAlign: 'center' }}>
                            <input type="checkbox" checked={checked} onChange={() => setGenPicked((prev) => { const n = new Set(prev); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n; })} />
                          </td>
                          <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{d.code}</td>
                          <td className="mono" style={{ fontSize: 'var(--text-sm)' }}>{d.childOrderCode}</td>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{d.status === 'confirmed' ? '已确认' : d.status === 'delivered' ? '已签收' : d.status === 'received' ? '已入库' : d.status}</td>
                          <td className="mono">{money(d.amount)}{genStage === 'prepaid' && checked ? `（发货前应付 ${money(Math.round(d.amount * 100 / 100))}）` : ''}</td>
                          <td style={{ display: 'none' }}>{stage}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {genSupplier && genCandidates.length > 0 && (
              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-neutral-100)' }}>
                <span style={{ fontSize: 'var(--text-sm)' }}>已选 {genPicked.size} 张 · 合计 <strong className="mono">{money(genAmount)}</strong></span>
                <Button disabled={genPicked.size === 0} onClick={submitGenerate}>生成采购结算单</Button>
              </div>
            )}
          </Card>
        )}

        <Card style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['采购单号', '合作商', '关联履约单', '来源', '采购金额', '已付金额', '采购结算单', '结算进度'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8pt 10pt', borderBottom: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-50)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.po.id}>
                  <td className="mono" style={{ padding: '7pt 10pt', fontWeight: 500 }}>{r.po.code}</td>
                  <td style={{ padding: '7pt 10pt', fontSize: 'var(--text-sm)' }}>{r.po.supplierName}</td>
                  <td className="mono" style={{ padding: '7pt 10pt', fontSize: 'var(--text-sm)' }}>{r.po.childOrderCode}</td>
                  <td style={{ padding: '7pt 10pt', fontSize: 'var(--text-sm)' }}>{r.po.source === 'distribute' ? '合作商直发' : r.po.deliveryMode === 'direct' ? '以销定采·直发' : '以销定采·入库'}</td>
                  <td className="mono" style={{ padding: '7pt 10pt' }}>{money(r.po.amount)}</td>
                  <td className="mono" style={{ padding: '7pt 10pt', color: r.paid > 0 ? '#01795D' : 'var(--color-neutral-400)' }}>{money(r.paid)}</td>
                  <td className="mono" style={{ padding: '7pt 10pt', fontSize: 'var(--text-xs)' }}>{r.stmt ? `${r.stmt.code}${r.stmt.status !== 'closed' ? '（在途）' : ''}` : '—'}</td>
                  <td style={{ padding: '7pt 10pt' }}>
                    <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: 500, whiteSpace: 'nowrap', background: r.stage === '已结算' ? '#E8F5E9' : r.stage === '结算中' ? '#FBF3E2' : r.stage === '待预付' ? '#E3F2FD' : '#F5F5F5', color: r.stage === '已结算' ? '#01795D' : r.stage === '结算中' ? '#9A7A1C' : r.stage === '待预付' ? '#0F64B5' : 'var(--color-neutral-400)' }}>{r.stage}</span>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>当前分类下暂无采购单</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => navigate('/purchase/purchase-statements')}>去采购结算确认对账 →</Button>
        </div>
      </div>
    </>
  );
}
