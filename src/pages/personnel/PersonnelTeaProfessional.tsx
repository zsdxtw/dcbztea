import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import {
  teaProfessionals,
  TEA_PROFESSIONAL_TYPE_LABELS,
  TEA_PROFESSIONAL_TYPE_COLORS,
} from '../../data/teaProfessionals';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';
import type { TeaProfessional, TeaProfessionalType } from '../../types';
import type { StatCardData } from '../../types';

/* ── 茶人类型配置 ── */
const TYPE_INFO: Record<TeaProfessionalType, { label: string; desc: string; color: string; icon: string }> = {
  tea_artist: { label: '茶艺师', desc: '茶艺表演、茶会策划、茶文化传播', color: '#CB405D', icon: '🍵' },
  tea_evaluator: { label: '评茶师', desc: '茶叶品鉴、质量评估、感官审评', color: '#0DAFC6', icon: '🔍' },
  tea_maker: { label: '制茶师', desc: '茶叶制作、工艺传承、品质把控', color: '#F18F4D', icon: '🔥' },
  tea_sommelier: { label: '茶会策划师', desc: '高端茶会、商务茶礼、茶空间设计', color: '#7C6BDB', icon: '🎪' },
};

/* ── 性别标签 ── */
const GENDER_LABELS: Record<string, string> = { male: '男', female: '女' };

/* ── 新增表单初始值 ── */
const emptyForm = {
  name: '',
  gender: '' as 'male' | 'female' | '',
  birthDate: '',
  province: '',
  city: '',
  district: '',
  address: '',
  height: 0,
  weight: 0,
  phone: '',
  email: '',
  idCard: '',
  introduction: '',
  type: [] as TeaProfessionalType[],
  settlement: { accountName: '', accountNo: '', bankName: '', bankNo: '' },
};

