import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import type { StatCardData, CustomerItem, CustomerType, PlatformItem, PlatformBankAccount, PlatformInvoiceInfo, CustomerBankAccount, CustomerInvoiceInfo, OrderContact, CustomerSubOrganization, ProfitShareConfig, PersonRoleType } from '../../types';
import { customerItems as initialCustomers, CUSTOMER_TYPE_LABELS, CUSTOMER_TYPE_DESC, LEVEL_COLORS, CUSTOMER_GROUP_MAP, generateOrderContactId, convertPersonalToDirect } from '../../data/customers';
import { platformItems as globalPlatforms } from '../../data/platforms';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';
import { generateCustomerCode } from '../../utils/customerCode';
import { useDrawerWidth } from '../../hooks/useDrawerWidth';
import { getAllPersonOptions, getPersonName as getPersonNameFromOrg, PERSON_TYPE_LABELS } from '../../data/organization';
import { streamers } from '../../data/streamers';
import DeptEmployeeSelect from '../../components/business/DeptEmployeeSelect';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';

const PRIMARY = '#0F64B5';
const PRIMARY_LIGHT = '#EBF3FC';
const SECONDARY = '#CB405D';
const SECONDARY_LIGHT = '#FEF2F4';

/** 4 个客户类型并列展示配置；前 3 个属于企业客户板块，第 4 个为个人客户 */
const CUSTOMER_TYPE_CARDS: { key: CustomerType; label: string; desc: string; group: 'enterprise' | 'personal'; icon: React.ReactNode }[] = [
  { key: 'direct', label: '直营客户', desc: CUSTOMER_TYPE_DESC.direct, group: 'enterprise', icon: <svg viewBox="0 0 18 18" fill="none"><path d="M3 8.5L9 3.5l6 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" /><path d="M4.5 8v7h9v-7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg> },
  { key: 'channel', label: '渠道客户', desc: CUSTOMER_TYPE_DESC.channel, group: 'enterprise', icon: <svg viewBox="0 0 18 18" fill="none"><path d="M2 10l3 2 3-4 3 5 3-3 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="4" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.3" /></svg> },
  { key: 'platform', label: '平台客户', desc: CUSTOMER_TYPE_DESC.platform, group: 'enterprise', icon: <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M6 5V3.5A1.5 1.5 0 017.5 2h3A1.5 1.5 0 0112 3.5V5" stroke="currentColor" strokeWidth="1.3" /><path d="M9 8v2M8 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg> },
  { key: 'personal', label: '个人客户', desc: '个人消费者，可转换为直营客户', group: 'personal', icon: <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" /><path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg> },
];

/** 企业客户板块色系 */
const ENTERPRISE_COLOR = '#0F64B5';
const ENTERPRISE_COLOR_LIGHT = '#EBF3FC';
/** 个人客户板块色系 */
const PERSONAL_COLOR = '#7B1FA2';
const PERSONAL_COLOR_LIGHT = '#F3E5F5';

export default function SalesCustomers() {
  const [activeTab, setActiveTab] = useState<CustomerType>('direct');
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<CustomerItem[]>(initialCustomers);
  const [platforms, setPlatforms] = useState<PlatformItem[]>(globalPlatforms);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<CustomerItem | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showPendingMaintain, setShowPendingMaintain] = useState(false);
  const [showOrderContactDrawer, setShowOrderContactDrawer] = useState(false);
  const [currentCustomerForContacts, setCurrentCustomerForContacts] = useState<CustomerItem | null>(null);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [customerToConvert, setCustomerToConvert] = useState<CustomerItem | null>(null);
  const drawerWidth = useDrawerWidth();

  const [detailPlatform, setDetailPlatform] = useState<PlatformItem | null>(null);
  const [showPlatformDetail, setShowPlatformDetail] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(false);
  const [editPlatformForm, setEditPlatformForm] = useState<PlatformItem | null>(null);
  const [showAddPlatformDrawer, setShowAddPlatformDrawer] = useState(false);

  const [showSubOrgDrawer, setShowSubOrgDrawer] = useState(false);
  const [editingSubOrg, setEditingSubOrg] = useState<CustomerSubOrganization | null>(null);
  const [subOrgForm, setSubOrgForm] = useState<Partial<CustomerSubOrganization> | null>(null);

  const tabCustomers = useMemo(() => {
    if (activeTab === 'platform') {
      return [];
    }
    return data.filter(c => c.type === activeTab);
  }, [data, activeTab]);

  const filtered = useMemo(() => {
    let result = tabCustomers;
    if (showPendingMaintain) {
      result = result.filter(c =>
        !c.contactPerson || !c.contactPhone || !c.contactAddress ||
        (c.type !== 'personal' && (c.bankAccounts ?? []).length === 0) ||
        !c.province || !c.city
      );
    }
    if (!keyword) return result;
    return result.filter(c => c.name.includes(keyword) || c.contactPerson.includes(keyword) || c.region.includes(keyword) || c.contactPhone.includes(keyword) || (c.shortName ?? '').includes(keyword) || (c.customerCode ?? '').includes(keyword));
  }, [tabCustomers, keyword, showPendingMaintain]);

  const getPlatformName = (id: string) => platforms.find(p => p.id === id)?.shortName ?? id;

  const getPersonDisplay = (personId?: string, personType?: PersonRoleType, personName?: string) => {
    if (!personId) return '—';
    const name = personName || getPersonNameFromOrg(personId, personType);
    const typeLabel = personType ? PERSON_TYPE_LABELS[personType] : '';
    return typeLabel ? `${name}（${typeLabel}）` : name;
  };

  const stats: StatCardData[] = useMemo(() => {
    const direct = data.filter(c => c.type === 'direct');
    const channel = data.filter(c => c.type === 'channel');
    const personal = data.filter(c => c.type === 'personal');
    const enterpriseActive = data.filter(c => CUSTOMER_GROUP_MAP[c.type] === 'enterprise' && c.status === 'active').length;
    const platformActive = platforms.filter(p => p.status === 'active').length;
    return [
      { label: '客户总数', value: String(data.length + platforms.length), unit: '家', trend: { direction: 'up', value: `合作中 ${enterpriseActive + platformActive}` }, icon: <IconUsers /> },
      { label: '直营客户', value: String(direct.length), unit: '家', trend: { direction: 'up', value: `合作中 ${direct.filter(c => c.status === 'active').length}` }, icon: <IconHome /> },
      { label: '渠道客户', value: String(channel.length), unit: '家', trend: { direction: 'up', value: `合作中 ${channel.filter(c => c.status === 'active').length}` }, icon: <IconChannel /> },
      { label: '个人客户', value: String(personal.length), unit: '家', trend: { direction: 'up', value: `合作中 ${personal.filter(c => c.status === 'active').length}` }, icon: <IconPersonal /> },
    ];
  }, [data, platforms]);

  const enterDeleteMode = () => { setDeleteMode(true); setSelectedForDelete(new Set()); };
  const exitDeleteMode = () => { setDeleteMode(false); setSelectedForDelete(new Set()); };
  const toggleSelect = (id: string) => setSelectedForDelete(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const confirmDelete = () => {
    if (activeTab === 'platform') {
      setPlatforms(prev => prev.filter(p => !selectedForDelete.has(p.id)));
    } else {
      setData(prev => prev.filter(c => !selectedForDelete.has(c.id)));
    }
    setShowDeleteConfirm(false);
    exitDeleteMode();
  };

  const levelTag = (level: string) => {
    const c = LEVEL_COLORS[level] || LEVEL_COLORS['C级'];
    return <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}>{level}</span>;
  };

  const statusTag = (status: 'active' | 'inactive', type?: 'platform') => (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: status === 'active' ? '#E8F5E9' : '#FFF3E0', color: status === 'active' ? '#2E7D32' : '#E65100' }}>
      {status === 'active' ? (type === 'platform' ? '在册' : '合作中') : (type === 'platform' ? '停用' : '已暂停')}
    </span>
  );

  const platformTags = (platformIds: string[], commissionRates?: Record<string, string>) => {
    if (platformIds.length === 0) return <span style={{ color: 'var(--color-neutral-300)' }}>-</span>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {platformIds.slice(0, 2).map(id => (
          <span key={id} style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: `${SECONDARY}15`, color: SECONDARY, border: `1px solid ${SECONDARY}30` }}>
            {getPlatformName(id)}{commissionRates?.[id] ? <span style={{ marginLeft: 4, color: 'var(--color-neutral-500)', fontWeight: 'normal' }}>扣{commissionRates[id]}</span> : null}
          </span>
        ))}
        {platformIds.length > 2 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>+{platformIds.length - 2}</span>}
      </div>
    );
  };

  const viaPlatformTag = (viaPlatform: boolean) => (
    <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: viaPlatform ? `${SECONDARY}15` : `${PRIMARY}15`, color: viaPlatform ? SECONDARY : PRIMARY, border: `1px solid ${viaPlatform ? `${SECONDARY}30` : `${PRIMARY}30`}` }}>
      {viaPlatform ? '经平台' : '无平台'}
    </span>
  );

  const quickAddPlatform = (shortName: string): string => {
    const id = `p_${Date.now()}`;
    const sequence = platforms.length + 1;
    const newPlatform: PlatformItem = {
      id, name: shortName, shortName, code: generateCustomerCode('platform', shortName, sequence),
      contactPerson: '', contactPosition: '', contactPhone: '', contactAddress: '',
      province: '', city: '', district: '',
      cooperationDate: new Date().toISOString().slice(0, 10),
      bankAccounts: [], invoiceInfos: [], status: 'active',
    };
    setPlatforms(prev => [...prev, newPlatform]);
    return id;
  };

  const filteredPlatforms = useMemo(() => {
    if (!keyword) return platforms;
    return platforms.filter(p => p.name.includes(keyword) || p.shortName.includes(keyword) || p.code.includes(keyword) || p.contactPerson.includes(keyword));
  }, [platforms, keyword]);

  const handleViewPlatform = (p: PlatformItem) => { setDetailPlatform(p); setEditingPlatform(false); setEditPlatformForm(null); setShowPlatformDetail(true); };
  const handleStartEditPlatform = () => { if (detailPlatform) { setEditPlatformForm({ ...detailPlatform, bankAccounts: detailPlatform.bankAccounts.map(b => ({ ...b })), invoiceInfos: detailPlatform.invoiceInfos.map(i => ({ ...i })) }); setEditingPlatform(true); } };
  const handleCancelEditPlatform = () => { setEditingPlatform(false); setEditPlatformForm(null); };
  const handleSaveEditPlatform = () => { if (editPlatformForm) { setPlatforms(prev => prev.map(p => p.id === editPlatformForm.id ? editPlatformForm : p)); setDetailPlatform(editPlatformForm); setEditingPlatform(false); setEditPlatformForm(null); } };
  const togglePlatformSelect = (id: string) => setSelectedForDelete(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openAddSubOrg = () => {
    setEditingSubOrg(null);
    setSubOrgForm({
      id: `sub-${Date.now()}`,
      name: '',
      contactPerson: '',
      contactPhone: '',
      province: '',
      city: '',
      district: '',
      address: '',
    });
    setShowSubOrgDrawer(true);
  };

  const openEditSubOrg = (subOrg: CustomerSubOrganization) => {
    setEditingSubOrg(subOrg);
    setSubOrgForm({ ...subOrg });
    setShowSubOrgDrawer(true);
  };

  const closeSubOrgDrawer = () => {
    setShowSubOrgDrawer(false);
    setEditingSubOrg(null);
    setSubOrgForm(null);
  };

  const handleSaveSubOrg = () => {
    if (!subOrgForm || !detailCustomer) return;
    const updatedSubOrgs = editingSubOrg
      ? (detailCustomer.subOrganizations || []).map(s => s.id === editingSubOrg.id ? { ...s, ...subOrgForm } as CustomerSubOrganization : s)
      : [...(detailCustomer.subOrganizations || []), { ...subOrgForm } as CustomerSubOrganization];
    const updatedCustomer = { ...detailCustomer, subOrganizations: updatedSubOrgs };
    setData(prev => prev.map(c => c.id === detailCustomer.id ? updatedCustomer : c));
    setDetailCustomer(updatedCustomer);
    closeSubOrgDrawer();
  };

  const handleDeleteSubOrg = (subOrgId: string) => {
    if (!detailCustomer) return;
    const updatedSubOrgs = (detailCustomer.subOrganizations || []).filter(s => s.id !== subOrgId);
    const updatedCustomer = { ...detailCustomer, subOrganizations: updatedSubOrgs };
    setData(prev => prev.map(c => c.id === detailCustomer.id ? updatedCustomer : c));
    setDetailCustomer(updatedCustomer);
  };

  const handleViewCustomer = (c: CustomerItem) => {
    setDetailCustomer(c);
  };

  const handleOpenOrderContacts = (c: CustomerItem) => {
    if (c.type === 'direct') {
      setCurrentCustomerForContacts(c);
      setShowOrderContactDrawer(true);
    }
  };

  const handleConvertPersonal = (c: CustomerItem) => {
    if (c.type === 'personal') {
      setCustomerToConvert(c);
      setShowConvertConfirm(true);
    }
  };

  const confirmConvert = () => {
    if (!customerToConvert) return;
    const converted = convertPersonalToDirect(customerToConvert);
    setData(prev => prev.filter(c => c.id !== customerToConvert.id).concat(converted));
    setShowConvertConfirm(false);
    setCustomerToConvert(null);
    setActiveTab('direct');
  };

  const handleSaveOrderContact = (customerId: string, contact: OrderContact) => {
    setData(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      const contacts = c.orderContacts || [];
      const existingIdx = contacts.findIndex(co => co.id === contact.id);
      if (existingIdx >= 0) {
        return { ...c, orderContacts: contacts.map((co, i) => i === existingIdx ? contact : co) };
      } else {
        return { ...c, orderContacts: [...contacts, contact] };
      }
    }));
    if (currentCustomerForContacts?.id === customerId) {
      setCurrentCustomerForContacts(prev => {
        if (!prev) return prev;
        const contacts = prev.orderContacts || [];
        const existingIdx = contacts.findIndex(co => co.id === contact.id);
        if (existingIdx >= 0) {
          return { ...prev, orderContacts: contacts.map((co, i) => i === existingIdx ? contact : co) };
        } else {
          return { ...prev, orderContacts: [...contacts, contact] };
        }
      });
    }
  };

  const handleDeleteOrderContact = (customerId: string, contactId: string) => {
    setData(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      return { ...c, orderContacts: (c.orderContacts || []).filter(co => co.id !== contactId) };
    }));
    if (currentCustomerForContacts?.id === customerId) {
      setCurrentCustomerForContacts(prev => {
        if (!prev) return prev;
        return { ...prev, orderContacts: (prev.orderContacts || []).filter(co => co.id !== contactId) };
      });
    }
  };

  const handleToggleViaPlatform = (customerId: string, viaPlatform: boolean) => {
    setData(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      return { ...c, viaPlatform };
    }));
    if (detailCustomer?.id === customerId) {
      setDetailCustomer(prev => prev ? { ...prev, viaPlatform } : prev);
    }
  };

  return (
    <>
      <ContentHeader title="客户管理" breadcrumbs={['销售', '客户管理']} />

      <div className="content-body">
        {/* 4 个客户类型卡片并列展示，前 3 个属于企业客户板块，第 4 个为个人客户 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {CUSTOMER_TYPE_CARDS.map((t, idx) => {
            const count = t.key === 'platform' ? platforms.length : data.filter(c => c.type === t.key).length;
            const isActive = activeTab === t.key;
            const isEnterprise = t.group === 'enterprise';
            const groupColor = isEnterprise ? ENTERPRISE_COLOR : PERSONAL_COLOR;
            const groupColorLight = isEnterprise ? ENTERPRISE_COLOR_LIGHT : PERSONAL_COLOR_LIGHT;
            // 前 3 个企业卡片之间间距更小，与个人客户卡片之间有稍大间距
            const isLastEnterprise = idx === 2;
            return (
              <div key={t.key} onClick={() => { setActiveTab(t.key); setKeyword(''); }} style={{ cursor: 'pointer', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', position: 'relative', border: isActive ? `2px solid ${groupColor}` : `1px solid var(--color-neutral-200)`, background: isActive ? `${groupColor}08` : 'var(--color-neutral-0)', boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)', transition: 'var(--transition-fast)', marginRight: isLastEnterprise ? 'var(--space-3)' : 0 }}>
                {/* 右上角分组徽章：企业/个人 */}
                <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 'var(--font-medium)', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: isEnterprise ? `${ENTERPRISE_COLOR}12` : `${PERSONAL_COLOR}12`, color: isEnterprise ? ENTERPRISE_COLOR : PERSONAL_COLOR, border: `1px solid ${isEnterprise ? `${ENTERPRISE_COLOR}30` : `${PERSONAL_COLOR}30`}` }}>
                  {isEnterprise ? '企业' : '个人'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 6 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', background: isActive ? groupColorLight : 'var(--color-neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? groupColor : 'var(--color-neutral-500)', transition: 'var(--transition-fast)' }}>{t.icon}</span>
                  <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-800)' }}>{t.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: isActive ? groupColor : 'var(--color-neutral-600)' }}>{count}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>家</span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', lineHeight: 1.4, height: 28, overflow: 'hidden' }}>
                  {t.desc}
                </div>
              </div>
            );
          })}
        </div>

        {activeTab === 'platform' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <input className="filter-input" placeholder="搜索平台名称、编码、联系人..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 280 }} />
              <Button onClick={() => setShowAddPlatformDrawer(true)}>
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                新增
              </Button>
              {deleteMode ? (
                <>
                  <Button style={{ background: SECONDARY, borderColor: SECONDARY }} onClick={() => setShowDeleteConfirm(true)} disabled={selectedForDelete.size === 0}>
                    <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    删除所选({selectedForDelete.size})
                  </Button>
                  <Button variant="ghost" onClick={exitDeleteMode}>取消</Button>
                </>
              ) : (
                <Button style={{ background: SECONDARY, borderColor: SECONDARY }} onClick={enterDeleteMode}>
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  删除
                </Button>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>共 {filteredPlatforms.length} 个平台</span>
            </div>

            <Card style={{ padding: 0 }}>
              <Table
                headers={[...(deleteMode ? ['选择'] : ['序号']), '客户简称', '平台编号', '客户名称', '拓客人', '联系人', '联系人职务', '联系电话', '保证金', '结算账户', '发票主体', '状态', '操作']}
                rows={filteredPlatforms.map((p, idx) => [
                  deleteMode ? <input key="chk" type="checkbox" checked={selectedForDelete.has(p.id)} onChange={() => togglePlatformSelect(p.id)} /> : <span key="idx" className="mono">{idx + 1}</span>,
                  <span key="sn" className="cell-emph">{p.shortName}</span>,
                  <span key="code" className="mono" style={{ color: 'var(--color-neutral-600)' }}>{p.code}</span>,
                  <span key="name">{p.name}</span>,
                  <span key="liaison">{p.developerId ? getPersonDisplay(p.developerId, p.developerType, p.developerName) : '—'}</span>,
                  <span key="cp">{p.contactPerson}</span>,
                  <span key="cpo" style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-xs)' }}>{p.contactPosition || '—'}</span>,
                  <span key="cph" className="mono" style={{ color: 'var(--color-neutral-600)' }}>{p.contactPhone}</span>,
                  <span key="dp" className="mono" style={{ color: SECONDARY, fontWeight: 'var(--font-medium)' }}>{typeof p.deposit === 'number' ? `¥${p.deposit.toLocaleString('en-US')}` : '—'}</span>,
                  <span key="ba" className="mono">{p.bankAccounts.length}个</span>,
                  <span key="ii">{p.invoiceInfos.length > 0 ? p.invoiceInfos[0].invoiceEntity : '—'}</span>,
                  <span key="st">{statusTag(p.status, 'platform')}</span>,
                  <div className="row-actions" key="act">
                    <Button size="sm" variant="ghost" onClick={() => handleViewPlatform(p)}>查看</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleViewPlatform(p)}>编辑</Button>
                  </div>,
                ])}
              />
            </Card>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <input className="filter-input" placeholder={`搜索${CUSTOMER_TYPE_LABELS[activeTab]}客户名称、简称、编号、联系人、地区...`} value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 280 }} />
              <Button variant={showPendingMaintain ? 'primary' : 'ghost'} onClick={() => setShowPendingMaintain(!showPendingMaintain)}>
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 2v6M8 14v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/></svg>
                待维护
              </Button>
              <Button onClick={() => setShowAddDrawer(true)}>
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                新增
              </Button>
              {deleteMode ? (
                <>
                  <Button style={{ background: SECONDARY, borderColor: SECONDARY }} onClick={() => setShowDeleteConfirm(true)} disabled={selectedForDelete.size === 0}>
                    <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    删除所选({selectedForDelete.size})
                  </Button>
                  <Button variant="ghost" onClick={exitDeleteMode}>取消</Button>
                </>
              ) : (
                <Button style={{ background: SECONDARY, borderColor: SECONDARY }} onClick={enterDeleteMode}>
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  删除
                </Button>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>共 {filtered.length} 个客户</span>
            </div>

            <Card style={{ padding: 0 }}>
              <Table
                headers={[...(deleteMode ? ['选择'] : ['序号']), '客户简称', '客户编号', '客户名称', ...(activeTab === 'direct' ? ['是否经平台'] : []), ...(activeTab === 'personal' ? ['下单人'] : []), '拓客人', '维护人', '跟单人', '地区', '联系人', '联系电话', '客户来源', '等级', '订单数', '累计金额', '状态', '操作']}
                rows={filtered.map((c, idx) => {
                  const cells: React.ReactNode[] = [
                    deleteMode ? <input key="chk" type="checkbox" checked={selectedForDelete.has(c.id)} onChange={() => toggleSelect(c.id)} /> : <span key="idx" className="mono">{idx + 1}</span>,
                    <span key="sn" className="cell-emph">{c.shortName || c.name}</span>,
                    <span key="cc" className="mono" style={{ color: 'var(--color-neutral-600)' }}>{c.customerCode || '—'}</span>,
                    <span key="name">{c.name}</span>,
                  ];
                  if (activeTab === 'direct') {
                    cells.push(<span key="via">{viaPlatformTag(c.viaPlatform ?? false)}</span>);
                  }
                  if (activeTab === 'personal') {
                    cells.push(<span key="oc" className="mono">{c.orderContacts?.length || 0}</span>);
                  }
                  cells.push(
                    <span key="developer" style={{ fontSize: 'var(--text-sm)' }}>{getPersonDisplay(c.developerId, c.developerType, c.developerName)}</span>,
                    <span key="maintainer" style={{ fontSize: 'var(--text-sm)' }}>{getPersonDisplay(c.maintainerId, c.maintainerType, c.maintainerName)}</span>,
                    <span key="follower" style={{ fontSize: 'var(--text-sm)' }}>{getPersonDisplay(c.followerId, c.followerType, c.followerName)}</span>,
                    <span key="region" style={{ fontSize: 'var(--text-sm)' }}>{[c.province, c.city, c.district].filter(Boolean).join(' / ') || c.region}</span>,
                    <span key="cp">{c.contactPerson}</span>,
                    <span key="cph" className="mono" style={{ color: 'var(--color-neutral-600)' }}>{c.contactPhone}</span>,
                    <span key="src" style={{ fontSize: 'var(--text-xs)', color: c.source ? 'var(--color-neutral-700)' : 'var(--color-neutral-300)' }}>{c.source || '—'}</span>,
                    <span key="lv">{levelTag(c.level)}</span>,
                    <span key="ord" className="mono">{c.orders}</span>,
                    <span key="amt" className="mono" style={{ fontWeight: 'var(--font-medium)', color: SECONDARY }}>¥{(c.totalAmount / 10000).toFixed(1)}万</span>,
                    <span key="st">{statusTag(c.status)}</span>,
                    <div className="row-actions" key="act">
                      <Button size="sm" variant="ghost" onClick={() => handleViewCustomer(c)}>查看</Button>
                      {activeTab === 'direct' && (
                        <Button size="sm" variant="ghost" onClick={() => handleOpenOrderContacts(c)}>下单人</Button>
                      )}
                      {activeTab === 'personal' && (
                        <Button size="sm" variant="ghost" onClick={() => handleConvertPersonal(c)}>转直营</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleViewCustomer(c)}>编辑</Button>
                    </div>,
                  );
                  return cells;
                })}
              />
            </Card>
          </>
        )}

        {showDeleteConfirm && (
          <div className="category-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>确认删除</h3>
              <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>确定要删除选中的 {selectedForDelete.size} 个{activeTab === 'platform' ? '平台' : '客户'}吗？</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>取消</Button>
                <Button style={{ background: SECONDARY, borderColor: SECONDARY }} onClick={confirmDelete}>确认删除</Button>
              </div>
            </div>
          </div>
        )}

        {showConvertConfirm && customerToConvert && (
          <div className="category-dialog-overlay" onClick={() => setShowConvertConfirm(false)}>
            <div className="category-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>确认转换</h3>
              <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-2)' }}>确定将个人客户 <strong>{customerToConvert.name}</strong> 转换为直营客户吗？</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)' }}>转换后：</p>
              <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)', paddingLeft: 'var(--space-4)' }}>
                <li>客户类型变为「直营客户」</li>
                <li>客户编号重新生成为 KHZY-XXXX 格式</li>
                <li>当前联系人 <strong>{customerToConvert.contactPerson}</strong> 将自动添加为下单人</li>
                <li>客户将从「个人客户」分组移动到「企业客户」分组</li>
              </ul>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button variant="ghost" onClick={() => setShowConvertConfirm(false)}>取消</Button>
                <Button onClick={confirmConvert}>确认转换</Button>
              </div>
            </div>
          </div>
        )}

        <DetailDrawer
          open={!!detailCustomer}
          onClose={() => setDetailCustomer(null)}
          badge="CU"
          title={detailCustomer?.name}
          statusTag={detailCustomer && <>{levelTag(detailCustomer.level)}{statusTag(detailCustomer.status)}</>}
          subtitle={detailCustomer && `${CUSTOMER_TYPE_LABELS[detailCustomer.type]}${detailCustomer.viaPlatform ? ' · 经平台' : ''} · ${detailCustomer.region} · ${detailCustomer.contactPerson} ${detailCustomer.contactPhone}`}
          mode="view"
        >
          {detailCustomer && (
            <>
              <DrawerSection title="基本信息">
                <InfoGrid cols={3}>
                  <InfoItem label="客户编号" emph mono>{detailCustomer.customerCode || '—'}</InfoItem>
                  <InfoItem label="客户简称" emph>{detailCustomer.shortName || '—'}</InfoItem>
                  <InfoItem label="客户名称" emph>{detailCustomer.name}</InfoItem>
                  <InfoItem label="客户类型">{CUSTOMER_TYPE_LABELS[detailCustomer.type]}{detailCustomer.viaPlatform ? ' · 经平台' : ' · 无平台'}</InfoItem>
                  {detailCustomer.type === 'direct' && (
                    <InfoItem label="是否经平台">
                      <select className="filter-select" style={{ width: '100%', height: 30, padding: '0 var(--space-2)' }} value={detailCustomer.viaPlatform ? 'true' : 'false'} onChange={(e) => handleToggleViaPlatform(detailCustomer.id, e.target.value === 'true')}>
                        <option value="false">否（无平台）</option>
                        <option value="true">是（经平台）</option>
                      </select>
                    </InfoItem>
                  )}
                  <InfoItem label="客户等级">{detailCustomer.level}</InfoItem>
                  <InfoItem label="客户来源">{detailCustomer.source || '—'}</InfoItem>
                  <InfoItem label="合作日期">{detailCustomer.cooperationDate}</InfoItem>
                  <InfoItem label="累计金额" mono>{`¥${(detailCustomer.totalAmount / 10000).toFixed(1)}万`}</InfoItem>
                  <InfoItem label="拓客人">{getPersonDisplay(detailCustomer.developerId, detailCustomer.developerType, detailCustomer.developerName)}</InfoItem>
                  <InfoItem label="维护人">{getPersonDisplay(detailCustomer.maintainerId, detailCustomer.maintainerType, detailCustomer.maintainerName)}</InfoItem>
                  <InfoItem label="跟单人">{getPersonDisplay(detailCustomer.followerId, detailCustomer.followerType, detailCustomer.followerName)}</InfoItem>
                  <InfoItem label="备注" span={3}>{detailCustomer.remark || '—'}</InfoItem>
                </InfoGrid>
              </DrawerSection>

              <DrawerSection title="联系信息">
                <InfoGrid cols={3}>
                  <InfoItem label="联系人">{detailCustomer.contactPerson || '—'}</InfoItem>
                  <InfoItem label="联系电话" mono>{detailCustomer.contactPhone || '—'}</InfoItem>
                  <InfoItem label="联系邮箱">{detailCustomer.contactEmail || '—'}</InfoItem>
                  <InfoItem label="所在地区">{[detailCustomer.province, detailCustomer.city, detailCustomer.district].filter(Boolean).join(' / ') || detailCustomer.region || '—'}</InfoItem>
                  <InfoItem label="联系地址" span={2}>{detailCustomer.contactAddress || '—'}</InfoItem>
                </InfoGrid>
              </DrawerSection>

              {detailCustomer.type !== 'personal' && (
                <DrawerSection title="财务信息">
                  <InfoGrid cols={3}>
                    <InfoItem label="结算方式">{detailCustomer.settlementMethod || '—'}</InfoItem>
                    <InfoItem label="税号" mono>{detailCustomer.taxNo || '—'}</InfoItem>
                  </InfoGrid>
                  <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', marginBottom: 'var(--space-2)' }}>结算账户（{(detailCustomer.bankAccounts ?? []).length}）</div>
                  {(detailCustomer.bankAccounts ?? []).length === 0 ? (
                    <EmptyText>暂无结算账户</EmptyText>
                  ) : (
                    <table className="detail-inline-table">
                      <thead>
                        <tr>
                          <th>户名</th>
                          <th>账号</th>
                          <th>开户行</th>
                          <th>行号</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailCustomer.bankAccounts ?? []).map((ba, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 'var(--font-medium)' }}>{ba.accountName}</td>
                            <td className="mono">{ba.accountNo}</td>
                            <td>{ba.bankName}</td>
                            <td className="mono">{ba.bankNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </DrawerSection>
              )}

              {detailCustomer.type !== 'personal' && (
                <DrawerSection title="开票信息">
                  {(detailCustomer.invoiceInfos ?? []).length === 0 ? (
                    <EmptyText>暂无发票信息</EmptyText>
                  ) : (
                    <table className="detail-inline-table">
                      <thead>
                        <tr>
                          <th>发票主体</th>
                          <th>税号</th>
                          <th>税率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailCustomer.invoiceInfos ?? []).map((inv, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 'var(--font-medium)' }}>{inv.invoiceEntity}</td>
                            <td className="mono">{inv.taxNo}</td>
                            <td>{inv.taxRate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </DrawerSection>
              )}

              {detailCustomer.type !== 'personal' && (
                <DrawerSection title="分润比例">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: '#EBF3FC', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>拓客人</div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: '#0F64B5' }}>{detailCustomer.profitShare?.developerRatio ?? 0}%</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: '#FEF2F4', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>维护人</div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: '#CB405D' }}>{detailCustomer.profitShare?.maintainerRatio ?? 0}%</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: '#E8F5E9', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>跟单人</div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: '#2E7D32' }}>{detailCustomer.profitShare?.followerRatio ?? 0}%</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 'var(--space-3)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                    合计：{(detailCustomer.profitShare?.developerRatio ?? 0) + (detailCustomer.profitShare?.maintainerRatio ?? 0) + (detailCustomer.profitShare?.followerRatio ?? 0)}%
                  </div>
                </DrawerSection>
              )}

              {detailCustomer.type === 'direct' && detailCustomer.platformIds.length > 0 && (
                <DrawerSection title={`平台关联（${detailCustomer.platformIds.length}）`}>
                  <table className="detail-inline-table">
                    <thead>
                      <tr>
                        <th>平台名称</th>
                        <th>编码</th>
                        <th>简称</th>
                        <th>扣点</th>
                        <th>联系人</th>
                        <th>联系电话</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailCustomer.platformIds.map(id => {
                        const p = platforms.find(x => x.id === id);
                        const rate = detailCustomer.platformCommissionRates?.[id];
                        return p ? (
                          <tr key={id}>
                            <td style={{ fontWeight: 'var(--font-medium)' }}>{p.name}</td>
                            <td className="mono">{p.code}</td>
                            <td>{p.shortName}</td>
                            <td style={{ color: SECONDARY, fontWeight: 'var(--font-medium)' }}>{rate || '—'}</td>
                            <td>{p.contactPerson}</td>
                            <td className="mono">{p.contactPhone}</td>
                          </tr>
                        ) : (
                          <tr key={id}><td>未知平台</td></tr>
                        );
                      })}
                    </tbody>
                  </table>
                </DrawerSection>
              )}

              {detailCustomer.type === 'direct' && (
                <DrawerSection title={`下单人管理（${detailCustomer.orderContacts?.length || 0}）`}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
                    <Button size="sm" onClick={() => handleOpenOrderContacts(detailCustomer)}>管理下单人</Button>
                  </div>
                  {(detailCustomer.orderContacts ?? []).length === 0 ? (
                    <EmptyText>暂无下单人，请点击上方「管理下单人」按钮添加</EmptyText>
                  ) : (
                    <table className="detail-inline-table">
                      <thead>
                        <tr>
                          <th>姓名</th>
                          <th>部门</th>
                          <th>手机号码</th>
                          <th>地址</th>
                          <th>备注</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailCustomer.orderContacts ?? []).map((oc, i) => (
                          <tr key={oc.id}>
                            <td style={{ fontWeight: 'var(--font-medium)' }}>{oc.name}</td>
                            <td>{oc.department || '—'}</td>
                            <td className="mono">{oc.phone || '—'}</td>
                            <td>{oc.address || '—'}</td>
                            <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{oc.remark || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </DrawerSection>
              )}

              {detailCustomer.type === 'direct' && (
                <DrawerSection title={`分子机构（${detailCustomer.subOrganizations?.length || 0}）`}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
                    <Button size="sm" onClick={openAddSubOrg}>新增分子机构</Button>
                  </div>
                  {(detailCustomer.subOrganizations ?? []).length === 0 ? (
                    <EmptyText>暂无分子机构，请点击上方「新增分子机构」按钮添加</EmptyText>
                  ) : (
                    <table className="detail-inline-table">
                      <thead>
                        <tr>
                          <th>机构名称</th>
                          <th>联系人</th>
                          <th>联系方式</th>
                          <th>地址</th>
                          <th>拓客人</th>
                          <th>维护人</th>
                          <th>备注</th>
                          <th style={{ width: 100 }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailCustomer.subOrganizations ?? []).map(sub => (
                          <tr key={sub.id}>
                            <td style={{ fontWeight: 'var(--font-medium)' }}>{sub.name}</td>
                            <td>{sub.contactPerson || '—'}</td>
                            <td className="mono">{sub.contactPhone || '—'}</td>
                            <td>{[sub.province, sub.city, sub.district, sub.address].filter(Boolean).join(' ') || '—'}</td>
                            <td>{getPersonDisplay(sub.developerId, sub.developerType, sub.developerName)}</td>
                            <td>{getPersonDisplay(sub.maintainerId, sub.maintainerType, sub.maintainerName)}</td>
                            <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{sub.remark || '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <Button size="sm" variant="ghost" onClick={() => openEditSubOrg(sub)}>编辑</Button>
                                <Button size="sm" variant="ghost" style={{ color: 'var(--color-module-current-secondary)' }} onClick={() => handleDeleteSubOrg(sub.id)}>删除</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </DrawerSection>
              )}
            </>
          )}
        </DetailDrawer>

        <DetailDrawer
          open={showSubOrgDrawer && !!subOrgForm}
          onClose={closeSubOrgDrawer}
          badge="SZ"
          title={editingSubOrg ? '编辑分子机构' : '新增分子机构'}
          mode="edit"
          onCancelEdit={closeSubOrgDrawer}
          onSave={handleSaveSubOrg}
        >
          {subOrgForm && (
            <DrawerSection title="基本信息">
              <div style={grid2}>
                <Field label="机构名称 *"><input className="filter-input" style={{ width: '100%' }} value={subOrgForm.name ?? ''} onChange={e => setSubOrgForm(prev => prev ? { ...prev, name: e.target.value } : prev)} /></Field>
                <Field label="联系人"><input className="filter-input" style={{ width: '100%' }} value={subOrgForm.contactPerson ?? ''} onChange={e => setSubOrgForm(prev => prev ? { ...prev, contactPerson: e.target.value } : prev)} /></Field>
                <Field label="联系方式"><input className="filter-input" style={{ width: '100%' }} value={subOrgForm.contactPhone ?? ''} onChange={e => setSubOrgForm(prev => prev ? { ...prev, contactPhone: e.target.value } : prev)} /></Field>
                <Field label="省份"><select className="filter-select" style={{ width: '100%' }} value={subOrgForm.province ?? ''} onChange={e => setSubOrgForm(prev => prev ? { ...prev, province: e.target.value, city: '', district: '' } : prev)}><option value="">请选择</option>{PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}</select></Field>
                <Field label="城市"><select className="filter-select" style={{ width: '100%' }} value={subOrgForm.city ?? ''} disabled={!subOrgForm.province} onChange={e => setSubOrgForm(prev => prev ? { ...prev, city: e.target.value, district: '' } : prev)}><option value="">请选择</option>{(subOrgForm.province ? getCityNames(subOrgForm.province) : []).map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
                <Field label="区县"><select className="filter-select" style={{ width: '100%' }} value={subOrgForm.district ?? ''} disabled={!subOrgForm.city} onChange={e => setSubOrgForm(prev => prev ? { ...prev, district: e.target.value } : prev)}><option value="">请选择</option>{(subOrgForm.province && subOrgForm.city ? getDistricts(subOrgForm.province, subOrgForm.city) : []).map(d => <option key={d} value={d}>{d}</option>)}</select></Field>
                <Field label="详细地址" full><input className="filter-input" style={{ width: '100%' }} value={subOrgForm.address ?? ''} onChange={e => setSubOrgForm(prev => prev ? { ...prev, address: e.target.value } : prev)} /></Field>
                <Field label="拓客人" full>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <select className="filter-select" style={{ width: 120 }} value={subOrgForm.developerType ?? ''} onChange={(e) => { setSubOrgForm(prev => prev ? { ...prev, developerType: (e.target.value || undefined) as PersonRoleType | undefined, developerId: undefined, developerName: undefined } : prev); }}>
                      <option value="">请选择</option>
                      {Object.entries(PERSON_TYPE_LABELS).map(([type, label]) => (
                        <option key={type} value={type}>{label}</option>
                      ))}
                    </select>
                    {subOrgForm.developerType ? (
                      <select className="filter-select" style={{ flex: 1 }} value={subOrgForm.developerId ?? ''} onChange={(e) => {
                        const person = getAllPersonOptions().find(p => p.id === e.target.value);
                        setSubOrgForm(prev => prev ? { ...prev, developerId: e.target.value || undefined, developerName: person?.name || undefined } : prev);
                      }}>
                        <option value="">请选择</option>
                        {getAllPersonOptions().filter(p => p.type === subOrgForm.developerType).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>请先选择类型</div>
                    )}
                  </div>
                </Field>
                <Field label="维护人" full>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <select className="filter-select" style={{ width: 120 }} value={subOrgForm.maintainerType ?? ''} onChange={(e) => { setSubOrgForm(prev => prev ? { ...prev, maintainerType: (e.target.value || undefined) as PersonRoleType | undefined, maintainerId: undefined, maintainerName: undefined } : prev); }}>
                      <option value="">请选择</option>
                      {Object.entries(PERSON_TYPE_LABELS).map(([type, label]) => (
                        <option key={type} value={type}>{label}</option>
                      ))}
                    </select>
                    {subOrgForm.maintainerType ? (
                      <select className="filter-select" style={{ flex: 1 }} value={subOrgForm.maintainerId ?? ''} onChange={(e) => {
                        const person = getAllPersonOptions().find(p => p.id === e.target.value);
                        setSubOrgForm(prev => prev ? { ...prev, maintainerId: e.target.value || undefined, maintainerName: person?.name || undefined } : prev);
                      }}>
                        <option value="">请选择</option>
                        {getAllPersonOptions().filter(p => p.type === subOrgForm.maintainerType).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>请先选择类型</div>
                    )}
                  </div>
                </Field>
                <Field label="备注" full><textarea className="filter-input" style={{ width: '100%', minHeight: 80, resize: 'vertical' }} value={subOrgForm.remark ?? ''} onChange={e => setSubOrgForm(prev => prev ? { ...prev, remark: e.target.value } : prev)} /></Field>
              </div>
            </DrawerSection>
          )}
        </DetailDrawer>

        <DetailDrawer
          open={showPlatformDetail && !!detailPlatform}
          onClose={() => { setShowPlatformDetail(false); setEditingPlatform(false); setEditPlatformForm(null); }}
          badge={detailPlatform?.shortName?.charAt(0) || 'PT'}
          title={detailPlatform?.name}
          statusTag={detailPlatform && statusTag(detailPlatform.status, 'platform')}
          subtitle={detailPlatform && `${detailPlatform.contactPerson} · ${detailPlatform.contactPhone}`}
          mode={editingPlatform ? 'edit' : 'view'}
          onEdit={handleStartEditPlatform}
          onCancelEdit={handleCancelEditPlatform}
          onSave={handleSaveEditPlatform}
        >
          {detailPlatform && (
            <>
              <DrawerSection title="基本信息">
                {editingPlatform && editPlatformForm ? (
                  <div style={grid2}>
                    <Field label="平台名称"><input className="filter-input" style={{ width: '100%' }} value={editPlatformForm.name ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, name: e.target.value } : prev)} /></Field>
                    <Field label="平台简称"><input className="filter-input" style={{ width: '100%' }} value={editPlatformForm.shortName ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, shortName: e.target.value } : prev)} /></Field>
                    <Field label="平台编号"><Text className="mono">{detailPlatform.code}</Text></Field>
                    <Field label="联系人"><input className="filter-input" style={{ width: '100%' }} value={editPlatformForm.contactPerson ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, contactPerson: e.target.value } : prev)} /></Field>
                    <Field label="联系人职务"><input className="filter-input" style={{ width: '100%' }} value={editPlatformForm.contactPosition ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, contactPosition: e.target.value } : prev)} /></Field>
                    <Field label="拓客人" full>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <select className="filter-select" style={{ width: 120 }} value={editPlatformForm.developerType ?? ''} onChange={(e) => { setEditPlatformForm(prev => prev ? { ...prev, developerType: (e.target.value || undefined) as PersonRoleType | undefined, developerId: undefined, developerName: undefined } : prev); }}>
                          <option value="">请选择</option>
                          {Object.entries(PERSON_TYPE_LABELS).map(([type, label]) => (
                            <option key={type} value={type}>{label}</option>
                          ))}
                        </select>
                        {editPlatformForm.developerType ? (
                          <select className="filter-select" style={{ flex: 1 }} value={editPlatformForm.developerId ?? ''} onChange={(e) => {
                            const person = getAllPersonOptions().find(p => p.id === e.target.value);
                            setEditPlatformForm(prev => prev ? { ...prev, developerId: e.target.value || undefined, developerName: person?.name || undefined } : prev);
                          }}>
                            <option value="">请选择</option>
                            {getAllPersonOptions().filter(p => p.type === editPlatformForm.developerType).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>请先选择类型</div>
                        )}
                      </div>
                    </Field>
                    <Field label="联系电话"><input className="filter-input" style={{ width: '100%' }} value={editPlatformForm.contactPhone ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, contactPhone: e.target.value } : prev)} /></Field>
                    <Field label="省份"><select className="filter-select" style={{ width: '100%' }} value={editPlatformForm.province ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, province: e.target.value, city: '', district: '' } : prev)}><option value="">请选择</option>{PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}</select></Field>
                    <Field label="城市"><select className="filter-select" style={{ width: '100%' }} value={editPlatformForm.city ?? ''} disabled={!editPlatformForm.province} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, city: e.target.value, district: '' } : prev)}><option value="">请选择</option>{(editPlatformForm.province ? getCityNames(editPlatformForm.province) : []).map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
                    <Field label="区县"><select className="filter-select" style={{ width: '100%' }} value={editPlatformForm.district ?? ''} disabled={!editPlatformForm.city} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, district: e.target.value } : prev)}><option value="">请选择</option>{(editPlatformForm.province && editPlatformForm.city ? getDistricts(editPlatformForm.province, editPlatformForm.city) : []).map(d => <option key={d} value={d}>{d}</option>)}</select></Field>
                    <Field label="具体地址" full><input className="filter-input" style={{ width: '100%' }} value={editPlatformForm.contactAddress ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, contactAddress: e.target.value } : prev)} /></Field>
                    <Field label="合作日期"><input className="filter-input" style={{ width: '100%' }} type="date" value={editPlatformForm.cooperationDate ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, cooperationDate: e.target.value } : prev)} /></Field>
                    <Field label="支付保证金（元）"><input className="filter-input" style={{ width: '100%' }} type="number" value={editPlatformForm.deposit ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, deposit: e.target.value === '' ? undefined : Number(e.target.value) } : prev)} placeholder="平台交纳的保证金金额" /></Field>
                    <Field label="保证金应收日期"><input className="filter-input" style={{ width: '100%' }} type="date" value={editPlatformForm.depositDueDate ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, depositDueDate: e.target.value || undefined } : prev)} /></Field>
                    <Field label="备注" full><input className="filter-input" style={{ width: '100%' }} value={editPlatformForm.remark ?? ''} onChange={e => setEditPlatformForm(prev => prev ? { ...prev, remark: e.target.value } : prev)} /></Field>
                  </div>
                ) : (
                  <InfoGrid cols={3}>
                    <InfoItem label="平台名称" emph>{detailPlatform.name}</InfoItem>
                    <InfoItem label="平台简称" emph>{detailPlatform.shortName}</InfoItem>
                    <InfoItem label="平台编号" emph mono>{detailPlatform.code}</InfoItem>
                    <InfoItem label="联系人">{detailPlatform.contactPerson || '—'}</InfoItem>
                    <InfoItem label="联系人职务">{detailPlatform.contactPosition || '—'}</InfoItem>
                    <InfoItem label="拓客人">{getPersonDisplay(detailPlatform.developerId, detailPlatform.developerType, detailPlatform.developerName)}</InfoItem>
                    <InfoItem label="联系电话" mono>{detailPlatform.contactPhone || '—'}</InfoItem>
                    <InfoItem label="所在地区">{[detailPlatform.province, detailPlatform.city, detailPlatform.district].filter(Boolean).join(' / ') || '—'}</InfoItem>
                    <InfoItem label="合作日期">{detailPlatform.cooperationDate}</InfoItem>
                    <InfoItem label="支付保证金" mono valueStyle={{ color: 'var(--color-module-current-base)', fontWeight: 'var(--font-semibold)' }}>{detailPlatform.deposit ? `¥ ${detailPlatform.deposit.toLocaleString('en-US')}` : '—'}</InfoItem>
                    <InfoItem label="保证金应收日期" mono>{detailPlatform.depositDueDate || '—'}</InfoItem>
                    <InfoItem label="具体地址" span={3}>{detailPlatform.contactAddress || '—'}</InfoItem>
                    <InfoItem label="备注" span={3}>{detailPlatform.remark || '—'}</InfoItem>
                  </InfoGrid>
                )}
              </DrawerSection>

              <DrawerSection title={`结算账户（${detailPlatform.bankAccounts.length}/5）`}>
                {detailPlatform.bankAccounts.length === 0 ? <EmptyText>暂无结算账户</EmptyText> : (
                  <table className="detail-inline-table">
                    <thead>
                      <tr>
                        <th>户名</th>
                        <th>账号</th>
                        <th>开户行</th>
                        <th>行号</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailPlatform.bankAccounts.map((ba, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 'var(--font-medium)' }}>{ba.accountName}</td>
                          <td className="mono">{ba.accountNo}</td>
                          <td>{ba.bankName}</td>
                          <td className="mono">{ba.bankNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </DrawerSection>

              <DrawerSection title={`发票信息（${detailPlatform.invoiceInfos.length}/5）`}>
                {detailPlatform.invoiceInfos.length === 0 ? <EmptyText>暂无发票信息</EmptyText> : (
                  <table className="detail-inline-table">
                    <thead>
                      <tr>
                        <th>发票主体</th>
                        <th>税号</th>
                        <th>税率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailPlatform.invoiceInfos.map((inv, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 'var(--font-medium)' }}>{inv.invoiceEntity}</td>
                          <td className="mono">{inv.taxNo}</td>
                          <td>{inv.taxRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </DrawerSection>
            </>
          )}
        </DetailDrawer>

        {showAddDrawer && (
          <CreateDrawer customerType={activeTab} platforms={platforms} sequence={data.filter(c => c.type === activeTab).length + 1} onCancel={() => setShowAddDrawer(false)}
            onSave={item => { setData(prev => [item, ...prev]); setShowAddDrawer(false); }}
            onQuickAddPlatform={quickAddPlatform}
          />
        )}

        {showAddPlatformDrawer && <AddPlatformDrawer onCancel={() => setShowAddPlatformDrawer(false)} onSave={item => { setPlatforms(prev => [item, ...prev]); setShowAddPlatformDrawer(false); }} sequence={platforms.length + 1} />}

        {showOrderContactDrawer && currentCustomerForContacts && (
          <OrderContactDrawer customer={currentCustomerForContacts} onClose={() => setShowOrderContactDrawer(false)} onSave={handleSaveOrderContact} onDelete={handleDeleteOrderContact} />
        )}
      </div>
    </>
  );
}

function OrderContactDrawer({ customer, onClose, onSave, onDelete }: {
  customer: CustomerItem;
  onClose: () => void;
  onSave: (customerId: string, contact: OrderContact) => void;
  onDelete: (customerId: string, contactId: string) => void;
}) {
  const [contacts, setContacts] = useState<OrderContact[]>(customer.orderContacts || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<OrderContact>({ id: '', name: '', department: '', phone: '', address: '', remark: '' });

  const startEdit = (contact: OrderContact) => {
    setEditingId(contact.id);
    setNewContact({ ...contact });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewContact({ id: '', name: '', department: '', phone: '', address: '', remark: '' });
  };

  const saveContact = () => {
    if (!newContact.name.trim()) return;
    const contactToSave: OrderContact = {
      ...newContact,
      id: newContact.id || generateOrderContactId(customer.id, contacts.length + 1),
    };
    onSave(customer.id, contactToSave);
    setContacts(prev => {
      if (editingId) {
        return prev.map(c => c.id === editingId ? contactToSave : c);
      }
      return [...prev, contactToSave];
    });
    cancelEdit();
  };

  const handleDelete = (contactId: string) => {
    if (window.confirm('确定删除该下单人吗？')) {
      onDelete(customer.id, contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="drawer-header-badge" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>{customer.shortName?.charAt(0) || 'CU'}</span>
            <div>
              <span className="drawer-title">{customer.name}</span>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2 }}>下单人管理</div>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-section-title">下单人列表</div>
          {contacts.length === 0 ? (
            <EmptyText>暂无下单人，请添加</EmptyText>
          ) : (
            <Card style={{ marginBottom: 'var(--space-4)' }}>
              <Table
                headers={['姓名', '部门', '手机号码', '地址', '备注', '操作']}
                rows={contacts.map(contact => [
                  <span key="name" className="cell-emph">{contact.name}</span>,
                  <span key="dept">{contact.department || '—'}</span>,
                  <span key="phone" className="mono">{contact.phone || '—'}</span>,
                  <span key="addr" style={{ fontSize: 'var(--text-sm)' }}>{contact.address || '—'}</span>,
                  <span key="remark" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{contact.remark || '—'}</span>,
                  <div className="row-actions" key="act">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(contact)}>编辑</Button>
                    <Button size="sm" variant="ghost" style={{ color: SECONDARY }} onClick={() => handleDelete(contact.id)}>删除</Button>
                  </div>,
                ])}
              />
            </Card>
          )}

          <div className="drawer-section-title">{editingId ? '编辑下单人' : '新增下单人'}</div>
          <div className="drawer-form-row">
            <div className="drawer-form-field"><label className="drawer-label">姓名 *</label><input className="filter-input" style={{ width: '100%' }} value={newContact.name} onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))} placeholder="请输入姓名" /></div>
            <div className="drawer-form-field"><label className="drawer-label">部门</label><input className="filter-input" style={{ width: '100%' }} value={newContact.department || ''} onChange={e => setNewContact(prev => ({ ...prev, department: e.target.value }))} placeholder="请输入部门" /></div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field"><label className="drawer-label">手机号码</label><input className="filter-input" style={{ width: '100%' }} value={newContact.phone || ''} onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))} placeholder="请输入手机号码" /></div>
            <div className="drawer-form-field"><label className="drawer-label">地址</label><input className="filter-input" style={{ width: '100%' }} value={newContact.address || ''} onChange={e => setNewContact(prev => ({ ...prev, address: e.target.value }))} placeholder="请输入地址" /></div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field" style={{ flex: 1 }}><label className="drawer-label">备注</label><input className="filter-input" style={{ width: '100%' }} value={newContact.remark || ''} onChange={e => setNewContact(prev => ({ ...prev, remark: e.target.value }))} placeholder="选填" /></div>
          </div>
        </div>

        <div className="drawer-footer">
          <Button variant="ghost" onClick={cancelEdit}>{editingId ? '取消' : '关闭'}</Button>
          <Button onClick={saveContact} disabled={!newContact.name.trim()}>{editingId ? '保存修改' : '添加下单人'}</Button>
        </div>
      </div>
    </div>
  );
}

