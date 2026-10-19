import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeaLeafMark } from './PartnerLayout';
import { useSupplierStore } from '../../stores/supplierStore';
import { BrandMultiSelect } from '../../components/common/BrandPicker';
import { PROVINCE_NAMES, getCityNames, getDistricts } from '../../data/regions';
import { SUPPLIER_TYPE_LABELS, SUPPLIER_TYPE_COLORS } from '../../data/suppliers';
import { genAdminAccount } from '../../utils/pinyinInitials';
import type { SupplierItem, SupplierType } from '../../types';
import './partner.css';

/** 资质文件区固定选项（营业执照、食品许可证）；品牌授权书随主营品牌动态出现 */
const FIXED_QUALIFICATION_OPTIONS = ['营业执照.pdf', '食品经营许可证.pdf'];
/** 品牌授权书文件名（随主营品牌生成） */
const brandAuthFileName = (brand: string) => `${brand}品牌授权书.pdf`;
/** 管理员账号初始密码 */
const INITIAL_PASSWORD = '123456';

/** 合作商终端注册页：填写合作商档案（基本信息 + 资质文件必填），提交后进入平台注册审批；
 *  管理员账号由合作商简称自动生成，仓库/门店/财务信息审批通过后在「设置」菜单维护 */
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
  /** 合作商简称（3-4 字，用于生成管理员登录账号） */
  const [shortName, setShortName] = useState('');
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
  // 主营品牌（必填，多选）
  const [mainBrands, setMainBrands] = useState<string[]>([]);
  // 资质文件（必填：固定资质 + 品牌授权书）
  const [qualificationFiles, setQualificationFiles] = useState<string[]>([]);
  // 申请说明（选填）
  const [applyNote, setApplyNote] = useState('');

  const toggleQualification = (f: string) => {
    setQualificationFiles(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  /** 主营品牌变更：同步清理已移除品牌的授权书（固定资质保留） */
  const handleMainBrandsChange = (next: string[]) => {
    setMainBrands(next);
    setQualificationFiles(prev => prev.filter(f =>
      FIXED_QUALIFICATION_OPTIONS.includes(f) || next.some(b => brandAuthFileName(b) === f),
    ));
  };

  /** 校验失败：显示顶部错误横幅并滚动到可视区 */
  const showError = (msg: string) => {
    setError(msg);
    scrollTop();
  };

  /** 校验必填项并提交注册审批；管理员账号按「简称拼音首字母大写 + 001」生成 */
  const handleSubmit = () => {
    if (types.length === 0) return showError('请选择合作商类型（品牌商 / 供应商 / 服务商）');
    if (!name.trim()) return showError('请填写合作商名称');
    if (!shortName.trim()) return showError('请填写合作商简称');
    if (shortName.trim().length < 3 || shortName.trim().length > 4) return showError('合作商简称须为 3-4 个字');
    if (!unifiedCreditCode.trim()) return showError('请填写统一社会信用代码');
    if (!legalRepresentative.trim()) return showError('请填写法定代表人');
    if (!contactPerson.trim()) return showError('请填写联系人');
    if (!contactPhone.trim()) return showError('请填写联系电话');
    if (!registeredAddress.trim()) return showError('请填写注册地址');
    if (mainBrands.length === 0) return showError('请选择公司主营品牌（来源于平台品牌管理）');
    if (qualificationFiles.length === 0) return showError('请至少选择 1 份资质文件（如营业执照）');
    if (mainBrands.some(b => !qualificationFiles.includes(brandAuthFileName(b)))) return showError('请在资质文件中勾选每个主营品牌对应的品牌授权书');

    /** 管理员登录账号：简称拼音首字母大写 + 001 */
    const username = genAdminAccount(shortName);
    const today = new Date().toISOString().slice(0, 10);
    const draft: SupplierItem = {
      id: `sup_${Date.now()}`,
      types,
      name: name.trim(),
      shortName: shortName.trim(),
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
      warehouses: [],
      stores: [],
      mainBrands,
      brandAuthFiles: Object.fromEntries(mainBrands.map(b => [b, [brandAuthFileName(b)]])),
      terminal: {
        enabled: true, username, password: INITIAL_PASSWORD, status: 'active', openTime: today,
        accounts: [{
          id: `ta_admin_${username}`, role: 'admin', username, password: INITIAL_PASSWORD,
          name: contactPerson.trim() || legalRepresentative.trim(), phone: contactPhone.trim(),
          status: 'active', createTime: today,
        }],
      },
      taxType: 'general',
      invoiceInfo: {
        title: name.trim(), taxNo: '', taxRate: 13,
        address: [registeredProvince, registeredCity, registeredDistrict, registeredAddress.trim()].filter(Boolean).join(''),
        phone: contactPhone.trim(), bankName: '', bankAccount: '',
      },
      cooperationDate: today,
      grade: 'B',
      mainCategories: [],
      introduction: '',
      settlementMethod: 'monthly',
      bankAccount: { accountName: name.trim(), accountNo: '', bankName: '', bankNo: '', remark: '' },
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

    const approval = submitRegistration(draft, username, applyNote.trim() || undefined);
    setSuccess({ code: approval.code, username });
    scrollTop(false);
  };

  const sectionTitle = (text: string, tag: '必填' | '选填' = '必填') => (
    <h3 className="pk-reg-section-title">
      {text}
      {tag === '必填'
        ? <span className="pk-reg-req">必填</span>
        : <span className="pk-reg-opt">选填</span>}
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
              以下信息请妥善保存，审批通过后即可登录合作商终端，仓库、门店、财务等信息可在「设置」菜单中维护。
            </div>
            {/* 编号 + 管理员账号 + 初始密码 信息卡 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '20px 0', textAlign: 'left' }}>
              {([
                ['合作商编号', success.code],
                ['管理员登录账号', success.username],
                ['初始密码', INITIAL_PASSWORD],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(1,121,93,0.05)', border: '1px solid rgba(1,121,93,0.15)', borderRadius: 10 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--pk-ink3)', width: 110, flexShrink: 0 }}>{label}</span>
                  <b className="mono" style={{ fontSize: 14, color: '#01795D', letterSpacing: 0.5 }}>{value}</b>
                </div>
              ))}
            </div>
            <div className="pk-reg-success-d" style={{ marginBottom: 18 }}>
              管理员账号由合作商简称自动生成，登录后可在「设置 &gt; 账号管理」中修改密码。
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
          带 * 的基本信息与资质文件为必填内容。仓库、门店、财务信息无需在本页填写，
          审批通过后登录合作商终端在「设置」菜单中维护即可。管理员登录账号将根据合作商简称自动生成。
        </div>

        {error && <div className="pk-reg-error">{error}</div>}

        {/* 基本信息（必填） */}
        <div className="pk-reg-panel">
          {sectionTitle('基本信息', '必填')}
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
              <label className="pk-reg-label">合作商简称<span className="pk-reg-star">*</span></label>
              <input className="pk-reg-input" placeholder="3-4 个字，如：云茶优选" maxLength={4} value={shortName} onChange={e => { setShortName(e.target.value); setError(''); }} />
              <div style={{ fontSize: 12, color: '#99A29D', marginTop: 6 }}>
                用于自动生成管理员登录账号（拼音首字母大写 + 001）
                {shortName.trim().length >= 3 && <span style={{ color: '#01795D', fontWeight: 600 }}>，示例：{genAdminAccount(shortName)}</span>}
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
                品牌列表来源于平台「商品 &gt; 品牌管理」，支持多选；选择后需在「资质文件」中勾选每个品牌对应的品牌授权书
              </div>
            </div>
          </div>
        </div>

        {/* 资质文件（必填：固定资质 + 品牌授权书） */}
        <div className="pk-reg-panel">
          {sectionTitle('资质文件', '必填')}
          <div className="pk-reg-grid" style={{ marginBottom: 14 }}>
            {FIXED_QUALIFICATION_OPTIONS.map(f => (
              <button key={f} type="button" className="pk-reg-add" style={{ textAlign: 'left' }}
                onClick={() => toggleQualification(f)}>
                {qualificationFiles.includes(f) ? '✓ ' : '+ '}{f.replace('.pdf', '')}
              </button>
            ))}
            {mainBrands.map(b => {
              const f = brandAuthFileName(b);
              return (
                <button key={f} type="button" className="pk-reg-add" style={{ textAlign: 'left', borderColor: qualificationFiles.includes(f) ? 'rgba(1,121,93,0.45)' : undefined }}
                  onClick={() => toggleQualification(f)}>
                  {qualificationFiles.includes(f) ? '✓ ' : '+ '}{f.replace('.pdf', '')}
                </button>
              );
            })}
          </div>
          {mainBrands.length > 0 && (
            <div style={{ fontSize: 12, color: '#99A29D', marginBottom: 10 }}>
              已选择主营品牌，请勾选各品牌对应的品牌授权书后提交
            </div>
          )}
          {qualificationFiles.length > 0 ? (
            <div className="pk-reg-files">
              {qualificationFiles.map(f => (
                <span key={f} className="pk-reg-file">
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13, color: '#01795D' }}><path d="M4 1.5h5.5L13 5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M9.5 1.5V5H13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  {f}
                  <button className="pk-reg-file-x" onClick={() => toggleQualification(f)}>×</button>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: '#99A29D' }}>请至少选择 1 份资质文件（点击上方文件类型即可添加演示文件）</div>
          )}
        </div>

        {/* 申请说明（选填） */}
        <div className="pk-reg-panel">
          {sectionTitle('申请说明', '选填')}
          <div className="pk-reg-grid">
            <div className="span-3">
              <label className="pk-reg-label">申请说明</label>
              <textarea className="pk-reg-textarea" style={{ minHeight: 70 }} placeholder="简要介绍企业情况、主营业务与合作意向" value={applyNote} onChange={e => setApplyNote(e.target.value)} />
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
