import { useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import StatusTag from '../../components/common/StatusTag';
import FilterBar, { FilterInput, FilterSelect } from '../../components/business/FilterBar';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { TeaCategory } from '../../types';
import type { StatCardData } from '../../types';

/* ── 统计数据 ── */
const stats: StatCardData[] = [
  { label: '调拨单数', value: '8', unit: '单', icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 9h12M12 6l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '调拨中', value: '3', unit: '单', trend: { direction: 'up', value: '+1单' }, icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '已完成', value: '5', unit: '单', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M6 10l2 2 4-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '待审核', value: '2', unit: '单', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v4M9 12.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
];

/* ── 模拟数据 ── */
interface TransferOrder {
  id: string;
  code: string;
  product: string;
  teaCategory: TeaCategory;
  quantity: string;
  fromWarehouse: string;
  toWarehouse: string;
  transferDate: string;
  status: 'pending' | 'transferring' | 'completed';
  operator: string;
  remark: string;
}

const mockTransferOrders: TransferOrder[] = [
  {
    id: '1', code: 'DB-2025-0008', product: '明前龙井', teaCategory: TeaCategory.GREEN,
    quantity: '30 kg', fromWarehouse: '杭州总仓', toWarehouse: '苏州分仓', transferDate: '2025-07-15',
    status: 'transferring', operator: '李仓管', remark: '苏州分仓库存不足，紧急调拨',
  },
  {
    id: '2', code: 'DB-2025-0007', product: '正山小种', teaCategory: TeaCategory.RED,
    quantity: '20 kg', fromWarehouse: '武夷仓区', toWarehouse: '杭州总仓', transferDate: '2025-07-14',
    status: 'transferring', operator: '张仓管', remark: '杭州总仓客户需求增加',
  },
  {
    id: '3', code: 'DB-2025-0006', product: '铁观音', teaCategory: TeaCategory.OOLONG,
    quantity: '25 kg', fromWarehouse: '安溪分仓', toWarehouse: '杭州总仓', transferDate: '2025-07-13',
    status: 'completed', operator: '陈仓管', remark: '常规调拨',
  },
  {
    id: '4', code: 'DB-2025-0005', product: '白毫银针', teaCategory: TeaCategory.WHITE,
    quantity: '15 kg', fromWarehouse: '福鼎分仓', toWarehouse: '杭州总仓', transferDate: '2025-07-12',
    status: 'completed', operator: '陈仓管', remark: '品茗轩订单需要，调拨至总仓发货',
  },
  {
    id: '5', code: 'DB-2025-0004', product: '熟普洱', teaCategory: TeaCategory.DARK,
    quantity: '50 kg', fromWarehouse: '云南总仓', toWarehouse: '杭州总仓', transferDate: '2025-07-11',
    status: 'pending', operator: '刘仓管', remark: '华东区域需求增加，待审核',
  },
  {
    id: '6', code: 'DB-2025-0003', product: '大红袍', teaCategory: TeaCategory.OOLONG,
    quantity: '10 kg', fromWarehouse: '武夷仓区', toWarehouse: '苏州分仓', transferDate: '2025-07-10',
    status: 'transferring', operator: '张仓管', remark: '苏州分仓补货',
  },
];

function transferStatusToVariant(status: string) {
  switch (status) {
    case 'pending': return 'warning' as const;
    case 'transferring': return 'info' as const;
    case 'completed': return 'success' as const;
    default: return 'default' as const;
  }
}

function transferStatusLabel(status: string) {
  switch (status) {
    case 'pending': return '待审核';
    case 'transferring': return '调拨中';
    case 'completed': return '已完成';
    default: return status;
  }
}

export default function InventoryTransfer() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TransferOrder | null>(null);

  const handleView = (order: TransferOrder) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedOrder(null);
  };

  return (
    <>
      <ContentHeader title="库存调拨" breadcrumbs={['仓储', '库存调拨']} actions={<Button><PlusIcon />新建调拨</Button>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <FilterBar>
          <FilterInput placeholder="搜索调拨单号..." />
          <FilterSelect options={['全部状态', '待审核', '调拨中', '已完成']} />
          <FilterSelect options={['调出仓库', '杭州总仓', '武夷仓区', '苏州分仓', '安溪分仓', '福鼎分仓', '云南总仓']} />
          <FilterSelect options={['调入仓库', '杭州总仓', '武夷仓区', '苏州分仓', '安溪分仓', '福鼎分仓', '云南总仓']} />
        </FilterBar>
        <Card>
          <Table
            headers={['调拨单号', '商品', '茶类', '调拨数量', '调出仓库', '调入仓库', '调拨日期', '状态', '操作']}
            rows={mockTransferOrders.map((o) => [
              <span className="cell-mono-emph">{o.code}</span>,
              o.product,
              <Tag category={o.teaCategory} />,
              <span className="mono">{o.quantity}</span>,
              o.fromWarehouse,
              o.toWarehouse,
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{o.transferDate}</span>,
              <StatusTag variant={transferStatusToVariant(o.status)} label={transferStatusLabel(o.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(o)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(o)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 调拨详情抽屉 */}
      <DetailDrawer
        open={showDetail && !!selectedOrder}
        onClose={handleCloseDetail}
        badge="TF"
        title={selectedOrder?.code}
        statusTag={selectedOrder && <StatusTag variant={transferStatusToVariant(selectedOrder.status)} label={transferStatusLabel(selectedOrder.status)} />}
        subtitle={selectedOrder && `${selectedOrder.fromWarehouse} → ${selectedOrder.toWarehouse}`}
        mode="view"
      >
        {selectedOrder && (
          <DrawerSection title="调拨信息">
            <InfoGrid cols={3}>
              <InfoItem label="调拨单号" emph mono>{selectedOrder.code}</InfoItem>
              <InfoItem label="商品">{selectedOrder.product}</InfoItem>
              <InfoItem label="调拨数量" mono>{selectedOrder.quantity}</InfoItem>
              <InfoItem label="调拨日期">{selectedOrder.transferDate}</InfoItem>
              <InfoItem label="调出仓库">{selectedOrder.fromWarehouse}</InfoItem>
              <InfoItem label="调入仓库">{selectedOrder.toWarehouse}</InfoItem>
              <InfoItem label="操作人">{selectedOrder.operator}</InfoItem>
              <InfoItem label="备注" span={3}>{selectedOrder.remark || '—'}</InfoItem>
            </InfoGrid>
          </DrawerSection>
        )}
      </DetailDrawer>
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
