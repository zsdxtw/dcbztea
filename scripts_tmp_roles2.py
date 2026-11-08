# -*- coding: utf-8 -*-
"""SalesCustomers pass2:表单/抽屉人员字段与分润比例移除。用后即删。"""
import io, re

p = 'src/pages/sales/SalesCustomers.tsx'
src = io.open(p, encoding='utf-8').read()
orig = len(src)

def cut(start, end, cnt=1):
    global src
    i = src.index(start)
    j = src.index(end, i) + len(end)
    src = src[:i] + src[j:]

# 1) 平台抽屉:拓客人 drawer-form-field 整块(嵌套结构,从 field div 到闭合)
cut("""            <div className="drawer-form-field" style={{ flex: 2 }}>
              <label className="drawer-label">拓客人</label>""",
"""            </div>
          </div>
""")

# 2) 平台抽屉:维护人 + 跟单人 两个 drawer-form-field(在 customerType!=='personal' 行内)
cut("""          {customerType !== 'personal' && (
            <div className="drawer-form-row">
              <div className="drawer-form-field">
                <label className="drawer-label">维护人</label>""",
"""              </div>
            </div>
          )}
""")

# 3) 分润比例标题与三项比例字段(整个两个条件块)
cut("""          {customerType !== 'personal' && (
            <div className="drawer-section-title">分润比例</div>
          )}
          {customerType !== 'personal' && (
            <div className="drawer-form-row">""",
"""          {customerType !== 'personal' && (
            <div className="drawer-form-row">""")
i = src.index("          {customerType !== 'personal' && (\n            <div className=\"drawer-form-row\">\n              <div className=\"drawer-form-field\">\n                <label className=\"drawer-label\">拓客人比例（%）</label>")
j = src.index("            </div>\n          )}", i) + len("            </div>\n          )}")
src = src[:i] + src[j:]

io.open(p, 'w', encoding='utf-8', newline='').write(src)
print('pass2 ok, %d -> %d' % (orig, len(src)))
