import { useMemo, useState } from 'react';
import Button from '../../components/common/Button';
import { InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill, getCustomerAuth } from './CustomerUI';
import { useCustomerStore } from '../../stores/customerStore';
import { customerItems } from '../../data/customers';
import '../partner/partner.css';
import './customer.css';

/** 账号信息：登录账号、关联客户档案与修改密码 */
export default function CustomerAccountPage() {
  const auth = getCustomerAuth();
  const account = useCustomerStore((s) => s.accounts.find(a => a.id === auth?.accountId));
  const changePassword = useCustomerStore((s) => s.changePassword);

  const customer = useMemo(
    () => customerItems.find(c => c.name === auth?.customerName),
    [auth?.customerName],
  );

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmitPassword = () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setMessage({ type: 'err', text: '请完整填写原密码、新密码与确认密码' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'err', text: '新密码长度至少 6 位' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'err', text: '两次输入的新密码不一致' });
      return;
    }
    const ok = auth ? changePassword(auth.username, oldPassword, newPassword) : false;
    if (!ok) {
      setMessage({ type: 'err', text: '原密码错误，请重新输入' });
      return;
    }
    setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    setMessage({ type: 'ok', text: '密码修改成功，下次登录请使用新密码' });
  };

  const fullAddress = customer
    ? `${customer.province ?? ''}${customer.city ?? ''}${customer.district ?? ''}${customer.contactAddress ?? ''}`
    : '—';

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="客户终端 · 系统"
        title="账号信息"
        desc="查看下单账号与关联客户档案。下单账号由平台管理员开通，如需停用或重置密码请联系平台管理员。"
      />

      <div className="pk-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* 账号信息 */}
        <div className="pk-panel">
          <div className="pk-section" style={{ border: 'none' }}>
            <h3 className="pk-section-title">账号信息</h3>
            <InfoGrid>
              <InfoItem label="登录账号" mono emph>{account?.username ?? '—'}</InfoItem>
              <InfoItem label="账号名称">{account?.name ?? '—'}</InfoItem>
              <InfoItem label="账号状态">
                {account && <Pill tone={account.status === 'active' ? 'green' : 'red'}>{account.status === 'active' ? '正常' : '已停用'}</Pill>}
              </InfoItem>
              <InfoItem label="联系手机" mono>{account?.phone ?? '—'}</InfoItem>
              <InfoItem label="开通时间">{account?.createTime ?? '—'}</InfoItem>
              <InfoItem label="最近登录">{account?.lastLogin ?? '—'}</InfoItem>
              <InfoItem label="关联客户" span={3}>{auth?.customerName ?? '—'}（客户编号 <span className="mono">{account?.customerCode ?? '—'}</span>）</InfoItem>
              <InfoItem label="开通备注" span={3}>{account?.remark || '—'}</InfoItem>
            </InfoGrid>
          </div>
        </div>

        {/* 关联客户档案 */}
        <div className="pk-panel">
          <div className="pk-section" style={{ border: 'none' }}>
            <h3 className="pk-section-title">关联客户档案</h3>
            <InfoGrid>
              <InfoItem label="客户名称" emph>{auth?.customerName ?? '—'}</InfoItem>
              <InfoItem label="客户等级">{customer?.level ?? '—'}</InfoItem>
              <InfoItem label="结算方式">{customer?.settlementMethod ?? '—'}</InfoItem>
              <InfoItem label="合作日期">{customer?.cooperationDate ?? '—'}</InfoItem>
              <InfoItem label="所在区域">{customer?.region ?? '—'}</InfoItem>
              <InfoItem label="联系人">{customer?.contactPerson ?? '—'}</InfoItem>
              <InfoItem label="联系地址" span={3}>{fullAddress}</InfoItem>
            </InfoGrid>
          </div>
        </div>
      </div>

      {/* 修改密码 */}
      <div className="pk-panel">
        <div className="pk-section">
          <h3 className="pk-section-title">修改密码</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, maxWidth: 760 }}>
            <div className="pk-login-field" style={{ marginBottom: 0 }}>
              <label className="pk-login-label">原密码</label>
              <input className="pk-login-input" type="password" placeholder="请输入原密码" value={oldPassword} onChange={e => { setOldPassword(e.target.value); setMessage(null); }} />
            </div>
            <div className="pk-login-field" style={{ marginBottom: 0 }}>
              <label className="pk-login-label">新密码</label>
              <input className="pk-login-input" type="password" placeholder="至少 6 位" value={newPassword} onChange={e => { setNewPassword(e.target.value); setMessage(null); }} />
            </div>
            <div className="pk-login-field" style={{ marginBottom: 0 }}>
              <label className="pk-login-label">确认新密码</label>
              <input className="pk-login-input" type="password" placeholder="再次输入新密码" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setMessage(null); }} />
            </div>
          </div>
          {message && (
            <div className="pk-login-error" style={{ marginTop: 14, maxWidth: 760 }}>
              {message.type === 'ok' ? (
                <span style={{ color: 'var(--pk-accent-dark)', background: 'var(--pk-accent-soft)', display: 'block', margin: -10, padding: 10, borderRadius: 10 }}>{message.text}</span>
              ) : message.text}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <Button onClick={handleSubmitPassword}>保存新密码</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
