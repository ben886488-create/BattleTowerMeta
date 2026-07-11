# BattleTowerMeta 设计规范

> 版本：1.2  
> 更新日期：2026-07-09  
> 风格定位：Editorial Intelligence Terminal／编辑部竞技情报终端

## 0. 强制使用约定

本文件是 BattleTowerMeta 所有新页面与 UI 组件的设计契约。

开发新页面前必须：

1. 先阅读本文件。
2. 优先复用 `web/src/assets/theme.css` 中的 token。
3. 优先复用 `web/src/assets/editorial.css` 与现有页面的视觉模式。
4. 不得为单一页面自行创建新的主色、圆角、阴影或间距体系。
5. Tier、胜负、警告等数据语义色可以例外，但形状仍必须遵守硬边规则。
6. 若确实需要新增视觉规则，必须同时更新本文件和 `theme.css`。

设计关键词：

- 编辑感大标题
- 竞技数据终端
- 近黑画布
- Riolu / Aura 淺藍行動信號
- 金色輔助訊號
- 等宽数据标签
- 直角细边框
- 网格与扫描线
- 高信息密度，但保留明确留白

## 1. 配色

### 1.1 品牌、輔助與狀態色

| Token | 色值 | 用途 |
| --- | --- | --- |
| `--accent-primary` | `#4DA3FF` | 主色；主要按钮、当前导航、链接、角标、选中态、焦点框、主要图表切片 |
| `--accent-primary-soft` | `#7CCBFF` | 主色 hover、柔和 aura glow、次级蓝色图表 |
| `--accent-primary-deep` | `#2563EB` | 深蓝强调、压暗背景上的蓝色边线 |
| `--accent-secondary` | `#FFD166` | 金色辅色；重要计数、百分比、A Tier、特殊标签、图表第二色 |
| `--accent-secondary-deep` | `#B88900` | 深金；小面积文字、边线或低亮辅助状态 |
| `--accent-success` | `#00FF88` | 在线、成功、正增长、胜场 |
| `--accent-danger` | `#FF3B4F` | 错误、负增长、败场、S Tier |
| `--accent-warning` | `#FFCC33` | 警告、中性提醒、谨慎提示 |
| `--accent` | `var(--accent-primary)` | 旧组件兼容 alias，不得重新定义为橙色 |
| `--accent-hover` | `var(--accent-primary-soft)` | 旧组件兼容 hover alias |
| `--accent-blue` | `var(--accent-primary)` | 旧组件兼容系统蓝 alias |
| `--accent-cyan` | `var(--accent-primary-soft)` | 旧组件兼容浅蓝 alias |
| `--positive` | `var(--accent-success)` | 旧组件兼容成功 alias |
| `--warning` | `var(--accent-warning)` | 旧组件兼容警告 alias |
| `--negative` | `var(--accent-danger)` | 旧组件兼容危险 alias |

规则：

- 一个组件内原则上只使用一种主要强调色。
- 普通交互、active navigation、panel corner marker、selected state、focus border、Apply button 一律优先使用 `--accent-primary`。
- `--accent-secondary` 只用于次级高亮、重要数字、百分比、A Tier、特殊标签与图表第二色。
- 绿色、红色、黄色只能表达状态或数据，不用于纯装饰。
- 橙色只允许在紧急 CTA、破坏性动作或 warning 语境中少量保留；不要让页面第一眼仍是 evolveify orange theme。
- Tier 固定使用：S `#FF3B4F`、A `#FFD166`、B `#4DA3FF`、C `#00D084`。

### 1.2 背景与表面色

