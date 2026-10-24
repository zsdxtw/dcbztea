import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Toggle from '../../components/common/Toggle';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore, getSelfPurchaseEstimate } from '../../stores/orderFlowStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { usePriceStore } from '../../stores/priceStore';
import { useScoreStore, getScoreSummary } from '../../stores/scoreStore';
import {
  EXTERNAL_PLATFORM_LABELS, EXTERNAL_STATUS_LABELS, EXTERNAL_STATUS_COLORS, TRANSFER_SOURCE_LABELS,
} from '../../data/externalOrders';
import { PARTNER_ORDER_STATUS_LABELS } from '../../data/partner';
import type { ExternalOrder, ExternalOrderItem, ExternalPlatform } from '../../types';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const statusPill = (status: string) => {
  const c = EXTERNAL_STATUS_COLORS[status] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return pill(c.bg, c.color, EXTERNAL_STATUS_LABELS[status] ?? status);
};

const money = (n: number) => `¥${n.toLocaleString()}`;

const PLATFORM_OPTIONS: { value: ExternalPlatform; label: string }[] = [
  { value: 'tmall', label: '天猫' },
  { value: 'jd', label: '京东' },
  { value: 'douyin', label: '抖音' },
  { value: 'pdd', label: '拼多多' },
  { value: 'other', label: '其他平台' },
];

const REPORT_TYPE_LABELS: Record<string, string> = { order: '订单报备', product: '商品报备', customer: '客户报备' };

const SELF_STEPS = [
  { key: 'self_purchasing', label: '生成采购订单' },
  { key: 'self_inbound', label: '到货入库' },
  { key: 'self_outbound', label: '出库发货' },
  { key: 'completed', label: '客户签收' },
];

/** 路径标签 */
function pathLabel(o: ExternalOrder): string {
  if (o.path === 'self') return '自营背对背';
  if (o.transferSource) return TRANSFER_SOURCE_LABELS[o.transferSource];
  if (o.distributeMode === 'grab') return '抢单';
  if (o.distributeMode === 'compare') return '比单';
  return '—';
}

