# -*- coding: utf-8 -*-
"""SalesCustomers pass3:稳健块移除(div 深度配对 + Field 块)。用后即删。"""
import io, re

p = 'src/pages/sales/SalesCustomers.tsx'
src = io.open(p, encoding='utf-8').read()
lines = src.split('\n')

def remove_div_block_by_label(label_text):
    """删除包含指定 drawer-label 的 drawer-form-field div 整块(div 深度配对)"""
    for i, line in enumerate(lines):
        if f'<label className="drawer-label">{label_text}</label>' in line:
            # 回溯到该 field div 的开始行
            start = i
            while start > 0 and '<div className="drawer-form-field' not in lines[start]:
                start -= 1
            # 前向按 div 深度找闭合
            depth = 0
            j = start
            while j < len(lines):
                depth += len(re.findall(r'<div\b', lines[j]))
                depth -= len(re.findall(r'</div>', lines[j]))
                if depth <= 0:
                    break
                j += 1
            del lines[start:j + 1]
            return True
    return False

# 1) drawer-form-field 块:拓客人 / 维护人 / 跟单人(平台抽屉)
for lb in ['拓客人', '维护人', '跟单人']:
    print(lb, remove_div_block_by_label(lb))

# 2) 分润比例:标题行 + 三个比例 field + 合计 field(均按 label 删除块)
for lb in ['拓客人比例（%）', '维护人比例（%）', '跟单人比例（%）']:
    print(lb, remove_div_block_by_label(lb))
# 合计 field
for i, line in enumerate(lines):
    if '合计：' in line and 'profitShare' in line:
        start = i
        while start > 0 and '<div className="drawer-form-field' not in lines[start]:
            start -= 1
        depth = 0
        j = start
        while j < len(lines):
            depth += len(re.findall(r'<div\b', lines[j]))
            depth -= len(re.findall(r'</div>', lines[j]))
            if depth <= 0:
                break
            j += 1
        del lines[start:j + 1]
        break
# 分润比例小标题行
lines[:] = [l for l in lines if '<div className="drawer-section-title">分润比例</div>' not in l]

# 3) Field 组件块:拓客人/维护人/跟单人(子组织与平台编辑表单)
for lb in ['拓客人', '维护人', '跟单人']:
    pat = re.compile(r'                <Field label="' + lb + r'" full>[\s\S]*?                </Field>\n')
    n = len(pat.findall(src))
    # 基于行数组处理更稳:src 重新从 lines 生成
    src = '\n'.join(lines)
    m = re.search(r'<Field label="' + lb + r'" full>[\s\S]*?</Field>', src)
    while m:
        src = src[:m.start()] + src[m.end():]
        m = re.search(r'<Field label="' + lb + r'" full>[\s\S]*?</Field>', src)
    print('Field', lb, 'removed x', n)
    lines = src.split('\n')

# 4) 平台详情 InfoItem 拓客人
src = '\n'.join(lines)
src = re.sub(r'\s*<InfoItem label="拓客人">\{getPersonDisplay\(detailPlatform\.developerId, detailPlatform\.developerType, detailPlatform\.developerName\)\}</InfoItem>', '', src)

# 5) 平台保存 payload 三字段
src = src.replace(", developerId: form.developerId, developerType: form.developerType, developerName: form.developerName", "")

# 6) 表单默认 profitShare
src = src.replace("    profitShare: { developerRatio: 50, maintainerRatio: 0, followerRatio: 40 },\n", "")

lines = src.split('\n')
# 7) 删除残留空行堆积(连续3空行压缩为1)
out = []
blank = 0
for l in lines:
    if l.strip() == '':
        blank += 1
        if blank > 2:
            continue
    else:
        blank = 0
    out.append(l)

io.open(p, 'w', encoding='utf-8', newline='').write('\n'.join(out))
print('pass3 done')
