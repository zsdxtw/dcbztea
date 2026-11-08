import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';
import { teaCategoryPieData, teaCategoryLineData } from '../../data/mock';

/** 茶类分析页面 */
export default function StatisticsTeaCategory() {
  const teaCategoryStats = [
    { label: '绿茶', value: '128', unit: '万¥', icon: <svg viewBox="0 0 18 18" fill="none" style={{ color: 'var(--color-tea-green)' }}><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/></svg> },
    { label: '红茶', value: '96', unit: '万¥', icon: <svg viewBox="0 0 18 18" fill="none" style={{ color: 'var(--color-tea-red)' }}><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/></svg> },
    { label: '青茶', value: '85', unit: '万¥', icon: <svg viewBox="0 0 18 18" fill="none" style={{ color: 'var(--color-tea-oolong)' }}><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/></svg> },
    { label: '黑茶', value: '62', unit: '万¥', icon: <svg viewBox="0 0 18 18" fill="none" style={{ color: 'var(--color-tea-dark)' }}><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/></svg> },
    { label: '白茶', value: '45', unit: '万¥', icon: <svg viewBox="0 0 18 18" fill="none" style={{ color: 'var(--color-tea-white)' }}><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/></svg> },
    { label: '黄茶', value: '18', unit: '万¥', icon: <svg viewBox="0 0 18 18" fill="none" style={{ color: 'var(--color-tea-yellow)' }}><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/></svg> },
    { label: '花草茶', value: '32', unit: '万¥', icon: <svg viewBox="0 0 18 18" fill="none" style={{ color: 'var(--color-tea-flower)' }}><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/></svg> },
  ];

  return (
    <>
      <ContentHeader title="茶类分析" breadcrumbs={['统计', '茶类分析']} />
      <div className="content-body">

        <div className="grid-2">
          <Card title="茶类销售占比">
            <PieChart data={teaCategoryPieData} />
          </Card>
          <Card title="茶类季节趋势">
            <LineChart data={teaCategoryLineData} />
            <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 'var(--space-3)', justifyContent: 'center' }}>
              {teaCategoryLineData.series.map((s) => (
                <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                  <span style={{ width: 10, height: 3, background: s.color, borderRadius: 2, display: 'inline-block' }}></span>
                  {s.name}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
