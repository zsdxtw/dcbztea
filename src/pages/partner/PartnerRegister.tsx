import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeaLeafMark } from './PartnerLayout';
import { useSupplierStore } from '../../stores/supplierStore';
import { BrandMultiSelect, BrandAuthUploader } from '../../components/common/BrandPicker';
import { StorePhotoPicker } from '../../components/common/StorePhotoPicker';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';
import { SUPPLIER_TYPE_LABELS, SUPPLIER_TYPE_COLORS } from '../../data/suppliers';
import type { SupplierItem, SupplierType, SupplierWarehouse, SupplierStore, BrandAuthFiles } from '../../types';
import './partner.css';

/** 可选资质文件（演示 mock 上传） */
const QUALIFICATION_OPTIONS = ['营业执照.pdf', '食品生产许可证.pdf', '食品经营许可证.pdf', 'SC认证证书.pdf', '质量管理体系认证.pdf', '品牌授权书.pdf'];

interface RegWarehouseDraft { id: string; name: string; address: string; contactPerson: string; contactPhone: string; }
interface RegStoreDraft { id: string; name: string; province: string; city: string; district: string; address: string; area: number; mainBrands: string[]; photos: string[]; }

const EMPTY_WAREHOUSE: RegWarehouseDraft = { id: '', name: '', address: '', contactPerson: '', contactPhone: '' };
const EMPTY_STORE: RegStoreDraft = { id: '', name: '', province: '', city: '', district: '', address: '', area: 0, mainBrands: [], photos: [] };

const newWarehouse = (): RegWarehouseDraft => ({ ...EMPTY_WAREHOUSE, id: `w${Date.now()}` });
const newStore = (): RegStoreDraft => ({ ...EMPTY_STORE, id: `st${Date.now()}` });

