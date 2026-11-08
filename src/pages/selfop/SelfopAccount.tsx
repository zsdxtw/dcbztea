import { useNavigate } from 'react-router-dom';
import { PageHead } from '../partner/PartnerUI';
import { getSelfopAuth, clearSelfopAuth, SELFOP_ACCOUNTS } from './SelfopLayout';
import { useMyFollowCount } from './selfopShared';

/** 自营工作台 · 设置：当前运营人员（persona）信息、切换身份、退出登录 */
export default function SelfopAccount() {
  const navigate = useNavigate();
  const auth = getSelfopAuth();
  const myOrders = useMyFollowCount(auth?.name);

  const switchAccount = (name: string) => {
    const acc = SELFOP_ACCOUNTS.find((a) => a.name === name);
    if (!acc) return;
    localStorage.setItem('selfopAuth', JSON.stringify({ username: acc.username, name: acc.name, role: acc.role }));
    navigate('/selfop/dashboard');
  };

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="设置"
        title="账号信息"
        desc={<>当前登录的自营运营人员（persona）：接单时默认带出该跟单人</>}
      />

      <div className="pk-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* 当前账号 */}
        <div className="pk-panel">
          <div className="pk-panel-head"><span className="pk-panel-title">当前账号</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 2px' }}>
            <div className="pk-avatar" style={{ width: 46, height: 46, fontSize: 18 }}>{auth?.name.charAt(0) ?? '—'}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{auth?.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--color-neutral-500)' }}>{auth?.role} · 账号 {auth?.username}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 13, color: 'var(--color-neutral-600)' }}>
            <span>跟单中：<b className="mono">{myOrders}</b> 单</span>
            <span>终端：<b>自营工作台</b></span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="pk-link" onClick={() => navigate('/selfop/dashboard')}>返回工作台</button>
            <button
              onClick={() => { clearSelfopAuth(); navigate('/selfop/login'); }}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #F3C7CD', background: '#FFF8F9', color: '#C13A54', fontSize: 13, cursor: 'pointer' }}
            >
              退出登录
            </button>
          </div>
        </div>

        {/* 切换身份（演示） */}
        <div className="pk-panel">
          <div className="pk-panel-head"><span className="pk-panel-title">切换运营人员（演示）</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SELFOP_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                onClick={() => switchAccount(acc.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${auth?.username === acc.username ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                  background: auth?.username === acc.username ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                }}
              >
                <div className="pk-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{acc.name.charAt(0)}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{acc.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-neutral-500)' }}>{acc.role} · {acc.username}</div>
                </div>
                {auth?.username === acc.username && <span className="pk-tag">当前</span>}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-neutral-400)', lineHeight: 1.6 }}>
            演示环境账号密码统一为 123456；正式环境由管理后台「系统 → 用户管理」统一开通自营运营账号。
          </div>
        </div>
      </div>
    </div>
  );
}