| Token | 色值 | 用途 |
| --- | --- | --- |
| `--bg-page` | `#02040A` | 全站主背景；接近黑色，不偏蓝灰 |
| `--bg-panel` | `rgba(5, 10, 20, 0.94)` | 主要面板、筛选器、终端框 |
| `--bg-card` | `rgba(8, 15, 28, 0.96)` | 卡片、浮层、较高层级表面 |
| `--bg` | `var(--bg-page)` | 旧组件兼容背景 alias |
| `--bg-deep` | `#010208` | 更深背景、滚动槽、遮罩 |
| `--surface` | `var(--bg-panel)` | 旧组件兼容面板 alias |
| `--surface-raised` | `var(--bg-card)` | 旧组件兼容高层级 alias |
| `--surface-warm` | `rgba(12, 35, 70, 0.72)` | Aura blue 调性重点区域，不作暖橙主色 |

标准页面背景由以下元素组合：

- `#02040A` / `#030712` 近黑底色。
- 32px × 32px 的低对比网格。
- 左侧 aura blue、右侧 light blue / gold 的极淡径向光晕。
- 4px 周期的低透明度水平扫描线。

禁止：

- 使用纯黑 `#000` 作为大面积页面背景。
- 使用高透明度玻璃模糊作为主要面板效果。
- 为普通卡片增加明显发光效果。

### 1.3 文字色

| Token | 色值 | 用途 |
| --- | --- | --- |
| `--text-main` | `#F8FAFC` | 页面标题、主要数据、牌组名、重点正文 |
| `--text-secondary` | `#A8B3C7` | 普通正文、卡片描述、次要数据 |
| `--text-muted` | `#64748B` | 时间、来源、标签、辅助说明 |
| `--text` | `var(--text-main)` | 旧组件兼容主文字 alias |
| `--text-soft` | `var(--text-secondary)` | 旧组件兼容次要文字 alias |
| `--muted` | `var(--text-muted)` | 旧组件兼容弱化文字 alias |

规则：

- 正文默认使用 `--text-soft`。
- 页面标题和关键数据使用 `--text`。
- `--muted` 不用于小于 10px 的长段文字。
- 链接默认使用 `--accent`，hover 使用 `--accent-hover`。

### 1.4 边框色

| Token | 色值 | 用途 |
| --- | --- | --- |
| `--border` | `rgba(148, 163, 184, 0.28)` | 普通卡片、表格、输入框 |
| `--border-strong` | `rgba(180, 195, 220, 0.42)` | 终端框、虚线框、重要分隔 |
| `--border-accent` | `rgba(77, 163, 255, 0.82)` | 主操作、重点区域、aura blue 角标 |

所有普通边框默认宽度为 `1px`。

## 2. 字体与字号层级

### 2.1 字体家族

| 类型 | 字体 |
| --- | --- |
| 展示标题 | `"Cormorant Garamond", "Noto Serif TC", "Songti TC", "PMingLiU", Georgia, serif` |
| 中文正文/UI | `"Source Han Sans", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif` |
| 英文品牌备用 | `"Anton", system-ui, sans-serif` |
| 数字/终端标签 | `"D-DIN Condensed", "D-DIN", ui-monospace, monospace` |

### 2.2 字号、字重与行高

| 层级 | 桌面字号 | 移动字号 | 字重 | 行高 | 字体 |
| --- | --- | --- | --- | --- | --- |
| 超大 Hero 标题 | `67–141px` | `54–72px` | `500` | `0.76–0.86` | 展示标题 |
| 数据页页面标题 | `43–75px` | `42–64px` | `600` | `0.92` | 展示标题 |
| 卡片大标题 | `27–38px` | `26–34px` | `600` | `1.05` | 展示标题 |
| 区块标题 | `16–20px` | `16–18px` | `700–800` | `1.2–1.35` | 正文字体 |
| 正文 | `13–18px` | `13–16px` | `400–500` | `1.6–1.75` | 正文字体 |
| 表格正文/控件 | `13px` | `12–13px` | `500–700` | `1.35` | 正文字体 |
| 元数据/眉题 | `10px` | `10px` | `700–800` | `1.2` | 数字/终端字体 |
| 导航 | `11px` | `13px` 侧栏 | `700` | `1.2` | 数字/终端字体 |

标题规则：

