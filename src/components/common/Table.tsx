import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import HScrollBox from './HScrollBox';

interface TableProps {
  headers: ReactNode[];
  rows: ReactNode[][];
  /** 指定列的内容区最小宽度（按表头文本匹配，不含单元格内边距）：自动测量不足该值时按该值，其余列仍按内容自适应 */
  colMinWidths?: Record<string, number>;
}

/** 可调整列宽的表格组件 */
export default function Table({ headers, rows, colMinWidths }: TableProps) {
  const [colWidths, setColWidths] = useState<number[]>([]);
  const tableRef = useRef<HTMLTableElement>(null);
  const dragging = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null);

  // 初始化列宽
  useEffect(() => {
    if (colWidths.length === 0 && tableRef.current) {
      const ths = tableRef.current.querySelectorAll('th');
      const widths = Array.from(ths).map((th, i) => {
        const min = typeof headers[i] === 'string' ? colMinWidths?.[headers[i] as string] : undefined;
        if (!min) return th.offsetWidth;
        const cs = getComputedStyle(th);
        return Math.max(th.offsetWidth, min + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
      });
      setColWidths(widths);
    }
  }, [headers, colMinWidths]);

  const handleMouseDown = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    const th = (e.target as HTMLElement).parentElement;
    if (!th) return;
    dragging.current = { colIndex, startX: e.clientX, startWidth: th.offsetWidth };
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragging.current) return;
      const diff = moveEvent.clientX - dragging.current.startX;
      setColWidths((prev) => {
        const next = [...prev];
        next[dragging.current!.colIndex] = Math.max(40, dragging.current!.startWidth + diff);
        return next;
      });
    };
    const handleMouseUp = () => {
      dragging.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <HScrollBox className="table-wrapper">
      <table ref={tableRef}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={colWidths[i] ? { width: colWidths[i], minWidth: colWidths[i] } : undefined}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{h}</span>
                  <div
                    onMouseDown={(e) => handleMouseDown(e, i)}
                    style={{
                      width: 6,
                      height: 20,
                      cursor: 'col-resize',
                      flexShrink: 0,
                      position: 'relative',
                      right: -3,
                    }}
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={colWidths[ci] ? { width: colWidths[ci], minWidth: colWidths[ci] } : undefined}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </HScrollBox>
  );
}
