/**
 * 门店照片上传与展示（管理端供应商抽屉 / 新增供应商 / 合作商终端注册·信息维护共用）
 * 每个门店最多上传 5 张照片；演示环境 mock 上传（生成占位门店照片）
 */

/** 门店照片上限 */
export const STORE_PHOTO_LIMIT = 5;

const PHOTO_SCENES = [
  '茶叶品牌体验店门头招牌，木质格栅设计，暖光照明，街景视角，高清摄影',
  '茶叶门店室内全景，原木货架陈列整齐茶叶罐，中式茶文化装饰，高清摄影',
  '茶庄门店品茶区，实木茶桌茶椅，茶艺师冲泡场景，温馨氛围，高清摄影',
  '茶叶专卖店橱窗陈列，礼盒装茶叶展示，射灯打光，高清摄影',
  '茶饮门店收银台与品牌形象墙，绿植点缀，简约新中式风格，高清摄影',
  '茶叶门店货架特写，各类茶叶礼盒分类陈列，标签清晰，高清摄影',
];

/** mock 上传：生成一张门店照片占位图 */
export const createStorePhoto = (): string => {
  const prompt = PHOTO_SCENES[Math.floor(Math.random() * PHOTO_SCENES.length)];
  return `https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;
};

/** 编辑态：门店照片上传（缩略图 + 删除角标 + 上传按钮，上限 5 张） */
export function StorePhotoPicker({
  photos,
  onChange,
  accent = 'var(--color-module-current-base)',
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  accent?: string;
}) {
  const full = photos.length >= STORE_PHOTO_LIMIT;
  const remove = (idx: number) => onChange(photos.filter((_, i) => i !== idx));
  const add = () => { if (!full) onChange([...photos, createStorePhoto()]); };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
      {photos.map((url, i) => (
        <div key={`${url}-${i}`} style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <img
            src={url}
            alt={`门店照片 ${i + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-primary)', display: 'block', background: 'var(--color-bg-tertiary)' }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            title="删除照片"
            style={{
              position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
              border: 'none', background: 'var(--color-semantic-error, #CB405D)', color: '#fff',
              fontSize: 12, lineHeight: '16px', textAlign: 'center', cursor: 'pointer', padding: 0,
            }}
          >×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={full}
        title={full ? `最多 ${STORE_PHOTO_LIMIT} 张` : '上传门店照片'}
        style={{
          width: 64, height: 64, borderRadius: 'var(--radius-md)', cursor: full ? 'not-allowed' : 'pointer',
          border: `2px dashed ${full ? 'var(--color-border-primary)' : accent + '55'}`,
          background: 'transparent', color: full ? 'var(--color-text-tertiary)' : accent,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          fontSize: 10, fontWeight: 'var(--font-medium)', opacity: full ? 0.6 : 1, flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 20 20" fill="none" style={{ width: 16, height: 16 }}><path d="M7 13V4.5l6-2v8.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M7 13a2 2 0 104 0 2 2 0 00-4 0z" stroke="currentColor" strokeWidth="1.4"/><path d="M13 11a2 2 0 104 0 2 2 0 00-4 0z" stroke="currentColor" strokeWidth="1.4"/></svg>
        {photos.length}/{STORE_PHOTO_LIMIT}
      </button>
    </div>
  );
}

/** 查看态：门店照片展示（缩略图网格，无照片显示 —） */
export function StorePhotoGallery({ photos }: { photos?: string[] }) {
  if (!photos?.length) {
    return <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>暂无门店照片</span>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {photos.map((url, i) => (
        <img
          key={`${url}-${i}`}
          src={url}
          alt={`门店照片 ${i + 1}`}
          title={`门店照片 ${i + 1}`}
          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-primary)', display: 'block', background: 'var(--color-bg-tertiary)' }}
        />
      ))}
    </div>
  );
}
