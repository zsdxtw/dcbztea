import { useMemo, useState } from 'react';
import Button from '../common/Button';
import { usePriceStore } from '../../stores/priceStore';
import type { ExternalOrderItem } from '../../types';

/** 拆单草稿：预生成阶段的前端履约单，确认前不落库 */
export interface DraftFulfillment {
  id: string;
  /** 该履约单拆出的商品（含数量） */
  items: ExternalOrderItem[];
}

/** 剩余部分虚拟 TAB 的固定 id（分发场景：剩余数量也作为一张可分发履约单） */
export const REMAINDER_DRAFT_ID = '__remainder__';

interface Props {
  /** 原销售单当前可拆商品 */
  items: ExternalOrderItem[];
  drafts: DraftFulfillment[];
  onChange: (drafts: DraftFulfillment[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** 紧凑模式（分发弹窗内使用，缩小表格留白） */
  compact?: boolean;
  /** 外部触发提示（如未生成 TAB 时点击确认拆单） */
  externalError?: string;
  /** 将未拆出的剩余数量作为末尾的虚线 TAB（分发场景） */
  remainderTab?: boolean;
  /** 已确定分发方式的 TAB id（显示已配置标记） */
  configuredIds?: string[];
}

/** 商品明细 + 拆出数量 + 预生成履约单 TAB（销售单处理 / 分发弹窗共用） */
export default function SplitDraftBuilder({ items, drafts, onChange, selectedId, onSelect, compact = false, externalError, remainderTab = false, configuredIds }: Props) {
  const products = usePriceStore((s) => s.products);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');

  const productOf = (it: ExternalOrderItem) =>
    products.find((p) => p.id === it.productId) ?? products.find((p) => p.name === it.productName);

  const draftedOf = (it: ExternalOrderItem) =>
    drafts.reduce((s, d) => s + d.items.filter((x) => x.productId === it.productId).reduce((a, x) => a + x.quantity, 0), 0);

  const remainOf = (it: ExternalOrderItem) => it.quantity - draftedOf(it);

  const remainingItems = useMemo(
    () => items
      .map((it) => ({ ...it, quantity: remainOf(it) }))
      .filter((it) => it.quantity > 0),
    [items, drafts],
  );

  const generatedTotal = drafts.reduce((s, d) => s + d.items.reduce((a, x) => a + x.quantity, 0), 0);
  const totalQty = items.reduce((s, it) => s + it.quantity, 0);
  const selected = drafts.find((d) => d.id === selectedId) ?? null;
  const showRemainderTab = remainderTab && remainingItems.length > 0;
  const selectedRemainder = showRemainderTab && selectedId === REMAINDER_DRAFT_ID;
  const remainderQty = remainingItems.reduce((s, it) => s + it.quantity, 0);

  const generate = () => {
    const picked = items
      .map((it) => ({ it, q: Number(qty[it.productId] ?? 0) }))
      .filter((x) => x.q > 0);
    if (picked.length === 0) { setErr('请至少填写一种商品的拆出数量'); return; }
    const over = picked.find((x) => x.q > remainOf(x.it));
    if (over) { setErr(`${over.it.productName} 拆出数量超出剩余数量（${remainOf(over.it)}）`); return; }
    const draft: DraftFulfillment = {
      id: `draft_${Date.now()}_${drafts.length}`,
      items: picked.map((x) => ({ ...x.it, quantity: x.q })),
    };
    onChange([...drafts, draft]);
    onSelect(draft.id);
    setQty({});
    setErr('');
  };

  /** 快速拆单：按品牌 / 按商品整单分组，直接生成对应数量的预生成 TAB（仅 1 个分组时生成 1 张） */
  const quickSplit = (mode: 'brand' | 'product') => {
    const groups = new Map<string, ExternalOrderItem[]>();
    for (const it of items) {
      const key = mode === 'brand' ? (productOf(it)?.brand ?? '其他') : it.productName;
      groups.set(key, [...(groups.get(key) ?? []), { ...it }]);
    }
    const next: DraftFulfillment[] = [...groups.entries()].map(([, its], i) => ({
      id: `draft_q_${Date.now()}_${i}`,
      items: its,
    }));
    onChange(next);
    onSelect(next[0]?.id ?? null);
    setQty({});
    setErr('');
  };

  const removeDraft = (id: string) => {
    const next = drafts.filter((d) => d.id !== id);
    onChange(next);
    if (selectedId === id) onSelect(next.length === 0 && remainderTab ? REMAINDER_DRAFT_ID : next[0]?.id ?? null);
  };

  return (
    <div>
      <table className="detail-inline-table" style={{ margin: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 44 }}>序号</th>
            <th style={{ width: 60 }}>图片</th>
            <th>商品名称</th>
            <th style={{ width: 100 }}>品牌</th>
            <th style={{ width: 110 }}>规格</th>
            <th style={{ width: 80 }}>数量</th>
            <th style={{ width: 80 }}>已拆出</th>
            <th style={{ width: 80 }}>剩余</th>
            <th style={{ width: 110 }}>本次拆出</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const p = productOf(it);
            const remain = remainOf(it);
            const img = p?.mainImages?.[0];
            return (
              <tr key={`${it.productId}-${i}`}>
                <td className="mono" style={{ color: 'var(--color-neutral-400)' }}>{i + 1}</td>
                <td>
                  {img
                    ? <img src={img} alt={it.productName} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-100)' }} />
                    : <span style={{ display: 'inline-flex', width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-neutral-400)' }}>无图</span>}
                </td>
                <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                <td>{p?.brand ?? '—'}</td>
                <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{it.spec}</td>
                <td className="mono">{it.quantity}</td>
                <td className="mono" style={{ color: draftedOf(it) > 0 ? 'var(--color-module-current-base)' : 'var(--color-neutral-400)' }}>{draftedOf(it)}</td>
                <td className="mono" style={{ color: remain > 0 ? '#9A7A1C' : 'var(--color-neutral-400)' }}>{remain}</td>
                <td>
                  <input
                    className="filter-input mono" type="number" min={0} max={remain} placeholder="0"
                    disabled={remain <= 0}
                    value={qty[it.productId] ?? ''}
                    onChange={(e) => { setQty((f) => ({ ...f, [it.productId]: e.target.value })); setErr(''); }}
                    style={{ width: 90, height: compact ? 28 : 32 }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
          已拆出 {generatedTotal} / {totalQty} 份；
          {remainderTab
            ? '未拆出数量作为末尾的剩余履约单（虚线 TAB），可选中后单独分发'
            : '未拆完的剩余数量会在确认时自动合并为最后一张履约单'}
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>快速拆单：</span>
          <Button size="sm" variant="ghost" onClick={() => quickSplit('brand')}>按品牌拆单</Button>
          <Button size="sm" variant="ghost" onClick={() => quickSplit('product')}>按商品拆单</Button>
          <Button size="sm" onClick={generate}>拆出</Button>
        </span>
      </div>
      {(externalError || err) && <div style={{ marginTop: 'var(--space-2)', padding: '6px 10px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{externalError || err}</div>}

      {/* 预生成履约单 TAB（分发场景末尾追加剩余部分虚线 TAB） */}
      {(drafts.length > 0 || showRemainderTab) && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center', marginTop: 'var(--space-3)' }}>
          {drafts.map((d, i) => (
            <span key={d.id} style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                className={`tab-card-simple${selectedId === d.id ? ' active' : ''}`}
                onClick={() => onSelect(d.id)}
                style={{ padding: '3px 10px', minHeight: 26, fontSize: 'var(--text-xs)' }}
              >
                {configuredIds?.includes(d.id) && <span title="已确定分发方式" style={{ color: '#01795D', marginRight: 3 }}>●</span>}
                履约单{String(i + 1).padStart(2, '0')}
                <span className="tab-card-simple-count">{d.items.reduce((s, x) => s + x.quantity, 0)} 份</span>
              </button>
              <button
                title="删除该拆单，数量归还"
                onClick={(e) => { e.stopPropagation(); removeDraft(d.id); }}
                style={{
                  position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%',
                  border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-0)',
                  color: 'var(--color-neutral-500)', cursor: 'pointer', fontSize: 10, lineHeight: '14px', padding: 0,
                }}
              >×</button>
            </span>
          ))}
          {showRemainderTab && (
            <button
              className={`tab-card-simple${selectedRemainder ? ' active' : ''}`}
              onClick={() => onSelect(REMAINDER_DRAFT_ID)}
              title="未拆出的剩余数量（作为末尾履约单，可单独分发）"
              style={{ padding: '3px 10px', minHeight: 26, fontSize: 'var(--text-xs)', borderStyle: 'dashed' }}
            >
              {configuredIds?.includes(REMAINDER_DRAFT_ID) && <span title="已确定分发方式" style={{ color: '#01795D', marginRight: 3 }}>●</span>}
              {drafts.length === 0 ? '整单（剩余）' : '剩余部分'}
              <span className="tab-card-simple-count">{remainderQty} 份</span>
            </button>
          )}
        </div>
      )}

      {/* 选中履约单的商品明细（含剩余部分） */}
      {(selected || selectedRemainder) && (
        <div style={{ marginTop: 'var(--space-3)', border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-2)' }}>
            {selectedRemainder
              ? '剩余部分 · 商品明细'
              : `履约单${String(drafts.findIndex((d) => d.id === selected!.id) + 1).padStart(2, '0')} · 商品明细`}
          </div>
          <table className="detail-inline-table" style={{ margin: 0 }}>
            <thead><tr><th style={{ width: 44 }}>序号</th><th style={{ width: 60 }}>图片</th><th>商品名称</th><th style={{ width: 100 }}>数量</th></tr></thead>
            <tbody>
              {(selectedRemainder ? remainingItems : selected!.items).map((it, i) => {
                const p = productOf(it);
                const img = p?.mainImages?.[0];
                return (
                  <tr key={`${it.productId}-${i}`}>
                    <td className="mono" style={{ color: 'var(--color-neutral-400)' }}>{i + 1}</td>
                    <td>{img
                      ? <img src={img} alt={it.productName} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      : <span style={{ display: 'inline-flex', width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)' }} />}</td>
                    <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                    <td className="mono">{it.quantity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!remainderTab && remainingItems.length > 0 && drafts.length > 0 && (
        <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
          剩余 {remainingItems.reduce((s, it) => s + it.quantity, 0)} 份（{remainingItems.map((it) => `${it.productName}×${it.quantity}`).join('、')}）将合并为最后一张履约单
        </div>
      )}
    </div>
  );
}
