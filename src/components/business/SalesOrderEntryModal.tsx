import OrderEntry from '../../pages/sales/OrderEntry';

/**
 * 新建销售单弹窗（销售单列表 / 销售单处理共用）
 * 弹窗内容与「新建销售单」页面完全一致，保存后订单进入「销售单处理」。
 */
export default function SalesOrderEntryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div
        className="category-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 1180, maxWidth: '94vw', height: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-neutral-200)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>新建销售单</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>销售 / 销售单管理 / 新建销售单</div>
          </div>
          <button className="drawer-close" onClick={onClose} title="关闭">
            <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-5) var(--space-6)' }}>
          <OrderEntry embedded onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
