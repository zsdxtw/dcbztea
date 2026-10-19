import { pinyin } from 'pinyin-pro';

/**
 * 取文本中每个字符的拼音首字母并大写；非汉字字符按原字符大写
 * 例：'云茶优选' → 'YCYX'
 */
export function getInitials(text: string): string {
  return Array.from(text).map(ch => {
    if (!/[\u4e00-\u9fa5]/.test(ch)) return ch.toUpperCase();
    const r = pinyin(ch, { pattern: 'first', toneType: 'none', type: 'array' });
    return (r[0] ?? ch).toUpperCase();
  }).join('');
}

/**
 * 由合作商简称生成管理员登录账号
 * 规则：简称每个字的拼音首字母大写拼接 + 001
 * 例：'云茶优选' → 'YCYX001'
 */
export function genAdminAccount(shortName: string): string {
  return `${getInitials(shortName.trim())}001`;
}
