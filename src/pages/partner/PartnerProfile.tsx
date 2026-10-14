import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { partnerProfile } from '../../data/partner';
import { TAX_TYPE_LABELS, SETTLEMENT_METHOD_LABELS } from '../../data/suppliers';

/** 合作商系统-合作商信息：字段与淡茶半盏后台「供应商管理」的供应商档案一致 */
export default function PartnerProfile() {
  return (
    <>
      <ContentHeader title="合作商信息" breadcrumbs={['合作商终端', '系统', '合作商信息']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)' }}>
          本页信息与淡茶半盏后台「采购 &gt; 供应商管理」中的供应商档案保持一致，由终端注册创建（渠道来源：终端注册），如需修改请联系平台运营。
        </div>

        <Card>
          {/* 基本信息 */}
          <div className="drawer-section-title" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>基本信息</div>
          <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-5)' }}>
            <InfoGrid>
              <InfoItem label="供应商名称" emph>{partnerProfile.name}</InfoItem>
              <InfoItem label="统一社会信用代码" mono>{partnerProfile.unifiedCreditCode}</InfoItem>
              <InfoItem label="公司类型">{partnerProfile.companyType}</InfoItem>
              <InfoItem label="法定代表人">{partnerProfile.legalRepresentative}</InfoItem>
              <InfoItem label="成立日期">{partnerProfile.establishmentDate}</InfoItem>
              <InfoItem label="注册资本">{partnerProfile.registeredCapital}</InfoItem>
              <InfoItem label="渠道来源">
                <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#E8F5E9', color: '#01795D' }}>终端注册</span>
              </InfoItem>
              <InfoItem label="合作时间">{partnerProfile.cooperationDate}</InfoItem>
              <InfoItem label="税务类型">{TAX_TYPE_LABELS[partnerProfile.taxType] ?? partnerProfile.taxType}</InfoItem>
              <InfoItem label="注册地址" span={3}>{[partnerProfile.registeredProvince, partnerProfile.registeredCity, partnerProfile.registeredDistrict, partnerProfile.registeredAddress].filter(Boolean).join(' ')}</InfoItem>
              <InfoItem label="经营范围" span={3}>{partnerProfile.businessScope}</InfoItem>
            </InfoGrid>
          </div>
        </Card>

        <div style={{ height: 'var(--space-5)' }} />

        <Card>
          {/* 联系信息 */}
          <div className="drawer-section-title" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>联系信息</div>
          <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-5)' }}>
            <InfoGrid>
              <InfoItem label="联系人">{partnerProfile.contactPerson}</InfoItem>
              <InfoItem label="联系人职务">{partnerProfile.contactPosition}</InfoItem>
              <InfoItem label="联系电话" mono>{partnerProfile.contactPhone}</InfoItem>
              <InfoItem label="联系邮箱" mono>{partnerProfile.contactEmail}</InfoItem>
              <InfoItem label="联系地址" span={3}>{[partnerProfile.contactProvince, partnerProfile.contactCity, partnerProfile.contactDistrict, partnerProfile.contactAddress].filter(Boolean).join(' ')}</InfoItem>
            </InfoGrid>
          </div>
        </Card>

        <div style={{ height: 'var(--space-5)' }} />

        <Card>
          {/* 仓库信息 */}
          <div className="drawer-section-title" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>仓库信息</div>
          <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-5)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {partnerProfile.warehouses.map((wh, i) => (
                <div key={wh.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-module-current-lightest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
                      <span style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{wh.name}</span>
                      {wh.isDefault && <span style={{ padding: '0 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', background: '#E8F5E9', color: '#2E7D32' }}>默认</span>}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                      {[wh.province, wh.city, wh.district].filter(Boolean).join(' / ')} {wh.address} ｜ {wh.contactPerson} {wh.contactPhone}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 4 }}>仓库信息同步自淡茶半盏后台「仓储 &gt; 仓库设置」</div>
            </div>
          </div>
        </Card>

        <div style={{ height: 'var(--space-5)' }} />

        <Card>
          {/* 资质文件 */}
          <div className="drawer-section-title" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>资质文件（{partnerProfile.qualificationFiles.length}/5）</div>
          <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-5)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {partnerProfile.qualificationFiles.map((f, i) => (
                <div key={`${f}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, color: 'var(--color-module-current-base)', flexShrink: 0 }}><path d="M4 1.5h5.5L13 5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M9.5 1.5V5H13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div style={{ height: 'var(--space-5)' }} />

        <Card>
          {/* 财务信息 */}
          <div className="drawer-section-title" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>财务信息</div>
          <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-5)' }}>
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
        </Card>

        <div style={{ height: 'var(--space-5)' }} />

        <Card>
          <div className="drawer-section-title" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>供应商简介</div>
          <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', lineHeight: 1.8 }}>
            {partnerProfile.introduction}
          </div>
        </Card>
      </div>
    </>
  );
}