function CreateDrawer({ customerType, platforms, sequence, onCancel, onSave, onQuickAddPlatform }: {
  customerType: CustomerType;
  platforms: { id: string; shortName: string; code: string; name: string; contactPerson: string; contactPhone: string }[];
  sequence: number;
  onCancel: () => void;
  onSave: (item: CustomerItem) => void;
  onQuickAddPlatform: (shortName: string) => string;
}) {
  const [form, setForm] = useState<CustomerItem>({
    id: `c_${Date.now()}`, name: '', shortName: '', customerCode: '', type: customerType, viaPlatform: false, region: '', province: '', city: '', district: '',
    contactPerson: '', contactPhone: '', contactEmail: '', contactAddress: '', level: 'B级', orders: 0, totalAmount: 0, platformIds: [],
    cooperationDate: new Date().toISOString().slice(0, 10), status: 'active', settlementMethod: '月结', taxNo: '', source: '', remark: '',
    bankAccounts: [], invoiceInfos: [], platformCommissionRates: {},
    profitShare: { developerRatio: 50, maintainerRatio: 0, followerRatio: 40 },
    subOrganizations: [],
  });
  const [quickPlatformName, setQuickPlatformName] = useState('');
  const [bankAccounts, setBankAccounts] = useState<CustomerBankAccount[]>([]);
  const [invoiceInfos, setInvoiceInfos] = useState<CustomerInvoiceInfo[]>([]);
  const [newBank, setNewBank] = useState<CustomerBankAccount>({ accountName: '', accountNo: '', bankName: '', bankNo: '' });
  const [newInvoice, setNewInvoice] = useState<CustomerInvoiceInfo>({ invoiceEntity: '', taxNo: '', taxRate: '' });

  const personOptions = getAllPersonOptions();

  const update = <K extends keyof CustomerItem>(k: K, v: CustomerItem[K]) => setForm(prev => ({ ...prev, [k]: v }));
  const togglePlatform = (id: string) => setForm(prev => {
    if (prev.platformIds.includes(id)) {
      const nextRates = { ...(prev.platformCommissionRates ?? {}) };
      delete nextRates[id];
      return { ...prev, platformIds: prev.platformIds.filter(x => x !== id), platformCommissionRates: nextRates };
    }
    return { ...prev, platformIds: [...prev.platformIds, id] };
  });
  const setPlatformRate = (id: string, rate: string) => setForm(prev => ({ ...prev, platformCommissionRates: { ...(prev.platformCommissionRates ?? {}), [id]: rate } }));
  const canSave = form.name.trim().length > 0 && (form.shortName ?? '').trim().length > 0 && form.contactPerson.trim().length > 0;

  const previewCode = (form.shortName ?? '').trim() ? generateCustomerCode(customerType, form.shortName!.trim(), sequence) : '—';

  const handleProvinceChange = (p: string) => setForm(prev => ({ ...prev, province: p, city: '', district: '' }));
  const handleCityChange = (c: string) => setForm(prev => ({ ...prev, city: c, district: '' }));
  const handleDistrictChange = (d: string) => setForm(prev => ({ ...prev, district: d }));

  const handleQuickAdd = () => {
    if (!quickPlatformName.trim()) return;
    const newId = onQuickAddPlatform(quickPlatformName.trim());
    setForm(prev => ({ ...prev, platformIds: [...prev.platformIds, newId] }));
    setQuickPlatformName('');
  };

  const addBankAccount = () => {
    if (bankAccounts.length >= 5 || !newBank.accountName) return;
    setBankAccounts(prev => [...prev, { ...newBank }]);
    setNewBank({ accountName: '', accountNo: '', bankName: '', bankNo: '' });
  };
  const addInvoiceInfo = () => {
    if (invoiceInfos.length >= 5 || !newInvoice.invoiceEntity) return;
    setInvoiceInfos(prev => [...prev, { ...newInvoice }]);
    setNewInvoice({ invoiceEntity: '', taxNo: '', taxRate: '' });
  };

  const handleSave = () => {
    if (!canSave) return;
    const shortName = form.shortName!.trim();
    const customerCode = generateCustomerCode(customerType, shortName, sequence);
    const region = form.city ? form.city.replace(/市$/, '') : (form.province || '');
    onSave({ ...form, shortName, customerCode, region, bankAccounts, invoiceInfos });
  };

  return (
    <div className="drawer-overlay" onClick={onCancel}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">新增{CUSTOMER_TYPE_LABELS[customerType]}</span>
          <button className="drawer-close" onClick={onCancel}><svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section-title">基本信息</div>
          <div className="drawer-form-row">
            <div className="drawer-form-field"><label className="drawer-label">客户简称 *</label><input className="filter-input" style={{ width: '100%' }} value={form.shortName ?? ''} onChange={e => update('shortName', e.target.value)} placeholder="请输入客户简称" /></div>
            <div className="drawer-form-field"><label className="drawer-label">客户名称 *</label><input className="filter-input" style={{ width: '100%' }} value={form.name} onChange={e => update('name', e.target.value)} placeholder="请输入客户名称" /></div>
            <div className="drawer-form-field"><label className="drawer-label">客户等级</label><select className="filter-select" style={{ width: '100%' }} value={form.level} onChange={e => update('level', e.target.value)}><option>S级</option><option>A级</option><option>B级</option><option>C级</option></select></div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field" style={{ flex: 1 }}><label className="drawer-label">客户编号（自动生成）</label><input className="filter-input" style={{ width: '100%' }} value={previewCode} readOnly placeholder="输入客户简称后自动生成" /></div>
            {customerType === 'direct' && (
              <div className="drawer-form-field"><label className="drawer-label">是否经平台</label><select className="filter-select" style={{ width: '100%' }} value={form.viaPlatform ? 'true' : 'false'} onChange={(e) => { update('viaPlatform', e.target.value === 'true'); if (e.target.value !== 'true') { update('platformIds', []); update('platformCommissionRates', {}); } }}><option value="false">否（无平台）</option><option value="true">是（经平台）</option></select></div>
            )}
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field"><label className="drawer-label">联系人 *</label><input className="filter-input" style={{ width: '100%' }} value={form.contactPerson} onChange={e => update('contactPerson', e.target.value)} /></div>
            <div className="drawer-form-field"><label className="drawer-label">联系电话</label><input className="filter-input" style={{ width: '100%' }} value={form.contactPhone} onChange={e => update('contactPhone', e.target.value)} /></div>
            <div className="drawer-form-field"><label className="drawer-label">联系邮箱</label><input className="filter-input" style={{ width: '100%' }} value={form.contactEmail || ''} onChange={e => update('contactEmail', e.target.value)} /></div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field"><label className="drawer-label">省份</label><select className="filter-select" style={{ width: '100%' }} value={form.province ?? ''} onChange={e => handleProvinceChange(e.target.value)}><option value="">请选择</option>{PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div className="drawer-form-field"><label className="drawer-label">城市</label><select className="filter-select" style={{ width: '100%' }} value={form.city ?? ''} disabled={!form.province} onChange={e => handleCityChange(e.target.value)}><option value="">请选择</option>{(form.province ? getCityNames(form.province) : []).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="drawer-form-field"><label className="drawer-label">区县</label><select className="filter-select" style={{ width: '100%' }} value={form.district ?? ''} disabled={!form.city} onChange={e => handleDistrictChange(e.target.value)}><option value="">请选择</option>{(form.province && form.city ? getDistricts(form.province, form.city) : []).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          </div>
          <div className="drawer-form-row">
            <div className="drawer-form-field" style={{ flex: 2 }}><label className="drawer-label">具体地址</label><input className="filter-input" style={{ width: '100%' }} value={form.contactAddress || ''} onChange={e => update('contactAddress', e.target.value)} placeholder="街道、门牌号等" /></div>
            <div className="drawer-form-field"><label className="drawer-label">合作日期</label><input className="filter-input" style={{ width: '100%' }} type="date" value={form.cooperationDate} onChange={e => update('cooperationDate', e.target.value)} /></div>
          </div>
          <div className="drawer-section-title">合作信息</div>
          <div className="drawer-form-row">
            {customerType !== 'personal' && <div className="drawer-form-field"><label className="drawer-label">结算方式</label><select className="filter-select" style={{ width: '100%' }} value={form.settlementMethod || ''} onChange={e => update('settlementMethod', e.target.value)}><option value="月结">月结</option><option value="预付">预付</option><option value="季度">季度结算</option><option value="现款">现款</option></select></div>}
            <div className="drawer-form-field"><label className="drawer-label">客户来源</label><select className="filter-select" style={{ width: '100%' }} value={form.source || ''} onChange={e => update('source', e.target.value)}><option value="">请选择</option><option value="主动开发">主动开发</option><option value="展会拓客">展会拓客</option><option value="老客户转介">老客户转介</option><option value="平台引流">平台引流</option><option value="线上咨询">线上咨询</option><option value="其他">其他</option></select></div>
            {customerType !== 'personal' && <div className="drawer-form-field"><label className="drawer-label">税号</label><input className="filter-input" style={{ width: '100%' }} value={form.taxNo || ''} onChange={e => update('taxNo', e.target.value)} /></div>}
            <div className="drawer-form-field" style={{ flex: 2 }}>
              <label className="drawer-label">拓客人</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <select className="filter-select" style={{ width: 120 }} value={form.developerType ?? ''} onChange={(e) => { update('developerType', (e.target.value || undefined) as PersonRoleType | undefined); update('developerId', undefined); update('developerName', undefined); }}>
                  <option value="">请选择</option>
                  {Object.entries(PERSON_TYPE_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
                {form.developerType ? (
                  <select className="filter-select" style={{ flex: 1 }} value={form.developerId ?? ''} onChange={(e) => {
                    const person = personOptions.find(p => p.id === e.target.value);
                    update('developerId', e.target.value || undefined);
                    update('developerName', person?.name || undefined);
                  }}>
                    <option value="">请选择</option>
                    {personOptions.filter(p => p.type === form.developerType).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>请先选择类型</div>
                )}
              </div>
            </div>
          </div>
          {customerType !== 'personal' && (
            <div className="drawer-form-row">
              <div className="drawer-form-field">
                <label className="drawer-label">维护人</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <select className="filter-select" style={{ width: 120 }} value={form.maintainerType ?? ''} onChange={(e) => { update('maintainerType', (e.target.value || undefined) as PersonRoleType | undefined); update('maintainerId', undefined); update('maintainerName', undefined); }}>
                    <option value="">请选择</option>
                    {Object.entries(PERSON_TYPE_LABELS).map(([type, label]) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                  {form.maintainerType ? (
                    <select className="filter-select" style={{ flex: 1 }} value={form.maintainerId ?? ''} onChange={(e) => {
                      const person = personOptions.find(p => p.id === e.target.value);
                      update('maintainerId', e.target.value || undefined);
                      update('maintainerName', person?.name || undefined);
                    }}>
                      <option value="">请选择</option>
                      {personOptions.filter(p => p.type === form.maintainerType).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>请先选择类型</div>
                  )}
                </div>
              </div>
              <div className="drawer-form-field">
                <label className="drawer-label">跟单人</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <select className="filter-select" style={{ width: 120 }} value={form.followerType ?? ''} onChange={(e) => { update('followerType', (e.target.value || undefined) as PersonRoleType | undefined); update('followerId', undefined); update('followerName', undefined); }}>
                    <option value="">请选择</option>
                    {Object.entries(PERSON_TYPE_LABELS).map(([type, label]) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                  {form.followerType ? (
                    <select className="filter-select" style={{ flex: 1 }} value={form.followerId ?? ''} onChange={(e) => {
                      const person = personOptions.find(p => p.id === e.target.value);
                      update('followerId', e.target.value || undefined);
                      update('followerName', person?.name || undefined);
                    }}>
                      <option value="">请选择</option>
                      {personOptions.filter(p => p.type === form.followerType).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>请先选择类型</div>
                  )}
                </div>
              </div>
            </div>
          )}
          {customerType !== 'personal' && (
            <div className="drawer-section-title">分润比例</div>
          )}
          {customerType !== 'personal' && (
            <div className="drawer-form-row">
              <div className="drawer-form-field">
                <label className="drawer-label">拓客人比例（%）</label>
                <input type="number" min={0} max={100} className="filter-input" style={{ width: '100%' }} value={form.profitShare?.developerRatio ?? 0} onChange={e => update('profitShare', { ...(form.profitShare || { developerRatio: 0, maintainerRatio: 0, followerRatio: 0 }), developerRatio: Number(e.target.value) || 0 })} />
              </div>
              <div className="drawer-form-field">
                <label className="drawer-label">维护人比例（%）</label>
                <input type="number" min={0} max={100} className="filter-input" style={{ width: '100%' }} value={form.profitShare?.maintainerRatio ?? 0} onChange={e => update('profitShare', { ...(form.profitShare || { developerRatio: 0, maintainerRatio: 0, followerRatio: 0 }), maintainerRatio: Number(e.target.value) || 0 })} />
              </div>
              <div className="drawer-form-field">
                <label className="drawer-label">跟单人比例（%）</label>
                <input type="number" min={0} max={100} className="filter-input" style={{ width: '100%' }} value={form.profitShare?.followerRatio ?? 0} onChange={e => update('profitShare', { ...(form.profitShare || { developerRatio: 0, maintainerRatio: 0, followerRatio: 0 }), followerRatio: Number(e.target.value) || 0 })} />
              </div>
              <div className="drawer-form-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: (form.profitShare?.developerRatio ?? 0) + (form.profitShare?.maintainerRatio ?? 0) + (form.profitShare?.followerRatio ?? 0) > 100 ? '#FEF2F4' : '#EBF3FC', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: (form.profitShare?.developerRatio ?? 0) + (form.profitShare?.maintainerRatio ?? 0) + (form.profitShare?.followerRatio ?? 0) > 100 ? '#CB405D' : '#0F64B5' }}>
                  合计：{(form.profitShare?.developerRatio ?? 0) + (form.profitShare?.maintainerRatio ?? 0) + (form.profitShare?.followerRatio ?? 0)}%
                  {(form.profitShare?.developerRatio ?? 0) + (form.profitShare?.maintainerRatio ?? 0) + (form.profitShare?.followerRatio ?? 0) > 100 && '（超出100%）'}
                </div>
              </div>
            </div>
          )}
          <div className="drawer-form-row">
            <div className="drawer-form-field" style={{ flex: 1 }}><label className="drawer-label">备注</label><input className="filter-input" style={{ width: '100%' }} value={form.remark || ''} onChange={e => update('remark', e.target.value)} /></div>
            <div className="drawer-form-field"><label className="drawer-label">状态</label><select className="filter-select" style={{ width: '100%' }} value={form.status} onChange={e => update('status', e.target.value as CustomerItem['status'])}><option value="active">合作中</option><option value="inactive">已暂停</option></select></div>
          </div>

          {customerType !== 'personal' && (
            <>
              <div className="drawer-section-title">结算账户（{bankAccounts.length}/5）</div>
              {bankAccounts.map((ba, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  <span style={{ fontWeight: 'var(--font-medium)' }}>{ba.accountName}</span>
                  <span className="mono" style={{ color: 'var(--color-neutral-500)' }}>{ba.accountNo}</span>
                  <span style={{ color: 'var(--color-neutral-500)' }}>{ba.bankName}</span>
                  <button style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: SECONDARY, cursor: 'pointer', fontSize: 14 }} onClick={() => setBankAccounts(prev => prev.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              {bankAccounts.length < 5 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
                  <div><label className="drawer-label">户名 *</label><input className="filter-input" style={{ width: '100%' }} value={newBank.accountName} onChange={e => setNewBank(prev => ({ ...prev, accountName: e.target.value }))} /></div>
                  <div><label className="drawer-label">账号</label><input className="filter-input" style={{ width: '100%' }} value={newBank.accountNo} onChange={e => setNewBank(prev => ({ ...prev, accountNo: e.target.value }))} /></div>
                  <div><label className="drawer-label">开户行</label><input className="filter-input" style={{ width: '100%' }} value={newBank.bankName} onChange={e => setNewBank(prev => ({ ...prev, bankName: e.target.value }))} /></div>
                  <div><label className="drawer-label">行号</label><input className="filter-input" style={{ width: '100%' }} value={newBank.bankNo} onChange={e => setNewBank(prev => ({ ...prev, bankNo: e.target.value }))} /></div>
                  <div style={{ gridColumn: '1 / -1' }}><Button size="sm" onClick={addBankAccount} disabled={!newBank.accountName}>+ 添加账户</Button></div>
                </div>
              )}

              <div className="drawer-section-title">发票信息（{invoiceInfos.length}/5）</div>
              {invoiceInfos.map((inv, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  <span style={{ fontWeight: 'var(--font-medium)' }}>{inv.invoiceEntity}</span>
                  <span className="mono" style={{ color: 'var(--color-neutral-500)' }}>{inv.taxNo}</span>
                  <span style={{ color: 'var(--color-neutral-500)' }}>{inv.taxRate}</span>
                  <button style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: SECONDARY, cursor: 'pointer', fontSize: 14 }} onClick={() => setInvoiceInfos(prev => prev.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              {invoiceInfos.length < 5 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                  <div><label className="drawer-label">发票主体 *</label><input className="filter-input" style={{ width: '100%' }} value={newInvoice.invoiceEntity} onChange={e => setNewInvoice(prev => ({ ...prev, invoiceEntity: e.target.value }))} /></div>
                  <div><label className="drawer-label">税号</label><input className="filter-input" style={{ width: '100%' }} value={newInvoice.taxNo} onChange={e => setNewInvoice(prev => ({ ...prev, taxNo: e.target.value }))} /></div>
                  <div><label className="drawer-label">税率</label><input className="filter-input" style={{ width: '100%' }} value={newInvoice.taxRate} onChange={e => setNewInvoice(prev => ({ ...prev, taxRate: e.target.value }))} placeholder="6%" /></div>
                  <div style={{ gridColumn: '1 / -1' }}><Button size="sm" onClick={addInvoiceInfo} disabled={!newInvoice.invoiceEntity}>+ 添加发票主体</Button></div>
                </div>
              )}
            </>
          )}

          {customerType === 'direct' && form.viaPlatform && (
            <>
              <div className="drawer-section-title">关联平台（可多选，每个平台单独设置扣点）</div>
              {form.platformIds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 'var(--space-3)' }}>
                  {form.platformIds.map(id => {
                    const p = platforms.find(x => x.id === id);
                    const rate = form.platformCommissionRates?.[id];
                    return p ? (
                      <div key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: `${SECONDARY}15`, color: SECONDARY, borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', border: `1px solid ${SECONDARY}30`, fontWeight: 'var(--font-medium)' }}>
                        {p.shortName}
                        {rate ? <span style={{ color: 'var(--color-neutral-500)', fontWeight: 'normal' }}>扣{rate}</span> : null}
                        <span className="mono" style={{ color: 'var(--color-neutral-500)', fontWeight: 'normal' }}>({p.code})</span>
                        <button onClick={() => togglePlatform(id)} style={{ cursor: 'pointer', border: 'none', background: 'transparent', color: SECONDARY, fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              <div style={{ background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <Table headers={['选择', '平台名称', '编码', '简称', '扣点', '联系人']}
                  rows={platforms.map(p => {
                    const checked = form.platformIds.includes(p.id);
                    const rate = form.platformCommissionRates?.[p.id] ?? '';
                    return [
                      <input key="chk" type="checkbox" checked={checked} onChange={() => togglePlatform(p.id)} />,
                      <span key="n" style={{ fontWeight: 'var(--font-medium)' }}>{p.name}</span>,
                      <span key="c" className="mono">{p.code}</span>,
                      <span key="s">{p.shortName}</span>,
                      checked
                        ? <input key="r" className="filter-input" style={{ width: 90, height: 30 }} value={rate} onChange={e => setPlatformRate(p.id, e.target.value)} placeholder="如8%" />
                        : <span key="r" style={{ color: 'var(--color-neutral-300)' }}>—</span>,
                      <span key="cp">{p.contactPerson}</span>,
                    ];
                  })}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', background: SECONDARY_LIGHT, borderRadius: 'var(--radius-md)', border: `1px dashed ${SECONDARY}40` }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', flexShrink: 0 }}>快速新增平台：</span>
                <input className="filter-input" style={{ flex: 1 }} placeholder="输入平台简称，回车新增" value={quickPlatformName} onChange={e => setQuickPlatformName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); }} />
                <Button size="sm" onClick={handleQuickAdd} disabled={!quickPlatformName.trim()}>新增</Button>
              </div>
            </>
          )}
        </div>
        <div className="drawer-footer">
          <Button variant="ghost" onClick={onCancel}>取消</Button>
          <Button onClick={handleSave} disabled={!canSave}>保存</Button>
        </div>
      </div>
    </div>
  );
}

function AddPlatformDrawer({ onCancel, onSave, sequence }: { onCancel: () => void; onSave: (item: PlatformItem) => void; sequence: number }) {
  const [form, setForm] = useState<Partial<PlatformItem>>({
    name: '', shortName: '', contactPerson: '', contactPosition: '', contactPhone: '', contactAddress: '',
    province: '', city: '', district: '',
    cooperationDate: new Date().toISOString().slice(0, 10), status: 'active',
    bankAccounts: [], invoiceInfos: [], remark: '', deposit: undefined, depositDueDate: '',
  });
  const [bankAccounts, setBankAccounts] = useState<PlatformBankAccount[]>([]);
  const [invoiceInfos, setInvoiceInfos] = useState<PlatformInvoiceInfo[]>([]);
  const [newBank, setNewBank] = useState<PlatformBankAccount>({ accountName: '', accountNo: '', bankName: '', bankNo: '' });
  const [newInvoice, setNewInvoice] = useState<PlatformInvoiceInfo>({ invoiceEntity: '', taxNo: '', taxRate: '' });

  const update = <K extends keyof PlatformItem>(k: K, v: PlatformItem[K]) => setForm(prev => ({ ...prev, [k]: v }));
  const canSave = (form.name?.trim().length ?? 0) > 0 && (form.shortName?.trim().length ?? 0) > 0;

  const previewCode = (form.shortName ?? '').trim() ? generateCustomerCode('platform', form.shortName!.trim(), sequence) : '—';

  const handleProvinceChange = (p: string) => setForm(prev => ({ ...prev, province: p, city: '', district: '' }));
  const handleCityChange = (c: string) => setForm(prev => ({ ...prev, city: c, district: '' }));
  const handleDistrictChange = (d: string) => setForm(prev => ({ ...prev, district: d }));

  const addBankAccount = () => {
    if (bankAccounts.length >= 5 || !newBank.accountName) return;
    setBankAccounts(prev => [...prev, { ...newBank }]);
    setNewBank({ accountName: '', accountNo: '', bankName: '', bankNo: '' });
  };
  const addInvoiceInfo = () => {
    if (invoiceInfos.length >= 5 || !newInvoice.invoiceEntity) return;
    setInvoiceInfos(prev => [...prev, { ...newInvoice }]);
    setNewInvoice({ invoiceEntity: '', taxNo: '', taxRate: '' });
  };

  const handleSave = () => {
    if (!canSave) return;
    const shortName = form.shortName!.trim();
    const code = generateCustomerCode('platform', shortName, sequence);
    onSave({
      id: `p_${Date.now()}`, name: form.name!, shortName, code,
      contactPerson: form.contactPerson ?? '', contactPosition: form.contactPosition ?? '', contactPhone: form.contactPhone ?? '', contactAddress: form.contactAddress ?? '',
      province: form.province ?? '', city: form.city ?? '', district: form.district ?? '',
      cooperationDate: form.cooperationDate ?? new Date().toISOString().slice(0, 10),
      deposit: form.deposit, depositDueDate: form.depositDueDate || undefined,
      bankAccounts, invoiceInfos, status: 'active', remark: form.remark, developerId: form.developerId, developerType: form.developerType, developerName: form.developerName,
    } as PlatformItem);
  };

  return (
    <div className="drawer-overlay" onClick={onCancel}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">新增平台客户</span>
          <button className="drawer-close" onClick={onCancel}><svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
        </div>
        <div className="drawer-body">
          <SectionTitle>基本信息</SectionTitle>
          <div style={grid2}>
            <Field label="平台名称 *"><input className="filter-input" style={{ width: '100%' }} value={form.name ?? ''} onChange={e => update('name', e.target.value)} placeholder="请输入平台全称" /></Field>
            <Field label="平台简称 *"><input className="filter-input" style={{ width: '100%' }} value={form.shortName ?? ''} onChange={e => update('shortName', e.target.value)} placeholder="如：京东慧采" /></Field>
            <Field label="平台编号（自动生成）" full><input className="filter-input" style={{ width: '100%' }} value={previewCode} readOnly placeholder="输入平台简称后自动生成" /></Field>
            <Field label="联系人"><input className="filter-input" style={{ width: '100%' }} value={form.contactPerson ?? ''} onChange={e => update('contactPerson', e.target.value)} /></Field>
            <Field label="联系人职务"><input className="filter-input" style={{ width: '100%' }} value={form.contactPosition ?? ''} onChange={e => update('contactPosition', e.target.value)} placeholder="如：采购总监" /></Field>
            <Field label="拓客人" full>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <select className="filter-select" style={{ width: 120 }} value={form.developerType ?? ''} onChange={(e) => { update('developerType', (e.target.value || undefined) as PersonRoleType | undefined); update('developerId', undefined); update('developerName', undefined); }}>
                  <option value="">请选择</option>
                  {Object.entries(PERSON_TYPE_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
                {form.developerType ? (
                  <select className="filter-select" style={{ flex: 1 }} value={form.developerId ?? ''} onChange={(e) => {
                    const person = getAllPersonOptions().find(p => p.id === e.target.value);
                    update('developerId', e.target.value || undefined);
                    update('developerName', person?.name || undefined);
                  }}>
                    <option value="">请选择</option>
                    {getAllPersonOptions().filter(p => p.type === form.developerType).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', padding: '0 var(--space-3)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>请先选择类型</div>
                )}
              </div>
            </Field>
            <Field label="联系电话"><input className="filter-input" style={{ width: '100%' }} value={form.contactPhone ?? ''} onChange={e => update('contactPhone', e.target.value)} /></Field>
          </div>

          <SectionTitle>所在地区</SectionTitle>
          <div style={grid2}>
            <Field label="省份"><select className="filter-select" style={{ width: '100%' }} value={form.province ?? ''} onChange={e => handleProvinceChange(e.target.value)}><option value="">请选择</option>{PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}</select></Field>
            <Field label="城市"><select className="filter-select" style={{ width: '100%' }} value={form.city ?? ''} disabled={!form.province} onChange={e => handleCityChange(e.target.value)}><option value="">请选择</option>{(form.province ? getCityNames(form.province) : []).map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="区县"><select className="filter-select" style={{ width: '100%' }} value={form.district ?? ''} disabled={!form.city} onChange={e => handleDistrictChange(e.target.value)}><option value="">请选择</option>{(form.province && form.city ? getDistricts(form.province, form.city) : []).map(d => <option key={d} value={d}>{d}</option>)}</select></Field>
            <Field label="具体地址"><input className="filter-input" style={{ width: '100%' }} value={form.contactAddress ?? ''} onChange={e => update('contactAddress', e.target.value)} placeholder="街道、门牌号等" /></Field>
            <Field label="合作日期"><input className="filter-input" style={{ width: '100%' }} type="date" value={form.cooperationDate ?? ''} onChange={e => update('cooperationDate', e.target.value)} /></Field>
            <Field label="支付保证金（元）"><input className="filter-input" style={{ width: '100%' }} type="number" value={form.deposit ?? ''} onChange={e => update('deposit', e.target.value === '' ? (undefined as unknown as number) : Number(e.target.value))} placeholder="平台交纳的保证金金额" /></Field>
            <Field label="保证金应收日期"><input className="filter-input" style={{ width: '100%' }} type="date" value={form.depositDueDate ?? ''} onChange={e => update('depositDueDate', e.target.value || undefined)} /></Field>
            <Field label="备注" full><input className="filter-input" style={{ width: '100%' }} value={form.remark ?? ''} onChange={e => update('remark', e.target.value)} /></Field>
          </div>

          <SectionTitle>结算账户（{bankAccounts.length}/5）</SectionTitle>
          {bankAccounts.map((ba, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <span style={{ fontWeight: 'var(--font-medium)' }}>{ba.accountName}</span>
              <span className="mono" style={{ color: 'var(--color-neutral-500)' }}>{ba.accountNo}</span>
              <span style={{ color: 'var(--color-neutral-500)' }}>{ba.bankName}</span>
              <button style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: SECONDARY, cursor: 'pointer', fontSize: 14 }} onClick={() => setBankAccounts(prev => prev.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {bankAccounts.length < 5 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
              <div><label className="drawer-label">户名 *</label><input className="filter-input" style={{ width: '100%' }} value={newBank.accountName} onChange={e => setNewBank(prev => ({ ...prev, accountName: e.target.value }))} /></div>
              <div><label className="drawer-label">账号</label><input className="filter-input" style={{ width: '100%' }} value={newBank.accountNo} onChange={e => setNewBank(prev => ({ ...prev, accountNo: e.target.value }))} /></div>
              <div><label className="drawer-label">开户行</label><input className="filter-input" style={{ width: '100%' }} value={newBank.bankName} onChange={e => setNewBank(prev => ({ ...prev, bankName: e.target.value }))} /></div>
              <div><label className="drawer-label">行号</label><input className="filter-input" style={{ width: '100%' }} value={newBank.bankNo} onChange={e => setNewBank(prev => ({ ...prev, bankNo: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1' }}><Button size="sm" onClick={addBankAccount} disabled={!newBank.accountName}>+ 添加账户</Button></div>
            </div>
          )}

          <SectionTitle>发票信息（{invoiceInfos.length}/5）</SectionTitle>
          {invoiceInfos.map((inv, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <span style={{ fontWeight: 'var(--font-medium)' }}>{inv.invoiceEntity}</span>
              <span className="mono" style={{ color: 'var(--color-neutral-500)' }}>{inv.taxNo}</span>
              <span style={{ color: 'var(--color-neutral-500)' }}>{inv.taxRate}</span>
              <button style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: SECONDARY, cursor: 'pointer', fontSize: 14 }} onClick={() => setInvoiceInfos(prev => prev.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {invoiceInfos.length < 5 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
              <div><label className="drawer-label">发票主体 *</label><input className="filter-input" style={{ width: '100%' }} value={newInvoice.invoiceEntity} onChange={e => setNewInvoice(prev => ({ ...prev, invoiceEntity: e.target.value }))} /></div>
              <div><label className="drawer-label">税号</label><input className="filter-input" style={{ width: '100%' }} value={newInvoice.taxNo} onChange={e => setNewInvoice(prev => ({ ...prev, taxNo: e.target.value }))} /></div>
              <div><label className="drawer-label">税率</label><input className="filter-input" style={{ width: '100%' }} value={newInvoice.taxRate} onChange={e => setNewInvoice(prev => ({ ...prev, taxRate: e.target.value }))} placeholder="6%" /></div>
              <div style={{ gridColumn: '1 / -1' }}><Button size="sm" onClick={addInvoiceInfo} disabled={!newInvoice.invoiceEntity}>+ 添加发票主体</Button></div>
            </div>
          )}
        </div>
        <div className="drawer-footer">
          <Button variant="ghost" onClick={onCancel}>取消</Button>
          <Button onClick={handleSave} disabled={!canSave}>保存</Button>
        </div>
      </div>
    </div>
  );
}

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' };
function SectionTitle({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', margin: 'var(--space-4) 0 var(--space-3)' }}>{children}</div>; }
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) { return <div style={{ gridColumn: full ? '1 / -1' : undefined }}><label className="drawer-label">{label}</label>{children}</div>; }
function Text({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) { return <div className={className} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-800)', fontWeight: 'var(--font-medium)', ...style }}>{children}</div>; }
function EmptyText({ children }: { children: React.ReactNode }) { return <div style={{ padding: 'var(--space-3)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>{children}</div>; }

function IconUsers() { return <svg viewBox="0 0 18 18" fill="none"><circle cx="7" cy="6.5" r="2.8" stroke="currentColor" strokeWidth="1.3" /><path d="M1 15c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><circle cx="13" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.2" /><path d="M13 11c2 0 4 1.5 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>; }
function IconHome() { return <svg viewBox="0 0 18 18" fill="none"><path d="M3 8.5L9 3.5l6 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" /><path d="M4.5 8v7h9v-7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>; }
function IconChannel() { return <svg viewBox="0 0 18 18" fill="none"><path d="M2 10l3 2 3-4 3 5 3-3 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="4" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.3" /></svg>; }
function IconPersonal() { return <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" /><path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>; }
function IconPlatform() { return <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M6 5V3.5A1.5 1.5 0 017.5 2h3A1.5 1.5 0 0112 3.5V5" stroke="currentColor" strokeWidth="1.3" /><path d="M9 8v2M8 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>; }