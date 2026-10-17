import { useMemo, useState } from 'react';
import Button from '../../components/common/Button';
import DetailDrawer, { DrawerSection, InfoGrid, InfoItem } from '../../components/common/DetailDrawer';
import { PageHead, Pill } from './CustomerUI';
import { useCustomerStore } from '../../stores/customerStore';
import {
  customerCatalog,
  CATALOG_TEA_CATEGORIES,
  CATALOG_BRANDS,
  type CustomerCatalogProduct,
} from '../../data/customer';
import '../partner/partner.css';
import './customer.css';

/** 数量步进器 */
function Qty({ value, onChange, min = 1 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="ck-qty">
      <button className="ck-qty-btn" onClick={() => onChange(Math.max(min - 1, value - 1))} title="减少">−</button>
      <input
        className="ck-qty-num"
        value={value}
        onChange={e => {
          const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
          if (!Number.isNaN(n)) onChange(n);
        }}
      />
      <button className="ck-qty-btn" onClick={() => onChange(value + 1)} title="增加">+</button>
    </div>
  );
}

/** 茶叶视觉占位（统一品牌图形） */
function ProdVisual() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <path d="M14 3C9 7 6 11 6 15a8 8 0 0016 0c0-4-3-8-8-12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M14 10c-2 2-3.5 4-3.5 6a3.5 3.5 0 007 0c0-2-1.5-4-3.5-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