export default function ExternalOrders() {
  const orders = useOrderFlowStore((s) => s.orders);
  const settings = useOrderFlowStore((s) => s.settings);
  const store = useOrderFlowStore;
  const suppliers = useSupplierStore((s) => s.suppliers);
  const products = usePriceStore((s) => s.products);
  const scoreEntries = useScoreStore((s) => s.entries);

  const [filterStatus, setFilterStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** 录入弹窗 */
  const [entering, setEntering] = useState(false);
  const [platform, setPlatform] = useState<ExternalPlatform>('tmall');
  const [externalOrderNo, setExternalOrderNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState('直营客户');
  const [customerRegion, setCustomerRegion] = useState('');
  const [receiver, setReceiver] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<ExternalOrderItem[]>([]);
  const [entryError, setEntryError] = useState('');

  /** 流转设置弹窗 */
  const [showSettings, setShowSettings] = useState(false);

  /** 处理向导局部状态 */
  const [wizard, setWizard] = useState<'path' | 'self' | 'distribute'>('path');
  const [selfSupplier, setSelfSupplier] = useState('');
  const [assignSupplier, setAssignSupplier] = useState('');
  const [compareCandidates, setCompareCandidates] = useState<string[]>([]);

  /** 倒计时ticker */
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    store.getState().expireGrabs();
  }, [store]);

  const activeSuppliers = useMemo(() => suppliers.filter((s) => s.status === 'active'), [suppliers]);
  const scoreOf = (id: string, name: string) => getScoreSummary(scoreEntries, id, name);

  const current = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;

  useEffect(() => {
    if (current) {
      setWizard('path');
      setSelfSupplier('');
      setAssignSupplier('');
      setCompareCandidates([]);
    }
  }, [selectedId]);

  const filtered = useMemo(() => orders.filter((o) => {
    if (keyword && !o.code.includes(keyword) && !o.customerName.includes(keyword) && !o.externalOrderNo.includes(keyword)) return false;
    switch (filterStatus) {
      case '': return true;
      case 'self': return o.path === 'self' && o.processStatus !== 'completed';
      default: return o.processStatus === filterStatus;
    }
  }), [orders, keyword, filterStatus]);

  const countOf = (key: string) => orders.filter((o) => {
    if (key === 'self') return o.path === 'self' && o.processStatus !== 'completed';
    return key === '' ? true : o.processStatus === key;
  }).length;

  const STATUS_TABS = [
    { key: '', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'report_matched', label: '报备命中' },
    { key: 'self', label: '自营中' },
    { key: 'grabbing', label: '抢单中' },
    { key: 'comparing', label: '比单中' },
    { key: 'transferred', label: '已转出' },
    { key: 'completed', label: '已完成' },
  ];

  /* ── 录入 ── */
  const addItemRow = () => {
    const p = products[0];
    if (!p) return;
    setItems((prev) => [...prev, { productId: p.id, productName: p.name, spec: p.spec, quantity: 1, price: p.salesPrice }]);
  };

  const setItemProduct = (idx: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, productId, productName: p.name, spec: p.spec, price: p.salesPrice } : it)));
  };

  const entryTotal = items.reduce((s, it) => s + it.price * it.quantity, 0);

  const confirmEntry = () => {
    if (!externalOrderNo.trim() || !customerName.trim() || !customerRegion.trim() || !receiver.trim()) {
      setEntryError('平台单号、客户名称、客户区域、收货人为必填');
      return;
    }
    if (items.length === 0 || items.some((it) => it.quantity <= 0)) {
      setEntryError('请至少录入一条商品行，且数量大于 0');
      return;
    }
    const order = store.getState().addExternalOrder({
      platform,
      externalOrderNo: externalOrderNo.trim(),
      customerName: customerName.trim(),
      customerType,
      customerRegion: customerRegion.trim(),
      items,
      receiver: receiver.trim(),
      receiverPhone: receiverPhone.trim() || '—',
      receiverAddress: receiverAddress.trim() || '—',
      remark: remark.trim() || undefined,
      operator: '运营人员',
    });
    setEntering(false);
    setExternalOrderNo(''); setCustomerName(''); setCustomerRegion(''); setReceiver(''); setReceiverPhone(''); setReceiverAddress(''); setRemark(''); setItems([]);
    setEntryError('');
    // 命中报备：直接打开处理抽屉确认转出
    if (order.processStatus === 'report_matched') setSelectedId(order.id);
  };

  /* ── 自营供应商比价 ── */
  const selfEstimates = useMemo(
    () => (current ? getSelfPurchaseEstimate(current.items) : []),
    [current],
  );

  /* ── 渲染 ── */
  return (
    <>
      <ContentHeader title="外部订单" breadcrumbs={['销售', '外部订单']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          外部平台订单由运营<strong>手工录入</strong>后自动进行<strong>报备匹配</strong>：命中报备确认后转出合作商；未命中可走<strong>自营背对背</strong>（以销定采）
          或<strong>分发</strong>（指定 / 抢单 · 时间优先 / 比单 · 报价+积分+履约综合评分）。抢单与比单在合作商终端「抢单大厅」进行。
        </div>

        {/* 状态 Tab + 工具栏 */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          {STATUS_TABS.map((t) => (
            <button key={t.key || 'all'} className={`tab-card-simple${filterStatus === t.key ? ' active' : ''}`} onClick={() => setFilterStatus(t.key)}>
              {t.label}
              <span className="tab-card-simple-count">{countOf(t.key)} 单</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="搜索订单编号、客户、平台单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setShowSettings(true)}>流转设置</Button>
            <Button onClick={() => setEntering(true)}>+ 录入外部订单</Button>
          </span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '来源平台', '客户', '商品', '订单金额', '状态', '路径', '合作商', '录入时间', '操作']}
            rows={filtered.map((o) => [
              <span key="c" className="cell-mono-emph">{o.code}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.externalOrderNo}</span></span>,
              <span key="p">{EXTERNAL_PLATFORM_LABELS[o.platform]}</span>,
              <span key="cu" className="cell-emph">{o.customerName}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.customerRegion}</span></span>,
              <span key="i" style={{ whiteSpace: 'nowrap' }}>{o.items[0].productName}{o.items.length > 1 ? ` 等${o.items.length}种` : ''}</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{money(o.totalAmount)}</span>,
              statusPill(o.processStatus),
              <span key="pa" style={{ fontSize: 'var(--text-sm)' }}>{pathLabel(o)}</span>,
              <span key="pt" style={{ fontSize: 'var(--text-sm)' }}>{o.partnerName ?? '—'}</span>,
              <span key="t" className="cell-muted">{o.entryTime}</span>,
              <div key="act" className="row-actions">
                <Button size="sm" variant={o.processStatus === 'completed' ? 'ghost' : undefined} onClick={() => setSelectedId(o.id)}>
                  {o.processStatus === 'completed' ? '查看' : o.processStatus === 'transferred' ? '履约' : '处理'}
                </Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* ── 处理 / 详情抽屉 ── */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="WB"
        title={current?.code ?? ''}
        statusTag={current ? statusPill(current.processStatus) : null}
        subtitle={current ? `${EXTERNAL_PLATFORM_LABELS[current.platform]} · ${current.externalOrderNo} · ${current.customerName}` : ''}
        hideFooter
        footer={<Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>}
      >
        {current && (
          <>
            <DrawerSection title="订单信息">
              <InfoGrid>
                <InfoItem label="订单编号" mono emph>{current.code}</InfoItem>
                <InfoItem label="来源平台">{EXTERNAL_PLATFORM_LABELS[current.platform]}</InfoItem>
                <InfoItem label="平台原始单号" mono>{current.externalOrderNo}</InfoItem>
                <InfoItem label="客户">{current.customerName}（{current.customerType}）</InfoItem>
                <InfoItem label="客户区域">{current.customerRegion}</InfoItem>
                <InfoItem label="订单金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>{money(current.totalAmount)}</InfoItem>
                <InfoItem label="录入时间">{current.entryTime}</InfoItem>
                <InfoItem label="录入人">{current.operator}</InfoItem>
                <InfoItem label="当前路径">{pathLabel(current)}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`商品明细（${current.items.length} 种）`}>
              <table className="detail-inline-table">
                <thead><tr><th>商品名称</th><th>规格</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>
                <tbody>
                  {current.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                      <td>{it.spec}</td>
                      <td className="mono">{it.quantity}</td>
                      <td className="mono">{money(it.price)}</td>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>

            {/* ── 报备命中 ── */}
            {current.processStatus === 'report_matched' && !current.reportIgnored && (
              <DrawerSection title="报备命中（待确认）">
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
                  录入时自动匹配到以下<strong>已审批通过</strong>的报备。默认人工确认后转出{settings.autoTransfer && '（当前已开启自动转单，新录入订单将自动转出）'}。
                </div>
                <table className="detail-inline-table">
                  <thead><tr><th>报备编号</th><th>报备类型</th><th>报备合作商</th><th>说明</th></tr></thead>
                  <tbody>
                    {current.reportMatches?.map((m) => (
                      <tr key={m.reportCode}>
                        <td className="mono">{m.reportCode}</td>
                        <td>{REPORT_TYPE_LABELS[m.reportType]}</td>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>{m.partnerName}</td>
                        <td style={{ color: m.partnerId ? 'inherit' : 'var(--color-neutral-400)' }}>{m.partnerId ? '可转出' : '未关联合作商档案'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                  <Button onClick={() => { store.getState().confirmReportTransfer(current.id); }}>确认转出</Button>
                  <Button variant="ghost" onClick={() => store.getState().ignoreReportMatch(current.id)}>忽略报备，自选路径</Button>
                </div>
              </DrawerSection>
            )}

            {/* ── 待处理：路径选择 ── */}
            {(current.processStatus === 'pending' || (current.processStatus === 'report_matched' && current.reportIgnored)) && (
              <DrawerSection title="分流处理">
                {current.reportIgnored && <div style={{ fontSize: 'var(--text-sm)', color: '#E65100', marginBottom: 'var(--space-2)' }}>已忽略报备命中，走自选路径</div>}
                {wizard === 'path' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <button className={`tab-card-simple`} style={{ padding: 'var(--space-4)', flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left' }} onClick={() => setWizard('self')}>
                      <strong style={{ fontSize: 'var(--text-md)' }}>自营 · 背对背</strong>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>以销定采：生成采购订单 → 到货入库 → 出库发货</span>
                    </button>
                    <button className={`tab-card-simple`} style={{ padding: 'var(--space-4)', flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left' }} onClick={() => setWizard('distribute')}>
                      <strong style={{ fontSize: 'var(--text-md)' }}>分发 · 合作商</strong>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>指定 / 抢单（时间优先）/ 比单（综合评分）</span>
                    </button>
                  </div>
                )}

                {/* 自营：选供应商生成采购单 */}
                {wizard === 'self' && (
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>选择采购供应商（按采购价规则预估采购金额，低价在前）：</div>
                    <table className="detail-inline-table">
                      <thead><tr><th></th><th>供应商</th><th>预估采购金额</th><th>积分</th><th>履约率</th></tr></thead>
                      <tbody>
                        {selfEstimates.slice(0, 6).map((e) => {
                          const s = scoreOf(e.supplierId, e.supplierName);
                          return (
                            <tr key={e.supplierId} style={{ background: selfSupplier === e.supplierId ? 'var(--color-module-current-lightest)' : undefined }}>
                              <td><input type="radio" name="self-supplier" checked={selfSupplier === e.supplierId} onChange={() => setSelfSupplier(e.supplierId)} /></td>
                              <td style={{ fontWeight: 'var(--font-medium)' }}>{e.supplierName}</td>
                              <td className="mono">{money(e.amount)}</td>
                              <td className="mono">{s.total}</td>
                              <td className="mono">{s.ontimeRate}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                      <Button variant="ghost" onClick={() => setWizard('path')}>返回</Button>
                      <Button disabled={!selfSupplier} onClick={() => {
                        const est = selfEstimates.find((e) => e.supplierId === selfSupplier)!;
                        store.getState().chooseSelf(current.id, est.supplierId, est.supplierName);
                      }}>生成采购订单</Button>
                    </div>
                  </div>
                )}

                {/* 分发：三种方式 */}
                {wizard === 'distribute' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      <button className={`tab-card-simple${assignSupplier === '__assign__' ? ' active' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left', padding: 'var(--space-3)' }} onClick={() => setAssignSupplier('__assign__')}>
                        <strong>指定</strong>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>运营直接指定合作商</span>
                      </button>
                      <button className={`tab-card-simple${assignSupplier === '__grab__' ? ' active' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left', padding: 'var(--space-3)' }} onClick={() => setAssignSupplier('__grab__')}>
                        <strong>抢单</strong>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>发布至抢单大厅 · {settings.grabMinutes} 分钟 · 先到先得</span>
                      </button>
                      <button className={`tab-card-simple${assignSupplier === '__compare__' ? ' active' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left', padding: 'var(--space-3)' }} onClick={() => { setAssignSupplier('__compare__'); setCompareCandidates([]); }}>
                        <strong>比单</strong>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>多合作商报价 + 积分 + 履约评分</span>
                      </button>
                    </div>

                    {assignSupplier === '__assign__' && (
                      <div>
                        <table className="detail-inline-table">
                          <thead><tr><th></th><th>合作商</th><th>积分</th><th>履约率</th><th>合作模式</th></tr></thead>
                          <tbody>
                            {activeSuppliers.map((s) => {
                              const sc = scoreOf(s.id, s.name);
                              return (
                                <tr key={s.id}>
                                  <td><input type="radio" name="assign-supplier" checked={compareCandidates[0] === s.id} onChange={() => setCompareCandidates([s.id])} /></td>
                                  <td style={{ fontWeight: 'var(--font-medium)' }}>{s.name}</td>
                                  <td className="mono">{sc.total}</td>
                                  <td className="mono">{sc.ontimeRate}%</td>
                                  <td>{s.types.includes('supplier') ? '供应商' : ''}{s.types.includes('service') ? '服务商' : ''}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                          <Button disabled={compareCandidates.length !== 1} onClick={() => {
                            const s = activeSuppliers.find((x) => x.id === compareCandidates[0])!;
                            store.getState().assignPartner(current.id, s.id, s.name);
                          }}>指定并转出</Button>
                        </div>
                      </div>
                    )}

                    {assignSupplier === '__grab__' && (
                      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>发布后合作商在终端「抢单大厅」抢单，{settings.grabMinutes} 分钟内先到先得，超时无人抢自动退回待处理。</span>
                        <Button onClick={() => store.getState().publishGrab(current.id)}>发布抢单</Button>
                      </div>
                    )}

                    {assignSupplier === '__compare__' && (
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>
                          勾选候选合作商（≥2 家），发起后 {settings.compareMinutes} 分钟内报价，截止后按「报价 {settings.compareWeights.quote}0% + 积分 {settings.compareWeights.score}0% + 履约 {settings.compareWeights.ontime}0%」评分定标。
                        </div>
                        <table className="detail-inline-table">
                          <thead><tr><th></th><th>合作商</th><th>积分</th><th>履约率</th></tr></thead>
                          <tbody>
                            {activeSuppliers.map((s) => {
                              const sc = scoreOf(s.id, s.name);
                              return (
                                <tr key={s.id}>
                                  <td><input type="checkbox" checked={compareCandidates.includes(s.id)} onChange={(e) => setCompareCandidates((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id))} /></td>
                                  <td style={{ fontWeight: 'var(--font-medium)' }}>{s.name}</td>
                                  <td className="mono">{sc.total}</td>
                                  <td className="mono">{sc.ontimeRate}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                          <Button disabled={compareCandidates.length < 2} onClick={() => {
                            store.getState().startCompare(current.id, compareCandidates.map((id) => {
                              const s = activeSuppliers.find((x) => x.id === id)!;
                              return { supplierId: id, supplierName: s.name };
                            }));
                          }}>发起比单</Button>
                        </div>
                      </div>
                    )}

                    {assignSupplier && <Button variant="ghost" style={{ marginTop: 'var(--space-3)' }} onClick={() => { setAssignSupplier(''); setWizard('path'); setCompareCandidates([]); }}>返回路径选择</Button>}
                  </div>
                )}
              </DrawerSection>
            )}

            {/* ── 自营链路 ── */}
            {current.path === 'self' && current.selfChain && (
              <DrawerSection title="自营背对背链路（以销定采）">
                <InfoGrid>
                  <InfoItem label="采购订单" mono>{current.selfChain.purchaseOrderCode}</InfoItem>
                  <InfoItem label="采购供应商">{current.selfChain.supplierName}</InfoItem>
                  <InfoItem label="采购金额" mono>{money(current.selfChain.purchaseAmount)}</InfoItem>
                  <InfoItem label="采购日期">{current.selfChain.purchaseDate}</InfoItem>
                  <InfoItem label="入库单号" mono>{current.selfChain.inboundCode ?? '—'}</InfoItem>
                  <InfoItem label="出库单号" mono>{current.selfChain.outboundCode ?? '—'}</InfoItem>
                </InfoGrid>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {SELF_STEPS.map((st, i) => {
                    const order = ['self_purchasing', 'self_inbound', 'self_outbound', 'completed'];
                    const currentIdx = order.indexOf(current.processStatus);
                    const done = currentIdx > i || current.processStatus === 'completed';
                    return (
                      <span key={st.key} style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: done ? '#E8F5E9' : i === currentIdx ? 'var(--color-module-current-light)' : '#F5F5F5', color: done ? '#01795D' : i === currentIdx ? 'var(--color-module-current-base)' : '#9E9E9E' }}>
                        {i + 1}. {st.label}
                      </span>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                  {current.processStatus === 'self_purchasing' && <Button onClick={() => store.getState().selfInbound(current.id)}>确认到货入库</Button>}
                  {current.processStatus === 'self_inbound' && <Button onClick={() => store.getState().selfOutbound(current.id)}>出库发货</Button>}
                  {current.processStatus === 'self_outbound' && <Button onClick={() => store.getState().selfComplete(current.id)}>确认签收完成</Button>}
                  {current.processStatus === 'completed' && <span style={{ fontSize: 'var(--text-sm)', color: '#01795D' }}>自营链路已完成</span>}
                </div>
              </DrawerSection>
            )}

            {/* ── 抢单中 ── */}
            {current.processStatus === 'grabbing' && current.grabDeadline && (
              <DrawerSection title="抢单进行中（时间优先）">
                <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
                  剩余时间：
                  <strong className="mono" style={{ color: (current.grabDeadline - tick) > 0 ? '#E65100' : '#C62828' }}>
                    {Math.max(0, Math.floor((current.grabDeadline - tick) / 60000))} 分 {Math.max(0, Math.floor(((current.grabDeadline - tick) % 60000) / 1000))} 秒
                  </strong>
                </div>
                {(current.grabRecords?.length ?? 0) > 0 ? (
                  <div style={{ fontSize: 'var(--text-sm)' }}>中单合作商：<strong>{current.grabRecords![0].supplierName}</strong>（{current.grabRecords![0].grabTime}）</div>
                ) : (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无合作商抢单，可等待或在合作商终端「抢单大厅」演示抢单；超时后自动退回待处理</div>
                )}
              </DrawerSection>
            )}

            {/* ── 比单中 ── */}
            {current.processStatus === 'comparing' && current.compare && (
              <DrawerSection title="比单报价中">
                <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
                  候选 {current.compare.candidates.length} 家 · 已报价 <strong className="mono">{current.compare.quotes.length}</strong> 家 · 截止剩余：
                  <strong className="mono" style={{ color: (current.compare.deadline - tick) > 0 ? '#7B1FA2' : '#C62828' }}>
                    {' '}{Math.max(0, Math.floor((current.compare.deadline - tick) / 60000))} 分钟
                  </strong>
                </div>
                <table className="detail-inline-table">
                  <thead><tr><th>候选合作商</th><th>报价</th><th>报价时间</th></tr></thead>
                  <tbody>
                    {current.compare.candidates.map((c) => {
                      const q = current.compare!.quotes.find((x) => x.supplierId === c.supplierId);
                      return (
                        <tr key={c.supplierId}>
                          <td style={{ fontWeight: 'var(--font-medium)' }}>{c.supplierName}</td>
                          <td className="mono">{q ? money(q.amount) : <span style={{ color: 'var(--color-neutral-300)' }}>待报价</span>}</td>
                          <td className="mono">{q?.quoteTime ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>
                  报价与评分明细在「销售 → 比单管理」页定标
                </div>
              </DrawerSection>
            )}

            {/* ── 已转合作商：履约推进 ── */}
            {(current.processStatus === 'transferred' || current.processStatus === 'completed') && current.partnerName && (
              <DrawerSection title="合作商履约">
                <InfoGrid>
                  <InfoItem label="合作商">{current.partnerName}</InfoItem>
                  <InfoItem label="转出方式">{TRANSFER_SOURCE_LABELS[current.transferSource ?? '']}</InfoItem>
                  <InfoItem label="转出时间">{current.transferTime ?? '—'}</InfoItem>
                  <InfoItem label="履约状态">{current.partnerStatus ? PARTNER_ORDER_STATUS_LABELS[current.partnerStatus] : '—'}</InfoItem>
                  {current.processStatus === 'completed' && (
                    <InfoItem label="结算履约">{current.settleOnTime === true ? '按时（积分 +5）' : current.settleOnTime === false ? '超时（积分 -5）' : '—'}</InfoItem>
                  )}
                </InfoGrid>
                {current.processStatus === 'transferred' && (
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                    {current.partnerStatus === 'pending' && <Button onClick={() => store.getState().advancePartner(current.id, 'accepted')}>推进：合作商接单</Button>}
                    {current.partnerStatus === 'accepted' && <Button onClick={() => store.getState().advancePartner(current.id, 'shipping')}>推进：发货</Button>}
                    {current.partnerStatus === 'shipping' && <Button onClick={() => store.getState().advancePartner(current.id, 'delivered')}>推进：客户签收</Button>}
                    {current.partnerStatus === 'delivered' && (
                      <>
                        <Button onClick={() => store.getState().advancePartner(current.id, 'settled', { onTime: true })}>结算（按时 · 积分+5）</Button>
                        <Button variant="danger" onClick={() => store.getState().advancePartner(current.id, 'settled', { onTime: false })}>结算（超时 · 积分-5）</Button>
                      </>
                    )}
                  </div>
                )}
              </DrawerSection>
            )}

            <DrawerSection title="收货信息">
              <InfoGrid>
                <InfoItem label="收货人">{current.receiver}</InfoItem>
                <InfoItem label="联系电话" mono>{current.receiverPhone}</InfoItem>
                <InfoItem label="收货地址" span={3}>{current.receiverAddress}</InfoItem>
                <InfoItem label="备注" span={3}>{current.remark || '—'}</InfoItem>
              </InfoGrid>
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
        )}
      </DetailDrawer>

      {/* ── 录入弹窗 ── */}
      {entering && (
        <div className="category-dialog-overlay" onClick={() => setEntering(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 720, maxWidth: '94vw' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>录入外部平台订单</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              录入保存后系统自动进行<strong>报备匹配</strong>（复用报备审批通过的匹配规则）：命中则进入「报备命中待确认」，未命中进入「待处理」自选路径。
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>来源平台 *</label>
                <select className="filter-input" value={platform} onChange={(e) => setPlatform(e.target.value as ExternalPlatform)} style={{ width: '100%' }}>
                  {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>平台原始单号 *</label>
                <input className="filter-input" placeholder="如 TM-88213907" value={externalOrderNo} onChange={(e) => { setExternalOrderNo(e.target.value); setEntryError(''); }} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>客户类型</label>
                <select className="filter-input" value={customerType} onChange={(e) => setCustomerType(e.target.value)} style={{ width: '100%' }}>
                  {['直营客户', '渠道客户', '平台客户', '个人客户', '带货客户'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>客户名称 *</label>
                <input className="filter-input" placeholder="下单客户" value={customerName} onChange={(e) => { setCustomerName(e.target.value); setEntryError(''); }} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>客户区域 *</label>
                <input className="filter-input" placeholder="如 江苏南京" value={customerRegion} onChange={(e) => { setCustomerRegion(e.target.value); setEntryError(''); }} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>收货人 *</label>
                <input className="filter-input" placeholder="收货人姓名" value={receiver} onChange={(e) => { setReceiver(e.target.value); setEntryError(''); }} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>联系电话</label>
                <input className="filter-input" placeholder="联系电话" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>收货地址</label>
                <input className="filter-input" placeholder="省市区 + 详细地址" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            {/* 商品行 */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>商品明细 *</label>
                <Button size="sm" variant="ghost" onClick={addItemRow}>+ 添加商品行</Button>
              </div>
              {items.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', padding: 'var(--space-2) 0' }}>尚未添加商品行</div>}
              {items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr auto', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                  <select className="filter-input" value={it.productId} onChange={(e) => setItemProduct(idx, e.target.value)} style={{ width: '100%' }}>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}（{p.spec}）</option>)}
                  </select>
                  <input className="filter-input mono" type="number" min={1} value={it.quantity} onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x)))} style={{ width: '100%' }} />
                  <input className="filter-input mono" type="number" min={0} value={it.price} onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))} style={{ width: '100%' }} />
                  <Button size="sm" variant="ghost" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>删除</Button>
                </div>
              ))}
              <div style={{ fontSize: 'var(--text-sm)', textAlign: 'right' }}>
                合计：<strong className="mono" style={{ color: 'var(--color-module-current-base)', fontSize: 'var(--text-md)' }}>{money(entryTotal)}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>备注</label>
              <input className="filter-input" placeholder="订单备注（平台要求、客户要求等）" value={remark} onChange={(e) => setRemark(e.target.value)} style={{ width: '100%' }} />
            </div>

            {entryError && (
              <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{entryError}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setEntering(false)}>取消</Button>
              <Button onClick={confirmEntry}>保存并匹配报备</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 流转设置弹窗 ── */}
      {showSettings && (
        <div className="category-dialog-overlay" onClick={() => setShowSettings(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>订单流转设置</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-neutral-150)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>报备命中自动转单</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>开启后录入订单命中报备即自动转出，无需人工确认</div>
              </div>
              <Toggle active={settings.autoTransfer} onChange={(v) => store.getState().updateSettings({ autoTransfer: v })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-neutral-150)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>抢单时长（分钟）</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>发布抢单后合作商可抢的时间窗口</div>
              </div>
              <input className="filter-input mono" type="number" min={5} value={settings.grabMinutes} onChange={(e) => store.getState().updateSettings({ grabMinutes: Math.max(1, Number(e.target.value) || 30) })} style={{ width: 90 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-neutral-150)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>比单报价时长（分钟）</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>发起比单后候选合作商报价窗口</div>
              </div>
              <input className="filter-input mono" type="number" min={5} value={settings.compareMinutes} onChange={(e) => store.getState().updateSettings({ compareMinutes: Math.max(1, Number(e.target.value) || 30) })} style={{ width: 90 }} />
            </div>
            <div style={{ padding: 'var(--space-3) 0' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>比单评分权重（报价 / 积分 / 履约）</div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                {(['quote', 'score', 'ontime'] as const).map((k) => (
                  <div key={k} style={{ flex: 1 }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{k === 'quote' ? '报价' : k === 'score' ? '积分' : '履约'}</label>
                    <input className="filter-input mono" type="number" min={0} max={10} value={settings.compareWeights[k]}
                      onChange={(e) => store.getState().updateSettings({ compareWeights: { ...settings.compareWeights, [k]: Math.max(0, Number(e.target.value) || 0) } })}
                      style={{ width: '100%' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <Button onClick={() => setShowSettings(false)}>完成</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
