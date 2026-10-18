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
  { label: '出库单数', value: '31', unit: '单', trend: { direction: 'up', value: '+5单' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 14V4M5 8l4-4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '出库总量', value: '12,800', unit: 'kg', trend: { direction: 'up', value: '+5.2%' }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { label: '待出库', value: '5', unit: '单', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '今日出库', value: '4', unit: '单', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v6M6 9h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
];

/* ── 模拟数据 ── */
interface OutboundOrder {
  id: string;
  outboundCode: string;
  salesCode: string;
  customer: string;
  product: string;
  teaCategory: TeaCategory;
  quantity: string;
  warehouse: string;
  outboundDate: string;
  status: 'pending' | 'outbound' | 'completed';
  contactPerson: string;
  contactPhone: string;
  remark: string;
  items: { name: string; spec: string; quantity: string; unitPrice: string; amount: string }[];
}

const mockOutboundOrders: OutboundOrder[] = [
  {
    id: '1', outboundCode: 'CK-2025-0091', salesCode: 'SO-2025-0238', customer: '华茗堂茶庄', product: '正山小种', teaCategory: TeaCategory.RED,
    quantity: '30 kg', warehouse: '武夷仓区', outboundDate: '2025-07-15', status: 'completed',
    contactPerson: '李经理', contactPhone: '138-8001-1001', remark: '加急发货，顺丰冷链',
    items: [{ name: '正山小种', spec: '特级 250g/罐', quantity: '120 罐', unitPrice: '¥480', amount: '¥57,600' }],
  },
  {
    id: '2', outboundCode: 'CK-2025-0090', salesCode: 'SO-2025-0237', customer: '雅韵茶社', product: '碧螺春', teaCategory: TeaCategory.GREEN,
    quantity: '20 kg', warehouse: '苏州分仓', outboundDate: '2025-07-14', status: 'completed',
    contactPerson: '张经理', contactPhone: '139-8002-2002', remark: '常规发货',
    items: [{ name: '碧螺春', spec: '一级 250g/袋', quantity: '80 袋', unitPrice: '¥420', amount: '¥33,600' }],
  },
  {
    id: '3', outboundCode: 'CK-2025-0089', salesCode: 'SO-2025-0236', customer: '清心茶坊', product: '凤凰单丛', teaCategory: TeaCategory.OOLONG,
    quantity: '40 kg', warehouse: '安溪分仓', outboundDate: '2025-07-14', status: 'outbound',
    contactPerson: '王经理', contactPhone: '137-8003-3003', remark: '冷链运输，注意温控',
    items: [{ name: '凤凰单丛', spec: '特级 250g/盒', quantity: '160 盒', unitPrice: '¥560', amount: '¥89,600' }],
  },
  {
    id: '4', outboundCode: 'CK-2025-0088', salesCode: 'SO-2025-0235', customer: '品茗轩', product: '白毫银针', teaCategory: TeaCategory.WHITE,
    quantity: '50 kg', warehouse: '福鼎分仓', outboundDate: '2025-07-13', status: 'completed',
    contactPerson: '陈经理', contactPhone: '136-8004-4004', remark: '精品包装，需防潮',
    items: [{ name: '白毫银针', spec: '特级 100g/罐', quantity: '500 罐', unitPrice: '¥960', amount: '¥480,000' }],
  },
  {
    id: '5', outboundCode: 'CK-2025-0087', salesCode: 'SO-2025-0234', customer: '翠竹茶行', product: '六堡茶', teaCategory: TeaCategory.DARK,
    quantity: '25 kg', warehouse: '云南总仓', outboundDate: '2025-07-12', status: 'pending',
    contactPerson: '刘经理', contactPhone: '135-8005-5005', remark: '常规发货',
    items: [{ name: '六堡茶', spec: '二级 500g/袋', quantity: '50 袋', unitPrice: '¥180', amount: '¥9,000' }],
  },
  {
    id: '6', outboundCode: 'CK-2025-0086', salesCode: 'SO-2025-0233', customer: '茗香斋', product: '君山银针', teaCategory: TeaCategory.YELLOW,
    quantity: '15 kg', warehouse: '苏州分仓', outboundDate: '2025-07-11', status: 'completed',
    contactPerson: '赵经理', contactPhone: '134-8006-6006', remark: '精品礼盒装',
    items: [{ name: '君山银针', spec: '特级 100g/盒', quantity: '150 盒', unitPrice: '¥880', amount: '¥132,000' }],
  },
  {
    id: '7', outboundCode: 'CK-2025-0085', salesCode: 'SO-2025-0232', customer: '和风茶屋', product: '明前龙井', teaCategory: TeaCategory.GREEN,
    quantity: '35 kg', warehouse: '杭州总仓', outboundDate: '2025-07-10', status: 'outbound',
    contactPerson: '孙经理', contactPhone: '133-8007-7007', remark: '顺丰冷链，隔日达',
    items: [{ name: '明前龙井', spec: '特级 250g/罐', quantity: '140 罐', unitPrice: '¥580', amount: '¥81,200' }],
  },
  {
    id: '8', outboundCode: 'CK-2025-0084', salesCode: 'SO-2025-0231', customer: '云隐茶庄', product: '大红袍', teaCategory: TeaCategory.OOLONG,
    quantity: '45 kg', warehouse: '武夷仓区', outboundDate: '2025-07-09', status: 'pending',
    contactPerson: '周经理', contactPhone: '132-8008-8008', remark: '岩茶专用包装',
    items: [{ name: '大红袍', spec: '特级 250g/盒', quantity: '180 盒', unitPrice: '¥720', amount: '¥129,600' }],
  },
];

function outboundStatusToVariant(status: string) {
  switch (status) {
    case 'pending': return 'warning' as const;
    case 'outbound': return 'info' as const;
    case 'completed': return 'success' as const;
    default: return 'default' as const;
  }
}

function outboundStatusLabel(status: string) {
  switch (status) {
    case 'pending': return '待出库';
    case 'outbound': return '出库中';
    case 'completed': return '已完成';
    default: return status;
  }
}

export default function InventorySalesOutbound() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null);

  const handleView = (order: OutboundOrder) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedOrder(null);
  };

  return (
    <>
      <ContentHeader title="销售出库" breadcrumbs={['仓储', '销售出库']} actions={<Button variant="ghost">导出</Button>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <FilterBar>
          <FilterInput placeholder="搜索出库单号、销售单号..." />
          <FilterSelect options={['全部状态', '待出库', '出库中', '已完成']} />
          <FilterSelect options={['全部客户', '华茗堂茶庄', '雅韵茶社', '清心茶坊', '品茗轩', '翠竹茶行', '茗香斋', '和风茶屋', '云隐茶庄']} />
          <FilterSelect options={['全部仓库', '杭州总仓', '武夷仓区', '苏州分仓', '安溪分仓', '福鼎分仓', '云南总仓']} />
        </FilterBar>
        <Card>
          <Table
            headers={['出库单号', '销售单号', '客户', '商品', '茶类', '出库数量', '仓库', '出库日期', '状态', '操作']}
            rows={mockOutboundOrders.map((o) => [
              <span className="cell-mono-emph">{o.outboundCode}</span>,
              <span className="mono" style={{ color: 'var(--color-text-secondary)' }}>{o.salesCode}</span>,
              o.customer,
              o.product,
              <Tag category={o.teaCategory} />,
              <span className="mono">{o.quantity}</span>,
              o.warehouse,
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{o.outboundDate}</span>,
              <StatusTag variant={outboundStatusToVariant(o.status)} label={outboundStatusLabel(o.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(o)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(o)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 出库详情抽屉 */}
      <DetailDrawer
        open={showDetail && !!selectedOrder}
        onClose={handleCloseDetail}
        badge="SO"
        title={selectedOrder?.outboundCode}
        statusTag={selectedOrder && <StatusTag variant={outboundStatusToVariant(selectedOrder.status)} label={outboundStatusLabel(selectedOrder.status)} />}
        subtitle={selectedOrder && `${selectedOrder.customer} · ${selectedOrder.product}`}
        mode="view"
      >
        {selectedOrder && (
          <>
            <DrawerSection title="出库信息">
              <InfoGrid cols={3}>
                <InfoItem label="出库单号" emph mono>{selectedOrder.outboundCode}</InfoItem>
                <InfoItem label="销售单号" mono>{selectedOrder.salesCode}</InfoItem>
                <InfoItem label="客户">{selectedOrder.customer}</InfoItem>
                <InfoItem label="出库仓库">{selectedOrder.warehouse}</InfoItem>
                <InfoItem label="出库日期">{selectedOrder.outboundDate}</InfoItem>
                <InfoItem label="联系人">{selectedOrder.contactPerson} {selectedOrder.contactPhone}</InfoItem>
                <InfoItem label="备注" span={3}>{selectedOrder.remark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="商品明细">
              <table className="detail-inline-table">
                <thead>
                  <tr>
                    <th>商品名称</th>
                    <th>规格</th>
                    <th style={{ textAlign: 'right' }}>数量</th>
                    <th style={{ textAlign: 'right' }}>单价</th>
                    <th style={{ textAlign: 'right' }}>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{item.name}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{item.spec}</td>
                      <td style={{ textAlign: 'right' }} className="mono">{item.quantity}</td>
                      <td style={{ textAlign: 'right' }} className="mono">{item.unitPrice}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'var(--font-medium)' }} className="mono">{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </>
  );
}