- 展示标题默认使用斜体。
- Hero 标题字距为 `-0.055em`。
- 数据页标题字距为 `-0.035em`。
- 标题可以使用白色与 aura blue 分行；重要计数或次级关键词可少量使用 gold。
- 中文标题避免孤立标点和单字换行。

标签规则：

- 终端标签使用全大写英文或简短中文。
- 字距使用 `0.12em–0.24em`。
- 标签不得承担长段正文内容。

## 3. 间距与留白

### 3.1 间距 token

| Token | 数值 | 常见用途 |
| --- | ---: | --- |
| `--space-1` | `4px` | 图标与文字微间距 |
| `--space-2` | `8px` | 紧凑控件、状态点 |
| `--space-3` | `12px` | 标签与输入框、紧凑卡片 |
| `--space-4` | `16px` | 标准卡片内边距 |
| `--space-5` | `24px` | 大卡片内边距、模块间距 |
| `--space-6` | `32px` | 区块间距、标题区域 |
| `--space-7` | `48px` | 大模块间隔、Hero 内部 |
| `--space-8` | `72px` | 页面上下留白 |

### 3.2 使用规则

- 控件内部左右 padding：`12–16px`。
- 普通卡片 padding：`16px`。
- 主要数据面板 padding：`24px`。
- Hero 面板 padding：`32–48px`。
- 同组元素间距：`8–12px`。
- 不同模块间距：`24–32px`。
- Hero 与首个内容模块间距：`48–72px`。
- 页面底部至少保留 `72px`。

不要使用 `5px`、`7px`、`19px` 等无体系的临时数值；优先从以上八档选择。

### 3.3 页面宽度

| 页面类型 | 最大宽度 |
| --- | ---: |
| 普通数据页 | `1320px` |
| 标准展示页 | `1480px`，即 `--page-max` |
| 宽矩阵/应用外壳 | `1620px`，即 `--page-wide` |
| 满版情报仪表页 | viewport gutter 优先，必要时参考 `1760px`，即 `--page-fluid-max` |

桌面应用容器：

- 左内边距：`84px`，为信号轨预留空间。
- 右内边距：`56px`。
- 顶部：`38px`。
- 底部：`72px`。

宽屏数据页补充：

- App root 使用 `width: 100%`、`min-height: 100dvh`、`overflow-x: hidden`。
- 主要内容优先使用 viewport-based gutter：左侧 `clamp(80px, 8vw, 180px)`，右侧 `clamp(40px, 6vw, 140px)`。
- 核心 dashboard 不再使用窄版 `1100px–1320px` 上限；1366px 到 2560px 都应让主内容随 viewport 扩展。
- 需要左右栏的 meta 页面使用 CSS grid 拉伸，宽屏可用 `minmax(620px, 1.35fr) minmax(360px, 0.85fr)`；tablet / mobile 改为单列。

移动端应用容器：

- 左右内边距：`18px`。
- 顶部：`28px`。
- 底部：`52px`。

## 4. 组件样式

### 4.1 圆角

| Token | 数值 | 用途 |
| --- | ---: | --- |
| `--radius-control` | `0px` | 输入框、普通按钮 |
| `--radius-panel` | `0px` | 卡片、面板 |
| `--radius-pill` | `0px` | 旧组件兼容 token；不得再产生胶囊形 |

规则：

- 按钮、输入框、卡片、表格、Hero、筛选器、徽章、Tier、排名与状态标签统一使用 `0px` 圆角。
- 禁止使用胶囊按钮、胶囊徽章和圆角数据单元格。
- 只允许真正的数据可视化圆环和 6px 在线状态 LED 保持圆形。

### 4.2 阴影

- 普通卡片和按钮：`box-shadow: none`。
- 浮层允许使用：

```css
box-shadow: 0 24px 70px rgba(0, 0, 0, 0.2);
```

- 在线状态点允许使用小范围同色光晕。
- 禁止为每张卡片添加大面积蓝色、金色或橙色发光。

