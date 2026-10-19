import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import type { BrandItem } from '../../types';
import { TeaCategory } from '../../types';
import { getTeaCategoryLabel } from '../../data/teaCategories';
import { teaCategoryData, teawareCategoryData, teaPeripheralCategoryData, otherCategoryData } from '../../data/productCategories';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';

/** 通过茶类中文名称获取 TeaCategory 枚举 */
function nameToTeaCategory(name: string): TeaCategory | undefined {
  const map: Record<string, TeaCategory> = {
    '绿茶': TeaCategory.GREEN, '红茶': TeaCategory.RED, '青茶': TeaCategory.OOLONG,
    '白茶': TeaCategory.WHITE, '黄茶': TeaCategory.YELLOW, '黑茶': TeaCategory.DARK,
    '花草茶': TeaCategory.FLOWER,
  };
  return map[name];
}

/** 一级分类选项 */
const LEVEL1_OPTIONS = [
  { label: '茶叶', data: teaCategoryData },
  { label: '茶具', data: teawareCategoryData },
  { label: '茶周边', data: teaPeripheralCategoryData },
  { label: '其他', data: otherCategoryData },
];

const brandItems: BrandItem[] = [
  {
    id: '1', code: '001', name: '西湖牌', logo: '', owner: '杭州西湖茶叶有限公司',
    introduction: '始创于1949年，西湖龙井茶核心产区标杆品牌，传承传统炒制技艺', requirements: '需提供原产地证明，品质符合GB/T 18650标准', policy: '年度返利3%，季度结算', series: ['明前龙井', '雨前龙井', '龙井红茶'],
    trademarkCert: ['西湖龙井地理标志.pdf'], jdStoreUrl: 'https://xihupai.jd.com', tmallStoreUrl: 'https://xihupai.tmall.com',
    contactPerson: '王明华', contactPhone: '0571-8765****', province: '浙江', city: '杭州市', district: '西湖区', address: '龙井路88号',
    mainCategories: ['绿茶'], productCount: 8, supplierCount: 3,
    website: 'https://www.xihupai.com', cooperationDate: '2023-03-15',
  },
  {
    id: '2', code: '002', name: '八马', logo: '', owner: '八马茶业股份有限公司',
    introduction: '中国茶业领军品牌，铁观音十三代传人，全国连锁门店超3000家', requirements: '需具备八马品牌授权书，门店面积不低于80㎡', policy: '首批进货额≥50万，年度返利5%', series: ['赛珍珠铁观音', '浓香铁观音', '陈皮普洱'],
    trademarkCert: ['八马商标注册证.pdf'], jdStoreUrl: 'https://bama.jd.com', tmallStoreUrl: 'https://bama.tmall.com',
    contactPerson: '林文杰', contactPhone: '0595-2345****', province: '福建', city: '泉州市', district: '安溪县', address: '八马茶业大厦',
    mainCategories: ['青茶'], productCount: 12, supplierCount: 4,
    website: 'https://www.bama.com', cooperationDate: '2022-08-01',
  },
  {
    id: '3', code: '003', name: '张一元', logo: '', owner: '北京张一元茶叶有限责任公司',
    introduction: '百年老字号，始创于1900年，茉莉花茶制作技艺入选国家级非遗', requirements: '需通过品牌商资质审核，具备冷链仓储条件', policy: '年度返利4%，季度结算，提供品牌宣传支持', series: ['茉莉龙毫', '茉莉毛尖', '茉莉云雾'],
    trademarkCert: ['张一元商标注册证.pdf'], jdStoreUrl: 'https://zhangyiyuan.jd.com', tmallStoreUrl: 'https://zhangyiyuan.tmall.com',
    contactPerson: '赵国强', contactPhone: '010-6303****', province: '北京', city: '北京市', district: '西城区', address: '大栅栏街22号',
    mainCategories: ['绿茶', '花草茶'], productCount: 6, supplierCount: 2,
    website: 'https://www.zhangyiyuan.com', cooperationDate: '2023-01-10',
  },
  {
    id: '6', code: '006', name: '大益', logo: '', owner: '云南大益茶业集团有限公司',
    introduction: '普洱茶行业标杆，勐海茶厂传承，7542被誉为评判普洱茶的标准', requirements: '需具备普洱茶专业仓储，温湿度可调控', policy: '首批进货额≥80万，年度返利6%，提供品鉴培训', series: ['7542生茶', '7572熟茶', '金针白莲'],
    trademarkCert: ['大益商标注册证.pdf'], jdStoreUrl: 'https://dayi.jd.com', tmallStoreUrl: 'https://dayi.tmall.com',
    contactPerson: '吴远之', contactPhone: '0691-512****', province: '云南', city: '西双版纳州', district: '勐海县', address: '勐海茶厂',
    mainCategories: ['黑茶'], productCount: 10, supplierCount: 3,
    website: 'https://www.dayi.com', cooperationDate: '2022-05-18',
  },
];

