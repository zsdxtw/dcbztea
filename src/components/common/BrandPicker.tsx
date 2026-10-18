/**
 * 主营品牌选择与品牌授权资质上传（管理端供应商抽屉 / 新增供应商 / 合作商终端注册·信息维护共用）
 * 品牌列表来源于商品-品牌管理（brands.tsx）
 */
import { brandItems } from '../../data/brands';
import type { BrandAuthFiles } from '../../types';

/** 品牌多选（chips 切换）；不传 options 时展示品牌管理全部品牌 */
export function BrandMultiSelect({
  value,
  onChange,
  options,
  accent = 'var(--color-module-current-base)',
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  /** 可选品牌范围（如门店主营品牌 ⊆ 供应商基本信息主营品牌） */
  options?: string[];
  /** 选中态强调色（默认跟随当前模块主色） */
  accent?: string;
  disabled?: boolean;
}) {
  const list = options ?? brandItems.map(b => b.name);
  const toggle = (name: string) => {
    if (disabled) return;
    onChange(value.includes(name) ? value.filter(v => v !== name) : [...value, name]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {list.map(name => {
        const active = value.includes(name);
        return (
          <button
            key={name}
            type="button"
            disabled={disabled}
            onClick={() => toggle(name)}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-medium)',
              lineHeight: '20px',
              border: `1px solid ${active ? accent : 'var(--color-border-primary)'}`,
              background: active ? `${accent}14` : 'var(--color-bg-primary)',
              color: active ? accent : 'var(--color-text-secondary)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {active ? '✓ ' : ''}{name}
          </button>
        );
      })}
    </div>
  );
}

/** 按品牌上传授权资质文件：选择主营品牌后，需为每个品牌上传授权资质 */
export function BrandAuthUploader({
  brands,
  files,
  onChange,
  accent = 'var(--color-module-current-base)',
}: {
  brands: string[];
  files: BrandAuthFiles;
  onChange: (next: BrandAuthFiles) => void;
  accent?: string;
}) {
  /** 移除品牌时同步清理授权文件，保证文件键 ⊆ 主营品牌 */
  const prune = (next: BrandAuthFiles): BrandAuthFiles => {
    const cleaned: BrandAuthFiles = {};
    brands.forEach(b => { if (next[b]?.length) cleaned[b] = next[b]; });
    return cleaned;
  };
  const upload = (brand: string, names: string[]) => {
    if (names.length === 0) return;
    onChange(prune({ ...files, [brand]: [...(files[brand] ?? []), ...names.filter(n => !(files[brand] ?? []).includes(n))] }));
  };
  const remove = (brand: string, idx: number) => {
    const next = (files[brand] ?? []).filter((_, i) => i !== idx);
    onChange(prune({ ...files, [brand]: next }));
  };

  if (brands.length === 0) {
    return (
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', padding: 'var(--space-2) 0' }}>
        请先在上方选择主营品牌，选择后需为每个品牌上传对应的授权资质文件
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {brands.map(brand => {
        const list = files[brand] ?? [];
        return (
          <div key={brand} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ flexShrink: 0, minWidth: 64, padding: '2px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: `${accent}14`, color: accent, border: `1px solid ${accent}30`, textAlign: 'center' }}>
              {brand}
            </span>
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {list.length === 0 && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', alignSelf: 'center' }}>未上传授权资质</span>
              )}
              {list.map((f, i) => (
                <span key={`${f}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}>
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 11, height: 11, color: accent, flexShrink: 0 }}><path d="M4 1.5h5.5L13 5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M9.5 1.5V5H13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  {f}
                  <button type="button" onClick={() => remove(brand, i)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text-tertiary)', fontSize: 12, lineHeight: 1 }}>×</button>
                </span>
              ))}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', border: `1px dashed ${accent}80`, color: accent, cursor: 'pointer' }}>
                + 上传授权资质
                <input type="file" multiple style={{ display: 'none' }} onChange={e => { upload(brand, Array.from(e.target.files ?? []).map(f => f.name)); e.target.value = ''; }} />
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
