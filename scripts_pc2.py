# -*- coding: utf-8 -*-
"""1.报品报(调)价列表加左右滑动 2.客户池品牌栏参照报品报价(A-Z分组+字母导航,标题改商品品牌)"""
import io

# ── 1. SalesPricing: 列表容器 overflowX ──
p = 'src/pages/sales/SalesPricing.tsx'
s = io.open(p, encoding='utf-8').read()
def rep(old, new, tag=''):
    global s
    assert old in s, f'SP NOT FOUND [{tag}]: ' + old[:70]
    s = s.replace(old, new, 1)

rep("""          <div style={{ border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>""",
    """          <div style={{ border: '1px solid var(--color-neutral-100)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {/* 列表支持左右滑动（列多时横向滚动） */}""", 'wrapper-open')
# 找到列表容器的关闭（分页前）加横向滚动 div：更简单的方式——给表格容器套 overflowX div
rep("""            <table className="detail-inline-table" style={{ border: 'none' }}>
              <thead>
                <tr>
                  <th style={{ width: 44 }}>序号</th><th style={{ width: 82 }}>图片</th><th>商品名称</th><th>品牌 / 规格</th><th>状态</th><th>市场价</th><th>进货价</th><th>销售报价</th>""",
    """            <div style={{ overflowX: 'auto' }}>
            <table className="detail-inline-table" style={{ border: 'none', minWidth: 1280 }}>
              <thead>
                <tr>
                  <th style={{ width: 44 }}>序号</th><th style={{ width: 82 }}>图片</th><th>商品名称</th><th>品牌 / 规格</th><th>状态</th><th>市场价</th><th>进货价</th><th>销售报价</th>""", 'table-open')
# 表格结束处（配额器前的 </table>）关闭滚动 div
rep("""                {listProducts.length === 0 && (
                  <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-4)' }}>暂无商品</td></tr>
                )}
              </tbody>
            </table>
          </div>""",
    """                {listProducts.length === 0 && (
                  <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 'var(--space-4)' }}>暂无商品</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>""", 'table-close')

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('pricing ok')

# ── 2. PartnerCustomers: 品牌栏 A-Z 分组 + 字母导航，标题 商品品牌 ──
p = 'src/pages/partner/PartnerCustomers.tsx'
s = io.open(p, encoding='utf-8').read()
def rep2(old, new, tag=''):
    global s
    assert old in s, f'PC NOT FOUND [{tag}]: ' + old[:70]
    s = s.replace(old, new, 1)

# 2a. import pinyin + useRef
rep2("import { customerItems, CUSTOMER_TYPE_LABELS } from '../../data/customers';",
     "import { customerItems, CUSTOMER_TYPE_LABELS } from '../../data/customers';\nimport { getInitials } from '../../utils/pinyinInitials';", 'imp')
rep2("import { useState, useMemo, useEffect } from 'react';",
     "import { useState, useMemo, useEffect, useRef } from 'react';", 'imp2')

# 2b. 品牌栏数据：排序+分组 + 滚动联动
rep2("""  /** 左侧品牌栏 */
  const brandNav = useMemo(() => {
    const map = new Map<string, number>();
    orderableProducts.forEach((p) => map.set(p.brand, (map.get(p.brand) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  }, [orderableProducts]);""",
"""  /** 左侧品牌栏：按拼音首字母 A-Z 排序分组（参照报品报（调）价） */
  const brandNav = useMemo(() => {
    const map = new Map<string, number>();
    orderableProducts.forEach((p) => map.set(p.brand, (map.get(p.brand) ?? 0) + 1));
    return [...map.entries()]
      .map(([name, count]) => ({ name, count, initial: (getInitials(name)[0] ?? '#').toUpperCase() }))
      .sort((a, b) => a.initial.localeCompare(b.initial) || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  }, [orderableProducts]);
  const brandGroups = useMemo(() => {
    const groups: { letter: string; items: typeof brandNav }[] = [];
    brandNav.forEach((b) => {
      const g = groups[groups.length - 1];
      if (g && g.letter === b.initial) g.items.push(b);
      else groups.push({ letter: b.initial, items: [b] });
    });
    return groups;
  }, [brandNav]);
  /** 字母导航滚动联动 */
  const [activeLetter, setActiveLetter] = useState('');
  const brandListRef = useRef<HTMLDivElement>(null);
  const onBrandListScroll = () => {
    const el = brandListRef.current;
    if (!el) return;
    const groupEls = [...el.querySelectorAll<HTMLElement>('[data-letter]')];
    let current = groupEls[0]?.dataset.letter ?? '';
    for (const g of groupEls) {
      if (g.offsetTop - el.scrollTop <= 30) current = g.dataset.letter ?? current;
    }
    setActiveLetter(current);
  };
  const scrollToLetter = (letter: string) => {
    const el = brandListRef.current;
    const target = el?.querySelector<HTMLElement>(`[data-letter="${letter}"]`);
    if (el && target) el.scrollTo({ top: target.offsetTop - 4, behavior: 'smooth' });
  };""", 'brandnav')