### 4.3 按钮

标准按钮：

- 高度：`42px`。
- 重要 CTA 可使用 `48px`。
- 左右 padding：`12–16px`。
- 圆角：`0px`。
- 字体：D-DIN/等宽字体，`10–11px`，`700–900`。
- 字距：`0.08em–0.12em`。
- 边框：`1px solid var(--border)`。

主按钮：

```css
background: var(--accent);
border-color: var(--border-accent);
color: #080a10;
```

主按钮 hover：

```css
background: rgba(77, 163, 255, 0.18);
border-color: var(--accent);
color: #fff;
```

次按钮：

```css
background: rgba(2, 5, 12, 0.82);
border: 1px solid var(--border);
color: var(--text);
```

按钮文案应为明确动作，例如“打开数据”“下载 PNG”“读取牌组”，避免模糊的“确定”。

### 4.4 输入框与筛选器

- 标准高度：`42px`。
- 背景：`rgba(2, 5, 12, 0.82)`。
- 文字：`var(--text)`。
- 边框：`1px solid var(--border)`。
- 圆角：`0px`。
- 字号：`13px`。
- label：`10px`、`800`、等宽字体、`0.14em` 字距。

焦点状态：

```css
border-color: var(--accent-blue);
box-shadow: 0 0 0 2px rgba(77, 163, 255, 0.28);
```

筛选器组：

- 优先采用无间隙网格。
- 整组绘制上边框与左边框。
- 每个字段绘制右边框与下边框。
- 不把每个输入项做成独立的圆角卡片。

### 4.5 卡片与面板

标准面板：

```css
background:
  linear-gradient(135deg, rgba(77, 163, 255, 0.032), transparent 44%),
  linear-gradient(315deg, rgba(255, 209, 102, 0.026), transparent 44%),
  rgba(5, 10, 20, 0.94);
border: 1px solid var(--border);
border-radius: 0;
box-shadow: none;
```

主面板可以在左上角与右下角增加 12px aura blue 角标：

- 左上：aura blue 上边框 + 左边框。
- 右下：aura blue 右边框 + 下边框。
- 角标宽高均为 `12px`。

卡片内部层级：

1. 10px 等宽眉题。
2. 16–38px 主标题。
3. 13–16px 描述。
4. 右下角动作或状态。

#### 4.5.1 Pokémon Card Display System

所有显示 Pokémon card 图片的页面必须复用：

- `web/src/components/ui/CardImageWithCount.vue`
- `web/src/components/ui/CardHoverTooltip.vue`
- `web/src/lib/cardDisplay.ts`

适用页面包括 Tournament detail、Deck detail、Top Cards、Sample deck 与所有 decklist/card grid。

卡片图片规则：

- 标准 grid 宽度：`clamp(150px, 11vw, 260px)`，最大 `260px`。
- Deck/sample grid 宽度：`clamp(160px, 12vw, 280px)`，最大 `280px`。
- Hero/重点展示卡最大 `340px`，不得随超宽视窗无限放大。
- 超宽桌面优先增加栏数与留白，不放大单张卡片。
- hover 只允许 `brightness(1.05)` 与最多 `scale(1.015)`，不得造成 layout shift。

数量 overlay 规则：

- 统一显示在右下角，格式 `x1` / `x2`。
- 背景使用 `rgba(3, 10, 20, 0.82)`。
- 边框使用 `rgba(77, 163, 255, 0.65)`。
- 字体使用 mono/tabular nums，字重 `800–900`。
- overlay 不得遮住主要卡名区域；不得使用页面各自的 count badge。

Hover tooltip 规则：

- 使用 fixed positioning / body portal，避免被 `overflow: hidden` 裁切。
- 内容固定为 CARD INTEL、卡片名称、版本、代号、画师。
- 缺资料显示 `—`，不得造假资料。
- 外观使用 dark dashboard panel、thin border、Riolu blue accent 与 subtle glow。
- Desktop hover/focus 启用；mobile 不依赖 hover，不阻碍点击与滚动。
- focus-visible 使用 Riolu blue glow，不得出现浏览器白色 outline。

