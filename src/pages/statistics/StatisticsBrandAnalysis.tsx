import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';
import type {BrandItem} from '../../types';
import { TeaCategory } from '../../types';
import { brandItems } from '../../data/brands';


/* ── 品牌排名数据 ── */
type RankPeriod = 'month' | 'year' | 'oneYear';

const rankData: Record<RankPeriod, {
  salesAmount: { name: string; value: number }[];
  profitTotal: { name: string; value: number }[];
  salesQuantity: { name: string; value: number }[];
}> = {
  month: {
    salesAmount: [
      { name: '大益', value: 286000 },
      { name: '八马', value: 235000 },
      { name: '中茶', value: 198000 },
      { name: '天福茗茶', value: 172000 },
      { name: '正山堂', value: 156000 },
    ],
    profitTotal: [
      { name: '大益', value: 85600 },
      { name: '八马', value: 72800 },
      { name: '正山堂', value: 62400 },
      { name: '中茶', value: 55200 },
      { name: '品品香', value: 48600 },
    ],
    salesQuantity: [
      { name: '八马', value: 1280 },
      { name: '大益', value: 1150 },
      { name: '天福茗茶', value: 980 },
      { name: '中茶', value: 860 },
      { name: '张一元', value: 720 },
    ],
  },
  year: {
    salesAmount: [
      { name: '大益', value: 3280000 },
      { name: '八马', value: 2760000 },
      { name: '中茶', value: 2350000 },
      { name: '天福茗茶', value: 1980000 },
      { name: '西湖牌', value: 1860000 },
    ],
    profitTotal: [
      { name: '大益', value: 985000 },
      { name: '八马', value: 862000 },
      { name: '中茶', value: 728000 },
      { name: '正山堂', value: 656000 },
      { name: '品品香', value: 580000 },
    ],
    salesQuantity: [
      { name: '八马', value: 15200 },
      { name: '大益', value: 13800 },
      { name: '天福茗茶', value: 11600 },
      { name: '中茶', value: 10200 },
      { name: '张一元', value: 8600 },
    ],
  },
  oneYear: {
    salesAmount: [
      { name: '大益', value: 3050000 },
      { name: '八马', value: 2560000 },
      { name: '中茶', value: 2150000 },
      { name: '天福茗茶', value: 1820000 },
      { name: '西湖牌', value: 1720000 },
    ],
    profitTotal: [
      { name: '大益', value: 920000 },
      { name: '八马', value: 798000 },
      { name: '中茶', value: 695000 },
      { name: '正山堂', value: 605000 },
      { name: '品品香', value: 530000 },
    ],
    salesQuantity: [
      { name: '八马', value: 14200 },
      { name: '大益', value: 12900 },
      { name: '天福茗茶', value: 10900 },
      { name: '中茶', value: 9600 },
      { name: '张一元', value: 8100 },
    ],
  },
};

const barColors = ['#CB405D', '#F18F4D', '#0DAFC6', '#27254B', '#5F4027'];

