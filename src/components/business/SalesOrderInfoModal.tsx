import Button from '../common/Button';
import { DrawerSection, InfoGrid, InfoItem } from '../common/DetailDrawer';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { EXTERNAL_CHANNEL_LABELS } from '../../data/externalOrders';
import { regionTextOf } from '../../data/regions';
import { buildFamilies } from '../../utils/salesOrderFamily';
import { ProductItemsTable } from '../../pages/sales/SalesOrderDetail';
import type { ExternalOrder } from '../../types';

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 地区展示：省 / 市 / 区 */
const regionText = (o: ExternalOrder): string => regionTextOf(o.customerRegion, o.receiverAddress);

/** 详情展示日期+时分秒（数据无时分秒时补齐演示值） */
const fmtDT = (v: string): string => (v.length > 10 ? v : `${v} 09:12:00`);

/**
 * 销售单信息弹窗（履约单分发 / 履约单履约「销售单号」点击查看）
 * 订单信息 / 收货信息 / 商品明细三段，参照销售单列表详情「销售单信息」；
 * 金额与商品明细按母销售单名下全部履约单聚合（未拆分时即母销售单自身）。
 */
export default function SalesOrderInfoModal({ code, onClose }: { code: string | null; onClose: () => void }) {
  const orders = useOrderFlowStore((s) => s.orders);
  if (!code) return null;
  const fam = buildFamilies(orders).find((f) => f.rootCode === code);
  if (!fam) return null;
  const m = fam.mother;
  const split = fam.children.length > 0;
  const amount = (split ? fam.children : fam.all).reduce((s, o) => s + o.totalAmount, 0);
  /* 商品明细：各履约单商品按「商品 + 规格」合并数量 */
  const map = new Map<string, ExternalOrder['items'][number]>();
  for (const it of split ? fam.children.flatMap((c) => c.items) : m.items) {
    const k = `${it.productName}|${it.spec}`;
    const cu = map.get(k);
    if (cu) cu.quantity += it.quantity;
    else map.set(k, { ...it });
  }
  return (
    <div className="category-dialog-overlay" onClick={onClose}>
      <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 980, maxWidth: '94vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>销售单信息 · {code}</div>
          <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>母销售单（聚合其下 {split ? `${fam.children.length} 张` : '1 张'}履约单）</span>
        </div>

        <DrawerSection title="订单信息">
          <InfoGrid cols={4}>
            <InfoItem label="销售单号" mono emph>{fam.rootCode}</InfoItem>
            <InfoItem label="订单来源">{m.salesPath === 'via_platform' ? (m.platformCustomerName ?? '经平台销售') : '淡茶半盏'}（{EXTERNAL_CHANNEL_LABELS[m.sourceChannel]}）</InfoItem>
            <InfoItem label="下单平台">{m.salesPath === 'via_platform' ? (m.platformCustomerName ?? '—') : '—'}</InfoItem>
            <InfoItem label="平台订单号" mono>{m.externalOrderNo ?? '—'}</InfoItem>
            <InfoItem label="客户" emph>{`${m.customerName}（${m.customerType}）`}</InfoItem>
            <InfoItem label="客户编号" mono>{m.customerCode ?? '—'}</InfoItem>
            <InfoItem label="客户区域">{regionText(m)}</InfoItem>
            <InfoItem label="总金额" mono>{money(amount)}</InfoItem>
            <InfoItem label="履约单数">{split ? `${fam.children.length} 单` : '1 单（未拆分，母销售单即履约单）'}</InfoItem>
            <InfoItem label="销售路径">{m.salesPath === 'via_platform' ? '经平台销售' : '直接销售'}</InfoItem>
            <InfoItem label="客户下单时间">{m.customerOrderTime ?? '—'}</InfoItem>
            <InfoItem label="客户侧订单号" mono>{m.customerOrderNo ?? '—'}</InfoItem>
            <InfoItem label="录入时间" mono>{fmtDT(m.entryTime)}</InfoItem>
            <InfoItem label="录入人">{m.operator}</InfoItem>
            {m.platformCustomerName ? <InfoItem label="平台客户">{m.platformCustomerName}</InfoItem> : null}
          </InfoGrid>
        </DrawerSection>

        <DrawerSection title="收货信息">
          <InfoGrid cols={4}>
            <InfoItem label="收货人" emph>{m.receiver}</InfoItem>
            <InfoItem label="联系电话" mono>{m.receiverPhone}</InfoItem>
            <InfoItem label="收货地区">{regionText(m)}</InfoItem>
            <InfoItem label="收货地址" span={2}>{m.receiverAddress}</InfoItem>
            <InfoItem label="备注" span={2}>{m.remark || '—'}</InfoItem>
          </InfoGrid>
        </DrawerSection>

        <DrawerSection title="商品明细">
          <ProductItemsTable
            items={[...map.values()]}
            customerCode={m.customerCode}
            customerName={m.customerName}
            salesPath={m.salesPath}
            platformCustomerId={m.platformCustomerId}
            platform={m.platform}
            platformRateSnapshot={m.platformRateSnapshot}
            footerAmount={amount}
          />
        </DrawerSection>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
}
