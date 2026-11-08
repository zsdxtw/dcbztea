import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSelfopAuth, SELFOP_ACCOUNTS, type SelfopAuth } from './SelfopLayout';
import '../partner/partner.css';

/**
 * 自营工作台登录页：左侧品牌视觉 + 右侧极简表单（参照合作商工作台）
 * 演示账号为自营运营人员（persona）：登录后接单默认带出该跟单人。
 */
export default function SelfopLogin() {
  const navigate = useNavigate();
  useEffect(() => { document.title = '淡茶半盏 — 自营工作台'; }, []);
  const [username, setUsername] = useState('zy01');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码');
      return;
    }
    const acc = SELFOP_ACCOUNTS.find((a) => a.username === username.trim());
    if (!acc) {
      setError('账号不存在，请使用自营运营账号登录');
      return;
    }
    if (password.trim() !== acc.password) {
      setError('账号或密码错误');
      return;
    }
    setSelfopAuth({ username: acc.username, name: acc.name, role: acc.role });
    navigate('/selfop/dashboard');
  };

  const quickLogin = (acc: (typeof SELFOP_ACCOUNTS)[number]) => {
    setSelfopAuth({ username: acc.username, name: acc.name, role: acc.role });
    navigate('/selfop/dashboard');
  };

  return (
    <div className="pk-login">
      {/* 左侧品牌视觉（销售模块茶金主色） */}
      <div className="pk-login-side" style={{ background: 'linear-gradient(160deg, #8A6A1F 0%, #6B5316 55%, #4A3A10 100%)' }}>
        <svg className="pk-login-leaf" viewBox="0 0 200 200" fill="none" style={{ width: 520, height: 520, right: -120, top: -120, opacity: 0.07 }}>
          <path d="M100 20C60 55 40 90 40 120a60 60 0 00120 0c0-30-20-65-40-100z" stroke="#fff" strokeWidth="2.5" />
          <path d="M100 55c-20 20-35 42-35 62a35 35 0 0070 0c0-20-15-42-35-62z" stroke="#fff" strokeWidth="2.5" />
        </svg>
        <svg className="pk-login-leaf" viewBox="0 0 200 200" fill="none" style={{ width: 380, height: 380, left: -100, bottom: -100, opacity: 0.05 }}>
          <path d="M100 20C60 55 40 90 40 120a60 60 0 00120 0c0-30-20-65-40-100z" stroke="#fff" strokeWidth="2.5" />
        </svg>

        <div className="pk-login-brand">
          <div className="pk-login-brand-mark"><svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22, color: '#fff' }}><path d="M10 2c3 4 5 7.5 5 10.5a5 5 0 11-10 0C5 9.5 7 6 10 2z" stroke="currentColor" strokeWidth="1.5"/><path d="M10 8v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></div>
          <div>
            <div className="pk-login-brand-name">淡茶半盏</div>
            <div className="pk-login-brand-sub">DANCHA BANZHAN</div>
          </div>
        </div>

        <div className="pk-login-hero">
          <div className="pk-login-eyebrow">SELF-OPERATED WORKBENCH</div>
          <h1 className="pk-login-title">以销定采<br />直发天下</h1>
          <div className="pk-login-desc">
            自营运营专属工作台。承接平台分发转自营的销售单，接单后分仓直发、
            缺口以销定采，全程跟踪物流妥投与客户确认收货，结算清晰透明。
          </div>
        </div>

        <div className="pk-login-feats">
          <div className="pk-login-feat">
            <div className="pk-login-feat-t">接单执行</div>
            <div className="pk-login-feat-d">待接单一键接单 / 退回分发</div>
          </div>
          <div className="pk-login-feat">
            <div className="pk-login-feat-t">分仓发货</div>
            <div className="pk-login-feat-d">各仓独立快递单号，缺口以销定采</div>
          </div>
          <div className="pk-login-feat">
            <div className="pk-login-feat-t">物流结算</div>
            <div className="pk-login-feat-d">妥投跟踪 · 确认收货 · 采购结算联动</div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="pk-login-main">
        <div className="pk-login-form">
          <div className="pk-login-form-eyebrow">自营工作台</div>
          <h2 className="pk-login-form-title">欢迎登录</h2>
          <div className="pk-login-form-sub">使用自营运营账号登录，处理自营订单接单、发货、采购与结算</div>

          <div className="pk-login-field">
            <label className="pk-login-label">账号</label>
            <input
              className="pk-login-input"
              placeholder="请输入账号"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
            />
          </div>
          <div className="pk-login-field">
            <label className="pk-login-label">密码</label>
            <input
              className="pk-login-input"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && <div className="pk-login-error">{error}</div>}

          <button className="pk-login-btn" onClick={handleLogin} style={{ marginTop: error ? 0 : 8 }}>
            登 录
          </button>

          <div className="pk-login-demo">演示账号 <b>zy01 / 123456</b></div>

          {/* 快捷演示登录：选择运营人员身份（接单默认带出该跟单人） */}
          <div className="pk-login-demo" style={{ marginBottom: 6 }}>或选择身份快捷进入：</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {SELFOP_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                onClick={() => quickLogin(acc)}
                style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-0)', fontSize: 12, cursor: 'pointer', color: '#8A6A1F' }}
                title={`${acc.role} · ${acc.username}`}
              >
                {acc.name}
              </button>
            ))}
          </div>

          <button className="pk-login-back" onClick={() => navigate('/dashboard')}>
            ← 返回管理后台
          </button>
        </div>
      </div>
    </div>
  );
}

export type { SelfopAuth };