/** 详情行组件 */
function DetailRow({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={`detail-row${span ? ' detail-row-span' : ''}`}>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children}</div>
    </div>
  );
}

/** 关联商品模拟数据 */
const associatedProducts = [
  { id: 'p1', name: '西湖龙井·明前特级', category: '绿茶', series: '明前系列', price: 680, salesCount: 3256 },
  { id: 'p2', name: '西湖龙井·雨前一级', category: '绿茶', series: '雨前系列', price: 320, salesCount: 2840 },
  { id: 'p3', name: '龙井茶礼盒装', category: '绿茶', series: '礼盒系列', price: 1280, salesCount: 1560 },
  { id: 'p4', name: '西湖龙井·罐装', category: '绿茶', series: '日常系列', price: 198, salesCount: 1230 },
  { id: 'p5', name: '龙井茶·袋泡装', category: '绿茶', series: '便捷系列', price: 88, salesCount: 980 },
];

/** 关联供应商模拟数据 */
const associatedSuppliers = [
  { id: 's1', name: '杭州西湖茶源供应链', contactPerson: '王建国', contactPhone: '0571-8765xxxx', cooperationType: '独家', purchaseCount: 5680 },
  { id: 's2', name: '浙江茶都茶叶有限公司', contactPerson: '李明辉', contactPhone: '0571-8543xxxx', cooperationType: '普通', purchaseCount: 3420 },
  { id: 's3', name: '西湖区龙井茶合作社', contactPerson: '陈志远', contactPhone: '0571-8321xxxx', cooperationType: '普通', purchaseCount: 1860 },
];

/** 编辑行组件 */
function EditRow({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={`detail-row${span ? ' detail-row-span' : ''}`}>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children}</div>
    </div>
  );
}

