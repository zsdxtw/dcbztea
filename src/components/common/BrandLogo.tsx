/**
 * 淡茶半盏品牌 Logo（茶叶图形）
 * 全项目统一使用：管理台顶栏、合作商终端侧边栏、合作商登录页等。
 * 尺寸由外部 CSS 或包装容器控制（svg 选择器 / className）。
 */
export default function BrandLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-label="淡茶半盏">
      <path d="M14 3C9 7 6 11 6 15a8 8 0 0016 0c0-4-3-8-8-12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 10c-2 2-3.5 4-3.5 6a3.5 3.5 0 007 0c0-2-1.5-4-3.5-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
