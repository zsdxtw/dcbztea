import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Toggle from '../../components/common/Toggle';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useOrderFlowStore, getSelfPurchaseEstimate, reportMatchesOrder } from '../../stores/orderFlowStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { useScoreStore, getScoreSummary } from '../../stores/scoreStore';
import { useReportStore } from '../../stores/reportStore';
import {
  EXTERNAL_PLATFORM_LABELS, EXTERNAL_CHANNEL_LABELS, EXTERNAL_STATUS_LABELS, EXTERNAL_STATUS_COLORS,
  TRANSFER_SOURCE_LABELS, SOURCE_TAG_LABELS, compareFloorAmount,
} from '../../data/externalOrders';
import { PARTNER_ORDER_STATUS_LABELS, PARTNER_REPORT_TYPE_LABELS } from '../../data/partner';
import { REGIONS, getCities, getDistricts } from '../../data/regions';
import { partnerInRegion } from '../../types';
import type { ExternalOrder, RegionScope } from '../../types';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const statusPill = (status: string) => {
  // 已完成归并展示为已处理（子状态由调用方补充）
  const key = status === 'completed' ? 'processed' : status;
  const c = EXTERNAL_STATUS_COLORS[key] ?? { bg: '#F5F5F5', color: '#9E9E9E' };
  return pill(c.bg, c.color, EXTERNAL_STATUS_LABELS[key] ?? status);
};

/** 状态归并：已完成 / 自营执行中（已接单·运输·妥投）并入已处理（列表筛选/计数/展示统一） */
const mergedStatus = (s: string) => (['completed', 'self_accepted', 'self_shipped', 'self_delivered'].includes(s) ? 'processed' : s);

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 省份选项（地区筛选/范围共用） */
const PROVINCE_OPTS = REGIONS.map((r) => r.name);

/** 路径标签（转派待接单显示来源路径；报备-匹配待确认属转派-报备） */
function pathLabel(o: ExternalOrder): string {
  if (o.processStatus === 'report_match_pending') return '转派-报备';
  if (o.path === 'self') return '自营';
  if (o.transferSource) return TRANSFER_SOURCE_LABELS[o.transferSource];
  if (o.distributeMode === 'grab') return '转派-抢单';
  if (o.distributeMode === 'compare') return '转派-比单';
  return '—';
}

/** 路径筛选键（列表分发路径筛选用） */
function pathKey(o: ExternalOrder): string {
  if (o.processStatus === 'report_match_pending') return 'report';
  if (o.path === 'self') return 'self';
  if (o.transferSource) return o.transferSource;
  if (o.distributeMode === 'grab') return 'grab';
  if (o.distributeMode === 'compare') return 'compare';
  return 'none';
}

/** 地区列展示：省 / 市 / 区（与人员-茶人管理同格式；区从收货地址解析，解析不到降级为省市） */
function regionText(o: ExternalOrder): string {
  const region = o.customerRegion ?? '';
  const addr = o.receiverAddress ?? '';
  const prov = REGIONS.find((p) => region.startsWith(p.name) || addr.startsWith(p.name));
  if (!prov) return region;
  const shortNames = (c: string) => c.replace(/市$/, '');
  const city = prov.cities.find((c) => region.includes(c.name) || addr.includes(c.name))
    ?? prov.cities.find((c) => region.includes(shortNames(c.name)) || addr.includes(shortNames(c.name)));
  const parts: string[] = [prov.name];
  if (city) {
    parts.push(city.name);
    const district = city.districts.find((d) => addr.includes(d));
    if (district) parts.push(district);
  }
  return parts.join(' / ');
}

/** 已接单订单重新分发的风险措辞 */
function processedWarnText(o: ExternalOrder): string {
  if (o.path === 'self') {
    if ((o.selfShipments?.length ?? 0) > 0) return '该订单已发货（有物流单号），重新分发将作废发货包裹与采购单据，请谨慎确认！';
    if (o.selfPo) return '该订单已接单且已下采购单，重新分发将作废采购订单，请确认。';
    return '该订单已被接单（自营），重新分发将收回订单，请确认。';
  }
  const ps = o.partnerStatus;
  if (ps === 'shipping') return `该订单合作商【已发货】，重新分发将中断合作商履约并可能产生违约责任，请谨慎确认！`;
  if (ps === 'delivered' || ps === 'settled') return `该订单合作商【已签收/已结算】，重新分发将产生结算与积分回滚，请谨慎确认！`;
  return '该订单已被合作商接单，重新分发将收回订单并通知合作商，请确认。';
}

