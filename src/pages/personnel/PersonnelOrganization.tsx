import { useState, useMemo } from 'react';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import StatusTag from '../../components/common/StatusTag';
import {
  orgNodes as initialOrgNodes,
  employees as initialEmployees,
  getOrgTree,
  getEmployeesByNode,
  getOrgNodeName,
  EMP_STATUS_LABELS,
} from '../../data/organization';
import type {OrgNode, Employee, OrgNodeType, StatusVariant} from '../../types';

/* ── 常量与辅助函数 ── */

const NODE_TYPE_LABELS: Record<OrgNodeType, string> = {
  company: '公司',
  department: '部门',
  team: '团队',
};

function empStatusToVariant(status: string): StatusVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'probation':
      return 'warning';
    case 'inactive':
      return 'default';
    default:
      return 'info';
  }
}

function orgStatusToVariant(status: string): StatusVariant {
  return status === 'active' ? 'success' : 'default';
}

function orgStatusLabel(status: string): string {
  return status === 'active' ? '启用' : '停用';
}

type DrawerMode = 'add-dept' | 'add-team' | 'edit';

interface DrawerState {
  mode: DrawerMode;
  node?: OrgNode;
  parentId?: string | null;
}

interface NodeForm {
  name: string;
  leader: string;
  status: 'active' | 'inactive';
  remark: string;
}

const emptyForm: NodeForm = { name: '', leader: '', status: 'active', remark: '' };

/* ── 主组件 ── */

