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
  { label: '出入库单数', value: '12', unit: '单', icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2v10M5 8l4 4 4-4M9 14V4M5 8l4-4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '入库量', value: '2,500', unit: 'kg', trend: { direction: 'up', value: '+12%' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2v10M5 8l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '出库量', value: '1,800', unit: 'kg', trend: { direction: 'down', value: '-5%' }, icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 14V4M5 8l4-4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { label: '待审核', value: '2', unit: '单', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
];

/* ── 模拟数据 ── */
interface OtherIORecord {
  id: string;
  code: string;
  ioType: '其他入库' | '其他出库';
  product: string;
  teaCategory: TeaCategory;
  quantity: string;
  warehouse: string;
  reason: string;
  operator: string;
  date: string;
  status: 'pending' | 'approved' | 'completed';
  remark: string;
}

const mockRecords: OtherIORecord[] = [
  {
    id: '1', code: 'QT-2025-0012', ioType: '其他出库', product: '碧螺春', teaCategory: TeaCategory.GREEN,
    quantity: '5 kg', warehouse: '苏州分仓', reason: '报损', operator: '王仓管', date: '2025-07-15', status: 'completed',
    remark: '仓储受潮，品质下降，报损处理',
  },
  {
    id: '2', code: 'QT-2025-0011', ioType: '其他入库', product: '明前龙井', teaCategory: TeaCategory.GREEN,
    quantity: '10 kg', warehouse: '杭州总仓', reason: '盘盈', operator: '李仓管', date: '2025-07-14', status: 'completed',
    remark: '月度盘点发现盘盈10kg，已核实入库',
  },
  {
    id: '3', code: 'QT-2025-0010', ioType: '其他入库', product: '白牡丹', teaCategory: TeaCategory.WHITE,
    quantity: '8 kg', warehouse: '福鼎分仓', reason: '赠品入库', operator: '陈仓管', date: '2025-07-13', status: 'approved',
    remark: '供应商赠品，随采购订单PO-2025-0148到货',
  },
  {
    id: '4', code: 'QT-2025-0009', ioType: '其他出库', product: '大红袍', teaCategory: TeaCategory.OOLONG,
    quantity: '3 kg', warehouse: '武夷仓区', reason: '样品出库', operator: '张仓管', date: '2025-07-12', status: 'completed',
    remark: '客户品鉴样品，不计销售',
  },
  {
    id: '5', code: 'QT-2025-0008', ioType: '其他出库', product: '熟普洱', teaCategory: TeaCategory.DARK,
    quantity: '2 kg', warehouse: '云南总仓', reason: '报损', operator: '刘仓管', date: '2025-07-11', status: 'completed',
    remark: '包装破损，茶叶受污染，报损处理',
  },
  {
    id: '6', code: 'QT-2025-0007', ioType: '其他入库', product: '正山小种', teaCategory: TeaCategory.RED,
    quantity: '15 kg', warehouse: '武夷仓区', reason: '盘盈', operator: '张仓管', date: '2025-07-10', status: 'completed',
    remark: '周盘点盘盈15kg，已核实入库',
  },
  {
    id: '7', code: 'QT-2025-0006', ioType: '其他出库', product: '铁观音', teaCategory: TeaCategory.OOLONG,
    quantity: '4 kg', warehouse: '安溪分仓', reason: '样品出库', operator: '陈仓管', date: '2025-07-09', status: 'pending',
    remark: '展会品鉴用茶，待审批',
  },
  {
    id: '8', code: 'QT-2025-0005', ioType: '其他入库', product: '金骏眉', teaCategory: TeaCategory.RED,
    quantity: '6 kg', warehouse: '武夷仓区', reason: '赠品入库', operator: '张仓管', date: '2025-07-08', status: 'pending',
    remark: '正山堂赠品，待审核入库',
  },
];

function ioStatusToVariant(status: string) {
  switch (status) {
    case 'pending': return 'warning' as const;
    case 'approved': return 'info' as const;
    case 'completed': return 'success' as const;
    default: return 'default' as const;
  }
}

function ioStatusLabel(status: string) {
  switch (status) {
    case 'pending': return '待审核';
    case 'approved': return '已审核';
    case 'completed': return '已完成';
    default: return status;
  }
}

export default function InventoryOtherIO() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OtherIORecord | null>(null);

  const handleView = (record: OtherIORecord) => {
    setSelectedRecord(record);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedRecord(null);
  };

  return (
    <>
      <ContentHeader title="其他出入库" breadcrumbs={['仓储', '其他出入库']} actions={<Button><PlusIcon />新建单据</Button>} />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>
        <FilterBar>
          <FilterInput placeholder="搜索单号、商品..." />
          <FilterSelect options={['全部类型', '其他入库', '其他出库']} />
          <FilterSelect options={['全部状态', '待审核', '已审核', '已完成']} />
          <FilterSelect options={['全部仓库', '杭州总仓', '武夷仓区', '苏州分仓', '安溪分仓', '福鼎分仓', '云南总仓']} />
        </FilterBar>
        <Card>
          <Table
            headers={['单号', '出入库类型', '商品', '数量', '仓库', '原因', '操作人', '日期', '状态', '操作']}
            rows={mockRecords.map((r) => [
              <span className="cell-mono-emph">{r.code}</span>,
              <span className="cell-emph" style={{ color: r.ioType === '其他入库' ? 'var(--color-semantic-success)' : 'var(--color-module-current-base)' }}>{r.ioType}</span>,
              <span>{r.product}</span>,
              <span className="mono">{r.quantity}</span>,
              r.warehouse,
              <span style={{ color: 'var(--color-text-secondary)' }}>{r.reason}</span>,
              r.operator,
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{r.date}</span>,
              <StatusTag variant={ioStatusToVariant(r.status)} label={ioStatusLabel(r.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(r)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(r)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 详情抽屉 */}
      <DetailDrawer
        open={showDetail && !!selectedRecord}
        onClose={handleCloseDetail}
        badge="IO"
        title={selectedRecord?.code}
        statusTag={selectedRecord && <StatusTag variant={ioStatusToVariant(selectedRecord.status)} label={ioStatusLabel(selectedRecord.status)} />}
        subtitle={selectedRecord && `${selectedRecord.ioType} · ${selectedRecord.product}`}
        mode="view"
      >
        {selectedRecord && (
          <DrawerSection title="单据信息">
            <InfoGrid cols={3}>
              <InfoItem label="单号" emph mono>{selectedRecord.code}</InfoItem>
              <InfoItem label="出入库类型" emph valueStyle={{ color: selectedRecord.ioType === '其他入库' ? 'var(--color-semantic-success)' : 'var(--color-module-current-base)' }}>{selectedRecord.ioType}</InfoItem>
              <InfoItem label="商品">{selectedRecord.product}</InfoItem>
              <InfoItem label="数量" mono>{selectedRecord.quantity}</InfoItem>
              <InfoItem label="仓库">{selectedRecord.warehouse}</InfoItem>
              <InfoItem label="原因">{selectedRecord.reason}</InfoItem>
              <InfoItem label="操作人">{selectedRecord.operator}</InfoItem>
              <InfoItem label="日期">{selectedRecord.date}</InfoItem>
              <InfoItem label="备注" span={3}>{selectedRecord.remark || '—'}</InfoItem>
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
