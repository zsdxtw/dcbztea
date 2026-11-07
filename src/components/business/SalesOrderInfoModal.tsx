import { useState } from 'react';
import Button from '../common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { EXTERNAL_STATUS_LABELS, platformLabelOf } from '../../data/externalOrders';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

const infoLabel: React.CSSProperties = { fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' };
const infoValue: React.CSSProperties = { fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' };

/**
 * 母销售单信息弹窗（销售单分发 / 销售单履约「关联销售单」字段点击查看）
 * 展示母销售单（SO）固定信息 + 其下全部履约单概览。
 */
export default function SalesOrderInfoModal({ code, onClose }: { code: string | null; onClose: () => void }) {
  const orders = useOrderFlowStore((s) => s.orders);
  const [tab, setTab] = useState<'info' | 'fulfillments'>('info');

  if (!code) return null;
  const original = orders.find((o) => o.code === code && !o.parentCode) ?? null;
  const fulfillments = original ? orders.filter((o) => o.parentCode === original.code) : [];

  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxWidth: '94vw' }}>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>母销售单 · {code}</div>

        {!original ? (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', padding: 'var(--space-4) 0' }}>
            未找到编号 {code} 的母销售单（可能已被拆分归档或编号有误）。
          </div>
        ) : (
          <>
            {/* Tab:母销售单信息 / 履约单 */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <button className={`tab-card-simple${tab === 'info' ? ' active' : ''}`} style={{ padding: 'var(--space-1) var(--space-3)', transition: 'none' }} onClick={() => setTab('info')}>母销售单信息</button>
              <button className={`tab-card-simple${tab === 'fulfillments' ? ' active' : ''}`} style={{ padding: 'var(--space-1) var(--space-3)', transition: 'none' }} onClick={() => setTab('fulfillments')}>
                子履约单（{fulfillments.length}）
              </button>
            </div>

            {tab === 'info' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div><div style={infoLabel}>母销售单号</div><div className="mono" style={{ ...infoValue, fontWeight: 600 }}>{original.code}</div></div>
                  <div><div style={infoLabel}>销售路径</div><div style={infoValue}>{original.salesPath === 'via_platform' ? '经平台销售' : '直接销售'}</div></div>
                  <div><div style={infoLabel}>来源平台</div><div style={infoValue}>{platformLabelOf(original)}</div></div>
                  <div><div style={infoLabel}>平台母销售单号</div><div className="mono" style={infoValue}>{original.externalOrderNo ?? '—'}</div></div>
                  <div><div style={infoLabel}>客户</div><div style={{ ...infoValue, fontWeight: 600 }}>{original.customerName}</div></div>
                  <div><div style={infoLabel}>客户类型</div><div style={infoValue}>{original.customerType}</div></div>
                  <div><div style={infoLabel}>客户区域</div><div style={infoValue}>{original.customerRegion}</div></div>
                  <div><div style={infoLabel}>收货人</div><div style={infoValue}>{original.receiver} · {original.receiverPhone}</div></div>
                  <div><div style={infoLabel}>订单金额</div><div className="mono" style={{ ...infoValue, fontWeight: 600 }}>{money(original.totalAmount)}</div></div>
                  <div><div style={infoLabel}>客户下单时间</div><div style={infoValue}>{original.customerOrderTime ?? '—'}</div></div>
                  <div><div style={infoLabel}>客户侧订单号</div><div className="mono" style={infoValue}>{original.customerOrderNo ?? '—'}</div></div>
                  {original.platformCustomerName && <div style={{ gridColumn: 'span 2' }}><div style={infoLabel}>平台客户</div><div style={infoValue}>{original.platformCustomerName}</div></div>}
                  <div><div style={infoLabel}>录入时间 / 人</div><div style={infoValue}>{original.entryTime} · {original.operator}</div></div>
                  <div style={{ gridColumn: 'span 3' }}><div style={infoLabel}>收货地址</div><div style={infoValue}>{original.receiverAddress}</div></div>
                  {original.remark && <div style={{ gridColumn: 'span 3' }}><div style={infoLabel}>备注</div><div style={infoValue}>{original.remark}</div></div>}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, margin: 'var(--space-2) 0 var(--space-1)' }}>商品明细（{original.items.length} 种）</div>
                <table className="detail-inline-table">
                  <thead><tr><th>商品名称</th><th>规格</th><th>数量</th><th>销售实价</th><th>小计</th></tr></thead>
                  <tbody>
                    {original.items.map((it, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{it.productName}</td>
                        <td>{it.spec}</td>
                        <td className="mono">{it.quantity}</td>
                        <td className="mono">{money(it.price)}</td>
                        <td className="mono">{money(it.price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <table className="detail-inline-table">
                <thead><tr><th>子履约单号</th><th>供应方式</th><th>履约主体</th><th>金额</th><th>状态</th></tr></thead>
                <tbody>
                  {fulfillments.length === 0 && (
                    <tr><td colSpan={5} style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 'var(--space-3)' }}>尚未生成子履约单（未拆分时母销售单即履约单；整单在途或待分发）</td></tr>
                  )}
                  {fulfillments.map((f: ExternalOrder) => (
                    <tr key={f.id}>
                      <td className="mono" style={{ fontWeight: 500 }}>{f.code}</td>
                      <td>{f.path === 'self' ? '自营' : '转派'}</td>
                      <td>{f.partnerName ?? (f.path === 'self' ? '自营' : '—')}</td>
                      <td className="mono">{money(f.totalAmount)}</td>
                      <td>{EXTERNAL_STATUS_LABELS[f.processStatus] ?? f.processStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
}
