import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { useScoreStore, getScoreSummary } from '../../stores/scoreStore';
import { EXTERNAL_PLATFORM_LABELS } from '../../data/externalOrders';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 销售 · 比单管理：外部订单比单会话的报价跟踪与评分定标 */
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

  /** 比单相关订单：比单中 + 已定标 */
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

  const { quote: wq, score: ws, ontime: wo } = settings.compareWeights;

  return (
    <>
      <ContentHeader title="比单管理" breadcrumbs={['销售', '比单管理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          比单 = 多家候选合作商对外部订单报价，截止后按 <strong>报价 {wq}0% + 积分 {ws}0% + 履约 {wo}0%</strong> 综合评分，最高分中单（报价越低得分越高；积分取台账汇总；履约取按时发货占比）。
          发起入口在「外部订单」处理向导；报价在合作商终端「抢单大厅」提交。
        </div>

        {msg && (
          <div style={{ padding: '10px 14px', background: '#E8F5E9', color: '#01795D', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{msg}</div>
        )}

        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '客户', '订单金额', '候选 / 已报价', '截止倒计时', '状态', '中单合作商', '操作']}
            rows={compareOrders.map((o) => {
              const quotes = o.compare?.quotes ?? [];
              const scored = !!o.compare?.scored;
              const remain = o.compare ? Math.max(0, o.compare.deadline - tick) : 0;
              return [
                <span key="c" className="cell-mono-emph">{o.code}</span>,
                <span key="cu" className="cell-emph">{o.customerName}</span>,
                <span key="a" className="mono">{money(o.totalAmount)}</span>,
                <span key="q" className="mono">{o.compare?.candidates.length ?? 0} / {quotes.length}</span>,
                <span key="t" className="mono" style={{ color: remain > 0 ? 'inherit' : '#C62828' }}>
                  {scored ? '—' : remain > 0 ? `${Math.floor(remain / 60000)} 分 ${Math.floor((remain % 60000) / 1000)} 秒` : '已截止'}
                </span>,
                scored ? pill('#E8F5E9', '#01795D', '已定标') : pill('#F3E5F5', '#7B1FA2', '报价中'),
                <span key="w" style={{ fontSize: 'var(--text-sm)', fontWeight: scored ? 'var(--font-semibold)' : 400 }}>
                  {scored ? o.partnerName : '—'}
                </span>,
                <div key="act" className="row-actions">
                  {!scored && quotes.length > 0 && (
                    <Button size="sm" disabled={remain > 0} onClick={() => doFinalize(o, false)}>评分定标</Button>
                  )}
                  {!scored && quotes.length > 0 && remain > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => doFinalize(o, true)}>强制定标</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(o.id)}>{scored ? '查看评分' : '详情'}</Button>
                </div>,
              ];
            })}
          />
          {compareOrders.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
              暂无比单会话。在「外部订单」处理向导选择「分发 · 比单」发起。
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
        statusTag={current?.compare?.scored ? pill('#E8F5E9', '#01795D', '已定标') : pill('#F3E5F5', '#7B1FA2', '报价中')}
        subtitle={current ? `${EXTERNAL_PLATFORM_LABELS[current.platform]} · ${current.customerName} · 订单金额 ${money(current.totalAmount)}` : ''}
        hideFooter
        footer={<Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>}
      >
        {current?.compare && (
          <>
            <DrawerSection title="评分规则">
              <InfoGrid>
                <InfoItem label="报价权重">报价越低得分越高（最低报价 = 100 分）</InfoItem>
                <InfoItem label="积分权重">取合作商积分台账总分（拜访/报备/履约/处罚汇总）</InfoItem>
                <InfoItem label="履约权重">取合作商履约率（按时发货占比）</InfoItem>
              </InfoGrid>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                综合得分 = (报价分 × {wq} + 积分分 × {ws} + 履约分 × {wo}) ÷ {wq + ws + wo}
              </div>
            </DrawerSection>

            <DrawerSection title={`候选合作商（${current.compare.candidates.length} 家）`}>
              <table className="detail-inline-table">
                <thead>
                  <tr>
                    <th>合作商</th>
                    <th>报价</th>
                    <th>积分总分</th>
                    <th>履约率</th>
                    <th>报价分</th>
                    <th>积分分</th>
                    <th>履约分</th>
                    <th>综合得分</th>
                  </tr>
                </thead>
                <tbody>
                  {current.compare.candidates.map((c) => {
                    const q = current.compare!.quotes.find((x) => x.supplierId === c.supplierId);
                    const s = current.compare!.scores?.[c.supplierId];
                    const summary = scoreOf(c.supplierId, c.supplierName);
                    const isWinner = current.compare!.winnerId === c.supplierId;
                    return (
                      <tr key={c.supplierId} style={isWinner ? { background: '#E8F5E9' } : undefined}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>
                          {c.supplierName}
                          {isWinner && <span style={{ marginLeft: 6, color: '#01795D', fontSize: 'var(--text-xs)', fontWeight: 600 }}>中单</span>}
                        </td>
                        <td className="mono">{q ? money(q.amount) : <span style={{ color: 'var(--color-neutral-300)' }}>未报价</span>}</td>
                        <td className="mono">{summary.total}</td>
                        <td className="mono">{summary.ontimeRate}%</td>
                        <td className="mono">{s ? s.quoteScore : '—'}</td>
                        <td className="mono">{s ? s.scoreScore : '—'}</td>
                        <td className="mono">{s ? s.ontimeScore : '—'}</td>
                        <td className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{s ? s.total : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