/** 合作商终端注册页：填写供应商档案（基本信息 + 资质文件必填），提交后进入平台注册审批 */
export default function PartnerRegister() {
  const navigate = useNavigate();
  const submitRegistration = useSupplierStore(s => s.submitRegistration);
  /** 注册页滚动容器（body 全局 overflow:hidden，滚动发生在本容器上） */
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTop = (smooth = true) => scrollRef.current?.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ code: string; username: string } | null>(null);

  // 基本信息（必填）
  const [name, setName] = useState('');
  /** 合作商类型（可多选：品牌商与供应商/服务商互斥） */
  const [types, setTypes] = useState<SupplierType[]>(['supplier']);
  const [unifiedCreditCode, setUnifiedCreditCode] = useState('');
  const [legalRepresentative, setLegalRepresentative] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [registeredProvince, setRegisteredProvince] = useState('');
  const [registeredCity, setRegisteredCity] = useState('');
  const [registeredDistrict, setRegisteredDistrict] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [businessScope, setBusinessScope] = useState('');
  // 主营品牌（必填，多选）+ 品牌授权资质（按品牌上传）
  const [mainBrands, setMainBrands] = useState<string[]>([]);
  const [brandAuthFiles, setBrandAuthFiles] = useState<BrandAuthFiles>({});
  // 资质文件（必填）
  const [qualificationFiles, setQualificationFiles] = useState<string[]>([]);
  // 终端账号（必填）
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [applyNote, setApplyNote] = useState('');
  // 仓库信息（选填）
  const [warehouses, setWarehouses] = useState<RegWarehouseDraft[]>([]);
  // 门店信息（选填）
  const [stores, setStores] = useState<RegStoreDraft[]>([]);
  // 财务信息（选填）
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [taxNo, setTaxNo] = useState('');

  const updateWarehouse = (idx: number, patch: Partial<RegWarehouseDraft>) => {
    setWarehouses(prev => prev.map((w, i) => i === idx ? { ...w, ...patch } : w));
  };
  const updateStoreRow = (idx: number, patch: Partial<RegStoreDraft>) => {
    setStores(prev => prev.map((st, i) => i === idx ? { ...st, ...patch } : st));
  };

  const toggleQualification = (f: string) => {
    setQualificationFiles(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  /** 主营品牌变更：同步裁剪品牌授权文件与门店主营品牌（保持门店品牌 ⊆ 主营品牌） */
  const handleMainBrandsChange = (next: string[]) => {
    setMainBrands(next);
    setBrandAuthFiles(prev => {
      const cleaned: BrandAuthFiles = {};
      next.forEach(b => { if (prev[b]?.length) cleaned[b] = prev[b]; });
      return cleaned;
    });
    setStores(prev => prev.map(st => ({ ...st, mainBrands: st.mainBrands.filter(b => next.includes(b)) })));
  };

  /** 校验失败：显示顶部错误横幅并滚动到可视区 */
  const showError = (msg: string) => {
    setError(msg);
    scrollTop();
  };

  /** 校验必填项并提交注册审批 */
  const handleSubmit = () => {
    if (types.length === 0) return showError('请选择合作商类型（品牌商 / 供应商 / 服务商）');
    if (!name.trim()) return showError('请填写合作商名称');
    if (!unifiedCreditCode.trim()) return showError('请填写统一社会信用代码');
    if (!legalRepresentative.trim()) return showError('请填写法定代表人');
    if (!contactPerson.trim()) return showError('请填写联系人');
    if (!contactPhone.trim()) return showError('请填写联系电话');
    if (!registeredAddress.trim()) return showError('请填写注册地址');
    if (mainBrands.length === 0) return showError('请选择公司主营品牌（来源于平台品牌管理）');
    if (mainBrands.some(b => !(brandAuthFiles[b]?.length))) return showError('每个主营品牌均需上传对应的授权资质文件');
    if (qualificationFiles.length === 0) return showError('请至少上传 1 份资质文件（如营业执照）');
    if (!username.trim()) return showError('请设置终端登录账号');
    if (!password.trim()) return showError('请设置登录密码');

    const today = new Date().toISOString().slice(0, 10);
    const draft: SupplierItem = {
      id: `sup_${Date.now()}`,
      types,
      name: name.trim(),
      unifiedCreditCode: unifiedCreditCode.trim(),
      cooperationAgreements: [],
      brandAuthAgreements: [],
      businessLicense: qualificationFiles[0],
      qualificationFiles,
      channelSource: 'terminal',
      registeredProvince,
      registeredCity,
      registeredDistrict,
      registeredAddress: registeredAddress.trim(),
      legalRepresentative: legalRepresentative.trim(),
      establishmentDate: '',
      registeredCapital: '',
      companyType: '',
      businessScope: businessScope.trim(),
      contactPerson: contactPerson.trim(),
      contactPosition: '',
      contactProvince: registeredProvince,
      contactCity: registeredCity,
      contactDistrict: registeredDistrict,
      contactAddress: registeredAddress.trim(),
      contactPhone: contactPhone.trim(),
      contactEmail: '',
      warehouses: warehouses.filter(w => w.name.trim()).map<SupplierWarehouse>((w, i) => ({
        id: w.id, name: w.name.trim(), address: w.address.trim(),
        contactPerson: w.contactPerson.trim(), contactPhone: w.contactPhone.trim(), isDefault: i === 0,
      })),
      stores: stores.filter(st => st.name.trim()).map<SupplierStore>(st => ({
        id: st.id, name: st.name.trim(), province: st.province, city: st.city, district: st.district,
        address: st.address.trim(), area: st.area || 0,
        mainBrands: st.mainBrands.filter(b => mainBrands.includes(b)),
        photos: st.photos,
        status: 'active',
      })),
      mainBrands,
      brandAuthFiles,
      terminal: {
        enabled: true, username: username.trim(), password: password.trim(), status: 'active', openTime: today,
        accounts: [{
          id: `ta_admin_${username.trim()}`, role: 'admin', username: username.trim(), password: password.trim(),
          name: contactPerson.trim() || legalRepresentative.trim(), phone: contactPhone.trim(),
          status: 'active', createTime: today,
        }],
      },
      taxType: 'general',
      invoiceInfo: {
        title: name.trim(), taxNo: taxNo.trim(), taxRate: 13,
        address: [registeredProvince, registeredCity, registeredDistrict, registeredAddress.trim()].filter(Boolean).join(''),
        phone: contactPhone.trim(), bankName: bankName.trim(), bankAccount: accountNo.trim(),
      },
      cooperationDate: today,
      grade: 'B',
      mainCategories: [],
      introduction: '',
      settlementMethod: 'monthly',
      bankAccount: { accountName: accountName.trim() || name.trim(), accountNo: accountNo.trim(), bankName: bankName.trim(), bankNo: '', remark: '' },
      shippingSettlement: 'not_free_fixed',
      supportDropship: false,
      qualificationStatus: 'pending',
      paymentTerms: '月结30天',
      deliveryCycle: '5-7个工作日',
      minOrderAmount: 0,
      returnPolicy: '',
      qualityGuarantee: '',
      remark: '合作商终端注册',
      status: 'active',
    };

    const approval = submitRegistration(draft, username.trim(), applyNote.trim() || undefined);
    setSuccess({ code: approval.code, username: username.trim() });
    scrollTop(false);
  };

  const sectionTitle = (text: string, required: boolean) => (
    <h3 className="pk-reg-section-title">
      {text}
      {required
        ? <span className="pk-reg-req">必填</span>
        : <span className="pk-reg-opt">选填 · 可审批后在合作商终端维护</span>}
    </h3>
  );

  if (success) {
    return (
      <div className="pk-register" ref={scrollRef}>
        <div className="pk-register-inner">
          <div className="pk-reg-success">
            <div className="pk-reg-success-icon">
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 30, height: 30 }}><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="pk-reg-success-t">注册申请已提交</div>
            <div className="pk-reg-success-d">
              审批编号 <b className="mono">{success.code}</b> 已进入平台「注册审批」流程，
              审批通过后您的合作商档案将自动创建，<br />
              即可使用账号 <b className="mono">{success.username}</b> 登录合作商终端，
              维护仓库、门店与财务等补充信息。
            </div>
            <button className="pk-reg-submit" style={{ padding: '0 40px', letterSpacing: 'normal', textIndent: 0 }} onClick={() => navigate('/partner/login')}>
              返回登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pk-register" ref={scrollRef}>
      <div className="pk-register-inner">
        {/* 头部品牌 + 返回 */}
        <div className="pk-register-head">
          <div className="pk-register-brand">
            <div className="pk-register-brand-mark"><TeaLeafMark /></div>
            <div>
              <div className="pk-register-brand-name">淡茶半盏</div>
              <div className="pk-register-brand-sub">PARTNER REGISTER</div>
            </div>
          </div>
          <button className="pk-register-back" onClick={() => navigate('/partner/login')}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            返回登录
          </button>
        </div>

        <h1 className="pk-register-title">合作商入驻注册</h1>
        <p className="pk-register-desc">
          填写企业信息提交入驻申请，平台审批通过后即可承接订单分发、客户经营与月度结算。
        </p>
        <div className="pk-register-tip">
          带 * 的基本信息与资质文件为必填内容；仓库、门店、财务信息可先不填写，
          待注册审批通过后，登录合作商终端在「设置」菜单中继续维护。其中联系信息、仓库信息可直接修改，
          其余分区维护后需平台审批生效。
        </div>

        {error && <div className="pk-reg-error">{error}</div>}

        {/* 基本信息（必填） */}
        <div className="pk-reg-panel">
          {sectionTitle('基本信息', true)}
          <div className="pk-reg-grid">
            <div>
              <label className="pk-reg-label">合作商名称<span className="pk-reg-star">*</span></label>
              <input className="pk-reg-input" placeholder="企业全称" value={name} onChange={e => { setName(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="pk-reg-label">合作商类型<span className="pk-reg-star">*</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['brand', 'supplier', 'service'] as SupplierType[]).map(t => {
                  const checked = types.includes(t);
                  const disabled = !checked && types.includes('brand') && t !== 'brand';
                  return (
                    <label key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#57625C', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={e => setTypes(prev => {
                          if (e.target.checked) {
                            if (t === 'brand') return ['brand'];
                            return [...prev.filter(x => x !== 'brand'), t];
                          }
                          return prev.filter(x => x !== t);
                        })}
                      />
                      <span style={{ padding: '1px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: `${SUPPLIER_TYPE_COLORS[t]}15`, color: SUPPLIER_TYPE_COLORS[t], border: `1px solid ${SUPPLIER_TYPE_COLORS[t]}30`, whiteSpace: 'nowrap' }}>{SUPPLIER_TYPE_LABELS[t]}</span>
                      <span style={{ fontSize: 12, color: '#99A29D' }}>
                        {t === 'brand' ? '品牌拥有方，平台直接合作' : t === 'supplier' ? '差价模式：平台按价格采购，背对背销售' : '扣点模式：在售价基础上收取服务费，差价由服务商获得'}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: '#99A29D', marginTop: 6 }}>
                可同时是供应商与服务商；品牌商为品牌拥有方，与供应商/服务商互斥
              </div>
            </div>
            <div>
              <label className="pk-reg-label">统一社会信用代码<span className="pk-reg-star">*</span></label>
              <input className="pk-reg-input" placeholder="18 位信用代码" value={unifiedCreditCode} onChange={e => { setUnifiedCreditCode(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="pk-reg-label">法定代表人<span className="pk-reg-star">*</span></label>
              <input className="pk-reg-input" placeholder="法定代表人姓名" value={legalRepresentative} onChange={e => { setLegalRepresentative(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="pk-reg-label">联系人<span className="pk-reg-star">*</span></label>
              <input className="pk-reg-input" placeholder="业务联系人" value={contactPerson} onChange={e => { setContactPerson(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="pk-reg-label">联系电话<span className="pk-reg-star">*</span></label>
              <input className="pk-reg-input" placeholder="手机或座机" value={contactPhone} onChange={e => { setContactPhone(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="pk-reg-label">省份</label>
              <select className="pk-reg-select" value={registeredProvince} onChange={e => { setRegisteredProvince(e.target.value); setRegisteredCity(''); setRegisteredDistrict(''); }}>
                <option value="">请选择</option>
                {PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="pk-reg-label">城市</label>
              <select className="pk-reg-select" value={registeredCity} disabled={!registeredProvince} onChange={e => { setRegisteredCity(e.target.value); setRegisteredDistrict(''); }}>
                <option value="">请选择</option>
                {registeredProvince && getCityNames(registeredProvince).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="pk-reg-label">区县</label>
              <select className="pk-reg-select" value={registeredDistrict} disabled={!registeredCity} onChange={e => setRegisteredDistrict(e.target.value)}>
                <option value="">请选择</option>
                {registeredProvince && registeredCity && getDistricts(registeredProvince, registeredCity).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="span-3">
              <label className="pk-reg-label">注册详细地址<span className="pk-reg-star">*</span></label>
              <input className="pk-reg-input" placeholder="街道、门牌号" value={registeredAddress} onChange={e => { setRegisteredAddress(e.target.value); setError(''); }} />
            </div>
            <div className="span-3">
              <label className="pk-reg-label">经营范围</label>
              <textarea className="pk-reg-textarea" placeholder="如：茶叶种植、加工、销售" value={businessScope} onChange={e => setBusinessScope(e.target.value)} />
            </div>
            <div className="span-3">
              <label className="pk-reg-label">公司主营品牌<span className="pk-reg-star">*</span></label>
              <BrandMultiSelect value={mainBrands} onChange={handleMainBrandsChange} accent="#01795D" />
              <div style={{ fontSize: 12, color: '#99A29D', marginTop: 6 }}>
                品牌列表来源于平台「商品 &gt; 品牌管理」，支持多选；选择后需为每个品牌上传对应的授权资质文件
              </div>
            </div>
            <div className="span-3">
              <label className="pk-reg-label">品牌授权资质<span className="pk-reg-star">*</span></label>
              <BrandAuthUploader brands={mainBrands} files={brandAuthFiles} onChange={setBrandAuthFiles} accent="#01795D" />
            </div>
          </div>
        </div>

        {/* 资质文件（必填） */}
        <div className="pk-reg-panel">
          {sectionTitle('资质文件', true)}
          <div className="pk-reg-grid" style={{ marginBottom: 14 }}>
            {QUALIFICATION_OPTIONS.map(f => (
              <button key={f} type="button" className="pk-reg-add" style={{ textAlign: 'left' }}
                onClick={() => toggleQualification(f)}>
                {qualificationFiles.includes(f) ? '✓ ' : '+ '}{f.replace('.pdf', '')}
              </button>
            ))}
          </div>
          {qualificationFiles.length > 0 ? (
            <div className="pk-reg-files">
              {qualificationFiles.map(f => (
                <span key={f} className="pk-reg-file">
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13, color: '#01795D' }}><path d="M4 1.5h5.5L13 5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  {f}
                  <button className="pk-reg-file-x" onClick={() => toggleQualification(f)}>×</button>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: '#99A29D' }}>请至少选择 1 份资质文件（点击上方文件类型即可添加演示文件）</div>
          )}
        </div>

        {/* 终端登录账号（必填） */}
        <div className="pk-reg-panel">
          {sectionTitle('终端登录账号', true)}
          <div className="pk-reg-grid">
            <div>
              <label className="pk-reg-label">登录账号<span className="pk-reg-star">*</span></label>
              <input className="pk-reg-input" placeholder="审批通过后用于登录合作商终端" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="pk-reg-label">登录密码<span className="pk-reg-star">*</span></label>
              <input className="pk-reg-input" type="password" placeholder="设置密码" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />
            </div>
            <div className="span-3" style={{ gridColumn: 'span 1' }}>
              <label className="pk-reg-label">申请说明</label>
              <input className="pk-reg-input" placeholder="简要介绍企业情况（选填）" value={applyNote} onChange={e => setApplyNote(e.target.value)} />
            </div>
          </div>
        </div>

        {/* 仓库信息（选填） */}
        <div className="pk-reg-panel">
          {sectionTitle('仓库信息', false)}
          {warehouses.map((w, i) => (
            <div key={w.id} className="pk-reg-item">
              <div className="pk-reg-item-idx">{i + 1}</div>
              <div className="pk-reg-item-body">
                <div className="pk-reg-grid">
                  <div>
                    <label className="pk-reg-label">仓库名称</label>
                    <input className="pk-reg-input" placeholder="如：华东中心仓" value={w.name} onChange={e => updateWarehouse(i, { name: e.target.value })} />
                  </div>
                  <div className="span-2">
                    <label className="pk-reg-label">仓库地址</label>
                    <input className="pk-reg-input" placeholder="省市区 + 详细地址" value={w.address} onChange={e => updateWarehouse(i, { address: e.target.value })} />
                  </div>
                  <div>
                    <label className="pk-reg-label">仓库联系人</label>
                    <input className="pk-reg-input" placeholder="选填" value={w.contactPerson} onChange={e => updateWarehouse(i, { contactPerson: e.target.value })} />
                  </div>
                  <div>
                    <label className="pk-reg-label">联系电话</label>
                    <input className="pk-reg-input" placeholder="选填" value={w.contactPhone} onChange={e => updateWarehouse(i, { contactPhone: e.target.value })} />
                  </div>
                </div>
              </div>
              <button className="pk-reg-item-del" onClick={() => setWarehouses(prev => prev.filter((_, x) => x !== i))}>删除</button>
            </div>
          ))}
          <button className="pk-reg-add" onClick={() => setWarehouses(prev => [...prev, newWarehouse()])}>+ 添加仓库</button>
        </div>

        {/* 门店信息（选填） */}
        <div className="pk-reg-panel">
          {sectionTitle('门店信息', false)}
          {stores.map((st, i) => (
            <div key={st.id} className="pk-reg-item">
              <div className="pk-reg-item-idx">{i + 1}</div>
              <div className="pk-reg-item-body">
                <div className="pk-reg-grid">
                  <div>
                    <label className="pk-reg-label">门店名称</label>
                    <input className="pk-reg-input" placeholder="如：品牌体验店" value={st.name} onChange={e => updateStoreRow(i, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className="pk-reg-label">所在省份</label>
                    <select className="pk-reg-select" value={st.province} onChange={e => updateStoreRow(i, { province: e.target.value, city: '', district: '' })}>
                      <option value="">请选择</option>
                      {PROVINCE_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="pk-reg-label">城市</label>
                    <select className="pk-reg-select" value={st.city} disabled={!st.province} onChange={e => updateStoreRow(i, { city: e.target.value, district: '' })}>
                      <option value="">请选择</option>
                      {st.province && getCityNames(st.province).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="pk-reg-label">区县</label>
                    <select className="pk-reg-select" value={st.district} disabled={!st.city} onChange={e => updateStoreRow(i, { district: e.target.value })}>
                      <option value="">请选择</option>
                      {st.province && st.city && getDistricts(st.province, st.city).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="pk-reg-label">详细地址</label>
                    <input className="pk-reg-input" placeholder="街道、门牌号" value={st.address} onChange={e => updateStoreRow(i, { address: e.target.value })} />
                  </div>
                  <div>
                    <label className="pk-reg-label">门店面积（㎡）</label>
                    <input className="pk-reg-input" type="number" placeholder="如：200" value={st.area || ''} onChange={e => updateStoreRow(i, { area: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="span-3">
                    <label className="pk-reg-label">门店主营品牌（可选范围不超过基本信息主营品牌）</label>
                    {mainBrands.length > 0 ? (
                      <BrandMultiSelect value={st.mainBrands} options={mainBrands} onChange={v => updateStoreRow(i, { mainBrands: v })} accent="#01795D" />
                    ) : (
                      <div style={{ fontSize: 12.5, color: '#99A29D' }}>请先在上方「基本信息」中选择公司主营品牌</div>
                    )}
                  </div>
                  <div className="span-3">
                    <label className="pk-reg-label">门店照片（最多 5 张，选填）</label>
                    <StorePhotoPicker photos={st.photos} onChange={v => updateStoreRow(i, { photos: v })} accent="#01795D" />
                  </div>
                </div>
              </div>
              <button className="pk-reg-item-del" onClick={() => setStores(prev => prev.filter((_, x) => x !== i))}>删除</button>
            </div>
          ))}
          <button className="pk-reg-add" onClick={() => setStores(prev => [...prev, newStore()])}>+ 添加门店</button>
        </div>

        {/* 财务信息（选填） */}
        <div className="pk-reg-panel">
          {sectionTitle('财务信息', false)}
          <div className="pk-reg-grid">
            <div>
              <label className="pk-reg-label">开户银行</label>
              <input className="pk-reg-input" placeholder="如：招商银行杭州滨江支行" value={bankName} onChange={e => setBankName(e.target.value)} />
            </div>
            <div>
              <label className="pk-reg-label">银行账号</label>
              <input className="pk-reg-input" placeholder="对公账户账号" value={accountNo} onChange={e => setAccountNo(e.target.value)} />
            </div>
            <div>
              <label className="pk-reg-label">户名</label>
              <input className="pk-reg-input" placeholder="默认为企业名称" value={accountName} onChange={e => setAccountName(e.target.value)} />
            </div>
            <div>
              <label className="pk-reg-label">税号</label>
              <input className="pk-reg-input" placeholder="开票税号" value={taxNo} onChange={e => setTaxNo(e.target.value)} />
            </div>
          </div>
        </div>

        {/* 提交 */}
        <div className="pk-reg-footer">
          <button className="pk-reg-cancel" onClick={() => navigate('/partner/login')}>取消</button>
          <button className="pk-reg-submit" onClick={handleSubmit}>提交注册申请</button>
        </div>
      </div>
    </div>
  );
}
