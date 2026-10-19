import { useMemo, useState } from 'react';
import { InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import { useSupplierStore } from '../../stores/supplierStore';
import { BrandMultiSelect, BrandAuthUploader } from '../../components/common/BrandPicker';
import { StorePhotoPicker, StorePhotoGallery } from '../../components/common/StorePhotoPicker';
import { SUPPLIER_TYPE_LABELS, SUPPLIER_TYPE_COLORS, TAX_TYPE_LABELS, SETTLEMENT_METHOD_LABELS } from '../../data/suppliers';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';
import type { SupplierItem, SupplierStore, SupplierWarehouse, BrandAuthFiles } from '../../types';
import './partner.css';

/** 设置菜单下合作商信息子页键 */
export type ProfileSectionKey = 'basic' | 'contact' | 'warehouse' | 'store' | 'qualification' | 'finance';

/** 可选资质文件（演示 mock 上传） */
const QUALIFICATION_OPTIONS = ['营业执照.pdf', '食品生产许可证.pdf', '食品经营许可证.pdf', 'SC认证证书.pdf', '质量管理体系认证.pdf', '仓储服务资质.pdf'];

/** 各子页配置：direct=true 的页面可直接修改保存，无需平台审批 */
const SECTIONS: Record<ProfileSectionKey, { title: string; desc: string; direct: boolean }> = {
  basic: {
    title: '基本信息',
    desc: '本页信息与淡茶半盏后台「采购 > 合作商管理」中的合作商档案保持一致。修改主营品牌、品牌授权资质、经营范围、合作商简介需提交申请，经平台注册审批通过后生效。',
    direct: false,
  },
  contact: {
    title: '联系信息',
    desc: '维护联系人、联系电话、联系邮箱与联系地址。联系信息可直接修改保存，无需平台审批。',
    direct: true,
  },
  warehouse: {
    title: '仓库信息',
    desc: '维护履约仓库的名称、地址与联系人。仓库信息可直接修改保存，无需平台审批。',
    direct: true,
  },
  store: {
    title: '门店信息',
    desc: '维护线下门店的地址、面积、主营品牌与门店照片。修改需提交申请，经平台注册审批通过后生效。',
    direct: false,
  },
  qualification: {
    title: '资质文件',
    desc: '维护营业执照、生产许可等资质文件（最多 5 个）。修改需提交申请，经平台注册审批通过后生效。',
    direct: false,
  },
  finance: {
    title: '财务信息',
    desc: '维护开票税号与结算银行账号。修改需提交申请，经平台注册审批通过后生效。',
    direct: false,
  },
};

const newWarehouse = (): SupplierWarehouse => ({ id: `w${Date.now()}`, name: '', address: '', contactPerson: '', contactPhone: '', isDefault: false });
const newStore = (): SupplierStore => ({ id: `st${Date.now()}`, name: '', province: '', city: '', district: '', address: '', area: 0, mainBrands: [], photos: [], status: 'active' });

/** 合作商设置-合作商信息子页：按 section 渲染单个信息分区；
 *  联系信息、仓库信息直接修改保存（免审批），其余分区提交后经平台注册审批生效 */
export default function PartnerProfile({ section }: { section: ProfileSectionKey }) {
  const auth = getPartnerAuth();
  const suppliers = useSupplierStore(s => s.suppliers);
  const approvals = useSupplierStore(s => s.approvals);
  const submitModification = useSupplierStore(s => s.submitModification);
  const updateSupplier = useSupplierStore(s => s.updateSupplier);

  const conf = SECTIONS[section];

  const supplier = useMemo(
    () => suppliers.find(s => s.id === auth?.supplierId) ?? suppliers.find(s => s.terminal.enabled && s.terminal.username === auth?.username),
    [suppliers, auth],
  );

  /** 本合作商待审批的修改申请 */
  const pendingApprovals = useMemo(
    () => approvals.filter(a => a.type === 'modify' && a.supplierId === supplier?.id && a.status === 'pending'),
    [approvals, supplier],
  );

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SupplierItem | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'saved' | 'submitted'; text: string } | null>(null);

  if (!supplier) {
    return (
      <div className="pk-page">
        <PageHead eyebrow="合作商终端 · 设置" title={conf.title} desc="未找到关联的合作商档案，请联系平台运营。" />
      </div>
    );
  }

  const startEdit = () => {
    setForm({
      ...supplier,
      warehouses: supplier.warehouses.map(w => ({ ...w })),
      stores: supplier.stores.map(st => ({ ...st })),
    });
    setNote('');
    setError('');
    setFeedback(null);
    setEditing(true);
  };

  const patch = (p: Partial<SupplierItem>) => setForm(prev => prev ? { ...prev, ...p } : prev);

  const updateWarehouse = (idx: number, p: Partial<SupplierWarehouse>) => {
    setForm(prev => prev ? { ...prev, warehouses: prev.warehouses.map((w, i) => i === idx ? { ...w, ...p } : w) } : prev);
  };
  const setDefaultWarehouse = (idx: number) => {
    setForm(prev => prev ? { ...prev, warehouses: prev.warehouses.map((w, i) => ({ ...w, isDefault: i === idx })) } : prev);
  };
  const updateStoreRow = (idx: number, p: Partial<SupplierStore>) => {
    setForm(prev => prev ? { ...prev, stores: prev.stores.map((st, i) => i === idx ? { ...st, ...p } : st) } : prev);
  };

  /** 主营品牌变更：同步裁剪品牌授权文件与门店主营品牌（保持门店品牌 ⊆ 主营品牌） */
  const handleMainBrandsChange = (next: string[]) => {
    setForm(prev => {
      if (!prev) return prev;
      const authFiles: BrandAuthFiles = {};
      next.forEach(b => { if (prev.brandAuthFiles?.[b]?.length) authFiles[b] = prev.brandAuthFiles![b]; });
      return {
        ...prev,
        mainBrands: next,
        brandAuthFiles: authFiles,
        stores: prev.stores.map(st => ({ ...st, mainBrands: st.mainBrands.filter(b => next.includes(b)) })),
      };
    });
  };

  /** 提交：direct 分区直接保存档案；其余分区提交信息修改申请 → 平台注册审批 */
  const handleSubmit = () => {
    if (!form) return;
    if (conf.direct) {
      updateSupplier(form);
      setFeedback({ kind: 'saved', text: '修改已直接保存，无需平台审批。' });
      setEditing(false);
      window.scrollTo({ top: 0 });
      return;
    }
    submitModification(form, auth?.username ?? '合作商', note.trim() || undefined);
    setFeedback({ kind: 'submitted', text: '修改申请已提交，将在平台注册审批通过后生效。' });
    setEditing(false);
    window.scrollTo({ top: 0 });
  };

  /* ── 分区内容（查看态 / 编辑态共用片段） ── */

  const basicView = (
    <>
      <InfoGrid>
        <InfoItem label="合作商名称" emph>{supplier.name}</InfoItem>
        <InfoItem label="合作商类型">
          <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
            {supplier.types.map(t => (
              <span key={t} style={{ padding: '1px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: `${SUPPLIER_TYPE_COLORS[t]}15`, color: SUPPLIER_TYPE_COLORS[t], border: `1px solid ${SUPPLIER_TYPE_COLORS[t]}30`, whiteSpace: 'nowrap' }}>{SUPPLIER_TYPE_LABELS[t] ?? t}</span>
            ))}
          </span>
        </InfoItem>
        <InfoItem label="统一社会信用代码" mono>{supplier.unifiedCreditCode}</InfoItem>
        <InfoItem label="公司类型">{supplier.companyType || '—'}</InfoItem>
        <InfoItem label="法定代表人">{supplier.legalRepresentative}</InfoItem>
        <InfoItem label="成立日期">{supplier.establishmentDate || '—'}</InfoItem>
        <InfoItem label="注册资本">{supplier.registeredCapital || '—'}</InfoItem>
        <InfoItem label="渠道来源"><Pill tone="green">终端注册</Pill></InfoItem>
        <InfoItem label="合作时间">{supplier.cooperationDate}</InfoItem>
        <InfoItem label="税务类型">{TAX_TYPE_LABELS[supplier.taxType] ?? supplier.taxType}</InfoItem>
        <InfoItem label="公司主营品牌" span={3}>
          {(supplier.mainBrands?.length ?? 0) > 0 ? (
            <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
              {supplier.mainBrands!.map(b => (
                <span key={b} style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 500, background: '#E6F2ED', border: '1px solid rgba(1,121,93,0.3)', color: '#01795D' }}>{b}</span>
              ))}
            </span>
          ) : '—'}
        </InfoItem>
        <InfoItem label="品牌授权资质" span={3}>
          {(Object.keys(supplier.brandAuthFiles ?? {}).length) > 0 ? (
            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(supplier.brandAuthFiles!).map(([brand, files]) => (
                <span key={brand} style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ padding: '1px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: '#E6F2ED', color: '#01795D' }}>{brand}</span>
                  {(files.length ? files : ['未上传']).map(f => (
                    <span key={f} style={{ padding: '1px 8px', borderRadius: 4, fontSize: 12, background: '#F4F7F6', border: '1px solid var(--pk-line2, #E4EAE8)', color: 'var(--pk-ink2)' }}>{f}</span>
                  ))}
                </span>
              ))}
            </span>
          ) : '—'}
        </InfoItem>
        <InfoItem label="注册地址" span={3}>{[supplier.registeredProvince, supplier.registeredCity, supplier.registeredDistrict, supplier.registeredAddress].filter(Boolean).join(' ')}</InfoItem>
        <InfoItem label="经营范围" span={3}>{supplier.businessScope || '—'}</InfoItem>
      </InfoGrid>
      {/* 合作商简介（归属基本信息菜单） */}
      <div className="pk-section" style={{ marginTop: 4 }}>
        <h3 className="pk-section-title">合作商简介</h3>
        <div style={{ fontSize: 13.5, color: 'var(--pk-ink2)', lineHeight: 1.9 }}>
          {supplier.introduction || '—'}
        </div>
      </div>
    </>
  );

  const contactView = (
    <InfoGrid>
      <InfoItem label="联系人">{supplier.contactPerson}</InfoItem>
      <InfoItem label="联系人职务">{supplier.contactPosition || '—'}</InfoItem>
      <InfoItem label="联系电话" mono>{supplier.contactPhone}</InfoItem>
      <InfoItem label="联系邮箱" mono>{supplier.contactEmail || '—'}</InfoItem>
      <InfoItem label="联系地址" span={3}>{[supplier.contactProvince, supplier.contactCity, supplier.contactDistrict, supplier.contactAddress].filter(Boolean).join(' ')}</InfoItem>
    </InfoGrid>
  );

  const warehouseView = (
    <>
      {supplier.warehouses.length === 0 && <div style={{ fontSize: 13, color: '#99A29D' }}>暂无仓库信息，点击「修改信息」补充维护</div>}
      {supplier.warehouses.map((wh, i) => (
        <div key={wh.id} className="pk-item-row">
          <div className="pk-item-idx">{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--pk-ink)' }}>{wh.name}</span>
              {wh.isDefault && <Pill tone="green">默认</Pill>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>
              {wh.address}　·　{wh.contactPerson} {wh.contactPhone}
            </div>
          </div>
        </div>
      ))}
    </>
  );

  const storeView = (
    <>
      {supplier.stores.length === 0 && <div style={{ fontSize: 13, color: '#99A29D' }}>暂无门店信息，点击「申请修改信息」补充维护</div>}
      {supplier.stores.map((st, i) => (
        <div key={st.id} className="pk-item-row">
          <div className="pk-item-idx">{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--pk-ink)' }}>{st.name}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>{st.area}㎡</span>
              {st.status === 'active' ? <Pill tone="green">营业中</Pill> : <Pill tone="amber">已停业</Pill>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--pk-ink3)', marginBottom: (st.photos?.length ?? 0) > 0 ? 8 : 0 }}>
              {[st.province, st.city, st.district].filter(Boolean).join(' / ')} {st.address}{st.mainBrands.length > 0 && `　·　主营：${st.mainBrands.join('、')}`}
            </div>
            {(st.photos?.length ?? 0) > 0 && <StorePhotoGallery photos={st.photos} />}
          </div>
        </div>
      ))}
    </>
  );

  const qualificationView = (
    <>
      {supplier.qualificationFiles.length === 0 && <div style={{ fontSize: 13, color: '#99A29D' }}>暂无资质文件，点击「申请修改信息」补充维护</div>}
      {supplier.qualificationFiles.map((f, i) => (
        <div key={`${f}-${i}`} className="pk-item-row">
          <div className="pk-item-idx">
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13 }}><path d="M4 1.5h5.5L13 5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M9.5 1.5V5H13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: 13.5, color: 'var(--pk-ink)' }}>{f}</span>
        </div>
      ))}
    </>
  );

  const financeView = (
    <InfoGrid>
      <InfoItem label="结算方式">{SETTLEMENT_METHOD_LABELS[supplier.settlementMethod] ?? supplier.settlementMethod}</InfoItem>
      <InfoItem label="开票抬头">{supplier.invoiceInfo.title}</InfoItem>
      <InfoItem label="税号" mono>{supplier.invoiceInfo.taxNo || '—'}</InfoItem>
      <InfoItem label="税率" mono>{supplier.invoiceInfo.taxRate}%</InfoItem>
      <InfoItem label="开户银行">{supplier.bankAccount.bankName || '—'}</InfoItem>
      <InfoItem label="银行账号" mono>{supplier.bankAccount.accountNo || '—'}</InfoItem>
      <InfoItem label="户名">{supplier.bankAccount.accountName || '—'}</InfoItem>
      <InfoItem label="行号" mono>{supplier.bankAccount.bankNo || '—'}</InfoItem>
      <InfoItem label="结算备注" span={3}>{supplier.bankAccount.remark || '—'}</InfoItem>
    </InfoGrid>
  );

  /* ── 编辑态表单（按分区） ── */

  const basicEdit = form && (
    <>
      <div className="pk-section">
        <h3 className="pk-section-title">主营品牌与品牌授权</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="pk-reg-label">公司主营品牌（品牌列表来源于平台「商品 &gt; 品牌管理」）</label>
            <BrandMultiSelect value={form.mainBrands ?? []} onChange={handleMainBrandsChange} accent="#01795D" />
            <div style={{ fontSize: 12, color: '#99A29D', marginTop: 6 }}>
              修改主营品牌需经平台审批生效；移除品牌将同步清理该品牌的授权文件与门店主营品牌
            </div>
          </div>
          <div>
            <label className="pk-reg-label">品牌授权资质</label>
            <BrandAuthUploader brands={form.mainBrands ?? []} files={form.brandAuthFiles ?? {}} onChange={next => patch({ brandAuthFiles: next })} accent="#01795D" />
          </div>
          <div>
            <label className="pk-reg-label">经营范围</label>
            <textarea className="pk-reg-textarea" value={form.businessScope} onChange={e => patch({ businessScope: e.target.value })} />
          </div>
        </div>
      </div>
      <div className="pk-section">
        <h3 className="pk-section-title">合作商简介</h3>
        <textarea className="pk-reg-textarea" style={{ minHeight: 90 }} placeholder="介绍企业情况、主营业务与合作模式" value={form.introduction} onChange={e => patch({ introduction: e.target.value })} />
      </div>
    </>
  );

  const contactEdit = form && (
    <div className="pk-section">
      <h3 className="pk-section-title">联系信息</h3>
      <div className="pk-reg-grid">
        <div>
          <label className="pk-reg-label">联系人</label>
          <input className="pk-reg-input" value={form.contactPerson} onChange={e => patch({ contactPerson: e.target.value })} />
        </div>
        <div>
          <label className="pk-reg-label">联系人职务</label>
          <input className="pk-reg-input" value={form.contactPosition} onChange={e => patch({ contactPosition: e.target.value })} />
        </div>
        <div>
          <label className="pk-reg-label">联系电话</label>
          <input className="pk-reg-input" value={form.contactPhone} onChange={e => patch({ contactPhone: e.target.value })} />
        </div>
        <div>
          <label className="pk-reg-label">联系邮箱</label>
          <input className="pk-reg-input" value={form.contactEmail} onChange={e => patch({ contactEmail: e.target.value })} />
        </div>
        <div>
          <label className="pk-reg-label">联系省份</label>
          <select className="pk-reg-select" value={form.contactProvince ?? ''} onChange={e => patch({ contactProvince: e.target.value, contactCity: '', contactDistrict: '' })}>
            <option value="">请选择</option>
            {PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="pk-reg-label">联系城市</label>
          <select className="pk-reg-select" value={form.contactCity ?? ''} disabled={!form.contactProvince} onChange={e => patch({ contactCity: e.target.value, contactDistrict: '' })}>
            <option value="">请选择</option>
            {form.contactProvince && getCityNames(form.contactProvince).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="pk-reg-label">联系区县</label>
          <select className="pk-reg-select" value={form.contactDistrict ?? ''} disabled={!form.contactCity} onChange={e => patch({ contactDistrict: e.target.value })}>
            <option value="">请选择</option>
            {form.contactProvince && form.contactCity && getDistricts(form.contactProvince, form.contactCity).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="span-3">
          <label className="pk-reg-label">联系详细地址</label>
          <input className="pk-reg-input" value={form.contactAddress} onChange={e => patch({ contactAddress: e.target.value })} />
        </div>
      </div>
    </div>
  );

  const warehouseEdit = form && (
    <div className="pk-section">
      <h3 className="pk-section-title">仓库信息</h3>
      {form.warehouses.map((w, i) => (
        <div key={w.id} className="pk-reg-item">
          <div className="pk-reg-item-idx">{i + 1}</div>
          <div className="pk-reg-item-body">
            <div className="pk-reg-grid">
              <div>
                <label className="pk-reg-label">仓库名称</label>
                <input className="pk-reg-input" value={w.name} onChange={e => updateWarehouse(i, { name: e.target.value })} />
              </div>
              <div className="span-2">
                <label className="pk-reg-label">仓库地址</label>
                <input className="pk-reg-input" value={w.address} onChange={e => updateWarehouse(i, { address: e.target.value })} />
              </div>
              <div>
                <label className="pk-reg-label">仓库联系人</label>
                <input className="pk-reg-input" value={w.contactPerson} onChange={e => updateWarehouse(i, { contactPerson: e.target.value })} />
              </div>
              <div>
                <label className="pk-reg-label">联系电话</label>
                <input className="pk-reg-input" value={w.contactPhone} onChange={e => updateWarehouse(i, { contactPhone: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#57625C', cursor: 'pointer' }}>
                  <input type="radio" checked={w.isDefault} onChange={() => setDefaultWarehouse(i)} /> 设为默认仓库
                </label>
              </div>
            </div>
          </div>
          <button className="pk-reg-item-del" onClick={() => patch({ warehouses: form.warehouses.filter((_, x) => x !== i) })}>删除</button>
        </div>
      ))}
      <button className="pk-reg-add" onClick={() => patch({ warehouses: [...form.warehouses, newWarehouse()] })}>+ 添加仓库</button>
    </div>
  );

  const storeEdit = form && (
    <div className="pk-section">
      <h3 className="pk-section-title">门店信息</h3>
      {form.stores.map((st, i) => (
        <div key={st.id} className="pk-reg-item">
          <div className="pk-reg-item-idx">{i + 1}</div>
          <div className="pk-reg-item-body">
            <div className="pk-reg-grid">
              <div>
                <label className="pk-reg-label">门店名称</label>
                <input className="pk-reg-input" value={st.name} onChange={e => updateStoreRow(i, { name: e.target.value })} />
              </div>
              <div>
                <label className="pk-reg-label">所在省份</label>
                <select className="pk-reg-select" value={st.province ?? ''} onChange={e => updateStoreRow(i, { province: e.target.value, city: '', district: '' })}>
                  <option value="">请选择</option>
                  {PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="pk-reg-label">城市</label>
                <select className="pk-reg-select" value={st.city ?? ''} disabled={!st.province} onChange={e => updateStoreRow(i, { city: e.target.value, district: '' })}>
                  <option value="">请选择</option>
                  {st.province && getCityNames(st.province).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="pk-reg-label">区县</label>
                <select className="pk-reg-select" value={st.district ?? ''} disabled={!st.city} onChange={e => updateStoreRow(i, { district: e.target.value })}>
                  <option value="">请选择</option>
                  {st.province && st.city && getDistricts(st.province, st.city).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="pk-reg-label">详细地址</label>
                <input className="pk-reg-input" value={st.address} onChange={e => updateStoreRow(i, { address: e.target.value })} />
              </div>
              <div>
                <label className="pk-reg-label">门店面积（㎡）</label>
                <input className="pk-reg-input" type="number" value={st.area || ''} onChange={e => updateStoreRow(i, { area: Number(e.target.value) || 0 })} />
              </div>
              <div className="span-2">
                <label className="pk-reg-label">门店主营品牌（可选范围不超过基本信息主营品牌）</label>
                {(form.mainBrands?.length ?? 0) > 0 ? (
                  <BrandMultiSelect value={st.mainBrands} options={form.mainBrands!} onChange={v => updateStoreRow(i, { mainBrands: v })} accent="#01795D" />
                ) : (
                  <div style={{ fontSize: 12.5, color: '#99A29D' }}>请先在「基本信息」中选择公司主营品牌</div>
                )}
              </div>
              <div>
                <label className="pk-reg-label">营业状态</label>
                <select className="pk-reg-select" value={st.status} onChange={e => updateStoreRow(i, { status: e.target.value as SupplierStore['status'] })}>
                  <option value="active">营业中</option>
                  <option value="inactive">已停业</option>
                </select>
              </div>
              <div className="span-3">
                <label className="pk-reg-label">门店照片（最多 5 张）</label>
                <StorePhotoPicker photos={st.photos ?? []} onChange={v => updateStoreRow(i, { photos: v })} accent="#01795D" />
              </div>
            </div>
          </div>
          <button className="pk-reg-item-del" onClick={() => patch({ stores: form.stores.filter((_, x) => x !== i) })}>删除</button>
        </div>
      ))}
      <button className="pk-reg-add" onClick={() => patch({ stores: [...form.stores, newStore()] })}>+ 添加门店</button>
    </div>
  );

  const qualificationEdit = form && (
    <div className="pk-section">
      <h3 className="pk-section-title">资质文件（{form.qualificationFiles.length}/5）</h3>
      <div className="pk-reg-grid" style={{ marginBottom: 12 }}>
        {QUALIFICATION_OPTIONS.map(f => (
          <button key={f} type="button" className="pk-reg-add" style={{ textAlign: 'left' }}
            onClick={() => patch({ qualificationFiles: form.qualificationFiles.includes(f) ? form.qualificationFiles.filter(x => x !== f) : [...form.qualificationFiles, f] })}>
            {form.qualificationFiles.includes(f) ? '✓ ' : '+ '}{f.replace('.pdf', '')}
          </button>
        ))}
      </div>
    </div>
  );

  const financeEdit = form && (
    <div className="pk-section">
      <h3 className="pk-section-title">财务信息</h3>
      <div className="pk-reg-grid">
        <div>
          <label className="pk-reg-label">开户银行</label>
          <input className="pk-reg-input" value={form.bankAccount.bankName} onChange={e => patch({ bankAccount: { ...form.bankAccount, bankName: e.target.value } })} />
        </div>
        <div>
          <label className="pk-reg-label">银行账号</label>
          <input className="pk-reg-input" value={form.bankAccount.accountNo} onChange={e => patch({ bankAccount: { ...form.bankAccount, accountNo: e.target.value } })} />
        </div>
        <div>
          <label className="pk-reg-label">户名</label>
          <input className="pk-reg-input" value={form.bankAccount.accountName} onChange={e => patch({ bankAccount: { ...form.bankAccount, accountName: e.target.value } })} />
        </div>
        <div>
          <label className="pk-reg-label">行号</label>
          <input className="pk-reg-input" value={form.bankAccount.bankNo} onChange={e => patch({ bankAccount: { ...form.bankAccount, bankNo: e.target.value } })} />
        </div>
        <div>
          <label className="pk-reg-label">税号</label>
          <input className="pk-reg-input" value={form.invoiceInfo.taxNo} onChange={e => patch({ invoiceInfo: { ...form.invoiceInfo, taxNo: e.target.value } })} />
        </div>
        <div>
          <label className="pk-reg-label">结算备注</label>
          <input className="pk-reg-input" value={form.bankAccount.remark} onChange={e => patch({ bankAccount: { ...form.bankAccount, remark: e.target.value } })} />
        </div>
      </div>
    </div>
  );

  /* ── 编辑态 ── */
  if (editing && form) {
    return (
      <div className="pk-page">
        <PageHead
          eyebrow="合作商终端 · 设置"
          title={`修改${conf.title}`}
          desc={conf.direct
            ? '本页内容可直接修改保存，无需平台审批。'
            : '修改内容提交后将进入平台「注册审批」流程，审批通过后自动更新合作商档案。'}
        />
        {error && <div className="pk-reg-error">{error}</div>}

        <div className="pk-panel">
          {section === 'basic' && basicEdit}
          {section === 'contact' && contactEdit}
          {section === 'warehouse' && warehouseEdit}
          {section === 'store' && storeEdit}
          {section === 'qualification' && qualificationEdit}
          {section === 'finance' && financeEdit}

          {/* 修改说明（仅需审批分区显示） + 提交 */}
          <div className="pk-section">
            {!conf.direct && (
              <>
                <h3 className="pk-section-title">修改说明</h3>
                <input className="pk-reg-input" placeholder="简要说明本次修改内容（选填）" value={note} onChange={e => setNote(e.target.value)} />
              </>
            )}
            <div className="pk-reg-footer" style={{ marginTop: 18 }}>
              <button className="pk-reg-cancel" onClick={() => setEditing(false)}>取消</button>
              <button className="pk-reg-submit" onClick={handleSubmit}>{conf.direct ? '保存' : '提交修改申请'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── 查看态 ── */
  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 设置"
        title={conf.title}
        desc={conf.desc}
        actions={<button className="pk-reg-submit" style={{ height: 38, padding: '0 22px', fontSize: 13, letterSpacing: 'normal', textIndent: 0 }} onClick={startEdit}>{conf.direct ? '修改信息' : '申请修改信息'}</button>}
      />

      {/* 保存成功 / 审批中提示 */}
      {feedback && (
        <div className="pk-register-tip" style={{ marginBottom: 16 }}>
          <b>{feedback.text}</b>
        </div>
      )}
      {!conf.direct && pendingApprovals.length > 0 && (
        <div className="pk-register-tip" style={{ marginBottom: 16 }}>
          <b>有 {pendingApprovals.length} 条信息修改申请正在平台审批中</b>（
          {pendingApprovals.map(a => a.code).join('、')}
          ）。审批通过前，本页仍显示原档案信息；请勿重复提交相同修改。
        </div>
      )}

      <div className="pk-panel">
        <div className="pk-section">
          <h3 className="pk-section-title">{conf.title}</h3>
          {section === 'basic' && basicView}
          {section === 'contact' && contactView}
          {section === 'warehouse' && warehouseView}
          {section === 'store' && storeView}
          {section === 'qualification' && qualificationView}
          {section === 'finance' && financeView}
        </div>
      </div>
    </div>
  );
}