export default function PersonnelOrganization() {
  const [nodes, setNodes] = useState<OrgNode[]>(initialOrgNodes.map((n) => ({ ...n })));
  const [emps, setEmps] = useState<Employee[]>(initialEmployees.map((e) => ({ ...e })));
  const [selectedId, setSelectedId] = useState<string | null>(
    initialOrgNodes.find((n) => n.type === 'company')?.id ?? null,
  );
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [form, setForm] = useState<NodeForm>(emptyForm);
  const [addEmpId, setAddEmpId] = useState<string>('');

  const company = useMemo(() => nodes.find((n) => n.type === 'company') ?? null, [nodes]);
  const departments = useMemo(
    () =>
      nodes
        .filter((n) => n.type === 'department' && n.parentId === company?.id)
        .sort((a, b) => a.sort - b.sort),
    [nodes, company],
  );
  const teamsOf = (deptId: string): OrgNode[] =>
    nodes.filter((n) => n.type === 'team' && n.parentId === deptId).sort((a, b) => a.sort - b.sort);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId]);

  /* 统计卡片 */

  /* 当前节点下的员工 */
  const nodeEmployees = useMemo(() => {
    if (!selectedNode) return [];
    return emps.filter((e) => e.departmentId === selectedNode.id || e.teamId === selectedNode.id);
  }, [emps, selectedNode]);

  /* 可加入当前节点的员工 */
  const availableEmployees = useMemo(() => {
    if (!selectedNode) return [];
    if (selectedNode.type === 'department') {
      return emps.filter((e) => e.departmentId !== selectedNode.id);
    }
    if (selectedNode.type === 'team') {
      return emps.filter((e) => e.teamId !== selectedNode.id);
    }
    return [];
  }, [emps, selectedNode]);

  /* ── CRUD 操作 ── */

  const openAddDepartment = () => {
    setForm(emptyForm);
    setDrawer({ mode: 'add-dept', parentId: company?.id ?? null });
  };

  const openAddTeam = (dept: OrgNode) => {
    setForm(emptyForm);
    setDrawer({ mode: 'add-team', parentId: dept.id });
  };

  const openEdit = (node: OrgNode) => {
    setForm({
      name: node.name,
      leader: node.leader ?? '',
      status: node.status,
      remark: node.remark ?? '',
    });
    setDrawer({ mode: 'edit', node });
  };

  const handleSave = () => {
    if (!drawer) return;
    if (!form.name.trim()) {
      window.alert('请输入名称');
      return;
    }

    if (drawer.mode === 'edit' && drawer.node) {
      const target = drawer.node;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === target.id
            ? { ...n, name: form.name.trim(), leader: form.leader.trim(), status: form.status, remark: form.remark.trim() }
            : n,
        ),
      );
    } else if (drawer.mode === 'add-dept') {
      const newId = `dept-${Date.now()}`;
      const maxSort = nodes.filter((n) => n.type === 'department').reduce((m, n) => Math.max(m, n.sort), 0);
      const newNode: OrgNode = {
        id: newId,
        type: 'department',
        name: form.name.trim(),
        parentId: drawer.parentId ?? null,
        leader: form.leader.trim() || undefined,
        sort: maxSort + 1,
        status: 'active',
        remark: form.remark.trim() || undefined,
      };
      setNodes((prev) => [...prev, newNode]);
      setSelectedId(newId);
    } else if (drawer.mode === 'add-team') {
      const newId = `team-${Date.now()}`;
      const siblings = nodes.filter((n) => n.type === 'team' && n.parentId === drawer.parentId);
      const maxSort = siblings.reduce((m, n) => Math.max(m, n.sort), 0);
      const newNode: OrgNode = {
        id: newId,
        type: 'team',
        name: form.name.trim(),
        parentId: drawer.parentId ?? null,
        leader: form.leader.trim() || undefined,
        sort: maxSort + 1,
        status: 'active',
        remark: form.remark.trim() || undefined,
      };
      setNodes((prev) => [...prev, newNode]);
      setSelectedId(newId);
    }
    setDrawer(null);
  };

  const handleDelete = (node: OrgNode) => {
    const toDelete = new Set<string>([node.id]);
    let changed = true;
    while (changed) {
      changed = false;
      nodes.forEach((n) => {
        if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
          toDelete.add(n.id);
          changed = true;
        }
      });
    }
    const childCount = toDelete.size - 1;
    const empCount = emps.filter((e) => toDelete.has(e.departmentId) || (e.teamId ? toDelete.has(e.teamId) : false)).length;

    const msg =
      node.type === 'department'
        ? `确定要删除部门「${node.name}」吗？该部门下有 ${childCount} 个团队${empCount > 0 ? `、${empCount} 名员工` : ''}，删除后其下团队将一并删除，员工归属将被清空。此操作不可撤销。`
        : `确定要删除团队「${node.name}」吗？${empCount > 0 ? `该团队下有 ${empCount} 名员工，员工归属将被清空。` : ''}此操作不可撤销。`;

    if (!window.confirm(msg)) return;

    setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
    setEmps((prev) =>
      prev.map((e) => {
        const next = { ...e };
        if (toDelete.has(e.departmentId)) next.departmentId = '';
        if (e.teamId && toDelete.has(e.teamId)) next.teamId = undefined;
        return next;
      }),
    );
    if (selectedId && toDelete.has(selectedId)) {
      setSelectedId(company?.id ?? null);
    }
  };

  /* 员工归属操作 */
  const handleAddEmployee = () => {
    if (!addEmpId || !selectedNode) return;
    const target = selectedNode;
    setEmps((prev) =>
      prev.map((e) => {
        if (e.id !== addEmpId) return e;
        if (target.type === 'department') {
          return { ...e, departmentId: target.id };
        }
        if (target.type === 'team') {
          return { ...e, teamId: target.id, departmentId: target.parentId ?? e.departmentId };
        }
        return e;
      }),
    );
    setAddEmpId('');
  };

  const handleRemoveEmployee = (empId: string) => {
    if (!selectedNode) return;
    const target = selectedNode;
    setEmps((prev) =>
      prev.map((e) => {
        if (e.id !== empId) return e;
        if (target.type === 'department') {
          return { ...e, departmentId: '', teamId: undefined };
        }
        if (target.type === 'team') {
          return { ...e, teamId: undefined };
        }
        return e;
      }),
    );
  };

  return (
    <>
      <ContentHeader
        title="组织架构"
        breadcrumbs={['人员', '组织架构']}
        actions={<Button onClick={openAddDepartment}><PlusIcon />新增部门</Button>}
      />
      <div className="content-body">

        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'stretch' }}>
          {/* 左侧：组织架构树 */}
          <div style={{ flex: '0 0 30%', minWidth: 280 }}>
            <OrgTree
              company={company}
              departments={departments}
              teamsOf={teamsOf}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAddDepartment={openAddDepartment}
              onAddTeam={openAddTeam}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* 右侧：节点详情 + 员工列表 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <NodeDetailPanel
              node={selectedNode}
              employees={nodeEmployees}
              availableEmployees={availableEmployees}
              addEmpId={addEmpId}
              onAddEmpIdChange={setAddEmpId}
              onAddEmployee={handleAddEmployee}
              onRemoveEmployee={handleRemoveEmployee}
              onEdit={openEdit}
              getParentName={(id) => nodes.find((n) => n.id === id)?.name ?? '-'}
            />
          </div>
        </div>
      </div>

      {/* 新增/编辑抽屉 */}
      {drawer && (
        <EditNodeDrawer
          drawer={drawer}
          form={form}
          onFormChange={setForm}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
          parentName={
            drawer.mode === 'add-dept'
              ? company?.name ?? '-'
              : drawer.mode === 'add-team'
                ? nodes.find((n) => n.id === drawer.parentId)?.name ?? '-'
                : '-'
          }
        />
      )}
    </>
  );
}

