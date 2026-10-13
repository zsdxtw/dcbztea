import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { platformItems } from '../../data/platforms';
import {
  calcPlatformNetPrice,
  type SalesQuotationRule,
} from '../../data/prices';
import { usePriceStore } from '../../stores/priceStore';

/* ── 工具函数 ── */
function formatMoney(n: number): string {
  return `¥${n.toLocaleString('en-US')}`;
}

/** 报价 Tab 类型 */
type QuotationTab = 'direct' | 'platform' | 'channel' | 'personal';

const TAB_CONFIG: { key: QuotationTab; label: string; desc: string }[] = [
  { key: 'direct', label: '直营客户报价', desc: '不经平台客户设唯一报价，经平台客户设报价并自动计算平台实得价' },
  { key: 'platform', label: '平台客户报价', desc: '按平台查看经平台直营客户的报价汇总（平台实得价）' },
  { key: 'channel', label: '渠道客户报价', desc: '为每个渠道客户设置唯一报价' },
  { key: 'personal', label: '个人客户报价', desc: '按客户等级设置最低销售价，下单时不可低于此价' },
];

/** 直营客户报价子 Tab */
type DirectSubTab = 'no_platform' | 'with_platform';

const PRIMARY = '#0F64B5';
const PRIMARY_LIGHT = '#EBF3FC';

