import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusTag from '../../components/common/StatusTag';
import Button from '../../components/common/Button';
import FilterBar, { FilterInput, FilterSelect } from '../../components/business/FilterBar';
import StatCard from '../../components/common/StatCard';
import type { StatCardData } from '../../types';

const stats: StatCardData[] = [
  { label: '待入库', value: '8', trend: { direction: 'up', value: '2 单', label: '较昨日' }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { label: '已入库', value: '156', unit: '单', trend: { direction: 'up', value: '12%', label: '较上月' }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9h12" stroke="currentColor" strokeWidth="1.3"/><path d="M6 10l3 3 4-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '入库总量', value: '4,280', unit: 'kg', trend: { direction: 'up', value: '8.5%', label: '较上月' }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { label: '入库金额', value: '1,286,400', unit: '¥', trend: { direction: 'up', value: '15.2%', label: '较上月' }, icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h2M5 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
];

const inboundItems = [
  { id: 'IB-2025-0089', orderId: 'PO-2025-0151', supplier: '武夷山茶业', product: '大红袍 — 特级', teaCategory: '青茶', quantity: '50 kg', amount: '¥ 28,500', warehouse: '武夷仓区', operator: '张仓管', status: 'pending' as const },
  { id: 'IB-2025-0088', orderId: 'PO-2025-0150', supplier: '西湖龙井合作社', product: '明前龙井 — 特级', teaCategory: '绿茶', quantity: '80 kg', amount: '¥ 56,000', warehouse: '杭州总仓', operator: '赵仓管', status: 'completed' as const },
  { id: 'IB-2025-0087', orderId: 'PO-2025-0149', supplier: '安溪铁观音集团', product: '清香铁观音 — 一级', teaCategory: '青茶', quantity: '60 kg', amount: '¥ 18,200', warehouse: '安溪分仓', operator: '陈仓管', status: 'processing' as const },
  { id: 'IB-2025-0086', orderId: 'PO-2025-0148', supplier: '福鼎白茶厂', product: '白牡丹 — 一级', teaCategory: '白茶', quantity: '40 kg', amount: '¥ 32,800', warehouse: '福鼎分仓', operator: '陈仓管', status: 'completed' as const },
  { id: 'IB-2025-0085', orderId: 'PO-2025-0147', supplier: '云南普洱茶业', product: '熟普洱 — 三级', teaCategory: '黑茶', quantity: '120 kg', amount: '¥ 45,600', warehouse: '云南总仓', operator: '刘仓管', status: 'pending' as const },
  { id: 'IB-2025-0084', orderId: 'PO-2025-0146', supplier: '武夷山桐木关茶厂', product: '正山小种 — 特级', teaCategory: '红茶', quantity: '30 kg', amount: '¥ 16,800', warehouse: '武夷仓区', operator: '张仓管', status: 'completed' as const },
  { id: 'IB-2025-0083', orderId: 'PO-2025-0145', supplier: '洞庭山茶场', product: '碧螺春 — 一级', teaCategory: '绿茶', quantity: '25 kg', amount: '¥ 10,500', warehouse: '苏州分仓', operator: '王仓管', status: 'processing' as const },
  { id: 'IB-2025-0082', orderId: 'PO-2025-0144', supplier: '君山银针茶厂', product: '君山银针 — 特级', teaCategory: '黄茶', quantity: '15 kg', amount: '¥ 26,400', warehouse: '苏州分仓', operator: '王仓管', status: 'completed' as const },
];

function inboundStatusToVariant(status: string) {
  switch (status) {
    case 'pending': return 'warning' as const;
    case 'processing': return 'info' as const;
    case 'completed': return 'success' as const;
    default: return 'info' as const;
  }
}

function inboundStatusLabel(status: string) {
  switch (status) {
    case 'pending': return '待入库';
    case 'processing': return '入库中';
    case 'completed': return '已入库';
    default: return status;
  }
}

export default function PurchaseInbound() {
  return (
    <>
      <ContentHeader title="采购收货" breadcrumbs={['采购', '采购收货']} actions={<><Button variant="ghost">导出</Button><Button><PlusIcon />新建入库</Button></>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <FilterBar>
          <FilterInput placeholder="搜索入库单号、采购单号、供应商..." />
          <FilterSelect options={['全部状态', '待入库', '入库中', '已入库']} />
          <FilterSelect options={['全部茶类', '绿茶', '白茶', '黄茶', '青茶', '红茶', '黑茶']} />
          <FilterSelect options={['全部仓库', '杭州总仓', '武夷仓区', '苏州分仓', '安溪分仓', '福鼎分仓', '云南总仓']} />
        </FilterBar>
        <Card>
          <Table
            headers={['入库单号', '采购单号', '供应商', '商品', '茶类', '数量', '金额', '仓库', '操作员', '状态']}
            rows={inboundItems.map((item) => [
              <span className="mono">{item.id}</span>,
              <span className="mono">{item.orderId}</span>,
              item.supplier,
              item.product,
              item.teaCategory,
              <span className="mono">{item.quantity}</span>,
              <span className="mono">{item.amount}</span>,
              item.warehouse,
              item.operator,
              <StatusTag variant={inboundStatusToVariant(item.status)} label={inboundStatusLabel(item.status)} />,
            ])}
          />
        </Card>
      </div>
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
