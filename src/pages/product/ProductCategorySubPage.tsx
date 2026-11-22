import { useState } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getTeaCategoryDetail } from '../../data/teaCategories';
import {
  type CategoryNode,
  type ProductCategoryType,
  productCategoryLabels,
  productCategoryBreadcrumbs,
  getTeaCategoryByName,
  findNode,
  getLevelLabel,
} from '../../data/productCategories';

interface ProductCategorySubPageProps {
  categoryType: ProductCategoryType;
  rootNode: CategoryNode;
  hideHeader?: boolean;
}

/** 分类管理子页面（茶叶/茶具/茶周边/其他） */
export default function ProductCategorySubPage({ categoryType, rootNode, hideHeader }: ProductCategorySubPageProps) {
  const label = productCategoryLabels[categoryType];
  const breadcrumb = productCategoryBreadcrumbs[categoryType];

  const [categories, setCategories] = useState<CategoryNode>(rootNode);
  // 默认选中一级分类，右侧直接展示一级分类详情
  const [selectedId, setSelectedId] = useState<string>(categories.id);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(categories.children?.map((c) => c.id) ?? []));
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<{ name: string; description: string; origin: string } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState<{ parentId: string; level: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 在整棵树中查找节点
  const selectedNode = selectedId ? findNode([categories], selectedId) : null;
  const isRoot = selectedId === categories.id;

  // 计算选中节点的深度（一级=0，二级=1，三级=2）
  const getDepth = (id: string, nodes: CategoryNode[] = [categories], d: number = 0): number => {
    for (const n of nodes) {
      if (n.id === id) return d;
      if (n.children) {
        const found = getDepth(id, n.children, d + 1);
        if (found >= 0) return found;
      }
    }
    return -1;
  };
  const depth = selectedId ? getDepth(selectedId) : 0;

  // 获取面包屑路径
  const getPath = (id: string, nodes: CategoryNode[] = [categories], path: CategoryNode[] = []): CategoryNode[] | null => {
    for (const n of nodes) {
      const cur = [...path, n];
      if (n.id === id) return cur;
      if (n.children) {
        const found = getPath(id, n.children, cur);
        if (found) return found;
      }
    }
    return null;
  };
  const selectedPath = selectedId ? getPath(selectedId) : null;

  // 当前显示的数据：编辑模式用 editData，否则用 selectedNode
  const d = editing && editData ? editData : selectedNode;

  // 获取描述字段的标签
  const getDescriptionLabel = () => {
    if (categoryType === 'tea' && depth === 1) return '茶类介绍';
    if (categoryType === 'tea' && depth === 2) return '茶叶特点';
    if (categoryType !== 'tea' && depth === 1) return '分类说明';
    if (depth === 2) return categoryType === 'tea' ? '茶叶特点' : '分类说明';
    return '描述';
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleStartEdit = () => {
    if (!selectedNode) return;
    setEditData({
      name: selectedNode.name,
      description: selectedNode.description || '',
      origin: selectedNode.origin || '',
    });
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditData(null);
  };

  const handleSaveEdit = () => {
    if (!editData || !selectedId) return;
    const updateNode = (node: CategoryNode): CategoryNode => {
      if (node.id === selectedId) {
        return { ...node, name: editData.name, description: editData.description || undefined, origin: editData.origin || undefined };
      }
      if (node.children) return { ...node, children: node.children.map(updateNode) };
      return node;
    };
    setCategories(updateNode(categories));
    setEditing(false);
    setEditData(null);
  };

  const handleAddChild = (parentId: string, level: number) => {
    setShowAddDialog({ parentId, level });
  };

  const handleConfirmAdd = () => {
    if (!showAddDialog) return;
    const input = document.getElementById('add-category-input') as HTMLInputElement;
    const name = input?.value.trim();
    if (!name) return;

    const newNode: CategoryNode = {
      id: `cat-${Date.now()}`,
      name,
      sort: 999,
      productCount: 0,
    };

    const addChild = (node: CategoryNode): CategoryNode => {
      if (node.id === showAddDialog.parentId) {
        return { ...node, children: [...(node.children || []), newNode] };
      }
      if (node.children) return { ...node, children: node.children.map(addChild) };
      return node;
    };
    setCategories(addChild(categories));
    setExpandedIds((prev) => new Set([...prev, showAddDialog.parentId]));
    setShowAddDialog(null);
  };

  const handleDelete = (id: string) => {
    const removeNode = (node: CategoryNode): CategoryNode => ({
      ...node,
      children: node.children?.filter((n) => n.id !== id).map((n) => removeNode(n)),
    });
    setCategories(removeNode(categories));
    if (selectedId === id) setSelectedId(categories.id);
  };

  /** 渲染树节点（从二级分类开始，depth 0 对应实际二级分类） */
  const renderTreeNode = (node: CategoryNode, treeDepth: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`category-tree-node${isSelected ? ' selected' : ''}`}
          style={{ paddingLeft: treeDepth * 20 + 8 }}
          onClick={() => { setSelectedId(node.id); setEditing(false); }}
        >
          <span
            className={`category-tree-expand${hasChildren ? ' has-children' : ''}${isExpanded ? ' expanded' : ''}`}
            onClick={(e) => { e.stopPropagation(); if (hasChildren) toggleExpand(node.id); }}
          >
            {hasChildren && (
              <svg viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </span>
          <span className="category-tree-name">{node.name}</span>
          <span className="category-tree-count">{node.productCount}</span>
          {/* 二级分类可新增子分类和删除；三级分类只能删除 */}
          {treeDepth === 0 && (
            <span className="category-tree-actions" onClick={(e) => e.stopPropagation()}>
              <button className="category-tree-action-btn" title="新增子分类" onClick={() => handleAddChild(node.id, 1)}>
                <svg viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              </button>
              <button className="category-tree-action-btn category-tree-action-delete" title={node.productCount > 0 ? '该分类下有商品，不可删除' : '删除'} disabled={node.productCount > 0} style={node.productCount > 0 ? { opacity: 0.3, cursor: 'not-allowed' } : undefined} onClick={() => { if (node.productCount === 0) handleDelete(node.id); }}>
                <svg viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5 4V3h4v1M6 6v4M8 6v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 4l.7 7h4.6l.7-7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
              </button>
            </span>
          )}
          {treeDepth >= 1 && (
            <span className="category-tree-actions" onClick={(e) => e.stopPropagation()}>
              <button className="category-tree-action-btn category-tree-action-delete" title={node.productCount > 0 ? '该分类下有商品，不可删除' : '删除'} disabled={node.productCount > 0} style={node.productCount > 0 ? { opacity: 0.3, cursor: 'not-allowed' } : undefined} onClick={() => { if (node.productCount === 0) handleDelete(node.id); }}>
                <svg viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5 4V3h4v1M6 6v4M8 6v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 4l.7 7h4.6l.7-7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
              </button>
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="category-tree-children">
            {node.children!.map((child) => renderTreeNode(child, treeDepth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {!hideHeader && <ContentHeader title={breadcrumb} breadcrumbs={['商品', '分类管理', breadcrumb]} />}
      <div className="content-body">
        <div className="category-layout">
          {/* 左侧分类树 - 直接展示二级分类 */}
          <Card title={`${label}分类`} className="category-tree-card" headerRight={
            <Button variant="ghost" size="sm" onClick={() => handleAddChild(categories.id, 0)}>
              <PlusIcon /> 添加子分类
            </Button>
          }>
            <div className="category-tree">
              {categories.children?.map((child) => renderTreeNode(child, 0))}
            </div>
          </Card>

          {/* 右侧详情 */}
          <div className="category-detail-area">
            {selectedNode && (
              <Card title="分类详情">
                {/* 面包屑路径 */}
                {selectedPath && (
                  <div className="category-breadcrumb">
                    {selectedPath.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && <span className="category-breadcrumb-sep">/</span>}
                        <span className={i === selectedPath.length - 1 ? 'category-breadcrumb-current' : 'category-breadcrumb-item'}>{p.name}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="detail-grid">
                  <div className="detail-row">
                    <div className="detail-label">分类名称</div>
                    <div className="detail-value">
                      {editing && editData ? (
                        <input className="detail-input" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                      ) : (
                        <span style={{ fontWeight: 'var(--font-medium)' }}>{selectedNode.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">分类层级</div>
                    <div className="detail-value">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#FFF3EB', color: '#eb5c20' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#eb5c20', flexShrink: 0 }}></span>
                        {getLevelLabel(depth)}
                      </span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">上级分类</div>
                    <div className="detail-value">
                      {selectedPath && selectedPath.length > 1 ? selectedPath[selectedPath.length - 2].name : <span style={{ color: 'var(--color-neutral-400)' }}>无（顶级分类）</span>}
                    </div>
                  </div>

                  {/* 茶叶二级分类：发酵种类 */}
                  {categoryType === 'tea' && depth === 1 && selectedNode.fermentation && (
                    <div className="detail-row">
                      <div className="detail-label">发酵种类</div>
                      <div className="detail-value">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: '#FFF3EB', color: '#eb5c20' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#eb5c20', flexShrink: 0 }}></span>
                        {selectedNode.fermentation}
                      </span>
                      </div>
                    </div>
                  )}

                  {/* 茶叶三级分类：产地 */}
                  {categoryType === 'tea' && depth === 2 && (
                    <div className="detail-row">
                      <div className="detail-label">产地</div>
                      <div className="detail-value">
                        {editing && editData ? (
                          <input className="detail-input" value={editData.origin} onChange={(e) => setEditData({ ...editData, origin: e.target.value })} placeholder="请输入产地" />
                        ) : (
                          selectedNode.origin ? <span style={{ fontWeight: 'var(--font-medium)' }}>{selectedNode.origin}</span> : <span style={{ color: 'var(--color-neutral-400)' }}>未填写</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 描述字段：二级/三级分类均可编辑 */}
                  {depth >= 1 && (
                    <div className="detail-row detail-row-span">
                      <div className="detail-label">{getDescriptionLabel()}</div>
                      <div className="detail-value">
                        {editing && editData ? (
                          <textarea
                            className="detail-textarea"
                            value={editData.description}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            placeholder={`请输入${getDescriptionLabel()}`}
                            rows={3}
                          />
                        ) : (
                          d?.description ? (
                            <span style={{ lineHeight: 'var(--leading-relaxed)' }}>{d.description}</span>
                          ) : (
                            <span style={{ color: 'var(--color-neutral-400)' }}>未填写</span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="detail-row">
                    <div className="detail-label">商品数量</div>
                    <div className="detail-value"><span className="mono">{selectedNode.productCount}</span></div>
                  </div>
                  {selectedNode.children && (
                    <div className="detail-row detail-row-span">
                      <div className="detail-label">子分类</div>
                      <div className="detail-value">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                          {selectedNode.children.map((child) => (
                            <span key={child.id} className="brand-series-tag" style={{ cursor: 'pointer' }} onClick={() => { setSelectedId(child.id); setEditing(false); }}>
                              {child.name} ({child.productCount})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!isRoot && (
                  <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                    {editing ? (
                      <>
                        <Button variant="ghost" onClick={handleCancelEdit}>关闭</Button>
                        <Button onClick={handleSaveEdit}>保存</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" onClick={handleStartEdit}>编辑</Button>
                        {selectedNode.productCount === 0 && (
                          <Button size="sm" style={{ background: '#eb5c20', color: '#fff', borderColor: '#eb5c20' }} onClick={() => setShowDeleteConfirm(true)}>删除</Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* 新增分类弹窗 */}
        {showAddDialog && (
          <div className="category-dialog-overlay" onClick={() => setShowAddDialog(null)}>
            <div className="category-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="category-dialog-title">
                新增{getLevelLabel(showAddDialog.level + 1)}
              </div>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>分类名称</label>
                <input id="add-category-input" className="detail-input" placeholder="请输入分类名称" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmAdd(); }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <Button variant="ghost" onClick={() => setShowAddDialog(null)}>关闭</Button>
                <Button onClick={handleConfirmAdd}>确认</Button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认弹窗 */}
        {showDeleteConfirm && selectedNode && (
          <div className="category-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="category-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="category-dialog-title">确认删除</div>
              <div style={{ marginBottom: 'var(--space-5)', fontSize: 'var(--text-base)', color: 'var(--color-neutral-600)', lineHeight: 'var(--leading-md)' }}>
                {selectedNode.productCount > 0 ? (
                  <span style={{ color: '#eb5c20' }}>分类「<span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)' }}>{selectedNode.name}</span>」下存在 {selectedNode.productCount} 件商品，不允许删除。请先移除或转移该分类下的所有商品。</span>
                ) : (
                  <>
                    确定要删除分类「<span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)' }}>{selectedNode.name}</span>」吗？{selectedNode.children && selectedNode.children.length > 0 && <span style={{ color: '#eb5c20', display: 'block', marginTop: 'var(--space-2)' }}>该分类下还有子分类，删除后将一并移除。</span>}
                  </>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>{selectedNode.productCount > 0 ? '关闭' : '取消'}</Button>
                {selectedNode.productCount === 0 && (
                  <Button style={{ background: '#eb5c20', color: '#fff', borderColor: '#eb5c20' }} onClick={() => { handleDelete(selectedNode.id); setShowDeleteConfirm(false); }}>确认删除</Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
