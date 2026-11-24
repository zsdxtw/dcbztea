import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Toggle from '../../components/common/Toggle';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore, getSelfPurchaseEstimate } from '../../stores/orderFlowStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { usePriceStore } from '../../stores/priceStore';
import { useScoreStore, getScoreSummary } from '../../stores/scoreStore';
import { EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS,
  TRANSFER_SOURCE_LABELS, SOURCE_TAG_LABELS, platformLabelOf } from '../../data/externalOrders';
import { REGIONS, getCities, getDistricts, regionTextOf } from '../../data/regions';
import { ProductItemsTable, SalesOrderDetailTabs } from './SalesOrderDetail';
import TakebackDialog from '../../components/business/TakebackDialog';
import { buildFamilies, familyStatesOf, orderProgressOf, FAMILY_STATE_COLORS } from '../../utils/salesOrderFamily';
import SplitDraftBuilder, { type DraftFulfillment } from '../../components/business/SplitDraftBuilder';
import DispatchDialog from '../../components/business/DispatchDialog';
import type { ExternalOrder } from '../../types';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

/** 状态键（分发状态直接使用，无归并） */
const mergedStatus = (s: string) => s;

/** 销售履约单号：子履约单取自身编号；未拆分的销售单本身即履约单，按规则展示为 LY01 */
const fulfillmentCodeOf = (o: ExternalOrder): string => (o.parentCode ? o.code : `${o.code}LY01`);
/** 销售单订单号（履约单上层订单编号）：子履约单指向母销售单；未拆分时为自身 */
const salesOrderCodeOf = (o: ExternalOrder): string => o.parentCode ?? o.code;

/** 分发状态 5 态（已取消归入订单进度，不再在分发状态中展示） */
const DISTRIBUTE_STATE: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: '待分发', bg: '#FFF3E0', color: '#B26A00' },
  comparing: { label: '转派比单中', bg: '#EDE7F6', color: '#5E35B1' },
  self_pending: { label: '自营待接单', bg: '#E3F2FD', color: '#0F64B5' },
  distribute_pending: { label: '转派待接单', bg: '#E8F1FB', color: '#0F64B5' },
  processed: { label: '分发已完成', bg: '#E8F5E9', color: '#2E7D32' },
};
const distributeStateOf = (o: ExternalOrder) =>
  DISTRIBUTE_STATE[mergedStatus(o.processStatus)] ?? { label: '—', bg: '#F5F5F5', color: '#9E9E9E' };

/** 订单进度药丸（分发中 / 履约中 / 结算中 / 已办结 / 已取消） */
const progressPill = (o: ExternalOrder) => {
  const p = orderProgressOf(o);
  const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[p] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return pill(c.bg, c.color, p);
};

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 省份选项（地区筛选/范围共用） */
const PROVINCE_OPTS = REGIONS.map((r) => r.name);

/** 路径标签（转派待接单显示来源路径） */
function pathLabel(o: ExternalOrder): string {
  if (o.path === 'self') return '自营';
  if (o.transferSource) return TRANSFER_SOURCE_LABELS[o.transferSource];
  if (o.distributeMode === 'compare') return '转派-比单';
  return '—';
}

/** 路径筛选键（列表分发路径筛选用） */
function pathKey(o: ExternalOrder): string {
  if (o.path === 'self') return 'self';
  if (o.transferSource) return o.transferSource;
  if (o.distributeMode === 'compare') return 'compare';
  return 'none';
}

/** 地区列展示：省 / 市 / 区（共享助手，见 data/regions.regionTextOf） */
function regionText(o: ExternalOrder): string {
  return regionTextOf(o.customerRegion, o.receiverAddress);
}

