import type { ReactNode } from 'react';

/* ── 页头：眉题 + 衬线大标题 + 描述 + 右侧操作 ── */
interface PageHeadProps {
  eyebrow: string;
  title: string;
  desc?: ReactNode;
  actions?: ReactNode;
}

export function PageHead({ eyebrow, title, desc, actions }: PageHeadProps) {
  return (
    <div className="pk-pagehead">
      <div>
        <div className="pk-eyebrow">{eyebrow}</div>
        <h1 className="pk-title">{title}</h1>
        {desc && <div className="pk-desc">{desc}</div>}
      </div>
      {actions && <div className="pk-pagehead-actions">{actions}</div>}
    </div>
  );
}

/* ── 药丸标签 ── */
export type PillTone = 'green' | 'blue' | 'amber' | 'purple' | 'red' | 'gray';

export function Pill({ tone = 'gray', children }: { tone?: PillTone; children: ReactNode }) {
  return <span className={`pk-pill pk-pill-${tone}`}>{children}</span>;
}

/* ── 状态 → 色调映射 ── */
export const ORDER_STATUS_TONE: Record<string, PillTone> = {
  pending: 'amber', accepted: 'blue', shipping: 'purple',
  delivered: 'green', settled: 'gray', rejected: 'red',
};
export const REPORT_STATUS_TONE: Record<string, PillTone> = {
  pending: 'amber', approved: 'green', rejected: 'red',
};
export const REPORT_TYPE_TONE: Record<string, PillTone> = {
  order: 'blue', product: 'amber', customer: 'purple',
};
export const SETTLE_STATUS_TONE: Record<string, PillTone> = {
  unsettled: 'amber', pending: 'blue', settled: 'green',
};
export const CUSTOMER_TYPE_TONE: Record<string, PillTone> = {
  直营客户: 'green', 平台客户: 'blue', 渠道客户: 'amber', 带货客户: 'purple', 个人客户: 'gray',
};
export const ACCOUNT_ROLE_TONE: Record<string, PillTone> = {
  admin: 'purple', business: 'blue', warehouse: 'amber',
};
