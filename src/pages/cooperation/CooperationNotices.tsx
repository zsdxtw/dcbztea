import { useMemo, useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useNoticeStore, getPublishedNotices } from '../../stores/noticeStore';
import type { NoticeLevel, PartnerNotice } from '../../types';

const pill = (bg: string, color: string, text: string) => (
  <span style={{ padding: '2px 9px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
);

const LEVEL_STYLE: Record<NoticeLevel, { bg: string; color: string; label: string }> = {
  important: { bg: '#FDECEF', color: '#CB405D', label: '重要' },
  normal: { bg: 'var(--color-module-current-lightest)', color: 'var(--color-module-current-base)', label: '普通' },
};
const STATUS_STYLE: Record<PartnerNotice['status'], { bg: string; color: string; label: string }> = {
  draft: { bg: '#F5F5F5', color: '#9E9E9E', label: '草稿' },
  published: { bg: '#E8F5E9', color: '#01795D', label: '已发布' },
  withdrawn: { bg: '#FBF3E2', color: '#9A7A1C', label: '已撤回' },
};

/** 弹窗草稿 */
interface NoticeDraft {
  title: string;
  content: string;
  level: NoticeLevel;
  pinned: boolean;
}

const EMPTY_DRAFT: NoticeDraft = { title: '', content: '', level: 'normal', pinned: false };

/** 通知公告：面向全部合作商发布公告（管理后台发布，合作商工作台「通知公告」板块实时展示） */
export default function CooperationNotices() {
  const notices = useNoticeStore((s) => s.notices);
  const addNotice = useNoticeStore((s) => s.addNotice);
  const updateNotice = useNoticeStore((s) => s.updateNotice);
  const setNoticeStatus = useNoticeStore((s) => s.setNoticeStatus);
  const togglePin = useNoticeStore((s) => s.togglePin);
  const removeNotice = useNoticeStore((s) => s.removeNotice);

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  /** 新增/编辑弹窗（editingId=null 表示新增） */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoticeDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState('');
  /** 删除确认 */
  const [deleting, setDeleting] = useState<PartnerNotice | null>(null);
  /** 详情预览弹窗 */
  const [previewing, setPreviewing] = useState<PartnerNotice | null>(null);

  const publishedCount = getPublishedNotices(notices).length;
  const pinnedCount = notices.filter((n) => n.pinned).length;

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    return [...notices]
      .filter((n) => (!statusFilter || n.status === statusFilter))
      .filter((n) => !kw || n.title.includes(kw) || n.code.includes(kw) || n.content.includes(kw))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.publishTime ?? b.createTime).localeCompare(a.publishTime ?? a.createTime));
  }, [notices, keyword, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError('');
    setDialogOpen(true);
  };
  const openEdit = (n: PartnerNotice) => {
    setEditingId(n.id);
    setDraft({ title: n.title, content: n.content, level: n.level, pinned: n.pinned });
    setFormError('');
    setDialogOpen(true);
  };
  const saveDraft = () => {
    if (!draft.title.trim()) { setFormError('请输入公告标题'); return; }
    if (!draft.content.trim()) { setFormError('请输入公告内容'); return; }
    if (editingId) {
      updateNotice(editingId, { title: draft.title.trim(), content: draft.content.trim(), level: draft.level });
    } else {
      addNotice({ title: draft.title.trim(), content: draft.content.trim(), level: draft.level, pinned: false, publisher: '运营部-陈工作台' });
    }
    setDialogOpen(false);
  };

  return (
    <>
      <ContentHeader title="通知公告" breadcrumbs={['合作商', '通知公告']} />
      <div className="content-body">
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', lineHeight: 1.7 }}>
          面向<strong>全部合作商</strong>发布通知公告：发布后实时展示在合作商工作台「通知公告」板块（置顶优先）；支持草稿保存、发布/撤回、置顶与删除。
          当前已发布 <strong className="mono">{publishedCount}</strong> 条（置顶 {pinnedCount} 条）。
        </div>

        {/* 工具栏 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
          <input className="filter-input" placeholder="搜索标题、编号、内容..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 260 }} />
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="withdrawn">已撤回</option>
          </select>
          <Button onClick={openCreate}>+ 新增公告</Button>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>共 {filtered.length} 条公告</span>
        </div>

        <Card style={{ padding: 0 }}>
          <Table
            headers={['编号', '公告标题', '级别', '状态', '置顶', '发布时间', '发布人', '操作']}
            rows={filtered.map((n) => [
              <span key="c" className="mono">{n.code}</span>,
              <span key="t" className="cell-emph" style={{ cursor: 'pointer' }} title="点击预览" onClick={() => setPreviewing(n)}>
                {n.pinned && n.status === 'published' && <span style={{ color: 'var(--color-module-current-base)', marginRight: 4 }}>[置顶]</span>}
                {n.title}
              </span>,
              pill(LEVEL_STYLE[n.level].bg, LEVEL_STYLE[n.level].color, LEVEL_STYLE[n.level].label),
              pill(STATUS_STYLE[n.status].bg, STATUS_STYLE[n.status].color, STATUS_STYLE[n.status].label),
              n.status === 'published' ? (
                <span key="p" style={{ fontSize: 'var(--text-sm)' }}>
                  <button
                    type="button" role="switch" aria-checked={n.pinned} title={n.pinned ? '取消置顶' : '置顶（工作台优先展示）'}
                    onClick={() => togglePin(n.id)}
                    style={{ position: 'relative', width: 38, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer', background: n.pinned ? 'var(--color-module-current-base)' : 'var(--color-neutral-300)', transition: 'background .15s', padding: 0, verticalAlign: 'middle' }}
                  >
                    <span style={{ position: 'absolute', top: 2, left: n.pinned ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left .15s' }} />
                  </button>
                </span>
              ) : (
                <span key="p" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>—</span>
              ),
              <span key="pt" className="cell-muted" style={{ whiteSpace: 'nowrap' }}>{n.publishTime ?? '—'}</span>,
              <span key="pb" className="cell-muted">{n.publisher}</span>,
              <div key="act" className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => setPreviewing(n)}>预览</Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(n)}>编辑</Button>
                {n.status === 'published' ? (
                  <Button size="sm" variant="ghost" onClick={() => setNoticeStatus(n.id, 'withdrawn')}>撤回</Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setNoticeStatus(n.id, 'published')}>发布</Button>
                )}
                <Button size="sm" variant="ghost" style={{ color: 'var(--color-module-current-secondary)' }} onClick={() => setDeleting(n)}>删除</Button>
              </div>,
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>暂无符合条件的公告</div>
          )}
        </Card>
      </div>

      {/* 新增/编辑弹窗 */}
      {dialogOpen && (
        <div className="category-dialog-overlay" onClick={() => setDialogOpen(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '94vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>{editingId ? '编辑公告' : '新增公告'}</h3>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>公告标题 *</label>
                <input className="filter-input" style={{ width: '100%' }} placeholder="请输入公告标题" maxLength={60} value={draft.title} onChange={(e) => { setDraft((d) => ({ ...d, title: e.target.value })); setFormError(''); }} />
              </div>
              <div>
                <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>级别</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {(['normal', 'important'] as NoticeLevel[]).map((lv) => (
                    <label key={lv} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: `1px solid ${draft.level === lv ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`, background: draft.level === lv ? 'var(--color-module-current-lightest)' : 'transparent', fontSize: 'var(--text-sm)' }}>
                      <input type="radio" name="notice-level" checked={draft.level === lv} onChange={() => setDraft((d) => ({ ...d, level: lv }))} />
                      {LEVEL_STYLE[lv].label}{lv === 'important' ? '（工作台红色标注）' : ''}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="drawer-label" style={{ display: 'block', marginBottom: 6 }}>公告内容 *</label>
                <textarea
                  className="filter-input" style={{ width: '100%', minHeight: 180, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
                  placeholder="请输入公告正文（合作商在工作台点击公告后查看）"
                  value={draft.content}
                  onChange={(e) => { setDraft((d) => ({ ...d, content: e.target.value })); setFormError(''); }}
                />
              </div>
              {formError && <div style={{ fontSize: 'var(--text-sm)', color: '#C62828' }}>{formError}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)', flexShrink: 0 }}>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={saveDraft}>{editingId ? '保存修改' : '保存草稿'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* 预览弹窗（工作台所见样式） */}
      {previewing && (
        <div className="category-dialog-overlay" onClick={() => setPreviewing(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '94vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 6 }}>
              {previewing.pinned && previewing.status === 'published' && <span style={{ color: 'var(--color-module-current-base)', marginRight: 4 }}>[置顶]</span>}
              {previewing.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
              {pill(LEVEL_STYLE[previewing.level].bg, LEVEL_STYLE[previewing.level].color, LEVEL_STYLE[previewing.level].label)}
              {pill(STATUS_STYLE[previewing.status].bg, STATUS_STYLE[previewing.status].color, STATUS_STYLE[previewing.status].label)}
              <span className="cell-muted" style={{ fontSize: 'var(--text-xs)' }}>{previewing.code} · {previewing.publishTime ?? previewing.createTime} · {previewing.publisher}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', lineHeight: 1.9, whiteSpace: 'pre-wrap', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
              {previewing.content}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)', flexShrink: 0 }}>
              <Button variant="ghost" onClick={() => setPreviewing(null)}>关闭</Button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {deleting && (
        <div className="category-dialog-overlay" onClick={() => setDeleting(null)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>确认删除</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              确定要删除公告 <strong>{deleting.title}</strong>（{deleting.code}）吗？{deleting.status === 'published' && ' 已发布公告删除后将从合作商工作台下架。'}此操作不可撤销。
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setDeleting(null)}>取消</Button>
              <Button style={{ background: 'var(--color-module-current-secondary)', borderColor: 'var(--color-module-current-secondary)' }} onClick={() => { removeNotice(deleting.id); setDeleting(null); }}>确认删除</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
