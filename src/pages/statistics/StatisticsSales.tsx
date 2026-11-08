import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';
import Button from '../../components/common/Button';
import { statisticsStats } from '../../data/mock';

export default function StatisticsSales() {
  return (
    <>
      <ContentHeader title="销售分析" breadcrumbs={['统计', '销售分析']} actions={<Button variant="ghost">导出报表</Button>} />
      <div className="content-body">
        <div className="grid-2">
          <Card title="六大茶类销售趋势">
            <LineChart />
          </Card>
          <Card title="六大茶类销售占比">
            <PieChart />
          </Card>
        </div>
      </div>
    </>
  );
}
