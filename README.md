# 即梦工具箱

## 架构设计

### 1. DOM 引擎架构

即梦工具箱采用了模块化、可扩展的 DOM 引擎架构，用于在即梦网站上进行 DOM 增强和功能扩展。主要组成部分包括：

#### 核心引擎 (DreaminaDOMEngine)

- 负责管理所有功能模块和规则引擎
- 监听 DOM 变化和路由变化
- 控制特性的生命周期（初始化、应用、销毁）

#### 规则引擎系统

- **路由规则引擎**: 基于 URL 路径匹配
- **DOM 规则引擎**: 基于 DOM 元素匹配
- **组合规则引擎**: 支持 AND、OR、NOT 逻辑组合

#### 特性模块系统

- 基于统一接口的可扩展特性模块
- 支持动态注册和注销
- 基于规则系统的条件触发

#### 特性工厂

- 支持从配置动态创建特性
- 管理特性类型注册

### 2. 使用方法

#### 创建新特性

```typescript
// 创建新特性类
class MyCustomFeature extends BaseFeature {
  constructor(options) {
    super({
      id: "myCustomFeature",
      name: "自定义特性",
      // 定义特性触发规则
      rules: [
        {
          type: "route",
          pattern: "/my-page",
        },
      ],
      ...options,
    });
  }

  // 实现特性应用逻辑
  apply() {
    if (!super.apply()) return false;

    // 执行DOM操作
    // ...

    return true;
  }
}

// 注册特性类型
featureFactory.registerFeatureType("myCustomFeature", MyCustomFeature);

// 创建特性实例
const feature = featureFactory.createFeature("myCustomFeature", {
  // 特性配置选项
});
```

#### 规则配置示例

```typescript
// 路由规则
{
  type: 'route',
  pattern: '/detail', // 匹配路径前缀
  exact: false // 是否精确匹配
}

// DOM规则
{
  type: 'dom',
  selector: '.my-element', // CSS选择器
  count: 2 // 或 { min: 1, max: 3 } 元素数量条件
}

// 组合规则
{
  type: 'combined',
  operator: 'AND', // 或 'OR', 'NOT'
  rules: [
    { type: 'route', pattern: '/detail' },
    { type: 'dom', selector: '.operation-buttons-area' }
  ]
}
```

### 3. 开发与测试

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 运行测试
npm test

# 带覆盖率的测试
npm run test:coverage

# 构建生产版本
npm run build
```

## 已实现功能

- [x] 添加视频音频处理功能
- [x] 批量生成功能

## 功能特性

- 批量生成工具

  - 支持批量文本输入和生成
  - 可设置统一的通用参数
  - 支持模板词批量替换
  - 实时显示生成进度

- 故事创作助手

  - 辅助创作故事分镜
  - 支持批量创建多个分镜
  - 与即梦平台深度集成

- 音频处理工具

  - 音频文件波形可视化
  - 支持音频剪辑和分段
  - MP3 格式导出
  - 键盘快捷键支持

- AI 助手

  - 基于 AI 的智能对话
  - 支持多轮对话
  - 系统提示词设置
  - 实时流式响应

- 智能抠图（开发中）
  - 基于 AI 的智能抠图
  - 支持人像、物体等场景
  - 笔刷和橡皮擦工具
  - 支持操作撤销和重做

## 开发说明

### 环境要求

- Node.js >= 14
- npm >= 6

### 安装依赖
