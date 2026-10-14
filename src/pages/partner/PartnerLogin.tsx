import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setPartnerAuth } from './PartnerLayout';

/** 合作商终端登录页（翡翠绿主题） */
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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #01795D 0%, #026A50 55%, #01543F 100%)', position: 'relative', overflow: 'hidden',
    }}>
      {/* 背景装饰茶叶图形 */}
      <svg viewBox="0 0 200 200" fill="none" style={{ position: 'absolute', width: 420, height: 420, right: -80, top: -80, opacity: 0.08 }}>
        <path d="M100 20C60 55 40 90 40 120a60 60 0 00120 0c0-30-20-65-40-100z" stroke="#fff" strokeWidth="3" />
        <path d="M100 55c-20 20-35 42-35 62a35 35 0 0070 0c0-20-15-42-35-62z" stroke="#fff" strokeWidth="3" />
      </svg>
      <svg viewBox="0 0 200 200" fill="none" style={{ position: 'absolute', width: 320, height: 320, left: -60, bottom: -60, opacity: 0.06 }}>
        <path d="M100 20C60 55 40 90 40 120a60 60 0 00120 0c0-30-20-65-40-100z" stroke="#fff" strokeWidth="3" />
      </svg>

      {/* 登录卡片 */}
      <div style={{
        width: 400, background: '#fff', borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0, 60, 45, 0.35)', padding: '40px 36px', position: 'relative', zIndex: 1,
      }}>
        {/* 品牌 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8, color: '#01795D' }}>
          <svg viewBox="0 0 28 28" fill="none" style={{ width: 36, height: 36 }}>
            <path d="M14 3C9 7 6 11 6 15a8 8 0 0016 0c0-4-3-8-8-12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M14 10c-2 2-3.5 4-3.5 6a3.5 3.5 0 007 0c0-2-1.5-4-3.5-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-neutral-800)' }}>淡茶半盏 · 合作商终端</span>
        </div>
        <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 28 }}>
          订单履约 · 客户营销 · 报备结算
        </div>

        {/* 账号 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', marginBottom: 6 }}>账号</label>
          <input
            className="filter-input"
            placeholder="请输入账号"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
            style={{ width: '100%', height: 38 }}
          />
        </div>
        {/* 密码 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', marginBottom: 6 }}>密码</label>
          <input
            className="filter-input"
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', height: 38 }}
          />
        </div>
        {error && (
          <div style={{ padding: '8px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
            {error}
          </div>
        )}
        <button
          onClick={handleLogin}
          style={{
            width: '100%', height: 40, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #01795D, #026A50)', color: '#fff',
            fontSize: 'var(--text-base)', fontWeight: 600, letterSpacing: 2,
          }}
        >
          登 录
        </button>
        <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 16 }}>
          演示账号 admin　密码 123456
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: 'var(--color-neutral-400)', fontSize: 'var(--text-xs)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            返回平台主系统
          </button>
        </div>
      </div>
    </div>
  );
}
