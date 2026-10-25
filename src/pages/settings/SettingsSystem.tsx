import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import SettingsSection from '../../components/settings/SettingsSection';
import SettingsRow from '../../components/settings/SettingsRow';
import Toggle from '../../components/common/Toggle';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';

export default function SettingsSystem() {
  const settings = useOrderFlowStore((s) => s.settings);
  const updateSettings = useOrderFlowStore((s) => s.updateSettings);

  return (
    <>
      <ContentHeader title="系统设置" breadcrumbs={['系统', '系统设置']} />
      <div className="content-body">
        <Card>
          <SettingsSection title="基础设置">
            <SettingsRow label="企业名称" description="淡茶半盏茶业有限公司" action={<Button variant="ghost" size="sm">修改</Button>} />
            <SettingsRow label="默认仓库" description="杭州总仓" action={<Button variant="ghost" size="sm">修改</Button>} />
            <SettingsRow label="货币单位" description="人民币 (CNY)" action={<Button variant="ghost" size="sm">修改</Button>} />
          </SettingsSection>
          <SettingsSection title="订单流转设置（订单生成&流转）">
            <SettingsRow
              label="抢单时长"
              description={`发布抢单后合作商可抢的时间窗口（当前 ${settings.grabMinutes} 分钟），超时无人抢自动退回待处理`}
              action={
                <input
                  className="filter-input mono" type="number" min={1} style={{ width: 90 }}
                  value={settings.grabMinutes}
                  onChange={(e) => updateSettings({ grabMinutes: Math.max(1, Number(e.target.value) || 30) })}
                />
              }
            />
            <SettingsRow
              label="比单报名时长"
              description={`发起比单后合作商报名窗口（当前 ${settings.compareMinutes} 分钟）`}
              action={
                <input
                  className="filter-input mono" type="number" min={1} style={{ width: 90 }}
                  value={settings.compareMinutes}
                  onChange={(e) => updateSettings({ compareMinutes: Math.max(1, Number(e.target.value) || 30) })}
                />
              }
            />
            <SettingsRow
              label="比单评分权重"
              description={`报价 ${settings.compareWeights.quote} : 积分 ${settings.compareWeights.score}（综合得分 = 加权平均）`}
              action={
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['quote', 'score'] as const).map((k) => (
                    <input
                      key={k} className="filter-input mono" type="number" min={0} max={10} style={{ width: 72 }}
                      title={k === 'quote' ? '报价权重' : '积分权重'}
                      value={settings.compareWeights[k]}
                      onChange={(e) => updateSettings({ compareWeights: { ...settings.compareWeights, [k]: Math.max(0, Number(e.target.value) || 0) } })}
                    />
                  ))}
                </div>
              }
            />
          </SettingsSection>
          <SettingsSection title="通知设置">
            <SettingsRow label="库存预警通知" description="当库存低于预警线时发送通知" action={<Toggle active />} />
            <SettingsRow label="订单状态变更通知" description="采购/销售订单状态变更时通知" action={<Toggle active />} />
            <SettingsRow label="每日经营日报" description="每日 18:00 发送当日经营概要" action={<Toggle />} />
            <SettingsRow label="财务对账提醒" description="应收/应付到期前 3 天提醒" action={<Toggle active />} />
          </SettingsSection>
          <SettingsSection title="系统信息">
            <SettingsRow label="系统版本" description="v1.0.0" />
            <SettingsRow label="数据库" description="最近备份：2025-07-14 03:00" action={<Button variant="ghost" size="sm">立即备份</Button>} />
          </SettingsSection>
        </Card>
      </div>
    </>
  );
}
