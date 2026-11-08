import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusTag from '../../components/common/StatusTag';
import Button from '../../components/common/Button';
import FilterBar, { FilterInput, FilterSelect } from '../../components/business/FilterBar';
import type {} from '../../types';


const userItems = [
  { username: 'admin', name: '系统管理员', role: '超级管理员', department: '信息部', phone: '138****8001', lastLogin: '2025-07-15 14:30', status: 'active' as const },
  { username: 'chenmgr', name: '陈经理', role: '部门经理', department: '管理层', phone: '139****5622', lastLogin: '2025-07-15 14:32', status: 'active' as const },
  { username: 'licg', name: '李仓管', role: '仓库管理员', department: '仓储部', phone: '136****3305', lastLogin: '2025-07-15 10:30', status: 'active' as const },
  { username: 'zhangkj', name: '张会计', role: '财务人员', department: '财务部', phone: '137****4456', lastLogin: '2025-07-14 17:45', status: 'active' as const },
  { username: 'wangxs', name: '王销售', role: '销售人员', department: '销售部', phone: '135****7789', lastLogin: '2025-07-14 16:20', status: 'active' as const },
  { username: 'zhaocg', name: '赵仓管', role: '仓库管理员', department: '仓储部', phone: '133****8812', lastLogin: '2025-07-14 15:08', status: 'active' as const },
  { username: 'liuxs', name: '刘销售', role: '销售人员', department: '销售部', phone: '158****2256', lastLogin: '2025-07-14 13:15', status: 'active' as const },
  { username: 'liug', name: '刘操作员', role: '操作员', department: '采购部', phone: '159****6634', lastLogin: '2025-07-14 14:55', status: 'active' as const },
  { username: 'lig', name: '李工', role: '质检人员', department: '品控部', phone: '186****9901', lastLogin: '2025-07-13 16:40', status: 'active' as const },
  { username: 'wangcg', name: '王仓管', role: '仓库管理员', department: '仓储部', phone: '187****1128', lastLogin: '2025-07-12 11:22', status: 'active' as const },
  { username: 'zhaoxs', name: '赵销售', role: '销售人员', department: '销售部', phone: '188****3356', lastLogin: '2025-07-11 09:30', status: 'inactive' as const },
  { username: 'liukj', name: '刘会计', role: '财务人员', department: '财务部', phone: '189****5578', lastLogin: '2025-07-10 15:20', status: 'active' as const },
];

function userStatusToVariant(status: string) {
  switch (status) {
    case 'active': return 'success' as const;
    case 'inactive': return 'warning' as const;
    default: return 'info' as const;
  }
}

function userStatusLabel(status: string) {
  switch (status) {
    case 'active': return '正常';
    case 'inactive': return '停用';
    default: return status;
  }
}

export default function SettingsUserManagement() {
  return (
    <>
      <ContentHeader title="用户管理" breadcrumbs={['系统', '用户管理']} actions={<Button><PlusIcon />新增用户</Button>} />
      <div className="content-body">
        <FilterBar>
          <FilterInput placeholder="搜索用户名、姓名..." />
          <FilterSelect options={['全部状态', '正常', '停用']} />
          <FilterSelect options={['全部角色', '超级管理员', '部门经理', '仓库管理员', '财务人员', '销售人员', '操作员', '质检人员']} />
        </FilterBar>
        <Card>
          <Table
            headers={['用户名', '姓名', '角色', '部门', '手机号', '最后登录', '状态']}
            rows={userItems.map((u) => [
              <span className="mono" style={{ fontWeight: 'var(--font-medium)' }}>{u.username}</span>,
              u.name,
              <span style={{ color: 'var(--color-module-current-accent)' }}>{u.role}</span>,
              u.department,
              <span className="mono">{u.phone}</span>,
              <span className="mono">{u.lastLogin}</span>,
              <StatusTag variant={userStatusToVariant(u.status)} label={userStatusLabel(u.status)} />,
            ])}
          />
        </Card>
      </div>
    </>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
