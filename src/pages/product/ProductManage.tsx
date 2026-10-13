import { useState, useMemo, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../../components/layout/ContentHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import StatusTag from '../../components/common/StatusTag';
import { getShelfStatusLabel, getPurchaseStatusLabel, getProductionStatusLabel } from '../../data/teaProducts';
import { usePriceStore } from '../../stores/priceStore';
import { TeaProduct, TeaCategory } from '../../types';
import {
  teaCategoryData,
  teawareCategoryData,
  teaPeripheralCategoryData,
  otherCategoryData,
  productCategoryLabels,
  getCategoryDataByType,
  type ProductCategoryType,
  type CategoryNode,
} from '../../data/productCategories';
import { brandItems } from '../../data/brands';
import { generateProductCode } from '../../utils/productCode';
import { weightUnits, dimensionUnits, packageUnits } from '../../data/units';

const PAGE_SIZE = 20;

/** 茶类中文名 -> TeaCategory 枚举映射 */
const CATEGORY_MAP: Record<string, TeaCategory> = {
  '绿茶': TeaCategory.GREEN,
  '红茶': TeaCategory.RED,
  '青茶': TeaCategory.OOLONG,
  '白茶': TeaCategory.WHITE,
  '黄茶': TeaCategory.YELLOW,
  '黑茶': TeaCategory.DARK,
  '花草茶': TeaCategory.FLOWER,
};

/** 茶类主色映射 */
const CATEGORY_COLORS: Record<string, string> = {
  '绿茶': '#7BA23F',
  '红茶': '#A7413B',
  '青茶': '#5B6A3E',
  '白茶': '#D6B577',
  '黄茶': '#C9A84C',
  '黑茶': '#4A3B2A',
  '花草茶': '#B03070',
};

/** 一级分类数据映射 */
const CATEGORY_DATA_MAP: Record<ProductCategoryType, CategoryNode> = {
  tea: teaCategoryData,
  teaware: teawareCategoryData,
  'tea-peripheral': teaPeripheralCategoryData,
  other: otherCategoryData,
};

/** 从 category 字符串提取茶类枚举，如 "绿茶-西湖龙井" -> TeaCategory.GREEN */
function parseCategory(category: string): TeaCategory | null {
  const prefix = category.split('-')[0];
  return CATEGORY_MAP[prefix] ?? null;
}

/** 从商品 category 判断其所属一级分类类型 */
function getProductL1Type(category: string): ProductCategoryType | null {
  const first = category.split('-')[0];
  const teaL2Names = (teaCategoryData.children || []).map((c) => c.name);
  if (teaL2Names.includes(first)) return 'tea';
  const teawareL2Names = (teawareCategoryData.children || []).map((c) => c.name);
  if (teawareL2Names.includes(first)) return 'teaware';
  const peripheralL2Names = (teaPeripheralCategoryData.children || []).map((c) => c.name);
  if (peripheralL2Names.includes(first)) return 'tea-peripheral';
  const otherL2Names = (otherCategoryData.children || []).map((c) => c.name);
  if (otherL2Names.includes(first)) return 'other';
  return null;
}

interface ProductManageProps {
  /** 当前管理的一级分类类型 */
  categoryType: ProductCategoryType;
  /** 页面标题 */
  pageTitle: string;
  /** 面包屑路径 */
  breadcrumbs: string[];
}

/** 新增商品表单初始值（按一级分类动态设置默认 L1） */
function createEmptyForm(categoryType: ProductCategoryType) {
  return {
    name: '',
    selectedL1List: [categoryType] as ProductCategoryType[],
    selectedL2: [] as string[],
    selectedL3: [] as string[],
    brand: '',
    series: '',
    isNewSeries: false,
    newSeriesName: '',
    packageUnit: '罐',
    barcode69: '',
    model: '',
    spec: '',
    perUnitSpec: {
      netWeight: 0,
      netWeightUnit: 'g',
      grossWeight: 0,
      grossWeightUnit: 'g',
      length: 0,
      width: 0,
      height: 0,
      dimensionUnit: 'cm',
    },
    perBoxSpec: {
      quantity: 0,
      netWeight: 0,
      netWeightUnit: 'kg',
      grossWeight: 0,
      grossWeightUnit: 'kg',
      length: 0,
      width: 0,
      height: 0,
      dimensionUnit: 'cm',
    },
    weight: 0,
    volume: { length: 0, width: 0, height: 0 },
    quantityPerUnit: 0,
    grade: '',
    origin: '',
    shelfLife: 12,
    taxRate: 9,
    packageList: '',
    marketPrice: 0,
    tmallPrice: 0,
    tmallUrl: '',
    jdPrice: 0,
    jdUrl: '',
    shelfStatus: 'on' as 'on' | 'off',
    purchaseStatus: 'available' as 'available' | 'stopped',
    productionStatus: 'producing' as 'producing' | 'stopped',
    mainImages: [] as string[],
    detailImages: [] as string[],
    displayImageIndex: 0,
    stockAlert: 50,
    stock: 0,
    reservedStock: 0,
    totalSales: 0,
    features: '',
    includesTeaware: false,
    remark: '',
  };
}

/** 通用商品管理组件：按一级分类（茶叶/茶具/茶周边/其他）管理商品 */
export default function ProductManage({ categoryType, pageTitle, breadcrumbs }: ProductManageProps) {
  const navigate = useNavigate();
  const isTea = categoryType === 'tea';
  const l1Label = productCategoryLabels[categoryType];
  const currentCategoryData = getCategoryDataByType(categoryType);

  // 商品档案接入共享价格数据源：价格管理调价后此处实时可见
  const storeProducts = usePriceStore((s) => s.products);
  const storeAddProduct = usePriceStore((s) => s.addProduct);
  const storeDeleteProducts = usePriceStore((s) => s.deleteProducts);
  const products = storeProducts;
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [l3Filter, setL3Filter] = useState<Set<string>>(new Set());
  const [shelfFilter, setShelfFilter] = useState('');
  const [purchaseFilter, setPurchaseFilter] = useState('');
  const [productionFilter, setProductionFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState<Set<string>>(new Set());
  const [quickFilter, setQuickFilter] = useState<Set<'teaware' | 'lowStock' | 'comboTea'>>(new Set());
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'sales-asc' | 'sales-desc'>('default');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 抽屉状态
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState(createEmptyForm(categoryType));

  // 批量删除
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 拖拽排序状态
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragType, setDragType] = useState<'main' | 'detail' | null>(null);

  // 当前一级分类下的二级分类列表（用于筛选按钮）
  const l2CategoryNames = useMemo(
    () => (currentCategoryData.children || []).map((c) => c.name),
    [currentCategoryData],
  );

  // 提取所有品牌
  const allBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => brands.add(p.brand));
    return Array.from(brands).sort();
  }, [products]);

  // 筛选 + 排序
  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      // 仅展示当前一级分类下的商品
      if (getProductL1Type(p.category) !== categoryType) return false;

      if (categoryFilter.size > 0) {
        const prefix = p.category.split('-')[0];
        if (!categoryFilter.has(prefix)) return false;
      }
      if (l3Filter.size > 0) {
        const l3Part = p.category.split('-').slice(1).join('-');
        if (!l3Filter.has(l3Part)) return false;
      }
      if (shelfFilter && p.shelfStatus !== shelfFilter) return false;
      if (purchaseFilter && p.purchaseStatus !== purchaseFilter) return false;
      if (productionFilter && p.productionStatus !== productionFilter) return false;
      if (brandFilter.size > 0 && !brandFilter.has(p.brand)) return false;
      if (isTea) {
        if (quickFilter.has('teaware')) {
          const teawareL2Names = (teawareCategoryData.children || []).map((c) => c.name);
          const hasTeaware = (p.categories || []).some((c) =>
            teawareL2Names.some((l2) => c.startsWith(l2) || c.startsWith('茶具-' + l2)),
          );
          if (!hasTeaware && !p.includesTeaware) return false;
        }
        if (quickFilter.has('lowStock') && p.stock >= p.stockAlert) return false;
        if (quickFilter.has('comboTea')) {
          const teaL2Names = (teaCategoryData.children || []).map((ch) => ch.name);
          const teaCats = (p.categories || []).filter((c) => teaL2Names.some((l2) => c.startsWith(l2)));
          const uniqueTeaL2 = new Set(teaCats.map((c) => teaL2Names.find((l2) => c.startsWith(l2)) || c));
          if (uniqueTeaL2.size <= 1) return false;
        }
      } else {
        if (quickFilter.has('lowStock') && p.stock >= p.stockAlert) return false;
      }
      if (keyword) {
        const kw = keyword.toLowerCase();
        if (
          !p.name.toLowerCase().includes(kw) &&
          !p.brand.toLowerCase().includes(kw) &&
          !p.category.toLowerCase().includes(kw) &&
          !p.code.toLowerCase().includes(kw)
        )
          return false;
      }
      if (priceMin && p.marketPrice < Number(priceMin)) return false;
      if (priceMax && p.marketPrice > Number(priceMax)) return false;
      return true;
    });
    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.marketPrice - b.marketPrice);
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.marketPrice - a.marketPrice);
    } else if (sortBy === 'sales-desc') {
      result = [...result].sort((a, b) => b.totalSales - a.totalSales);
    } else if (sortBy === 'sales-asc') {
      result = [...result].sort((a, b) => a.totalSales - b.totalSales);
    }
    return result;
  }, [products, keyword, categoryFilter, l3Filter, shelfFilter, purchaseFilter, productionFilter, brandFilter, quickFilter, sortBy, priceMin, priceMax, categoryType, isTea]);

  // 分页
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const handleCategoryToggle = (name: string) => {
    setCategoryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        const l2Node = currentCategoryData.children?.find((c) => c.name === name);
        if (l2Node?.children) {
          setL3Filter((prev3) => {
            const next3 = new Set(prev3);
            l2Node.children!.forEach((c) => next3.delete(c.name));
            return next3;
          });
        }
      } else {
        next.add(name);
      }
      return next;
    });
    setCurrentPage(1);
  };
  const handleCategoryClear = () => {
    setCategoryFilter(new Set());
    setL3Filter(new Set());
    setCurrentPage(1);
  };
  const handleL3Toggle = (name: string) => {
    setL3Filter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setCurrentPage(1);
  };
  const handleShelfChange = (value: string) => {
    setShelfFilter(value);
    setCurrentPage(1);
  };
  const handlePurchaseChange = (value: string) => {
    setPurchaseFilter(value);
    setCurrentPage(1);
  };
  const handleProductionChange = (value: string) => {
    setProductionFilter(value);
    setCurrentPage(1);
  };
  const handleBrandToggle = (name: string) => {
    setBrandFilter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setCurrentPage(1);
  };
  const handleBrandClear = () => {
    setBrandFilter(new Set());
    setCurrentPage(1);
  };
  const handleQuickToggle = (value: 'teaware' | 'lowStock' | 'comboTea') => {
    setQuickFilter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    setCurrentPage(1);
  };
  const handleQuickClear = () => {
    setQuickFilter(new Set());
    setCurrentPage(1);
  };
  const handleSearch = (kw: string) => {
    setKeyword(kw);
    setCurrentPage(1);
  };
  const handleSortChange = (sort: 'default' | 'price-asc' | 'price-desc' | 'sales-asc' | 'sales-desc') => {
    setSortBy(sort);
    setCurrentPage(1);
  };
  const handlePriceMinChange = (v: string) => {
    setPriceMin(v);
    setCurrentPage(1);
  };
  const handlePriceMaxChange = (v: string) => {
    setPriceMax(v);
    setCurrentPage(1);
  };

  // ── 分类联动 ──
  const l2Options = useMemo(() => {
    const result: { l1: ProductCategoryType; l1Label: string; nodes: CategoryNode[] }[] = [];
    for (const l1 of form.selectedL1List) {
      const data = CATEGORY_DATA_MAP[l1];
      if (data?.children) {
        result.push({ l1, l1Label: productCategoryLabels[l1], nodes: data.children });
      }
    }
    return result;
  }, [form.selectedL1List]);

  const l3Options = useMemo(() => {
    const result: Record<string, CategoryNode[]> = {};
    for (const l1 of form.selectedL1List) {
      const data = CATEGORY_DATA_MAP[l1];
      const l1Label = productCategoryLabels[l1];
      if (!data?.children) continue;
      for (const l2 of data.children) {
        if (form.selectedL2.includes(l2.name) && l2.children && l2.children.length > 0) {
          // 非茶叶分类的 L2 名可能与茶叶重复，用 L1 标签做命名空间区分键
          const key = isTea ? l2.name : `${l1Label}-${l2.name}`;
          result[key] = l2.children;
        }
      }
    }
    return result;
  }, [form.selectedL1List, form.selectedL2, isTea]);

  // 计算选中的分类路径（统一使用 "L2-L3" 格式，与茶叶分类保持一致）
  const computedCategories = useMemo(() => {
    const cats: string[] = [];
    for (const l1 of form.selectedL1List) {
      const data = CATEGORY_DATA_MAP[l1];
      if (!data?.children) continue;
      for (const l2 of data.children) {
        if (!form.selectedL2.includes(l2.name)) continue;
        if (l2.children && l2.children.length > 0) {
          const selectedL3ForL2 = form.selectedL3.filter((l3Name) =>
            l2.children!.some((c) => c.name === l3Name),
          );
          if (selectedL3ForL2.length > 0) {
            for (const l3Name of selectedL3ForL2) {
              cats.push(`${l2.name}-${l3Name}`);
            }
          } else {
            cats.push(l2.name);
          }
        } else {
          cats.push(l2.name);
        }
      }
    }
    return cats;
  }, [form.selectedL1List, form.selectedL2, form.selectedL3]);

  // 自动判断是否含茶具
  const computedIncludesTeaware = useMemo(() => {
    return form.selectedL1List.includes('teaware');
  }, [form.selectedL1List]);

  // 是否为组合茶（仅茶叶：选了多个不同二级分类）
  const computedIsComboTea = useMemo(() => {
    if (!isTea || !form.selectedL1List.includes('tea')) return false;
    const teaL2Names = (teaCategoryData.children || []).map((c) => c.name);
    const selectedTeaL2 = form.selectedL2.filter((n) => teaL2Names.includes(n));
    return selectedTeaL2.length > 1;
  }, [form.selectedL1List, form.selectedL2, isTea]);

  // L1 切换：茶叶必选；非茶叶页面锁定为当前分类（单选）
  const handleToggleL1 = (l1: ProductCategoryType) => {
    setForm((prev) => {
      if (!isTea) {
        // 非茶叶页面：锁定为当前分类，不允许切换
        return prev;
      }
      const newList = prev.selectedL1List.includes(l1)
        ? prev.selectedL1List.filter((x) => x !== l1)
        : [...prev.selectedL1List, l1];
      if (!newList.includes('tea')) newList.unshift('tea');
      const validL2Names: string[] = [];
      for (const selL1 of newList) {
        const data = CATEGORY_DATA_MAP[selL1];
        if (data?.children) {
          for (const c of data.children) {
            if (prev.selectedL2.includes(c.name)) validL2Names.push(c.name);
          }
        }
      }
      const validL3 = prev.selectedL3.filter((l3Name) => {
        const teaData = teaCategoryData.children || [];
        for (const l2 of teaData) {
          if (validL2Names.includes(l2.name) && l2.children?.some((c) => c.name === l3Name)) {
            return true;
          }
        }
        return false;
      });
      return { ...prev, selectedL1List: newList, selectedL2: validL2Names, selectedL3: validL3 };
    });
  };

  // L2 多选切换
  const handleToggleL2 = (name: string) => {
    setForm((prev) => {
      const newL2 = prev.selectedL2.includes(name)
        ? prev.selectedL2.filter((n) => n !== name)
        : [...prev.selectedL2, name];
      const validL3 = prev.selectedL3.filter((l3Name) => {
        for (const l1 of prev.selectedL1List) {
          const data = CATEGORY_DATA_MAP[l1];
          if (!data?.children) continue;
          for (const l2 of data.children) {
            if (newL2.includes(l2.name) && l2.children?.some((c) => c.name === l3Name)) {
              return true;
            }
          }
        }
        return false;
      });
      return { ...prev, selectedL2: newL2, selectedL3: validL3 };
    });
  };

  // L3 多选切换
  const handleToggleL3 = (name: string) => {
    setForm((prev) => ({
      ...prev,
      selectedL3: prev.selectedL3.includes(name)
        ? prev.selectedL3.filter((n) => n !== name)
        : [...prev.selectedL3, name],
    }));
  };

  // 当前品牌下的系列选项
  const currentBrandSeries = useMemo(() => {
    const brand = brandItems.find((b) => b.name === form.brand);
    return brand?.series || [];
  }, [form.brand]);

  // 将新系列同步到品牌管理数据
  const syncSeriesToBrand = (brandName: string, seriesName: string) => {
    if (!seriesName.trim()) return;
    const brand = brandItems.find((b) => b.name === brandName);
    if (brand && !brand.series.includes(seriesName.trim())) {
      brand.series.push(seriesName.trim());
    }
  };

  // 新增商品
  const handleOpenAdd = () => {
    setForm(createEmptyForm(categoryType));
    setShowDrawer(true);
  };

  // 批量删除
  const handleEnterDeleteMode = () => {
    setDeleteMode(true);
    setSelectedForDelete(new Set());
  };
  const handleCancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedForDelete(new Set());
  };
  const handleToggleSelect = (id: string) => {
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const handleConfirmDelete = () => {
    storeDeleteProducts([...selectedForDelete]);
    setDeleteMode(false);
    setSelectedForDelete(new Set());
  };

  // 保存商品
  const handleSaveProduct = () => {
    if (!form.name.trim()) return;
    if (computedCategories.length === 0) return;
    if (!form.brand) return;

    const category = computedCategories[0];
    const l1Name = productCategoryLabels[form.selectedL1List[0]];
    const l2Name = form.selectedL2[0] || '';

    const existingCount = products.filter((p) => p.brand === form.brand).length;
    const code = generateProductCode(l1Name, l2Name, form.brand, existingCount + 1);

    const finalSeries = form.isNewSeries ? form.newSeriesName : form.series;
    if (finalSeries && form.brand) {
      syncSeriesToBrand(form.brand, finalSeries);
    }

    // 销售价计算：茶叶按茶类系数，其他按默认 0.8
    let salesPrice: number;
    if (isTea) {
      const teaTypeDiscount: Record<string, number> = {
        '绿茶': 0.78,
        '红茶': 0.8,
        '青茶': 0.76,
        '白茶': 0.82,
        '黄茶': 0.79,
        '黑茶': 0.75,
        '花草茶': 0.77,
      };
      salesPrice = Math.round(form.marketPrice * (teaTypeDiscount[category.split('-')[0]] ?? 0.78));
    } else {
      salesPrice = Math.round(form.marketPrice * 0.8);
    }

    const newProduct: TeaProduct = {
      id: String(Date.now()),
      code,
      name: form.name.trim(),
      category,
      categories: computedCategories,
      brand: form.brand,
      series: finalSeries,
      packageUnit: form.packageUnit,
      barcode69: form.barcode69,
      model: form.model,
      spec: form.spec,
      perUnitSpec: form.perUnitSpec,
      perBoxSpec: form.perBoxSpec,
      weight: form.weight,
      volume: form.volume,
      quantityPerUnit: form.quantityPerUnit,
      grade: form.grade,
      origin: form.origin,
      shelfLife: form.shelfLife,
      taxRate: form.taxRate,
      packageList: form.packageList,
      marketPrice: form.marketPrice,
      tmallPrice: form.tmallPrice,
      tmallUrl: form.tmallUrl,
      jdPrice: form.jdPrice,
      jdUrl: form.jdUrl,
      salesPrice,
      shelfStatus: form.shelfStatus,
      purchaseStatus: form.purchaseStatus,
      productionStatus: form.productionStatus,
      mainImages:
        form.mainImages.length > 0
          ? form.mainImages
          : [`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(form.name)}&image_size=square_hd`],
      detailImages: form.detailImages,
      displayImageIndex: form.displayImageIndex,
      stockAlert: form.stockAlert,
      stock: form.stock,
      reservedStock: form.reservedStock,
      totalSales: form.totalSales,
      features: form.features,
      includesTeaware: computedIncludesTeaware,
      remark: form.remark,
    };

    storeAddProduct(newProduct);
    setShowDrawer(false);
  };

  const filterBtnStyle = (active: boolean): CSSProperties => ({
    padding: '4px 12px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${active ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
    background: active ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
    color: active ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
    transition: 'var(--transition-fast)',
    whiteSpace: 'nowrap',
  });

  const selectStyle = (hasValue: boolean): CSSProperties => ({
    padding: '4px 12px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${hasValue ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
    background: hasValue ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
    color: hasValue ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
    cursor: 'pointer',
  });

  const [fetchUrl, setFetchUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<'success' | 'error' | null>(null);

  /** 从京东/天猫链接抓取商品信息（模拟） */
  const handleFetchProduct = () => {
    if (!fetchUrl.trim()) return;
    setFetching(true);
    setFetchResult(null);
    setTimeout(() => {
      const isJd = fetchUrl.includes('jd.com') || fetchUrl.includes('jd.hk');
      const isTmall = fetchUrl.includes('tmall.com') || fetchUrl.includes('taobao.com');
      if (!isJd && !isTmall) {
        setFetchResult('error');
        setFetching(false);
        return;
      }
      const mockData: Record<string, any> = {
        name: isJd ? '京东商品-自动抓取' : '天猫商品-自动抓取',
        marketPrice: Math.round(300 + Math.random() * 500),
        brand: isJd ? '大益' : '八马',
        spec: '100g/罐',
        grade: '特级',
        origin: '云南西双版纳',
        barcode69: '690' + String(Math.floor(Math.random() * 10000000000)).padStart(10, '0'),
        model: isJd ? 'JD-AUTO-001' : 'TM-AUTO-001',
        packageUnit: '罐',
        shelfLife: 18,
        taxRate: 9,
        features: '自动抓取·品质优良',
        packageList: '茶叶罐×1、手提袋×1、产品说明书×1',
      };
      if (isJd) {
        mockData.jdPrice = mockData.marketPrice;
        mockData.jdUrl = fetchUrl;
      } else {
        mockData.tmallPrice = mockData.marketPrice;
        mockData.tmallUrl = fetchUrl;
      }
      setForm((prev) => ({ ...prev, ...mockData }));
      setFetchResult('success');
      setFetching(false);
    }, 1500);
  };

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-module-current-base)',
    paddingTop: 'var(--space-3)',
    paddingBottom: 'var(--space-2)',
    borderTop: '1px solid var(--color-neutral-100)',
    marginTop: 'var(--space-2)',
  };

  return (
    <>
      <ContentHeader title={pageTitle} breadcrumbs={breadcrumbs} />
      <div className="content-body">
        {/* 筛选区 */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0 }}>
              {isTea ? '茶类：' : '分类：'}
            </span>
            <button style={filterBtnStyle(categoryFilter.size === 0)} onClick={handleCategoryClear}>
              全部
            </button>
            {l2CategoryNames.map((name) => (
              <button key={name} style={filterBtnStyle(categoryFilter.has(name))} onClick={() => handleCategoryToggle(name)}>
                {name}
              </button>
            ))}
          </div>
          {/* 选中分类后展示三级分类，支持复选筛选 */}
          {categoryFilter.size > 0 && (
            <div style={{ marginBottom: 'var(--space-3)', paddingLeft: 'var(--space-2)' }}>
              {Array.from(categoryFilter).map((catName) => {
                const l2Node = currentCategoryData.children?.find((c) => c.name === catName);
                if (!l2Node?.children || l2Node.children.length === 0) return null;
                return (
                  <div
                    key={catName}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: '4px', flexWrap: 'wrap' }}
                  >
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0, marginRight: '2px' }}>
                      {catName}：
                    </span>
                    {l2Node.children.map((c, i) => (
                      <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                        {i > 0 && <span style={{ color: 'var(--color-neutral-300)', margin: '0 2px' }}>|</span>}
                        <span
                          onClick={() => handleL3Toggle(c.name)}
                          style={{
                            cursor: 'pointer',
                            color: l3Filter.has(c.name) ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                            fontWeight: l3Filter.has(c.name) ? 'var(--font-semibold)' : 'normal',
                            transition: 'color var(--transition-fast)',
                          }}
                        >
                          {c.name}
                        </span>
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0 }}>品牌：</span>
            <button style={filterBtnStyle(brandFilter.size === 0)} onClick={handleBrandClear}>
              全部
            </button>
            {allBrands.map((b) => (
              <button key={b} style={filterBtnStyle(brandFilter.has(b))} onClick={() => handleBrandToggle(b)}>
                {b}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0 }}>快捷：</span>
            <button style={filterBtnStyle(quickFilter.size === 0)} onClick={handleQuickClear}>
              全部
            </button>
            {isTea && (
              <>
                <button style={filterBtnStyle(quickFilter.has('teaware'))} onClick={() => handleQuickToggle('teaware')}>
                  带茶具
                </button>
                <button style={filterBtnStyle(quickFilter.has('comboTea'))} onClick={() => handleQuickToggle('comboTea')}>
                  组合茶
                </button>
              </>
            )}
            <button style={filterBtnStyle(quickFilter.has('lowStock'))} onClick={() => handleQuickToggle('lowStock')}>
              库存紧张
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0 }}>条件：</span>
            <select value={shelfFilter} onChange={(e) => handleShelfChange(e.target.value)} style={selectStyle(!!shelfFilter)}>
              <option value="">上下架状态</option>
              <option value="on">上架</option>
              <option value="off">下架</option>
            </select>
            <select value={purchaseFilter} onChange={(e) => handlePurchaseChange(e.target.value)} style={selectStyle(!!purchaseFilter)}>
              <option value="">采购状态</option>
              <option value="available">可采</option>
              <option value="stopped">停采</option>
            </select>
            <select value={productionFilter} onChange={(e) => handleProductionChange(e.target.value)} style={selectStyle(!!productionFilter)}>
              <option value="">生产状态</option>
              <option value="producing">在产</option>
              <option value="stopped">停产</option>
            </select>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', flexShrink: 0 }}>价格：</span>
            <input
              className="filter-input"
              placeholder="最低价"
              value={priceMin}
              onChange={(e) => handlePriceMinChange(e.target.value)}
              style={{ width: 40, textAlign: 'center' }}
              type="number"
            />
            <span style={{ color: 'var(--color-neutral-400)' }}>—</span>
            <input
              className="filter-input"
              placeholder="最高价"
              value={priceMax}
              onChange={(e) => {
                const v = e.target.value;
                if (v && priceMin && Number(v) < Number(priceMin)) return;
                handlePriceMaxChange(v);
              }}
              style={{ width: 40, textAlign: 'center' }}
              type="number"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)', flexShrink: 0 }}>排序：</span>
            <button style={filterBtnStyle(sortBy === 'default')} onClick={() => handleSortChange('default')}>
              默认
            </button>
            <button
              style={filterBtnStyle(sortBy === 'price-desc' || sortBy === 'price-asc')}
              onClick={() => handleSortChange(sortBy === 'price-desc' ? 'price-asc' : 'price-desc')}
            >
              价格
              {sortBy === 'price-asc' || sortBy === 'price-desc' ? (sortBy === 'price-asc' ? ' ↑' : ' ↓') : ''}
            </button>
            <button
              style={filterBtnStyle(sortBy === 'sales-desc' || sortBy === 'sales-asc')}
              onClick={() => handleSortChange(sortBy === 'sales-desc' ? 'sales-asc' : 'sales-desc')}
            >
              销量
              {sortBy === 'sales-asc' || sortBy === 'sales-desc' ? (sortBy === 'sales-asc' ? ' ↑' : ' ↓') : ''}
            </button>
            <Button onClick={handleOpenAdd}>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}>
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              新增
            </Button>
            {deleteMode ? (
              <>
                <Button onClick={() => setShowDeleteConfirm(true)} disabled={selectedForDelete.size === 0} style={{ background: '#eb5c20', borderColor: '#eb5c20' }}>
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}>
                    <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  删除所选({selectedForDelete.size})
                </Button>
                <Button variant="ghost" onClick={handleCancelDeleteMode} style={{ color: 'var(--color-neutral-500)' }}>
                  取消
                </Button>
              </>
            ) : (
              <Button style={{ background: '#eb5c20', borderColor: '#eb5c20' }} onClick={handleEnterDeleteMode}>
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}>
                  <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                删除
              </Button>
            )}
            <span style={{ marginLeft: 'auto' }}>
              <input
                className="filter-input"
                placeholder="搜索商品名称、品牌、编号..."
                value={keyword}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ maxWidth: 280 }}
              />
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', flexShrink: 0 }}>
              共 {filtered.length} 件商品
            </span>
          </div>
        </Card>

        {/* 商品卡片网格 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          {paged.map((product) => {
            const teaCat = isTea ? parseCategory(product.category) : null;
            const mainImage = product.mainImages[product.displayImageIndex] || product.mainImages[0] || '';
            const isSelected = selectedForDelete.has(product.id);
            return (
              <div
                key={product.id}
                className="product-manage-card"
                style={{
                  background: 'var(--color-neutral-0)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${isSelected ? '#eb5c20' : 'var(--color-neutral-100)'}`,
                  outline: isSelected ? '2px solid #eb5c20' : undefined,
                  overflow: 'hidden',
                  cursor: deleteMode ? 'default' : 'pointer',
                  transition: 'box-shadow var(--transition-fast), transform var(--transition-fast)',
                  position: 'relative',
                }}
                onClick={() => {
                  if (deleteMode) {
                    handleToggleSelect(product.id);
                  } else if (isTea) {
                    navigate(`/product/product-tea-detail/${product.id}`);
                  }
                }}
                onMouseEnter={(e) => {
                  if (!deleteMode) {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                {/* 删除模式复选框 */}
                {deleteMode && (
                  <div
                    style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)', zIndex: 10, cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(product.id);
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${isSelected ? '#eb5c20' : 'var(--color-neutral-300)'}`,
                        background: isSelected ? '#eb5c20' : 'var(--color-neutral-0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 12 12" fill="none" style={{ width: 10, height: 10 }}>
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                {/* 商品轮播图 */}
                <div style={{ width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: 'var(--color-neutral-100)', position: 'relative' }}>
                  <img src={mainImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <span
                    style={{
                      position: 'absolute',
                      top: 'var(--space-2)',
                      left: 'var(--space-2)',
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(1, 121, 93, 0.85)',
                      color: '#fff',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-semibold)',
                      lineHeight: '18px',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {product.brand}
                  </span>
                </div>

                {/* 商品信息 */}
                <div style={{ padding: 'var(--space-3) var(--space-3) var(--space-2)' }}>
                  {/* 商品名称 */}
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--color-neutral-800)',
                      lineHeight: 1.4,
                      marginBottom: 'var(--space-2)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={product.name}
                  >
                    {product.name}
                  </div>

                  {/* 产品特点 */}
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-neutral-500)',
                      lineHeight: 1.5,
                      marginBottom: 'var(--space-2)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={product.features}
                  >
                    {product.features}
                  </div>

                  {/* SKU + 分类标签 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '1px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-neutral-100)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-family-mono, monospace)',
                        color: 'var(--color-neutral-600)',
                        fontWeight: 'var(--font-medium)',
                      }}
                    >
                      SKU {product.code}
                    </div>
                    {teaCat ? (
                      <Tag category={teaCat} />
                    ) : (
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-neutral-500)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-neutral-100)',
                        }}
                      >
                        {product.category.split('-')[0]}
                      </span>
                    )}
                  </div>
                  {/* 分类色条（茶叶用茶类色，其他用模块主色） */}
                  <div
                    style={{
                      height: 2,
                      borderRadius: 1,
                      background: (() => {
                        const topCat = product.category.split('-')[0];
                        if (isTea) return CATEGORY_COLORS[topCat] || 'var(--color-neutral-200)';
                        return 'var(--color-module-current-base)';
                      })(),
                    }}
                  />
                  {/* 价格 + 标签 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'var(--space-2)',
                      gap: 'var(--space-1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-1)', flexShrink: 0, minWidth: 0 }}>
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: '#eb5c20', flexShrink: 0 }}>
                        ¥{product.marketPrice}
                      </span>
                      {product.spec && (
                        <>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-300)', flexShrink: 0 }}>|</span>
                          <span
                            style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--color-neutral-500)',
                              lineHeight: 1.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={product.spec}
                          >
                            {product.spec}
                          </span>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <StatusTag variant={product.shelfStatus === 'on' ? 'success' : 'default'} label={getShelfStatusLabel(product.shelfStatus)} />
                      <StatusTag
                        variant={product.purchaseStatus === 'available' ? 'success' : 'default'}
                        label={getPurchaseStatusLabel(product.purchaseStatus)}
                      />
                      <StatusTag
                        variant={product.productionStatus === 'producing' ? 'success' : 'default'}
                        label={getProductionStatusLabel(product.productionStatus)}
                      />
                    </div>
                  </div>
                </div>

                {/* 底部数据栏 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    borderTop: '1px solid var(--color-neutral-100)',
                    padding: 'var(--space-2) 0',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginBottom: 2 }}>总销量</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)' }}>
                      {product.totalSales}
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'var(--color-neutral-100)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginBottom: 2 }}>自有库存</div>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-semibold)',
                        color: product.stock < product.stockAlert ? '#eb5c20' : 'var(--color-neutral-700)',
                      }}
                    >
                      {product.stock}
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'var(--color-neutral-100)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginBottom: 2 }}>订单预占</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)' }}>
                      {product.reservedStock}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>
            暂无匹配的{l1Label}商品
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-5)',
              paddingBottom: 'var(--space-4)',
            }}
          >
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-neutral-200)',
                background: 'var(--color-neutral-0)',
                color: currentPage === 1 ? 'var(--color-neutral-300)' : 'var(--color-neutral-600)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-sm)',
              }}
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${currentPage === page ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                  background: currentPage === page ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                  color: currentPage === page ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: currentPage === page ? 'var(--font-semibold)' : 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-neutral-200)',
                background: 'var(--color-neutral-0)',
                color: currentPage === totalPages ? 'var(--color-neutral-300)' : 'var(--color-neutral-600)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-sm)',
              }}
            >
              下一页
            </button>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginLeft: 'var(--space-2)' }}>
              第 {currentPage}/{totalPages} 页
            </span>
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="category-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="category-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 400 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-800)', marginBottom: 'var(--space-3)' }}>
              确认删除
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-5)' }}>
              确定要删除选中的 {selectedForDelete.size} 件商品吗？此操作不可撤销。
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                取消
              </Button>
              <Button
                onClick={() => {
                  handleConfirmDelete();
                  setShowDeleteConfirm(false);
                }}
                style={{ background: '#eb5c20', borderColor: '#eb5c20' }}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 新增商品抽屉 */}
      {showDrawer && (
        <div className="drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">新增{l1Label}商品</span>
              <button className="drawer-close" onClick={() => setShowDrawer(false)}>
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="drawer-body">
              {/* ── 网络抓取 ── */}
              <div
                style={{
                  background: 'var(--color-neutral-50)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  marginBottom: 'var(--space-3)',
                  border: '1px solid var(--color-neutral-150)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <svg viewBox="0 0 18 18" fill="none" style={{ width: 16, height: 16, color: 'var(--color-module-current-base)', flexShrink: 0 }}>
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M2 9h14M9 2c-2 2.5-3 5-3 7s1 4.5 3 7M9 2c2 2.5 3 5 3 7s-1 4.5-3 7" stroke="currentColor" strokeWidth="1.0" />
                  </svg>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-module-current-base)' }}>网络抓取</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>输入京东/天猫商品链接，自动获取商品信息</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input
                    className="detail-input"
                    style={{ flex: 1 }}
                    placeholder="请输入京东或天猫商品链接，如 https://item.jd.com/12345.html"
                    value={fetchUrl}
                    onChange={(e) => {
                      setFetchUrl(e.target.value);
                      setFetchResult(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFetchProduct();
                    }}
                  />
                  <Button onClick={handleFetchProduct} disabled={fetching || !fetchUrl.trim()} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {fetching ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }}>
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="12 6" />
                        </svg>
                        抓取中...
                      </span>
                    ) : (
                      '获取信息'
                    )}
                  </Button>
                </div>
                {fetchResult === 'success' && (
                  <div
                    style={{
                      marginTop: 'var(--space-2)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-success-500)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}>
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M5.5 8l2 2 3-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    商品信息抓取成功，已自动填充表单
                  </div>
                )}
                {fetchResult === 'error' && (
                  <div
                    style={{
                      marginTop: 'var(--space-2)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-error-500)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}>
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    链接无效，请输入京东或天猫的商品链接
                  </div>
                )}
              </div>

              {/* ── 基本信息 ── */}
              <div style={sectionTitleStyle}>基本信息</div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">
                    商品名称 <span style={{ color: '#eb5c20' }}>*</span>
                  </label>
                  <input
                    className="detail-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="请输入商品名称"
                  />
                </div>
              </div>

              {/* 一级分类 */}
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">
                    一级分类 <span style={{ color: '#eb5c20' }}>*</span>
                    {isTea && '（茶叶必选）'}
                    {!isTea && `（当前：${l1Label}）`}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {(Object.keys(productCategoryLabels) as ProductCategoryType[]).map((key) => {
                      const locked = !isTea && key !== categoryType;
                      return (
                        <label
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: locked ? 'not-allowed' : isTea && key === 'tea' ? 'default' : 'pointer',
                            fontSize: 'var(--text-sm)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${form.selectedL1List.includes(key) ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                            background: form.selectedL1List.includes(key) ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                            color: form.selectedL1List.includes(key) ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                            transition: 'var(--transition-fast)',
                            opacity: locked ? 0.4 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.selectedL1List.includes(key)}
                            onChange={() => handleToggleL1(key)}
                            disabled={locked || (isTea && key === 'tea')}
                            style={{ display: 'none' }}
                          />
                          {productCategoryLabels[key]}
                          {isTea && key === 'tea' && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>（必选）</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 二级分类（多选，按一级分类分组） */}
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">
                    二级分类 <span style={{ color: '#eb5c20' }}>*</span>（多选）
                  </label>
                  {l2Options.map(({ l1, l1Label, nodes }) => (
                    <div key={l1} style={{ marginBottom: 'var(--space-2)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: '4px', fontWeight: 'var(--font-medium)' }}>
                        {l1Label}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {nodes.map((l2) => (
                          <label
                            key={l2.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              fontSize: 'var(--text-sm)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-md)',
                              border: `1px solid ${form.selectedL2.includes(l2.name) ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                              background: form.selectedL2.includes(l2.name) ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                              color: form.selectedL2.includes(l2.name) ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                              transition: 'var(--transition-fast)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={form.selectedL2.includes(l2.name)}
                              onChange={() => handleToggleL2(l2.name)}
                              style={{ display: 'none' }}
                            />
                            {l2.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 三级分类（仅当存在三级时展示） */}
              {Object.keys(l3Options).length > 0 && (
                <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                  <div className="drawer-form-field" style={{ width: '100%' }}>
                    <label className="drawer-label">{isTea ? '三级茶种' : '三级分类'}（多选）</label>
                    {Object.entries(l3Options).map(([key, l3Nodes]) => {
                      const l2Name = isTea ? key : key.split('-')[1] || key;
                      return (
                        <div key={key} style={{ marginBottom: 'var(--space-2)' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: '4px', fontWeight: 'var(--font-medium)' }}>
                            {l2Name}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {l3Nodes.map((l3) => (
                              <label
                                key={l3.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  cursor: 'pointer',
                                  fontSize: 'var(--text-xs)',
                                  padding: '2px 6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: `1px solid ${form.selectedL3.includes(l3.name) ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                                  background: form.selectedL3.includes(l3.name) ? 'var(--color-module-current-lightest)' : 'var(--color-neutral-0)',
                                  color: form.selectedL3.includes(l3.name) ? 'var(--color-module-current-base)' : 'var(--color-neutral-600)',
                                  transition: 'var(--transition-fast)',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={form.selectedL3.includes(l3.name)}
                                  onChange={() => handleToggleL3(l3.name)}
                                  style={{ display: 'none' }}
                                />
                                {l3.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 已选分类预览 */}
              {computedCategories.length > 0 && (
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>已选分类：</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-module-current-base)', fontWeight: 'var(--font-medium)' }}>
                    {computedCategories.join('、')}
                  </span>
                </div>
              )}

              {/* 品牌 + 系列 */}
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">
                    品牌 <span style={{ color: '#eb5c20' }}>*</span>
                  </label>
                  <select className="detail-input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
                    <option value="">请选择品牌</option>
                    {brandItems.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">系列</label>
                  {form.isNewSeries ? (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <input
                        className="detail-input"
                        value={form.newSeriesName}
                        onChange={(e) => setForm({ ...form, newSeriesName: e.target.value })}
                        placeholder="输入新系列名称"
                        style={{ flex: 1 }}
                        autoFocus
                      />
                      <button
                        onClick={() => setForm({ ...form, isNewSeries: false, newSeriesName: '' })}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-xs)',
                          border: '1px solid var(--color-neutral-200)',
                          background: 'var(--color-neutral-0)',
                          color: 'var(--color-neutral-500)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <select
                      className="detail-input"
                      value={form.series}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__new__') {
                          setForm({ ...form, isNewSeries: true, series: '' });
                        } else {
                          setForm({ ...form, series: val });
                        }
                      }}
                    >
                      <option value="">请选择系列</option>
                      {currentBrandSeries.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value="__new__">填写新系列</option>
                    </select>
                  )}
                </div>
              </div>

              {/* 品级 + 产地（仅茶叶） */}
              {isTea && (
                <div className="drawer-form-row">
                  <div className="drawer-form-field">
                    <label className="drawer-label">品级</label>
                    <select className="detail-input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                      <option value="">请选择品级</option>
                      <option value="特级">特级</option>
                      <option value="一级">一级</option>
                      <option value="二级">二级</option>
                      <option value="三级">三级</option>
                      <option value="精品">精品</option>
                      <option value="珍品">珍品</option>
                    </select>
                  </div>
                  <div className="drawer-form-field">
                    <label className="drawer-label">产地</label>
                    <input
                      className="detail-input"
                      value={form.origin}
                      onChange={(e) => setForm({ ...form, origin: e.target.value })}
                      placeholder="如：浙江杭州西湖区"
                    />
                  </div>
                </div>
              )}

              {/* ── 规格包装 ── */}
              <div style={sectionTitleStyle}>规格包装</div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">规格</label>
                  <input
                    className="detail-input"
                    value={form.spec}
                    onChange={(e) => setForm({ ...form, spec: e.target.value })}
                    placeholder="如：50g/罐"
                  />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">包装单位</label>
                  <select
                    className="detail-input"
                    value={form.packageUnit}
                    onChange={(e) => setForm({ ...form, packageUnit: e.target.value })}
                  >
                    {packageUnits.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 每份规格 */}
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-neutral-700)',
                  margin: 'var(--space-3) 0 var(--space-2)',
                  borderLeft: '3px solid var(--color-module-current-base)',
                  paddingLeft: '8px',
                }}
              >
                每份规格
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">净重</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      className="detail-input"
                      type="number"
                      value={form.perUnitSpec.netWeight || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setForm({
                          ...form,
                          perUnitSpec: { ...form.perUnitSpec, netWeight: val },
                          perBoxSpec: { ...form.perBoxSpec, netWeight: val * form.perBoxSpec.quantity },
                        });
                      }}
                      placeholder="0"
                      style={{ flex: 1 }}
                    />
                    <select
                      className="detail-input"
                      value={form.perUnitSpec.netWeightUnit}
                      onChange={(e) => setForm({ ...form, perUnitSpec: { ...form.perUnitSpec, netWeightUnit: e.target.value } })}
                      style={{ width: 80 }}
                    >
                      {weightUnits.map((u) => (
                        <option key={u.symbol} value={u.symbol}>
                          {u.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">毛重</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      className="detail-input"
                      type="number"
                      value={form.perUnitSpec.grossWeight || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setForm({
                          ...form,
                          perUnitSpec: { ...form.perUnitSpec, grossWeight: val },
                          perBoxSpec: { ...form.perBoxSpec, grossWeight: val * form.perBoxSpec.quantity },
                        });
                      }}
                      placeholder="0"
                      style={{ flex: 1 }}
                    />
                    <select
                      className="detail-input"
                      value={form.perUnitSpec.grossWeightUnit}
                      onChange={(e) => setForm({ ...form, perUnitSpec: { ...form.perUnitSpec, grossWeightUnit: e.target.value } })}
                      style={{ width: 80 }}
                    >
                      {weightUnits.map((u) => (
                        <option key={u.symbol} value={u.symbol}>
                          {u.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">
                    体积 <span style={{ color: 'var(--color-neutral-400)', fontWeight: 'normal' }}>长×宽×高</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      className="detail-input"
                      type="number"
                      value={form.perUnitSpec.length || ''}
                      onChange={(e) => setForm({ ...form, perUnitSpec: { ...form.perUnitSpec, length: Number(e.target.value) } })}
                      placeholder="长"
                      style={{ width: '25%' }}
                    />
                    <span style={{ color: 'var(--color-neutral-400)' }}>×</span>
                    <input
                      className="detail-input"
                      type="number"
                      value={form.perUnitSpec.width || ''}
                      onChange={(e) => setForm({ ...form, perUnitSpec: { ...form.perUnitSpec, width: Number(e.target.value) } })}
                      placeholder="宽"
                      style={{ width: '25%' }}
                    />
                    <span style={{ color: 'var(--color-neutral-400)' }}>×</span>
                    <input
                      className="detail-input"
                      type="number"
                      value={form.perUnitSpec.height || ''}
                      onChange={(e) => setForm({ ...form, perUnitSpec: { ...form.perUnitSpec, height: Number(e.target.value) } })}
                      placeholder="高"
                      style={{ width: '25%' }}
                    />
                    <select
                      className="detail-input"
                      value={form.perUnitSpec.dimensionUnit}
                      onChange={(e) => setForm({ ...form, perUnitSpec: { ...form.perUnitSpec, dimensionUnit: e.target.value } })}
                      style={{ width: 80 }}
                    >
                      {dimensionUnits.map((u) => (
                        <option key={u.symbol} value={u.symbol}>
                          {u.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 每箱规格（箱规） */}
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-neutral-700)',
                  margin: 'var(--space-3) 0 var(--space-2)',
                  borderLeft: '3px solid var(--color-module-current-base)',
                  paddingLeft: '8px',
                }}
              >
                每箱规格（箱规）
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">每箱数量</label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.perBoxSpec.quantity || ''}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      setForm({
                        ...form,
                        perBoxSpec: {
                          ...form.perBoxSpec,
                          quantity: qty,
                          netWeight: form.perUnitSpec.netWeight * qty,
                          grossWeight: form.perUnitSpec.grossWeight * qty,
                        },
                      });
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">
                    净重 <span style={{ color: 'var(--color-neutral-400)', fontWeight: 'normal', fontSize: 'var(--text-xs)' }}>= 每份净重 × 数量</span>
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      className="detail-input"
                      type="number"
                      value={form.perBoxSpec.netWeight || ''}
                      readOnly
                      style={{ flex: 1, background: 'var(--color-neutral-50)', color: 'var(--color-neutral-500)' }}
                    />
                    <select
                      className="detail-input"
                      value={form.perBoxSpec.netWeightUnit}
                      onChange={(e) => setForm({ ...form, perBoxSpec: { ...form.perBoxSpec, netWeightUnit: e.target.value } })}
                      style={{ width: 80 }}
                    >
                      {weightUnits.map((u) => (
                        <option key={u.symbol} value={u.symbol}>
                          {u.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">
                    毛重 <span style={{ color: 'var(--color-neutral-400)', fontWeight: 'normal', fontSize: 'var(--text-xs)' }}>= 每份毛重 × 数量</span>
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      className="detail-input"
                      type="number"
                      value={form.perBoxSpec.grossWeight || ''}
                      readOnly
                      style={{ flex: 1, background: 'var(--color-neutral-50)', color: 'var(--color-neutral-500)' }}
                    />
                    <select
                      className="detail-input"
                      value={form.perBoxSpec.grossWeightUnit}
                      onChange={(e) => setForm({ ...form, perBoxSpec: { ...form.perBoxSpec, grossWeightUnit: e.target.value } })}
                      style={{ width: 80 }}
                    >
                      {weightUnits.map((u) => (
                        <option key={u.symbol} value={u.symbol}>
                          {u.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">
                    体积 <span style={{ color: 'var(--color-neutral-400)', fontWeight: 'normal' }}>长×宽×高</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      className="detail-input"
                      type="number"
                      value={form.perBoxSpec.length || ''}
                      onChange={(e) => setForm({ ...form, perBoxSpec: { ...form.perBoxSpec, length: Number(e.target.value) } })}
                      placeholder="长"
                      style={{ width: '25%' }}
                    />
                    <span style={{ color: 'var(--color-neutral-400)' }}>×</span>
                    <input
                      className="detail-input"
                      type="number"
                      value={form.perBoxSpec.width || ''}
                      onChange={(e) => setForm({ ...form, perBoxSpec: { ...form.perBoxSpec, width: Number(e.target.value) } })}
                      placeholder="宽"
                      style={{ width: '25%' }}
                    />
                    <span style={{ color: 'var(--color-neutral-400)' }}>×</span>
                    <input
                      className="detail-input"
                      type="number"
                      value={form.perBoxSpec.height || ''}
                      onChange={(e) => setForm({ ...form, perBoxSpec: { ...form.perBoxSpec, height: Number(e.target.value) } })}
                      placeholder="高"
                      style={{ width: '25%' }}
                    />
                    <select
                      className="detail-input"
                      value={form.perBoxSpec.dimensionUnit}
                      onChange={(e) => setForm({ ...form, perBoxSpec: { ...form.perBoxSpec, dimensionUnit: e.target.value } })}
                      style={{ width: 80 }}
                    >
                      {dimensionUnits.map((u) => (
                        <option key={u.symbol} value={u.symbol}>
                          {u.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">69码</label>
                  <input
                    className="detail-input"
                    value={form.barcode69}
                    onChange={(e) => setForm({ ...form, barcode69: e.target.value })}
                    placeholder="13位条码"
                    maxLength={13}
                  />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">型号</label>
                  <input
                    className="detail-input"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="请输入型号"
                  />
                </div>
              </div>

              {/* ── 价格信息 ── */}
              <div style={sectionTitleStyle}>价格信息</div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">
                    市场价(元) <span style={{ color: '#eb5c20' }}>*</span>
                  </label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.marketPrice || ''}
                    onChange={(e) => setForm({ ...form, marketPrice: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">税率(%)</label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.taxRate || ''}
                    onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                    placeholder="9"
                  />
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">天猫价(元)</label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.tmallPrice || ''}
                    onChange={(e) => setForm({ ...form, tmallPrice: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">天猫链接</label>
                  <input
                    className="detail-input"
                    value={form.tmallUrl}
                    onChange={(e) => setForm({ ...form, tmallUrl: e.target.value })}
                    placeholder="https://"
                  />
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">京东价(元)</label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.jdPrice || ''}
                    onChange={(e) => setForm({ ...form, jdPrice: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">京东链接</label>
                  <input
                    className="detail-input"
                    value={form.jdUrl}
                    onChange={(e) => setForm({ ...form, jdUrl: e.target.value })}
                    placeholder="https://"
                  />
                </div>
              </div>

              {/* ── 状态与库存 ── */}
              <div style={sectionTitleStyle}>状态与库存</div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">上下架状态</label>
                  <select
                    className="detail-input"
                    value={form.shelfStatus}
                    onChange={(e) => setForm({ ...form, shelfStatus: e.target.value as 'on' | 'off' })}
                  >
                    <option value="on">上架</option>
                    <option value="off">下架</option>
                  </select>
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">采购状态</label>
                  <select
                    className="detail-input"
                    value={form.purchaseStatus}
                    onChange={(e) => setForm({ ...form, purchaseStatus: e.target.value as 'available' | 'stopped' })}
                  >
                    <option value="available">可采</option>
                    <option value="stopped">停采</option>
                  </select>
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">生产状态</label>
                  <select
                    className="detail-input"
                    value={form.productionStatus}
                    onChange={(e) => setForm({ ...form, productionStatus: e.target.value as 'producing' | 'stopped' })}
                  >
                    <option value="producing">在产</option>
                    <option value="stopped">停产</option>
                  </select>
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">库存预警值</label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.stockAlert || ''}
                    onChange={(e) => setForm({ ...form, stockAlert: Number(e.target.value) })}
                    placeholder="50"
                  />
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">自有库存</label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.stock || ''}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">预占库存</label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.reservedStock || ''}
                    onChange={(e) => setForm({ ...form, reservedStock: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">总销量</label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.totalSales || ''}
                    onChange={(e) => setForm({ ...form, totalSales: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="drawer-form-field" />
              </div>

              {/* ── 商品属性 ── */}
              <div style={sectionTitleStyle}>商品属性</div>
              <div className="drawer-form-row">
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">产品特点</label>
                  <input
                    className="detail-input"
                    value={form.features}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                    placeholder="如：明前头采·豆花香·扁平挺直"
                  />
                </div>
              </div>
              <div className="drawer-form-row">
                <div className="drawer-form-field">
                  <label className="drawer-label">保质期(月)</label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.shelfLife || ''}
                    onChange={(e) => setForm({ ...form, shelfLife: Number(e.target.value) })}
                    placeholder="12"
                  />
                </div>
                <div className="drawer-form-field">
                  <label className="drawer-label">税率(%)</label>
                  <input
                    className="detail-input"
                    type="number"
                    value={form.taxRate || ''}
                    onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                    placeholder="9"
                  />
                </div>
              </div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">包装清单</label>
                  <input
                    className="detail-input"
                    value={form.packageList}
                    onChange={(e) => setForm({ ...form, packageList: e.target.value })}
                    placeholder="如：茶叶罐×1、手提袋×1、品鉴茶具套装×1"
                  />
                </div>
              </div>

              {/* ── 商品图片 ── */}
              <div style={sectionTitleStyle}>商品图片</div>
              {/* 轮播图 */}
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">轮播图（点击设为主图）</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: '4px' }}>
                    {form.mainImages.map((img, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={() => {
                          setDragIndex(i);
                          setDragType('main');
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = '1';
                          if (dragType === 'main' && dragIndex !== null && dragIndex !== i) {
                            const newImages = [...form.mainImages];
                            const [moved] = newImages.splice(dragIndex, 1);
                            newImages.splice(i, 0, moved);
                            let newDisplayIndex = form.displayImageIndex;
                            if (newDisplayIndex === dragIndex) newDisplayIndex = i;
                            else if (dragIndex < newDisplayIndex && i >= newDisplayIndex) newDisplayIndex--;
                            else if (dragIndex > newDisplayIndex && i <= newDisplayIndex) newDisplayIndex++;
                            setForm({ ...form, mainImages: newImages, displayImageIndex: newDisplayIndex });
                          }
                          setDragIndex(null);
                          setDragType(null);
                        }}
                        onDragEnd={() => {
                          setDragIndex(null);
                          setDragType(null);
                        }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          border: `2px solid ${form.displayImageIndex === i ? 'var(--color-module-current-base)' : 'var(--color-neutral-200)'}`,
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'border-color var(--transition-fast)',
                        }}
                        onClick={() => setForm({ ...form, displayImageIndex: i })}
                        onMouseEnter={(e) => {
                          if (form.displayImageIndex !== i) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-module-current-base)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (form.displayImageIndex !== i) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-neutral-200)';
                          }
                        }}
                      >
                        <img src={img} alt={`轮播图-${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <span
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: 2,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 'var(--font-semibold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                          }}
                        >
                          {i + 1}
                        </span>
                        {form.displayImageIndex === i && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              padding: '1px 4px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--color-module-current-base)',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 'var(--font-semibold)',
                              lineHeight: '14px',
                            }}
                          >
                            主图
                          </span>
                        )}
                        {form.displayImageIndex !== i && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.45)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              opacity: 0,
                              transition: 'opacity var(--transition-fast)',
                            }}
                            className="img-hover-label"
                          >
                            设为主图
                          </div>
                        )}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const newImages = form.mainImages.filter((_, idx) => idx !== i);
                            let newDisplayIndex = form.displayImageIndex;
                            if (i < newDisplayIndex) newDisplayIndex--;
                            else if (i === newDisplayIndex) newDisplayIndex = 0;
                            if (newDisplayIndex >= newImages.length) newDisplayIndex = 0;
                            setForm({ ...form, mainImages: newImages, displayImageIndex: newDisplayIndex });
                          }}
                          style={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '10px',
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </div>
                      </div>
                    ))}
                    {/* 添加轮播图 */}
                    <div style={{ position: 'relative' }}>
                      <label
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 'var(--radius-md)',
                          border: '1px dashed var(--color-neutral-300)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: 'var(--color-neutral-50)',
                          color: 'var(--color-neutral-400)',
                          fontSize: 'var(--text-xs)',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <svg viewBox="0 0 16 16" fill="none" style={{ width: 20, height: 20 }}>
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        添加轮播图
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (form.mainImages.length >= 8) {
                              alert('轮播图最多8张');
                              return;
                            }
                            const img = new Image();
                            const url = URL.createObjectURL(file);
                            img.onload = () => {
                              if (img.width !== img.height || img.width < 500 || img.width > 1920) {
                                alert('轮播图要求正方形，边长500-1920像素，请重新选择');
                                URL.revokeObjectURL(url);
                                return;
                              }
                              setForm({ ...form, mainImages: [...form.mainImages, url] });
                            };
                            img.src = url;
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(0,0,0,0.45)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          opacity: 0,
                          transition: 'opacity var(--transition-fast)',
                          pointerEvents: 'none',
                        }}
                        className="img-hover-label"
                      >
                        正方形500-1920px
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 详情图 */}
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">详情图</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: '4px' }}>
                    {form.detailImages.map((img, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={() => {
                          setDragIndex(i);
                          setDragType('detail');
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = '1';
                          if (dragType === 'detail' && dragIndex !== null && dragIndex !== i) {
                            const newImages = [...form.detailImages];
                            const [moved] = newImages.splice(dragIndex, 1);
                            newImages.splice(i, 0, moved);
                            setForm({ ...form, detailImages: newImages });
                          }
                          setDragIndex(null);
                          setDragType(null);
                        }}
                        onDragEnd={() => {
                          setDragIndex(null);
                          setDragType(null);
                        }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          border: '1px solid var(--color-neutral-200)',
                          position: 'relative',
                          cursor: 'grab',
                        }}
                      >
                        <img src={img} alt={`详情图-${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <span
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: 2,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 'var(--font-semibold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                          }}
                        >
                          {i + 1}
                        </span>
                        <div
                          onClick={() => setForm({ ...form, detailImages: form.detailImages.filter((_, idx) => idx !== i) })}
                          style={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '10px',
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </div>
                      </div>
                    ))}
                    {/* 添加详情图 */}
                    <div style={{ position: 'relative' }}>
                      <label
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 'var(--radius-md)',
                          border: '1px dashed var(--color-neutral-300)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: 'var(--color-neutral-50)',
                          color: 'var(--color-neutral-400)',
                          fontSize: 'var(--text-xs)',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <svg viewBox="0 0 16 16" fill="none" style={{ width: 20, height: 20 }}>
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        添加详情图
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (form.detailImages.length >= 20) {
                              alert('详情图最多20张');
                              return;
                            }
                            const img = new Image();
                            const url = URL.createObjectURL(file);
                            img.onload = () => {
                              if (img.width < 500 || img.width > 1920 || img.height > 3000) {
                                alert('详情图要求宽500-1920像素，高不超过3000像素，请重新选择');
                                URL.revokeObjectURL(url);
                                return;
                              }
                              setForm({ ...form, detailImages: [...form.detailImages, url] });
                            };
                            img.src = url;
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(0,0,0,0.45)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          opacity: 0,
                          transition: 'opacity var(--transition-fast)',
                          pointerEvents: 'none',
                        }}
                        className="img-hover-label"
                      >
                        宽500-1920px 高≤3000px
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 备注 ── */}
              <div style={sectionTitleStyle}>备注</div>
              <div className="drawer-form-row" style={{ flexDirection: 'column' }}>
                <div className="drawer-form-field" style={{ width: '100%' }}>
                  <label className="drawer-label">备注信息</label>
                  <textarea
                    className="detail-textarea"
                    value={form.remark}
                    onChange={(e) => setForm({ ...form, remark: e.target.value })}
                    placeholder="请输入备注信息"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="drawer-footer">
              <Button variant="ghost" onClick={() => setShowDrawer(false)}>
                取消
              </Button>
              <Button onClick={handleSaveProduct} disabled={!form.name.trim() || computedCategories.length === 0 || !form.brand}>
                确认新增
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
