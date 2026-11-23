import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { useScoreStore, getScoreSummary } from '../../stores/scoreStore';
import { compareFloorAmount, platformLabelOf } from '../../data/externalOrders';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 销售履约单号：子履约单取自身编号；未拆分的销售单本身即履约单，按规则展示为 LY01 */
const fulfillmentCodeOf = (o: ExternalOrder): string => (o.parentCode ? o.code : `${o.code}LY01`);
/** 销售单编号：子履约单指向母销售单；未拆分时为自身 */
const salesOrderCodeOf = (o: ExternalOrder): string => o.parentCode ?? o.code;

const pad = (n: number) => String(n).padStart(2, '0');
const dateOf = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const dateTimeOf = (ts: number) => {
  const d = new Date(ts);
  return `${dateOf(ts)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 比单阶段：报名中（含已截止）/ 已定标 / 已取消 / 已结束 */
type CmpPhase = 'comparing' | 'scored' | 'cancelled' | 'ended';
const phaseOf = (o: ExternalOrder): CmpPhase => {
  if (o.processStatus === 'cancelled') return 'cancelled';
  if (o.compare?.scored) return 'scored';
  if (o.processStatus === 'comparing') return 'comparing';
  return 'ended';
};
const PHASE_STYLE: Record<CmpPhase, { bg: string; color: string }> = {
  comparing: { bg: '#F3E5F5', color: '#7B1FA2' },
  scored: { bg: '#E8F5E9', color: '#01795D' },
  cancelled: { bg: '#F5F5F5', color: '#9E9E9E' },
  ended: { bg: '#F5F5F5', color: '#9E9E9E' },
};

/** 销售 · 比单管理：过去及正在进行的所有比单履约单，支持筛选与查看报名 / 中单情况 */
export default function CompareManage() {
  const orders = useOrderFlowStore((s) => s.orders);
  const settings = useOrderFlowStore((s) => s.settings);
  const store = useOrderFlowStore;
  const scoreEntries = useScoreStore((s) => s.entries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [tick, setTick] = useState(Date.now());

  /** 列表筛选：关键字 / 比单阶段 / 客户 / 报名截止日期范围 */
  const [keyword, setKeyword] = useState('');
  const [phase, setPhase] = useState<CmpPhase | ''>('');
  const [customer, setCustomer] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /** 比单履约单：含比单会话的履约单；已拆分的母销售单由其子履约单代表（避免重复展示） */
  const compareOrders = useMemo(() => {
    const motherCodes = new Set(orders.map((o) => o.parentCode).filter(Boolean) as string[]);
    return orders
      .filter((o) => o.compare && (o.parentCode || !motherCodes.has(o.code)))
      .sort((a, b) => Number(phaseOf(b) === 'comparing') - Number(phaseOf(a) === 'comparing')
        || (b.compare?.deadline ?? 0) - (a.compare?.deadline ?? 0));
  }, [orders]);

  const customerOpts = useMemo(() => [...new Set(compareOrders.map((o) => o.customerName))], [compareOrders]);

  const filtered = useMemo(() => compareOrders.filter((o) => {
    const cmp = o.compare!;
    if (phase && phaseOf(o) !== phase) return false;
    if (customer && o.customerName !== customer) return false;
    const k = keyword.trim();
    if (k) {
      const hit = o.code.includes(k) || (o.parentCode ?? '').includes(k) || o.customerName.includes(k)
        || cmp.quotes.some((q) => q.supplierName.includes(k)) || (o.partnerName ?? '').includes(k);
      if (!hit) return false;
    }
    const d = dateOf(cmp.deadline);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  }), [compareOrders, phase, customer, keyword, dateFrom, dateTo]);

  const current = selectedId ? compareOrders.find((o) => o.id === selectedId) ?? null : null;
  const scoreOf = (id: string, name: string) => getScoreSummary({ entries: scoreEntries, supplierId: id, supplierName: name });

  /** 比单状态文案（报名中按截止时间细分为报名中 / 已截止） */
  const statusTextOf = (o: ExternalOrder): string => {
    const p = phaseOf(o);
    if (p === 'comparing') return (o.compare?.deadline ?? 0) > tick ? '报名中' : '已截止';
    return { scored: '已定标', cancelled: '已取消', ended: '已结束', comparing: '报名中' }[p];
  };
  const statusPill = (o: ExternalOrder) => {
    const p = phaseOf(o);
    const c = PHASE_STYLE[p];
    return pill(c.bg, c.color, statusTextOf(o));
  };

  /** 中单合作商：已定标履约单取履约主体；缺省回退按商品定标结果去重 */
  const winnerTextOf = (o: ExternalOrder): string => {
    if (!o.compare?.scored) return '—';
    if (o.partnerName) return o.partnerName;
    const names = [...new Set(Object.values(o.compare.itemAwards ?? {}))];
    return names.length ? names.join('、') : '—';
  };

  const doFinalize = (o: ExternalOrder, force: boolean) => {
    const res = store.getState().finalizeCompare(o.id, force);
    setMsg(res.msg);
    setTimeout(() => setMsg(''), 3000);
  };
  const doExtend = (o: ExternalOrder) => {
    store.getState().extendCompare(o.id, 10);
    setMsg(`已延长 ${fulfillmentCodeOf(o)} 报名 10 分钟`);
    setTimeout(() => setMsg(''), 3000);
  };

  const { quote: wq, score: ws } = settings.compareWeights;

  return (
    <>
      <ContentHeader title="比单管理" breadcrumbs={['销售', '销售单管理', '比单管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          展示<strong>过去及正在进行</strong>的全部比单履约单：比单为<strong>公开报名制</strong>，发起时设定底价，全部合作商可在期限内报名（报价不得低于底价）。
          截止后按 <strong>报价 {wq}0% + 积分 {ws}0%</strong> 综合评分定标，也可直接选定合作商（转为指定转派）。
          查看可浏览报名合作商、评分明细与中单合作商；报名中的比单可在详情内延长报名或强制定标。
        </div>

        {msg && (
          <div style={{ padding: '10px 14px', background: '#E8F5E9', color: '#01795D', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{msg}</div>
        )}

        {/* 列表前常规字段筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <input
            className="filter-input"
            placeholder="搜索履约单号/销售单号、客户、报名或中单合作商..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 320 }}
          />
          <select className="filter-select" value={phase} onChange={(e) => setPhase(e.target.value as CmpPhase | '')}>
            <option value="">全部比单状态</option>
            <option value="comparing">报名中（含已截止）</option>
            <option value="scored">已定标</option>
            <option value="cancelled">已取消</option>
            <option value="ended">已结束</option>
          </select>
          <select className="filter-select" value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="">全部客户</option>
            {customerOpts.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>报名截止</span>
          <input type="date" className="filter-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>至</span>
          <input type="date" className="filter-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>共 {filtered.length} 条</span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['销售履约单号', '销售单号', '客户', '订单金额', '底价', '报名合作商', '中单合作商', '比单状态', '报名截止', '操作']}
            rows={filtered.map((o) => {
              const cmp = o.compare!;
              const floor = compareFloorAmount(o.totalAmount, cmp.floorRule);
              const remain = cmp.deadline - tick;
              const ongoing = o.processStatus === 'comparing';
              return [
                <span key="c" className="cell-mono-emph" style={{ whiteSpace: 'nowrap' }}>{fulfillmentCodeOf(o)}</span>,
                <span key="so" className="mono" style={{ fontSize: 'var(--text-sm)' }}>{salesOrderCodeOf(o)}</span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="a" className="mono">{money(o.totalAmount)}</span>,
                <span key="f" className="mono" style={{ color: '#B26A00' }}>{money(floor)}</span>,
                <span key="q" style={{ fontSize: 'var(--text-sm)' }}>
                  {cmp.quotes.length > 0 ? `${cmp.quotes.length} 家` : '—'}
                  {cmp.quotes.length > 0 && (
                    <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                      {cmp.quotes.map((q) => q.supplierName).join('、')}
                    </span>
                  )}
                </span>,
                <span key="w" style={{ fontSize: 'var(--text-sm)', fontWeight: cmp.scored ? 'var(--font-medium)' : 400 }}>
                  {winnerTextOf(o)}
                </span>,
                statusPill(o),
                <span key="t" className="mono" style={{ fontSize: 'var(--text-sm)', color: ongoing && remain <= 0 ? '#C62828' : undefined }}>
                  {dateTimeOf(cmp.deadline)}
                  {ongoing && (
                    <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 400, color: remain > 0 ? '#7B1FA2' : '#C62828' }}>
                      {remain > 0
                        ? `剩余 ${Math.floor(remain / 60000)} 分 ${Math.floor((remain % 60000) / 1000)} 秒`
                        : '已截止'}
                    </span>
                  )}
                </span>,
                <div key="act" className="row-actions">
                  {ongoing && cmp.quotes.length > 0 && remain > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => doFinalize(o, true)}>强制定标</Button>
                  )}
                  {ongoing && cmp.quotes.length > 0 && remain <= 0 && (
                    <Button size="sm" onClick={() => doFinalize(o, false)}>评分定标</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(o.id)}>查看</Button>
                </div>,
              ];
            })}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              {compareOrders.length === 0
                ? '暂无比单记录。在「履约单分发」分发处理中选择「分发 · 比单」发起。'
                : '无符合筛选条件的比单履约单。'}
            </div>
          )}
        </Card>
      </div>

      {/* 比单详情：报名情况 / 评分明细 / 中单结果 / 商品明细 / 处理轨迹 */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="BD"
        title={current ? fulfillmentCodeOf(current) : ''}
        statusTag={current ? statusPill(current) : null}
        subtitle={current ? `销售单 ${salesOrderCodeOf(current)} · ${platformLabelOf(current)} · ${current.customerName} · 订单金额 ${money(current.totalAmount)}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>
            {current && current.processStatus === 'comparing' && (
              <Button variant="ghost" onClick={() => doExtend(current)}>延长报名 10 分钟</Button>
            )}
            {current && current.processStatus === 'comparing' && current.compare!.quotes.length > 0 && (
              <Button onClick={() => doFinalize(current, true)}>强制定标</Button>
            )}
          </>
        }
      >
        {current?.compare && (
          <>
            <DrawerSection title="比单情况">
              <InfoGrid cols={4}>
                <InfoItem label="比单状态">{statusPill(current)}</InfoItem>
                <InfoItem label="底价规则">{current.compare.floorNote}</InfoItem>
                <InfoItem label="报名截止" mono>{dateTimeOf(current.compare.deadline)}</InfoItem>
                <InfoItem label="报名数">{current.compare.quotes.length} 家</InfoItem>
                <InfoItem label="评分权重">报价 {wq}0% + 积分 {ws}0%</InfoItem>
                <InfoItem label="报名范围">
                  {current.compare.region
                    ? [current.compare.region.province, current.compare.region.city, current.compare.region.district].filter(Boolean).join(' ')
                    : '不限地区'}
                </InfoItem>
                <InfoItem label="中单合作商" emph>{winnerTextOf(current)}</InfoItem>
              </InfoGrid>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                综合得分 = (报价分 × {wq} + 积分分 × {ws}) ÷ {wq + ws}（报价越低得分越高；积分取台账总分）
              </div>
            </DrawerSection>

            <DrawerSection title={`报名情况（${current.compare.quotes.length} 家）`}>
              <table className="detail-inline-table">
                <thead>
                  <tr>
                    <th>报名合作商</th>
                    <th>报名商品</th>
                    <th>报名报价</th>
                    <th>积分总分</th>
                    <th>报价分</th>
                    <th>积分分</th>
                    <th>综合得分</th>
                    <th>报名时间</th>
                  </tr>
                </thead>
                <tbody>
                  {current.compare.quotes.map((q) => {
                    const s = current.compare!.scores?.[q.supplierId];
                    const summary = scoreOf(q.supplierId, q.supplierName);
                    const wonItems = current.compare!.itemAwards
                      ? Object.entries(current.compare!.itemAwards).filter(([, p]) => p === q.supplierName).map(([item]) => item)
                      : [];
                    const isWinner = current.compare!.winnerId === q.supplierId || wonItems.length > 0;
                    return (
                      <tr key={q.supplierId} style={isWinner ? { background: '#E8F5E9' } : undefined}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>
                          {q.supplierName}
                          {isWinner && <span style={{ marginLeft: 6, color: '#01795D', fontSize: 'var(--text-xs)', fontWeight: 600 }}>中单</span>}
                          {wonItems.length > 0 && wonItems.length < current.items.length && (
                            <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 400, color: '#01795D' }}>中单商品：{wonItems.join('、')}</span>
                          )}
                        </td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>{(q.items ?? ['整单']).join('、')}</td>
                        <td className="mono">{money(q.amount)}</td>
                        <td className="mono">{summary.total}</td>
                        <td className="mono">{s ? s.quoteScore : '—'}</td>
                        <td className="mono">{s ? s.scoreScore : '—'}</td>
                        <td className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{s ? s.total : '—'}</td>
                        <td className="mono">{q.quoteTime}</td>
                      </tr>
                    );
                  })}
                  {current.compare.quotes.length === 0 && (
                    <tr><td colSpan={8} style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 'var(--space-3)' }}>暂无合作商报名</td></tr>
                  )}
                </tbody>
              </table>
              {current.compare.scored && current.compare.itemAwards && Object.keys(current.compare.itemAwards).length > 0 && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>按商品定标结果（中单合作商）</div>
                  <table className="detail-inline-table">
                    <thead><tr><th>商品</th><th>中单合作商</th></tr></thead>
                    <tbody>
                      {Object.entries(current.compare.itemAwards).map(([item, partner]) => (
                        <tr key={item}>
                          <td style={{ fontWeight: 'var(--font-medium)' }}>{item}</td>
                          <td>{partner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DrawerSection>

            <DrawerSection title="商品明细">
              <table className="detail-inline-table">
                <thead><tr><th>商品名称</th><th>规格</th><th>数量</th><th>单价</th></tr></thead>
                <tbody>
                  {current.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                      <td>{it.spec}</td>
                      <td className="mono">{it.quantity}</td>
                      <td className="mono">{money(it.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </>
  );
}