function RankBarChart({ title, data, period, onPeriodChange }: { title: string; data: { name: string; value: number }[]; period: RankPeriod; onPeriodChange: (p: RankPeriod) => void }) {
  const max = Math.max(...data.map((d) => d.value));
  const isQuantity = title.includes('数量');

  function formatValue(v: number) {
    if (isQuantity) return v.toLocaleString();
    if (v >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
    return `¥${v.toLocaleString()}`;
  }

  const periods: { key: RankPeriod; label: string }[] = [
    { key: 'month', label: '当月' },
    { key: 'year', label: '当年' },
    { key: 'oneYear', label: '一年内' },
  ];

  return (
    <Card title={title} className="rank-chart-card" headerRight={
      <div className="rank-period-toggle">
        {periods.map((p) => (
          <button key={p.key} className={`rank-period-btn${period === p.key ? ' active' : ''}`} onClick={() => onPeriodChange(p.key)}>{p.label}</button>
        ))}
      </div>
    }>
      <div className="rank-chart">
        {data.map((item, i) => (
          <div key={item.name} className="rank-chart-row">
            <span className="rank-chart-rank">{i + 1}</span>
            <span className="rank-chart-name">{item.name}</span>
            <div className="rank-chart-bar-wrap">
              <div className="rank-chart-bar" style={{ width: `${(item.value / max) * 100}%`, background: barColors[i] }} />
            </div>
            <span className="rank-chart-value">{formatValue(item.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 品牌销售趋势数据 ── */
const brandTrendData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
  series: [
    { name: '大益', color: '#CB405D', data: [28, 22, 26, 30, 25, 32, 28] },
    { name: '八马', color: '#F18F4D', data: [22, 25, 20, 24, 28, 23, 26] },
    { name: '中茶', color: '#0DAFC6', data: [18, 16, 20, 22, 19, 21, 24] },
    { name: '天福茗茶', color: '#27254B', data: [15, 18, 14, 17, 16, 19, 18] },
  ],
};

/* ── 品牌品类分布数据 ── */
const brandCategoryData = [
  { name: '绿茶', value: 28, color: 'var(--color-tea-green)' },
  { name: '红茶', value: 22, color: 'var(--color-tea-red)' },
  { name: '青茶', value: 18, color: 'var(--color-tea-oolong)' },
  { name: '白茶', value: 14, color: 'var(--color-tea-white)' },
  { name: '黑茶', value: 10, color: 'var(--color-tea-dark)' },
  { name: '黄茶', value: 5, color: 'var(--color-tea-yellow)' },
  { name: '花草茶', value: 3, color: 'var(--color-tea-flower)' },
];

/* ── 品牌增长数据 ── */
const brandGrowthData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
  series: [
    { name: '新增合作品牌', color: 'var(--color-module-current-base)', data: [2, 1, 3, 2, 1, 3, 2] },
    { name: '终止合作品牌', color: '#CB405D', data: [0, 1, 0, 1, 0, 0, 1] },
  ],
};

/** 通过茶类中文名称获取 TeaCategory 枚举 */
function nameToTeaCategory(name: string): TeaCategory | undefined {
  const map: Record<string, TeaCategory> = {
    '绿茶': TeaCategory.GREEN, '红茶': TeaCategory.RED, '青茶': TeaCategory.OOLONG,
    '白茶': TeaCategory.WHITE, '黄茶': TeaCategory.YELLOW, '黑茶': TeaCategory.DARK,
    '花草茶': TeaCategory.FLOWER,
  };
  return map[name];
}

export default function StatisticsBrandAnalysis() {
  const [salesAmountPeriod, setSalesAmountPeriod] = useState<RankPeriod>('month');
  const [profitTotalPeriod, setProfitTotalPeriod] = useState<RankPeriod>('month');
  const [salesQuantityPeriod, setSalesQuantityPeriod] = useState<RankPeriod>('month');

  // 品牌明细表 - 按销售额排序
  const brandDetailRows = useMemo(() => {
    return brandItems
      .map((b, idx) => ({
        ...b,
        salesAmount: Math.floor(Math.random() * 500000 + 50000),
        profitRate: (Math.random() * 20 + 15).toFixed(1),
        growthRate: (Math.random() * 40 - 10).toFixed(1),
      }))
      .sort((a, b) => b.salesAmount - a.salesAmount);
  }, []);

  return (
    <>
      <ContentHeader title="品牌分析" breadcrumbs={['统计', '品牌分析']} actions={<Button variant="ghost">导出报表</Button>} />
      <div className="content-body">
        {/* 概览统计 */}

        {/* 品牌排名 TOP5 */}
        <div className="rank-section">
          <div className="rank-charts-grid">
            <RankBarChart title="销售金额 TOP5" data={rankData[salesAmountPeriod].salesAmount} period={salesAmountPeriod} onPeriodChange={setSalesAmountPeriod} />
            <RankBarChart title="利润总额 TOP5" data={rankData[profitTotalPeriod].profitTotal} period={profitTotalPeriod} onPeriodChange={setProfitTotalPeriod} />
            <RankBarChart title="销售数量 TOP5" data={rankData[salesQuantityPeriod].salesQuantity} period={salesQuantityPeriod} onPeriodChange={setSalesQuantityPeriod} />
          </div>
        </div>

        {/* 品牌销售趋势 + 品牌品类分布 */}
        <div className="grid-2">
          <Card title="品牌销售趋势">
            <LineChart data={brandTrendData} />
          </Card>
          <Card title="品牌品类分布">
            <PieChart data={brandCategoryData} />
          </Card>
        </div>

        {/* 品牌合作趋势 */}
        <Card title="品牌合作趋势" style={{ marginTop: 'var(--space-4)' }}>
          <LineChart data={brandGrowthData} />
        </Card>

        {/* 品牌明细表 */}
        <Card title="品牌明细" style={{ marginTop: 'var(--space-4)' }}>
          <Table
            headers={['排名', '品牌名称', '主营品类', '商品数量', '销售额', '利润率', '增长率', '合作状态']}
            rows={brandDetailRows.slice(0, 15).map((b, idx) => [
              <span className="mono" style={{ fontWeight: idx < 3 ? 'var(--font-semibold)' : 'normal', color: idx < 3 ? 'var(--color-module-current-base)' : 'inherit' }}>{idx + 1}</span>,
              <span style={{ fontWeight: 'var(--font-medium)' }}>{b.name}</span>,
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {b.mainCategories.map((c) => {
                  const cat = nameToTeaCategory(c);
                  return cat ? <Tag key={c} category={cat} /> : <span key={c} className="brand-series-tag">{c}</span>;
                })}
              </div>,
              <span className="mono">{b.productCount}</span>,
              <span className="mono">¥{(b.salesAmount / 10000).toFixed(1)}万</span>,
              <span className="mono">{b.profitRate}%</span>,
              <span style={{ color: Number(b.growthRate) >= 0 ? 'var(--color-success-500)' : 'var(--color-error-500)', fontFamily: 'var(--font-family-mono)' }}>
                {Number(b.growthRate) >= 0 ? '+' : ''}{b.growthRate}%
              </span>,
              <span style={{
                padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                background: 'var(--color-success-50)', color: 'var(--color-success-600)',
              }}>合作中</span>,
            ])}
          />
        </Card>
      </div>
    </>
  );
}
