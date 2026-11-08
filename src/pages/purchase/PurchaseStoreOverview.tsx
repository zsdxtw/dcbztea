import { useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import { useSupplierStore } from '../../stores/supplierStore';
import StoreMapPanel from '../cooperation/StoreMapPanel';
import type {} from '../../types';

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


  return (
    <>
      <ContentHeader title="门店总览" breadcrumbs={['采购&仓储', '合作商管理', '门店总览']} />

      <div className="content-body">
        {/* 统计卡片 */}

        {/* 中国地图 + 品牌 TOP10（与「合作商门店」地图总览弹层共用） */}
        <StoreMapPanel stores={stores} />
      </div>
    </>
  );
}
