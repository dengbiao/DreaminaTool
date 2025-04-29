# DOM 元素移除自动销毁功能 (onRemove)

## 功能概述

`onRemove` 是 DOM 规则引擎的一个增强功能，允许特性在其关联的 DOM 元素被移除时自动调用 `destroy` 方法进行清理。这个功能特别适用于需要监控特定 DOM 元素存在性的特性，比如在特定页面或面板中添加的 UI 组件。

## 使用方法

在定义 DOM 规则时，添加 `onRemove: true` 参数：

```typescript
const rules: Rule[] = [
  {
    type: "dom",
    selector: ".workDetailWrap-\\w+", // CSS选择器
    triggerOn: ["dom", "route", "custom"],
    onRemove: true, // 启用自动销毁功能
  },
];
```

## 实现原理

1. **元素跟踪**：DOM 规则引擎通过 `previousElementsCount` 映射表跟踪选择器匹配的元素数量变化。

2. **变化检测**：当检测到元素数量从大于 0 变为 0 时，表示元素可能被移除。

3. **自动销毁**：此时引擎会自动查找关联的特性实例，并异步调用其 `destroy` 方法。

## 代码示例

```typescript
// DOM规则引擎评估方法中的相关代码
if (onRemove === true) {
  const currentCount = elements.length;
  const previousCount = this.previousElementsCount.get(ruleKey) || 0;

  // 更新元素计数
  this.previousElementsCount.set(ruleKey, currentCount);

  // 如果元素数量减少到0，可能是元素被移除
  if (previousCount > 0 && currentCount === 0 && context.trigger === "dom") {
    // 异步调用destroy，避免冲突
    setTimeout(() => {
      const feature = context.engine.getFeature(rule.featureId);
      if (feature?.destroy) feature.destroy();
    }, 0);

    return false;
  }
}
```

## 适用场景

- **临时 UI 组件**：在特定页面添加的按钮、面板等 UI 组件
- **资源型特性**：需要释放内存、清理事件监听器的特性
- **页面级功能**：仅在特定页面有效的功能增强

## 测试

为确保 `onRemove` 功能正常工作，我们添加了专门的单元测试和集成测试：

- `tests/core/rules/dom-rule-onremove.test.ts`：测试 DOM 规则引擎的 `onRemove` 功能
- `tests/features/image-matting-button.test.ts`：测试抠图按钮特性的 `destroy` 方法
- `tests/integration/dom-onremove.test.ts`：集成测试验证 DOM 元素移除时的完整流程
