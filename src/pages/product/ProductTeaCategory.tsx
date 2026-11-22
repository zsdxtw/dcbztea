import { useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import { teaCategories as initialTeaCategories } from '../../data/teaCategories';
import type { TeaCategoryDetail } from '../../types';

/** 茶叶档案页面 */
export default function ProductTeaCategory() {
  const [categories, setCategories] = useState<TeaCategoryDetail[]>(initialTeaCategories);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<TeaCategoryDetail | null>(null);

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditData({ ...categories[idx] });
  };

  const handleSave = () => {
    if (editingIdx !== null && editData) {
      const next = [...categories];
      next[editingIdx] = editData;
      setCategories(next);
      setEditingIdx(null);
      setEditData(null);
    }
  };

  const handleCancel = () => {
    setEditingIdx(null);
    setEditData(null);
  };

  return (
    <>
      <ContentHeader title="六大茶类" breadcrumbs={['商品', '茶叶档案', '六大茶类']} />
      <div className="content-body">
        <Card title="六大茶类及花草茶">
          <Table
            headers={['茶类名称', '茶类介绍', '工艺特点', '存储条件', '风味描述', '代表茶种', '操作']}
            rows={categories.map((item, idx) => {
              const isEditing = editingIdx === idx;
              const d = isEditing && editData ? editData : item;
              return [
                <Tag category={item.category} />,
                isEditing ? (
                  <textarea
                    className="detail-textarea"
                    value={d.introduction}
                    onChange={(e) => setEditData({ ...d, introduction: e.target.value })}
                    rows={2}
                    style={{ fontSize: 'var(--text-sm)', minWidth: 200 }}
                  />
                ) : (
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', maxWidth: 280, display: 'inline-block' }}>{d.introduction}</span>
                ),
                isEditing ? (
                  <input className="detail-input" value={d.process} onChange={(e) => setEditData({ ...d, process: e.target.value })} style={{ fontSize: 'var(--text-sm)', minWidth: 120 }} />
                ) : (
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{d.process}</span>
                ),
                isEditing ? (
                  <input className="detail-input" value={d.storage} onChange={(e) => setEditData({ ...d, storage: e.target.value })} style={{ fontSize: 'var(--text-sm)', minWidth: 120 }} />
                ) : (
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{d.storage}</span>
                ),
                isEditing ? (
                  <input className="detail-input" value={d.flavor} onChange={(e) => setEditData({ ...d, flavor: e.target.value })} style={{ fontSize: 'var(--text-sm)', minWidth: 120 }} />
                ) : (
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{d.flavor}</span>
                ),
                isEditing ? (
                  <input className="detail-input" value={d.representativeTeas.join('、')} onChange={(e) => setEditData({ ...d, representativeTeas: e.target.value.split(/[、,，]/).map((s: string) => s.trim()).filter(Boolean) })} style={{ fontSize: 'var(--text-sm)', minWidth: 160 }} />
                ) : (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{d.representativeTeas.join('、')}</span>
                ),
                isEditing ? (
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button variant="ghost" size="sm" onClick={handleCancel} style={{ color: 'var(--color-neutral-400)' }}>关闭</Button>
                    <Button size="sm" onClick={handleSave}>保存</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(idx)} style={{ color: '#01795D' }}>编辑</Button>
                ),
              ];
            })}
          />
        </Card>
      </div>
    </>
  );
}
