/**
 * DOM操作工具函数
 */

export interface ButtonOptions {
  text?: string;
  className?: string;
  style?: Record<string, string>;
  onClick?: (e: MouseEvent) => void;
}

/**
 * 等待元素出现在DOM中
 * @param selector CSS选择器
 * @param timeout 超时时间(ms)
 * @returns Promise 解析为目标元素或null(超时)
 */
export function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    // 先检查元素是否已存在
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    // 设置观察器监听DOM变化
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 设置超时
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * 创建按钮元素
 * @param options 按钮配置选项
 * @returns 按钮元素
 */
export function createButton(options: ButtonOptions = {}): HTMLButtonElement {
  const {
    text = '',
    className = '',
    style = {},
    onClick = null
  } = options;

  const button = document.createElement('button');
  button.textContent = text;
  
  if (className) {
    button.className = className;
  }

  // 应用样式
  Object.entries(style).forEach(([prop, value]) => {
    button.style[prop as any] = value;
  });

  // 绑定点击事件
  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
}

/**
 * 匹配网站样式的按钮工厂
 * @param text 按钮文本
 * @param onClick 点击处理函数
 * @returns 按钮元素
 */
export function createSiteStyledButton(
  text: string, 
  onClick?: (e: MouseEvent) => void
): HTMLButtonElement {
  // 获取网站上已有按钮的样式并复制
  const existingButton = document.querySelector('.operation-buttons-area button');
  const newButton = document.createElement('button');
  
  if (existingButton) {
    // 复制现有按钮的样式类
    newButton.className = existingButton.className;
    // 移除可能的禁用状态类
    newButton.classList.remove('disabled', 'btn-disabled');
    // 添加自定义标识类
    newButton.classList.add('dreamina-custom-btn');
  } else {
    newButton.className = 'dreamina-custom-btn';
  }
  
  newButton.textContent = text;
  
  if (onClick) {
    newButton.addEventListener('click', onClick);
  }
  
  return newButton;
} 