export default function PersonnelTeaProfessional() {
  const [activeType, setActiveType] = useState<TeaProfessionalType | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<TeaProfessional | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'add'>('view');
  const [form, setForm] = useState({ ...emptyForm });

  // 筛选
  const filtered = useMemo(() => {
    return teaProfessionals.filter(p => {
      if (activeType !== 'all' && !p.type.includes(activeType)) return false;
      if (keyword && !p.name.includes(keyword) && !p.region.includes(keyword)
        && !(p.province?.includes(keyword) || p.city?.includes(keyword) || p.district?.includes(keyword))) return false;
      return true;
    });
  }, [activeType, keyword]);

  // 统计卡片
  const stats: StatCardData[] = useMemo(() => {
    const countByType = (t: TeaProfessionalType) => teaProfessionals.filter(p => p.type.includes(t));
    return [
      {
        label: '茶艺师', value: String(countByType('tea_artist').length), unit: '人',
        trend: { direction: 'up', value: `在册 ${countByType('tea_artist').filter(p => p.status === 'active').length} 人` },
        icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2c2.5 0 4.5 2 4.5 4.5S11.5 11 9 11 4.5 9 4.5 6.5 6.5 2 9 2z" stroke="currentColor" strokeWidth="1.3"/><path d="M2 16a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      },
      {
        label: '评茶师', value: String(countByType('tea_evaluator').length), unit: '人',
        trend: { direction: 'up', value: `在册 ${countByType('tea_evaluator').filter(p => p.status === 'active').length} 人` },
        icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M9 6v3l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      },
      {
        label: '制茶师', value: String(countByType('tea_maker').length), unit: '人',
        trend: { direction: 'up', value: `在册 ${countByType('tea_maker').filter(p => p.status === 'active').length} 人` },
        icon: <svg viewBox="0 0 18 18" fill="none"><path d="M4 12l2-6h6l2 6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 6V4h6v2" stroke="currentColor" strokeWidth="1.3"/></svg>,
      },
      {
        label: '茶会策划师', value: String(countByType('tea_sommelier').length), unit: '人',
        trend: { direction: 'up', value: `在册 ${countByType('tea_sommelier').filter(p => p.status === 'active').length} 人` },
        icon: <svg viewBox="0 0 18 18" fill="none"><path d="M9 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
      },
    ];
  }, []);

  // 删除相关
  const handleEnterDeleteMode = () => { setDeleteMode(true); setSelectedForDelete(new Set()); };
  const handleCancelDeleteMode = () => { setDeleteMode(false); setSelectedForDelete(new Set()); setShowDeleteConfirm(false); };
  const handleToggleSelect = (id: string) => {
    setSelectedForDelete(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const handleConfirmDelete = () => { handleCancelDeleteMode(); };

  // 查看详情
  const handleView = (person: TeaProfessional) => {
    setSelectedPerson(person);
    setDrawerMode('view');
    setShowDrawer(true);
  };

  // 新增
  const handleAdd = () => {
    setSelectedPerson(null);
    setForm({ ...emptyForm });
    setDrawerMode('add');
    setShowDrawer(true);
  };

  // 保存（保存省市区，并根据城市生成 region，如"杭州市"→"杭州"）
  const handleSave = () => {
    const region = form.city ? form.city.replace(/市$/, '') : '';
    void { ...form, region };
    setShowDrawer(false);
  };

  // 计算年龄
  const calcAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div>
      <ContentHeader title="茶人管理" breadcrumbs={['人员', '茶人管理']} />

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {stats.map((s, i) => (
          <StatCard key={i} data={s} />
        ))}
      </div>

      {/* 茶人类型分类卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {(Object.entries(TYPE_INFO) as [TeaProfessionalType, typeof TYPE_INFO[TeaProfessionalType]][]).map(([key, info]) => {
          const count = teaProfessionals.filter(p => p.type.includes(key)).length;
          const isActive = activeType === key;
          return (
            <div key={key} style={{ cursor: 'pointer', border: isActive ? `2px solid ${info.color}` : '1px solid var(--color-border-primary)', background: isActive ? `${info.color}08` : 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-sm)' }} onClick={() => setActiveType(isActive ? 'all' : key)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: `${info.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {info.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>{info.label}</span>
                    <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: info.color }}>{count}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>{info.desc}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <input
          className="filter-input"
          placeholder="搜索姓名、地区..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          style={{ width: 220 }}
        />
        <Button onClick={handleAdd}>
          <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          新增
        </Button>
        {deleteMode ? (
          <>
            <Button style={{ background: '#C4A830', borderColor: '#C4A830' }} onClick={() => setShowDeleteConfirm(true)} disabled={selectedForDelete.size === 0}>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              删除所选({selectedForDelete.size})
            </Button>
            <Button variant="ghost" onClick={handleCancelDeleteMode}>取消</Button>
          </>
        ) : (
          <Button style={{ background: '#C4A830', borderColor: '#C4A830' }} onClick={handleEnterDeleteMode}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            删除
          </Button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>
          共 {filtered.length} 位茶人
        </span>
      </div>

      {/* 列表 */}
      <Card style={{ padding: 0 }}>
        <Table
          headers={[
            ...(deleteMode ? [<input key="chk" type="checkbox" checked={selectedForDelete.size === filtered.length && filtered.length > 0} onChange={e => {
              if (e.target.checked) setSelectedForDelete(new Set(filtered.map(p => p.id)));
              else setSelectedForDelete(new Set());
            }} />] : []),
            '姓名', '类型', '性别', '地区', '年龄', '证书', '特长', '状态', '操作',
          ]}
          rows={filtered.map(person => [
            ...(deleteMode ? [<input key="chk" type="checkbox" checked={selectedForDelete.has(person.id)} onChange={() => handleToggleSelect(person.id)} />] : []),
            <div key="name" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--color-module-current-lightest)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)',
                flexShrink: 0,
              }}>
                {person.name.charAt(0)}
              </div>
              <span style={{ fontWeight: 'var(--font-medium)' }}>{person.name}</span>
            </div>,
            <div key="type" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {person.type.map(t => (
                <span key={t} style={{
                  padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                  background: `${TEA_PROFESSIONAL_TYPE_COLORS[t]}15`, color: TEA_PROFESSIONAL_TYPE_COLORS[t],
                  border: `1px solid ${TEA_PROFESSIONAL_TYPE_COLORS[t]}30`,
                }}>
                  {TEA_PROFESSIONAL_TYPE_LABELS[t]}
                </span>
              ))}
            </div>,
            GENDER_LABELS[person.gender],
            [person.province, person.city, person.district].filter(Boolean).join(' / ') || person.region,
            `${calcAge(person.birthDate)}岁`,
            <span key="cert" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{person.certificates.length}项</span>,
            <div key="spec" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
              {person.specialties.slice(0, 2).map((s, i) => (
                <span key={i} style={{ padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                  {s}
                </span>
              ))}
              {person.specialties.length > 2 && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>+{person.specialties.length - 2}</span>
              )}
            </div>,
            <span key="status" style={{
              padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
              background: person.status === 'active' ? '#E8F5E9' : '#FFF3E0',
              color: person.status === 'active' ? '#2E7D32' : '#E65100',
            }}>
              {person.status === 'active' ? '在册' : '停用'}
            </span>,
            <Button key="view" size="sm" variant="ghost" onClick={() => handleView(person)}>查看</Button>,
          ])}
        />
      </Card>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="category-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>确认删除</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              确定要删除选中的 {selectedForDelete.size} 位茶人吗？此操作不可撤销。
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>取消</Button>
              <Button style={{ background: '#C4A830', borderColor: '#C4A830' }} onClick={handleConfirmDelete}>确认删除</Button>
            </div>
          </div>
        </div>
      )}

      {/* 详情/新增抽屉 */}
      {showDrawer && drawerMode === 'view' && selectedPerson && (
        <div className="category-dialog-overlay" onClick={() => setShowDrawer(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '90vh', overflow: 'auto' }}>
            {/* 头部 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'var(--color-module-current-lightest)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-module-current-base)',
              }}>
                {selectedPerson.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' }}>{selectedPerson.name}</span>
                  {selectedPerson.type.map(t => (
                    <span key={t} style={{
                      padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                      background: `${TEA_PROFESSIONAL_TYPE_COLORS[t]}15`, color: TEA_PROFESSIONAL_TYPE_COLORS[t],
                      border: `1px solid ${TEA_PROFESSIONAL_TYPE_COLORS[t]}30`,
                    }}>
                      {TEA_PROFESSIONAL_TYPE_LABELS[t]}
                    </span>
                  ))}
                  <span style={{
                    padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                    background: selectedPerson.status === 'active' ? '#E8F5E9' : '#FFF3E0',
                    color: selectedPerson.status === 'active' ? '#2E7D32' : '#E65100',
                  }}>
                    {selectedPerson.status === 'active' ? '在册' : '停用'}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>{selectedPerson.introduction}</div>
              </div>
            </div>

            {/* 基本信息 */}
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-primary)', paddingBottom: 'var(--space-2)' }}>基本信息</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              {[
                ['姓名', selectedPerson.name],
                ['性别', GENDER_LABELS[selectedPerson.gender]],
                ['出生年月', selectedPerson.birthDate],
                ['年龄', `${calcAge(selectedPerson.birthDate)}岁`],
                ['身高', `${selectedPerson.height}cm`],
                ['体重', `${selectedPerson.weight}kg`],
                ['地区', [selectedPerson.province, selectedPerson.city, selectedPerson.district].filter(Boolean).join(' / ') || selectedPerson.region],
                ['手机', selectedPerson.phone],
                ['邮箱', selectedPerson.email],
                ['身份证', selectedPerson.idCard],
                ['地址', selectedPerson.address],
              ].map(([label, value]) => (
                <div key={label} style={{ fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{label}：</span>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* 证书信息 */}
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-primary)', paddingBottom: 'var(--space-2)' }}>证书信息</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              {selectedPerson.certificates.map((cert, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#0DAFC615', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 18 18" fill="none" width="18" height="18"><rect x="3" y="2" width="12" height="14" rx="2" stroke="#0DAFC6" strokeWidth="1.3"/><path d="M6 6h6M6 9h4" stroke="#0DAFC6" strokeWidth="1.0" strokeLinecap="round"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{cert.name}（{cert.level}）</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>发证机构：{cert.issuer} | 日期：{cert.issueDate} | 编号：{cert.certNo}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 特长 */}
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-primary)', paddingBottom: 'var(--space-2)' }}>特长</h4>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
              {selectedPerson.specialties.map((s, i) => (
                <span key={i} style={{
                  padding: '4px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
                  background: 'var(--color-module-current-lightest)', color: 'var(--color-module-current-base)',
                  border: '1px solid var(--color-module-current-base)',
                }}>
                  {s}
                </span>
              ))}
            </div>

            {/* 获奖信息 */}
            {selectedPerson.awards.length > 0 && (
              <>
                <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-primary)', paddingBottom: 'var(--space-2)' }}>获奖信息</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
                  {selectedPerson.awards.map((award, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#F18F4D15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 18 18" fill="none" width="18" height="18"><path d="M9 2l2 3.5h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" stroke="#F18F4D" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{award.name} — {award.level}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>颁奖机构：{award.organization} | 日期：{award.awardDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 服务报价 */}
            {selectedPerson.serviceQuotes.length > 0 && (
              <>
                <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-primary)', paddingBottom: 'var(--space-2)' }}>服务报价</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  {selectedPerson.serviceQuotes.map((quote, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#CB405D15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 18 18" fill="none" width="18" height="18"><path d="M9 3v12M6 7h6M6 11h4" stroke="#CB405D" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{quote.serviceType}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>时长：{quote.duration} | {quote.remark}</div>
                      </div>
                      <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-base)', color: '#CB405D', whiteSpace: 'nowrap' }}>
                        ¥{quote.price.toLocaleString()}<span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-normal)', color: 'var(--color-text-tertiary)' }}>/{quote.unit.replace('元/', '')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 结算信息 */}
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-primary)', paddingBottom: 'var(--space-2)' }}>结算信息</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              {[
                ['户名', selectedPerson.settlement?.accountName],
                ['卡号', selectedPerson.settlement?.accountNo],
                ['开户银行', selectedPerson.settlement?.bankName],
                ['开户行号', selectedPerson.settlement?.bankNo],
              ].map(([label, value]) => (
                <div key={label} style={{ fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{label}：</span>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)', wordBreak: 'break-all' }}>{value || <span style={{ color: 'var(--color-text-tertiary)' }}>-</span>}</span>
                </div>
              ))}
            </div>

            {/* 关闭按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setShowDrawer(false)}>关闭</Button>
            </div>
          </div>
        </div>
      )}

      {/* 新增抽屉 */}
      {showDrawer && drawerMode === 'add' && (
        <div className="category-dialog-overlay" onClick={() => setShowDrawer(false)}>
          <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>新增茶人</h3>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>请填写茶人基本信息，保存后可补充证书、获奖、报价等详细信息。</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
              {[
                { label: '姓名', placeholder: '请输入姓名' },
                { label: '性别', placeholder: '请选择', type: 'select', options: ['男', '女'] },
                { label: '出生年月', placeholder: 'YYYY-MM-DD' },
                { label: '身高(cm)', placeholder: '请输入身高' },
                { label: '体重(kg)', placeholder: '请输入体重' },
                { label: '手机号', placeholder: '请输入手机号' },
                { label: '邮箱', placeholder: '请输入邮箱' },
                { label: '身份证号', placeholder: '请输入身份证号' },
              ].map(field => (
                <div key={field.label}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 4, color: 'var(--color-text-secondary)' }}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select className="filter-select" style={{ width: '100%' }}>
                      <option value="">{field.placeholder}</option>
                      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="filter-input" placeholder={field.placeholder} style={{ width: '100%' }} />
                  )}
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 4, color: 'var(--color-text-secondary)' }}>地区</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                  <select className="filter-select" style={{ width: '100%' }} value={form.province} onChange={e => setForm({ ...form, province: e.target.value, city: '', district: '' })}>
                    <option value="">请选择省份</option>
                    {PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select className="filter-select" style={{ width: '100%' }} value={form.city} onChange={e => setForm({ ...form, city: e.target.value, district: '' })} disabled={!form.province}>
                    <option value="">请选择城市</option>
                    {form.province && getCityNames(form.province).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="filter-select" style={{ width: '100%' }} value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} disabled={!form.city}>
                    <option value="">请选择区县</option>
                    {form.province && form.city && getDistricts(form.province, form.city).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 4, color: 'var(--color-text-secondary)' }}>详细地址</label>
                <input className="filter-input" placeholder="请输入详细地址" style={{ width: '100%' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 4, color: 'var(--color-text-secondary)' }}>茶人类型</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {(Object.entries(TYPE_INFO) as [TeaProfessionalType, typeof TYPE_INFO[TeaProfessionalType]][]).map(([key, info]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 12px', borderRadius: 'var(--radius-md)', border: `1px solid var(--color-border-primary)`, fontSize: 'var(--text-sm)' }}>
                      <input type="checkbox" />
                      <span style={{ color: info.color, fontWeight: 'var(--font-medium)' }}>{info.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 4, color: 'var(--color-text-secondary)' }}>简介</label>
                <textarea className="filter-input" placeholder="请输入茶人简介" style={{ width: '100%', minHeight: 80, resize: 'vertical' }} />
              </div>
              {/* 结算信息 */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 4, color: 'var(--color-text-secondary)' }}>
                  结算信息
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                  <input className="filter-input" placeholder="户名" style={{ width: '100%' }} value={form.settlement.accountName} onChange={e => setForm({ ...form, settlement: { ...form.settlement, accountName: e.target.value } })} />
                  <input className="filter-input" placeholder="卡号" style={{ width: '100%' }} value={form.settlement.accountNo} onChange={e => setForm({ ...form, settlement: { ...form.settlement, accountNo: e.target.value } })} />
                  <input className="filter-input" placeholder="开户银行" style={{ width: '100%' }} value={form.settlement.bankName} onChange={e => setForm({ ...form, settlement: { ...form.settlement, bankName: e.target.value } })} />
                  <input className="filter-input" placeholder="开户行号" style={{ width: '100%' }} value={form.settlement.bankNo} onChange={e => setForm({ ...form, settlement: { ...form.settlement, bankNo: e.target.value } })} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setShowDrawer(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
