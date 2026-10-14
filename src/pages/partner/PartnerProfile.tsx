import { InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill } from './PartnerUI';
import { partnerProfile } from '../../data/partner';
import { TAX_TYPE_LABELS, SETTLEMENT_METHOD_LABELS } from '../../data/suppliers';

/** 合作商系统-合作商信息：字段与淡茶半盏后台「供应商管理」的供应商档案一致 */
export default function PartnerProfile() {
  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 系统"
        title="合作商信息"
        desc="本页信息与淡茶半盏后台「采购 > 供应商管理」中的供应商档案保持一致，由终端注册创建（渠道来源：终端注册），如需修改请联系平台运营。"
      />

      <div className="pk-panel">
        {/* 基本信息 */}
        <div className="pk-section">
          <h3 className="pk-section-title">基本信息</h3>
          <InfoGrid>
            <InfoItem label="供应商名称" emph>{partnerProfile.name}</InfoItem>
            <InfoItem label="统一社会信用代码" mono>{partnerProfile.unifiedCreditCode}</InfoItem>
            <InfoItem label="公司类型">{partnerProfile.companyType}</InfoItem>
            <InfoItem label="法定代表人">{partnerProfile.legalRepresentative}</InfoItem>
            <InfoItem label="成立日期">{partnerProfile.establishmentDate}</InfoItem>
            <InfoItem label="注册资本">{partnerProfile.registeredCapital}</InfoItem>
            <InfoItem label="渠道来源"><Pill tone="green">终端注册</Pill></InfoItem>
            <InfoItem label="合作时间">{partnerProfile.cooperationDate}</InfoItem>
            <InfoItem label="税务类型">{TAX_TYPE_LABELS[partnerProfile.taxType] ?? partnerProfile.taxType}</InfoItem>
            <InfoItem label="注册地址" span={3}>{[partnerProfile.registeredProvince, partnerProfile.registeredCity, partnerProfile.registeredDistrict, partnerProfile.registeredAddress].filter(Boolean).join(' ')}</InfoItem>
            <InfoItem label="经营范围" span={3}>{partnerProfile.businessScope}</InfoItem>
          </InfoGrid>
        </div>

        {/* 联系信息 */}
        <div className="pk-section">
          <h3 className="pk-section-title">联系信息</h3>
          <InfoGrid>
            <InfoItem label="联系人">{partnerProfile.contactPerson}</InfoItem>
            <InfoItem label="联系人职务">{partnerProfile.contactPosition}</InfoItem>
            <InfoItem label="联系电话" mono>{partnerProfile.contactPhone}</InfoItem>
            <InfoItem label="联系邮箱" mono>{partnerProfile.contactEmail}</InfoItem>
            <InfoItem label="联系地址" span={3}>{[partnerProfile.contactProvince, partnerProfile.contactCity, partnerProfile.contactDistrict, partnerProfile.contactAddress].filter(Boolean).join(' ')}</InfoItem>
          </InfoGrid>
        </div>

        {/* 仓库信息 */}
        <div className="pk-section">
          <h3 className="pk-section-title">仓库信息</h3>
          {partnerProfile.warehouses.map((wh, i) => (
            <div key={wh.id} className="pk-item-row">
              <div className="pk-item-idx">{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--pk-ink)' }}>{wh.name}</span>
                  {wh.isDefault && <Pill tone="green">默认</Pill>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>
                  {[wh.province, wh.city, wh.district].filter(Boolean).join(' / ')} {wh.address}　·　{wh.contactPerson} {wh.contactPhone}
                </div>
              </div>
            </div>
          ))}
          <div className="pk-section-note">仓库信息同步自淡茶半盏后台「仓储 &gt; 仓库设置」</div>
        </div>

        {/* 资质文件 */}
        <div className="pk-section">
          <h3 className="pk-section-title">资质文件（{partnerProfile.qualificationFiles.length}/5）</h3>
          {partnerProfile.qualificationFiles.map((f, i) => (
            <div key={`${f}-${i}`} className="pk-item-row">
              <div className="pk-item-idx">
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13 }}><path d="M4 1.5h5.5L13 5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M9.5 1.5V5H13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontSize: 13.5, color: 'var(--pk-ink)' }}>{f}</span>
            </div>
          ))}
        </div>

        {/* 财务信息 */}
        <div className="pk-section">
          <h3 className="pk-section-title">财务信息</h3>
          <InfoGrid>
            <InfoItem label="结算方式">{SETTLEMENT_METHOD_LABELS[partnerProfile.settlementMethod] ?? partnerProfile.settlementMethod}</InfoItem>
            <InfoItem label="开票抬头">{partnerProfile.invoiceInfo.title}</InfoItem>
            <InfoItem label="税号" mono>{partnerProfile.invoiceInfo.taxNo}</InfoItem>
            <InfoItem label="税率" mono>{partnerProfile.invoiceInfo.taxRate}%</InfoItem>
            <InfoItem label="开票地址">{partnerProfile.invoiceInfo.address}</InfoItem>
            <InfoItem label="开票电话" mono>{partnerProfile.invoiceInfo.phone}</InfoItem>
            <InfoItem label="开户银行">{partnerProfile.bankAccount.bankName}</InfoItem>
            <InfoItem label="银行账号" mono>{partnerProfile.bankAccount.accountNo}</InfoItem>
            <InfoItem label="户名">{partnerProfile.bankAccount.accountName}</InfoItem>
            <InfoItem label="行号" mono>{partnerProfile.bankAccount.bankNo}</InfoItem>
            <InfoItem label="结算备注" span={3}>{partnerProfile.bankAccount.remark}</InfoItem>
          </InfoGrid>
        </div>

        {/* 供应商简介 */}
        <div className="pk-section">
          <h3 className="pk-section-title">供应商简介</h3>
          <div style={{ fontSize: 13.5, color: 'var(--pk-ink2)', lineHeight: 1.9 }}>
            {partnerProfile.introduction}
          </div>
        </div>
      </div>
    </div>
  );
}