/** 商品浏览：在售茶品目录，支持搜索/筛选/排序，加入购物车 */
export default function CustomerProducts() {
  const addToCart = useCustomerStore((s) => s.addToCart);
  const cart = useCustomerStore((s) => s.cart);

  const [keyword, setKeyword] = useState('');
  const [teaCategory, setTeaCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [detail, setDetail] = useState<CustomerCatalogProduct | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [addedId, setAddedId] = useState('');

  const filtered = useMemo(() => {
    let list = customerCatalog.filter(p => {
      if (keyword && !p.name.includes(keyword) && !p.brand.includes(keyword) && !p.category.includes(keyword)) return false;
      if (teaCategory && p.teaCategory !== teaCategory) return false;
      if (brand && p.brand !== brand) return false;
      return true;
    });
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.salesPrice - b.salesPrice);
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.salesPrice - a.salesPrice);
    if (sortBy === 'stock-desc') list = [...list].sort((a, b) => b.stock - a.stock);
    return list;
  }, [keyword, teaCategory, brand, sortBy]);

  /** 快速加入购物车（默认 1 件） */
  const quickAdd = (p: CustomerCatalogProduct) => {
    addToCart({ productId: p.id, productName: p.name, spec: p.spec, price: p.salesPrice, quantity: 1 });
    setAddedId(p.id);
    setTimeout(() => setAddedId(''), 1200);
  };

  const cartQuantity = (productId: string) => cart.find(c => c.productId === productId)?.quantity ?? 0;

  const openDetail = (p: CustomerCatalogProduct) => {
    setDetail(p);
    setDetailQty(1);
  };

  return (
    <div className="pk-page">
      <PageHead
        eyebrow="客户终端 · 商品"
        title="商品浏览"
        desc="平台在售茶品目录，展示客户专属销售价与实时库存。点击商品卡片查看详情，加入购物车后统一结算下单。"
      />

      {/* 筛选 */}
      <div className="pk-toolbar">
        <input className="filter-input" placeholder="搜索商品名称、品牌、品类..." value={keyword} onChange={e => setKeyword(e.target.value)} />
        <select className="filter-select" value={teaCategory} onChange={e => setTeaCategory(e.target.value)}>
          <option value="">全部茶类</option>
          {CATALOG_TEA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={brand} onChange={e => setBrand(e.target.value)}>
          <option value="">全部品牌</option>
          {CATALOG_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="default">综合排序</option>
          <option value="price-asc">价格从低到高</option>
          <option value="price-desc">价格从高到低</option>
          <option value="stock-desc">库存优先</option>
        </select>
        <span className="pk-count">共 {filtered.length} 款在售</span>
      </div>

      {/* 商品网格 */}
      {filtered.length === 0 ? (
        <div className="pk-panel">
          <div className="ck-empty">
            <svg viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <div className="ck-empty-t">未找到相关商品</div>
            <div className="ck-empty-d">换个关键词或调整筛选条件试试</div>
          </div>
        </div>
      ) : (
        <div className="ck-prod-grid">
          {filtered.map(p => (
            <div key={p.id} className="ck-prod-card" onClick={() => openDetail(p)}>
              <div className="ck-prod-visual"><ProdVisual /></div>
              <div className="ck-prod-name">{p.name}</div>
              <div className="ck-prod-meta">
                <span className="ck-prod-meta-item">{p.teaCategory}</span>
                <span className="ck-prod-meta-item">{p.brand}</span>
                <span className="ck-prod-meta-item">{p.spec}</span>
              </div>
              <div className="ck-prod-price-row">
                <span className="ck-prod-price"><small>¥</small>{p.salesPrice.toLocaleString()}</span>
                <span className="ck-prod-market">市场价 ¥{p.marketPrice.toLocaleString()}</span>
              </div>
              <div className="ck-prod-foot">
                <span className={`ck-prod-stock${p.stock < 100 ? ' low' : ''}`}>
                  {p.stock < 100 ? `库存紧张 · 余 ${p.stock}` : `库存 ${p.stock}`}
                </span>
                <button
                  className={`ck-add-btn${addedId === p.id ? ' added' : ''}`}
                  onClick={e => { e.stopPropagation(); quickAdd(p); }}
                >
                  {addedId === p.id ? (
                    <>已加入{cartQuantity(p.id) > 1 ? `（${cartQuantity(p.id)}）` : ''}</>
                  ) : (
                    <>
                      <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      加入购物车
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 商品详情抽屉 */}
      <DetailDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        badge="CP"
        title={detail?.name ?? ''}
        subtitle={detail ? `${detail.brand} · ${detail.teaCategory} · ${detail.spec}` : ''}
        hideFooter
        footer={
          detail && (
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>关闭</Button>
              <Button onClick={() => {
                addToCart({ productId: detail.id, productName: detail.name, spec: detail.spec, price: detail.salesPrice, quantity: detailQty });
                setDetail(null);
              }}>
                加入购物车（{detailQty} 件）
              </Button>
            </>
          )
        }
      >
        {detail && (
          <>
            <DrawerSection title="商品信息">
              <InfoGrid>
                <InfoItem label="商品名称" emph>{detail.name}</InfoItem>
                <InfoItem label="品牌">{detail.brand}</InfoItem>
                <InfoItem label="茶类">{detail.teaCategory}</InfoItem>
                <InfoItem label="品类">{detail.category}</InfoItem>
                <InfoItem label="规格">{detail.spec}</InfoItem>
                <InfoItem label="保质期">{detail.shelfLife} 个月</InfoItem>
                <InfoItem label="产地">{detail.origin}</InfoItem>
                <InfoItem label="等级">{detail.grade}</InfoItem>
                <InfoItem label="当前库存">{detail.stock} 件</InfoItem>
                <InfoItem label="销售价" mono emph valueStyle={{ color: 'var(--pk-accent)' }}>¥{detail.salesPrice.toLocaleString()}</InfoItem>
                <InfoItem label="市场价" mono>¥{detail.marketPrice.toLocaleString()}</InfoItem>
                <InfoItem label="购买数量">
                  <div style={{ paddingTop: 2 }}><Qty value={detailQty} onChange={v => setDetailQty(Math.max(1, v))} /></div>
                </InfoItem>
              </InfoGrid>
            </DrawerSection>
            <DrawerSection title="商品介绍">
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', lineHeight: 1.8, margin: 0 }}>{detail.features}</div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}
