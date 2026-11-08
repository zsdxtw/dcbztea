/**
 * 终端体系常量（四端统一命名，全站引用）
 * admin 管理后台 / partner 合作商工作台 / customer 客户采买平台 / selfop 自营工作台
 */

export type TerminalKey = 'admin' | 'partner' | 'customer' | 'selfop';

export interface TerminalDef {
  key: TerminalKey;
  /** 终端全称（品牌副题 / 登录页 / 浏览器标题用） */
  name: string;
  /** 简称（顶栏切换按钮等紧凑场景） */
  short: string;
  /** 浏览器标题 */
  docTitle: string;
  /** 路由前缀 */
  base: string;
  /** 登录入口（admin 免登，指向首页） */
  loginPath: string;
  /** 侧边栏品牌副题（admin 主站无副题） */
  brandSub?: string;
  /** body.dataset.module 主题（终端独立配色） */
  themeModule: string;
}

export const TERMINALS: Record<TerminalKey, TerminalDef> = {
  admin: {
    key: 'admin',
    name: '淡茶半盏管理后台',
    short: '管理后台',
    docTitle: '淡茶半盏 — 管理后台',
    base: '',
    loginPath: '/dashboard',
    themeModule: 'dashboard',
  },
  partner: {
    key: 'partner',
    name: '合作商工作台',
    short: '合作商工作台',
    docTitle: '淡茶半盏 — 合作商工作台',
    base: '/partner',
    loginPath: '/partner/login',
    brandSub: '合作商工作台',
    themeModule: 'product',
  },
  customer: {
    key: 'customer',
    name: '客户采买平台',
    short: '客户采买平台',
    docTitle: '淡茶半盏 — 客户采买平台',
    base: '/customer',
    loginPath: '/customer/login',
    brandSub: '客户采买平台',
    themeModule: 'product',
  },
  selfop: {
    key: 'selfop',
    name: '自营工作台',
    short: '自营工作台',
    docTitle: '淡茶半盏 — 自营工作台',
    base: '/selfop',
    loginPath: '/selfop/login',
    brandSub: '自营工作台',
    themeModule: 'sales',
  },
};

/** 顶栏终端切换按钮顺序（管理后台视角，不含自身） */
export const TERMINAL_SWITCH_LIST: TerminalDef[] = [
  TERMINALS.partner,
  TERMINALS.selfop,
  TERMINALS.customer,
];

/** 设置当前终端的浏览器标题 */
export const setTerminalDocTitle = (key: TerminalKey) => {
  document.title = TERMINALS[key].docTitle;
};
