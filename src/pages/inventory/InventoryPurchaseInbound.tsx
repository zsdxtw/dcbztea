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
  { label: '入库单数', value: '23', unit: '单', trend: { direction: 'up', value: '+3单' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2v10M5 8l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '入库总量', value: '15,200', unit: 'kg', trend: { direction: 'up', value: '+8.5%' }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { label: '待入库', value: '4', unit: '单', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '今日入库', value: '3', unit: '单', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v6M6 9h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
];

/* ── 模拟数据 ── */
interface InboundOrder {
  id: string;
  inboundCode: string;
  purchaseCode: string;
  supplier: string;
  product: string;
  teaCategory: TeaCategory;
  quantity: string;
  warehouse: string;
  inboundDate: string;
  status: 'pending' | 'inbound' | 'completed';
  contactPerson: string;
  contactPhone: string;
  remark: string;
  items: { name: string; spec: string; quantity: string; unitPrice: string; amount: string }[];
  qualityResult: 'qualified' | 'unqualified' | 'pending';
  qualityRemark: string;
}

const mockInboundOrders: InboundOrder[] = [
  {
    id: '1', inboundCode: 'RK-2025-0089', purchaseCode: 'PO-2025-0151', supplier: '西湖牌', product: '明前龙井', teaCategory: TeaCategory.GREEN,
    quantity: '80 kg', warehouse: '杭州总仓', inboundDate: '2025-07-15', status: 'completed',
    contactPerson: '王建国', contactPhone: '138-0001-1001', remark: '明前头采，特级',
    items: [{ name: '明前龙井', spec: '特级 250g/罐', quantity: '200 罐', unitPrice: '¥280', amount: '¥56,000' }],
    qualityResult: 'qualified', qualityRemark: '水分6.8%，感官评分92分，合格',
  },
  {
    id: '2', inboundCode: 'RK-2025-0088', purchaseCode: 'PO-2025-0150', supplier: '正山堂', product: '金骏眉', teaCategory: TeaCategory.RED,
    quantity: '50 kg', warehouse: '武夷仓区', inboundDate: '2025-07-15', status: 'completed',
    contactPerson: '张丽华', contactPhone: '139-0002-2002', remark: '春茶批次',
    items: [{ name: '金骏眉', spec: '特级 100g/盒', quantity: '300 盒', unitPrice: '¥200', amount: '¥60,000' }],
    qualityResult: 'qualified', qualityRemark: '水分7.2%，感官评分90分，合格',
  },
  {
    id: '3', inboundCode: 'RK-2025-0087', purchaseCode: 'PO-2025-0149', supplier: '八马', product: '清香铁观音', teaCategory: TeaCategory.OOLONG,
    quantity: '60 kg', warehouse: '安溪分仓', inboundDate: '2025-07-14', status: 'inbound',
    contactPerson: '陈志远', contactPhone: '137-0003-3003', remark: '顺丰冷链运输',
    items: [{ name: '清香铁观音', spec: '一级 250g/袋', quantity: '240 袋', unitPrice: '¥95', amount: '¥22,800' }],
    qualityResult: 'pending', qualityRemark: '待质检',
  },
  {
    id: '4', inboundCode: 'RK-2025-0086', purchaseCode: 'PO-2025-0148', supplier: '大益', product: '7542生饼', teaCategory: TeaCategory.DARK,
    quantity: '120 kg', warehouse: '云南总仓', inboundDate: '2025-07-13', status: 'completed',
    contactPerson: '李明辉', contactPhone: '136-0004-4004', remark: '2025年春茶批次',
    items: [{ name: '7542生饼', spec: '357g/饼 7饼/提', quantity: '48 提', unitPrice: '¥1,125', amount: '¥54,000' }],
    qualityResult: 'qualified', qualityRemark: '水分9.8%，感官评分85分，合格',
  },
  {
    id: '5', inboundCode: 'RK-2025-0085', purchaseCode: 'PO-2025-0147', supplier: '品品香', product: '白毫银针', teaCategory: TeaCategory.WHITE,
    quantity: '30 kg', warehouse: '福鼎分仓', inboundDate: '2025-07-12', status: 'pending',
    contactPerson: '赵伟', contactPhone: '135-0005-5005', remark: '头采银针，需冷链',
    items: [{ name: '白毫银针', spec: '特级 100g/罐', quantity: '300 罐', unitPrice: '¥180', amount: '¥54,000' }],
    qualityResult: 'pending', qualityRemark: '待入库质检',
  },
  {
    id: '6', inboundCode: 'RK-2025-0084', purchaseCode: 'PO-2025-0146', supplier: '西湖牌', product: '雨前龙井', teaCategory: TeaCategory.GREEN,
    quantity: '100 kg', warehouse: '杭州总仓', inboundDate: '2025-07-11', status: 'completed',
    contactPerson: '王建国', contactPhone: '138-0001-1001', remark: '雨前二级，日常备货',
    items: [{ name: '雨前龙井', spec: '二级 500g/袋', quantity: '200 袋', unitPrice: '¥260', amount: '¥52,000' }],
    qualityResult: 'qualified', qualityRemark: '水分7.0%，感官评分88分，合格',
  },
  {
    id: '7', inboundCode: 'RK-2025-0083', purchaseCode: 'PO-2025-0145', supplier: '正山堂', product: '正山小种', teaCategory: TeaCategory.RED,
    quantity: '70 kg', warehouse: '武夷仓区', inboundDate: '2025-07-10', status: 'inbound',
    contactPerson: '张丽华', contactPhone: '139-0002-2002', remark: '传统松烟香工艺',
    items: [{ name: '正山小种', spec: '一级 250g/罐', quantity: '280 罐', unitPrice: '¥170', amount: '¥47,600' }],
    qualityResult: 'pending', qualityRemark: '入库中，待抽检',
  },
  {
    id: '8', inboundCode: 'RK-2025-0082', purchaseCode: 'PO-2025-0144', supplier: '八马', product: '浓香铁观音', teaCategory: TeaCategory.OOLONG,
    quantity: '90 kg', warehouse: '安溪分仓', inboundDate: '2025-07-09', status: 'pending',
    contactPerson: '陈志远', contactPhone: '137-0003-3003', remark: '浓香型，焙火足',
    items: [{ name: '浓香铁观音', spec: '一级 250g/盒', quantity: '360 盒', unitPrice: '¥80', amount: '¥28,800' }],
    qualityResult: 'pending', qualityRemark: '待入库',
  },
];

function inboundStatusToVariant(status: string) {
  switch (status) {
    case 'pending': return 'warning' as const;
    case 'inbound': return 'info' as const;
    case 'completed': return 'success' as const;
    default: return 'default' as const;
  }
}

function inboundStatusLabel(status: string) {
  switch (status) {
    case 'pending': return '待入库';
    case 'inbound': return '入库中';
    case 'completed': return '已完成';
    default: return status;
  }
}

function qualityResultToVariant(result: string) {
  switch (result) {
    case 'qualified': return 'success' as const;
    case 'unqualified': return 'error' as const;
    case 'pending': return 'warning' as const;
    default: return 'default' as const;
  }
}

function qualityResultLabel(result: string) {
  switch (result) {
    case 'qualified': return '合格';
    case 'unqualified': return '不合格';
    case 'pending': return '待检';
    default: return result;
  }
}

export default function InventoryPurchaseInbound() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InboundOrder | null>(null);

  const handleView = (order: InboundOrder) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedOrder(null);
  };

  return (
    <>
      <ContentHeader title="采购入库" breadcrumbs={['仓储', '采购入库']} actions={<Button variant="ghost">导出</Button>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <FilterBar>
          <FilterInput placeholder="搜索入库单号、采购单号..." />
          <FilterSelect options={['全部状态', '待入库', '入库中', '已完成']} />
          <FilterSelect options={['全部供应商', '西湖牌', '正山堂', '八马', '大益', '品品香']} />
          <FilterSelect options={['全部仓库', '杭州总仓', '武夷仓区', '苏州分仓', '安溪分仓', '福鼎分仓', '云南总仓']} />
        </FilterBar>
        <Card>
          <Table
            headers={['入库单号', '采购单号', '供应商', '商品', '茶类', '入库数量', '仓库', '入库日期', '状态', '操作']}
            rows={mockInboundOrders.map((o) => [
              <span className="cell-mono-emph">{o.inboundCode}</span>,
              <span className="mono" style={{ color: 'var(--color-text-secondary)' }}>{o.purchaseCode}</span>,
              o.supplier,
              o.product,
              <Tag category={o.teaCategory} />,
              <span className="mono">{o.quantity}</span>,
              o.warehouse,
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{o.inboundDate}</span>,
              <StatusTag variant={inboundStatusToVariant(o.status)} label={inboundStatusLabel(o.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(o)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(o)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 入库详情抽屉 */}
      <DetailDrawer
        open={showDetail && !!selectedOrder}
        onClose={handleCloseDetail}
        badge="PI"
        title={selectedOrder?.inboundCode}
        statusTag={selectedOrder && <StatusTag variant={inboundStatusToVariant(selectedOrder.status)} label={inboundStatusLabel(selectedOrder.status)} />}
        subtitle={selectedOrder && `${selectedOrder.supplier} · ${selectedOrder.product}`}
        mode="view"
      >
        {selectedOrder && (
          <>
            <DrawerSection title="入库信息">
              <InfoGrid cols={3}>
                <InfoItem label="入库单号" emph mono>{selectedOrder.inboundCode}</InfoItem>
                <InfoItem label="采购单号" mono>{selectedOrder.purchaseCode}</InfoItem>
                <InfoItem label="供应商">{selectedOrder.supplier}</InfoItem>
                <InfoItem label="入库仓库">{selectedOrder.warehouse}</InfoItem>
                <InfoItem label="入库日期">{selectedOrder.inboundDate}</InfoItem>
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

            <DrawerSection title="质检结果">
              <InfoGrid cols={3}>
                <InfoItem label="质检结果">{<StatusTag variant={qualityResultToVariant(selectedOrder.qualityResult)} label={qualityResultLabel(selectedOrder.qualityResult)} />}</InfoItem>
                <InfoItem label="质检说明" span={2}>{selectedOrder.qualityRemark || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </>
  );
}
