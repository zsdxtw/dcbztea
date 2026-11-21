/**
 * 宽表横向滚动容器（HScrollBox）
 * 内容横向溢出时，滚动条吸底常驻（sticky 代理条离视口底部 12px）+ 双向同步：
 * 拖动代理条滚动内容 / 直接滚动内容时代理条跟随；不溢出时不渲染代理条。
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

const HSCROLL_CSS = [
  '.hscroll-grid{scrollbar-width:none;-ms-overflow-style:none;}',
  '.hscroll-grid::-webkit-scrollbar{display:none;}',
  '.hscroll-bar{scrollbar-width:auto;}',
  '.hscroll-bar::-webkit-scrollbar{height:10px;}',
  '.hscroll-bar::-webkit-scrollbar-thumb{background:var(--color-neutral-300);border-radius:5px;}',
  '.hscroll-bar::-webkit-scrollbar-track{background:var(--color-neutral-100);}',
].join('');

interface HScrollBoxProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function HScrollBox({ children, className, style }: HScrollBoxProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const [overflow, setOverflow] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);

  /* 溢出检测：观察首层子元素尺寸变化（列宽拖拽/数据变化）+ 窗口缩放 */
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const check = () => {
      setContentWidth(el.scrollWidth);
      setOverflow(el.scrollWidth > el.clientWidth + 1);
    };
    check();
    const ro = new ResizeObserver(check);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    ro.observe(el);
    window.addEventListener('resize', check);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', check);
    };
  }, []);

  const onGridScroll = () => {
    if (syncing.current) return;
    syncing.current = true;
    if (barRef.current) barRef.current.scrollLeft = gridRef.current?.scrollLeft ?? 0;
    syncing.current = false;
  };
  const onBarScroll = () => {
    if (syncing.current) return;
    syncing.current = true;
    if (gridRef.current) gridRef.current.scrollLeft = barRef.current?.scrollLeft ?? 0;
    syncing.current = false;
  };

  return (
    <>
      <style>{HSCROLL_CSS}</style>
      <div
        ref={gridRef}
        onScroll={onGridScroll}
        className={`hscroll-grid${className ? ` ${className}` : ''}`}
        style={{ overflowX: 'auto', ...style }}
      >
        {children}
      </div>
      {overflow && (
        <div
          ref={barRef}
          onScroll={onBarScroll}
          className="hscroll-bar"
          style={{
            position: 'sticky', bottom: 12, marginBottom: 12,
            overflowX: 'auto', overflowY: 'hidden',
            background: 'var(--color-neutral-50)',
            borderTop: '1px solid var(--color-neutral-150)',
            borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          }}
        >
          <div style={{ width: contentWidth, height: 2 }} />
        </div>
      )}
    </>
  );
}