/* ── 子组件：组织架构树 ── */

interface OrgTreeProps {
  company: OrgNode | null;
  departments: OrgNode[];
  teamsOf: (deptId: string) => OrgNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddDepartment: () => void;
  onAddTeam: (dept: OrgNode) => void;
  onEdit: (node: OrgNode) => void;
  onDelete: (node: OrgNode) => void;
}

function OrgTree(props: OrgTreeProps) {
  const { company, departments, teamsOf, selectedId, onSelect, onAddDepartment, onAddTeam, onEdit, onDelete } = props;

  const inputBtnStyle: React.CSSProperties = {
    padding: '0 6px', height: 22, fontSize: 'var(--text-xs)', lineHeight: 1,
    display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'pointer',
    border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-sm)',
    background: 'var(--color-neutral-0)', color: 'var(--color-neutral-500)',
  };

  return (
    <Card
      title="组织架构树"
      headerRight={
        <Button size="sm" onClick={onAddDepartment}><PlusIcon />新增部门</Button>
      }
    >
      {company ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {/* 公司节点 */}
          <div
            onClick={() => onSelect(company.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--space-2) var(--space-3)',
              cursor: 'pointer', borderRadius: 'var(--radius-md)',
              background: selectedId === company.id ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-50)',
              borderLeft: selectedId === company.id ? '3px solid var(--color-module-current-base)' : '3px solid transparent',
              fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)',
              fontSize: 'var(--text-sm)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CompanyIcon />
              <span>{company.name}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', fontWeight: 'var(--font-regular)' }}>
                ({NODE_TYPE_LABELS[company.type]})
              </span>
            </span>
          </div>

          {/* 部门 + 团队 */}
          {departments.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>
              暂无部门，点击右上角「新增部门」开始创建
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
              {departments.map((dept) => {
                const teams = teamsOf(dept.id);
                const deptSelected = selectedId === dept.id;
                return (
                  <div key={dept.id}>
                    {/* 部门节点 */}
                    <div
                      onClick={() => onSelect(dept.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: 'var(--space-2) var(--space-3)', marginLeft: 20,
                        cursor: 'pointer', borderRadius: 'var(--radius-md)',
                        background: deptSelected ? 'var(--color-module-current-lightest)' : 'transparent',
                        borderLeft: deptSelected ? '3px solid var(--color-module-current-base)' : '3px solid transparent',
                        color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <DeptIcon />
                        <span style={{ fontWeight: 'var(--font-medium)' }}>{dept.name}</span>
                        {dept.leader && (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>· {dept.leader}</span>
                        )}
                      </span>
                      <span style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        <span style={inputBtnStyle} onClick={() => onAddTeam(dept)} title="新增子团队">
                          <PlusIcon />子团队
                        </span>
                        <span style={inputBtnStyle} onClick={() => onEdit(dept)} title="编辑">编辑</span>
                        <span
                          style={{ ...inputBtnStyle, color: 'var(--color-semantic-error)', borderColor: 'var(--color-semantic-error)' }}
                          onClick={() => onDelete(dept)}
                          title="删除"
                        >
                          删除
                        </span>
                      </span>
                    </div>

                    {/* 团队节点 */}
                    {teams.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                        {teams.map((team) => {
                          const teamSelected = selectedId === team.id;
                          return (
                            <div
                              key={team.id}
                              onClick={() => onSelect(team.id)}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: 'var(--space-2) var(--space-3)', marginLeft: 40,
                                cursor: 'pointer', borderRadius: 'var(--radius-md)',
                                background: teamSelected ? 'var(--color-module-current-lightest)' : 'transparent',
                                borderLeft: teamSelected ? '3px solid var(--color-module-current-base)' : '3px solid transparent',
                                color: 'var(--color-neutral-600)', fontSize: 'var(--text-sm)',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <TeamIcon />
                                <span>{team.name}</span>
                                {team.leader && (
                                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>· {team.leader}</span>
                                )}
                              </span>
                              <span style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                                <span style={inputBtnStyle} onClick={() => onEdit(team)} title="编辑">编辑</span>
                                <span
                                  style={{ ...inputBtnStyle, color: 'var(--color-semantic-error)', borderColor: 'var(--color-semantic-error)' }}
                                  onClick={() => onDelete(team)}
                                  title="删除"
                                >
                                  删除
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>
          暂无组织数据
        </div>
      )}
    </Card>
  );
}

/* ── 子组件：右侧详情面板 ── */

interface NodeDetailPanelProps {
  node: OrgNode | null;
  employees: Employee[];
  availableEmployees: Employee[];
  addEmpId: string;
  onAddEmpIdChange: (id: string) => void;
  onAddEmployee: () => void;
  onRemoveEmployee: (empId: string) => void;
  onEdit: (node: OrgNode) => void;
  getParentName: (id: string) => string;
}

function NodeDetailPanel(props: NodeDetailPanelProps) {
  const { node, employees, availableEmployees, addEmpId, onAddEmpIdChange, onAddEmployee, onRemoveEmployee, onEdit, getParentName } = props;

  const inputStyle: React.CSSProperties = {
    height: 34, padding: '0 var(--space-3)', border: '1px solid var(--color-neutral-200)',
    borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-family-sans)',
    color: 'var(--color-neutral-700)', background: 'var(--color-neutral-0)',
  };

  if (!node) {
    return (
      <Card>
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-neutral-400)' }}>
          请在左侧选择一个组织节点查看详情
        </div>
      </Card>
    );
  }

  const canManageEmployees = node.type === 'department' || node.type === 'team';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* 节点详情 */}
      <Card
        title="节点详情"
        headerRight={
          node.type !== 'company' ? (
            <Button size="sm" variant="ghost" onClick={() => onEdit(node)}>编辑节点</Button>
          ) : undefined
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3) var(--space-6)' }}>
          <DetailItem label="节点名称" value={node.name} />
          <DetailItem label="节点类型" value={NODE_TYPE_LABELS[node.type]} />
          <DetailItem label="负责人" value={node.leader || '—'} />
          <DetailItem
            label="状态"
            value={<StatusTag variant={orgStatusToVariant(node.status)} label={orgStatusLabel(node.status)} />}
          />
          {node.parentId && <DetailItem label="上级节点" value={getParentName(node.parentId)} />}
          <DetailItem label="备注" value={node.remark || '—'} />
        </div>
      </Card>

      {/* 员工列表 */}
      <Card
        title={`下属员工（${employees.length}）`}
        headerRight={
          canManageEmployees ? (
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <select
                value={addEmpId}
                onChange={(e) => onAddEmpIdChange(e.target.value)}
                style={{ ...inputStyle, width: 200 }}
              >
                <option value="">选择员工加入...</option>
                {availableEmployees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.empNo} · {e.name}（{e.position}）
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={onAddEmployee} disabled={!addEmpId}>加入</Button>
            </div>
          ) : undefined
        }
      >
        {employees.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>
            {canManageEmployees ? '该节点下暂无员工，可通过右上角下拉选择员工加入' : '该节点下暂无员工'}
          </div>
        ) : (
          <Table
            headers={['工号', '姓名', '职位', '手机号', '状态', canManageEmployees ? '操作' : ''].filter(Boolean)}
            rows={employees.map((e) => {
              const cells: React.ReactNode[] = [
                <span className="cell-mono-emph">{e.empNo}</span>,
                e.name,
                <span style={{ color: 'var(--color-module-current-base)' }}>{e.position}</span>,
                <span className="mono">{e.phone}</span>,
                <StatusTag variant={empStatusToVariant(e.status)} label={EMP_STATUS_LABELS[e.status] ?? e.status} />,
              ];
              if (canManageEmployees) {
                cells.push(
                  <div className="row-actions">
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ color: 'var(--color-semantic-error)' }}
                      onClick={() => onRemoveEmployee(e.id)}
                    >
                      移出
                    </Button>
                  </div>,
                );
              }
              return cells;
            })}
          />
        )}
      </Card>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-800)', fontWeight: 'var(--font-medium)' }}>{value}</span>
    </div>
  );
}

/* ── 子组件：新增/编辑抽屉 ── */

interface EditNodeDrawerProps {
  drawer: DrawerState;
  form: NodeForm;
  onFormChange: (form: NodeForm) => void;
  onClose: () => void;
  onSave: () => void;
  parentName: string;
}

function EditNodeDrawer(props: EditNodeDrawerProps) {
  const { drawer, form, onFormChange, onClose, onSave, parentName } = props;

  const titleMap: Record<DrawerMode, string> = {
    'add-dept': '新增部门',
    'add-team': '新增团队',
    'edit': '编辑节点',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 34, padding: '0 var(--space-3)',
    border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)', fontFamily: 'var(--font-family-sans)',
    color: 'var(--color-neutral-700)', background: 'var(--color-neutral-0)',
  };

  const isEdit = drawer.mode === 'edit';

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">{titleMap[drawer.mode]}</span>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>
        <div className="drawer-body">
          <div className="drawer-form-field" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="drawer-label">上级节点</label>
            <input style={{ ...inputStyle, background: 'var(--color-neutral-50)', color: 'var(--color-neutral-500)' }} value={parentName} disabled />
          </div>

          <div className="drawer-form-field" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="drawer-label">
              {drawer.mode === 'add-dept' ? '部门名称' : drawer.mode === 'add-team' ? '团队名称' : '节点名称'}
              <span style={{ color: 'var(--color-semantic-error)' }}> *</span>
            </label>
            <input
              style={inputStyle}
              placeholder={drawer.mode === 'add-dept' ? '请输入部门名称' : drawer.mode === 'add-team' ? '请输入团队名称' : '请输入节点名称'}
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            />
          </div>

          <div className="drawer-form-field" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="drawer-label">负责人</label>
            <input
              style={inputStyle}
              placeholder="请输入负责人姓名"
              value={form.leader}
              onChange={(e) => onFormChange({ ...form, leader: e.target.value })}
            />
          </div>

          {isEdit && (
            <div className="drawer-form-field" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="drawer-label">状态</label>
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => onFormChange({ ...form, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          )}

          <div className="drawer-form-field">
            <label className="drawer-label">备注</label>
            <textarea
              style={{ ...inputStyle, height: 'auto', minHeight: 80, padding: 'var(--space-2) var(--space-3)', resize: 'vertical' }}
              placeholder="请输入备注信息（选填）"
              value={form.remark}
              onChange={(e) => onFormChange({ ...form, remark: e.target.value })}
            />
          </div>
        </div>
        <div className="drawer-footer">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={onSave}>保存</Button>
        </div>
      </div>
    </div>
  );
}

/* ── 图标组件 ── */

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function CompanyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{ color: 'var(--color-module-current-base)' }}>
      <path d="M2 14V5l6-3 6 3v9" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 14V9h4v5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function DeptIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="13" height="13" style={{ color: 'var(--color-neutral-500)' }}>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 7h11M6 3.5v9M10 3.5v9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="13" height="13" style={{ color: 'var(--color-neutral-400)' }}>
      <circle cx="5.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 13a3 3 0 016 0M7.5 13a3 3 0 016 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function EmpIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 16a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ActiveEmpIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 16a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="14" cy="14" r="3" fill="var(--color-semantic-success)" />
      <path d="M12.8 14l1 1 1.4-1.6" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}