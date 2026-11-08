import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusTag from '../../components/common/StatusTag';
import Button from '../../components/common/Button';
import type {} from '../../types';


const backupRecords = [
  { name: '自动备份-20250715', time: '2025-07-15 02:00:15', size: '128.5 MB', type: '自动备份', status: 'success' as const },
  { name: '自动备份-20250714', time: '2025-07-14 02:00:12', size: '127.8 MB', type: '自动备份', status: 'success' as const },
  { name: '手动备份-20250713', time: '2025-07-13 16:30:45', size: '126.2 MB', type: '手动备份', status: 'success' as const },
  { name: '自动备份-20250713', time: '2025-07-13 02:00:08', size: '126.0 MB', type: '自动备份', status: 'success' as const },
  { name: '自动备份-20250712', time: '2025-07-12 02:00:10', size: '125.4 MB', type: '自动备份', status: 'success' as const },
  { name: '升级前备份-20250711', time: '2025-07-11 22:15:30', size: '124.8 MB', type: '手动备份', status: 'success' as const },
  { name: '自动备份-20250711', time: '2025-07-11 02:00:05', size: '124.5 MB', type: '自动备份', status: 'failed' as const },
  { name: '自动备份-20250710', time: '2025-07-10 02:00:18', size: '123.9 MB', type: '自动备份', status: 'success' as const },
  { name: '自动备份-20250709', time: '2025-07-09 02:00:22', size: '123.2 MB', type: '自动备份', status: 'success' as const },
  { name: '月度全量备份-20250701', time: '2025-07-01 01:00:00', size: '256.8 MB', type: '全量备份', status: 'success' as const },
];

function backupStatusToVariant(status: string) {
  switch (status) {
    case 'success': return 'success' as const;
    case 'failed': return 'error' as const;
    default: return 'info' as const;
  }
}

function backupStatusLabel(status: string) {
  switch (status) {
    case 'success': return '成功';
    case 'failed': return '失败';
    default: return status;
  }
}

export default function SettingsDataBackup() {
  return (
    <>
      <ContentHeader title="数据备份" breadcrumbs={['系统', '数据备份']} actions={<><Button variant="ghost">备份设置</Button><Button><PlusIcon />立即备份</Button></>} />
      <div className="content-body">
        <Card>
          <Table
            headers={['备份名称', '备份时间', '备份大小', '备份类型', '状态', '操作']}
            rows={backupRecords.map((b) => [
              <span style={{ fontWeight: 'var(--font-medium)' }}>{b.name}</span>,
              <span className="mono">{b.time}</span>,
              <span className="mono">{b.size}</span>,
              <span style={{ color: 'var(--color-module-current-accent)' }}>{b.type}</span>,
              <StatusTag variant={backupStatusToVariant(b.status)} label={backupStatusLabel(b.status)} />,
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="ghost" size="sm">恢复</Button>
                <Button variant="ghost" size="sm" style={{ color: '#E41726' }}>删除</Button>
              </div>,
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
