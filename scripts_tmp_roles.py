# -*- coding: utf-8 -*-
"""SalesCustomers:移除拓客人/维护人/跟单人字段与功能(pass1 修正版)。用后即删。"""
import io, re

p = 'src/pages/sales/SalesCustomers.tsx'
src = io.open(p, encoding='utf-8').read()
orig_len = len(src)

def rep(old, new, cnt=1):
    global src
    assert old in src, 'MISS ' + old[:70]
    src = src.replace(old, new, cnt)

# ── A. 平台列表「拓客人」列 + 单元格 ──
rep("'平台编号', '客户名称', '拓客人', '联系人', '联系人职务',", "'平台编号', '客户名称', '联系人', '联系人职务',")
rep("""                  <span key="liaison">{p.developerId ? getPersonDisplay(p.developerId, p.developerType, p.developerName) : '—'}</span>,
""", "")

# ── B. 客户列表三列 + 单元格 ──
rep("'客户名称', ...(activeTab === 'direct' ? ['是否经平台'] : []), ...(activeTab === 'personal' ? ['下单人'] : []), '拓客人', '维护人', '跟单人', '地区', '联系人',",
    "'客户名称', ...(activeTab === 'direct' ? ['是否经平台'] : []), ...(activeTab === 'personal' ? ['下单人'] : []), '地区', '联系人',")
rep("""                    <span key="developer" style={{ fontSize: 'var(--text-sm)' }}>{getPersonDisplay(c.developerId, c.developerType, c.developerName)}</span>,
                    <span key="maintainer" style={{ fontSize: 'var(--text-sm)' }}>{getPersonDisplay(c.maintainerId, c.maintainerType, c.maintainerName)}</span>,
                    <span key="follower" style={{ fontSize: 'var(--text-sm)' }}>{getPersonDisplay(c.followerId, c.followerType, c.followerName)}</span>,
""", "")

# ── C. 客户详情抽屉三个 InfoItem ──
rep("""                  <InfoItem label="拓客人">{getPersonDisplay(detailCustomer.developerId, detailCustomer.developerType, detailCustomer.developerName)}</InfoItem>
                  <InfoItem label="维护人">{getPersonDisplay(detailCustomer.maintainerId, detailCustomer.maintainerType, detailCustomer.maintainerName)}</InfoItem>
                  <InfoItem label="跟单人">{getPersonDisplay(detailCustomer.followerId, detailCustomer.followerType, detailCustomer.followerName)}</InfoItem>
""", "")

# ── D. 分润比例卡片区(整块) ──
i = src.index("              {detailCustomer.type !== 'personal' && (\n                <DrawerSection title=\"分润比例\">")
j = src.index("                </DrawerSection>\n              )}", i) + len("                </DrawerSection>\n              )}")
src = src[:i] + src[j:]

# ── E. 子组织表 拓客人/维护人 列与单元格 ──
rep("""                          <th>拓客人</th>
                          <th>维护人</th>
""", "")
rep("""                            <td>{getPersonDisplay(sub.developerId, sub.developerType, sub.developerName)}</td>
                            <td>{getPersonDisplay(sub.maintainerId, sub.maintainerType, sub.maintainerName)}</td>
""", "")

io.open(p, 'w', encoding='utf-8', newline='').write(src)
print('pass1 ok, len %d -> %d' % (orig_len, len(src)))
