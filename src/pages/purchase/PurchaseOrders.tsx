import { useState, useEffect } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import StatusTag, { orderStatusToVariant, orderStatusLabel } from '../../components/common/StatusTag';
import FilterBar, { FilterInput, FilterSelect } from '../../components/business/FilterBar';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { TeaCategory, OrderStatus } from '../../types';
import type { StatCardData, PurchaseOrderItem } from '../../types';
import { PRICE_SUPPLIERS, getPurchaseDefaultPrice } from '../../data/prices';
import { teaProducts } from '../../data/teaProducts';

/* ── 工具函数 ── */
function categoryToTeaCategory(category: string): TeaCategory {
  const prefix = category.split('-')[0];
  const map: Record<string, TeaCategory> = {
    '绿茶': TeaCategory.GREEN, '红茶': TeaCategory.RED, '青茶': TeaCategory.OOLONG,
    '白茶': TeaCategory.WHITE, '黄茶': TeaCategory.YELLOW, '黑茶': TeaCategory.DARK,
    '花草茶': TeaCategory.FLOWER,
  };
  return map[prefix] ?? TeaCategory.GREEN;
}

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('en-US')}`;
}

/* ── 模拟数据 ── */
interface PurchaseOrder {
  id: string;
  code: string;
  supplier: string;
  product: string;
  teaCategory: TeaCategory;
  quantity: string;
  unitPrice: string;
  amount: string;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus;
  contactPerson: string;
  contactPhone: string;
  remark: string;
  items: PurchaseOrderItem[];
  timeline: { time: string; event: string }[];
}

const mockOrders: PurchaseOrder[] = [
  {
    id: '1', code: 'PO-2025-0151', supplier: '西湖牌', product: '明前龙井', teaCategory: TeaCategory.GREEN,
    quantity: '80 kg', unitPrice: '¥700', amount: '¥56,000', orderDate: '2025-06-10', deliveryDate: '2025-06-20',
    status: OrderStatus.PENDING, contactPerson: '王建国', contactPhone: '138-0001-1001', remark: '要求明前头采，一级以上',
    items: [
      { productId: '1', name: '明前龙井', spec: '特级 250g/罐', quantity: '200 罐', marketPrice: 580, purchasePrice: 280, actualPurchasePrice: 280, amount: '¥56,000' },
    ],
    timeline: [
      { time: '2025-06-10 09:30', event: '创建采购订单' },
      { time: '2025-06-10 10:15', event: '提交审核' },
    ],
  },
  {
    id: '2', code: 'PO-2025-0150', supplier: '正山堂', product: '金骏眉', teaCategory: TeaCategory.RED,
    quantity: '50 kg', unitPrice: '¥1,200', amount: '¥60,000', orderDate: '2025-06-08', deliveryDate: '2025-06-18',
    status: OrderStatus.APPROVED, contactPerson: '张丽华', contactPhone: '139-0002-2002', remark: '春茶批次，需质检报告',
    items: [
      { productId: '7', name: '金骏眉', spec: '特级 100g/盒', quantity: '300 盒', marketPrice: 1280, purchasePrice: 200, actualPurchasePrice: 200, amount: '¥60,000' },
    ],
    timeline: [
      { time: '2025-06-08 14:00', event: '创建采购订单' },
      { time: '2025-06-08 14:30', event: '提交审核' },
      { time: '2025-06-09 09:00', event: '审核通过' },
    ],
  },
  {
    id: '3', code: 'PO-2025-0149', supplier: '八马', product: '清香铁观音', teaCategory: TeaCategory.OOLONG,
    quantity: '60 kg', unitPrice: '¥380', amount: '¥22,800', orderDate: '2025-06-05', deliveryDate: '2025-06-15',
    status: OrderStatus.SHIPPING, contactPerson: '陈志远', contactPhone: '137-0003-3003', remark: '顺丰冷链运输',
    items: [
      { productId: '11', name: '清香铁观音', spec: '一级 250g/袋', quantity: '240 袋', marketPrice: 320, purchasePrice: 95, actualPurchasePrice: 95, amount: '¥22,800' },
    ],
    timeline: [
      { time: '2025-06-05 10:00', event: '创建采购订单' },
      { time: '2025-06-05 11:00', event: '提交审核' },
      { time: '2025-06-06 09:30', event: '审核通过' },
      { time: '2025-06-07 08:00', event: '供应商发货' },
    ],
  },
  {
    id: '4', code: 'PO-2025-0148', supplier: '大益', product: '7542生饼', teaCategory: TeaCategory.DARK,
    quantity: '120 kg', unitPrice: '¥450', amount: '¥54,000', orderDate: '2025-06-03', deliveryDate: '2025-06-13',
    status: OrderStatus.COMPLETED, contactPerson: '李明辉', contactPhone: '136-0004-4004', remark: '2025年春茶批次',
    items: [
      { productId: '18', name: '7542生饼', spec: '357g/饼 7饼/提', quantity: '48 提', marketPrice: 1820, purchasePrice: 1125, actualPurchasePrice: 1125, amount: '¥54,000' },
    ],
    timeline: [
      { time: '2025-06-03 09:00', event: '创建采购订单' },
      { time: '2025-06-03 10:00', event: '提交审核' },
      { time: '2025-06-04 09:00', event: '审核通过' },
      { time: '2025-06-05 14:00', event: '供应商发货' },
      { time: '2025-06-10 11:00', event: '已签收入库' },
    ],
  },
  {
    id: '5', code: 'PO-2025-0147', supplier: '品品香', product: '白毫银针', teaCategory: TeaCategory.WHITE,
    quantity: '30 kg', unitPrice: '¥1,800', amount: '¥54,000', orderDate: '2025-06-01', deliveryDate: '2025-06-11',
    status: OrderStatus.COMPLETED, contactPerson: '赵伟', contactPhone: '135-0005-5005', remark: '头采银针，需冷链',
    items: [
      { productId: '13', name: '白毫银针', spec: '特级 100g/罐', quantity: '300 罐', marketPrice: 960, purchasePrice: 180, actualPurchasePrice: 180, amount: '¥54,000' },
    ],
    timeline: [
      { time: '2025-06-01 11:00', event: '创建采购订单' },
      { time: '2025-06-01 14:00', event: '提交审核' },
      { time: '2025-06-02 09:00', event: '审核通过' },
      { time: '2025-06-03 08:30', event: '供应商发货' },
      { time: '2025-06-08 10:00', event: '已签收入库' },
    ],
  },
  {
    id: '6', code: 'PO-2025-0146', supplier: '西湖牌', product: '雨前龙井', teaCategory: TeaCategory.GREEN,
    quantity: '100 kg', unitPrice: '¥520', amount: '¥52,000', orderDate: '2025-05-28', deliveryDate: '2025-06-07',
    status: OrderStatus.PENDING, contactPerson: '王建国', contactPhone: '138-0001-1001', remark: '雨前二级，日常备货',
    items: [
      { productId: '1', name: '雨前龙井', spec: '二级 500g/袋', quantity: '200 袋', marketPrice: 520, purchasePrice: 260, actualPurchasePrice: 260, amount: '¥52,000' },
    ],
    timeline: [
      { time: '2025-05-28 16:00', event: '创建采购订单' },
    ],
  },
  {
    id: '7', code: 'PO-2025-0145', supplier: '正山堂', product: '正山小种', teaCategory: TeaCategory.RED,
    quantity: '70 kg', unitPrice: '¥680', amount: '¥47,600', orderDate: '2025-05-25', deliveryDate: '2025-06-04',
    status: OrderStatus.APPROVED, contactPerson: '张丽华', contactPhone: '139-0002-2002', remark: '传统松烟香工艺',
    items: [
      { productId: '6', name: '正山小种', spec: '一级 250g/罐', quantity: '280 罐', marketPrice: 480, purchasePrice: 170, actualPurchasePrice: 170, amount: '¥47,600' },
    ],
    timeline: [
      { time: '2025-05-25 10:30', event: '创建采购订单' },
      { time: '2025-05-25 11:00', event: '提交审核' },
      { time: '2025-05-26 14:00', event: '审核通过' },
    ],
  },
  {
    id: '8', code: 'PO-2025-0144', supplier: '八马', product: '浓香铁观音', teaCategory: TeaCategory.OOLONG,
    quantity: '90 kg', unitPrice: '¥320', amount: '¥28,800', orderDate: '2025-05-22', deliveryDate: '2025-06-01',
    status: OrderStatus.SHIPPING, contactPerson: '陈志远', contactPhone: '137-0003-3003', remark: '浓香型，焙火足',
    items: [
      { productId: '11', name: '浓香铁观音', spec: '一级 250g/盒', quantity: '360 盒', marketPrice: 320, purchasePrice: 80, actualPurchasePrice: 80, amount: '¥28,800' },
    ],
    timeline: [
      { time: '2025-05-22 09:00', event: '创建采购订单' },
      { time: '2025-05-22 10:00', event: '提交审核' },
      { time: '2025-05-23 09:30', event: '审核通过' },
      { time: '2025-05-24 08:00', event: '供应商发货' },
    ],
  },
  {
    id: '9', code: 'PO-2025-0143', supplier: '大益', product: '熟普洱散茶', teaCategory: TeaCategory.DARK,
    quantity: '200 kg', unitPrice: '¥280', amount: '¥56,000', orderDate: '2025-05-18', deliveryDate: '2025-05-28',
    status: OrderStatus.COMPLETED, contactPerson: '李明辉', contactPhone: '136-0004-4004', remark: '宫廷级散茶，大包装',
    items: [
      { productId: '18', name: '熟普洱散茶', spec: '宫廷级 1kg/袋', quantity: '200 袋', marketPrice: 380, purchasePrice: 280, actualPurchasePrice: 280, amount: '¥56,000' },
    ],
    timeline: [
      { time: '2025-05-18 13:00', event: '创建采购订单' },
      { time: '2025-05-18 14:00', event: '提交审核' },
      { time: '2025-05-19 10:00', event: '审核通过' },
      { time: '2025-05-20 09:00', event: '供应商发货' },
      { time: '2025-05-25 15:00', event: '已签收入库' },
    ],
  },
  {
    id: '10', code: 'PO-2025-0142', supplier: '品品香', product: '白牡丹', teaCategory: TeaCategory.WHITE,
    quantity: '45 kg', unitPrice: '¥960', amount: '¥43,200', orderDate: '2025-05-15', deliveryDate: '2025-05-25',
    status: OrderStatus.PENDING, contactPerson: '赵伟', contactPhone: '135-0005-5005', remark: '春茶一芽二叶，需提供产地证明',
    items: [
      { productId: '14', name: '白牡丹', spec: '一级 300g/盒', quantity: '150 盒', marketPrice: 380, purchasePrice: 288, actualPurchasePrice: 288, amount: '¥43,200' },
    ],
    timeline: [
      { time: '2025-05-15 11:30', event: '创建采购订单' },
      { time: '2025-05-15 12:00', event: '提交审核' },
    ],
  },
];

/* ── 统计数据 ── */
const stats: StatCardData[] = [
  {
    label: '订单总数', value: '47', unit: '单',
    trend: { direction: 'up', value: '+5单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12M7 5V3h4v2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    label: '采购总额', value: '856,200', unit: '¥',
    trend: { direction: 'down', value: '3.2%' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9l7-7 7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 13a4 4 0 018 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: '待审核', value: '6', unit: '单',
    trend: { direction: 'down', value: '3单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    label: '运输中', value: '4', unit: '单',
    trend: { direction: 'up', value: '+1单' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M2 13h10V5H2v8zM12 8h3l2 3v2h-5V8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="5.5" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="14" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  },
];

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(mockOrders);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [codeSeq, setCodeSeq] = useState(152);

  const handleView = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedOrder(null);
  };

  const handleCreate = (order: PurchaseOrder) => {
    setOrders(prev => [order, ...prev]);
    setCodeSeq(s => s + 1);
    setShowCreate(false);
  };

  return (
    <>
      <ContentHeader
        title="采购订单"
        breadcrumbs={['采购', '采购订单']}
        actions={
          <>
            <Button variant="ghost">
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 3h4v4H2zM2 9h4v4H2zM8 3h6M8 5h6M8 9h6M8 11h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              导出
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <PlusIcon />
              新建采购单
            </Button>
          </>
        }
      />
      <div className="content-body">
        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        {/* 筛选栏 */}
        <FilterBar>
          <FilterInput placeholder="搜索订单编号、供应商..." />
          <FilterSelect options={['全部状态', '待审核', '已审核', '运输中', '已完成']} />
          <FilterSelect options={['全部茶类', '绿茶', '白茶', '黄茶', '青茶', '红茶', '黑茶']} />
          <FilterSelect options={['全部供应商', '西湖牌', '正山堂', '八马', '大益', '品品香']} />
          <FilterSelect options={['全部时间', '今日', '本周', '本月', '近3月']} />
        </FilterBar>

        {/* 订单表格 */}
        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '供应商', '商品', '茶类', '数量', '单价', '金额', '下单日期', '交货日期', '状态', '操作']}
            rows={orders.map((o) => [
              <span className="cell-mono-emph">{o.code}</span>,
              <span>{o.supplier}</span>,
              <span>{o.product}</span>,
              <Tag category={o.teaCategory} />,
              <span className="mono">{o.quantity}</span>,
              <span className="mono">{o.unitPrice}</span>,
              <span className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{o.amount}</span>,
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{o.orderDate}</span>,
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{o.deliveryDate}</span>,
              <StatusTag variant={orderStatusToVariant(o.status)} label={orderStatusLabel(o.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(o)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(o)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 新建采购单抽屉 */}
      {showCreate && (
        <CreatePurchaseDrawer
          nextNumber={codeSeq}
          onCancel={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {/* 订单详情抽屉 */}
      <DetailDrawer
        open={showDetail && !!selectedOrder}
        onClose={handleCloseDetail}
        badge="PO"
        title={selectedOrder?.code}
        statusTag={selectedOrder && <StatusTag variant={orderStatusToVariant(selectedOrder.status)} label={orderStatusLabel(selectedOrder.status)} />}
        subtitle={selectedOrder && `${selectedOrder.supplier} · ${selectedOrder.product}`}
        mode="view"
      >
        {selectedOrder && (
          <>
            <DrawerSection title="订单信息">
              <InfoGrid cols={3}>
                <InfoItem label="订单编号" emph mono>{selectedOrder.code}</InfoItem>
                <InfoItem label="供应商" emph>{selectedOrder.supplier}</InfoItem>
                <InfoItem label="下单日期">{selectedOrder.orderDate}</InfoItem>
                <InfoItem label="交货日期">{selectedOrder.deliveryDate}</InfoItem>
                <InfoItem label="联系人">{selectedOrder.contactPerson}</InfoItem>
                <InfoItem label="联系电话">{selectedOrder.contactPhone}</InfoItem>
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
                    <th style={{ textAlign: 'right' }}>市场价</th>
                    <th style={{ textAlign: 'right' }}>采购价</th>
                    <th style={{ textAlign: 'right' }}>采购实价</th>
                    <th style={{ textAlign: 'right' }}>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{item.name}</td>
                      <td>{item.spec}</td>
                      <td style={{ textAlign: 'right' }} className="mono">{item.quantity}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-text-tertiary)' }} className="mono">{formatMoney(item.marketPrice)}</td>
                      <td style={{ textAlign: 'right' }} className="mono">{formatMoney(item.purchasePrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }} className="mono">{formatMoney(item.actualPurchasePrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'var(--font-medium)' }} className="mono">{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'right', fontWeight: 'var(--font-semibold)' }}>合计</td>
                    <td style={{ textAlign: 'right', fontWeight: 'var(--font-bold)', color: 'var(--color-module-current-base)' }} className="mono">{selectedOrder.amount}</td>
                  </tr>
                </tfoot>
              </table>
            </DrawerSection>

            <DrawerSection title="订单进度">
              <div style={{ paddingLeft: 'var(--space-2)' }}>
                {selectedOrder.timeline.map((step, i) => {
                  const isLast = i === selectedOrder.timeline.length - 1;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', paddingBottom: isLast ? 0 : 'var(--space-4)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: isLast ? 'var(--color-module-current-base)' : 'var(--color-neutral-300)',
                          border: isLast ? '2px solid var(--color-module-current-base)' : '2px solid var(--color-neutral-300)',
                          flexShrink: 0,
                        }} />
                        {!isLast && <div style={{ width: 2, flex: 1, background: 'var(--color-border-primary)', minHeight: 20 }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: isLast ? 'var(--font-semibold)' : 'var(--font-medium)', color: isLast ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                          {step.event}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>{step.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </>
  );
}

/* ── 新建采购单抽屉 ── */
function CreatePurchaseDrawer({ nextNumber, onCancel, onSave }: {
  nextNumber: number;
  onCancel: () => void;
  onSave: (order: PurchaseOrder) => void;
}) {
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [actualPurchasePrice, setActualPurchasePrice] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [remark, setRemark] = useState('');

  const selectedProduct = teaProducts.find(p => p.id === productId);
  const marketPrice = selectedProduct?.marketPrice ?? 0;
  const defaultPrice = (productId && supplierId) ? getPurchaseDefaultPrice(productId, supplierId).price : 0;

  // 商品或供应商变化时，采购实价自动带出默认采购价
  useEffect(() => {
    if (productId && supplierId) {
      const { price } = getPurchaseDefaultPrice(productId, supplierId);
      setActualPurchasePrice(String(price));
    } else {
      setActualPurchasePrice('');
    }
  }, [productId, supplierId]);

  const qtyNum = Number(quantity) || 0;
  const actualNum = Number(actualPurchasePrice) || 0;
  const amountNum = qtyNum * actualNum;

  const canSave = !!supplierId && !!productId && qtyNum > 0 && actualNum > 0 && !!orderDate;

  const handleSave = () => {
    if (!canSave || !selectedProduct) return;
    const now = new Date();
    const timeStr = `${orderDate} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const order: PurchaseOrder = {
      id: `po_${Date.now()}`,
      code: `PO-2025-${String(nextNumber).padStart(4, '0')}`,
      supplier: PRICE_SUPPLIERS.find(s => s.id === supplierId)?.name ?? '',
      product: selectedProduct.name,
      teaCategory: categoryToTeaCategory(selectedProduct.category),
      quantity: `${qtyNum} ${selectedProduct.packageUnit}`,
      unitPrice: formatMoney(actualNum),
      amount: formatMoney(amountNum),
      orderDate,
      deliveryDate: deliveryDate || '—',
      status: OrderStatus.PENDING,
      contactPerson: contactPerson || '—',
      contactPhone: contactPhone || '—',
      remark,
      items: [{
        productId: selectedProduct.id,
        name: selectedProduct.name,
        spec: selectedProduct.spec,
        quantity: `${qtyNum} ${selectedProduct.packageUnit}`,
        marketPrice,
        purchasePrice: defaultPrice,
        actualPurchasePrice: actualNum,
        amount: formatMoney(amountNum),
      }],
      timeline: [{ time: timeStr, event: '创建采购订单' }],
    };
    onSave(order);
  };

  // 只读价格展示框样式
  const readOnlyPriceStyle: React.CSSProperties = {
    height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)',
    border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
  };

  return (
    <div className="drawer-overlay" onClick={onCancel}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">新建采购单</span>
          <button className="drawer-close" onClick={onCancel}>
            <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="drawer-body">
          {/* 供应商与商品 */}
          <div className="drawer-section-title">供应商与商品</div>
          <div className="drawer-form-row">
            <div className="drawer-form-field">
              <label className="drawer-label">供应商 *</label>
              <select className="filter-select" style={{ width: '100%' }} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">请选择供应商</option>
                {PRICE_SUPPLIERS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="drawer-form-field">
              <label className="drawer-label">商品 *</label>
              <select className="filter-select" style={{ width: '100%' }} value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">请选择商品</option>
                {teaProducts.map((p) => <option key={p.id} value={p.id}>{p.name}（{p.brand}）</option>)}
              </select>
            </div>
          </div>
          {selectedProduct && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>
              规格：{selectedProduct.spec} · 品牌：{selectedProduct.brand} · 包装单位：{selectedProduct.packageUnit}
            </div>
          )}

          {/* 价格信息 */}
          <div className="drawer-section-title">价格信息</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div>
              <label className="drawer-label">市场价</label>
              <div style={readOnlyPriceStyle} className="mono">{marketPrice ? formatMoney(marketPrice) : '—'}</div>
            </div>
            <div>
              <label className="drawer-label">采购价（默认）</label>
              <div style={readOnlyPriceStyle} className="mono">{defaultPrice ? formatMoney(defaultPrice) : '—'}</div>
            </div>
            <div>
              <label className="drawer-label">采购实价（可调整）*</label>
              <input
                type="number"
                className="filter-input"
                style={{
                  width: '100%', height: 34,
                  borderColor: 'var(--color-module-current-base)',
                  background: 'var(--color-module-current-lightest)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-module-current-base)',
                }}
                value={actualPurchasePrice}
                onChange={(e) => setActualPurchasePrice(e.target.value)}
                placeholder="0"
                disabled={!productId || !supplierId}
              />
            </div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field">
              <label className="drawer-label">数量 *</label>
              <input
                type="number"
                className="filter-input"
                style={{ width: '100%' }}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="请输入数量"
              />
            </div>
            <div className="drawer-form-field">
              <label className="drawer-label">金额（自动计算）</label>
              <div
                className="mono"
                style={{
                  height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)',
                  border: '1px solid var(--color-module-current-base)', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-module-current-lightest)', fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-bold)', color: 'var(--color-module-current-base)',
                }}
              >
                {amountNum > 0 ? formatMoney(amountNum) : '—'}
              </div>
            </div>
          </div>

          {/* 订单信息 */}
          <div className="drawer-section-title">订单信息</div>
          <div className="drawer-form-row">
            <div className="drawer-form-field">
              <label className="drawer-label">下单日期 *</label>
              <input type="date" className="filter-input" style={{ width: '100%' }} value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </div>
            <div className="drawer-form-field">
              <label className="drawer-label">交货日期</label>
              <input type="date" className="filter-input" style={{ width: '100%' }} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field">
              <label className="drawer-label">联系人</label>
              <input className="filter-input" style={{ width: '100%' }} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="请输入联系人" />
            </div>
            <div className="drawer-form-field">
              <label className="drawer-label">联系电话</label>
              <input className="filter-input" style={{ width: '100%' }} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="请输入联系电话" />
            </div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field" style={{ flex: 1 }}>
              <label className="drawer-label">备注</label>
              <input className="filter-input" style={{ width: '100%' }} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="选填" />
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <Button variant="ghost" onClick={onCancel}>取消</Button>
          <Button onClick={handleSave} disabled={!canSave}>确认下单</Button>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
