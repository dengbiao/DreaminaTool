# 即梦工具箱 DOM 引擎使用指南

## 基本用法

### 1. 初始化引擎

```typescript
import { initDOMEngine } from "./content/dom-engine";

// 初始化引擎
const api = initDOMEngine({ debugMode: true });

// 或者使用全局API
const api = window.__DreaminaTool;
```

### 2. 创建自定义特性

#### 步骤 1: 创建特性类

```typescript
import BaseFeature from "./core/base-feature";

class MyCustomFeature extends BaseFeature {
  constructor(options = {}) {
    super({
      id: "myFeature",
      name: "我的特性",
      // 定义触发规则
      rules: [
        {
          type: "route",
          pattern: "/my-page",
        },
      ],
      ...options,
    });
  }

  apply() {
    if (!super.apply()) return false;

    // 实现特性功能
    console.log("应用我的特性");

    return true;
  }

  destroy() {
    // 清理资源
    console.log("销毁我的特性");
    super.destroy();
  }
}
```

#### 步骤 2: 注册特性类型

```typescript
// 注册特性类型
api.featureFactory.registerFeatureType("myFeature", MyCustomFeature);
```

#### 步骤 3: 创建特性实例

```typescript
// 创建特性实例(会自动注册到引擎)
const feature = api.featureFactory.createFeature("myFeature", {
  // 特性配置选项
});

// 或者使用简化API
const feature = api.registerFeature("myFeature", {
  // 特性配置选项
});
```

#### 步骤 4: 手动注销特性

```typescript
// 注销特性
api.unregisterFeature("myFeature");
```

## 规则系统

### 1. 路由规则

```typescript
// 基本路由匹配
const routeRule = {
  type: "route",
  pattern: "/detail", // 匹配路径前缀
};

// 精确路由匹配
const exactRouteRule = {
  type: "route",
  pattern: "/detail/123",
  exact: true,
};

// 正则表达式匹配
const regexRouteRule = {
  type: "route",
  pattern: /\/detail\/\d+/,
};

// 多路径匹配
const multiRouteRule = {
  type: "route",
  pattern: ["/detail", "/preview"],
};

// 排除路径
const excludeRouteRule = {
  type: "route",
  pattern: "/detail",
  exclude: "/detail/hidden",
};
```

### 2. DOM 规则

```typescript
// 基本元素存在性
const domRule = {
  type: "dom",
  selector: ".my-element",
};

// 元素数量条件
const countDomRule = {
  type: "dom",
  selector: ".list-item",
  count: 3, // 精确数量
};

const rangeCountDomRule = {
  type: "dom",
  selector: ".list-item",
  count: { min: 1, max: 5 }, // 数量范围
};

// 属性匹配
const attrDomRule = {
  type: "dom",
  selector: "button",
  attribute: "data-role",
  attributeValue: "submit",
};

// 正则属性匹配
const regexAttrDomRule = {
  type: "dom",
  selector: "input",
  attribute: "class",
  attributeValue: /\bactive\b/,
};

// 自定义匹配条件
const customDomRule = {
  type: "dom",
  selector: ".content",
  condition: (elements) => {
    return Array.from(elements).some((el) =>
      el.textContent?.includes("关键词")
    );
  },
};
```

### 3. 组合规则

```typescript
// AND 组合
const andRule = {
  type: "combined",
  operator: "AND",
  rules: [
    { type: "route", pattern: "/detail" },
    { type: "dom", selector: ".edit-button" },
  ],
};

// OR 组合
const orRule = {
  type: "combined",
  operator: "OR",
  rules: [
    { type: "dom", selector: ".edit-button" },
    { type: "dom", selector: ".modify-button" },
  ],
};

// NOT 组合
const notRule = {
  type: "combined",
  operator: "NOT",
  rules: [{ type: "dom", selector: ".read-only-badge" }],
};

// 复杂组合
const complexRule = {
  type: "combined",
  operator: "AND",
  rules: [
    { type: "route", pattern: "/detail" },
    {
      type: "combined",
      operator: "OR",
      rules: [
        { type: "dom", selector: ".edit-permission" },
        { type: "dom", selector: ".admin-badge" },
      ],
    },
  ],
};
```

## 高级用法

### 1. 触发类型控制

```typescript
// 指定触发类型
const rule = {
  type: "dom",
  selector: ".my-element",
  triggerOn: ["dom"], // 只在DOM变化时触发
};

const routeRule = {
  type: "route",
  pattern: "/detail",
  triggerOn: ["route"], // 只在路由变化时触发
};

const bothRule = {
  type: "combined",
  operator: "AND",
  triggerOn: ["dom", "route"], // 在DOM或路由变化时都触发
  rules: [
    { type: "route", pattern: "/detail" },
    { type: "dom", selector: ".edit-button" },
  ],
};
```

### 2. DOM 工具函数

```typescript
import {
  waitForElement,
  createButton,
  createSiteStyledButton,
} from "./utils/dom-utils";

// 等待元素出现
const element = await waitForElement(".my-element");

// 创建自定义按钮
const button = createButton({
  text: "自定义按钮",
  className: "my-button",
  style: { color: "blue" },
  onClick: (e) => console.log("按钮点击", e),
});

// 创建匹配网站风格的按钮
const siteButton = createSiteStyledButton("站点风格按钮", handleClick);
```

### 3. 批量特性创建

```typescript
// 批量创建特性
const features = api.featureFactory.createFeaturesFromConfig([
  {
    type: "exportButton",
    options: { format: "json" },
  },
  {
    type: "exportButton",
    options: {
      format: "csv",
      id: "csvExport",
    },
  },
]);
```

## 完整示例

```typescript
import { initDOMEngine } from "./content/dom-engine";
import { registerExamples, exampleFeatures } from "./examples";

// 初始化DOM引擎
const api = initDOMEngine({ debugMode: true });

// 注册示例特性
registerExamples(api.featureFactory);

// 创建示例特性实例
api.featureFactory.createFeaturesFromConfig(exampleFeatures);

// 导出全局API供调试使用
window.__DreaminaTool = api;
```
