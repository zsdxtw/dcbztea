import { useState, useEffect, type ReactNode } from 'react';
import Button from './Button';

/* ──────────────────────────────────────────────
 * 详情抽屉统一组件
 * 规则：宽度 2/3 视窗（min 1200px），头部展示徽标/编号/标签/副标题，
 * 分类区块标题带模块主色调竖线，底部统一「关闭 + 编辑」/「取消 + 保存」。
 * ────────────────────────────────────────────── */

export type DrawerMode = 'view' | 'edit';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  /** 头部徽标文字（如 "PD"、"SO"），留空不显示徽标 */
  badge?: string;
  /** 主标题（编号 / 名称） */
  title: ReactNode;
  /** 状态标签等右侧标签 */
  statusTag?: ReactNode;
  /** 副标题（仓库名 · 范围 等） */
  subtitle?: ReactNode;
  /** 模式：查看 / 编辑。受控时由父组件传入 */
  mode?: DrawerMode;
  /** 默认模式（非受控） */
  defaultMode?: DrawerMode;
  /** 点击编辑按钮 */
  onEdit?: () => void;
  /** 取消编辑 */
  onCancelEdit?: () => void;
  /** 保存 */
  onSave?: () => void;
  /** 保存按钮禁用 */
  saveDisabled?: boolean;
  /** 是否隐藏底部（自定义底部时用） */
  hideFooter?: boolean;
  /** 自定义底部内容 */
  footer?: ReactNode;
  /** 主体内容 */
  children: ReactNode;
  /** 关闭遮罩点击是否关闭，默认 true */
  closeOnOverlay?: boolean;
}

/** 详情抽屉容器：统一 overlay + panel + 头部 + 主体 + 底部 */
export default function DetailDrawer({
  open,
  onClose,
  badge,
  title,
  statusTag,
  subtitle,
  mode,
  defaultMode = 'view',
  onEdit,
  onCancelEdit,
  onSave,
  saveDisabled,
  hideFooter,
  footer,
  children,
  closeOnOverlay = true,
}: DetailDrawerProps) {
  const [innerMode, setInnerMode] = useState<DrawerMode>(defaultMode);
  const currentMode = mode ?? innerMode;

  useEffect(() => {
    if (open && mode === undefined) setInnerMode(defaultMode);
  }, [open, mode, defaultMode]);

  if (!open) return null;

  const handleEdit = () => {
    if (mode === undefined) setInnerMode('edit');
    onEdit?.();
  };
  const handleCancelEdit = () => {
    if (mode === undefined) setInnerMode('view');
    onCancelEdit?.();
  };

  const defaultFooter = currentMode === 'view' ? (
    <>
      <Button variant="ghost" onClick={onClose}>关闭</Button>
      {onEdit && <Button onClick={handleEdit}>编辑</Button>}
    </>
  ) : (
    <>
      <Button variant="ghost" onClick={handleCancelEdit}>取消</Button>
      <Button onClick={onSave} disabled={saveDisabled}>保存</Button>
    </>
  );

  return (
    <div className="drawer-overlay" onClick={() => closeOnOverlay && onClose()}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="drawer-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {badge && <div className="drawer-header-badge">{badge}</div>}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <span className="drawer-title">{title}</span>
                  {statusTag}
                </div>
                {subtitle && <div className="drawer-header-sub">{subtitle}</div>}
              </div>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* 主体 */}
        <div className="drawer-body">{children}</div>

        {/* 底部（隐藏默认底部的页面若传了自定义 footer，仍渲染自定义内容） */}
        {(!hideFooter || footer) && (
          <div className="drawer-footer">{footer ?? defaultFooter}</div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
 * 子组件
 * ────────────────────────────────────────────── */

/** 详情分类区块：标题带模块主色调竖线 */
export function DrawerSection({
  title,
  children,
  extra,
  style,
}: {
  title: ReactNode;
  children: ReactNode;
  extra?: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <div className="drawer-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title}</span>
        {extra}
      </div>
      <div style={{ marginBottom: 'var(--space-2)' }}>{children}</div>
    </div>
  );
}

/** 详情信息网格（查看态） */
export function InfoGrid({
  cols = 3,
  children,
  style,
}: {
  cols?: 2 | 3 | 4;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  const cls = cols === 2 ? 'cols-2' : cols === 4 ? 'cols-4' : '';
  return <div className={`detail-info-grid ${cls}`} style={style}>{children}</div>;
}

/** 详情信息项 */
export function InfoItem({
  label,
  children,
  span,
  emph,
  mono,
  valueStyle,
}: {
  label: ReactNode;
  children: ReactNode;
  span?: 2 | 3;
  emph?: boolean;
  mono?: boolean;
  valueStyle?: React.CSSProperties;
}) {
  const cls = `detail-info-item${span === 2 ? ' span-2' : span === 3 ? ' span-3' : ''}`;
  const vCls = `detail-info-value${emph ? ' emph' : ''}${mono ? ' mono' : ''}`;
  return (
    <div className={cls}>
      <label className="drawer-label">{label}</label>
      <div className={vCls} style={valueStyle}>{children ?? '—'}</div>
    </div>
  );
}

/** 编辑表单行 */
export function EditRow({
  children,
  stack,
  style,
}: {
  children: ReactNode;
  stack?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`drawer-edit-row${stack ? ' col-stack' : ''}`} style={style}>{children}</div>
  );
}

/** 编辑表单字段 */
export function EditField({
  label,
  children,
  style,
}: {
  label: ReactNode;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="drawer-edit-field" style={style}>
      <label className="drawer-label">{label}</label>
      {children}
    </div>
  );
}

/** 列表操作栏按钮组（查看/编辑/删除） */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="row-actions">{children}</div>;
}

/** 删除按钮（辅色调，用于操作栏） */
export function RowDeleteButton({ onClick, label = '删除' }: { onClick: () => void; label?: string }) {
  return (
    <Button size="sm" variant="ghost" className="btn-row-danger" onClick={onClick}>{label}</Button>
  );
}
