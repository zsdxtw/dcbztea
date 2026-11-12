import { useEffect } from 'react';
import Button from './Button';

interface PaginationProps {
  /** 总条数 */
  total: number;
  page: number;
  pageSize: number;
  onPage: (n: number) => void;
  onPageSize: (n: number) => void;
  /** 条数单位描述（如 张母销售单 / 个客户 / 条记录） */
  label?: string;
}

/** 列表分页条（页码按钮取当前模块主色调；每页 10/20/50 可调，越界自动收敛） */
export default function Pagination({ total, page, pageSize, onPage, onPageSize, label = '条记录' }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) onPage(totalPages);
  }, [page, totalPages]);
  const pageBtn = (n: number) => (
    <button
      key={n}
      onClick={() => onPage(n)}
      style={{
        minWidth: 28, height: 28, padding: '0 6px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        border: `1px solid ${page === n ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
        background: page === n ? 'var(--color-module-current-base)' : 'var(--color-neutral-0)',
        color: page === n ? 'var(--color-neutral-0)' : 'var(--color-neutral-600)',
        fontSize: 'var(--text-sm)', fontWeight: 500, fontFamily: 'var(--font-family-mono)',
      }}
    >
      {n}
    </button>
  );
  if (total === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginRight: 'auto' }}>
        共 {total} {label} · 第 {page} / {totalPages} 页
      </span>
      <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>上一页</Button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => pageBtn(n))}
      <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>下一页</Button>
      <select className="filter-select" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
        <option value={10}>10 条/页</option>
        <option value={20}>20 条/页</option>
        <option value={50}>50 条/页</option>
      </select>
    </div>
  );
}
