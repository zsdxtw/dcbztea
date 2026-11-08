import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';

const financeLineData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
  series: [
    { name: '收入', color: 'var(--color-semantic-success)', data: [185, 205, 268, 290, 310, 325, 328] },
    { name: '支出', color: 'var(--color-semantic-error)', data: [120, 135, 148, 165, 185, 205, 210] },
  ],
};

const expensePieData = [
  { name: '采购成本', value: 45, color: 'var(--color-tea-green)' },
  { name: '物流费用', value: 15, color: 'var(--color-tea-oolong)' },
  { name: '仓储费用', value: 12, color: 'var(--color-tea-dark)' },
  { name: '人员成本', value: 18, color: 'var(--color-tea-red)' },
  { name: '其他费用', value: 10, color: 'var(--color-tea-white)' },
];

export default function StatisticsFinance() {
  return (
    <>
      <ContentHeader title="财务报表" breadcrumbs={['统计', '财务报表']} />
      <div className="content-body">
        <div className="grid-2">
          <Card title="收支趋势">
            <LineChart data={financeLineData} />
          </Card>
          <Card title="支出构成">
            <PieChart data={expensePieData} />
          </Card>
        </div>
      </div>
    </>
  );
}