export default function SalesPricing() {
  const [activeTab, setActiveTab] = useState<QuotationTab>('direct');
  const [directSubTab, setDirectSubTab] = useState<DirectSubTab>('no_platform');
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('p1');
  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  // 数据接入共享价格数据源：价格管理调价后此处实时可见，调整报价同步写回 store
  const rules = usePriceStore((s) => s.salesQuotations);
  const updateSalesQuotationPrice = usePriceStore((s) => s.updateSalesQuotationPrice);

  /* ── 直营客户报价数据 ── */
  const directNoPlatformRules = useMemo(
    () => rules.filter(r => r.quotationType === 'direct_no_platform'),
    [rules]
  );
  const directWithPlatformRules = useMemo(
    () => rules.filter(r => r.quotationType === 'direct_with_platform'),
    [rules]
  );

  /* ── 平台客户报价数据：按平台分组展示经平台直营客户的报价 ── */
  const platformRules = useMemo(() => {
    if (!selectedPlatformId) return [];
    return rules.filter(r => r.quotationType === 'direct_with_platform' && r.platformId === selectedPlatformId);
  }, [rules, selectedPlatformId]);

  /* ── 渠道客户报价数据 ── */
  const channelRules = useMemo(
    () => rules.filter(r => r.quotationType === 'channel'),
    [rules]
  );

  /* ── 个人客户报价数据 ── */
  const personalRules = useMemo(
    () => rules.filter(r => r.quotationType === 'personal_by_level'),
    [rules]
  );

  /* ── 编辑报价 ── */
  const handleStartEdit = (rule: SalesQuotationRule) => {
    setEditingId(rule.id);
    setEditPrice(String(rule.quotedPrice));
  };

  const handleSaveEdit = (ruleId: string) => {
    const newPrice = Number(editPrice) || 0;
    updateSalesQuotationPrice(ruleId, newPrice);
    setEditingId(null);
    setEditPrice('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
  };

  /* ── 统计卡片数据 ── */
  const stats = useMemo(() => {
    const directCount = directNoPlatformRules.length + directWithPlatformRules.length;
    const platformCount = new Set(directWithPlatformRules.map(r => r.platformId)).size;
    const channelCount = channelRules.length;
    const personalCount = personalRules.length;
    return { directCount, platformCount, channelCount, personalCount };
  }, [directNoPlatformRules, directWithPlatformRules, channelRules, personalRules]);

  return (
    <>
      <ContentHeader title="销售报（调）价" breadcrumbs={['销售', '销售报（调）价']} />
      <div className="content-body">
        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--color-neutral-100)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', width: 'fit-content' }}>
          {TAB_CONFIG.map(t => {
            const isActive = activeTab === t.key;
            const count = t.key === 'direct' ? stats.directCount
              : t.key === 'platform' ? stats.platformCount
              : t.key === 'channel' ? stats.channelCount
              : stats.personalCount;
            return (
              <button key={t.key} onClick={() => { setActiveTab(t.key); setEditingId(null); }}
                style={{
                  padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
                  background: isActive ? 'var(--color-neutral-0)' : 'transparent',
                  fontSize: 'var(--text-sm)', fontWeight: isActive ? 'var(--font-medium)' : 'normal',
                  color: isActive ? PRIMARY : 'var(--color-neutral-500)', cursor: 'pointer',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none', transition: 'var(--transition-fast)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {t.label}
                <span style={{ fontSize: 'var(--text-xs)', background: isActive ? PRIMARY_LIGHT : 'var(--color-neutral-200)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* 当前 Tab 描述 */}
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
          {TAB_CONFIG.find(t => t.key === activeTab)?.desc}
        </div>

        {/* ══════ 直营客户报价 ══════ */}
        {activeTab === 'direct' && (
          <Card style={{ padding: 'var(--space-5)' }}>
            {/* 子 Tab：不经平台 / 经平台 */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <button onClick={() => setDirectSubTab('no_platform')}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
                  border: directSubTab === 'no_platform' ? `2px solid ${PRIMARY}` : '1px solid var(--color-neutral-200)',
                  background: directSubTab === 'no_platform' ? `${PRIMARY}08` : 'var(--color-neutral-0)',
                  color: directSubTab === 'no_platform' ? PRIMARY : 'var(--color-neutral-600)',
                  fontWeight: directSubTab === 'no_platform' ? 'var(--font-medium)' : 'normal',
                }}>
                不经平台直营客户（{directNoPlatformRules.length}）
              </button>
              <button onClick={() => setDirectSubTab('with_platform')}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
                  border: directSubTab === 'with_platform' ? `2px solid ${PRIMARY}` : '1px solid var(--color-neutral-200)',
                  background: directSubTab === 'with_platform' ? `${PRIMARY}08` : 'var(--color-neutral-0)',
                  color: directSubTab === 'with_platform' ? PRIMARY : 'var(--color-neutral-600)',
                  fontWeight: directSubTab === 'with_platform' ? 'var(--font-medium)' : 'normal',
                }}>
                经平台直营客户（{directWithPlatformRules.length}）
              </button>
            </div>

            {directSubTab === 'no_platform' ? (
              /* 不经平台直营客户报价表 */
              <Table
                headers={['序号', '商品名称', '品牌', '客户名称', '市场价', '销售价', '报价', '折扣率', '有效期', '状态', '操作']}
                rows={directNoPlatformRules.map((r, idx) => [
                  <span className="cell-muted">{idx + 1}</span>,
                  <span className="cell-emph">{r.productName}</span>,
                  <span>{r.brand}</span>,
                  <span className="cell-emph">{r.customerName}</span>,
                  <span className="mono">{formatMoney(r.marketPrice)}</span>,
                  <span className="mono">{formatMoney(r.salesPrice)}</span>,
                  editingId === r.id ? (
                    <input type="number" className="filter-input" style={{ width: 90, height: 30, borderColor: PRIMARY, fontWeight: 'var(--font-semibold)', color: PRIMARY }}
                      value={editPrice} onChange={e => setEditPrice(e.target.value)} autoFocus />
                  ) : (
                    <span className="mono cell-emph" style={{ color: PRIMARY }}>{formatMoney(r.quotedPrice)}</span>
                  ),
                  <span className="mono">{Math.round((r.quotedPrice / r.marketPrice) * 100)}%</span>,
                  <span className="cell-muted">{r.validFrom} ~ {r.validTo}</span>,
                  <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: '#E8F5E9', color: '#2E7D32' }}>生效中</span>,
                  <div className="row-actions">
                    {editingId === r.id ? (
                      <>
                        <Button size="sm" onClick={() => handleSaveEdit(r.id)}>保存</Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>取消</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => handleStartEdit(r)}>调价</Button>
                    )}
                  </div>,
                ])}
              />
            ) : (
              /* 经平台直营客户报价表 */
              <div>
                <div style={{ padding: 'var(--space-3) var(--space-4)', background: PRIMARY_LIGHT, borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: PRIMARY }}>
                  <strong>经平台报价逻辑：</strong>给直营客户的报价 × (1 - 平台扣点) = 平台实得价（即给该平台的报价），平台实得价自动关联到对应平台客户报价中。
                </div>
                <Table
                  headers={['序号', '商品名称', '客户名称', '所属平台', '扣点', '市场价', '给客户报价', '平台实得价', '折扣率', '操作']}
                  rows={directWithPlatformRules.map((r, idx) => [
                    <span className="cell-muted">{idx + 1}</span>,
                    <span className="cell-emph">{r.productName}</span>,
                    <span className="cell-emph">{r.customerName}</span>,
                    <span>{r.platformName}</span>,
                    <span style={{ fontSize: 'var(--text-xs)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: '#FFF3E0', color: '#E65100', fontWeight: 'var(--font-medium)' }}>{r.platformCommissionRate}</span>,
                    <span className="mono">{formatMoney(r.marketPrice)}</span>,
                    editingId === r.id ? (
                      <input type="number" className="filter-input" style={{ width: 90, height: 30, borderColor: PRIMARY, fontWeight: 'var(--font-semibold)', color: PRIMARY }}
                        value={editPrice} onChange={e => setEditPrice(e.target.value)} autoFocus />
                    ) : (
                      <span className="mono cell-emph" style={{ color: PRIMARY }}>{formatMoney(r.quotedPrice)}</span>
                    ),
                    <span className="mono" style={{ color: '#CB405D', fontWeight: 'var(--font-semibold)' }}>
                      {formatMoney(editingId === r.id ? calcPlatformNetPrice(Number(editPrice) || 0, r.platformCommissionRate || '0') : (r.platformNetPrice || 0))}
                    </span>,
                    <span className="mono">{Math.round((r.quotedPrice / r.marketPrice) * 100)}%</span>,
                    <div className="row-actions">
                      {editingId === r.id ? (
                        <>
                          <Button size="sm" onClick={() => handleSaveEdit(r.id)}>保存</Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>取消</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleStartEdit(r)}>调价</Button>
                      )}
                    </div>,
                  ])}
                />
              </div>
            )}
          </Card>
        )}

        {/* ══════ 平台客户报价 ══════ */}
        {activeTab === 'platform' && (
          <Card style={{ padding: 'var(--space-5)' }}>
            {/* 平台选择器 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)' }}>选择平台：</label>
              <select className="filter-select" style={{ width: 200 }} value={selectedPlatformId} onChange={e => setSelectedPlatformId(e.target.value)}>
                {platformItems.map(p => (
                  <option key={p.id} value={p.id}>{p.shortName}</option>
                ))}
              </select>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>
                共 {platformRules.length} 条报价（来自经该平台的直营客户）
              </span>
            </div>

            <div style={{ padding: 'var(--space-3) var(--space-4)', background: '#FFF8E1', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: '#795548' }}>
              <strong>平台报价来源：</strong>此处展示的所有报价均为经该平台的直营客户报价经扣点折算后的「平台实得价」，由直营客户报价自动联动生成，不可直接编辑。如需调整，请到「直营客户报价 → 经平台直营客户」中调价。
            </div>

            <Table
              headers={['序号', '商品名称', '直营客户', '给客户报价', '扣点', '平台实得价', '折扣率', '备注']}
              rows={platformRules.map((r, idx) => [
                <span className="cell-muted">{idx + 1}</span>,
                <span className="cell-emph">{r.productName}</span>,
                <span className="cell-emph">{r.customerName}</span>,
                <span className="mono">{formatMoney(r.quotedPrice)}</span>,
                <span style={{ fontSize: 'var(--text-xs)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: '#FFF3E0', color: '#E65100', fontWeight: 'var(--font-medium)' }}>{r.platformCommissionRate}</span>,
                <span className="mono cell-emph" style={{ color: '#CB405D', fontWeight: 'var(--font-bold)' }}>{formatMoney(r.platformNetPrice || 0)}</span>,
                <span className="mono">{Math.round((r.quotedPrice / r.marketPrice) * 100)}%</span>,
                <span className="cell-muted">{r.remark}</span>,
              ])}
            />
          </Card>
        )}

        {/* ══════ 渠道客户报价 ══════ */}
        {activeTab === 'channel' && (
          <Card style={{ padding: 'var(--space-5)' }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: '#E8F5E9', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: '#2E7D32' }}>
              <strong>渠道客户报价：</strong>每个渠道客户设置唯一报价，支持随时调价。渠道客户为二次销售客户，报价通常低于直营客户。
            </div>
            <Table
              headers={['序号', '商品名称', '品牌', '渠道客户', '市场价', '销售价', '报价', '折扣率', '有效期', '操作']}
              rows={channelRules.map((r, idx) => [
                <span className="cell-muted">{idx + 1}</span>,
                <span className="cell-emph">{r.productName}</span>,
                <span>{r.brand}</span>,
                <span className="cell-emph">{r.customerName}</span>,
                <span className="mono">{formatMoney(r.marketPrice)}</span>,
                <span className="mono">{formatMoney(r.salesPrice)}</span>,
                editingId === r.id ? (
                  <input type="number" className="filter-input" style={{ width: 90, height: 30, borderColor: PRIMARY, fontWeight: 'var(--font-semibold)', color: PRIMARY }}
                    value={editPrice} onChange={e => setEditPrice(e.target.value)} autoFocus />
                ) : (
                  <span className="mono cell-emph" style={{ color: PRIMARY }}>{formatMoney(r.quotedPrice)}</span>
                ),
                <span className="mono">{Math.round((r.quotedPrice / r.marketPrice) * 100)}%</span>,
                <span className="cell-muted">{r.validFrom} ~ {r.validTo}</span>,
                <div className="row-actions">
                  {editingId === r.id ? (
                    <>
                      <Button size="sm" onClick={() => handleSaveEdit(r.id)}>保存</Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>取消</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => handleStartEdit(r)}>调价</Button>
                  )}
                </div>,
              ])}
            />
          </Card>
        )}

        {/* ══════ 个人客户报价 ══════ */}
        {activeTab === 'personal' && (
          <Card style={{ padding: 'var(--space-5)' }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: '#F3E5F5', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: '#7B1FA2' }}>
              <strong>个人客户最低销售价：</strong>按客户等级（S/A/B/C）分别设置每个商品的最低销售价。销售下单选择个人客户时，可调整的销售实价<strong>不得低于</strong>此价格。
            </div>
            <Table
              headers={['序号', '商品名称', '品牌', '客户等级', '市场价', '销售价', '最低销售价', '折扣率', '有效期', '操作']}
              rows={personalRules.map((r, idx) => [
                <span className="cell-muted">{idx + 1}</span>,
                <span className="cell-emph">{r.productName}</span>,
                <span>{r.brand}</span>,
                <span style={{
                  fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 'var(--font-medium)',
                  background: r.personalLevel === 'S级' ? '#FEF2F4' : r.personalLevel === 'A级' ? '#EBF3FC' : r.personalLevel === 'B级' ? '#EBF3FC' : 'var(--color-neutral-100)',
                  color: r.personalLevel === 'S级' ? '#CB405D' : r.personalLevel === 'A级' ? '#0F64B5' : r.personalLevel === 'B级' ? '#0F64B5' : 'var(--color-neutral-500)',
                }}>{r.personalLevel}</span>,
                <span className="mono">{formatMoney(r.marketPrice)}</span>,
                <span className="mono">{formatMoney(r.salesPrice)}</span>,
                editingId === r.id ? (
                  <input type="number" className="filter-input" style={{ width: 90, height: 30, borderColor: '#7B1FA2', fontWeight: 'var(--font-semibold)', color: '#7B1FA2' }}
                    value={editPrice} onChange={e => setEditPrice(e.target.value)} autoFocus />
                ) : (
                  <span className="mono cell-emph" style={{ color: '#7B1FA2', fontWeight: 'var(--font-bold)' }}>{formatMoney(r.quotedPrice)}</span>
                ),
                <span className="mono">{Math.round((r.quotedPrice / r.marketPrice) * 100)}%</span>,
                <span className="cell-muted">{r.validFrom} ~ {r.validTo}</span>,
                <div className="row-actions">
                  {editingId === r.id ? (
                    <>
                      <Button size="sm" onClick={() => handleSaveEdit(r.id)}>保存</Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>取消</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => handleStartEdit(r)}>调价</Button>
                  )}
                </div>,
              ])}
            />
          </Card>
        )}
      </div>
    </>
  );
}