export default function ExternalOrders() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const settings = useOrderFlowStore((s) => s.settings);
  const store = useOrderFlowStore;
  const suppliers = useSupplierStore((s) => s.suppliers);
  const scoreEntries = useScoreStore((s) => s.entries);
  const products = usePriceStore((s) => s.products);

  /** 品牌/数量：本单商品去重品牌数 + 商品总数量 */
  const brandQtyOf = (o: ExternalOrder) => {
    const brands = new Set(o.items.map((it) => products.find((p) => p.id === it.productId)?.brand
      ?? products.find((p) => p.name === it.productName)?.brand ?? '其他'));
    const qty = o.items.reduce((s, it) => s + it.quantity, 0);
    return `${brands.size}种/${qty}份`;
  };

  const [filterStatus, setFilterStatus] = useState('');
  /** 母销售单家族（销售单号弹窗：订单信息/收货信息/商品明细三段） */
  const families = useMemo(() => buildFamilies(orders), [orders]);
  const [linkOrderCode, setLinkOrderCode] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** 列表筛选（仅「全部」时展示）：地区省市县联动 + 分发路径 */
  const [listProv, setListProv] = useState('');
  const [listCity, setListCity] = useState('');
  const [listDist, setListDist] = useState('');
  const [listPath, setListPath] = useState('');

  /** 拆单弹窗（分发-待处理按商品+数量拆出子订单） */
  const [splitting, setSplitting] = useState<ExternalOrder | null>(null);
  const [splitDrafts, setSplitDrafts] = useState<DraftFulfillment[]>([]);
  const [splitSelected, setSplitSelected] = useState<string | null>(null);
  const [splitNotice, setSplitNotice] = useState('');

  /** 列表分页：每页条数（10/20/50，右下角下拉）与当前页 */
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  /** 删除确认弹窗 */
  const [deleting, setDeleting] = useState<ExternalOrder | null>(null);
  /** 取回弹窗（自营待接单 / 转派待接单 / 分发已完成） */
  const [recallOf, setRecallOf] = useState<ExternalOrder | null>(null);
  const [recallMsg, setRecallMsg] = useState('');
  /** 报名处理弹窗（转派比单中） */
  const [enrollOf, setEnrollOf] = useState<string | null>(null);
  const [enrollMsg, setEnrollMsg] = useState('');
  /** 直接选定弹窗 */
  const [awarding, setAwarding] = useState<{ orderId: string; supplierId: string; supplierName: string } | null>(null);
  const [awardReason, setAwardReason] = useState('');
  /** 履约单分发弹窗（与销售单处理共用：拆单 + 四方向） */
  const [flowingId, setFlowingId] = useState<string | null>(null);
  const [flowMsg, setFlowMsg] = useState('');

  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const scoreOf = (id: string, name: string) => getScoreSummary({ entries: scoreEntries, supplierId: id, supplierName: name });

  const flowing = flowingId ? orders.find((o) => o.id === flowingId) ?? null : null;

  const openFlow = (o: ExternalOrder) => {
    setFlowMsg('');
    setFlowingId(o.id);
  };

  const purchaseDocs = usePurchaseStore((s) => s.docs);
  const current = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;
  const enrollOrder = enrollOf ? orders.find((o) => o.id === enrollOf) ?? null : null;

  /** 关键字匹配：编号 / 客户 / 平台单号 / 母销售单编号（输入母单号时该母单下所有子单均展出） */
  const kwMatch = (o: ExternalOrder, kw: string) =>
    o.code.includes(kw) || (o.parentCode ?? '').includes(kw) || o.customerName.includes(kw) || (o.externalOrderNo ?? '').includes(kw);

  // 已拆分的母销售单不在分发列表/计数展示（由其下各子履约单呈现）
  const motherCodes = useMemo(() => new Set(orders.map((x) => x.parentCode).filter(Boolean) as string[]), [orders]);
  const listOrders = useMemo(() => orders.filter((o) => o.processStatus !== 'unprocessed' && o.processStatus !== 'cancelled' && (o.parentCode || !motherCodes.has(o.code))), [orders, motherCodes]);
  const filtered = useMemo(() => listOrders.filter((o) => {
    if (keyword && !kwMatch(o, keyword.trim())) return false;
    if (filterStatus !== '') return mergedStatus(o.processStatus) === filterStatus;
    // 「全部」模式下应用地区 + 分发路径筛选
    if (listPath && pathKey(o) !== listPath) return false;
    if (listProv || listCity || listDist) {
      const [p, c, d] = regionText(o).split(' / ');
      if (listProv && p !== listProv) return false;
      if (listCity && c !== listCity) return false;
      if (listDist && d !== listDist) return false;
    }
    return true;
  }), [listOrders, keyword, filterStatus, listProv, listCity, listDist, listPath]);

  const listCityOpts = listProv ? getCities(listProv).map((c) => c.name) : [];
  const listDistOpts = listProv && listCity ? getDistricts(listProv, listCity) : [];

  const countOf = (key: string) => (key === '' ? listOrders.length : listOrders.filter((o) => mergedStatus(o.processStatus) === key).length);

  /** 列表分页：筛选/搜索/页大小变化回第 1 页，越界自动收敛 */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedOrders = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [keyword, filterStatus, listProv, listCity, listDist, listPath, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  /** 页码按钮（列表下方分页数字，当前页模块主色） */
  const pageBtn = (n: number) => (
    <button
      key={n}
      onClick={() => setPage(n)}
      style={{
        minWidth: 28, height: 28, padding: '0 6px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        border: `1px solid ${page === n ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
        background: page === n ? 'var(--color-module-current-base)' : 'var(--color-neutral-0)',
        color: page === n ? 'var(--color-neutral-0)' : 'var(--color-neutral-600)',
        fontSize: 'var(--text-sm)', fontWeight: 500, fontFamily: 'var(--font-family-mono)',
      }}
    >
      {n}
    </button>
  );

  /* ── 详情抽屉开启（查看/查单） ── */
  const openDetail = (id: string) => setSelectedId(id);

  /* ── 渲染 ── */
  return (
    <>
      <ContentHeader title="履约单分发" breadcrumbs={['销售', '销售单管理', '履约单分发']} />
      <div className="content-body">
        {recallMsg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: '#E8F5E9', color: '#01795D' }}>{recallMsg}</div>
        )}
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          履约单分发决定<strong>销售订单由谁来供货发货</strong>（自营仓发货 / 合作商采购直发），均<strong>逐个展示子单</strong>（母单聚合总览请前往「销售单管理 → 销售订单」）。两个来源渠道：<strong>手工录入</strong>与<strong>直连推送</strong>，订单进入系统不做自动报备匹配，均由管理员人工处理。
          报备匹配由<strong>人工处理</strong>：点击「分发」后在弹窗中选择「转派-报备」，人工勾选命中的报备记录（订单 / 商品 / 地区），确认后整单直接转出报备合作商；其余分发方向为自营（淡茶半盏）/ 转派-指定 / 转派-比单，比单可限定合作商地区。
          履约状态进入已接单及后续后分发状态自动变为<strong>分发已完成</strong>；全部包裹妥投后由管理后台「确认收货」→ 履约已确收；自营待接单 / 转派待接单的履约单可「取回」回到待分发重新选择路径。
          尚未送去分发的销售单在「销售单管理 → 销售单处理」中，送去分发生成履约单后才会出现在本页。
        </div>

        {flowMsg && (
          <div style={{ marginBottom: 'var(--space-3)', padding: '10px 14px', background: '#E8F5E9', color: '#01795D', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{flowMsg}</div>
        )}

        {/* 状态栏流程图：待处理(左中) ─ 顶中出线→[自营]→[自营待接单]→已处理顶中 / 底中出线→[2×2虚线框]→[转派待接单]→已处理底中，两个待接单右缘对齐 */}
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
          /* 虚线框：报备·指定·比单中 一行并列 */
          .eop-box { display: flex; gap: 12px; padding: 9px 12px; align-items: center; border: 1.5px dashed var(--color-neutral-300); border-radius: 12px; flex: none; }
          .eop-box .tab-card-simple { justify-content: center; }
          .eop-dim { opacity: .45; cursor: not-allowed; }
        `}</style>
        <div className="eop-flowbar">
          <button className={`tab-card-simple${filterStatus === '' ? ' active' : ''}`} onClick={() => setFilterStatus('')}>
            全部
            <span className="tab-card-simple-count">{listOrders.length}</span>
          </button>

          <div className="eop-flow">
            {/* 待处理：顶中出上线(自营) / 底中出下线(分发) */}
            <div className="eop-nodebox">
              <i className="up-v" aria-hidden="true" />
              <i className="up-h eop-arr-r" aria-hidden="true" />
              <span className="eop-lbl up" aria-hidden="true">自营</span>
              <i className="dn-v" aria-hidden="true" />
              <i className="dn-h eop-arr-r" aria-hidden="true" />
              <span className="eop-lbl dn" aria-hidden="true">转派</span>
              <button className={`tab-card-simple${filterStatus === 'pending' ? ' active' : ''}`} onClick={() => setFilterStatus('pending')}>
                待分发
                <span className="tab-card-simple-count">{countOf('pending')}</span>
              </button>
            </div>

            <div className="eop-branches">
              {/* 上路：自营(路径，置灰) ─ 弹性连线 ─ 自营待接单（推至右缘，与转派待接单横向对齐） */}
              <div className="eop-toprow">
                <button className="tab-card-simple eop-dim" disabled title="选择自营路径即时进入自营待接单，无中间状态">自营</button>
                <i className="eop-grow eop-arr-r" aria-hidden="true" />
                <button className={`tab-card-simple${filterStatus === 'self_pending' ? ' active' : ''}`} onClick={() => setFilterStatus('self_pending')}>
                  自营待接单
                  <span className="tab-card-simple-count">{countOf('self_pending')}</span>
                </button>
              </div>
              <div className="eop-midgap" />
              {/* 下路：分发方式（报备 / 指定 / 比单中）→ 转派待接单 */}
              <div className="eop-botrow">
                <div className="eop-box">
                  <button className="tab-card-simple eop-dim" disabled title="报备转派直接转出，无中间状态">报备</button>
                  <button className="tab-card-simple eop-dim" disabled title="指定转派即时转出，无中间状态">指定</button>
                  <button className={`tab-card-simple${filterStatus === 'comparing' ? ' active' : ''}`} onClick={() => setFilterStatus('comparing')}>
                    转派比单中
                    <span className="tab-card-simple-count">{countOf('comparing')}</span>
                  </button>
                </div>
                <i className="eop-hln eop-arr-r" aria-hidden="true" />
                <button className={`tab-card-simple${filterStatus === 'distribute_pending' ? ' active' : ''}`} onClick={() => setFilterStatus('distribute_pending')}>
                  转派待接单
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
                分发已完成
                <span className="tab-card-simple-count">{countOf('processed')}</span>
              </button>
            </div>

            {/* 已取消不再在分发环节展示（已取消的履约单仅在销售单列表查看） */}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <input className="filter-input" placeholder="搜索订单/母销售单编号、客户、平台单号（输入母单号展出其全部子单）..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 320 }} />
          {filterStatus === '' && (
            <>
              <select className="filter-select" value={listProv} onChange={(e) => { setListProv(e.target.value); setListCity(''); setListDist(''); }}>
                <option value="">全部地区（省）</option>
                {PROVINCE_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select className="filter-select" disabled={!listProv} value={listCity} onChange={(e) => { setListCity(e.target.value); setListDist(''); }}>
                <option value="">全部市</option>
                {listCityOpts.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="filter-select" disabled={!listCity} value={listDist} onChange={(e) => setListDist(e.target.value)}>
                <option value="">全部区县</option>
                {listDistOpts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="filter-select" value={listPath} onChange={(e) => setListPath(e.target.value)}>
                <option value="">全部分发方式</option>
                <option value="self">自营</option>
                <option value="report">转派-报备</option>
                <option value="assign">转派-指定</option>
                <option value="compare">转派-比单</option>
                <option value="none">未选择</option>
              </select>
            </>
          )}
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
            {/* 管理按钮仅在对应状态页面展示 */}
            {filterStatus === 'comparing' && <Button onClick={() => navigate('/sales/compare-manage')}>比单管理</Button>}
          </span>
        </div>

        {/* 子单平铺列表（逐单操作视图；母单聚合总览见「销售单管理 → 销售订单」） */}
        <Card style={{ padding: 0 }}>
          <Table
            headers={['序号', '销售履约单号', '销售单号', '订单来源', '销售路径', '客户', '收件人 / 地区', '品牌/数量', '金额', '订单进度', '分发状态', '分发方式', '履约主体', '录入时间', '操作']}
            rows={pagedOrders.map((o, idx) => [
              <span key="no" className="mono cell-muted">{(page - 1) * pageSize + idx + 1}</span>,
              <span key="c" className="cell-mono-emph" style={{ whiteSpace: 'nowrap' }}>{fulfillmentCodeOf(o)}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.externalOrderNo ?? '—'}</span></span>,
              <span
                key="link"
                className="mono"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--color-module-current-base)', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', whiteSpace: 'nowrap' }}
                title="点击查看销售单订单信息" 
                onClick={() => setLinkOrderCode(salesOrderCodeOf(o))}
              >
                {salesOrderCodeOf(o)}
              </span>,
              <span key="src">
                {o.salesPath === 'via_platform'
                  ? (o.platformCustomerName ?? (o.platform ? EXTERNAL_PLATFORM_LABELS[o.platform] : '经平台销售'))
                  : '淡茶半盏'}
                <span style={{ display: 'block' }}>{pill(
                  o.sourceChannel === 'push' ? '#F3E5F5' : '#E3F2FD',
                  o.sourceChannel === 'push' ? '#7B1FA2' : '#0F64B5',
                  EXTERNAL_CHANNEL_LABELS[o.sourceChannel],
                )}</span>
                {o.sourceTag && (
                  <span style={{ display: 'block', marginTop: 2 }}>{pill(
                    SOURCE_TAG_LABELS[o.sourceTag].bg,
                    SOURCE_TAG_LABELS[o.sourceTag].color,
                    SOURCE_TAG_LABELS[o.sourceTag].label,
                  )}</span>
                )}
              </span>,
              <span key="sp">
                {o.salesPath === 'via_platform'
                  ? pill('#E3F2FD', '#0F64B5', '经平台销售')
                  : pill('#E8F5E9', '#2E7D32', '直接销售')}
              </span>,
              <span key="cu" className="cell-emph">{o.customerName}</span>,
              <span key="rcv" style={{ minWidth: 0 }}>
                <span className="cell-emph" style={{ fontSize: 'var(--text-sm)', display: 'block' }}>{o.receiver}</span>
                <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', whiteSpace: 'nowrap' }}>{regionText(o)}</span>
              </span>,
              <span key="bq" className="mono" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{brandQtyOf(o)}</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{money(o.totalAmount)}</span>,
              <span key="pg" style={{ whiteSpace: 'nowrap' }}>{progressPill(o)}</span>,
              <span key="s" style={{ whiteSpace: 'nowrap' }}>
                {(() => { const d = distributeStateOf(o); return pill(d.bg, d.color, d.label); })()}
              </span>,
              <span key="pa" style={{ fontSize: 'var(--text-sm)' }}>{pathLabel(o)}</span>,
              <span key="pt" style={{ fontSize: 'var(--text-sm)' }}>{o.processStatus === 'pending' ? '—' : (o.partnerName ?? (o.path === 'self' ? '淡茶半盏（自营）' : '—'))}</span>,
              <span key="t" className="cell-muted" style={{ whiteSpace: 'nowrap' }}>{o.entryTime.slice(0, 10)}</span>,
              <div key="act" className="row-actions" style={{ whiteSpace: 'nowrap' }}>
                {o.processStatus === 'pending' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                    <Button size="sm" onClick={() => openFlow(o)}>分发</Button>
                    <Button size="sm" onClick={() => { setSplitting(o); setSplitDrafts([]); setSplitSelected(null); setSplitNotice(''); }}>拆单</Button>
                  </>
                )}
                {o.processStatus === 'self_pending' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                    <Button size="sm" style={{ background: 'var(--color-module-current-secondary)', borderColor: 'var(--color-module-current-secondary)', color: '#fff' }} onClick={() => { setRecallOf(o); setRecallMsg(''); }}>取回</Button>
                  </>
                )}
                {o.processStatus === 'distribute_pending' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                    <Button size="sm" style={{ background: 'var(--color-module-current-secondary)', borderColor: 'var(--color-module-current-secondary)', color: '#fff' }} onClick={() => { setRecallOf(o); setRecallMsg(''); }}>取回</Button>
                  </>
                )}
                {o.processStatus === 'comparing' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                    <Button size="sm" onClick={() => { setEnrollOf(o.id); setEnrollMsg(''); }}>报名处理</Button>
                  </>
                )}
                {o.processStatus === 'processed' && (
                  <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                )}
              </div>,
            ])}
          />
        </Card>

        {/* 列表分页：下方页码数字 + 右下角每页条数下拉（10/20/50 条/页） */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginRight: 'auto' }}>
              共 {filtered.length} 条 · 第 {page} / {totalPages} 页
            </span>
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => pageBtn(n))}
            <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
            <select
              className="filter-select"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
            </select>
          </div>
        )}
      </div>

      {/* ── 详情抽屉（统一使用销售单列表详情：销售单信息 + 履约单 Tab） ── */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="SO"
        title={current ? (current.parentCode ?? current.code) : ''}
        statusTag={(() => {
          if (!current) return null;
          const fam = buildFamilies(orders).find((f) => f.rootCode === (current.parentCode ?? current.code));
          if (!fam) return null;
          const st = familyStatesOf(fam);
          const fp = (t: string) => {
            const c = (FAMILY_STATE_COLORS as Record<string, { bg: string; color: string }>)[t] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
            return pill(c.bg, c.color, t);
          };
          return <>{fp(st.orderStatus)}{fp(st.distribute)}{fp(st.fulfill)}{fp(st.settle)}</>;
        })()}
        subtitle={current ? `${platformLabelOf(current)} · ${current.customerName}（${current.customerType}） · ${current.receiver}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>
            {current && ['self_pending', 'distribute_pending'].includes(current.processStatus) && (
              <Button style={{ background: 'var(--color-module-current-secondary)', borderColor: 'var(--color-module-current-secondary)', color: '#fff' }} onClick={() => { setRecallOf(current); setRecallMsg(''); }}>取回</Button>
            )}
          </>
        }
      >
        {current && (() => {
          /* 查看态：与销售单列表同一套详情（销售单信息 / 履约单01… Tab）；已进入分发/履约/结算的履约单不在此处修改 */
          const rootCode = current.parentCode ?? current.code;
          const fam = buildFamilies(orders).find((f) => f.rootCode === rootCode);
          if (!fam) return null;
          return (
            <SalesOrderDetailTabs
              key={`${rootCode}-${current.code}`}
              family={fam}
              poDocs={purchaseDocs}
              initialTab={current.code}
            />
          );
        })()}
      </DetailDrawer>

      {/* ── 取回弹窗（整体 / 部分两段式） ── */}
      <TakebackDialog
        order={recallOf}
        onClose={() => setRecallOf(null)}
        onDone={(m) => { setRecallMsg(m); setTimeout(() => setRecallMsg(''), 3600); }}
      />

      {/* ── 删除确认弹窗 ── */}
      {deleting && (
        <div className="category-dialog-overlay" onClick={() => setDeleting(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 440 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>删除订单</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              确认删除待处理订单 <strong className="mono">{deleting.code}</strong>（{deleting.customerName} · {money(deleting.totalAmount)}）？删除后不可恢复。
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setDeleting(null)}>关闭</Button>
              <Button variant="danger" onClick={() => { store.getState().deleteOrder(deleting.id); setDeleting(null); }}>确认删除</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 报名处理弹窗（转派比单中·单笔订单，内容同「比单管理」中的单张比单） ── */}
      {enrollOrder?.compare && (() => {
        const cmp = enrollOrder.compare;
        const minQuote = cmp.quotes.length > 0 ? Math.min(...cmp.quotes.map((q) => q.amount)) : 0;
        return (
          <div className="category-dialog-overlay" onClick={() => setEnrollOf(null)}>
            <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 880, maxWidth: '94vw', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>报名处理 · {enrollOrder.code}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
                该笔<strong>转派比单中</strong>订单的公开报名情况（报价不得低于底价），支持<strong>延长报名</strong>、<strong>评分定标</strong>
                （截止前可强制：评分=报价 {settings.compareWeights.quote}0% + 积分 {settings.compareWeights.score}0%，按商品积分排名定标）与<strong>直接选定</strong>（转为指定转派）。
              </div>
              <div style={{ border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
                  <span className="cell-mono-emph">{enrollOrder.code}</span>
                  <span className="cell-emph">{enrollOrder.customerName}</span>
                  <span className="mono" style={{ fontSize: 'var(--text-sm)' }}>{money(enrollOrder.totalAmount)}</span>
                  {cmp.region && pill('#E0F7FA', '#00838F', `限 ${[cmp.region.province, cmp.region.city, cmp.region.district].filter(Boolean).join(' ')}`)}
                  <span style={{ fontSize: 'var(--text-xs)', color: '#B26A00' }}>底价：{cmp.floorNote}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)' }}>
                    截止剩余 <strong className="mono" style={{ color: cmp.deadline - tick > 0 ? '#7B1FA2' : '#C62828' }}>
                      {Math.max(0, Math.floor((cmp.deadline - tick) / 60000))} 分 {Math.max(0, Math.floor(((cmp.deadline - tick) % 60000) / 1000))} 秒
                    </strong>
                  </span>
                </div>
                <table className="detail-inline-table" style={{ marginBottom: 'var(--space-2)' }}>
                  <thead><tr><th>报名合作商</th><th>报名报价</th><th>报价分预览</th><th>积分</th><th>报名商品</th><th>报名时间</th><th>操作</th></tr></thead>
                  <tbody>
                    {cmp.quotes.length === 0 && <tr><td colSpan={7} style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 'var(--space-2)' }}>暂无合作商报名</td></tr>}
                    {cmp.quotes.map((q) => {
                      const sc = scoreOf(q.supplierId, q.supplierName);
                      const quoteScore = q.amount > 0 && minQuote > 0 ? Math.round((minQuote / q.amount) * 100) : 0;
                      return (
                        <tr key={q.supplierId}>
                          <td style={{ fontWeight: 'var(--font-medium)' }}>{q.supplierName}</td>
                          <td className="mono">{money(q.amount)}</td>
                          <td className="mono">{quoteScore}</td>
                          <td className="mono">{sc.total}</td>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{(q.items ?? enrollOrder.items.map((i) => i.productName)).join('、')}</td>
                          <td className="mono">{q.quoteTime}</td>
                          <td><Button size="sm" variant="ghost" onClick={() => { setAwarding({ orderId: enrollOrder.id, supplierId: q.supplierId, supplierName: q.supplierName }); setAwardReason(''); }}>直接选定</Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <Button size="sm" variant="ghost" onClick={() => store.getState().extendCompare(enrollOrder.id, 10)}>延长报名 10 分钟</Button>
                  <Button size="sm" disabled={cmp.quotes.length === 0} onClick={() => {
                    const r = store.getState().finalizeCompare(enrollOrder.id, true);
                    if (r.ok) { setEnrollOf(null); setFlowMsg(r.msg); } else setEnrollMsg(r.msg);
                  }}>评分定标（按商品·积分优先）</Button>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>截止前定标为强制定标</span>
                </div>
              </div>
              {enrollMsg && <div style={{ padding: '8px 12px', background: '#E8F5E9', color: '#01795D', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>{enrollMsg}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => setEnrollOf(null)}>关闭</Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 直接选定弹窗 ── */}
      {awarding && (
        <div className="category-dialog-overlay" onClick={() => setAwarding(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 500 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>直接选定合作商</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              选定 <strong>{awarding.supplierName}</strong>，订单将跳过评分直接转为<strong>指定转派</strong>，进入转派待接单等待其接单。
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>选定理由 *</label>
              <input className="filter-input" placeholder="如：报价合理且区域履约能力强" value={awardReason} onChange={(e) => setAwardReason(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setAwarding(null)}>关闭</Button>
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

      {/* ── 履约单分发弹窗（仅整单分发 + 四方向，报备方向内嵌人工匹配；可跳转拆单） ── */}
      <DispatchDialog
        order={flowing}
        mode="fulfillment"
        onClose={() => setFlowingId(null)}
        onDone={(m) => setFlowMsg(m)}
        onGoSplit={() => {
          if (!flowing) return;
          setSplitting(flowing);
          setSplitDrafts([]);
          setSplitSelected(null);
          setSplitNotice('');
        }}
      />

      {/* ── 拆单弹窗（预生成，与销售单处理一致） ── */}
      {splitting && (
        <div className="category-dialog-overlay" onClick={() => setSplitting(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 980, maxWidth: '94vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', flexShrink: 0 }}>拆单 · {splitting.code}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7, flexShrink: 0 }}>
              填写拆出数量后点击「拆出」预生成履约单 TAB；可生成多张、删除后数量归还。未拆出的剩余数量作为末尾虚线「剩余部分」TAB，随确认一并生成履约单；无剩余数量时不显示该虚线 TAB。
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <SplitDraftBuilder
                items={splitting.items}
                drafts={splitDrafts}
                onChange={(next) => { setSplitDrafts(next); setSplitNotice(''); }}
                selectedId={splitSelected}
                onSelect={setSplitSelected}
                remainderTab
                externalError={splitNotice}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexShrink: 0 }}>
              <Button variant="ghost" onClick={() => { setSplitting(null); setSplitNotice(''); }}>关闭</Button>
              <Button
                onClick={() => {
                  if (splitDrafts.length === 0) {
                    setSplitNotice('请至少生成 1 张履约单 TAB（填写本次拆出数量后点「拆出」）');
                    return;
                  }
                  const res = store.getState().splitFulfillmentByDrafts(splitting.id, splitDrafts.map((d) => d.items));
                  if (!res.ok) { window.alert(res.msg); return; }
                  setSplitting(null);
                  setSplitDrafts([]);
                  setSplitSelected(null);
                  setSplitNotice('');
                }}
              >确认拆单生成履约单</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 母销售单信息弹窗（关联销售单点击） ── */}
      {/* ── 销售单信息弹窗（订单信息 / 收货信息 / 商品明细，参照销售单列表详情「销售单信息」） ── */}
      {linkOrderCode && (() => {
        const fam = families.find((f) => f.rootCode === linkOrderCode);
        if (!fam) return null;
        const m = fam.mother;
        const amount = (fam.children.length > 0 ? fam.children : fam.all).reduce((s2, o) => s2 + o.totalAmount, 0);
        const rows = fam.children.length > 0 ? fam.children.flatMap((c) => c.items) : m.items;
        const map = new Map<string, { productId: string; productName: string; spec: string; quantity: number; price: number }>();
        for (const it of rows) {
          const k = `${it.productName}|${it.spec}`;
          const cu = map.get(k);
          if (cu) cu.quantity += it.quantity;
          else map.set(k, { productId: it.productId, productName: it.productName, spec: it.spec, quantity: it.quantity, price: it.price });
        }
        const infoCell = (label: string, node: React.ReactNode, opts?: { mono?: boolean; emph?: boolean; span?: 2 | 3 }) => (
          <div className={`detail-info-item${opts?.span === 2 ? ' span-2' : opts?.span === 3 ? ' span-3' : ''}`}><label className="drawer-label">{label}</label><div className={`detail-info-value${opts?.emph ? ' emph' : ''}${opts?.mono ? ' mono' : ''}`}>{node}</div></div>
        );
        return (
          <div className="category-dialog-overlay" onClick={() => setLinkOrderCode(null)}>
            <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 980, maxWidth: '94vw' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>销售单信息 · {linkOrderCode}</div>
                <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>母销售单（聚合其下 {fam.children.length > 0 ? `${fam.children.length} 张` : '1 张'}履约单）</span>
              </div>
              <DrawerSection title="订单信息">
                <InfoGrid cols={4}>
                  {infoCell('销售单号', fam.rootCode, { mono: true, emph: true })}
                  {infoCell('订单来源', <>{m.salesPath === 'via_platform' ? (m.platformCustomerName ?? '经平台销售') : '淡茶半盏'}（{EXTERNAL_CHANNEL_LABELS[m.sourceChannel]}）</>)}
                  {infoCell('下单平台', m.salesPath === 'via_platform' ? (m.platformCustomerName ?? '—') : '—')}
                  {infoCell('平台订单号', m.externalOrderNo ?? '—', { mono: true })}
                  {infoCell('客户', `${m.customerName}（${m.customerType}）`, { emph: true })}
                  {infoCell('客户区域', regionText(m))}
                  {infoCell('总金额', money(amount), { mono: true })}
                  {infoCell('履约单数', fam.children.length > 0 ? `${fam.children.length} 单` : '1 单（未拆分，母销售单即履约单）')}
                  {infoCell('销售路径', m.salesPath === 'via_platform' ? '经平台销售' : '直接销售')}
                  {infoCell('客户下单时间', m.customerOrderTime ?? '—')}
                  {infoCell('客户侧订单号', m.customerOrderNo ?? '—', { mono: true })}
                  {infoCell('录入时间', m.entryTime.length > 10 ? m.entryTime : `${m.entryTime} 09:12:00`, { mono: true })}
                  {infoCell('录入人', m.operator)}
                  {m.platformCustomerName ? infoCell('平台客户', m.platformCustomerName) : null}
                </InfoGrid>
              </DrawerSection>
              <DrawerSection title="收货信息">
                <InfoGrid cols={4}>
                  {infoCell('收货人', m.receiver, { emph: true })}
                  {infoCell('联系电话', m.receiverPhone, { mono: true })}
                  {infoCell('收货地区', regionText(m))}
                  {infoCell('收货地址', m.receiverAddress, { span: 2 })}
                  {infoCell('备注', m.remark || '—', { span: 2 })}
                </InfoGrid>
              </DrawerSection>
              <DrawerSection title="商品明细">
                <ProductItemsTable
                  items={[...map.values()]}
                  customerName={m.customerName}
                  salesPath={m.salesPath}
                  platformCustomerId={m.platformCustomerId}
                  platform={m.platform}
                  platformRateSnapshot={m.platformRateSnapshot}
                  footerAmount={amount}
                />
              </DrawerSection>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                <Button variant="ghost" onClick={() => setLinkOrderCode(null)}>关闭</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
