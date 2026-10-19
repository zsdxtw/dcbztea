import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { MapChart } from 'echarts/charts';
import { TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useSupplierStore } from '../../stores/supplierStore';
import type { StatCardData } from '../../types';
import './PurchaseStoreOverview.css';

echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer]);

/** GeoJSON 全称省名 → 常用短名（如 浙江省 → 浙江、内蒙古自治区 → 内蒙古） */
const toShortProvince = (full: string) => full.replace(/(壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市)$/, '');

/** 中国地图 GeoJSON（public/china.json，来源于阿里 DataV） */
const CHINA_GEO_URL = '/china.json';
/** 地图容器高度 */
const MAP_HEIGHT = 560;

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

  /** 各省门店数（短名计数） */
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

  /** 当前选中省份（GeoJSON 全称），null = 全国视图 */
  const [selectedFull, setSelectedFull] = useState<string | null>(null);
  const selectedShort = selectedFull ? toShortProvince(selectedFull) : null;

  /** GeoJSON 省名列表（fetch 注册后写入） */
  const [geoNames, setGeoNames] = useState<string[]>([]);
  const [geoReady, setGeoReady] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  /** 拉取并注册中国地图 */
  useEffect(() => {
    let cancelled = false;
    fetch(CHINA_GEO_URL)
      .then(r => r.json())
      .then((geo: { features: { properties: { name: string } }[] }) => {
        if (cancelled) return;
        echarts.registerMap('china', geo as unknown as Parameters<typeof echarts.registerMap>[1]);
        setGeoNames(geo.features.map(f => f.properties.name).filter(Boolean));
        setGeoReady(true);
      })
      .catch(() => { if (!cancelled) setGeoReady(false); });
    return () => { cancelled = true; };
  }, []);

  /** 初始化图表：渲染 + 点击省份切换品牌榜（点击已选省份取消） */
  useEffect(() => {
    if (!geoReady || !chartRef.current || chart.current) return;
    const instance = echarts.init(chartRef.current);
    chart.current = instance;
    instance.on('click', (params: { name?: string }) => {
      const name = params.name;
      if (!name) return;
      setSelectedFull(prev => (prev === name ? null : name));
    });
    const onResize = () => instance.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      instance.dispose();
      chart.current = null;
    };
  }, [geoReady]);

  /** 数据 / 选中省份变化 → 更新地图 */
  useEffect(() => {
    const instance = chart.current;
    if (!geoReady || !instance) return;
    const data = geoNames.map(name => {
      const value = provinceCount.get(toShortProvince(name)) ?? 0;
      const selected = selectedFull === name;
      return {
        name,
        value,
        selected,
        ...(selected ? { itemStyle: { areaColor: '#0F64B5', borderColor: '#0A4C8C', borderWidth: 1.5 } } : {}),
      };
    });
    const maxCount = Math.max(1, ...Array.from(provinceCount.values()));
    instance.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (p: { name?: string; value?: number | string }) => {
          const v = typeof p.value === 'number' ? p.value : 0;
          return `${p.name}<br/>合作门店 <b style="color:#CB405D">${v}</b> 家`;
        },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        left: 12,
        bottom: 16,
        text: ['门店多', '门店少'],
        calculable: true,
        inRange: { color: ['#FDF0F3', '#F2AEBE', '#CB405D'] },
      },
      series: [{
        type: 'map',
        map: 'china',
        /** 允许滚轮缩放与拖拽平移，便于放大查看各省门店数量 */
        roam: true,
        scaleLimit: { min: 1, max: 6 },
        selectedMode: 'single',
        zoom: 1.32,
        label: {
          show: true,
          fontSize: 10,
          color: 'rgba(30,38,34,0.9)',
          lineHeight: 13,
          /** 省名下方展示该省门店数量（无门店省份仅显示省名） */
          formatter: (p: { name: string; value?: number | string }) => {
            const v = typeof p.value === 'number' ? p.value : 0;
            return v > 0 ? `${p.name}\n${v}家` : p.name;
          },
        },
        itemStyle: { areaColor: '#F2F5F2', borderColor: '#FFFFFF', borderWidth: 1 },
        emphasis: {
          label: { show: true, color: '#1E2622', fontWeight: 600 },
          itemStyle: { areaColor: '#F2AEBE' },
        },
        data,
      }],
    } as echarts.EChartsCoreOption);
  }, [geoReady, geoNames, provinceCount, selectedFull]);

  /** 品牌榜：全国或选中省份的门店数前 10 品牌（门店按主营品牌各计 1 家） */
  const brandRows = useMemo(() => {
    const target = selectedShort ? stores.filter(st => st.province === selectedShort) : stores;
    const m = new Map<string, number>();
    target.forEach(st => st.mainBrands.forEach(b => m.set(b, (m.get(b) ?? 0) + 1)));
    return Array.from(m.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand, 'zh'))
      .slice(0, 10);
  }, [stores, selectedShort]);
  const maxBrandCount = brandRows[0]?.count ?? 1;

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
      trend: { direction: 'up', value: `TOP1 ${brandRows[0]?.brand ?? '—'}` },
      icon: <svg viewBox="0 0 18 18" fill="none"><path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.7 5.1 17.2l.9-5.5-4-3.9L7.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    },
    {
      label: '门店合作商', value: String(new Set(stores.map(st => st.supplierName)).size), unit: '家',
      trend: { direction: 'up', value: `合作商共 ${suppliers.length} 家` },
      icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="14" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
    },
  ], [stores, provinceCount, brandTotal, brandRows, suppliers.length]);

  return (
    <>
      <ContentHeader title="门店总览" breadcrumbs={['采购', '合作商管理', '门店总览']} />

      <div className="content-body">
        {/* 统计卡片 */}
        <div className="stat-cards">
          {stats.map((s, i) => <StatCard key={i} data={s} />)}
        </div>

        {/* 中国地图：各省门店分布 */}
        <Card
          title="全国门店分布"
          headerRight={
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              数据实时来源于合作商档案门店，点击省份查看该省品牌门店分布
            </span>
          }
          style={{ marginBottom: 'var(--space-6)' }}
        >
          {!geoReady ? (
            <div style={{ height: MAP_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
              地图加载中...
            </div>
          ) : (
            <div ref={chartRef} style={{ width: '100%', height: MAP_HEIGHT }} />
          )}
        </Card>

        {/* 品牌 TOP10：随选中省份联动 */}
        <Card
          title={`${selectedShort ?? '全国'}门店数 TOP10 品牌`}
          headerRight={selectedFull ? (
            <Button size="sm" variant="ghost" onClick={() => setSelectedFull(null)}>查看全国</Button>
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              按门店主营品牌统计，同一门店经营多品牌分别计数
            </span>
          )}
        >
          {brandRows.length === 0 ? (
            <div style={{ padding: 'var(--space-8) 0', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
              {selectedShort ? `${selectedShort}省暂无合作门店` : '暂无合作门店数据'}
            </div>
          ) : (
            <div className="pso-brand-list">
              {brandRows.map((row, i) => (
                <div key={row.brand} className="pso-brand-row">
                  <span className={`pso-brand-rank${i < 3 ? ' top' : ''}`}>{i + 1}</span>
                  <span className="pso-brand-name">{row.brand}</span>
                  <div className="pso-brand-track">
                    <div className="pso-brand-bar" style={{ width: `${(row.count / maxBrandCount) * 100}%` }} />
                  </div>
                  <span className="pso-brand-count mono">{row.count} 家</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
