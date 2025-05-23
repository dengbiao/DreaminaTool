# 即梦工具箱 DOM 引擎架构

## 架构概览

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                 DOM引擎(DreaminaDOMEngine)        │
│                                                  │
├──────────────┬───────────────┬──────────────────┤
│              │               │                  │
│  特性注册管理   │   规则引擎系统   │   观察者系统      │
│              │               │                  │
└───────┬──────┴───────┬───────┴─────────┬────────┘
        │              │                 │
┌───────▼──────┐ ┌─────▼───────┐  ┌──────▼────────┐
│              │ │             │  │               │
│  特性工厂      │ │  规则引擎接口  │  │ DOM观察器     │
│              │ │             │  │               │
└──────────────┘ └─────────────┘  └───────────────┘
        │              │
        │              │
┌───────▼──────┐ ┌─────▼───────┐
│              │ │             │
│   特性模块     │ │ 具体规则引擎   │
│              │ │             │
└──────────────┘ └─────────────┘
        │              ▲
        │              │
        └──────────────┘
```

## 核心组件

### 1. DOM 引擎 (DreaminaDOMEngine)

- **职责**: 作为整个系统的核心，负责协调所有组件
- **主要功能**:
  - 管理特性的注册与注销
  - 注册和管理规则引擎
  - 监听 DOM 和路由变化
  - 触发特性的生命周期

### 2. 特性系统

- **特性接口 (Feature)**: 定义特性的标准接口
- **特性基类 (BaseFeature)**: 提供通用实现
- **特性工厂 (FeatureFactory)**: 动态创建特性实例
- **具体特性**: 如 DetailPageButtonFeature、ExportButtonFeature 等

### 3. 规则引擎系统

- **规则引擎接口 (RuleEngine)**: 定义规则评估的标准接口
- **规则类型**:
  - 路由规则 (RouteRule): 基于 URL 路径匹配
  - DOM 规则 (DOMRule): 基于 DOM 元素属性匹配
  - 组合规则 (CombinedRule): 组合多个规则的逻辑操作

### 4. 工具函数

- **DOM 工具 (dom-utils)**: 提供 DOM 操作辅助函数
  - waitForElement: 等待元素出现
  - createButton/createSiteStyledButton: 创建按钮

## 数据流

1. DOM 引擎初始化并注册规则引擎和特性
2. 设置 DOM 和路由观察器
3. 观察器检测到变化时触发引擎的检查流程
4. 引擎根据每个特性的规则判断是否应用特性
5. 满足条件的特性被应用，执行 DOM 修改

## 扩展点

系统设计了多个扩展点，支持灵活扩展:

1. **新增特性**: 继承 BaseFeature 实现新特性
2. **新增规则**: 实现 RuleEngine 接口创建新规则类型
3. **工具函数**: 添加新的工具函数扩展功能

## 示例实现

- **详情页按钮 (DetailPageButtonFeature)**: 在详情页添加操作按钮
- **导出功能 (ExportButtonFeature)**: 支持导出不同格式的数据

## 测试策略

系统采用了全面的测试策略:

1. **单元测试**: 测试各个组件的独立功能
2. **集成测试**: 测试组件间的交互
3. **端到端测试**: 测试整个系统的工作流
