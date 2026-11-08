import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusTag from '../../components/common/StatusTag';
import Button from '../../components/common/Button';
import type {} from '../../types';


const weightUnits = [
  { name: '千克', symbol: 'kg', base: '基准单位', productCount: 86, active: true },
  { name: '克', symbol: 'g', base: '1 kg = 1000 g', productCount: 42, active: true },
  { name: '斤', symbol: '斤', base: '1 kg = 2 斤', productCount: 28, active: true },
  { name: '两', symbol: '两', base: '1 斤 = 10 两', productCount: 15, active: true },
  { name: '吨', symbol: 't', base: '1 t = 1000 kg', productCount: 8, active: true },
  { name: '磅', symbol: 'lb', base: '1 lb ≈ 0.454 kg', productCount: 3, active: false },
];

const packageUnits = [
  { name: '盒', symbol: '盒', base: '基准单位', productCount: 52, active: true },
  { name: '箱', symbol: '箱', base: '1 箱 = 20 盒', productCount: 18, active: true },
  { name: '袋', symbol: '袋', base: '基准单位', productCount: 35, active: true },
  { name: '罐', symbol: '罐', base: '基准单位', productCount: 22, active: true },
  { name: '提', symbol: '提', base: '1 提 = 7 饼', productCount: 6, active: true },
];

const specialUnits = [
  { name: '饼', symbol: '饼', base: '1 饼 = 357 g（普洱）', productCount: 12, active: true },
];

export default function SettingsUnit() {
  return (
    <>
      <ContentHeader title="单位设置" breadcrumbs={['系统', '单位设置']} />
      <div className="content-body">

        <Card title="重量单位" headerRight={
          <Button variant="ghost" size="sm"><PlusIcon /> 新增</Button>
        }>
          <Table
            headers={['单位名称', '单位符号', '换算基准', '关联商品数', '状态']}
            rows={weightUnits.map((u) => [
              <span style={{ fontWeight: 'var(--font-medium)' }}>{u.name}</span>,
              <span className="mono" style={{ color: 'var(--color-module-current-accent)' }}>{u.symbol}</span>,
              <span style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>{u.base}</span>,
              <span className="mono">{u.productCount}</span>,
              <StatusTag variant={u.active ? 'success' : 'warning'} label={u.active ? '启用' : '禁用'} />,
            ])}
          />
        </Card>

        <Card title="包装单位" style={{ marginTop: 'var(--space-5)' }} headerRight={
          <Button variant="ghost" size="sm"><PlusIcon /> 新增</Button>
        }>
          <Table
            headers={['单位名称', '单位符号', '换算基准', '关联商品数', '状态']}
            rows={packageUnits.map((u) => [
              <span style={{ fontWeight: 'var(--font-medium)' }}>{u.name}</span>,
              <span className="mono" style={{ color: 'var(--color-module-current-accent)' }}>{u.symbol}</span>,
              <span style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>{u.base}</span>,
              <span className="mono">{u.productCount}</span>,
              <StatusTag variant={u.active ? 'success' : 'warning'} label={u.active ? '启用' : '禁用'} />,
            ])}
          />
        </Card>

        <Card title="特殊单位" style={{ marginTop: 'var(--space-5)' }} headerRight={
          <Button variant="ghost" size="sm"><PlusIcon /> 新增</Button>
        }>
          <Table
            headers={['单位名称', '单位符号', '换算基准', '关联商品数', '状态']}
            rows={specialUnits.map((u) => [
              <span style={{ fontWeight: 'var(--font-medium)' }}>{u.name}</span>,
              <span className="mono" style={{ color: 'var(--color-module-current-accent)' }}>{u.symbol}</span>,
              <span style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>{u.base}</span>,
              <span className="mono">{u.productCount}</span>,
              <StatusTag variant={u.active ? 'success' : 'warning'} label={u.active ? '启用' : '禁用'} />,
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
