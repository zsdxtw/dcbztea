import { useEffect, useMemo, useState } from 'react';
import Button from '../common/Button';
import { reportMatchesOrder } from '../../stores/orderFlowStore';
import { useReportStore, reportActive } from '../../stores/reportStore';
import { REGIONS, getCities, getDistricts } from '../../data/regions';
import type { ExternalOrder, ExternalOrderItem, PartnerReport } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 报备类型标签 */
const TYPE_LABELS: Record<PartnerReport['type'], string> = {
  order: '订单报备',
  product: '商品报备',
  region: '地区报备',
};
/** 报备优先级：订单报备 > 商品报备 > 地区报备（列表排序用） */
const TYPE_PRIORITY: Record<PartnerReport['type'], number> = { order: 0, product: 1, region: 2 };

/** 从订单客户地区 / 收货地址解析省、市（用于默认地区筛选） */
export function orderRegionOf(order: ExternalOrder): { province: string; city: string } {
  const r = order.customerRegion ?? '';
  const addr = order.receiverAddress ?? '';
  const prov = REGIONS.find((pp) => r.startsWith(pp.name) || addr.startsWith(pp.name));
  const city = prov?.cities.find((c) => r.includes(c.name.replace(/市$/, '')) || addr.includes(c.name));
  return { province: prov?.name ?? '', city: city?.name ?? '' };
}

/** 报备地区是否命中筛选（全国 / 不限地区始终通过；路径逐段比对） */
function regionFilterMatch(r: PartnerReport, prov: string, city: string, dist: string): boolean {
  if (!prov) return true;
  if (!r.regions?.length) return true;
  return r.regions.some((p) => {
    if (p === '全国') return true;
    const segs = p.split('/');
    if (segs[0] !== prov) return false;
    if (city && segs[1] && segs[1].replace(/市$/, '') !== city.replace(/市$/, '')) return false;
    if (dist && segs[2] !== dist) return false;
    return true;
  });
}

interface PickerProps {
  order: ExternalOrder;
  items: ExternalOrderItem[];
  checked: string[];
  onCheckedChange: (codes: string[]) => void;
}

/**
 * 报备匹配选择器（可内嵌）：
 * 展示全部已通过报备（订单 / 商品 / 地区，按优先级排序），人工勾选；
 * 「命中提示」列按 reportStore.matchesReport 规则计算仅作参考，不做任何自动流转。
 * 列表上方提供类型筛选、关键字搜索与地区（省市县）筛选，地区默认取订单收货的省市。
 */