### 4.6 表格

表头：

- 背景：`rgba(5, 8, 17, 0.96)`。
- 字体：D-DIN/等宽字体。
- 字号：`10px`。
- 字重：`800`。
- 字距：`0.12em`。
- 颜色：`var(--muted)`。
- 英文使用大写。

表格正文：

- 字号：`13px`。
- 文字色：`var(--text-soft)`。
- 每行底部：`1px solid var(--border)`。
- 数字使用 `.mono` 并启用 tabular numbers。

hover：

```css
background: rgba(77, 163, 255, 0.065);
```

不要使用明显的斑马纹；依靠细分隔线、hover 和关键列强调建立层级。

### 4.7 导航栏

桌面顶栏：

- 高度：`68px`。
- 背景：`rgba(3, 5, 10, 0.92)`。
- `backdrop-filter: blur(18px)`。
- 底边框：`1px solid var(--border)`。
- Logo 左对齐，导航居中，账户与语言右对齐。

导航文字：

- D-DIN/等宽字体。
- `11px`、`700`。
- 字距：`0.14em`。
- 默认色：`var(--muted)`。
- hover：`var(--text)`。
- active：`var(--accent)`，并增加 1px aura blue 下划线。

状态行情带：

- 桌面高度：`38px`。
- 移动高度：`34px`。
- 背景：`rgba(5, 8, 16, 0.94)`。
- 标签使用 aura blue，重要数值可用 gold，在线状态绿色。

移动端：

- 顶栏高度：`62px`。
- 隐藏桌面导航，使用侧栏菜单。
- Logo 缩写为 `BTM Meta`。
- 只显示当前语言入口。

### 4.8 链接、状态与焦点

- 普通链接：aura blue。
- 系统状态链接或焦点：aura blue；次级提示可使用 gold。
- 全站键盘焦点：

```css
outline: 1px solid var(--accent-blue);
outline-offset: 3px;
```

- 在线状态点：6px 圆形 LED，使用 `--positive`；这是唯一允许的非图表圆形。
- 错误提示使用 `--negative`，不得只依靠颜色，还应提供文字。

## 5. 响应式规则

主要断点：

| 断点 | 用途 |
| --- | --- |
| `1280px` | 收紧导航与桌面间距 |
| `1080px` | 多栏数据面板改为单栏或双栏 |
| `900px` | 切换移动导航，隐藏信号轨 |
| `760px` | 数据页标题、面板与表格移动布局 |
| `560px` | 手机标题、Logo 与单列卡片 |

规则：

- 不允许单纯缩小桌面页面；应重新排列模块。
- 手机正文不得小于 `12px`。
- 手机主要点击区域高度不得低于 `42px`。
- 表格在手机端优先改为卡片列表；确实需要横向比较时才使用横向滚动。
- Hero 标题在 390px 宽度下必须避免单字孤行和标点独占一行。

## 6. 新页面验收清单

提交新页面前逐项确认：

- [ ] 已阅读 `design.md`。
- [ ] 颜色全部来自现有 token 或数据语义色。
- [ ] 页面只有一个主要强调色。
- [ ] 页面标题使用展示字体与规定字号。
- [ ] 正文、标签、数字使用正确字体层级。
- [ ] 间距来自 4/8/12/16/24/32/48/72 体系。
- [ ] 普通卡片没有大圆角和强阴影。
- [ ] 控件高度至少 42px。
- [ ] 表格数字使用 `.mono`。
- [ ] hover、focus、active、disabled 状态完整。
- [ ] 已检查中文和英文。
- [ ] 已检查 1440×900、390×844。
- [ ] 没有破坏 Tier、胜负或其他数据语义色。
- [ ] 如新增视觉规则，已同步更新本文件与 `theme.css`。
