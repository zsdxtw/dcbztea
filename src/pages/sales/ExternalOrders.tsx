import { useEffect, useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Toggle from '../../components/common/Toggle';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore, getSelfPurchaseEstimate } from '../../stores/orderFlowStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { usePriceStore } from '../../stores/priceStore';
import { useScoreStore, getScoreSummary } from '../../stores/scoreStore';
import {
  EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS, EXTERNAL_STATUS_LABELS, EXTERNAL_STATUS_COLORS,
  TRANSFER_SOURCE_LABELS, compareFloorAmount,
} from '../../data/externalOrders';
import { PARTNER_ORDER_STATUS_LABELS } from '../../data/partner';
import { getSalesDefaultPrice, getPersonalMinPrice } from '../../data/prices';
import { customerItems, CUSTOMER_TYPE_LABELS } from '../../data/customers';
import { platformItems } from '../../data/platforms';
import type { ExternalOrder, ExternalOrderItem, ExternalPlatform } from '../../types';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const statusPill = (status: string) => {
  // 已完成归并展示为已处理（子状态由调用方补充）
  const key = status === 'completed' ? 'processed' : status;
  const c = EXTERNAL_STATUS_COLORS[key] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return pill(c.bg, c.color, EXTERNAL_STATUS_LABELS[key] ?? status);
};

/** 状态归并：已完成并入已处理（列表筛选/计数/展示统一） */
const mergedStatus = (s: string) => (s === 'completed' ? 'processed' : s);

const money = (n: number) => `¥${n.toLocaleString()}`;

const PLATFORM_OPTIONS: { value: ExternalPlatform; label: string }[] = [
  { value: 'tmall', label: '天猫' }, { value: 'jd', label: '京东' }, { value: 'douyin', label: '抖音' },
  { value: 'pdd', label: '拼多多' }, { value: 'other', label: '其他平台' },
];

/** 自营执行进度（由 selfChain 推导） */
function selfStage(o: ExternalOrder): { key: string; label: string; idx: number } {
  if (!o.selfChain) return { key: 'none', label: '未开始', idx: -1 };
  if (o.processStatus === 'completed') return { key: 'done', label: '已完成', idx: 3 };
  if (o.selfChain.outboundCode) return { key: 'outbound', label: '已出库发货', idx: 2 };
  if (o.selfChain.inboundCode) return { key: 'inbound', label: '已到货入库', idx: 1 };
  return { key: 'purchasing', label: '采购中', idx: 0 };
}

/** 路径标签（分发待接单显示来源路径） */
function pathLabel(o: ExternalOrder): string {
  if (o.path === 'self') return '自营';
  if (o.transferSource) return TRANSFER_SOURCE_LABELS[o.transferSource];
  if (o.distributeMode === 'grab') return '分发-抢单';
  if (o.distributeMode === 'compare') return '分发-比单';
  return '—';
}

/** 已接单订单重新流转的风险措辞 */
function processedWarnText(o: ExternalOrder): string {
  if (o.path === 'self') {
    const st = selfStage(o);
    if (st.key === 'outbound') return `该订单已接单且【已发货】（出库单 ${o.selfChain?.outboundCode}），重新流转将作废已有采购/出库单据，请谨慎确认！`;
    if (st.key === 'inbound') return `该订单已接单且【已到货入库】（入库单 ${o.selfChain?.inboundCode}），重新流转需先处理在库商品，请谨慎确认！`;
    return '该订单已被管理后台接单（采购中），重新流转将作废采购订单，请确认。';
  }
  const ps = o.partnerStatus;
  if (ps === 'shipping') return `该订单合作商【已发货】，重新流转将中断合作商履约并可能产生违约责任，请谨慎确认！`;
  if (ps === 'delivered' || ps === 'settled') return `该订单合作商【已签收/已结算】，重新流转将产生结算与积分回滚，请谨慎确认！`;
  return '该订单已被合作商接单，重新流转将收回订单并通知合作商，请确认。';
}

interface CustomerOption { id: string; name: string; typeLabel: string; level: string; contactPerson: string; contactPhone: string; contactAddress: string }

