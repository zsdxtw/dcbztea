import { useEffect, useMemo, useState } from 'react';
import Button from '../common/Button';
import { previewReportMatch, type ReportMatchPreview } from '../../stores/orderFlowStore';
import { useReportStore } from '../../stores/reportStore';
import type { ExternalOrder, ExternalOrderItem } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

interface Props {
  open: boolean;
  order: ExternalOrder | null;
  items: ExternalOrderItem[];
  onClose: () => void;
  /** 确认匹配：orderReportCode 有值=整单按订单报备转出；无值=按商品/地区报备自动分组 */
  onConfirm: (orderReportCode?: string) => void;
  confirmLabel?: string;
}

/** 报备匹配两步弹窗：订单报备人工确认 → 商品/地区报备自动分组 */
export default function ReportMatchDialog({ open, order, items, onClose, onConfirm, confirmLabel = '匹配并转出' }: Props) {
  const reports = useReportStore((s) => s.reports);
  const [step, setStep] = useState<1 | 2>(1);
  const [orderReportCode, setOrderReportCode] = useState('');
  const [kw, setKw] = useState('');

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setOrderReportCode('');
    setKw('');
  }, [open, order?.id]);

  const preview: ReportMatchPreview = useMemo(
    () => (order ? previewReportMatch({ ...order, items }, items) : { orderReports: [], groups: [], remainderItems: [] }),
    [order, items],
  );

  const approvedOrderReports = useMemo(
    () => reports
      .filter((r) => r.status === 'approved' && r.type === 'order')
      .filter((r) => !kw.trim() || r.code.includes(kw.trim()) || r.title.includes(kw.trim())
        || r.partnerName.includes(kw.trim()) || (r.customerName ?? '').includes(kw.trim())
        || (r.contactPhone ?? '').includes(kw.trim())),
    [reports, kw],
  );

  if (!open || !order) return null;

  const selectedReport = orderReportCode ? reports.find((r) => r.code === orderReportCode) ?? null : null;

  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 860, maxWidth: '94vw' }}>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
          匹配报备 · {order.code}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
          {order.customerName} · {order.customerRegion} · {money(order.totalAmount)} · 共 {items.length} 种商品。
          订单报备优先级最高，请先人工确认是否命中；未命中时再按商品报备 / 地区报备自动匹配。
        </div>

        {/* 步骤条 */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <span className={`tab-card-simple${step === 1 ? ' active' : ''}`} style={{ padding: '4px 12px', minHeight: 28 }}>1. 订单报备</span>
          <span className={`tab-card-simple${step === 2 ? ' active' : ''}`} style={{ padding: '4px 12px', minHeight: 28 }}>2. 商品 / 地区报备</span>
        </div>

        {step === 1 && (
          <>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <input className="filter-input" placeholder="搜索订单报备编号 / 标题 / 合作商 / 客户 / 电话..." value={kw} onChange={(e) => setKw(e.target.value)} style={{ width: 360 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', alignSelf: 'center' }}>共 {approvedOrderReports.length} 条已通过订单报备</span>
            </div>
            <div style={{ maxHeight: '42vh', overflowY: 'auto', border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)' }}>
              <table className="detail-inline-table" style={{ margin: 0 }}>
                <thead><tr><th style={{ width: 40 }}></th><th>报备编号</th><th>标题</th><th>合作商</th><th>客户 / 电话</th><th>命中</th></tr></thead>
                <tbody>
                  <tr>
                    <td><input type="radio" name="order-report" checked={orderReportCode === ''} onChange={() => setOrderReportCode('')} /></td>
                    <td colSpan={5} style={{ fontWeight: 'var(--font-medium)' }}>未命中订单报备（继续按商品 / 地区报备匹配）</td>
                  </tr>
                  {approvedOrderReports.map((r) => {
                    const matched = preview.orderReports.some((m) => m.reportCode === r.code);
                    return (
                      <tr key={r.id} style={matched ? { background: 'var(--color-module-current-lightest)' } : undefined}>
                        <td><input type="radio" name="order-report" checked={orderReportCode === r.code} onChange={() => setOrderReportCode(r.code)} /></td>
                        <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{r.code}</td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>{r.title}</td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>{r.partnerName}</td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>{r.customerName ?? '全部客户'}{r.contactPhone ? ` · ${r.contactPhone}` : ''}</td>
                        <td>{matched ? <span style={{ color: '#01795D', fontWeight: 'var(--font-medium)' }}>系统命中</span> : <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}</td>
                      </tr>
                    );
                  })}
                  {approvedOrderReports.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-4)' }}>暂无已通过的订单报备</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={onClose}>关闭</Button>
              <Button onClick={() => setStep(2)}>下一步</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {selectedReport ? (
              <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', lineHeight: 1.8 }}>
                已确认命中订单报备 <strong className="mono">{selectedReport.code}</strong>（{selectedReport.title}），整单将转出至
                <strong> {selectedReport.partnerName}</strong>，进入「履约单分发 - 转派待接单」。
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>商品 / 地区报备自动匹配结果</div>
                <table className="detail-inline-table" style={{ margin: 0 }}>
                  <thead><tr><th>合作商</th><th>报备类型</th><th>命中报备</th><th>商品</th></tr></thead>
                  <tbody>
                    {preview.groups.map((g) => (
                      <tr key={g.partnerName}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>{g.partnerName}</td>
                        <td>{g.reportType === 'product' ? '商品报备' : '地区报备'}</td>
                        <td className="mono" style={{ fontSize: 'var(--text-sm)' }}>{g.reportCodes.join('、')}</td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>{g.items.map((it) => `${it.productName}×${it.quantity}`).join('、')}</td>
                      </tr>
                    ))}
                    {preview.remainderItems.length > 0 && (
                      <tr>
                        <td style={{ color: 'var(--color-neutral-500)' }}>未匹配</td>
                        <td>—</td>
                        <td>—</td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>{preview.remainderItems.map((it) => `${it.productName}×${it.quantity}`).join('、')}（生成待分发履约单）</td>
                      </tr>
                    )}
                    {preview.groups.length === 0 && preview.remainderItems.length === items.length && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-4)' }}>未匹配到商品 / 地区报备，确认后整单保持待分发</td></tr>
                    )}
                  </tbody>
                </table>
                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', lineHeight: 1.7 }}>
                  匹配到的商品按合作商生成履约单并进入「报备-匹配待确认」；未匹配商品生成 1 张待分发履约单。
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setStep(1)}>上一步</Button>
              <Button variant="ghost" onClick={onClose}>关闭</Button>
              <Button onClick={() => onConfirm(orderReportCode || undefined)}>{confirmLabel}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
