import { useEffect, useMemo, useState } from 'react';
import { PageHead, Pill } from './PartnerUI';
import { getPartnerAuth } from './PartnerLayout';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useOrderFlowStore, getPartnerSystemQuote } from '../../stores/orderFlowStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { useScoreStore } from '../../stores/scoreStore';
import { EXTERNAL_PLATFORM_LABELS } from '../../data/externalOrders';
import { partnerInRegion, type ExternalOrder, type RegionScope } from '../../types';
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
  /** 按商品抢单/比单报名：各订单勾选的商品（缺省=全部可选商品） */
  const [grabSel, setGrabSel] = useState<Record<string, string[]>>({});
  const [quoteSel, setQuoteSel] = useState<Record<string, string[]>>({});

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

  /** 地区范围命中：抢单/比单可限定省市县，范围外合作商不可见 */
  const inMyRegion = (o: ExternalOrder) => partnerInRegion(partner, o.grabRegion ?? o.compare?.region as RegionScope | undefined);

  const grabbing = useMemo(
    () => orders.filter((o) => o.processStatus === 'grabbing' && inMyRegion(o)),
    [orders, partner],
  );

  /** 比单：公开报名制，地区范围内的进行中比单均可报名 */
  const myCompares = useMemo(
    () => orders.filter((o) => o.processStatus === 'comparing' && inMyRegion(o)),
    [orders, partner],
  );

  /** 地区范围说明（卡片展示） */
  const scopeNote = (scope?: RegionScope) => {
    const text = scope ? [scope.province, scope.city, scope.district].filter(Boolean).join(' ') : '';
    return text ? `限 ${text} 地区合作商` : '';
  };

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

  const doGrab = (orderId: string, itemNames: string[]) => {
    const res = store.getState().tryGrab(orderId, myId, myName, itemNames);
    flash(res.ok, res.msg);
  };

  const submitMyQuote = () => {
    if (!quoteOf) return;
    const amount = Number(quoteAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      flash(false, '请输入有效的报名报价');
      return;
    }
    const order = orders.find((o) => o.id === quoteOf);
    const sel = quoteSel[quoteOf] ?? order?.items.map((it) => it.productName) ?? [];
    if (sel.length === 0) {
      flash(false, '请选择要报名的商品');
      return;
    }
    const res = store.getState().signUpCompare(quoteOf, myId, myName, amount, sel);
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
        desc="平台外部订单分发中心：抢单按商品先到先得，已被抢商品不再展示；比单按商品报名、按积分排名定标；拜访客户可累积积分，积分影响比单排名。"
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
            const takenNames = new Set((o.grabRecords ?? []).flatMap((g) => g.items ?? []));
            const avail = o.items.filter((it) => !takenNames.has(it.productName));
            const sel = (grabSel[o.id] ?? avail.map((it) => it.productName)).filter((n) => avail.some((it) => it.productName === n));
            const grabbedCount = o.items.length - avail.length;
            const done = avail.length === 0;
            return (
              <div key={o.id} style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 14, border: '1px solid rgba(1,121,93,0.10)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{o.code}</span>
                      <Pill tone="amber">{EXTERNAL_PLATFORM_LABELS[o.platform]}</Pill>
                      <Pill tone={done ? 'gray' : 'green'}>{done ? '已抢完' : '抢单中'}</Pill>
                      {grabbedCount > 0 && <Pill tone="gray">已有 {grabbedCount} 种商品被抢</Pill>}
                    </div>
                    <div style={{ fontSize: 13, color: '#6f6f6f', marginTop: 6, lineHeight: 1.8 }}>
                      客户：{o.customerName}（{o.customerRegion}）<br />
                      收货：{o.receiverAddress}
                      {scopeNote(o.grabRegion) && <><br /><span style={{ color: '#00838F' }}>参与范围：{scopeNote(o.grabRegion)}</span></>}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {avail.length === 0
                        ? <span style={{ fontSize: 13, color: '#99A29D' }}>商品已全部被抢，订单将按合作商分拆转出。</span>
                        : avail.map((it) => (
                          <label key={it.productName} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1E2622', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={sel.includes(it.productName)}
                              onChange={() => setGrabSel((prev) => ({ ...prev, [o.id]: sel.includes(it.productName) ? sel.filter((n) => n !== it.productName) : [...sel, it.productName] }))}
                            />
                            {it.productName}（{it.spec}）× {it.quantity} · <span className="mono">{money(it.price * it.quantity)}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 20, color: '#01795D' }}>{money(o.totalAmount)}</div>
                    <div className="mono" style={{ fontSize: 13, color: remain > 0 ? '#E65100' : '#C62828', fontWeight: 600, margin: '4px 0 10px' }}>
                      {countdown(o.grabDeadline ?? 0)}
                    </div>
                    <Button size="sm" disabled={done || remain <= 0 || sel.length === 0} onClick={() => doGrab(o.id, sel)}>
                      {done ? '已抢完' : sel.length === 0 ? '请选择商品' : `立即抢单（${sel.length} 种）`}
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
              暂无进行中的比单。平台发起比单后可在限期内报名。
            </div>
          )}
          {myCompares.map((o) => {
            const cmp = o.compare!;
            const myQuote = cmp.quotes.find((q) => q.supplierId === myId);
            const remain = cmp.deadline - tick;
            const sel = quoteSel[o.id] ?? o.items.map((it) => it.productName);
            const selItems = o.items.filter((it) => sel.includes(it.productName));
            return (
              <div key={o.id} style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 14, border: '1px solid rgba(1,121,93,0.10)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{o.code}</span>
                      <Pill tone="purple">比单 · 公开报名</Pill>
                    </div>
                    <div style={{ fontSize: 13, color: '#6f6f6f', marginTop: 6, lineHeight: 1.8 }}>
                      客户：{o.customerName}（{o.customerRegion}）<br />
                      定标规则：按商品维度，各商品由报名合作商中<strong>积分排名第一</strong>者中单<br />
                      <span style={{ color: '#B26A00' }}>{cmp.floorNote}（按所选商品金额占比折算）</span>
                      {scopeNote(cmp.region) && <><br /><span style={{ color: '#00838F' }}>参与范围：{scopeNote(cmp.region)}</span></>}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {o.items.map((it) => (
                        <label key={it.productName} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1E2622', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={sel.includes(it.productName)}
                            onChange={() => setQuoteSel((prev) => ({ ...prev, [o.id]: sel.includes(it.productName) ? sel.filter((n) => n !== it.productName) : [...sel, it.productName] }))}
                          />
                          {it.productName}（{it.spec}）× {it.quantity} · <span className="mono">{money(it.price * it.quantity)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 20, color: '#01795D' }}>{money(o.totalAmount)}</div>
                    <div className="mono" style={{ fontSize: 13, color: remain > 0 ? '#7B1FA2' : '#C62828', fontWeight: 600, margin: '4px 0 10px' }}>
                      {countdown(cmp.deadline)}
                    </div>
                    {myQuote ? (
                      <div style={{ fontSize: 13, color: '#01795D', fontWeight: 600 }}>
                        已报名 · 报价 {money(myQuote.amount)}<br />
                        <span style={{ fontSize: 12, color: '#57625C', fontWeight: 400 }}>商品：{(myQuote.items ?? []).join('、') || '整单'}</span>
                      </div>
                    ) : quoteOf === o.id ? (
                      <div>
                        <div style={{ fontSize: 12, color: '#57625C', marginBottom: 6 }}>所选 {selItems.length} 种商品</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                          <input
                            className="filter-input mono"
                            style={{ width: 130 }}
                            type="number"
                            min={0}
                            placeholder="报名报价"
                            value={quoteAmount}
                            onChange={(e) => setQuoteAmount(e.target.value)}
                          />
                          <Button size="sm" disabled={remain <= 0 || selItems.length === 0} onClick={submitMyQuote}>提交报名</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" disabled={remain <= 0} onClick={() => { setQuoteOf(o.id); setQuoteAmount(String(getPartnerSystemQuote(myId, selItems.length > 0 ? selItems : o.items))); }}>
                        我要报名
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
