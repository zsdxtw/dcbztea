# -*- coding: utf-8 -*-
"""新建销售单: 客户类型+名称一行 / 侧单号+下单时间一行 / 备注移入订单信息(多行)"""
import io

p = 'src/pages/sales/OrderEntry.tsx'
s = io.open(p, encoding='utf-8').read()
def rep(old, new):
    global s
    assert old in s, 'NOT FOUND: ' + old[:70]
    s = s.replace(old, new, 1)

# 1. 拆分原三列行：客户类型 + 客户名称(带下拉) 同行；客户侧订单号 + 客户下单时间 同行
rep("""          {/* 客户类型(仅直接销售)+ 客户侧订单号 + 客户下单时间 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            {!isVia && (
              <div>
                {label('客户类型', true)}
                <select className="filter-input" value={customerType} onChange={(e) => changeCustomerType(e.target.value)} style={{ width: '100%' }}>
                  {DIRECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div>
              {label('客户侧订单号（客户下单渠道的单号，非必输）')}
              <input className="filter-input" placeholder="客户侧订单号" value={customerOrderNo} onChange={(e) => setCustomerOrderNo(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              {label('客户下单时间')}
              <input className="filter-input" type="datetime-local" value={customerOrderTime} onChange={(e) => setCustomerOrderTime(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>

          {/* 客户名称(直接销售=各类型客户;经平台销售=终端直营客户)：可搜索下拉（点击展开全部在库客户，输入即过滤） */}
          <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>""",
"""          {/* 客户类型 + 客户名称 同行 */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            {!isVia && (
              <div style={{ width: 200, flexShrink: 0 }}>
                {label('客户类型', true)}
                <select className="filter-input" value={customerType} onChange={(e) => changeCustomerType(e.target.value)} style={{ width: '100%' }}>
                  {DIRECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div style={{ flex: 1, position: 'relative' }}>""")

rep("""              {matchedCustomer && (
              <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span>✓ 已匹配在库客户</span>
                <span>联系人：{matchedCustomer.contactPerson}</span>
                <span>等级：{matchedCustomer.level}</span>
              </div>
            )}
          </div>
""",
"""              {matchedCustomer && (
              <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-module-current-lightest)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span>✓ 已匹配在库客户</span>
                <span>联系人：{matchedCustomer.contactPerson}</span>
                <span>等级：{matchedCustomer.level}</span>
              </div>
            )}
            </div>
          </div>

          {/* 客户侧订单号 + 客户下单时间 同行 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              {label('客户侧订单号（客户下单渠道的单号，非必输）')}
              <input className="filter-input" placeholder="客户侧订单号" value={customerOrderNo} onChange={(e) => setCustomerOrderNo(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              {label('客户下单时间')}
              <input className="filter-input" type="datetime-local" value={customerOrderTime} onChange={(e) => setCustomerOrderTime(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
""")

# 2. 备注移入订单信息：收货详细地址行后追加备注（多行 textarea）
rep("""            <div>
              {label('详细地址', true)}
              <input className="filter-input" placeholder="街道、门牌号" value={receiverAddress} onChange={(e) => { setReceiverAddress(e.target.value); setError(''); }} style={{ width: '100%' }} />
            </div>
          </div>
        </Card>""",
"""            <div>
              {label('详细地址', true)}
              <input className="filter-input" placeholder="街道、门牌号" value={receiverAddress} onChange={(e) => { setReceiverAddress(e.target.value); setError(''); }} style={{ width: '100%' }} />
            </div>
          </div>

          {/* 备注（多行，订单信息内） */}
          <div style={{ marginBottom: 'var(--space-3)' }}>
            {label('备注')}
            <textarea
              className="filter-input" placeholder="订单备注（平台要求、客户要求等）"
              value={remark} onChange={(e) => setRemark(e.target.value)}
              style={{ width: '100%', minHeight: 64, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>
        </Card>""")

# 3. 删除原备注 Card：标题保留(错误提示+按钮区搬入商品明细后容器)。原结构: Card备注 > input > error > 按钮区。
rep("""        <Card title="备注" style={{ marginTop: 'var(--space-4)' }}>
          <input className="filter-input" placeholder="订单备注（平台要求、客户要求等）" value={remark} onChange={(e) => setRemark(e.target.value)} style={{ width: '100%' }} />
          {error && (""",
"""        <Card title="提交订单" style={{ marginTop: 'var(--space-4)' }}>
          {error && (""")

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
