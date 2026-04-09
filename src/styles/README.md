# TCIC Device Check - Styles

此目录包含 SDK 的样式文件。

## 文件说明

- `variables.scss` - SCSS 变量定义（颜色、间距、字体等）
- `index.scss` - 主样式入口（包含命名空间隔离）

## 样式隔离规范

所有样式都包裹在 `.tic-dc-sdk` 命名空间下，确保不污染宿主环境：

```scss
.tic-dc-sdk {
    // 所有 SDK 样式都写在这里
}
```

## 主题支持

通过 CSS 自定义属性实现主题切换：

- `.tic-dc-sdk` - 亮色主题（默认）
- `.tic-dc-sdk.theme-dark` - 暗色主题
