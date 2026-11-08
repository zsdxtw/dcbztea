import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import PieChart from '../../components/charts/PieChart';

export default function StatisticsInventory() {
  return (
    <>
      <ContentHeader title="库存分析" breadcrumbs={['统计', '库存分析']} />
      <div className="content-body">
        <Card title="库存分布">
          <PieChart />
        </Card>
      </div>
    </>
  );
}
