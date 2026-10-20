import { useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import { useSupplierStore } from '../../stores/supplierStore';
import StoreMapPanel from './StoreMapPanel';
import type { StatCardData } from '../../types';

/**
 * 采购-合作商管理-门店总览：
 * 中国地图按省份展示合作门店数量（数据实时来源于合作商档案，与管理后台/合作商终端联动）；
 * 地图下方展示前 10 大品牌的合作门店数量，点击省份后切换为该省品牌榜，再次点击已选省份取消筛选
 */
export default function PurchaseStoreOverview() {
  const suppliers = useSupplierStore(s => s.suppliers);

  /** 全部合作门店（含归属合作商，随档案实时更新） */
  const stores = useMemo(
    () => suppliers.flatMap(s => s.stores.map(st => ({ ...st, supplierName: s.name }))),
    [suppliers],
  );

  /** 覆盖省份数（短名去重） */
  const provinceCount = useMemo(() => {
    const m = new Map<string, number>();
    stores.forEach(st => { if (st.province) m.set(st.province, (m.get(st.province) ?? 0) + 1); });
    return m;
  }, [stores]);

  /** 涉及品牌总数 */
  const brandTotal = useMemo(() => {
    const brands = new Set<string>();
    stores.forEach(st => st.mainBrands.forEach(b => brands.add(b)));
    return brands.size;
  }, [stores]);

  /** 全国门店数 TOP1 品牌（统计卡展示） */
  const topBrand = useMemo(() => {
    const m = new Map<string, number>();
    stores.forEach(st => st.mainBrands.forEach(b => m.set(b, (m.get(b) ?? 0) + 1)));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  }, [stores]);

  // 统计卡片
  const stats: StatCardData[] = useMemo(() => [
    {
      label: '合作门店总数', value: String(stores.length), unit: '家',
      trend: { direction: 'up', value: `覆盖 ${provinceCount.size} 个省份` },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 8l1.5-4h11L17 8M3 8v9h14V8M3 8h14M8 17v-5h4v5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    },
    {
      label: '覆盖省份', value: String(provinceCount.size), unit: '个',
      trend: { direction: 'up', value: `涉及 ${brandTotal} 个品牌` },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2L3 5v8l6 3 6-3V5L9 2zM9 8l6-3M9 8v10M9 8L3 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    },
    {
      label: '合作品牌', value: String(brandTotal), unit: '个',
      trend: { direction: 'up', value: `TOP1 ${topBrand}` },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.7 5.1 17.2l.9-5.5-4-3.9L7.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    },
    {
      label: '门店合作商', value: String(new Set(stores.map(st => st.supplierName)).size), unit: '家',
      trend: { direction: 'up', value: `合作商共 ${suppliers.length} 家` },
      icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="14" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
    },
  ], [stores, provinceCount, brandTotal, topBrand, suppliers.length]);

  return (
    <>
      <ContentHeader title="门店总览" breadcrumbs={['采购', '合作商管理', '门店总览']} />

      <div className="content-body">
        {/* 统计卡片 */}
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        {/* 中国地图 + 品牌 TOP10（与「合作商门店」地图总览弹层共用） */}
        <StoreMapPanel stores={stores} />
      </div>
    </>
  );
}
