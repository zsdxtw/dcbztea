import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { useScoreStore, getScoreSummary } from '../../stores/scoreStore';
import { EXTERNAL_PLATFORM_LABELS, compareFloorAmount } from '../../data/externalOrders';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 销售 · 比单管理：公开报名制比单的报名跟踪、评分定标与直接选定 */
export default function CompareManage() {
  const orders = useOrderFlowStore((s) => s.orders);
  const settings = useOrderFlowStore((s) => s.settings);
  const store = useOrderFlowStore;
  const scoreEntries = useScoreStore((s) => s.entries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /** 比单相关订单：报名中 + 已定标 */
  const compareOrders = useMemo(
    () => orders.filter((o) => o.compare && (o.processStatus === 'comparing' || o.compare.scored)),
    [orders],
  );

  const current = selectedId ? compareOrders.find((o) => o.id === selectedId) ?? null : null;
  const scoreOf = (id: string, name: string) => getScoreSummary(scoreEntries, id, name);

  const doFinalize = (o: ExternalOrder, force: boolean) => {
    const res = store.getState().finalizeCompare(o.id, force);
    setMsg(res.msg);
    setTimeout(() => setMsg(''), 3000);
  };

  const { quote: wq, score: ws } = settings.compareWeights;

  return (
    <>
      <ContentHeader title="比单管理" breadcrumbs={['销售', '比单管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          比单为<strong>公开报名制</strong>：发起时设定底价（折扣或具体价格），全部合作商可在期限内报名；报名报价默认带出其系统报价（可调但不低于底价）。
          截止后按 <strong>报价 {wq}0% + 积分 {ws}0%</strong> 综合评分，最高分中单进入分发待接单；也可在「订单处理-报名情况」中直接选定合作商（转为指定分发）。
          发起入口：订单处理 → 分流处理 → 分发 · 比单。
        </div>

        {msg && (
          <div style={{ padding: '10px 14px', background: '#E8F5E9', color: '#01795D', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{msg}</div>
        )}

        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '客户', '订单金额', '底价', '报名数', '截止倒计时', '状态', '中单合作商', '操作']}
            rows={compareOrders.map((o) => {
              const cmp = o.compare!;
              const scored = !!cmp.scored;
              const floor = compareFloorAmount(o.totalAmount, cmp.floorRule);
              const remain = cmp.deadline - tick;
              return [
                <span key="c" className="cell-mono-emph">{o.code}</span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="a" className="mono">{money(o.totalAmount)}</span>,
                <span key="f" className="mono" style={{ color: '#B26A00' }}>{money(floor)}</span>,
                <span key="q" className="mono">{cmp.quotes.length}</span>,
                <span key="t" className="mono" style={{ color: remain > 0 ? 'inherit' : '#C62828' }}>
                  {scored ? '—' : remain > 0 ? `${Math.floor(remain / 60000)} 分 ${Math.floor((remain % 60000) / 1000)} 秒` : '已截止'}
                </span>,
                scored ? pill('#E8F5E9', '#01795D', '已定标') : pill('#F3E5F5', '#7B1FA2', '报名中'),
                <span key="w" style={{ fontSize: 'var(--text-sm)', fontWeight: scored ? 'var(--font-semibold)' : 400 }}>
                  {scored ? o.partnerName : '—'}
                </span>,
                <div key="act" className="row-actions">
                  {!scored && cmp.quotes.length > 0 && remain > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => doFinalize(o, true)}>强制定标</Button>
                  )}
                  {!scored && cmp.quotes.length > 0 && remain <= 0 && (
                    <Button size="sm" onClick={() => doFinalize(o, false)}>评分定标</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(o.id)}>{scored ? '查看评分' : '详情'}</Button>
                </div>,
              ];
            })}
          />
          {compareOrders.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无比单会话。在「订单处理」分流处理中选择「分发 · 比单」发起。
            </div>
          )}
        </Card>
      </div>

      {/* 比单详情 / 评分抽屉 */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="BD"
        title={current?.code ?? ''}
        statusTag={current?.compare?.scored ? pill('#E8F5E9', '#01795D', '已定标') : pill('#F3E5F5', '#7B1FA2', '报名中')}
        subtitle={current ? `${EXTERNAL_PLATFORM_LABELS[current.platform]} · ${current.customerName} · 订单金额 ${money(current.totalAmount)}` : ''}
        hideFooter
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>
            {current && !current.compare?.scored && current.compare!.quotes.length > 0 && (
              <Button onClick={() => doFinalize(current, true)}>强制定标</Button>
            )}
          </>
        }
      >
        {current?.compare && (
          <>
            <DrawerSection title="报名规则">
              <InfoGrid>
                <InfoItem label="底价规则">{current.compare.floorNote}</InfoItem>
                <InfoItem label="评分权重">报价 {wq}0% + 积分 {ws}0%</InfoItem>
                <InfoItem label="报名数">{current.compare.quotes.length} 家</InfoItem>
              </InfoGrid>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                综合得分 = (报价分 × {wq} + 积分分 × {ws}) ÷ {wq + ws}（报价越低得分越高；积分取台账总分）
              </div>
            </DrawerSection>

            <DrawerSection title={`报名情况（${current.compare.quotes.length} 家）`}>
              <table className="detail-inline-table">
                <thead>
                  <tr>
                    <th>合作商</th>
                    <th>报名商品</th>
                    <th>报名报价</th>
                    <th>报名时间</th>
                    <th>积分总分</th>
                    <th>报价分</th>
                    <th>积分分</th>
                    <th>综合得分</th>
                  </tr>
                </thead>
                <tbody>
                  {current.compare.quotes.map((q) => {
                    const s = current.compare!.scores?.[q.supplierId];
                    const summary = scoreOf(q.supplierId, q.supplierName);
                    const isWinner = current.compare!.winnerId === q.supplierId;
                    return (
                      <tr key={q.supplierId} style={isWinner ? { background: '#E8F5E9' } : undefined}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>
                          {q.supplierName}
                          {isWinner && <span style={{ marginLeft: 6, color: '#01795D', fontSize: 'var(--text-xs)', fontWeight: 600 }}>中单</span>}
                        </td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>{(q.items ?? ['整单']).join('、')}</td>
                        <td className="mono">{money(q.amount)}</td>
                        <td className="mono">{q.quoteTime}</td>
                        <td className="mono">{summary.total}</td>
                        <td className="mono">{s ? s.quoteScore : '—'}</td>
                        <td className="mono">{s ? s.scoreScore : '—'}</td>
                        <td className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{s ? s.total : '—'}</td>
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
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>按商品定标结果（积分排名第一中单）</div>
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
