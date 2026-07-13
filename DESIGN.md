# Design System

## Theme
白底研究工作台：像周日上午在明亮书桌上审阅一份重要行业报告。高饱和橙标记机会与行动，洋红和电紫只出现在 Axion 首屏动态材质中，深靛蓝承担结构与可信度。

## Colors
- Background: `oklch(1 0 0)`
- Surface: `oklch(0.972 0.006 75)`
- Ink: `oklch(0.205 0.025 265)`
- Muted: `oklch(0.47 0.02 265)`
- Primary: `#ff5a00`
- Hero Magenta: `#f0006c`
- Hero Violet: `#5b2cff`
- Accent: `oklch(0.42 0.16 267)`
- Positive: `oklch(0.52 0.13 155)`

## Typography
使用系统中文无衬线字体栈。标题紧凑有力，正文16px，数据使用等宽数字特性。正文行长控制在72ch以内。

## Layout
桌面最大宽度1280px；12列分析网格。移动端重排为单列并保留完整信息，通过横向图表和详情展开处理密度。

## Components
使用实线分隔、表格、标签、筛选器和图表面板。卡片圆角不超过16px，不使用装饰性玻璃、渐变文字或夸张阴影。顶部导航在两端常驻悬浮；手机菜单从右上角按钮原位展开。多维岗位比较优先使用可排序的行列结构，不使用需要猜坐标的重叠气泡。

## Motion
仅为导航、筛选和状态反馈提供150–240ms过渡；遵循 `prefers-reduced-motion`。
