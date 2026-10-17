import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/common/BrandLogo';
import { useCustomerStore } from '../../stores/customerStore';
import { setCustomerAuth } from './CustomerUI';
import '../partner/partner.css';
import './customer.css';

/** 客户终端登录页：左侧品牌视觉 + 右侧极简表单（账号由平台管理台开通） */
export default function CustomerLogin() {
  const navigate = useNavigate();
  const login = useCustomerStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码');
      return;
    }
    const account = login(username, password);
    if (!account) {
      setError('账号或密码错误，或账号已被停用。下单账号请联系平台管理员开通');
      return;
    }
    setCustomerAuth({
      username: account.username,
      name: account.name,
      customerName: account.customerName,
      accountId: account.id,
    });
    navigate('/customer/dashboard');
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
          <div className="pk-login-brand-mark"><BrandLogo /></div>
          <div>
            <div className="pk-login-brand-name">淡茶半盏</div>
            <div className="pk-login-brand-sub">DANCHA BANZHAN</div>
          </div>
        </div>

        {/* 主视觉文案 */}
        <div className="pk-login-hero">
          <div className="pk-login-eyebrow">CUSTOMER PORTAL</div>
          <h1 className="pk-login-title">好茶直达<br />一键下单</h1>
          <div className="pk-login-desc">
            直营客户专属下单终端。在线浏览在售茶品、查询实时价格与库存，
            自助下单并全程跟踪订单配送，采购进度尽在掌握。
          </div>
        </div>

        {/* 底部特性 */}
        <div className="pk-login-feats">
          <div className="pk-login-feat">
            <div className="pk-login-feat-t">在线选品</div>
            <div className="pk-login-feat-d">七大茶类在售商品，价格库存实时同步</div>
          </div>
          <div className="pk-login-feat">
            <div className="pk-login-feat-t">自助下单</div>
            <div className="pk-login-feat-d">购物车批量选购，专属客户价自动生效</div>
          </div>
          <div className="pk-login-feat">
            <div className="pk-login-feat-t">订单跟踪</div>
            <div className="pk-login-feat-d">下单、确认、配送、签收全程可视化</div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="pk-login-main">
        <div className="pk-login-form">
          <div className="pk-login-form-eyebrow">客户终端</div>
          <h2 className="pk-login-form-title">欢迎登录</h2>
          <div className="pk-login-form-sub">使用平台管理员开通的下单账号登录，在线选购茶品</div>

          <div className="pk-login-field">
            <label className="pk-login-label">账号</label>
            <input
              className="pk-login-input"
              placeholder="请输入下单账号"
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

          <div className="pk-login-demo">演示账号 <b>hmt001</b>　密码 <b>123456</b></div>

          <button className="pk-login-back" onClick={() => navigate('/dashboard')}>
            ← 返回平台主系统
          </button>
        </div>
      </div>
    </div>
  );
}