export default function ExternalOrders() {
  const orders = useOrderFlowStore((s) => s.orders);
  const settings = useOrderFlowStore((s) => s.settings);
  const store = useOrderFlowStore;
  const suppliers = useSupplierStore((s) => s.suppliers);
  const products = usePriceStore((s) => s.products);
  const scoreEntries = useScoreStore((s) => s.entries);

  const [filterStatus, setFilterStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** 录入弹窗 */
  const [entering, setEntering] = useState(false);
  const [platform, setPlatform] = useState<ExternalPlatform>('tmall');
  const [externalOrderNo, setExternalOrderNo] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [matchedCustomerId, setMatchedCustomerId] = useState('');
  const [customerType, setCustomerType] = useState('直营客户');
  const [customerRegion, setCustomerRegion] = useState('');
  const [receiver, setReceiver] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<ExternalOrderItem[]>([]);
  const [entryError, setEntryError] = useState('');

  /** 重新流转确认弹窗 */
  const [reflowing, setReflowing] = useState<ExternalOrder | null>(null);
  /** 删除确认弹窗 */
  const [deleting, setDeleting] = useState<ExternalOrder | null>(null);
  /** 报名情况弹窗 */
  const [enrollOf, setEnrollOf] = useState<string | null>(null);
  /** 直接选定弹窗 */
  const [awarding, setAwarding] = useState<{ orderId: string; supplierId: string; supplierName: string } | null>(null);
  const [awardReason, setAwardReason] = useState('');
  /** 流转设置弹窗 */
  const [showSettings, setShowSettings] = useState(false);

  /** 处理向导局部状态 */
  const [showDistribute, setShowDistribute] = useState(false);
  const [distributeMode, setDistributeMode] = useState<'assign' | 'grab' | 'compare'>('assign');
  const [assignSupplier, setAssignSupplier] = useState('');
  const [floorType, setFloorType] = useState<'discount' | 'price'>('discount');
  const [floorValue, setFloorValue] = useState('88');

  /** 修改抽屉编辑态 */
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    store.getState().expireGrabs();
  }, [store]);

  const activeSuppliers = useMemo(() => suppliers.filter((s) => s.status === 'active'), [suppliers]);
  const scoreOf = (id: string, name: string) => getScoreSummary(scoreEntries, id, name);

  const customerOptions: CustomerOption[] = useMemo(() => [
    ...customerItems.map((c) => ({ id: c.id, name: c.name, typeLabel: CUSTOMER_TYPE_LABELS[c.type], level: c.level || '—', contactPerson: c.contactPerson, contactPhone: c.contactPhone, contactAddress: c.contactAddress || c.region })),
    ...platformItems.map((p) => ({ id: p.id, name: p.name, typeLabel: '平台客户', level: '—', contactPerson: p.contactPerson, contactPhone: p.contactPhone, contactAddress: p.contactAddress })),
  ], []);

  const matchedCustomer = matchedCustomerId ? customerOptions.find((c) => c.id === matchedCustomerId) ?? null : null;
  const customerSuggestions = useMemo(() => {
    if (!customerSearch || matchedCustomer) return [];
    return customerOptions.filter((c) => c.name.includes(customerSearch)).slice(0, 6);
  }, [customerSearch, matchedCustomer, customerOptions]);

  const current = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;
  const enrollOrder = enrollOf ? orders.find((o) => o.id === enrollOf) ?? null : null;

  useEffect(() => {
    if (current) {
      setShowDistribute(false);
      setDistributeMode('assign');
      setAssignSupplier('');
      setEditForm({});
    }
  }, [selectedId]);

  const filtered = useMemo(() => orders.filter((o) => {
    if (keyword && !o.code.includes(keyword) && !o.customerName.includes(keyword) && !o.externalOrderNo.includes(keyword)) return false;
    if (filterStatus === '') return true;
    return mergedStatus(o.processStatus) === filterStatus;
  }), [orders, keyword, filterStatus]);

  const countOf = (key: string) => (key === '' ? orders.length : orders.filter((o) => mergedStatus(o.processStatus) === key).length);

  /* ── 录入 ── */
  const addItemRow = () => {
    const p = products[0];
    if (!p) return;
    let price = p.salesPrice;
    if (matchedCustomer) {
      const cust = customerItems.find((c) => c.id === matchedCustomer.id);
      if (cust) price = getSalesDefaultPrice(p.id, cust.id).price;
    }
    setItems((prev) => [...prev, { productId: p.id, productName: p.name, spec: p.spec, quantity: 1, price }]);
  };

  const setItemProduct = (idx: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    let price = p.salesPrice;
    if (matchedCustomer) {
      const cust = customerItems.find((c) => c.id === matchedCustomer!.id);
      if (cust) price = getSalesDefaultPrice(p.id, cust.id).price;
    }
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, productId, productName: p.name, spec: p.spec, price } : it)));
  };

  const minPriceWarning = (it: ExternalOrderItem): string => {
    if (!matchedCustomer) return '';
    const cust = customerItems.find((c) => c.id === matchedCustomer!.id);
    if (!cust || cust.type !== 'personal') return '';
    const min = getPersonalMinPrice(it.productId, cust.level || 'C级');
    if (min > 0 && it.price < min) return `低于该客户等级（${cust.level}）最低价 ${money(min)}`;
    return '';
  };

  const entryTotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const hasMinPriceWarning = items.some((it) => minPriceWarning(it));

  const selectCustomer = (c: CustomerOption) => {
    setMatchedCustomerId(c.id);
    setCustomerSearch(c.name);
    setCustomerType(c.typeLabel);
    if (c.contactPerson && !receiver) setReceiver(c.contactPerson);
    if (c.contactPhone && !receiverPhone) setReceiverPhone(c.contactPhone);
  };

  const confirmEntry = () => {
    if (!externalOrderNo.trim() || !customerSearch.trim() || !customerRegion.trim() || !receiver.trim()) {
      setEntryError('平台单号、客户名称、客户区域、收货人为必填');
      return;
    }
    if (items.length === 0 || items.some((it) => it.quantity <= 0)) {
      setEntryError('请至少录入一条商品行，且数量大于 0');
      return;
    }
    if (hasMinPriceWarning) {
      setEntryError('存在低于客户等级最低价的销售实价，请调整后再保存');
      return;
    }
    const order = store.getState().addExternalOrder({
      platform,
      externalOrderNo: externalOrderNo.trim(),
      customerName: customerSearch.trim(),
      customerType,
      customerRegion: customerRegion.trim(),
      items,
      receiver: receiver.trim(),
      receiverPhone: receiverPhone.trim() || '—',
      receiverAddress: receiverAddress.trim() || '—',
      remark: remark.trim() || undefined,
      operator: '运营人员',
      sourceChannel: 'manual',
    });
    setEntering(false);
    setExternalOrderNo(''); setCustomerSearch(''); setMatchedCustomerId(''); setCustomerRegion('');
    setReceiver(''); setReceiverPhone(''); setReceiverAddress(''); setRemark(''); setItems([]);
    setEntryError('');
    // 命中报备的订单已直接进入分发待接单，打开详情展示去向
    if (order.processStatus === 'distribute_pending') setSelectedId(order.id);
  };

  /* ── 重新流转 ── */
  const startReflow = (o: ExternalOrder) => setReflowing(o);
  const confirmReflow = () => {
    if (!reflowing) return;
    const o = reflowing;
    store.getState().resetToPending(o.id, ['processed', 'completed'].includes(o.processStatus) ? '管理后台重新流转（原执行信息作废）' : undefined);
    setReflowing(null);
    setSelectedId(null);
  };

  /* ── 详情抽屉开启（查看/查单） ── */
  const openDetail = (id: string) => setSelectedId(id);

  /* ── 编辑保存 ── */
  const startEdit = (order?: ExternalOrder) => {
    const target = order ?? current;
    if (!target) return;
    setEditForm({
      externalOrderNo: target.externalOrderNo,
      customerName: target.customerName,
      customerRegion: target.customerRegion,
      receiver: target.receiver,
      receiverPhone: target.receiverPhone,
      receiverAddress: target.receiverAddress,
      remark: target.remark ?? '',
    });
  };
  const saveEdit = () => {
    if (!current) return;
    store.getState().updateOrder(current.id, {
      externalOrderNo: editForm.externalOrderNo?.trim() || current.externalOrderNo,
      customerName: editForm.customerName?.trim() || current.customerName,
      customerRegion: editForm.customerRegion?.trim() || current.customerRegion,
      receiver: editForm.receiver?.trim() || current.receiver,
      receiverPhone: editForm.receiverPhone?.trim() || current.receiverPhone,
      receiverAddress: editForm.receiverAddress?.trim() || current.receiverAddress,
      remark: editForm.remark?.trim() || undefined,
    });
    setEditForm({});
  };

  const editField = (label: string, key: string, width = '100%') => (
    <div>
      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>{label}</label>
      <input className="filter-input" style={{ width }} value={editForm[key] ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))} />
    </div>
  );

  /* ── 渲染 ── */
  return (
    <>
      <ContentHeader title="订单处理" breadcrumbs={['销售', '订单处理']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          订单处理是<strong>销售订单的入口</strong>：处理订单生成到分发合作商或自营，明确订单由谁来接单。两个来源渠道：<strong>手工录入</strong>与<strong>直连推送</strong>。
          命中报备的订单自动进入<strong>分发待接单</strong>（报备分发）；其余订单选自营（管理后台在销售订单接单，接单时填跟单人）或分发（指定 / 抢单 / 比单报名制）。
          待接单订单可「重新流转」回待处理重新选择路径；已接单的重新流转需二次确认。
        </div>

        {/* 状态栏流程图：待处理(左中) ─ 顶中出线→[自营]→[自营待接单]→已处理顶中 / 底中出线→[2×2虚线框]→[分发待接单]→已处理底中，两个待接单右缘对齐 */}
        <style>{`
          .eop-flowbar { display: flex; align-items: center; gap: 14px; margin-bottom: var(--space-4); flex-wrap: nowrap; overflow-x: auto; padding: 6px 0; }
          .eop-flow { display: flex; align-items: center; gap: 20px; }
          .eop-nodebox { position: relative; display: flex; flex: none; }
          .eop-nodebox > .tab-card-simple { position: relative; z-index: 1; }
          /* 上路线：从按钮顶中向上 39px，再向右横接分支区左缘 */
          .eop-nodebox .up-v { position: absolute; left: 50%; transform: translateX(-1px); bottom: 100%; height: 39px; width: 2px; background: var(--color-neutral-300); }
          .eop-nodebox .up-h { position: absolute; top: -39px; left: 50%; width: calc(50% + 20px); height: 2px; background: var(--color-neutral-300); }
          .eop-nodebox.right .up-h { left: auto; right: 50%; }
          /* 下路线：从按钮底中向下 29px，再向右横接分支区左缘 */
          .eop-nodebox .dn-v { position: absolute; left: 50%; transform: translateX(-1px); top: 100%; height: 29px; width: 2px; background: var(--color-neutral-300); }
          .eop-nodebox .dn-h { position: absolute; top: calc(100% + 29px); left: 50%; width: calc(50% + 20px); height: 2px; background: var(--color-neutral-300); }
          .eop-nodebox.right .dn-h { left: auto; right: 50%; }
          /* 路线标签（嵌在待处理出线的横线上） */
          .eop-lbl { position: absolute; font-size: var(--text-xs); color: var(--color-neutral-500); background: var(--color-neutral-0); padding: 0 4px; line-height: 14px; z-index: 1; }
          .eop-lbl.up { top: -39px; left: calc(50% + 8px); transform: translateY(-50%); }
          .eop-lbl.dn { top: calc(100% + 29px); left: calc(50% + 8px); transform: translateY(-50%); }
          /* 箭头：→ 进入节点 / ↓ 进入已处理顶中 / ↑ 进入已处理底中 */
          .eop-arr-r::after { content: ''; position: absolute; right: -1px; top: 50%; transform: translateY(-50%); border-left: 5px solid var(--color-neutral-300); border-top: 4px solid transparent; border-bottom: 4px solid transparent; }
          .eop-arr-d::after { content: ''; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%); border-top: 5px solid var(--color-neutral-300); border-left: 4px solid transparent; border-right: 4px solid transparent; }
          .eop-arr-u::after { content: ''; position: absolute; top: -1px; left: 50%; transform: translateX(-50%); border-bottom: 5px solid var(--color-neutral-300); border-left: 4px solid transparent; border-right: 4px solid transparent; }
          .eop-nodebox.right .up-v { bottom: auto; top: -39px; height: 39px; }  /* 已处理侧竖线向下到顶中 */
          .eop-nodebox.right .dn-v { top: auto; bottom: -29px; height: 29px; }  /* 已处理侧竖线向上到底中 */
          /* 分支区：固定行高保证连线锚点稳定（上行64 + 中缝44 + 下行84 = 192） */
          .eop-branches { display: flex; flex-direction: column; flex: none; }
          .eop-toprow { height: 64px; display: flex; align-items: center; }
          .eop-midgap { height: 44px; }
          .eop-botrow { height: 84px; display: flex; align-items: center; }
          .eop-grow { flex: 1; min-width: 12px; height: 2px; background: var(--color-neutral-300); }
          .eop-hln { position: relative; width: 18px; height: 2px; background: var(--color-neutral-300); flex: none; }
          /* 虚线框：报备·指定·抢单中·比单中 一行并列 */
          .eop-box { display: flex; gap: 12px; padding: 9px 12px; align-items: center; border: 1.5px dashed var(--color-neutral-300); border-radius: 12px; flex: none; }
          .eop-box .tab-card-simple { justify-content: center; }
          .eop-dim { opacity: .45; cursor: not-allowed; }
        `}</style>
        <div className="eop-flowbar">
          <button className={`tab-card-simple${filterStatus === '' ? ' active' : ''}`} onClick={() => setFilterStatus('')}>
            全部
            <span className="tab-card-simple-count">{orders.length}</span>
          </button>

          <div className="eop-flow">
            {/* 待处理：顶中出上线(自营) / 底中出下线(分发) */}
            <div className="eop-nodebox">
              <i className="up-v" aria-hidden="true" />
              <i className="up-h eop-arr-r" aria-hidden="true" />
              <span className="eop-lbl up" aria-hidden="true">自营</span>
              <i className="dn-v" aria-hidden="true" />
              <i className="dn-h eop-arr-r" aria-hidden="true" />
              <span className="eop-lbl dn" aria-hidden="true">分发</span>
              <button className={`tab-card-simple${filterStatus === 'pending' ? ' active' : ''}`} onClick={() => setFilterStatus('pending')}>
                待处理
                <span className="tab-card-simple-count">{countOf('pending')}</span>
              </button>
            </div>

            <div className="eop-branches">
              {/* 上路：自营(路径，置灰) → 自营待接单（右缘与分发待接单对齐） */}
              <div className="eop-toprow">
                <button className="tab-card-simple eop-dim" disabled title="选择自营路径即时进入自营待接单，无中间状态">自营</button>
                <i className="eop-hln eop-arr-r" aria-hidden="true" />
                <button className={`tab-card-simple${filterStatus === 'self_pending' ? ' active' : ''}`} onClick={() => setFilterStatus('self_pending')}>
                  自营待接单
                  <span className="tab-card-simple-count">{countOf('self_pending')}</span>
                </button>
                <i className="eop-grow" aria-hidden="true" />
              </div>
              <div className="eop-midgap" />
              {/* 下路：4 个分发方式 2×2（整体虚线框）→ 分发待接单 */}
              <div className="eop-botrow">
                <div className="eop-box">
                  <button className="tab-card-simple eop-dim" disabled title="报备命中即时转出，无中间状态">报备</button>
                  <button className="tab-card-simple eop-dim" disabled title="指定分发即时转出，无中间状态">指定</button>
                  <button className={`tab-card-simple${filterStatus === 'grabbing' ? ' active' : ''}`} onClick={() => setFilterStatus('grabbing')}>
                    抢单中
                    <span className="tab-card-simple-count">{countOf('grabbing')}</span>
                  </button>
                  <button className={`tab-card-simple${filterStatus === 'comparing' ? ' active' : ''}`} onClick={() => setFilterStatus('comparing')}>
                    比单中
                    <span className="tab-card-simple-count">{countOf('comparing')}</span>
                  </button>
                </div>
                <i className="eop-hln eop-arr-r" aria-hidden="true" />
                <button className={`tab-card-simple${filterStatus === 'distribute_pending' ? ' active' : ''}`} onClick={() => setFilterStatus('distribute_pending')}>
                  分发待接单
                  <span className="tab-card-simple-count">{countOf('distribute_pending')}</span>
                </button>
              </div>
            </div>

            {/* 已处理：顶中入上线(↓) / 底中入下线(↑) */}
            <div className="eop-nodebox right">
              <i className="up-v eop-arr-d" aria-hidden="true" />
              <i className="up-h" aria-hidden="true" />
              <i className="dn-v eop-arr-u" aria-hidden="true" />
              <i className="dn-h" aria-hidden="true" />
              <button className={`tab-card-simple${filterStatus === 'processed' ? ' active' : ''}`} onClick={() => setFilterStatus('processed')}>
                已处理
                <span className="tab-card-simple-count">{countOf('processed')}</span>
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="搜索订单编号、客户、平台单号..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setShowSettings(true)}>流转设置</Button>
            <Button onClick={() => setEntering(true)}>+ 录入订单</Button>
          </span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '来源', '客户', '商品', '金额', '状态', '路径', '合作商', '录入时间', '操作']}
            rows={filtered.map((o) => [
              <span key="c" className="cell-mono-emph">{o.code}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.externalOrderNo}</span></span>,
              <span key="src">
                {EXTERNAL_PLATFORM_LABELS[o.platform]}
                <span style={{ display: 'block' }}>{pill(
                  o.sourceChannel === 'push' ? '#F3E5F5' : '#E3F2FD',
                  o.sourceChannel === 'push' ? '#7B1FA2' : '#0F64B5',
                  EXTERNAL_CHANNEL_LABELS[o.sourceChannel],
                )}</span>
              </span>,
              <span key="cu" className="cell-emph">{o.customerName}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.customerRegion}</span></span>,
              <span key="i" style={{ whiteSpace: 'nowrap' }}>{o.items[0].productName}{o.items.length > 1 ? ` 等${o.items.length}种` : ''}</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{money(o.totalAmount)}</span>,
              <span key="s">
                {statusPill(o.processStatus)}
                {['processed', 'completed'].includes(o.processStatus) && o.path === 'self' && (
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>{selfStage(o).label}</span>
                )}
                {['processed', 'completed'].includes(o.processStatus) && o.path === 'distribute' && o.partnerStatus && (
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>{PARTNER_ORDER_STATUS_LABELS[o.partnerStatus]}</span>
                )}
              </span>,
              <span key="pa" style={{ fontSize: 'var(--text-sm)' }}>{pathLabel(o)}</span>,
              <span key="pt" style={{ fontSize: 'var(--text-sm)' }}>{o.partnerName ?? '—'}</span>,
              <span key="t" className="cell-muted" style={{ whiteSpace: 'nowrap' }}>{o.entryTime}</span>,
              <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                {o.processStatus === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => setSelectedId(o.id)}>处理</Button>
                    {o.sourceChannel === 'manual' && <Button size="sm" variant="ghost" onClick={() => { setSelectedId(o.id); startEdit(o); }}>修改</Button>}
                    {o.sourceChannel === 'manual' && <Button size="sm" variant="ghost" onClick={() => setDeleting(o)}>删除</Button>}
                  </>
                )}
                {(o.processStatus === 'self_pending' || o.processStatus === 'distribute_pending') && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                    <Button size="sm" variant="secondary" onClick={() => startReflow(o)}>重新流转</Button>
                  </>
                )}
                {o.processStatus === 'grabbing' && (
                  <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                )}
                {o.processStatus === 'comparing' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查单</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEnrollOf(o.id)}>报名情况</Button>
                  </>
                )}
                {(o.processStatus === 'processed' || o.processStatus === 'completed') && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                    <Button size="sm" variant="secondary" onClick={() => startReflow(o)}>重新流转</Button>
                  </>
                )}
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* ── 详情 / 处理抽屉 ── */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="WB"
        title={current?.code ?? ''}
        statusTag={current ? statusPill(current.processStatus) : null}
        subtitle={current ? `${EXTERNAL_PLATFORM_LABELS[current.platform]} · ${current.externalOrderNo} · ${EXTERNAL_CHANNEL_LABELS[current.sourceChannel]} · ${current.customerName}` : ''}
        footer={
          Object.keys(editForm).length > 0 ? (
            <>
              <Button variant="ghost" onClick={() => setEditForm({})}>取消</Button>
              <Button onClick={saveEdit}>保存修改</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>
              {current && current.processStatus !== 'pending' && current.processStatus !== 'processed' && current.processStatus !== 'completed' && (
                <Button variant="secondary" onClick={() => startReflow(current)}>重新流转</Button>
              )}
              {current && current.sourceChannel === 'manual' && !['processed', 'completed'].includes(current.processStatus) && (
                <Button onClick={() => startEdit()}>修改</Button>
              )}
            </>
          )
        }
      >
        {current && (
          <>
            {/* ── 查看态：订单信息 ── */}
            {!editForm.externalOrderNo && Object.keys(editForm).length === 0 && (
              <DrawerSection title="订单信息">
                <InfoGrid>
                  <InfoItem label="订单编号" mono emph>{current.code}</InfoItem>
                  <InfoItem label="来源平台">{EXTERNAL_PLATFORM_LABELS[current.platform]}</InfoItem>
                  <InfoItem label="平台原始单号" mono>{current.externalOrderNo}</InfoItem>
                  <InfoItem label="来源渠道">{current.sourceChannel === 'manual' ? '手工录入' : '直连推送'}</InfoItem>
                  <InfoItem label="客户">{current.customerName}（{current.customerType}）</InfoItem>
                  <InfoItem label="客户区域">{current.customerRegion}</InfoItem>
                  <InfoItem label="订单金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>{money(current.totalAmount)}</InfoItem>
                  <InfoItem label="录入时间">{current.entryTime}</InfoItem>
                  <InfoItem label="录入人">{current.operator}</InfoItem>
                  <InfoItem label="当前路径">{pathLabel(current)}</InfoItem>
                </InfoGrid>
              </DrawerSection>
            )}

            {/* ── 编辑态：订单信息修改 ── */}
            {Object.keys(editForm).length > 0 && (
              <DrawerSection title="修改订单信息">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  {editField('平台原始单号', 'externalOrderNo')}
                  {editField('客户名称', 'customerName')}
                  {editField('客户区域', 'customerRegion')}
                  {editField('收货人', 'receiver')}
                  {editField('联系电话', 'receiverPhone')}
                  <div style={{ gridColumn: 'span 2' }}>{editField('收货地址', 'receiverAddress')}</div>
                  <div style={{ gridColumn: 'span 2' }}>{editField('备注', 'remark')}</div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Button variant="ghost" onClick={() => setEditForm({})}>取消</Button>
                  <Button onClick={saveEdit}>保存修改</Button>
                </div>
              </DrawerSection>
            )}

            <DrawerSection title={`商品明细（${current.items.length} 种）`}>
              <table className="detail-inline-table">
                <thead><tr><th>商品名称</th><th>规格</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>
                <tbody>
                  {current.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                      <td>{it.spec}</td>
                      <td className="mono">{it.quantity}</td>
                      <td className="mono">{money(it.price)}</td>
                      <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{money(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DrawerSection>

            {/* ── 待处理：路径选择 ── */}
            {current.processStatus === 'pending' && (
              <DrawerSection title="分流处理">
                {!showDistribute ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <button className="tab-card-simple" style={{ padding: 'var(--space-4)', flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left' }} onClick={() => store.getState().chooseSelfPath(current.id)}>
                      <strong style={{ fontSize: 'var(--text-md)' }}>自营 · 背对背</strong>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>进入自营待接单，管理后台在销售订单接单后以销定采</span>
                    </button>
                    <button className="tab-card-simple" style={{ padding: 'var(--space-4)', flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left' }} onClick={() => setShowDistribute(true)}>
                      <strong style={{ fontSize: 'var(--text-md)' }}>分发 · 合作商</strong>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>指定 / 抢单（时间优先）/ 比单（公开报名制）</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      <button className={`tab-card-simple${distributeMode === 'assign' ? ' active' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left', padding: 'var(--space-3)' }} onClick={() => setDistributeMode('assign')}>
                        <strong>指定</strong>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>直接指定合作商</span>
                      </button>
                      <button className={`tab-card-simple${distributeMode === 'grab' ? ' active' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left', padding: 'var(--space-3)' }} onClick={() => setDistributeMode('grab')}>
                        <strong>抢单</strong>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{settings.grabMinutes} 分钟先到先得</span>
                      </button>
                      <button className={`tab-card-simple${distributeMode === 'compare' ? ' active' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left', padding: 'var(--space-3)' }} onClick={() => setDistributeMode('compare')}>
                        <strong>比单</strong>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>公开报名 · 报价+积分评分</span>
                      </button>
                    </div>

                    {distributeMode === 'assign' && (
                      <div>
                        <table className="detail-inline-table">
                          <thead><tr><th></th><th>合作商</th><th>积分</th><th>履约率</th></tr></thead>
                          <tbody>
                            {activeSuppliers.map((s) => {
                              const sc = scoreOf(s.id, s.name);
                              return (
                                <tr key={s.id}>
                                  <td><input type="radio" name="assign-supplier" checked={assignSupplier === s.id} onChange={() => setAssignSupplier(s.id)} /></td>
                                  <td style={{ fontWeight: 'var(--font-medium)' }}>{s.name}</td>
                                  <td className="mono">{sc.total}</td>
                                  <td className="mono">{sc.ontimeRate}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                          <Button disabled={!assignSupplier} onClick={() => {
                            const s = activeSuppliers.find((x) => x.id === assignSupplier)!;
                            store.getState().assignPartner(current.id, s.id, s.name);
                          }}>指定并转出</Button>
                        </div>
                      </div>
                    )}

                    {distributeMode === 'grab' && (
                      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>发布后合作商在终端「抢单大厅」抢单，{settings.grabMinutes} 分钟内先到先得，超时自动退回待处理。</span>
                        <Button onClick={() => store.getState().publishGrab(current.id)}>发布抢单</Button>
                      </div>
                    )}

                    {distributeMode === 'compare' && (
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>
                          公开报名制：全部合作商可在 {settings.compareMinutes} 分钟内报名（报价默认带出其系统报价，可调但不低于底价），截止后按「报价 {settings.compareWeights.quote}0% + 积分 {settings.compareWeights.score}0%」评分定标。
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', marginBottom: 'var(--space-3)' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>底价方式</label>
                            <select className="filter-input" value={floorType} onChange={(e) => setFloorType(e.target.value as 'discount' | 'price')} style={{ width: 140 }}>
                              <option value="discount">按折扣</option>
                              <option value="price">按具体价格</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>
                              {floorType === 'discount' ? '最低折扣（%）' : '最低价格（元）'}
                            </label>
                            <input className="filter-input mono" type="number" min={1} value={floorValue} onChange={(e) => setFloorValue(e.target.value)} style={{ width: 140 }} />
                          </div>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', flex: 1 }}>
                            {floorType === 'discount'
                              ? `报名价不得低于订单金额 ${floorValue} 折（${money(compareFloorAmount(current.totalAmount, { type: 'discount', value: Number(floorValue) || 0 }))}）`
                              : `报名价不得低于 ${money(Number(floorValue) || 0)}`}
                          </div>
                        </div>
                        <Button onClick={() => {
                          const v = Number(floorValue);
                          if (!v || v <= 0) return;
                          store.getState().startCompare(current.id, { type: floorType, value: v });
                        }}>发起比单</Button>
                      </div>
                    )}
                    <Button variant="ghost" style={{ marginTop: 'var(--space-3)' }} onClick={() => { setShowDistribute(false); setAssignSupplier(''); }}>返回路径选择</Button>
                  </div>
                )}
              </DrawerSection>
            )}

            {/* ── 自营待接单 ── */}
            {current.processStatus === 'self_pending' && (
              <DrawerSection title="自营待接单">
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7 }}>
                  请前往 <strong>销售 → 销售订单 → 流转订单</strong> 点击「接单」，接单时填写<strong>跟单人</strong>并选择<strong>采购供应商</strong>后进入自营执行。
                  需要改路径可点击「重新流转」退回待处理。
                </div>
              </DrawerSection>
            )}

            {/* ── 抢单中 ── */}
            {current.processStatus === 'grabbing' && current.grabDeadline && (
              <DrawerSection title="抢单进行中（时间优先）">
                <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
                  剩余时间：
                  <strong className="mono" style={{ color: (current.grabDeadline - tick) > 0 ? '#E65100' : '#C62828' }}>
                    {Math.max(0, Math.floor((current.grabDeadline - tick) / 60000))} 分 {Math.max(0, Math.floor(((current.grabDeadline - tick) % 60000) / 1000))} 秒
                  </strong>
                  <Button size="sm" variant="ghost" style={{ marginLeft: 12 }} onClick={() => store.getState().extendGrab(current.id, 10)}>延长 10 分钟</Button>
                </div>
                {(current.grabRecords?.length ?? 0) > 0 ? (
                  <div style={{ fontSize: 'var(--text-sm)' }}>中单合作商：<strong>{current.grabRecords![0].supplierName}</strong>（{current.grabRecords![0].grabTime}）</div>
                ) : (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无合作商抢单，可等待或在合作商终端「抢单大厅」演示抢单；超时后自动退回待处理</div>
                )}
              </DrawerSection>
            )}

            {/* ── 比单中（公开报名） ── */}
            {current.processStatus === 'comparing' && current.compare && (
              <DrawerSection title="比单报名中（公开报名制）">
                <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)', lineHeight: 1.7 }}>
                  已报名 <strong className="mono">{current.compare.quotes.length}</strong> 家 · 截止剩余：
                  <strong className="mono" style={{ color: (current.compare.deadline - tick) > 0 ? '#7B1FA2' : '#C62828' }}>
                    {' '}{Math.max(0, Math.floor((current.compare.deadline - tick) / 60000))} 分 {Math.max(0, Math.floor(((current.compare.deadline - tick) % 60000) / 1000))} 秒
                  </strong>
                  <Button size="sm" variant="ghost" style={{ marginLeft: 12 }} onClick={() => store.getState().extendCompare(current.id, 10)}>延长 10 分钟</Button>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: '#B26A00', marginBottom: 'var(--space-2)' }}>底价：{current.compare.floorNote}</div>
                <table className="detail-inline-table">
                  <thead><tr><th>合作商</th><th>报名报价</th><th>报名时间</th><th>操作</th></tr></thead>
                  <tbody>
                    {current.compare.quotes.length === 0 && (
                      <tr><td colSpan={4} style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 'var(--space-3)' }}>暂无合作商报名</td></tr>
                    )}
                    {current.compare.quotes.map((q) => (
                      <tr key={q.supplierId}>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>{q.supplierName}</td>
                        <td className="mono">{money(q.amount)}</td>
                        <td className="mono">{q.quoteTime}</td>
                        <td><Button size="sm" variant="ghost" onClick={() => { setAwarding({ orderId: current.id, supplierId: q.supplierId, supplierName: q.supplierName }); setAwardReason(''); }}>直接选定</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>
                  截止后在「销售 → 比单管理」评分定标；也可在报名合作商中直接选定（转为指定分发）
                </div>
              </DrawerSection>
            )}

            {/* ── 分发待接单 ── */}
            {current.processStatus === 'distribute_pending' && current.partnerName && (
              <DrawerSection title="分发待接单">
                <InfoGrid>
                  <InfoItem label="合作商">{current.partnerName}</InfoItem>
                  <InfoItem label="分发方式">{TRANSFER_SOURCE_LABELS[current.transferSource ?? '']}</InfoItem>
                  <InfoItem label="分发时间">{current.transferTime ?? '—'}</InfoItem>
                  {current.reportMatches?.[0] && <InfoItem label="命中报备" mono>{current.reportMatches[0].reportCode}</InfoItem>}
                </InfoGrid>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginTop: 'var(--space-2)', lineHeight: 1.7 }}>
                  等待合作商在终端<strong>订单管理</strong>点击「接单」；接单后订单进入<strong>已处理</strong>。改路径可「重新流转」退回待处理。
                </div>
              </DrawerSection>
            )}

            {/* ── 已处理：自营执行 ── */}
            {(current.processStatus === 'processed' || current.processStatus === 'completed') && current.path === 'self' && current.selfChain && (
              <DrawerSection title="自营执行（以销定采）">
                <InfoGrid>
                  <InfoItem label="采购订单" mono>{current.selfChain.purchaseOrderCode}</InfoItem>
                  <InfoItem label="采购供应商">{current.selfChain.supplierName}</InfoItem>
                  <InfoItem label="采购金额" mono>{money(current.selfChain.purchaseAmount)}</InfoItem>
                  <InfoItem label="入库单号" mono>{current.selfChain.inboundCode ?? '—'}</InfoItem>
                  <InfoItem label="出库单号" mono>{current.selfChain.outboundCode ?? '—'}</InfoItem>
                </InfoGrid>
                {(() => {
                  const st = selfStage(current);
                  const steps = ['采购中', '到货入库', '出库发货', '客户签收'];
                  return (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                      {steps.map((label, i) => (
                        <span key={label} style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: i <= st.idx ? '#E8F5E9' : '#F5F5F5', color: i <= st.idx ? '#01795D' : '#9E9E9E' }}>{i + 1}. {label}</span>
                      ))}
                    </div>
                  );
                })()}
                {current.processStatus === 'processed' && (
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                    {!current.selfChain.inboundCode && <Button onClick={() => store.getState().selfInbound(current.id)}>确认到货入库</Button>}
                    {current.selfChain.inboundCode && !current.selfChain.outboundCode && <Button onClick={() => store.getState().selfOutbound(current.id)}>出库发货</Button>}
                    {current.selfChain.outboundCode && <Button onClick={() => store.getState().selfComplete(current.id)}>确认签收完成</Button>}
                  </div>
                )}
              </DrawerSection>
            )}

            {/* ── 已处理：合作商履约 ── */}
            {(current.processStatus === 'processed' || current.processStatus === 'completed') && current.path === 'distribute' && current.partnerName && (
              <DrawerSection title="合作商履约">
                <InfoGrid>
                  <InfoItem label="合作商">{current.partnerName}</InfoItem>
                  <InfoItem label="分发方式">{TRANSFER_SOURCE_LABELS[current.transferSource ?? '']}</InfoItem>
                  <InfoItem label="履约状态">{current.partnerStatus ? PARTNER_ORDER_STATUS_LABELS[current.partnerStatus] : '待接单'}</InfoItem>
                  {current.processStatus === 'completed' && (
                    <InfoItem label="结算履约">{current.settleOnTime === true ? '按时（积分 +5）' : current.settleOnTime === false ? '超时（积分 -5）' : '—'}</InfoItem>
                  )}
                </InfoGrid>
                {current.processStatus === 'processed' && (
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                    {current.partnerStatus === 'accepted' && <Button onClick={() => store.getState().advancePartner(current.id, 'shipping')}>推进：发货</Button>}
                    {current.partnerStatus === 'shipping' && <Button onClick={() => store.getState().advancePartner(current.id, 'delivered')}>推进：客户签收</Button>}
                    {current.partnerStatus === 'delivered' && (
                      <>
                        <Button onClick={() => store.getState().advancePartner(current.id, 'settled', { onTime: true })}>结算（按时 · 积分+5）</Button>
                        <Button variant="danger" onClick={() => store.getState().advancePartner(current.id, 'settled', { onTime: false })}>结算（超时 · 积分-5）</Button>
                      </>
                    )}
                  </div>
                )}
              </DrawerSection>
            )}

            <DrawerSection title="收货信息">
              <InfoGrid>
                <InfoItem label="收货人">{current.receiver}</InfoItem>
                <InfoItem label="联系电话" mono>{current.receiverPhone}</InfoItem>
                <InfoItem label="收货地址" span={3}>{current.receiverAddress}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="处理轨迹">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {current.history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                    <span className="mono" style={{ color: 'var(--color-neutral-400)', flexShrink: 0 }}>{h.time}</span>
                    <span style={{ fontWeight: 'var(--font-medium)', flexShrink: 0 }}>{h.action}</span>
                    {h.detail && <span style={{ color: 'var(--color-neutral-500)' }}>{h.detail}</span>}
                  </div>
                ))}
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* ── 重新流转确认弹窗 ── */}
      {reflowing && (
        <div className="category-dialog-overlay" onClick={() => setReflowing(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>重新流转</div>
            {['processed', 'completed'].includes(reflowing.processStatus) && (
              <div style={{ padding: '10px 14px', background: '#FFF3E0', color: '#E65100', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)', lineHeight: 1.7, fontWeight: 'var(--font-medium)' }}>
                {processedWarnText(reflowing)}
              </div>
            )}
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              确认后订单 <strong className="mono">{reflowing.code}</strong> 将<strong>进入待处理状态重新选择路径</strong>
              {['processed', 'completed'].includes(reflowing.processStatus) ? `，原有执行信息（${reflowing.path === 'self' ? '采购/出入库单据' : '合作商关联、履约进度'}）全部作废。` : '，可重新选择自营或分发路径。'}
              {reflowing.transferSource === 'report' && ' 该订单原为报备分发，重新流转后报备匹配信息已清除，不会再自动按报备分发。'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setReflowing(null)}>取消</Button>
              <Button variant={['processed', 'completed'].includes(reflowing.processStatus) ? 'danger' : undefined} onClick={confirmReflow}>确认重新流转</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 删除确认弹窗 ── */}
      {deleting && (
        <div className="category-dialog-overlay" onClick={() => setDeleting(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>删除订单</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              确认删除待处理订单 <strong className="mono">{deleting.code}</strong>（{deleting.customerName} · {money(deleting.totalAmount)}）？删除后不可恢复。
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setDeleting(null)}>取消</Button>
              <Button variant="danger" onClick={() => { store.getState().deleteOrder(deleting.id); setDeleting(null); }}>确认删除</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 报名情况弹窗（比单中） ── */}
      {enrollOrder?.compare && (
        <div className="category-dialog-overlay" onClick={() => setEnrollOf(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxWidth: '94vw' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>比单报名情况</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              {enrollOrder.code} · {enrollOrder.customerName} · 订单金额 {money(enrollOrder.totalAmount)} · 已报名 <strong className="mono">{enrollOrder.compare.quotes.length}</strong> 家 ·
              截止剩余 <strong className="mono" style={{ color: (enrollOrder.compare.deadline - tick) > 0 ? '#7B1FA2' : '#C62828' }}>{Math.max(0, Math.floor((enrollOrder.compare.deadline - tick) / 60000))} 分</strong>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#B26A00', marginBottom: 'var(--space-3)' }}>底价：{enrollOrder.compare.floorNote}</div>
            <table className="detail-inline-table" style={{ marginBottom: 'var(--space-3)' }}>
              <thead><tr><th>合作商</th><th>报名报价</th><th>报名时间</th><th>操作</th></tr></thead>
              <tbody>
                {enrollOrder.compare.quotes.length === 0 && (
                  <tr><td colSpan={4} style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 'var(--space-3)' }}>暂无合作商报名</td></tr>
                )}
                {enrollOrder.compare.quotes.map((q) => (
                  <tr key={q.supplierId}>
                    <td style={{ fontWeight: 'var(--font-medium)' }}>{q.supplierName}</td>
                    <td className="mono">{money(q.amount)}</td>
                    <td className="mono">{q.quoteTime}</td>
                    <td><Button size="sm" variant="ghost" onClick={() => { setAwarding({ orderId: enrollOrder.id, supplierId: q.supplierId, supplierName: q.supplierName }); setAwardReason(''); }}>直接选定</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="ghost" onClick={() => store.getState().extendCompare(enrollOrder.id, 10)}>延长报名 10 分钟</Button>
              <Button variant="ghost" onClick={() => setEnrollOf(null)}>关闭</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 直接选定弹窗 ── */}
      {awarding && (
        <div className="category-dialog-overlay" onClick={() => setAwarding(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 460 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>直接选定合作商</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              选定 <strong>{awarding.supplierName}</strong>，订单将跳过评分直接转为<strong>指定分发</strong>，进入分发待接单等待其接单。
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>选定理由 *</label>
              <input className="filter-input" placeholder="如：报价合理且区域履约能力强" value={awardReason} onChange={(e) => setAwardReason(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setAwarding(null)}>取消</Button>
              <Button disabled={!awardReason.trim()} onClick={() => {
                store.getState().awardCompare(awarding.orderId, awarding.supplierId, awardReason);
                setAwarding(null);
                setEnrollOf(null);
                setSelectedId(null);
              }}>确认选定</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 流转设置弹窗 ── */}
      {showSettings && (
        <div className="category-dialog-overlay" onClick={() => setShowSettings(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>订单流转设置</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-neutral-150)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>抢单时长（分钟）</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>发布抢单后合作商可抢的时间窗口</div>
              </div>
              <input className="filter-input mono" type="number" min={5} value={settings.grabMinutes} onChange={(e) => store.getState().updateSettings({ grabMinutes: Math.max(1, Number(e.target.value) || 30) })} style={{ width: 90 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-neutral-150)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>比单报名时长（分钟）</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>发起比单后合作商报名窗口</div>
              </div>
              <input className="filter-input mono" type="number" min={5} value={settings.compareMinutes} onChange={(e) => store.getState().updateSettings({ compareMinutes: Math.max(1, Number(e.target.value) || 30) })} style={{ width: 90 }} />
            </div>
            <div style={{ padding: 'var(--space-3) 0' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>比单评分权重（报价 / 积分）</div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                {(['quote', 'score'] as const).map((k) => (
                  <div key={k} style={{ flex: 1 }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{k === 'quote' ? '报价' : '积分'}</label>
                    <input className="filter-input mono" type="number" min={0} max={10} value={settings.compareWeights[k]}
                      onChange={(e) => store.getState().updateSettings({ compareWeights: { ...settings.compareWeights, [k]: Math.max(0, Number(e.target.value) || 0) } })}
                      style={{ width: '100%' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <Button onClick={() => setShowSettings(false)}>完成</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 录入订单弹窗 ── */}
      {entering && (
        <div className="category-dialog-overlay" onClick={() => setEntering(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 760, maxWidth: '94vw' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>录入订单</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              手工录入外部平台订单。客户名称支持从<strong>客户管理</strong>匹配（带出类型/联系人并按客户报价带出默认价）。
              保存后自动报备匹配，命中即自动转出合作商。
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>来源平台 *</label>
                <select className="filter-input" value={platform} onChange={(e) => setPlatform(e.target.value as ExternalPlatform)} style={{ width: '100%' }}>
                  {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>平台原始单号 *</label>
                <input className="filter-input" placeholder="如 TM-88213907" value={externalOrderNo} onChange={(e) => { setExternalOrderNo(e.target.value); setEntryError(''); }} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>客户类型</label>
                <select className="filter-input" value={customerType} onChange={(e) => setCustomerType(e.target.value)} style={{ width: '100%' }}>
                  {['直营客户', '渠道客户', '平台客户', '个人客户', '带货客户'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>客户名称 *（输入可搜索在库客户）</label>
              <input
                className="filter-input" placeholder="输入客户名称，支持搜索客户管理中的在库客户" style={{ width: '100%' }}
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setMatchedCustomerId(''); setEntryError(''); }}
              />
              {customerSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: 220, overflowY: 'auto', background: '#fff', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {customerSuggestions.map((c) => (
                    <div key={c.id} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onClick={() => selectCustomer(c)}>
                      <span>{c.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{c.typeLabel} · {c.level}</span>
                    </div>
                  ))}
                </div>
              )}
              {matchedCustomer && (
                <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  <span>✓ 已匹配在库客户</span>
                  <span>联系人：{matchedCustomer.contactPerson}</span>
                  <span>等级：{matchedCustomer.level}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>客户区域 *</label>
                <input className="filter-input" placeholder="如 江苏南京" value={customerRegion} onChange={(e) => { setCustomerRegion(e.target.value); setEntryError(''); }} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>收货人 *</label>
                <input className="filter-input" placeholder="收货人姓名" value={receiver} onChange={(e) => { setReceiver(e.target.value); setEntryError(''); }} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>收货地址</label>
                <input className="filter-input" placeholder="省市区 + 详细地址" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>联系电话</label>
                <input className="filter-input" placeholder="联系电话" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>商品明细 *</label>
                <Button size="sm" variant="ghost" onClick={addItemRow}>+ 添加商品行</Button>
              </div>
              {items.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', padding: 'var(--space-2) 0' }}>尚未添加商品行</div>}
              {items.map((it, idx) => {
                const warn = minPriceWarning(it);
                return (
                  <div key={idx} style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.8fr 1fr auto', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <select className="filter-input" value={it.productId} onChange={(e) => setItemProduct(idx, e.target.value)} style={{ width: '100%' }}>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}（{p.spec}）</option>)}
                      </select>
                      <input className="filter-input mono" type="number" min={1} placeholder="数量" value={it.quantity} onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x)))} style={{ width: '100%' }} />
                      <input className="filter-input mono" type="number" min={0} placeholder="销售实价" value={it.price} onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))} style={{ width: '100%', borderColor: warn ? '#CB405D' : undefined }} />
                      <Button size="sm" variant="ghost" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>删除</Button>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: warn ? '#CB405D' : 'var(--color-neutral-400)', marginTop: 2, paddingLeft: 2 }}>
                      {warn ? `⚠ ${warn}` : ''}
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize: 'var(--text-sm)', textAlign: 'right' }}>
                合计：<strong className="mono" style={{ color: 'var(--color-module-current-base)', fontSize: 'var(--text-md)' }}>{money(entryTotal)}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>备注</label>
              <input className="filter-input" placeholder="订单备注（平台要求、客户要求等）" value={remark} onChange={(e) => setRemark(e.target.value)} style={{ width: '100%' }} />
            </div>

            {entryError && (
              <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{entryError}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setEntering(false)}>取消</Button>
              <Button onClick={confirmEntry}>保存订单</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
