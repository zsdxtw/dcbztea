import { useState, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, CUSTOMER_TYPE_TONE } from './PartnerUI';
import type { PartnerCustomer } from '../../types';
import { partnerCustomers } from '../../data/partner';

/** 合作商客户页：展示合作客户及可下单商品，据此营销当地客户 */
export default function PartnerCustomers() {
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<PartnerCustomer | null>(null);

  const filtered = useMemo(() => partnerCustomers.filter(c => {
    if (keyword && !c.name.includes(keyword) && !c.region.includes(keyword) && !c.contactPerson.includes(keyword)) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  }), [keyword, filterStatus]);

  const statusPill = (status: string) => (
    <Pill tone={status === 'cooperating' ? 'green' : 'amber'}>{status === 'cooperating' ? '合作中' : '已暂停'}</Pill>
  );

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 客户"
        title="客户"
        desc="展示当前合作客户及其可下单商品（含供货价与市场价），合作商可据此开展当地客户营销。"
      />

      {/* 筛选 */}
      <div className="pk-toolbar">
        <input className="filter-input" placeholder="搜索客户名称、区域、联系人..." value={keyword} onChange={e => setKeyword(e.target.value)} />
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="cooperating">合作中</option>
          <option value="paused">已暂停</option>
        </select>
        <span className="pk-count">共 {filtered.length} 家客户</span>
      </div>

      <div className="pk-table-panel">
        <Table
          headers={['客户名称', '客户类型', '区域', '联系人', '联系电话', '可下单商品', '累计订单', '累计金额', '状态', '操作']}
          rows={filtered.map(c => [
            <span key="name" className="cell-emph">{c.name}</span>,
            <Pill key="type" tone={CUSTOMER_TYPE_TONE[c.type] ?? 'gray'}>{c.type}</Pill>,
            <span key="region">{c.region}</span>,
            <span key="cp">{c.contactPerson}</span>,
            <span key="phone" className="mono cell-muted">{c.contactPhone}</span>,
            <span key="prods" className="mono">{c.products.length} 款</span>,
            <span key="orders" className="mono">{c.totalOrders} 单</span>,
            <span key="amt" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--pk-accent)' }}>¥{c.totalAmount.toLocaleString()}</span>,
            statusPill(c.status),
            <div key="act" className="row-actions">
              <Button size="sm" variant="ghost" onClick={() => setSelected(c)}>查看</Button>
            </div>,
          ])}
        />
      </div>

      {/* 客户详情抽屉（含可下单商品表） */}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        badge="PC"
        title={selected?.name ?? ''}
        statusTag={selected ? statusPill(selected.status) : null}
        subtitle={selected ? `${selected.type} · ${selected.region} · 合作起始 ${selected.cooperationDate}` : ''}
      >
        {selected && (
          <>
            <DrawerSection title="客户信息">
              <InfoGrid>
                <InfoItem label="客户名称" emph>{selected.name}</InfoItem>
                <InfoItem label="客户类型">{selected.type}</InfoItem>
                <InfoItem label="所在区域">{selected.region}</InfoItem>
                <InfoItem label="联系人">{selected.contactPerson}</InfoItem>
                <InfoItem label="联系电话" mono>{selected.contactPhone}</InfoItem>
                <InfoItem label="合作起始">{selected.cooperationDate}</InfoItem>
                <InfoItem label="累计订单" mono>{selected.totalOrders} 单</InfoItem>
                <InfoItem label="累计金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>¥{selected.totalAmount.toLocaleString()}</InfoItem>
                <InfoItem label="合作状态">{selected.status === 'cooperating' ? '合作中' : '已暂停'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`可下单商品（${selected.products.length} 款）`}>
              <table className="detail-inline-table">
                <thead>
                  <tr><th>商品名称</th><th>规格</th><th>供货价</th><th>市场价</th><th>价差空间</th></tr>
                </thead>
                <tbody>
                  {selected.products.map(p => {
                    const gap = p.marketPrice - p.supplyPrice;
                    const gapRate = p.marketPrice > 0 ? Math.round((gap / p.marketPrice) * 100) : 0;
                    return (
                      <tr key={p.productId}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>{p.productName}</td>
                        <td>{p.spec}</td>
                        <td className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>¥{p.supplyPrice}</td>
                        <td className="mono">¥{p.marketPrice}</td>
                        <td className="mono" style={{ color: gapRate >= 25 ? '#01795D' : '#9A7A1C' }}>¥{gap}（{gapRate}%）</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                供货价为淡茶半盏给本合作商的结算价，市场价为客户参考零售价，价差空间可用于当地营销定价
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}
