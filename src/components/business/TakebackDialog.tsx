import { useEffect, useState } from 'react';
import Button from '../common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import type { ExternalOrder } from '../../types';

/**
 * 履约单取回弹窗（履约单履约 / 履约单分发共用）
 * 流程：默认整体（取回数量＝全部且置灰）→ 点「部分取回」后可编辑数量，按钮变为「确认部分取回」。
 */
export default function TakebackDialog({ order, onClose, onDone }: {
  order: ExternalOrder | null;
  onClose: () => void;
  /** 取回成功回调（用于页面顶部提示） */
  onDone?: (msg: string) => void;
}) {
  const [partial, setPartial] = useState(false);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (order) {
      setPartial(false);
      setQty(Object.fromEntries(order.items.map((it) => [it.productName, String(it.quantity)])));
      setMsg('');
    }
  }, [order]);

  if (!order) return null;

  const submit = (all: boolean) => {
    const parts = all
      ? undefined
      : order.items
        .map((it) => ({ productName: it.productName, quantity: Number(qty[it.productName]) || 0 }))
        .filter((p) => p.quantity > 0);
    const res = useOrderFlowStore.getState().recallPendingOrder(order.id, parts);
    if (res.ok) {
      onDone?.(res.msg);
      onClose();
    } else {
      setMsg(res.msg);
    }
  };

  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div className="category-dialog" style={{ width: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 4 }}>取回订单 · {order.code}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
          从 <strong>{order.path === 'self' ? '自营' : (order.partnerName ?? '合作商')}</strong> 取回，取回后进入履约单分发。
          整体取回时履约单编号不变；部分取回时<strong>剩余部分沿用原编号 {order.code}</strong>，取回部分按规则生成新履约单。
        </div>
        <table className="detail-inline-table">
          <thead><tr><th>商品名称</th><th>规格</th><th>订单数量</th><th>取回数量</th></tr></thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.productName}>
                <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                <td>{it.spec}</td>
                <td className="mono">{it.quantity}</td>
                <td>
                  <input
                    className="filter-input mono"
                    type="number"
                    min={0}
                    max={it.quantity}
                    disabled={!partial}
                    value={qty[it.productName] ?? ''}
                    onChange={(e) => setQty((prev) => ({ ...prev, [it.productName]: e.target.value }))}
                    style={{ width: 96, height: 30, background: partial ? undefined : 'var(--color-neutral-50)', color: partial ? undefined : 'var(--color-neutral-400)', cursor: partial ? undefined : 'not-allowed' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {msg && (
          <div style={{ marginTop: 'var(--space-3)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#FFF3E0', color: '#B26A00' }}>{msg}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
          <Button onClick={() => submit(true)}>整体取回</Button>
          {partial ? (
            <Button
              style={{ background: 'var(--color-module-current-secondary)', borderColor: 'var(--color-module-current-secondary)', color: '#fff' }}
              onClick={() => submit(false)}
            >确认部分取回</Button>
          ) : (
            <Button
              style={{ background: 'var(--color-module-current-secondary)', borderColor: 'var(--color-module-current-secondary)', color: '#fff' }}
              onClick={() => setPartial(true)}
            >部分取回</Button>
          )}
        </div>
      </div>
    </div>
  );
}
