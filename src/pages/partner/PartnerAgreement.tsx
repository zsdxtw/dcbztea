import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeaLeafMark } from './PartnerLayout';
import './partner.css';

/**
 * 合作商入驻协议（演示条款文本，正式版由法务提供替换）
 * 结构：总则 / 合作模式 / 入驻与资质 / 订单与履约 / 结算与费用 / 违约与退出 / 附则
 */
const AGREEMENT_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: '一、总则',
    items: [
      '1. 本协议是您（以下简称"合作商"）与淡茶半盏平台（以下简称"平台"）之间关于入驻平台、使用平台合作商工作台及相关服务所订立的协议。',
      '2. 合作商在平台上以独立经营主体身份开展业务，双方不构成劳动、合伙、代理或合资关系。',
      '3. 平台有权根据业务发展对本协议及平台规则进行修订，修订后的内容将在平台内公示，公示期满继续使用平台服务即视为接受修订。',
    ],
  },
  {
    title: '二、合作模式',
    items: [
      '1. 合作商分为品牌商与供应商/服务商两类，可按实际业务能力选择入驻类型。',
      '2. 平台向合作商分发销售订单，合作商按订单要求完成供货、直发客户或入库交付。',
      '3. 合作商可参与平台组织的产品报备、商机报备与比单报名，按平台规则获取订单机会。',
      '4. 合作商应保证报价、可供货数量等信息真实有效；因信息不实导致的订单延误或损失由合作商承担。',
    ],
  },
  {
    title: '三、入驻与资质',
    items: [
      '1. 合作商应提交真实、合法、有效的企业信息与资质文件（营业执照、食品经营许可证、品牌授权书等）。',
      '2. 平台对入驻申请进行审核，审核通过后合作商档案生效并可登录合作商工作台。',
      '3. 合作商信息（联系人、仓库、门店、结算账户等）发生变更的，应及时在「设置」菜单中提交变更申请。',
      '4. 合作商不得将账号出借、转让给任何第三方使用；因账号保管不善造成的损失由合作商自行承担。',
    ],
  },
  {
    title: '四、订单与履约',
    items: [
      '1. 合作商接单后应按订单约定的商品、数量、时限完成履约；无法履约的应在规定时限内拒绝或说明，超时未响应平台有权收回订单。',
      '2. 合作商发货应如实登记物流信息，保证发货数量与质量与订单一致。',
      '3. 因商品质量、错发漏发等原因发生客户退货的，按平台售后规则处理，责任方承担相应损失。',
    ],
  },
  {
    title: '五、结算与费用',
    items: [
      '1. 平台按合作商完成交付的订单金额生成应付结算，按结算周期与合作商对账。',
      '2. 对账确认后平台按约定账期付款；合作商应提供合法有效的增值税发票。',
      '3. 因合作商违约产生的质量扣款、违约金等，平台有权在应付款中直接抵扣。',
    ],
  },
  {
    title: '六、违约与退出',
    items: [
      '1. 合作商存在虚假报备、恶意抢单比单、以次充好、泄露平台商业信息等行为的，平台有权视情节采取警告、扣分、暂停接单、清退等措施。',
      '2. 合作商可申请退出平台；退出前应完成全部在途订单履约并结清对账款项。',
      '3. 合作商连续 90 天无履约记录且经平台提醒仍未恢复的，平台有权冻结其接单资格。',
    ],
  },
  {
    title: '七、附则',
    items: [
      '1. 本协议未尽事宜按平台规则执行；平台规则与本协议不一致的，以公示在后的为准。',
      '2. 因本协议产生的争议，双方应友好协商解决；协商不成的，提交平台所在地有管辖权的人民法院诉讼解决。',
      '3. 本协议自合作商勾选同意并提交注册申请之日起生效。',
    ],
  },
];

interface Props {
  /** 点击「下一步」进入注册表单 */
  onAgree: () => void;
}

/** 合作商注册 · 协议阅读与同意页（注册第一步：阅读协议 → 勾选同意 → 下一步进入注册表单） */
export default function PartnerAgreement({ onAgree }: Props) {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  /** 是否滚动到协议底部（阅读完成提示） */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readDone, setReadDone] = useState(false);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || readDone) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setReadDone(true);
  };

  useEffect(() => {
    const el = scrollRef.current;
    // 内容不足一屏时直接视为已读
    if (el && el.scrollHeight <= el.clientHeight + 40) setReadDone(true);
  }, []);

  return (
    <div className="pk-register">
      <div className="pk-register-inner">
        {/* 头部品牌 + 返回（与注册页一致） */}
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

        <h1 className="pk-register-title">合作商入驻协议</h1>
        <p className="pk-register-desc">
          申请入驻前，请仔细阅读以下协议内容。阅读完成后勾选「我已阅读并同意本协议」，点击「下一步」进入注册信息填写。
        </p>

        {/* 步骤指示 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          {[
            ['1', '阅读协议', true],
            ['2', '填写注册信息', false],
            ['3', '提交平台审批', false],
          ].map(([n, label, active], i) => (
            <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {i > 0 && <span style={{ width: 40, height: 1, background: 'rgba(1,121,93,0.25)' }} />}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12.5, fontWeight: active ? 600 : 400,
                color: active ? '#01795D' : '#88948E',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                  background: active ? '#01795D' : 'rgba(1,121,93,0.1)', color: active ? '#fff' : '#88948E',
                }}>{n}</span>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* 协议正文（滚动阅读区） */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          style={{
            maxHeight: 420, overflowY: 'auto', padding: '20px 24px',
            background: '#fff', border: '1px solid rgba(1,121,93,0.16)', borderRadius: 12,
            boxShadow: '0 1px 3px rgba(30,38,34,0.05)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1E2622', letterSpacing: '0.05em' }}>淡茶半盏合作商入驻协议</div>
            <div style={{ fontSize: 11.5, color: '#88948E', marginTop: 4 }}>更新日期：2026-11-01　生效日期：2026-11-01</div>
          </div>
          {AGREEMENT_SECTIONS.map((sec) => (
            <div key={sec.title} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E2622', marginBottom: 6 }}>{sec.title}</div>
              {sec.items.map((it) => (
                <p key={it.slice(0, 12)} style={{ fontSize: 12.5, color: '#3D4A44', lineHeight: 1.9, margin: '0 0 6px' }}>{it}</p>
              ))}
            </div>
          ))}
          <div style={{ textAlign: 'center', fontSize: 11.5, color: '#88948E', padding: '6px 0 2px' }}>— 协议正文结束 —</div>
        </div>

        {/* 勾选同意 + 下一步 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#3D4A44' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#01795D', cursor: 'pointer' }}
            />
            我已完整阅读并理解上述协议内容，同意本协议全部条款
          </label>
          <span style={{ fontSize: 12, color: readDone ? '#01795D' : '#88948E' }}>
            {readDone ? '✓ 已阅读至协议末尾' : '请滚动阅读至协议末尾'}
          </span>
        </div>
        {!agreed && (
          <div style={{ fontSize: 12, color: '#88948E', marginTop: 8 }}>
            同意协议后方可进入下一步；注册即视为以合作商主体身份接受本协议约束。
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <button
            className="pk-reg-submit"
            style={{ padding: '0 56px', opacity: agreed ? 1 : 0.45, cursor: agreed ? 'pointer' : 'not-allowed' }}
            disabled={!agreed}
            onClick={() => agreed && onAgree()}
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
}
