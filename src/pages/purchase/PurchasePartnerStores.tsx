import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { StorePhotoGallery } from '../../components/common/StorePhotoPicker';
import { useSupplierStore } from '../../stores/supplierStore';
import StoreMapPanel from './StoreMapPanel';
import type { SupplierStore } from '../../types';

/** 门店行（含归属合作商，随合作商档案实时更新） */
interface PartnerStoreRow extends SupplierStore {
  supplierId: string;
  supplierName: string;
}

const statusTag = (status: 'active' | 'inactive') => (
  <span style={{
    padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    background: status === 'active' ? '#E8F5E9' : '#FFF3E0',
    color: status === 'active' ? '#2E7D32' : '#E65100',
  }}>
    {status === 'active' ? '营业中' : '已停业'}
  </span>
);

/**
 * 采购-合作商管理-合作商门店：
 * 汇总全部合作商档案中的门店（与管理后台编辑、合作商终端维护实时联动），支持按合作商/地区/品牌筛选查看
 */
export default function PurchasePartnerStores() {
  const suppliers = useSupplierStore(s => s.suppliers);

  /** 全部门店行（拍平合作商档案，附加归属信息） */
  const rows: PartnerStoreRow[] = useMemo(
    () => suppliers.flatMap(s => s.stores.map<PartnerStoreRow>(st => ({ ...st, supplierId: s.id, supplierName: s.name }))),
    [suppliers],
  );

  const [keyword, setKeyword] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [detailStore, setDetailStore] = useState<PartnerStoreRow | null>(null);
  const [showMap, setShowMap] = useState(false);

  /** 地区（省份）筛选选项：现有门店涉及的省份 */
  const provinceOptions = useMemo(
    () => Array.from(new Set(rows.map(st => st.province).filter((p): p is string => Boolean(p)))).sort((a, b) => a.localeCompare(b, 'zh')),
    [rows],
  );

  /** 主营品牌筛选选项：现有门店涉及的品牌 */
  const brandOptions = useMemo(
    () => Array.from(new Set(rows.flatMap(st => st.mainBrands))).sort((a, b) => a.localeCompare(b, 'zh')),
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter(st => {
      if (filterSupplier && st.supplierId !== filterSupplier) return false;
      if (filterProvince && st.province !== filterProvince) return false;
      if (filterBrand && !st.mainBrands.includes(filterBrand)) return false;
      if (keyword) {
        const kw = keyword;
        const hit = st.name.includes(kw) || st.supplierName.includes(kw)
          || [st.province, st.city, st.district].some(r => (r ?? '').includes(kw))
          || st.address.includes(kw) || (st.manager ?? '').includes(kw) || (st.phone ?? '').includes(kw)
          || st.mainBrands.some(b => b.includes(kw));
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, keyword, filterSupplier, filterProvince, filterBrand]);

  return (
    <>
      <ContentHeader title="合作商门店" breadcrumbs={['采购', '合作商管理', '合作商门店']} />

      <div className="content-body">
        {/* 工具栏：搜索 + 合作商/地区/主营品牌筛选 + 地图总览 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          <input className="filter-input" placeholder="搜索门店名称、合作商、地区、品牌、负责人..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 260 }} />
          <select className="filter-select" value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}>
            <option value="">全部合作商</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="filter-select" value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
            <option value="">全部地区</option>
            {provinceOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="filter-select" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
            <option value="">全部品牌</option>
            {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 家门店</span>
          <Button onClick={() => setShowMap(true)}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4.5l5-2.5 2 1.2 5-2.5v11l-5 2.5-2-1.2-5 2.5v-11zM9 3.2v11M7 13.7v-11" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            地图总览
          </Button>
        </div>

        {/* 列表 */}
        <Card style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
              {rows.length === 0 ? '暂无合作商门店，请在合作商列表详情中维护门店' : '未找到符合条件的门店'}
            </div>
          ) : (
            <Table
              headers={['序号', '门店名称', '归属合作商', '所在地区', '详细地址', '负责人', '联系电话', '主营品牌', '面积', '状态', '操作']}
              rows={filtered.map((st, idx) => [
                <span key="idx" className="mono">{idx + 1}</span>,
                <span key="name" className="cell-emph">{st.name || '（未命名门店）'}</span>,
                <span key="sup" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{st.supplierName}</span>,
                <span key="region" style={{ fontSize: 'var(--text-sm)' }}>{[st.province, st.city, st.district].filter(Boolean).join(' / ') || '—'}</span>,
                <span key="addr" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{st.address || '—'}</span>,
                <span key="mgr" style={{ fontSize: 'var(--text-sm)' }}>{st.manager || '—'}</span>,
                <span key="ph" className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{st.phone || '—'}</span>,
                <span key="brands" style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                  {(st.mainBrands.length ? st.mainBrands : ['—']).map(b => (
                    <span key={b} style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', background: 'var(--color-module-current-lightest)', border: '1px solid var(--color-module-current-base)30', color: 'var(--color-module-current-base)' }}>{b}</span>
                  ))}
                </span>,
                <span key="area" className="mono">{st.area}㎡</span>,
                statusTag(st.status),
                <div className="row-actions" key="act">
                  <Button size="sm" variant="ghost" onClick={() => setDetailStore(st)}>查看</Button>
                </div>,
              ])}
            />
          )}
        </Card>
      </div>

      {/* 门店详情抽屉（只读：门店维护入口为合作商列表详情 / 合作商终端「门店信息」） */}
      <DetailDrawer
        open={!!detailStore}
        onClose={() => setDetailStore(null)}
        badge="MD"
        title={detailStore?.name || '（未命名门店）'}
        statusTag={detailStore && statusTag(detailStore.status)}
        subtitle={detailStore && `${detailStore.supplierName} · ${[detailStore.province, detailStore.city, detailStore.district].filter(Boolean).join(' / ') || '—'}`}
        mode="view"
      >
        {detailStore && (
          <>
            <DrawerSection title="基本信息">
              <InfoGrid cols={3}>
                <InfoItem label="门店名称" emph>{detailStore.name || '—'}</InfoItem>
                <InfoItem label="营业状态">{statusTag(detailStore.status)}</InfoItem>
                <InfoItem label="门店面积" mono>{detailStore.area}㎡</InfoItem>
                <InfoItem label="负责人">{detailStore.manager || '—'}</InfoItem>
                <InfoItem label="联系电话" mono>{detailStore.phone || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="归属合作商">
              <InfoGrid cols={3}>
                <InfoItem label="合作商" emph>{detailStore.supplierName}</InfoItem>
                <InfoItem label="所在地区">{[detailStore.province, detailStore.city, detailStore.district].filter(Boolean).join(' / ') || '—'}</InfoItem>
                <InfoItem label="详细地址" span={3}>{detailStore.address || '—'}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title="门店主营品牌">
              <InfoGrid cols={3}>
                <InfoItem label="主营品牌" span={3}>
                  {detailStore.mainBrands.length > 0 ? (
                    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
                      {detailStore.mainBrands.map(b => (
                        <span key={b} style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: 'var(--color-module-current-lightest)', border: '1px solid var(--color-module-current-base)30', color: 'var(--color-module-current-base)' }}>{b}</span>
                      ))}
                    </span>
                  ) : '—'}
                </InfoItem>
              </InfoGrid>
            </DrawerSection>

            {(detailStore.photos?.length ?? 0) > 0 && (
              <DrawerSection title={`门店照片（${detailStore.photos!.length} 张）`}>
                <StorePhotoGallery photos={detailStore.photos} />
              </DrawerSection>
            )}

            <DrawerSection title="联动说明">
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                门店数据来源于「合作商列表」详情与合作商终端「门店信息」，在此只读展示；如需修改请在合作商列表详情中编辑，或由合作商在终端提交修改申请。
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* 地图总览抽屉：与「门店总览」页面共用的全国门店分布地图 + 品牌 TOP10 */}
      {showMap && (
        <div className="drawer-overlay" onClick={() => setShowMap(false)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">地图总览</span>
              <button className="drawer-close" onClick={() => setShowMap(false)}>×</button>
            </div>
            <div className="drawer-body">
              <StoreMapPanel stores={rows} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