export function ReportMatchPicker({ order, items, checked, onCheckedChange }: PickerProps) {
  const reports = useReportStore((s) => s.reports);
  const [typeFilter, setTypeFilter] = useState<'' | PartnerReport['type']>('');
  const [kw, setKw] = useState('');

  /* 地区筛选：默认展示当前订单收货的市 */
  const defaultRegion = useMemo(() => orderRegionOf(order), [order]);
  const [prov, setProv] = useState('');
  const [city, setCity] = useState('');
  const [dist, setDist] = useState('');

  useEffect(() => {
    setTypeFilter('');
    setKw('');
    setProv(defaultRegion.province);
    setCity(defaultRegion.city);
    setDist('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  /** 已通过审批的报备，按优先级 + 提交时间排序 */
  const approved = useMemo(
    () => reports
      .filter((r) => r.status === 'approved' && reportActive(r))
      .sort((a, b) => TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type] || a.submitTime.localeCompare(b.submitTime)),
    [reports],
  );

  const filtered = useMemo(
    () => approved
      .filter((r) => !typeFilter || r.type === typeFilter)
      .filter((r) => regionFilterMatch(r, prov, city, dist))
      .filter((r) => !kw.trim()
        || r.code.includes(kw.trim()) || r.title.includes(kw.trim())
        || r.partnerName.includes(kw.trim()) || (r.customerName ?? '').includes(kw.trim())
        || (r.contactPhone ?? '').includes(kw.trim())
        || (r.regions ?? []).join('/').includes(kw.trim())),
    [approved, typeFilter, prov, city, dist, kw],
  );

  /** 命中提示（仅参考）：报备规则是否命中当前订单商品/地区/客户 */
  const hitOf = (r: PartnerReport) => {
    const pseudo = { ...order, items, totalAmount: items.reduce((s, it) => s + it.price * it.quantity, 0) };
    return reportMatchesOrder(pseudo, r);
  };

  const toggle = (code: string) => {
    onCheckedChange(checked.includes(code) ? checked.filter((x) => x !== code) : [...checked, code]);
  };

  const cityOpts = prov ? getCities(prov).map((c) => c.name) : [];
  const distOpts = prov && city ? getDistricts(prov, city) : [];

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
        <span className={`tab-card-simple${typeFilter === '' ? ' active' : ''}`} onClick={() => setTypeFilter('')}>全部</span>
        <span className={`tab-card-simple${typeFilter === 'order' ? ' active' : ''}`} onClick={() => setTypeFilter('order')}>订单报备</span>
        <span className={`tab-card-simple${typeFilter === 'product' ? ' active' : ''}`} onClick={() => setTypeFilter('product')}>商品报备</span>
        <span className={`tab-card-simple${typeFilter === 'region' ? ' active' : ''}`} onClick={() => setTypeFilter('region')}>地区报备</span>
        <input className="filter-input" placeholder="搜索报备编号 / 标题 / 合作商 / 客户 / 电话..." value={kw} onChange={(e) => setKw(e.target.value)} style={{ width: 240, marginLeft: 'auto' }} />
      </div>

      {/* 地区筛选（省市县），默认展示当前订单收货的市 */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>地区：</span>
        <select className="filter-select" value={prov} onChange={(e) => { setProv(e.target.value); setCity(''); setDist(''); }}>
          <option value="">全部省份</option>
          {REGIONS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <select className="filter-select" disabled={!prov} value={city} onChange={(e) => { setCity(e.target.value); setDist(''); }}>
          <option value="">全部城市</option>
          {cityOpts.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" disabled={!city} value={dist} onChange={(e) => setDist(e.target.value)}>
          <option value="">全部区县</option>
          {distOpts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 条已通过报备 · 已勾选 {checked.length} 条</span>
      </div>

      <div style={{ maxHeight: '38vh', overflowY: 'auto', border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)' }}>
        <table className="detail-inline-table" style={{ margin: 0 }}>
          <thead><tr><th style={{ width: 36 }}></th><th>报备编号</th><th>类型</th><th>标题</th><th>合作商</th><th>客户 / 电话</th><th>地区</th><th>有效期至</th><th>命中提示</th></tr></thead>
          <tbody>
            {filtered.map((r) => {
              const hit = hitOf(r);
              return (
                <tr key={r.id} style={hit ? { background: 'var(--color-module-current-lightest)' } : undefined}>
                  <td><input type="checkbox" checked={checked.includes(r.code)} onChange={() => toggle(r.code)} /></td>
                  <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{r.code}</td>
                  <td>{TYPE_LABELS[r.type]}{r.orderKind === 'no_supply' && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>无货源</span>}</td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{r.title}</td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{r.partnerName}</td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{r.customerName ?? '全部客户'}{r.contactPhone ? ` · ${r.contactPhone}` : ''}</td>
                  <td style={{ fontSize: 'var(--text-xs)' }}>{(r.regions ?? []).join('、') || '不限'}</td>
                  <td className="mono" style={{ fontSize: 'var(--text-sm)' }}>{r.validUntil ?? '长期'}</td>
                  <td>{hit ? <span style={{ color: '#01795D', fontWeight: 'var(--font-medium)' }}>命中</span> : <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-4)' }}>暂无已通过的报备记录（可调整上方地区或类型筛选）</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface DialogProps {
  open: boolean;
  order: ExternalOrder | null;
  items: ExternalOrderItem[];
  onClose: () => void;
  /** 人工确认匹配：reportCodes 为勾选的报备编号，确认后整单直接转出（多选转给首家勾选报备的合作商） */
  onConfirm: (reportCodes: string[]) => void;
  confirmLabel?: string;
}

/**
 * 报备匹配弹窗（纯人工）：
 * 订单进入系统不做自动匹配，由管理员在弹窗中人工查看报备列表并勾选报备记录，
 * 确认后整单直接转出至所选报备合作商，无中间待确认状态。
 */
export default function ReportMatchDialog({ open, order, items, onClose, onConfirm, confirmLabel = '确认匹配并转出' }: DialogProps) {
  const reports = useReportStore((s) => s.reports);
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setChecked([]);
  }, [open, order?.id]);

  if (!open || !order) return null;

  const firstReport = checked.length > 0 ? reports.find((r) => r.code === checked[0]) ?? null : null;

  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 900, maxWidth: '94vw' }}>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
          匹配报备 · {order.code}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
          {order.customerName} · {order.customerRegion} · {money(order.totalAmount)} · 共 {items.length} 种商品。
          报备匹配由人工处理：请查看报备列表并勾选命中的报备记录（「命中提示」仅作参考），确认后整单直接转出至所选报备合作商。
        </div>

        <ReportMatchPicker order={order} items={items} checked={checked} onCheckedChange={setChecked} />

        <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', lineHeight: 1.7 }}>
          {firstReport ? `确认后整单直接转出至「${firstReport.partnerName}」，等待合作商接单；多选时全部勾选报备记录为匹配信息。` : '请至少勾选一条报备记录后确认。'}
          无货源订单报备确认后订单退回待分发，由平台自营或转派供货商。
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
          <Button disabled={checked.length === 0} onClick={() => onConfirm(checked)}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
