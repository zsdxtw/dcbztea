import { useEffect, useMemo, useState } from 'react';
import { PageHead, Pill } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore } from '../../stores/orderFlowStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { useScoreStore } from '../../stores/scoreStore';
import { EXTERNAL_PLATFORM_LABELS } from '../../data/externalOrders';
import './partner.css';

const money = (n: number) => `¥${n.toLocaleString()}`;

/** 合作商终端 · 抢单大厅：抢单（时间优先）/ 比单报价 / 客户拜访打卡 */
export default function PartnerGrab() {
  const auth = getPartnerAuth();
  const orders = useOrderFlowStore((s) => s.orders);
  const store = useOrderFlowStore;
  const suppliers = useSupplierStore((s) => s.suppliers);
  const scoreEntries = useScoreStore((s) => s.entries);
  const addScoreEntry = useScoreStore((s) => s.addEntry);

  const [tab, setTab] = useState<'grab' | 'compare' | 'visit'>('grab');
  const [tick, setTick] = useState(Date.now());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /** 比单报价表单 */
  const [quoteOf, setQuoteOf] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');

  /** 拜访表单 */
  const [visitCustomer, setVisitCustomer] = useState('');
  const [visitNote, setVisitNote] = useState('');
  const [visitError, setVisitError] = useState('');

  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    store.getState().expireGrabs();
  }, [store]);

  const partner = auth?.supplierId
    ? suppliers.find((s) => s.id === auth.supplierId)
    : undefined;
  const myId = partner?.id ?? '';
  const myName = partner?.name ?? '';

  const grabbing = useMemo(
    () => orders.filter((o) => o.processStatus === 'grabbing'),
    [orders],
  );

  const myCompares = useMemo(
    () => orders.filter((o) => o.processStatus === 'comparing' && o.compare?.candidates.some((c) => c.supplierId === myId)),
    [orders, myId],
  );

  const myGrabs = useMemo(
    () => orders.filter((o) => o.grabRecords?.some((g) => g.supplierId === myId) || (o.partnerId === myId && o.transferSource === 'grab')),
    [orders, myId],
  );

  const myVisits = useMemo(
    () => scoreEntries.filter((e) => e.supplierId === myId && e.dimension === 'visit'),
    [scoreEntries, myId],
  );

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3200);
  };

  const countdown = (deadline: number) => {
    const remain = deadline - tick;
    if (remain <= 0) return '已截止';
    const m = Math.floor(remain / 60000);
    const s = Math.floor((remain % 60000) / 1000);
    return `${m} 分 ${String(s).padStart(2, '0')} 秒`;
  };

  const doGrab = (orderId: string) => {
    const res = store.getState().tryGrab(orderId, myId, myName);
    flash(res.ok, res.msg);
  };

  const submitMyQuote = () => {
    if (!quoteOf) return;
    const amount = Number(quoteAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      flash(false, '请输入有效的报价金额');
      return;
    }
    const res = store.getState().submitQuote(quoteOf, myId, myName, amount);
    flash(res.ok, res.msg);
    if (res.ok) setQuoteOf(null);
  };

  const submitVisit = () => {
    if (!visitCustomer.trim()) {
      setVisitError('请填写拜访客户名称');
      return;
    }
    addScoreEntry({
      supplierId: myId,
      supplierName: myName,
      dimension: 'visit',
      delta: 2,
      reason: `客户拜访（${visitCustomer.trim()}${visitNote.trim() ? ` · ${visitNote.trim()}` : ''}）`,
      operator: auth?.username ?? 'terminal',
    });
    setVisitCustomer('');
    setVisitNote('');
    setVisitError('');
    flash(true, '拜访记录已提交，积分 +2');
  };

  if (!auth || !partner) {
    return (
      <div className="pk-page">
        <PageHead eyebrow="合作商终端" title="抢单大厅" desc="请先登录合作商终端后使用抢单大厅。" />
      </div>
    );
  }

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="合作商终端 · 商机"
        title="抢单大厅"
        desc="平台外部订单分发中心：抢单先到先得；比单按「报价 + 积分 + 履约」综合评分定标；拜访客户可累积积分，积分影响比单得分。"
      />

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14, background: msg.ok ? '#E8F5E9' : '#FFEBEE', color: msg.ok ? '#01795D' : '#C62828', fontWeight: 500 }}>
          {msg.text}
        </div>
      )}

      {/* Tab */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`tab-card-simple${tab === 'grab' ? ' active' : ''}`} onClick={() => setTab('grab')}>
          可抢订单
          <span className="tab-card-simple-count">{grabbing.length} 单</span>
        </button>
        <button className={`tab-card-simple${tab === 'compare' ? ' active' : ''}`} onClick={() => setTab('compare')}>
          比单报价
          <span className="tab-card-simple-count">{myCompares.length} 单</span>
        </button>
        <button className={`tab-card-simple${tab === 'visit' ? ' active' : ''}`} onClick={() => setTab('visit')}>
          客户拜访
          <span className="tab-card-simple-count">+2 分 / 次</span>
        </button>
      </div>

      {/* ── 抢单 ── */}
      {tab === 'grab' && (
        <>
          {grabbing.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9E9E9E', fontSize: 13, background: '#fff', borderRadius: 12 }}>
              当前没有可抢订单。平台发布抢单后会第一时间出现在这里。
            </div>
          )}
          {grabbing.map((o) => {
            const remain = (o.grabDeadline ?? 0) - tick;
            const taken = (o.grabRecords?.length ?? 0) > 0;
            return (
              <div key={o.id} style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 14, border: '1px solid rgba(1,121,93,0.10)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{o.code}</span>
                      <Pill tone="amber">{EXTERNAL_PLATFORM_LABELS[o.platform]}</Pill>
                      <Pill tone={taken ? 'gray' : 'green'}>{taken ? '已被抢' : '抢单中'}</Pill>
                    </div>
                    <div style={{ fontSize: 13, color: '#6f6f6f', marginTop: 6, lineHeight: 1.8 }}>
                      客户：{o.customerName}（{o.customerRegion}）<br />
                      商品：{o.items.map((it) => `${it.productName} × ${it.quantity}`).join('、')}<br />
                      收货：{o.receiverAddress}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 20, color: '#01795D' }}>{money(o.totalAmount)}</div>
                    <div className="mono" style={{ fontSize: 13, color: remain > 0 ? '#E65100' : '#C62828', fontWeight: 600, margin: '4px 0 10px' }}>
                      {countdown(o.grabDeadline ?? 0)}
                    </div>
                    <Button size="sm" disabled={taken || remain <= 0} onClick={() => doGrab(o.id)}>
                      {taken ? `已被 ${o.grabRecords![0].supplierName} 抢先` : '立即抢单'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {myGrabs.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>我抢到的订单</div>
              <Table
                headers={['订单编号', '客户', '金额', '抢单时间', '当前状态']}
                rows={myGrabs.map((o) => [
                  <span key="c" className="mono" style={{ fontWeight: 600 }}>{o.code}</span>,
                  <span key="cu">{o.customerName}</span>,
                  <span key="a" className="mono">{money(o.totalAmount)}</span>,
                  <span key="t" className="mono">{o.grabRecords?.find((g) => g.supplierId === myId)?.grabTime ?? o.transferTime}</span>,
                  <span key="s">{o.partnerStatus === 'pending' ? '待接单' : o.partnerStatus === 'accepted' ? '已接单' : o.partnerStatus === 'shipping' ? '发货中' : o.partnerStatus === 'delivered' ? '已签收' : '已结算'}</span>,
                ])}
              />
            </div>
          )}
        </>
      )}

      {/* ── 比单报价 ── */}
      {tab === 'compare' && (
        <>
          {myCompares.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9E9E9E', fontSize: 13, background: '#fff', borderRadius: 12 }}>
              暂无邀请您比单的订单。平台发起比单后会出现在这里。
            </div>
          )}
          {myCompares.map((o) => {
            const cmp = o.compare!;
            const myQuote = cmp.quotes.find((q) => q.supplierId === myId);
            const remain = cmp.deadline - tick;
            return (
              <div key={o.id} style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 14, border: '1px solid rgba(1,121,93,0.10)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{o.code}</span>
                      <Pill tone="purple">比单 · {cmp.candidates.length} 家竞争</Pill>
                    </div>
                    <div style={{ fontSize: 13, color: '#6f6f6f', marginTop: 6, lineHeight: 1.8 }}>
                      客户：{o.customerName}（{o.customerRegion}）<br />
                      商品：{o.items.map((it) => `${it.productName} × ${it.quantity}`).join('、')}<br />
                      评分规则：报价 40% + 积分 40% + 履约 20%（报价越低得分越高）
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 20, color: '#01795D' }}>{money(o.totalAmount)}</div>
                    <div className="mono" style={{ fontSize: 13, color: remain > 0 ? '#7B1FA2' : '#C62828', fontWeight: 600, margin: '4px 0 10px' }}>
                      {countdown(cmp.deadline)}
                    </div>
                    {myQuote ? (
                      <div style={{ fontSize: 13, color: '#01795D', fontWeight: 600 }}>已报价 {money(myQuote.amount)}</div>
                    ) : quoteOf === o.id ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          className="filter-input mono"
                          style={{ width: 120 }}
                          type="number"
                          min={0}
                          placeholder="报价金额"
                          value={quoteAmount}
                          onChange={(e) => setQuoteAmount(e.target.value)}
                        />
                        <Button size="sm" disabled={remain <= 0} onClick={submitMyQuote}>提交</Button>
                      </div>
                    ) : (
                      <Button size="sm" disabled={remain <= 0} onClick={() => { setQuoteOf(o.id); setQuoteAmount(String(Math.round(o.totalAmount * 0.92))); }}>
                        我要报价
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── 客户拜访 ── */}
      {tab === 'visit' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid rgba(1,121,93,0.10)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>提交拜访记录</div>
          <div style={{ fontSize: 12, color: '#9E9E9E', marginBottom: 14 }}>每次经确认的客户拜访 +2 积分；积分是比单评分 40% 权重的数据源。</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="filter-input" style={{ width: 200 }} placeholder="拜访客户名称 *" value={visitCustomer} onChange={(e) => { setVisitCustomer(e.target.value); setVisitError(''); }} />
            <input className="filter-input" style={{ width: 320 }} placeholder="拜访说明（洽谈内容 / 跟进事项）" value={visitNote} onChange={(e) => setVisitNote(e.target.value)} />
            <Button size="sm" onClick={submitVisit}>提交（+2 分）</Button>
          </div>
          {visitError && <div style={{ fontSize: 12, color: '#C62828', marginTop: 8 }}>{visitError}</div>}

          <div style={{ fontWeight: 600, margin: '18px 0 10px', fontSize: 14 }}>我的拜访记录（{myVisits.length} 条）</div>
          <Table
            headers={['日期', '客户 / 说明', '积分']}
            rows={myVisits.slice(0, 10).map((e) => [
              <span key="t" className="mono">{e.time}</span>,
              <span key="r">{e.reason.replace('客户拜访（', '').replace('）', '')}</span>,
              <span key="d" className="mono" style={{ color: '#01795D', fontWeight: 600 }}>+{e.delta}</span>,
            ])}
          />
        </div>
      )}
    </div>
  );
}