export default function ProductBrandDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [editing, setEditing] = useState(false);
  const [seriesList, setSeriesList] = useState<string[]>([]);
  const [newSeries, setNewSeries] = useState('');
  const [showSeriesInput, setShowSeriesInput] = useState(false);
  const [editProvince, setEditProvince] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editDistrict, setEditDistrict] = useState('');

  const brand = brandItems.find((b) => b.id === id);

  // Initialize series list when brand is found
  if (brand && seriesList.length === 0 && !showSeriesInput) {
    setSeriesList(brand.series);
  }

  const handleAddSeries = () => {
    if (newSeries.trim()) {
      setSeriesList([...seriesList, newSeries.trim()]);
      setNewSeries('');
      setShowSeriesInput(false);
    }
  };

  const handleRemoveSeries = (index: number) => {
    setSeriesList(seriesList.filter((_, i) => i !== index));
  };

  const handleEnterEdit = () => {
    setEditProvince(brand?.province || '');
    setEditCity(brand?.city || '');
    setEditDistrict(brand?.district || '');
    setEditing(true);
  };

  if (!brand) {
    return (
      <>
        <ContentHeader title="品牌详情" breadcrumbs={['商品', '品牌管理', '品牌详情']} />
        <div className="content-body">
          <Card>
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-neutral-400)' }}>
              未找到该品牌信息
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <ContentHeader
        title={brand.name}
        breadcrumbs={['商品', '品牌管理', brand.name]}
        actions={
          editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>取消</Button>
              <Button onClick={() => setEditing(false)}>保存</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/product/product-brand')}>返回列表</Button>
              <Button onClick={handleEnterEdit}>编辑品牌</Button>
            </>
          )
        }
      />
      <div className="content-body">
        {/* 品牌头部信息 */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <div className="brand-detail-header">
            <div className="brand-detail-logo" style={{ position: 'relative', width: 75, height: 75, flexShrink: 0 }}>
              {brand.logo ? <img src={brand.logo} alt={brand.name} style={{ width: 75, height: 75, borderRadius: 'var(--radius-lg)' }} /> : <div className="brand-logo-placeholder brand-logo-lg" style={{ width: 75, height: 75 }}>{brand.name[0]}</div>}
              {editing && (
                <label style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', color: 'white', fontSize: 'var(--text-xs)', flexDirection: 'column', gap: '2px' }}>
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 16, height: 16 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  更换LOGO
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <div className="brand-detail-header-info">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontFamily: 'var(--font-family-serif)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)' }}>{brand.name}</span>
                <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', alignItems: 'baseline' }}>
                  {editing ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'var(--color-neutral-500)', flexShrink: 0 }}>官网</span>
                        <input className="detail-input" defaultValue={brand.website} placeholder="https://" style={{ fontSize: 'var(--text-xs)', width: 140 }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'var(--color-neutral-500)', flexShrink: 0 }}>京东店</span>
                        <input className="detail-input" defaultValue={brand.jdStoreUrl} placeholder="https://" style={{ fontSize: 'var(--text-xs)', width: 140 }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'var(--color-neutral-500)', flexShrink: 0 }}>天猫店</span>
                        <input className="detail-input" defaultValue={brand.tmallStoreUrl} placeholder="https://" style={{ fontSize: 'var(--text-xs)', width: 140 }} />
                      </div>
                    </>
                  ) : (
                    <>
                      {brand.website && <a href={brand.website} target="_blank" rel="noreferrer" style={{ color: 'var(--color-module-current-base)' }}>官网</a>}
                      {brand.jdStoreUrl && <a href={brand.jdStoreUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-module-current-base)' }}>京东店</a>}
                      {brand.tmallStoreUrl && <a href={brand.tmallStoreUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-module-current-base)' }}>天猫店</a>}
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>
                <span><span className="mono">{brand.code}</span> · {brand.owner}</span>
                <span style={{ color: 'var(--color-neutral-400)' }}>|</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {brand.mainCategories.map((c) => {
                    const cat = nameToTeaCategory(c);
                    return cat ? <Tag key={c} category={cat} /> : <span key={c} className="brand-series-tag">{c}</span>;
                  })}
                </div>
              </div>
              {editing ? (
                <textarea className="detail-textarea" defaultValue={brand.introduction} rows={2} style={{ fontSize: 'var(--text-sm)' }} />
              ) : (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', lineHeight: 'var(--leading-md)' }}>{brand.introduction}</div>
              )}
              {/* 统计数字 */}
              <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-neutral-200)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>商品数量</span>
                  <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: '#eb5c20' }}>{associatedProducts.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>供应商数量</span>
                  <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: '#eb5c20' }}>{associatedSuppliers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid-2">
          {/* 基本信息 */}
          <Card title="基本信息">
            {editing ? (
              <div className="detail-grid">
                <EditRow label="品牌编号"><input className="detail-input" defaultValue={brand.code} readOnly style={{ background: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' }} /></EditRow>
                <EditRow label="品牌名称"><input className="detail-input" defaultValue={brand.name} /></EditRow>
                <EditRow label="品牌所属"><input className="detail-input" defaultValue={brand.owner} /></EditRow>
                <EditRow label="主营品类">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {LEVEL1_OPTIONS.map((opt) => {
                      const level2Names = opt.data.children?.map((c) => c.name) ?? [];
                      return (
                        <div key={opt.label} style={{ width: '100%', marginBottom: 'var(--space-1)' }}>
                          <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', marginBottom: '4px', color: 'var(--color-neutral-700)' }}>{opt.label}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                            {level2Names.map((cat) => (
                              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                                <input type="checkbox" defaultChecked={brand.mainCategories.includes(cat)} />
                                {cat}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </EditRow>
                <EditRow label="商标证书" span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {brand.trademarkCert.map((file, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <svg viewBox="0 0 16 16" fill="none" style={{ width: 16, height: 16, color: 'var(--color-semantic-info)', flexShrink: 0 }}><rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 5h4M6 7.5h4M6 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                        <span className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{file}</span>
                        <Button variant="ghost" size="sm" style={{ color: '#eb5c20' }}>删除</Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm">+ 上传文件</Button>
                  </div>
                </EditRow>
                <EditRow label="联系人"><input className="detail-input" defaultValue={brand.contactPerson} /></EditRow>
                <EditRow label="联系电话"><input className="detail-input" defaultValue={brand.contactPhone} /></EditRow>
                <EditRow label="省份">
                  <select className="detail-select" value={editProvince} onChange={(e) => { setEditProvince(e.target.value); setEditCity(''); setEditDistrict(''); }}>
                    <option value="">请选择省份</option>
                    {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </EditRow>
                <EditRow label="城市">
                  <select className="detail-select" value={editCity} onChange={(e) => { setEditCity(e.target.value); setEditDistrict(''); }} disabled={!editProvince}>
                    <option value="">请选择城市</option>
                    {editProvince && getCityNames(editProvince).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </EditRow>
                <EditRow label="区县">
                  <select className="detail-select" value={editDistrict} onChange={(e) => setEditDistrict(e.target.value)} disabled={!editCity}>
                    <option value="">请选择区县</option>
                    {editProvince && editCity && getDistricts(editProvince, editCity).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </EditRow>
                <EditRow label="详细地址" span><input className="detail-input" defaultValue={brand.address} /></EditRow>
              </div>
            ) : (
              <div className="detail-grid">
                <DetailRow label="品牌编号"><span className="mono">{brand.code}</span></DetailRow>
                <DetailRow label="品牌名称"><span style={{ fontWeight: 'var(--font-medium)' }}>{brand.name}</span></DetailRow>
                <DetailRow label="品牌所属">{brand.owner}</DetailRow>
                <DetailRow label="主营品类">{brand.mainCategories.join(' | ')}</DetailRow>
                <DetailRow label="商标证书" span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {brand.trademarkCert.map((file, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <svg viewBox="0 0 16 16" fill="none" style={{ width: 16, height: 16, color: 'var(--color-semantic-info)', flexShrink: 0 }}><rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 5h4M6 7.5h4M6 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                        <span className="mono" style={{ fontSize: 'var(--text-sm)' }}>{file}</span>
                        <Button variant="ghost" size="sm">下载</Button>
                      </div>
                    ))}
                  </div>
                </DetailRow>
                <DetailRow label="联系人"><span style={{ fontWeight: 'var(--font-medium)' }}>{brand.contactPerson}</span></DetailRow>
                <DetailRow label="联系电话"><span className="mono">{brand.contactPhone}</span></DetailRow>
                <DetailRow label="地址" span>{[brand.province, brand.city, brand.district].filter(Boolean).join('/')}{brand.address ? ` ${brand.address}` : ''}</DetailRow>
              </div>
            )}
          </Card>

          {/* 品牌政策与要求 */}
          <Card title="品牌政策与要求">
            {editing ? (
              <div className="detail-grid">
                <EditRow label="品牌要求" span><textarea className="detail-textarea" defaultValue={brand.requirements} rows={3} /></EditRow>
                <EditRow label="品牌政策" span><textarea className="detail-textarea" defaultValue={brand.policy} rows={3} /></EditRow>
                <EditRow label="品牌系列" span>
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      {seriesList.map((s, i) => (
                        <span key={i} className="brand-series-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {s}
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-400)', fontSize: 'var(--text-xs)', padding: 0, lineHeight: 1 }} onClick={() => handleRemoveSeries(i)}>✕</button>
                        </span>
                      ))}
                    </div>
                    {showSeriesInput ? (
                      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                        <input className="detail-input" value={newSeries} onChange={(e) => setNewSeries(e.target.value)} placeholder="输入系列名称" style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') handleAddSeries(); }} />
                        <Button variant="ghost" size="sm" onClick={() => { setShowSeriesInput(false); setNewSeries(''); }} style={{ color: 'var(--color-neutral-400)' }}>取消</Button>
                        <Button size="sm" onClick={handleAddSeries}>确认</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setShowSeriesInput(true)}>+ 添加系列</Button>
                    )}
                  </div>
                </EditRow>
              </div>
            ) : (
              <div className="detail-grid">
                <DetailRow label="品牌要求" span>{brand.requirements || <span style={{ color: 'var(--color-neutral-400)' }}>未填写</span>}</DetailRow>
                <DetailRow label="品牌政策" span>{brand.policy || <span style={{ color: 'var(--color-neutral-400)' }}>未填写</span>}</DetailRow>
                <DetailRow label="品牌系列" span>
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      {seriesList.map((s, i) => (
                        <span key={i} className="brand-series-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {s}
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-400)', fontSize: 'var(--text-xs)', padding: 0, lineHeight: 1 }} onClick={() => handleRemoveSeries(i)}>✕</button>
                        </span>
                      ))}
                    </div>
                    {showSeriesInput ? (
                      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                        <input className="detail-input" value={newSeries} onChange={(e) => setNewSeries(e.target.value)} placeholder="输入系列名称" style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') handleAddSeries(); }} />
                        <Button variant="ghost" size="sm" onClick={() => { setShowSeriesInput(false); setNewSeries(''); }} style={{ color: 'var(--color-neutral-400)' }}>取消</Button>
                        <Button size="sm" onClick={handleAddSeries}>确认</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setShowSeriesInput(true)}>+ 添加系列</Button>
                    )}
                  </div>
                </DetailRow>
              </div>
            )}
          </Card>

          {/* 热销商品TOP5 */}
          <Card title="热销商品TOP5">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {associatedProducts.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 'var(--radius-full)', background: i < 3 ? ['#CB405D', '#F18F4D', '#0DAFC6'][i] : 'var(--color-neutral-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', color: '#fff', fontWeight: 'var(--font-semibold)', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', marginBottom: '2px' }}>{p.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{p.category} · {p.series}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{p.salesCount.toLocaleString()} 件</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>¥{p.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 常采供应商TOP5 */}
          <Card title="常采供应商TOP5">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {associatedSuppliers.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 'var(--radius-full)', background: i < 3 ? ['#CB405D', '#F18F4D', '#0DAFC6'][i] : 'var(--color-neutral-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', color: '#fff', fontWeight: 'var(--font-semibold)', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'var(--color-module-product-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', color: '#fff', fontWeight: 'var(--font-semibold)', flexShrink: 0 }}>
                    {s.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', marginBottom: '2px' }}>{s.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{s.contactPerson} · {s.contactPhone}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>采购 {s.purchaseCount.toLocaleString()} 件</div>
                    <span className="brand-series-tag" style={{ background: s.cooperationType === '独家' ? 'var(--color-semantic-error-light)' : 'var(--color-semantic-info-light)', color: s.cooperationType === '独家' ? 'var(--color-semantic-error)' : 'var(--color-semantic-info)', fontSize: 'var(--text-xs)' }}>{s.cooperationType}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
