import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setPartnerAuth, TeaLeafMark } from './PartnerLayout';
import './partner.css';

/** 合作商终端登录页：左侧品牌视觉 + 右侧极简表单 */
export default function PartnerLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码');
      return;
    }
    if (password !== '123456') {
      setError('账号或密码错误（演示密码 123456）');
      return;
    }
    setPartnerAuth({ username: username.trim(), name: '陈建国' });
    navigate('/partner/dashboard');
  };

  return (
    <div className="pk-login">
      {/* 左侧品牌视觉 */}
      <div className="pk-login-side">
        {/* 背景茶叶装饰 */}
        <svg className="pk-login-leaf" viewBox="0 0 200 200" fill="none" style={{ width: 520, height: 520, right: -120, top: -120, opacity: 0.07 }}>
          <path d="M100 20C60 55 40 90 40 120a60 60 0 00120 0c0-30-20-65-40-100z" stroke="#fff" strokeWidth="2.5" />
          <path d="M100 55c-20 20-35 42-35 62a35 35 0 0070 0c0-20-15-42-35-62z" stroke="#fff" strokeWidth="2.5" />
        </svg>
        <svg className="pk-login-leaf" viewBox="0 0 200 200" fill="none" style={{ width: 380, height: 380, left: -100, bottom: -100, opacity: 0.05 }}>
          <path d="M100 20C60 55 40 90 40 120a60 60 0 00120 0c0-30-20-65-40-100z" stroke="#fff" strokeWidth="2.5" />
        </svg>

        {/* 品牌 */}
        <div className="pk-login-brand">
          <div className="pk-login-brand-mark"><TeaLeafMark /></div>
          <div>
            <div className="pk-login-brand-name">淡茶半盏</div>
            <div className="pk-login-brand-sub">DANCHA BANZHAN</div>
          </div>
        </div>

        {/* 主视觉文案 */}
        <div className="pk-login-hero">
          <div className="pk-login-eyebrow">PARTNER PORTAL</div>
          <h1 className="pk-login-title">携手同行<br />茶香致远</h1>
          <div className="pk-login-desc">
            合作商专属工作终端。承接平台订单分发，经营本地客户关系，
            报备商机与商品，按月清晰结算，与淡茶半盏共同服务每一位爱茶之人。
          </div>
        </div>

        {/* 底部特性 */}
        <div className="pk-login-feats">
          <div className="pk-login-feat">
            <div className="pk-login-feat-t">订单履约</div>
            <div className="pk-login-feat-d">直送 / 入库双配送，供应商与服务商双模式</div>
          </div>
          <div className="pk-login-feat">
            <div className="pk-login-feat-t">客户营销</div>
            <div className="pk-login-feat-d">可下单商品与价差空间一目了然</div>
          </div>
          <div className="pk-login-feat">
            <div className="pk-login-feat-t">清晰结算</div>
            <div className="pk-login-feat-d">发货订单按月汇总，费用透明</div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="pk-login-main">
        <div className="pk-login-form">
          <div className="pk-login-form-eyebrow">合作商终端</div>
          <h2 className="pk-login-form-title">欢迎登录</h2>
          <div className="pk-login-form-sub">使用合作商账号登录，处理订单、客户与结算事务</div>

          <div className="pk-login-field">
            <label className="pk-login-label">账号</label>
            <input
              className="pk-login-input"
              placeholder="请输入账号"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
            />
          </div>
          <div className="pk-login-field">
            <label className="pk-login-label">密码</label>
            <input
              className="pk-login-input"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && <div className="pk-login-error">{error}</div>}

          <button className="pk-login-btn" onClick={handleLogin} style={{ marginTop: error ? 0 : 8 }}>
            登 录
          </button>

          <div className="pk-login-demo">演示账号 <b>admin</b>　密码 <b>123456</b></div>

          <button className="pk-login-back" onClick={() => navigate('/dashboard')}>
            ← 返回平台主系统
          </button>
        </div>
      </div>
    </div>
  );
}
