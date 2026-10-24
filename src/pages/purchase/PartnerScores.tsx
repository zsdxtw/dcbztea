import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { useSupplierStore } from '../../stores/supplierStore';
import { useScoreStore, getScoreSummary } from '../../stores/scoreStore';
import { SCORE_DIMENSION_LABELS, SCORE_RULES } from '../../data/partnerScores';
import type { ScoreDimension } from '../../types';

const DIMENSIONS: ScoreDimension[] = ['visit', 'report', 'fulfillment', 'penalty'];

const dimColor = (d: ScoreDimension) => {
  switch (d) {
    case 'visit': return '#0F64B5';
    case 'report': return '#7B1FA2';
    case 'fulfillment': return '#01795D';
    case 'penalty': return '#C62828';
  }
};

/** 采购 · 合作商积分：四维积分台账与汇总（比单评分的数据源） */
export default function PartnerScores() {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const entries = useScoreStore((s) => s.entries);
  const store = useScoreStore;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  /** 手动调分弹窗 */
  const [adjusting, setAdjusting] = useState(false);
  const [dimension, setDimension] = useState<ScoreDimension>('penalty');
  const [delta, setDelta] = useState('-10');
  const [reason, setReason] = useState('');
  const [adjustError, setAdjustError] = useState('');

  const scored = useMemo(
    () =>
      suppliers
        .filter((s) => s.status === 'active' || entries.some((e) => e.supplierId === s.id))
        .map((s) => getScoreSummary(entries, s.id, s.name))
        .sort((a, b) => b.total - a.total),
    [suppliers, entries],
  );

  const filtered = useMemo(
    () => scored.filter((s) => !keyword || s.supplierName.includes(keyword)),
    [scored, keyword],
  );

  const current = selectedId ? scored.find((s) => s.supplierId === selectedId) ?? null : null;
  const currentEntries = useMemo(
    () => (selectedId ? entries.filter((e) => e.supplierId === selectedId) : []),
    [entries, selectedId],
  );

  const confirmAdjust = () => {
    const d = Number(delta);
    if (!current) return;
    if (!Number.isFinite(d) || d === 0) {
      setAdjustError('分值必须为非 0 数字（正数加分 / 负数扣分）');
      return;
    }
    if (!reason.trim()) {
      setAdjustError('请填写调分原因');
      return;
    }
    store.getState().addEntry({
      supplierId: current.supplierId,
      supplierName: current.supplierName,
      dimension,
      delta: d,
      reason: reason.trim(),
      operator: '管理员',
    });
    setAdjusting(false);
    setReason('');
    setAdjustError('');
  };

  return (
    <>
      <ContentHeader title="合作商积分" breadcrumbs={['采购', '合作商管理', '合作商积分']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          积分 = <strong>客户拜访 + 报备情况 + 履约情况 + 处罚情况</strong> 四维台账汇总（期初分 + 流水累加），是<strong>比单评分（40%）</strong>的数据源。
          拜访记录由合作商终端提交，报备 / 履约加减分随审批与结算自动写入，处罚在本页手动登记。
        </div>

        {/* 积分规则 */}
        <Card style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>积分规则</div>
          <Table
            headers={['维度', '加分', '减分', '挂钩动作']}
            rows={SCORE_RULES.map((r) => [
              <span key="d" style={{ fontWeight: 'var(--font-medium)' }}>{r.dimension}</span>,
              <span key="a" style={{ fontSize: 'var(--text-sm)', color: '#01795D' }}>{r.add}</span>,
              <span key="s" style={{ fontSize: 'var(--text-sm)', color: '#C62828' }}>{r.sub}</span>,
              <span key="h" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{r.hook}</span>,
            ])}
          />
        </Card>

        {/* 积分榜 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="搜索合作商名称..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 家合作商</span>
        </div>
        <Card style={{ padding: 0 }}>
          <Table
            headers={['排名', '合作商', '总分', '客户拜访', '报备情况', '履约情况', '处罚情况', '履约率', '操作']}
            rows={filtered.map((s, i) => [
              <span key="r" className="mono" style={{ fontWeight: 'var(--font-semibold)' }}>#{i + 1}</span>,
              <span key="n" className="cell-emph">{s.supplierName}</span>,
              <span key="t" className="mono" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)', fontSize: 'var(--text-md)' }}>{s.total}</span>,
              <span key="v" className="mono" style={{ color: dimColor('visit') }}>{s.visit > 0 ? `+${s.visit}` : s.visit}</span>,
              <span key="re" className="mono" style={{ color: dimColor('report') }}>{s.report > 0 ? `+${s.report}` : s.report}</span>,
              <span key="f" className="mono" style={{ color: dimColor('fulfillment') }}>{s.fulfillment > 0 ? `+${s.fulfillment}` : s.fulfillment}</span>,
              <span key="p" className="mono" style={{ color: s.penalty < 0 ? '#C62828' : 'var(--color-neutral-400)' }}>{s.penalty}</span>,
              <span key="o" className="mono">{s.ontimeRate}%</span>,
              <div key="act" className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => { setSelectedId(s.supplierId); setAdjusting(false); }}>台账</Button>
              </div>,
            ])}
          />
        </Card>
      </div>

      {/* 台账抽屉 */}
      <DetailDrawer
        open={!!current}
        onClose={() => setSelectedId(null)}
        badge="JF"
        title={current?.supplierName ?? ''}
        subtitle={current ? `积分总分 ${current.total} · 履约率 ${current.ontimeRate}%` : ''}
        hideFooter
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedId(null)}>关闭</Button>
            {current && <Button onClick={() => { setAdjusting(true); setAdjustError(''); }}>手动调分 / 处罚登记</Button>}
          </>
        }
      >
        {current && (
          <>
            <DrawerSection title="四维汇总">
              <InfoGrid>
                <InfoItem label="期初分（快照）">{current.total - current.visit - current.report - current.fulfillment - current.penalty}</InfoItem>
                <InfoItem label="客户拜访" mono valueStyle={{ color: dimColor('visit') }}>+{current.visit}</InfoItem>
                <InfoItem label="报备情况" mono valueStyle={{ color: dimColor('report') }}>+{current.report}</InfoItem>
                <InfoItem label="履约情况" mono valueStyle={{ color: dimColor('fulfillment') }}>{current.fulfillment}</InfoItem>
                <InfoItem label="处罚情况" mono valueStyle={{ color: '#C62828' }}>{current.penalty}</InfoItem>
                <InfoItem label="总分" mono emph>{current.total}</InfoItem>
              </InfoGrid>
            </DrawerSection>

            <DrawerSection title={`台账流水（${currentEntries.length} 条）`}>
              <table className="detail-inline-table">
                <thead><tr><th>时间</th><th>维度</th><th>分值</th><th>原因</th><th>关联单号</th></tr></thead>
                <tbody>
                  {currentEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="mono">{e.time}</td>
                      <td>{SCORE_DIMENSION_LABELS[e.dimension]}</td>
                      <td className="mono" style={{ color: e.delta > 0 ? '#01795D' : '#C62828', fontWeight: 'var(--font-semibold)' }}>{e.delta > 0 ? `+${e.delta}` : e.delta}</td>
                      <td>{e.reason}</td>
                      <td className="mono">{e.refCode ?? '—'}</td>
                    </tr>
                  ))}
                  {currentEntries.length === 0 && (
                    <tr><td colSpan={5} style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 'var(--space-4)' }}>暂无流水</td></tr>
                  )}
                </tbody>
              </table>
            </DrawerSection>

            {/* 手动调分 */}
            {adjusting && (
              <DrawerSection title="手动调分 / 处罚登记">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>维度</label>
                    <select className="filter-input" value={dimension} onChange={(e) => setDimension(e.target.value as ScoreDimension)} style={{ width: '100%' }}>
                      {DIMENSIONS.map((d) => <option key={d} value={d}>{SCORE_DIMENSION_LABELS[d]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>分值（负数=扣分）</label>
                    <input className="filter-input mono" value={delta} onChange={(e) => { setDelta(e.target.value); setAdjustError(''); }} style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>原因 *</label>
                  <input className="filter-input" placeholder="如：客户投诉发货破损" value={reason} onChange={(e) => { setReason(e.target.value); setAdjustError(''); }} style={{ width: '100%' }} />
                </div>
                {adjustError && <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{adjustError}</div>}
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Button variant="ghost" onClick={() => setAdjusting(false)}>取消</Button>
                  <Button onClick={confirmAdjust}>确认入账</Button>
                </div>
              </DrawerSection>
            )}
          </>
        )}
      </DetailDrawer>
    </>
  );
}