export default function ExternalOrders() {
  const navigate = useNavigate();
  const orders = useOrderFlowStore((s) => s.orders);
  const settings = useOrderFlowStore((s) => s.settings);
  const store = useOrderFlowStore;
  const suppliers = useSupplierStore((s) => s.suppliers);
  const scoreEntries = useScoreStore((s) => s.entries);

  const [filterStatus, setFilterStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** 列表筛选（仅「全部」时展示）：地区省市县联动 + 分发路径 */
  const [listProv, setListProv] = useState('');
  const [listCity, setListCity] = useState('');
  const [listDist, setListDist] = useState('');
  const [listPath, setListPath] = useState('');

  /** 拆单弹窗（分发-待处理按商品+数量拆出子订单） */
  const [splitting, setSplitting] = useState<ExternalOrder | null>(null);
  const [splitQty, setSplitQty] = useState<Record<string, string>>({});

  /** 列表分页：每页条数（10/20/50，右下角下拉）与当前页 */
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  /** 重新分发确认弹窗 */
  const [reflowing, setReflowing] = useState<ExternalOrder | null>(null);
  /** 删除确认弹窗 */
  const [deleting, setDeleting] = useState<ExternalOrder | null>(null);
  /** 报名情况弹窗 */
  const [enrollOf, setEnrollOf] = useState<string | null>(null);
  /** 直接选定弹窗 */
  const [awarding, setAwarding] = useState<{ orderId: string; supplierId: string; supplierName: string } | null>(null);
  const [awardReason, setAwardReason] = useState('');
  /** 履约分配弹窗（待处理订单独立处理页：直接进入分发方式选择，含转自营） */
  const [flowingId, setFlowingId] = useState<string | null>(null);
  const [flowMode, setFlowMode] = useState<'self' | 'assign' | 'report' | 'grab' | 'compare'>('assign');
  /** 转派-指定：合作商选择 + 省市县筛选 + 搜索 + 分页 */
  const [flowSupplier, setFlowSupplier] = useState('');
  const [supplierProv, setSupplierProv] = useState('');
  const [supplierCity, setSupplierCity] = useState('');
  const [supplierDist, setSupplierDist] = useState('');
  const [supplierKw, setSupplierKw] = useState('');
  const [supplierPage, setSupplierPage] = useState(1);
  /** 转派-报备：地区筛选 + 分页 */
  const [reportProv, setReportProv] = useState('');
  const [reportCity, setReportCity] = useState('');
  const [reportDist, setReportDist] = useState('');
  const [reportPage, setReportPage] = useState(1);
  /** 转派-报备：选中的报备编号（多选，一笔订单可对应多条报备） */
  const [pickReportCodes, setPickReportCodes] = useState<string[]>([]);
  /** 抢单/比单地区范围（省市县，可选） */
  const [scopeProv, setScopeProv] = useState('');
  const [scopeCity, setScopeCity] = useState('');
  const [scopeDist, setScopeDist] = useState('');
  /** 比单底价 */
  const [floorType, setFloorType] = useState<'discount' | 'price'>('discount');
  const [floorValue, setFloorValue] = useState('88');
  /** 确认报备匹配弹窗（报备-匹配待确认状态订单） */
  const [matchConfirming, setMatchConfirming] = useState<ExternalOrder | null>(null);

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

  /** 审批通过的报备记录（履约分配弹窗·报备匹配选择用） */
  const approvedReports = useReportStore((s) => s.reports.filter((r) => r.status === 'approved'));

  const flowing = flowingId ? orders.find((o) => o.id === flowingId) ?? null : null;

  /** 指定转派候选合作商：省市县筛选 + 名称搜索 */
  const flowSuppliers = useMemo(() => activeSuppliers.filter((s) => {
    if (supplierProv && s.registeredProvince !== supplierProv && s.contactProvince !== supplierProv) return false;
    if (supplierCity && s.registeredCity !== supplierCity && s.contactCity !== supplierCity) return false;
    if (supplierDist && s.registeredDistrict !== supplierDist && s.contactDistrict !== supplierDist) return false;
    if (supplierKw && !s.name.includes(supplierKw)) return false;
    return true;
  }), [activeSuppliers, supplierProv, supplierCity, supplierDist, supplierKw]);

  const supplierCityOpts = supplierProv ? getCities(supplierProv).map((c) => c.name) : [];
  const supplierDistOpts = supplierProv && supplierCity ? getDistricts(supplierProv, supplierCity) : [];
  const scopeCityOpts = scopeProv ? getCities(scopeProv).map((c) => c.name) : [];
  const scopeDistOpts = scopeProv && scopeCity ? getDistricts(scopeProv, scopeCity) : [];
  const reportCityOpts = reportProv ? getCities(reportProv).map((c) => c.name) : [];
  const reportDistOpts = reportProv && reportCity ? getDistricts(reportProv, reportCity) : [];

  /** 抢单/比单地区范围（未选则为全部地区） */
  const flowScope: RegionScope | undefined = scopeProv || scopeCity || scopeDist
    ? { province: scopeProv || undefined, city: scopeCity || undefined, district: scopeDist || undefined }
    : undefined;

  /** 转派-报备：按报备合作商地区筛选后的报备记录 */
  const flowReports = useMemo(() => approvedReports.filter((r) => {
    const s = suppliers.find((x) => x.name === r.partnerName);
    return partnerInRegion(s, { province: reportProv || undefined, city: reportCity || undefined, district: reportDist || undefined });
  }), [approvedReports, suppliers, reportProv, reportCity, reportDist]);

  /** 列表分页（每页 10 条，超过 10 条分页展示） */
  const PAGE_SIZE = 10;
  const supplierPages = Math.max(1, Math.ceil(flowSuppliers.length / PAGE_SIZE));
  const reportPages = Math.max(1, Math.ceil(flowReports.length / PAGE_SIZE));
  const pagedSuppliers = flowSuppliers.slice((supplierPage - 1) * PAGE_SIZE, supplierPage * PAGE_SIZE);
  const pagedReports = flowReports.slice((reportPage - 1) * PAGE_SIZE, reportPage * PAGE_SIZE);
  useEffect(() => { setSupplierPage(1); }, [supplierProv, supplierCity, supplierDist, supplierKw]);
  useEffect(() => { setReportPage(1); }, [reportProv, reportCity, reportDist]);

  /** 分页条（总数 >10 时展示） */
  const pager = (page: number, pages: number, total: number, set: (n: number) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginTop: 'var(--space-2)' }}>
      共 {total} 条
      <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => set(page - 1)}>上一页</Button>
      <span className="mono">{page} / {pages}</span>
      <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => set(page + 1)}>下一页</Button>
    </div>
  );

  const openFlow = (o: ExternalOrder) => {
    setFlowingId(o.id);
    setFlowMode('assign');
    setFlowSupplier('');
    setSupplierProv(''); setSupplierCity(''); setSupplierDist(''); setSupplierKw(''); setSupplierPage(1);
    setReportProv(''); setReportCity(''); setReportDist(''); setReportPage(1);
    setPickReportCodes([]);
    setScopeProv(''); setScopeCity(''); setScopeDist('');
    setFloorType('discount'); setFloorValue('88');
  };

  /** 履约分配弹窗确认按钮（文案随动作变化，右下角取消 + 确认） */
  const flowConfirmLabel =
    flowMode === 'self' ? '确认'
      : flowMode === 'assign' ? '指定并转出'
        : flowMode === 'report' ? '匹配并转出'
          : flowMode === 'grab' ? '发起抢单'
            : '发起比单';
  const flowConfirmDisabled =
    (flowMode === 'assign' && !flowSupplier)
    || (flowMode === 'report' && pickReportCodes.length === 0)
    || (flowMode === 'compare' && !(Number(floorValue) > 0));

  const doFlowConfirm = () => {
    if (!flowing) return;
    if (flowMode === 'self') {
      store.getState().chooseSelfPath(flowing.id);
    } else if (flowMode === 'assign') {
      const s = activeSuppliers.find((x) => x.id === flowSupplier);
      if (s) store.getState().assignPartner(flowing.id, s.id, s.name);
    } else if (flowMode === 'report') {
      if (pickReportCodes.length > 0) store.getState().matchReportManual(flowing.id, pickReportCodes);
    } else if (flowMode === 'grab') {
      store.getState().publishGrab(flowing.id, flowScope);
    } else {
      const v = Number(floorValue);
      if (v > 0) store.getState().startCompare(flowing.id, { type: floorType, value: v }, flowScope);
    }
    setFlowingId(null);
  };

  const current = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;
  const enrollOrder = enrollOf ? orders.find((o) => o.id === enrollOf) ?? null : null;

  useEffect(() => {
    if (current) {
      setEditForm({});
    }
  }, [selectedId]);

  /** 关键字匹配：编号 / 客户 / 平台单号 / 母订单编号（输入母单号时该母单下所有子单均展出） */
  const kwMatch = (o: ExternalOrder, kw: string) =>
    o.code.includes(kw) || (o.parentCode ?? '').includes(kw) || o.customerName.includes(kw) || o.externalOrderNo.includes(kw);

  const filtered = useMemo(() => orders.filter((o) => {
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
  }), [orders, keyword, filterStatus, listProv, listCity, listDist, listPath]);

  const listCityOpts = listProv ? getCities(listProv).map((c) => c.name) : [];
  const listDistOpts = listProv && listCity ? getDistricts(listProv, listCity) : [];

  const countOf = (key: string) => (key === '' ? orders.length : orders.filter((o) => mergedStatus(o.processStatus) === key).length);

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

  /* ── 重新分发 ── */
  const startReflow = (o: ExternalOrder) => setReflowing(o);
  const confirmReflow = () => {
    if (!reflowing) return;
    const o = reflowing;
    store.getState().resetToPending(o.id, ['processed', 'completed'].includes(o.processStatus) ? '管理后台重新分发（原执行信息作废）' : undefined);
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
      <ContentHeader title="履约分配" breadcrumbs={['销售', '销售订单管理', '履约分配']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          履约分配决定<strong>销售订单由谁来供货发货</strong>（自营仓发货 / 合作商采购直发），均<strong>逐个展示子单</strong>（母单聚合总览请前往「销售订单管理 → 销售订单」）。两个来源渠道：<strong>手工录入</strong>与<strong>直连推送</strong>，保存后均自动与审批通过的报备比对。
          命中报备的订单先进入<strong>报备-匹配待确认</strong>，人工确认匹配后分发给报备合作商；其余订单点击「分发」在弹窗中选择：转自营（在销售单自营/自营工作台接单，接单时填跟单人）、转派-指定、转派-报备、转派-抢单（时间有限）、转派-比单（积分优先）；抢单与比单可限定合作商地区。
          待接单订单可「重新分发」回待处理重新选择路径；已接单的重新分发需二次确认。
        </div>

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
          /* 虚线框：报备·指定·抢单中·比单中 一行并列 */
          .eop-box { display: flex; gap: 12px; padding: 9px 12px; align-items: center; border: 1.5px dashed var(--color-neutral-300); border-radius: 12px; flex: none; }
          .eop-box .tab-card-simple { justify-content: center; }
          .eop-dim { opacity: .45; cursor: not-allowed; }
          /* 履约分配弹窗 · 分发方式卡片（两行：名称 + 说明小字，文字居中；激活态用内联样式实现，禁用过渡避免干扰） */
          .eop-mode-card { flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: var(--space-2) var(--space-3); transition: none; text-align: center; }
          .eop-mode-card strong { font-size: var(--text-sm); }
          .eop-mode-card .eop-mode-sub { font-size: var(--text-xs); font-weight: 400; color: var(--color-neutral-400); line-height: 1.2; white-space: nowrap; }
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
              <span className="eop-lbl dn" aria-hidden="true">转派</span>
              <button className={`tab-card-simple${filterStatus === 'pending' ? ' active' : ''}`} onClick={() => setFilterStatus('pending')}>
                分发-待处理
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
              {/* 下路：分发方式（报备-匹配待确认 / 指定 / 抢单中 / 比单中）→ 转派待接单 */}
              <div className="eop-botrow">
                <div className="eop-box">
                  <button
                    className={`tab-card-simple${filterStatus === 'report_match_pending' ? ' active' : ''}`}
                    title="录入/直连推送时自动匹配报备，命中即进入此状态，人工确认后分发"
                    onClick={() => setFilterStatus('report_match_pending')}
                  >
                    报备-匹配待确认
                    <span className="tab-card-simple-count">{countOf('report_match_pending')}</span>
                  </button>
                  <button className="tab-card-simple eop-dim" disabled title="指定转派即时转出，无中间状态">指定</button>
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
                分发-已完成
                <span className="tab-card-simple-count">{countOf('processed')}</span>
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <input className="filter-input" placeholder="搜索订单/母订单编号、客户、平台单号（输入母单号展出其全部子单）..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 320 }} />
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
                <option value="">全部分发路径</option>
                <option value="self">自营</option>
                <option value="report">转派-报备</option>
                <option value="assign">转派-指定</option>
                <option value="grab">转派-抢单</option>
                <option value="compare">转派-比单</option>
                <option value="none">未选择</option>
              </select>
            </>
          )}
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
            <Button onClick={() => navigate('/sales/order-entry')}>+ 新建销售单</Button>
          </span>
        </div>

        {/* 子单平铺列表（逐单操作视图；母单聚合总览见「销售单管理 → 销售订单」） */}
        <Card style={{ padding: 0 }}>
          <Table
            headers={['订单编号', '来源', '客户', '地区', '收件人', '收件地址', '金额', '状态', '分发路径', '合作商', '录入时间', '操作']}
            rows={pagedOrders.map((o) => [
              <span key="c" className="cell-mono-emph">{o.code}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.externalOrderNo}</span></span>,
              <span key="src">
                {EXTERNAL_PLATFORM_LABELS[o.platform]}
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
              <span key="cu" className="cell-emph">{o.customerName}</span>,
              <span key="rg" style={{ whiteSpace: 'nowrap', fontSize: 'var(--text-sm)' }}>{regionText(o)}</span>,
              <span key="rcv" className="cell-emph">{o.receiver}<span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{o.receiverPhone}</span></span>,
              <span key="addr" className="cell-muted" style={{ fontSize: 'var(--text-sm)', minWidth: 160 }}>{o.receiverAddress}</span>,
              <span key="a" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>{money(o.totalAmount)}</span>,
              <span key="s">
                {statusPill(o.processStatus)}

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
                    <Button size="sm" onClick={() => openFlow(o)}>分发</Button>
                    {o.items.length >= 1 && <Button size="sm" variant="ghost" onClick={() => { setSplitting(o); setSplitQty({}); }}>拆单</Button>}
                    {o.sourceChannel === 'manual' && <Button size="sm" variant="ghost" onClick={() => { setSelectedId(o.id); startEdit(o); }}>修改</Button>}
                    {o.sourceChannel === 'manual' && <Button size="sm" variant="ghost" onClick={() => setDeleting(o)}>删除</Button>}
                  </>
                )}
                {o.processStatus === 'report_match_pending' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                    <Button size="sm" onClick={() => setMatchConfirming(o)}>确认匹配</Button>
                  </>
                )}
                {o.processStatus === 'self_pending' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/sales/order-shipping')}>去销售单自营</Button>
                  </>
                )}
                {o.processStatus === 'distribute_pending' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(o.id)}>查看</Button>
                    <Button size="sm" variant="danger" onClick={() => startReflow(o)}>重新分发</Button>
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
                    <Button size="sm" variant="danger" onClick={() => startReflow(o)}>重新分发</Button>
                  </>
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
              {current && current.processStatus !== 'pending' && current.processStatus !== 'self_pending' && current.processStatus !== 'processed' && current.processStatus !== 'completed' && (
                <Button variant="danger" onClick={() => startReflow(current)}>重新分发</Button>
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
            {/* ── 母子订单标签页（拆单家族：母订单 + 子订单1..N） ── */}
            {(() => {
              const rootCode = current.parentCode ?? current.code;
              const mother = orders.find((o) => o.code === rootCode && !o.parentCode);
              const children = orders.filter((o) => o.parentCode === rootCode);
              if (children.length === 0 && !current.parentCode) return null;
              const tab = (code: string, label: string) => (
                <button
                  key={code}
                  onClick={() => { const t = orders.find((o) => o.code === code); if (t) setSelectedId(t.id); }}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `1px solid ${current.code === code ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                    background: current.code === code ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                    color: current.code === code ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                    fontSize: 'var(--text-sm)', fontWeight: 500,
                  }}
                >
                  {label}
                </button>
              );
              return (
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {mother ? tab(mother.code, `母订单 ${mother.code}`) : null}
                  {children.map((c, i) => tab(c.code, `子订单${i + 1} ${c.code}`))}
                </div>
              );
            })()}

            {/* ── 查看态：订单信息 ── */}
            {!editForm.externalOrderNo && Object.keys(editForm).length === 0 && (
              <DrawerSection title="订单信息">
                <InfoGrid>
                  <InfoItem label="订单编号" mono emph>{current.code}</InfoItem>
                  <InfoItem label="来源平台">{EXTERNAL_PLATFORM_LABELS[current.platform]}</InfoItem>
                  <InfoItem label="平台原始单号" mono>{current.externalOrderNo}</InfoItem>
                  <InfoItem label="来源渠道">{current.sourceChannel === 'manual' ? '手工录入' : '直连推送'}</InfoItem>
                  <InfoItem label="客户">{current.customerName}（{current.customerType}）</InfoItem>
                  <InfoItem label="客户区域">{regionText(current)}</InfoItem>
                  <InfoItem label="订单金额" mono emph valueStyle={{ color: 'var(--color-module-current-base)' }}>{money(current.totalAmount)}</InfoItem>
                  <InfoItem label="录入时间">{current.entryTime}</InfoItem>
                  <InfoItem label="录入人">{current.operator}</InfoItem>
                  <InfoItem label="当前路径">{pathLabel(current)}</InfoItem>
                  {current.parentCode && <InfoItem label="母订单编号" mono>{current.parentCode}</InfoItem>}
                </InfoGrid>
              </DrawerSection>
            )}

            {/* ── 母单总览：子单进度（拆单家族） ── */}
            {(() => {
              const rootCode = current.parentCode ?? current.code;
              const children = orders.filter((o) => o.parentCode === rootCode);
              if (children.length === 0 || current.parentCode) return null;
              return (
                <DrawerSection title={`子单进度（${children.length} 张子单）`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {children.map((c) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)' }}>
                        <span className="mono" style={{ fontWeight: 'var(--font-medium)', minWidth: 150 }}>{c.code}</span>
                        {statusPill(c.processStatus)}
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', minWidth: 90 }}>{pathLabel(c)}</span>
                        <span style={{ fontSize: 'var(--text-sm)', flex: 1 }}>{c.partnerName ?? (c.path === 'self' ? '自营' : '—')}</span>
                        <span className="mono" style={{ fontSize: 'var(--text-sm)' }}>{money(c.totalAmount)}</span>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedId(c.id)}>查看</Button>
                      </div>
                    ))}
                  </div>
                </DrawerSection>
              );
            })()}

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

            {/* ── 待处理：提示前往履约分配弹窗处理 ── */}
            {current.processStatus === 'pending' && (
              <DrawerSection title="分发处理">
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7 }}>
                  订单待分发：请点击列表行操作「<strong>分发</strong>」按钮，在<strong>履约分配弹窗</strong>中选择自营或分发（指定 / 报备匹配 / 抢单 / 比单）路径完成分发。
                  本抽屉用于查看订单信息与处理轨迹，不做分发操作。
                </div>
              </DrawerSection>
            )}

            {/* ── 报备-匹配待确认 ── */}
            {current.processStatus === 'report_match_pending' && (
              <DrawerSection title="报备匹配（待确认）">
                <InfoGrid>
                  {current.reportMatches?.map((m) => (
                    <InfoItem key={m.reportCode} label={`命中报备（${PARTNER_REPORT_TYPE_LABELS[m.reportType]}）`} mono>{m.reportCode}</InfoItem>
                  ))}
                  {current.reportMatches?.[0] && <InfoItem label="拟分发合作商">{current.reportMatches[0].partnerName}</InfoItem>}
                </InfoGrid>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginTop: 'var(--space-2)', lineHeight: 1.7 }}>
                  系统在订单保存（手工录入 / 直连推送）时自动与审批通过的报备规则比对，命中即进入本状态。请人工<strong>确认匹配</strong>后分发给报备合作商，进入转派待接单等待接单。
                </div>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <Button onClick={() => setMatchConfirming(current)}>确认匹配并转出</Button>
                </div>
              </DrawerSection>
            )}

            {/* ── 自营待接单：接单/退回在「销售单自营」详情页 ── */}
            {current.processStatus === 'self_pending' && (
              <DrawerSection title="自营待接单">
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7, marginBottom: 'var(--space-2)' }}>
                  订单已转入<strong>自营</strong>：接单（填跟单人）、退回分发等操作请在<strong>销售单自营</strong>菜单的详情页进行；
                  接单后可拆单，并通过「采购&amp;发货」按仓库分仓直发（各仓快递单号）+ 缺口以销定采。
                </div>
                <Button onClick={() => navigate('/sales/order-shipping')}>前往销售单自营处理</Button>
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
                  截止后在「销售 → 比单管理」评分定标；也可在报名合作商中直接选定（转为指定转派）
                </div>
              </DrawerSection>
            )}

            {/* ── 转派待接单 ── */}
            {current.processStatus === 'distribute_pending' && current.partnerName && (
              <DrawerSection title="转派待接单">
                <InfoGrid>
                  <InfoItem label="合作商">{current.partnerName}</InfoItem>
                  <InfoItem label="分发方式">{TRANSFER_SOURCE_LABELS[current.transferSource ?? '']}</InfoItem>
                  <InfoItem label="分发时间">{current.transferTime ?? '—'}</InfoItem>
                  {current.reportMatches?.[0] && <InfoItem label="命中报备" mono>{current.reportMatches[0].reportCode}</InfoItem>}
                </InfoGrid>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginTop: 'var(--space-2)', lineHeight: 1.7 }}>
                  等待合作商在终端<strong>订单管理</strong>点击「接单」；接单后订单进入<strong>已处理</strong>。改路径可「重新分发」退回待处理。
                </div>
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

      {/* ── 重新分发确认弹窗 ── */}
      {reflowing && (
        <div className="category-dialog-overlay" onClick={() => setReflowing(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>重新分发</div>
            {['processed', 'completed'].includes(reflowing.processStatus) && (
              <div style={{ padding: '10px 14px', background: '#FFF3E0', color: '#E65100', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)', lineHeight: 1.7, fontWeight: 'var(--font-medium)' }}>
                {processedWarnText(reflowing)}
              </div>
            )}
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              确认后订单 <strong className="mono">{reflowing.code}</strong> 将<strong>进入待处理状态重新选择路径</strong>
              {['processed', 'completed'].includes(reflowing.processStatus) ? `，原有执行信息（${reflowing.path === 'self' ? '采购/出入库单据' : '合作商关联、履约进度'}）全部作废。` : '，可重新选择自营或分发路径。'}
              {reflowing.transferSource === 'report' && ' 该订单原为报备转派，重新分发后报备匹配信息已清除，不会再自动按报备转派。'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setReflowing(null)}>取消</Button>
              <Button variant={['processed', 'completed'].includes(reflowing.processStatus) ? 'danger' : undefined} onClick={confirmReflow}>确认重新分发</Button>
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
              选定 <strong>{awarding.supplierName}</strong>，订单将跳过评分直接转为<strong>指定转派</strong>，进入转派待接单等待其接单。
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

      {/* ── 履约分配弹窗（待处理订单独立处理页：直接选择分发方式，含转自营） ── */}
      {flowing && (
        <div className="category-dialog-overlay" onClick={() => setFlowingId(null)}>
          <div
            className="category-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 720, maxWidth: '94vw', height: 'min(80vh, 720px)', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', flexShrink: 0 }}>履约分配 · {flowing.code}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7, flexShrink: 0 }}>
              {flowing.customerName} · {regionText(flowing)} · 订单金额 {money(flowing.totalAmount)} · 当前状态：待处理。选择分发方式后点击右下角确认完成分发。
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
              {/* 分发方式：转自营（辅色调，内联实现激活态） + 转派-指定 / 转派-报备 / 转派-抢单（时间有限） / 转派-比单（积分优先） */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <button
                  className="tab-card-simple eop-mode-card"
                  style={flowMode === 'self'
                    ? { borderColor: 'var(--color-module-current-secondary)', background: 'rgba(203, 64, 93, 0.06)' }
                    : undefined}
                  onClick={() => setFlowMode('self')}
                >
                  <strong style={flowMode === 'self' ? { color: 'var(--color-module-current-secondary)' } : undefined}>转自营</strong>
                </button>
                <button
                  className="tab-card-simple eop-mode-card"
                  style={flowMode === 'assign' ? { borderColor: 'var(--color-module-current-base)', background: 'var(--color-module-current-lightest)' } : undefined}
                  onClick={() => setFlowMode('assign')}
                >
                  <strong style={flowMode === 'assign' ? { color: 'var(--color-module-current-base)' } : undefined}>转派-指定</strong>
                </button>
                <button
                  className="tab-card-simple eop-mode-card"
                  style={flowMode === 'report' ? { borderColor: 'var(--color-module-current-base)', background: 'var(--color-module-current-lightest)' } : undefined}
                  onClick={() => setFlowMode('report')}
                >
                  <strong style={flowMode === 'report' ? { color: 'var(--color-module-current-base)' } : undefined}>转派-报备</strong>
                </button>
                <button
                  className="tab-card-simple eop-mode-card"
                  style={flowMode === 'grab' ? { borderColor: 'var(--color-module-current-base)', background: 'var(--color-module-current-lightest)' } : undefined}
                  onClick={() => setFlowMode('grab')}
                >
                  <strong style={flowMode === 'grab' ? { color: 'var(--color-module-current-base)' } : undefined}>转派-抢单</strong>
                  <span className="eop-mode-sub">（时间优先）</span>
                </button>
                <button
                  className="tab-card-simple eop-mode-card"
                  style={flowMode === 'compare' ? { borderColor: 'var(--color-module-current-base)', background: 'var(--color-module-current-lightest)' } : undefined}
                  onClick={() => setFlowMode('compare')}
                >
                  <strong style={flowMode === 'compare' ? { color: 'var(--color-module-current-base)' } : undefined}>转派-比单</strong>
                  <span className="eop-mode-sub">（积分优先）</span>
                </button>
              </div>

              {/* 转自营 */}
              {flowMode === 'self' && (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 1.7, padding: 'var(--space-2) 0' }}>
                  转自营路径：订单进入<strong>自营待接单</strong>，请在「销售单自营」接单，接单时填写跟单人并选择采购供应商，进入自营执行（以销定采）。
                </div>
              )}

              {/* 转派-指定：合作商列表 + 省市县筛选 + 搜索 + 分页 */}
              {flowMode === 'assign' && (
                <div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
                    <select className="filter-select" value={supplierProv} onChange={(e) => { setSupplierProv(e.target.value); setSupplierCity(''); setSupplierDist(''); }}>
                      <option value="">全部省份</option>
                      {PROVINCE_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select className="filter-select" disabled={!supplierProv} value={supplierCity} onChange={(e) => { setSupplierCity(e.target.value); setSupplierDist(''); }}>
                      <option value="">全部城市</option>
                      {supplierCityOpts.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="filter-select" disabled={!supplierCity} value={supplierDist} onChange={(e) => setSupplierDist(e.target.value)}>
                      <option value="">全部区县</option>
                      {supplierDistOpts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input className="filter-input" placeholder="搜索合作商名称..." value={supplierKw} onChange={(e) => setSupplierKw(e.target.value)} style={{ width: 160 }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', alignSelf: 'center' }}>共 {flowSuppliers.length} 家</span>
                  </div>
                  <table className="detail-inline-table">
                    <thead><tr><th></th><th>合作商</th><th>积分</th><th>履约率</th><th>地区</th></tr></thead>
                    <tbody>
                      {pagedSuppliers.length === 0 && (
                        <tr><td colSpan={5} style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 'var(--space-3)' }}>当前筛选条件下暂无合作商</td></tr>
                      )}
                      {pagedSuppliers.map((s) => {
                        const sc = scoreOf(s.id, s.name);
                        return (
                          <tr key={s.id}>
                            <td><input type="radio" name="flow-supplier" checked={flowSupplier === s.id} onChange={() => setFlowSupplier(s.id)} /></td>
                            <td style={{ fontWeight: 'var(--font-medium)' }}>{s.name}</td>
                            <td className="mono">{sc.total}</td>
                            <td className="mono">{sc.ontimeRate}%</td>
                            <td style={{ fontSize: 'var(--text-sm)' }}>{[s.registeredProvince, s.registeredCity, s.registeredDistrict].filter(Boolean).join(' / ') || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {flowSuppliers.length > 10 && pager(supplierPage, supplierPages, flowSuppliers.length, setSupplierPage)}
                </div>
              )}

              {/* 转派-报备：地区筛选 + 报备列表 + 分页 */}
              {flowMode === 'report' && (
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)', lineHeight: 1.7 }}>
                    展示审批通过的报备记录供选择（可勾选多条，一笔订单可对应多条报备，转出给首家勾选报备的合作商）；与当前订单自动匹配的报备标注「匹配」。可按报备合作商地区筛选。
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
                    <select className="filter-select" value={reportProv} onChange={(e) => { setReportProv(e.target.value); setReportCity(''); setReportDist(''); }}>
                      <option value="">全部省份</option>
                      {PROVINCE_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select className="filter-select" disabled={!reportProv} value={reportCity} onChange={(e) => { setReportCity(e.target.value); setReportDist(''); }}>
                      <option value="">全部城市</option>
                      {reportCityOpts.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="filter-select" disabled={!reportCity} value={reportDist} onChange={(e) => setReportDist(e.target.value)}>
                      <option value="">全部区县</option>
                      {reportDistOpts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', alignSelf: 'center' }}>共 {flowReports.length} 条</span>
                  </div>
                  <table className="detail-inline-table">
                    <thead><tr><th></th><th>报备编号</th><th>类型</th><th>报备标题</th><th>报备合作商</th><th>地区</th><th>匹配</th></tr></thead>
                    <tbody>
                      {pagedReports.length === 0 && (
                        <tr><td colSpan={7} style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 'var(--space-3)' }}>当前筛选条件下暂无报备记录</td></tr>
                      )}
                      {pagedReports.map((r) => {
                        const matched = reportMatchesOrder(flowing, r);
                        const rs = suppliers.find((x) => x.name === r.partnerName);
                        return (
                          <tr key={r.id} style={matched ? { background: 'var(--color-module-current-lightest)' } : undefined}>
                            <td><input type="checkbox" checked={pickReportCodes.includes(r.code)} onChange={() => setPickReportCodes((prev) => prev.includes(r.code) ? prev.filter((c) => c !== r.code) : [...prev, r.code])} /></td>
                            <td className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{r.code}</td>
                            <td>{PARTNER_REPORT_TYPE_LABELS[r.type]}</td>
                            <td style={{ fontSize: 'var(--text-sm)' }}>{r.title}</td>
                            <td style={{ fontSize: 'var(--text-sm)' }}>{r.partnerName}</td>
                            <td style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{[rs?.registeredProvince, rs?.registeredCity, rs?.registeredDistrict].filter(Boolean).join(' / ') || '—'}</td>
                            <td>{matched ? pill('#E8F5E9', '#01795D', '匹配') : <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {flowReports.length > 10 && pager(reportPage, reportPages, flowReports.length, setReportPage)}
                </div>
              )}

              {/* 转派-抢单：说明 + 地区范围 + 抢单时长设置 */}
              {flowMode === 'grab' && (
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)', lineHeight: 1.7 }}>
                    发布后推送合作商终端「抢单大厅」，{settings.grabMinutes} 分钟内<strong>先到先得</strong>，超时自动退回待处理。可选择限定参与合作商的地区范围（不选则全部地区）。
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>参与地区：</span>
                    <select className="filter-select" value={scopeProv} onChange={(e) => { setScopeProv(e.target.value); setScopeCity(''); setScopeDist(''); }}>
                      <option value="">全部省份</option>
                      {PROVINCE_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select className="filter-select" disabled={!scopeProv} value={scopeCity} onChange={(e) => { setScopeCity(e.target.value); setScopeDist(''); }}>
                      <option value="">全部城市</option>
                      {scopeCityOpts.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="filter-select" disabled={!scopeCity} value={scopeDist} onChange={(e) => setScopeDist(e.target.value)}>
                      <option value="">全部区县</option>
                      {scopeDistOpts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>抢单时长（分钟）</label>
                      <input
                        className="filter-input mono" type="number" min={1} value={settings.grabMinutes}
                        onChange={(e) => store.getState().updateSettings({ grabMinutes: Math.max(1, Number(e.target.value) || 30) })}
                        style={{ width: 120 }}
                      />
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', paddingBottom: 10 }}>发布后合作商可抢的时间窗口，调整后立即生效</span>
                  </div>
                </div>
              )}

              {/* 转派-比单：底价 + 地区范围 */}
              {flowMode === 'compare' && (
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)', lineHeight: 1.7 }}>
                    公开报名制：合作商可在 {settings.compareMinutes} 分钟内报名（报价默认带出其系统报价，可调但不低于底价），截止后按「报价 {settings.compareWeights.quote}0% + 积分 {settings.compareWeights.score}0%」评分定标。
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
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
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', flex: 1, minWidth: 200 }}>
                      {floorType === 'discount'
                        ? `报名价不得低于订单金额 ${floorValue} 折（${money(compareFloorAmount(flowing.totalAmount, { type: 'discount', value: Number(floorValue) || 0 }))}）`
                        : `报名价不得低于 ${money(Number(floorValue) || 0)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>报名时长（分钟）</label>
                      <input
                        className="filter-input mono" type="number" min={1} value={settings.compareMinutes}
                        onChange={(e) => store.getState().updateSettings({ compareMinutes: Math.max(1, Number(e.target.value) || 30) })}
                        style={{ width: 120 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>评分权重（报价 / 积分）</label>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <input
                          className="filter-input mono" type="number" min={0} max={10} value={settings.compareWeights.quote}
                          onChange={(e) => store.getState().updateSettings({ compareWeights: { ...settings.compareWeights, quote: Math.max(0, Number(e.target.value) || 0) } })}
                          style={{ width: 80 }}
                        />
                        <input
                          className="filter-input mono" type="number" min={0} max={10} value={settings.compareWeights.score}
                          onChange={(e) => store.getState().updateSettings({ compareWeights: { ...settings.compareWeights, score: Math.max(0, Number(e.target.value) || 0) } })}
                          style={{ width: 80 }}
                        />
                      </div>
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', paddingBottom: 10 }}>报名窗口与评分权重，调整后立即生效</span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>参与地区：</span>
                    <select className="filter-select" value={scopeProv} onChange={(e) => { setScopeProv(e.target.value); setScopeCity(''); setScopeDist(''); }}>
                      <option value="">全部省份</option>
                      {PROVINCE_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select className="filter-select" disabled={!scopeProv} value={scopeCity} onChange={(e) => { setScopeCity(e.target.value); setScopeDist(''); }}>
                      <option value="">全部城市</option>
                      {scopeCityOpts.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="filter-select" disabled={!scopeCity} value={scopeDist} onChange={(e) => setScopeDist(e.target.value)}>
                      <option value="">全部区县</option>
                      {scopeDistOpts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 右下角：取消 + 确认（确认文案随分发方式变化；转自营用辅色调） */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexShrink: 0 }}>
              <Button variant="ghost" onClick={() => setFlowingId(null)}>取消</Button>
              <Button variant={flowMode === 'self' ? 'danger' : undefined} style={flowMode === 'self' ? { transition: 'none' } : undefined} disabled={flowConfirmDisabled} onClick={doFlowConfirm}>{flowConfirmLabel}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 拆单弹窗（分发-待处理按商品+数量拆出子订单） ── */}
      {splitting && (
        <div className="category-dialog-overlay" onClick={() => setSplitting(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '94vw' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>拆单 · {splitting.code}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
              按<strong>商品 + 数量</strong>拆出子订单：子订单编号为母订单编号追加 <strong className="mono">-1 / -2…</strong>（按已拆次数递增），
              拆出后作为独立订单分发，母订单保留剩余商品；详情页按「母订单 / 子订单」标签页展示。
            </div>
            <table className="detail-inline-table">
              <thead><tr><th>商品名称</th><th>规格</th><th>订单数量</th><th>拆出数量</th></tr></thead>
              <tbody>
                {splitting.items.map((it) => (
                  <tr key={it.productName}>
                    <td style={{ fontWeight: 'var(--font-medium)' }}>{it.productName}</td>
                    <td>{it.spec}</td>
                    <td className="mono">{it.quantity}</td>
                    <td>
                      <input
                        className="filter-input mono" type="number" min={0} max={it.quantity}
                        placeholder="0" value={splitQty[it.productName] ?? ''}
                        onChange={(e) => setSplitQty((f) => ({ ...f, [it.productName]: e.target.value }))}
                        style={{ width: 90 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-2)' }}>
              提示：留空或 0 表示不拆出该商品；不能拆出全部商品（母订单至少保留一件）。
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setSplitting(null)}>取消</Button>
              <Button
                disabled={!splitting.items.some((it) => Number(splitQty[it.productName] ?? 0) > 0)}
                onClick={() => {
                  const parts = splitting.items
                    .map((it) => ({ productName: it.productName, quantity: Number(splitQty[it.productName] ?? 0) }))
                    .filter((x) => x.quantity > 0);
                  store.getState().splitOrder(splitting.id, parts);
                  setSplitting(null);
                }}
              >
                确认拆单
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 确认报备匹配弹窗（报备-匹配待确认） ── */}
      {matchConfirming && (
        <div className="category-dialog-overlay" onClick={() => setMatchConfirming(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>确认报备匹配</div>
            {matchConfirming.reportMatches?.[0] ? (
              <>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
                  订单 <strong className="mono">{matchConfirming.code}</strong>（{matchConfirming.customerName} · {money(matchConfirming.totalAmount)}）命中报备
                  <strong className="mono"> {matchConfirming.reportMatches[0].reportCode} </strong>
                  （{PARTNER_REPORT_TYPE_LABELS[matchConfirming.reportMatches[0].reportType]}），拟分发合作商：<strong>{matchConfirming.reportMatches[0].partnerName}</strong>。
                  确认后订单进入<strong>转派待接单</strong>，等待合作商接单。
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                  <Button variant="ghost" onClick={() => setMatchConfirming(null)}>取消</Button>
                  <Button onClick={() => {
                    store.getState().confirmReportMatch(matchConfirming.id);
                    setMatchConfirming(null);
                    setSelectedId(null);
                  }}>匹配并转出</Button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>未找到报备匹配信息</div>
            )}
          </div>
        </div>
      )}

    </>
  );
}
