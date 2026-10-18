import { useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusTag from '../../components/common/StatusTag';
import FilterBar, { FilterInput, FilterSelect } from '../../components/business/FilterBar';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import type { StatCardData } from '../../types';

/* ── 统计卡片 ── */
const stats: StatCardData[] = [
  {
    label: '退货单数', value: '8',
    trend: { direction: 'down', value: '2 单', label: '较上月' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 6h12l-1.2 8H4.2L3 6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 10l3 3M10 10l-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: '退货金额', value: '28,960', unit: '¥',
    trend: { direction: 'down', value: '5.4%' },
    icon: <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h2M5 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: '待处理', value: '2',
    trend: { direction: 'up', value: '需及时处理' },
    icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v4M9 12.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: '退货率', value: '1.2', unit: '%',
    trend: { direction: 'down', value: '0.3%' },
    icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 14l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
];

/* ── 退货状态 ── */
type ReturnStatus = 'pending' | 'approved' | 'completed' | 'rejected';

function returnStatusToVariant(status: ReturnStatus) {
  switch (status) {
    case 'pending': return 'warning' as const;
    case 'approved': return 'info' as const;
    case 'completed': return 'success' as const;
    case 'rejected': return 'error' as const;
  }
}

function returnStatusLabel(status: ReturnStatus) {
  switch (status) {
    case 'pending': return '待处理';
    case 'approved': return '已审批';
    case 'completed': return '已退款';
    case 'rejected': return '已驳回';
  }
}

/* ── 退货记录 ── */
interface ReturnRecord {
  id: string;
  originalOrder: string;
  customer: string;
  product: string;
  quantity: string;
  amount: string;
  reason: string;
  status: ReturnStatus;
  contactPerson: string;
  contactPhone: string;
  returnDate: string;
  originalAmount: string;
  originalDate: string;
  reasonDetail: string;
  handler: string;
  handleDate: string;
}

const returnItems: ReturnRecord[] = [
  {
    id: 'SRT-2025-0008', originalOrder: 'SO-2025-0242', customer: '华茗堂茶庄', product: '明前龙井 — 特级',
    quantity: '5 kg', amount: '¥ 2,900', reason: '客户不满意口感', status: 'pending',
    contactPerson: '王经理', contactPhone: '0571-87651234', returnDate: '2025-07-13',
    originalAmount: '¥ 34,800', originalDate: '2025-07-12',
    reasonDetail: '客户反馈茶叶口感与样品不一致，汤色偏黄，香气不足，要求退回5kg明前龙井特级',
    handler: '', handleDate: '',
  },
  {
    id: 'SRT-2025-0007', originalOrder: 'SO-2025-0240', customer: '清心茶坊', product: '凤凰单丛 — 特级',
    quantity: '10 kg', amount: '¥ 5,600', reason: '包装破损', status: 'approved',
    contactPerson: '林老板', contactPhone: '0768-2345678', returnDate: '2025-07-11',
    originalAmount: '¥ 44,800', originalDate: '2025-07-10',
    reasonDetail: '运输过程中外包装严重破损，内袋撕裂，茶叶受潮，影响品质，客户要求退货',
    handler: '陈经理', handleDate: '2025-07-12',
  },
  {
    id: 'SRT-2025-0006', originalOrder: 'SO-2025-0238', customer: '翠竹茶行', product: '六堡茶 — 二级',
    quantity: '8 kg', amount: '¥ 4,000', reason: '发货错误', status: 'completed',
    contactPerson: '周经理', contactPhone: '0774-7234567', returnDate: '2025-07-09',
    originalAmount: '¥ 18,000', originalDate: '2025-07-08',
    reasonDetail: '错发为熟普洱三级，与订单六堡茶二级不符，客户要求退回换货',
    handler: '赵仓管', handleDate: '2025-07-10',
  },
  {
    id: 'SRT-2025-0005', originalOrder: 'SO-2025-0239', customer: '品茗轩', product: '白毫银针 — 特级',
    quantity: '3 kg', amount: '¥ 2,880', reason: '质量问题', status: 'completed',
    contactPerson: '张女士', contactPhone: '0593-5678901', returnDate: '2025-07-08',
    originalAmount: '¥ 38,400', originalDate: '2025-07-09',
    reasonDetail: '白毫银针含水量超标，部分芽叶发黑，疑似存储不当，质检确认不合格',
    handler: '李工', handleDate: '2025-07-09',
  },
  {
    id: 'SRT-2025-0004', originalOrder: 'SO-2025-0235', customer: '雅韵茶社', product: '碧螺春 — 一级',
    quantity: '6 kg', amount: '¥ 2,580', reason: '规格不符', status: 'rejected',
    contactPerson: '赵总', contactPhone: '0599-51234567', returnDate: '2025-07-06',
    originalAmount: '¥ 36,000', originalDate: '2025-07-05',
    reasonDetail: '客户称收到的碧螺春为二级而非一级，经核实发货确为一级，客户无法提供开箱视频',
    handler: '陈经理', handleDate: '2025-07-07',
  },
  {
    id: 'SRT-2025-0003', originalOrder: 'SO-2025-0237', customer: '和风茶屋', product: '君山银针 — 特级',
    quantity: '2 kg', amount: '¥ 3,520', reason: '客户取消订单', status: 'pending',
    contactPerson: '何老板', contactPhone: '0730-8234567', returnDate: '2025-07-08',
    originalAmount: '¥ 17,600', originalDate: '2025-07-07',
    reasonDetail: '客户因经营调整，取消君山银针订单，货物尚未签收，要求退回',
    handler: '', handleDate: '',
  },
  {
    id: 'SRT-2025-0002', originalOrder: 'SO-2025-0236', customer: '云隐茶庄', product: '铁观音 — 二级',
    quantity: '15 kg', amount: '¥ 4,800', reason: '运输损坏', status: 'approved',
    contactPerson: '江总', contactPhone: '0599-5234567', returnDate: '2025-07-05',
    originalAmount: '¥ 24,000', originalDate: '2025-07-04',
    reasonDetail: '物流途中遭遇暴雨，纸箱浸水，铁观音受潮变质，客户拍照留证要求退货',
    handler: '陈经理', handleDate: '2025-07-06',
  },
  {
    id: 'SRT-2025-0001', originalOrder: 'SO-2025-0234', customer: '茗香斋', product: '大红袍 — 特级',
    quantity: '4 kg', amount: '¥ 3,540', reason: '色泽与样品不符', status: 'completed',
    contactPerson: '吴经理', contactPhone: '0595-2345678', returnDate: '2025-07-02',
    originalAmount: '¥ 38,400', originalDate: '2025-07-01',
    reasonDetail: '客户反馈大红袍干茶色泽偏暗，与之前样品差异较大，冲泡后岩韵不足',
    handler: '李工', handleDate: '2025-07-03',
  },
];

export default function SalesReturn() {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReturnRecord | null>(null);

  const handleView = (record: ReturnRecord) => {
    setSelectedRecord(record);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedRecord(null);
  };

  return (
    <>
      <ContentHeader
        title="销售退货"
        breadcrumbs={['销售', '销售退货']}
        actions={<><Button variant="ghost">导出</Button><Button><PlusIcon />新建退货单</Button></>}
      />
      <div className="content-body">
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        <FilterBar>
          <FilterInput placeholder="搜索退货单号、客户..." />
          <FilterSelect options={['全部状态', '待处理', '已审批', '已退款', '已驳回']} />
          <FilterSelect options={['全部客户', '华茗堂茶庄', '雅韵茶社', '清心茶坊', '品茗轩', '翠竹茶行', '和风茶屋', '云隐茶庄', '茗香斋']} />
          <FilterSelect options={['全部时间', '今日', '本周', '本月', '近3月']} />
        </FilterBar>

        <Card>
          <Table
            headers={['退货单号', '原销售单号', '客户', '商品', '退货数量', '退货金额', '退货原因', '状态', '操作']}
            rows={returnItems.map((r) => [
              <span className="mono">{r.id}</span>,
              <span className="mono">{r.originalOrder}</span>,
              r.customer,
              r.product,
              <span className="mono">{r.quantity}</span>,
              <span className="mono">{r.amount}</span>,
              r.reason,
              <StatusTag variant={returnStatusToVariant(r.status)} label={returnStatusLabel(r.status)} />,
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => handleView(r)}>查看</Button>
                <Button size="sm" variant="ghost" onClick={() => handleView(r)}>编辑</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 退货详情抽屉 */}
      <DetailDrawer
        open={showDetail && !!selectedRecord}
        onClose={handleCloseDetail}
        badge="SR"
        title={selectedRecord?.id}
        statusTag={selectedRecord && <StatusTag variant={returnStatusToVariant(selectedRecord.status)} label={returnStatusLabel(selectedRecord.status)} />}
        subtitle={selectedRecord && `${selectedRecord.customer} · ${selectedRecord.returnDate}`}
        mode="view"
      >
        {selectedRecord && (
          <>
            <DrawerSection title="退货信息">
              <InfoGrid cols={3}>
                <InfoItem label="退货单号" emph mono>{selectedRecord.id}</InfoItem>
                <InfoItem label="退货日期">{selectedRecord.returnDate}</InfoItem>
                <InfoItem label="客户" emph>{selectedRecord.customer}</InfoItem>
                <InfoItem label="联系人">{selectedRecord.contactPerson}</InfoItem>
                <InfoItem label="退货商品" emph>{selectedRecord.product}</InfoItem>
                <InfoItem label="退货数量" mono>{selectedRecord.quantity}</InfoItem>
                <InfoItem label="退货金额" mono valueStyle={{ color: '#CB405D', fontWeight: 'var(--font-semibold)' }}>{selectedRecord.amount}</InfoItem>
                <InfoItem label="状态"><StatusTag variant={returnStatusToVariant(selectedRecord.status)} label={returnStatusLabel(selectedRecord.status)} /></InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="原销售订单信息">
              <InfoGrid cols={3}>
                <InfoItem label="原销售单号" emph mono>{selectedRecord.originalOrder}</InfoItem>
                <InfoItem label="下单日期">{selectedRecord.originalDate}</InfoItem>
                <InfoItem label="原订单金额" mono>{selectedRecord.originalAmount}</InfoItem>
                <InfoItem label="联系电话" mono>{selectedRecord.contactPhone}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="退货原因详情">
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span style={{
                    padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                    background: '#FFF3E0', color: '#E65100', border: '1px solid #FFCC80',
                  }}>{selectedRecord.reason}</span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>{selectedRecord.reasonDetail}</div>
                {selectedRecord.handler && (
                  <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                    处理人：{selectedRecord.handler} · 处理日期：{selectedRecord.handleDate}
                  </div>
                )}
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