# 2c. 品牌栏 JSX 重写（标题改「商品品牌」，A-Z 导航 + 分组列表）
rep2("""              {/* 左侧品牌栏 */}
              <div className="pk-panel" style={{ width: 200, flexShrink: 0, margin: 0 }}>
                <div className="pk-panel-head" style={{ paddingBottom: 10 }}>
                  <div className="pk-panel-title" style={{ fontSize: 13 }}>商品品牌</div>
                </div>
                <div className="pk-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button type="button" onClick={() => setBrand('')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                      padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                      border: brand === '' ? '1px solid var(--pk-accent)' : '1px solid transparent',
                      background: brand === '' ? 'var(--pk-accent-soft)' : 'transparent',
                      color: brand === '' ? '#01795D' : 'var(--pk-ink2)',
                      fontWeight: brand === '' ? 600 : 500, fontSize: 13,
                    }}>
                    全部品牌
                    <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>{orderableProducts.length}</span>
                  </button>
                  {brandNav.map((b) => (
                    <button key={b.name} type="button" onClick={() => setBrand(b.name)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                        padding: '8px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        border: brand === b.name ? '1px solid var(--pk-accent)' : '1px solid transparent',
                        background: brand === b.name ? 'var(--pk-accent-soft)' : 'transparent',
                        color: brand === b.name ? '#01795D' : 'var(--pk-ink2)',
                        fontWeight: brand === b.name ? 600 : 500, fontSize: 13,
                      }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>{b.count}</span>
                    </button>
                  ))}
                </div>
              </div>""",
"""              {/* 左侧品牌栏（参照报品报（调）价：A-Z 字母导航 + 分组列表） */}
              <div className="pk-panel" style={{ width: 216, flexShrink: 0, margin: 0 }}>
                <div className="pk-panel-head" style={{ paddingBottom: 10 }}>
                  <div className="pk-panel-title" style={{ fontSize: 13 }}>商品品牌</div>
                </div>
                <div className="pk-panel-body" style={{ display: 'flex', alignItems: 'stretch', padding: 0 }}>
                  {/* A-Z 字母导航 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 22, flexShrink: 0, padding: '6px 0 6px 4px', borderRight: '1px solid var(--pk-line)', maxHeight: 460, overflowY: 'auto' }}>
                    {brandGroups.map((g) => {
                      const active = activeLetter === g.letter;
                      return (
                        <button key={g.letter} type="button" onClick={() => scrollToLetter(g.letter)}
                          title={`${g.letter}（${g.items.length} 个品牌）`}
                          style={{
                            width: 16, height: 16, borderRadius: 4, border: 'none', cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: active ? 700 : 500,
                            background: active ? '#01795D' : 'transparent', color: active ? '#fff' : 'var(--pk-ink3)',
                          }}>{g.letter}</button>
                      );
                    })}
                  </div>
                  {/* 品牌列表（按字母分组，粘性字母头） */}
                  <div ref={brandListRef} onScroll={onBrandListScroll} style={{ flex: 1, minWidth: 0, maxHeight: 460, overflowY: 'auto', padding: 4, position: 'relative' }}>
                    <button type="button" onClick={() => setBrand('')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                        padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                        border: brand === '' ? '1px solid #01795D' : '1px solid transparent',
                        background: brand === '' ? 'var(--pk-accent-soft)' : 'transparent',
                        color: brand === '' ? '#01795D' : 'var(--pk-ink2)',
                        fontWeight: brand === '' ? 600 : 500, fontSize: 13,
                      }}>
                      全部品牌
                      <span style={{ fontSize: 12, color: 'var(--pk-ink3)' }}>{orderableProducts.length}</span>
                    </button>
                    {brandGroups.map((g) => (
                      <div key={g.letter} data-letter={g.letter}>
                        <div style={{
                          position: 'sticky', top: 0, zIndex: 1, fontSize: 11, fontWeight: 700, color: '#01795D',
                          background: 'var(--color-neutral-50)', padding: '4px 10px', borderRadius: 6, letterSpacing: '0.05em',
                        }}>{g.letter}</div>
                        {g.items.map((b) => (
                          <button key={b.name} type="button" onClick={() => setBrand(b.name)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                              padding: '7px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                              border: brand === b.name ? '1px solid #01795D' : '1px solid transparent',
                              background: brand === b.name ? 'var(--pk-accent-soft)' : 'transparent',
                              color: brand === b.name ? '#01795D' : 'var(--pk-ink2)',
                              fontWeight: brand === b.name ? 600 : 400, fontSize: 12.5,
                            }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--pk-ink3)' }}>{b.count}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>""", 'brandjsx')

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('customers ok')
