import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';
import Button from '../../components/common/Button';

const purchaseLineData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
  series: [
    { name: '采购额', color: 'var(--color-tea-green)', data: [120, 135, 148, 165, 185, 205, 210] },
    { name: '采购量', color: 'var(--color-tea-oolong)', data: [80, 92, 105, 115, 130, 145, 148] },
  ],
};

const purchasePieData = [
  { name: '绿茶', value: 28, color: 'var(--color-tea-green)' },
  { name: '红茶', value: 22, color: 'var(--color-tea-red)' },
  { name: '青茶', value: 20, color: 'var(--color-tea-oolong)' },
  { name: '白茶', value: 15, color: 'var(--color-tea-white)' },
  { name: '黑茶', value: 10, color: 'var(--color-tea-dark)' },
  { name: '黄茶', value: 5, color: 'var(--color-tea-yellow)' },
];

export default function StatisticsPurchase() {
  return (
    <>
      <ContentHeader title="采购分析" breadcrumbs={['统计', '采购分析']} actions={<Button variant="ghost">导出报表</Button>} />
      <div className="content-body">
        <div className="grid-2">
          <Card title="采购趋势">
            <LineChart data={purchaseLineData} />
          </Card>
          <Card title="茶类采购占比">
            <PieChart data={purchasePieData} />
          </Card>
        </div>
      </div>
    </>
  );
}
