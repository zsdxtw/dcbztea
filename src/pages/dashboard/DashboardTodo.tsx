import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import TodoItem from '../../components/business/TodoItem';
import FilterBar, { FilterSelect } from '../../components/business/FilterBar';
import type {TodoItemData} from '../../types';


const allTodos: TodoItemData[] = [
  { text: '审核采购订单 PO-2025-0151', time: '10:30', done: false },
  { text: '确认龙井春茶入库', time: '09:15', done: true },
  { text: '跟进客户华茗堂回款', time: '14:00', done: false },
  { text: '盘点武夷仓区红茶品类', time: '16:00', done: false },
  { text: '更新普洱熟茶商品规格', time: '17:30', done: false },
  { text: '审批退货单 RT-2025-0012', time: '11:00', done: false },
  { text: '安排白牡丹批次质检', time: '13:30', done: true },
  { text: '准备月度财务报表', time: '18:00', done: false },
  { text: '联系供应商确认交期', time: '10:00', done: true },
  { text: '处理碧螺春库存预警', time: '15:30', done: false },
  { text: '审核费用报销 EX-2025-0023', time: '12:00', done: false },
  { text: '更新客户档案信息', time: '16:30', done: true },
];

export default function DashboardTodo() {
  return (
    <>
      <ContentHeader title="待办事项" breadcrumbs={['工作台', '待办事项']} />
      <div className="content-body">
        <FilterBar>
          <FilterSelect options={['全部状态', '待完成', '已完成']} />
          <FilterSelect options={['全部类型', '审批', '入库', '出库', '质检', '财务', '其他']} />
        </FilterBar>
        <Card>
          {allTodos.map((t, i) => <TodoItem key={i} data={t} />)}
        </Card>
      </div>
    </>
  );
}
