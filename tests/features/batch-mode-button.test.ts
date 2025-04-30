/**
 * 批量模式按钮特性测试
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import BatchModeButtonFeature from '../../src/features/batch-mode-button';

describe('BatchModeButtonFeature', () => {
  let feature: BatchModeButtonFeature;
  
  beforeEach(() => {
    // 清理之前的测试DOM
    document.body.innerHTML = '';
    
    // 创建特性实例
    feature = new BatchModeButtonFeature({ debug: true });
    
    // 模拟引擎
    feature['engine'] = {
      logger: {
        log: jest.fn(),
        error: jest.fn()
      }
    } as any;
    
    // 创建测试DOM
    document.body.innerHTML = `
      <div class="inputContainer-abc123">
        <div class="someOtherClass">
          <div class="operationWrap-xyz789">
            <div class="existingButton">现有按钮</div>
          </div>
        </div>
      </div>
      <div class="inputContainer-def456">
        <div class="operationWrap-uvw321">
          <div class="existingButton">另一个按钮</div>
        </div>
      </div>
    `;
  });
  
  afterEach(() => {
    // 销毁特性
    feature.destroy();
  });
  
  test('应该正确创建批量模式按钮特性实例', () => {
    expect(feature).toBeInstanceOf(BatchModeButtonFeature);
    expect(feature.id).toBe('batchModeButton');
  });
  
  test('当没有输入容器时，apply应该返回false', () => {
    // 清空DOM
    document.body.innerHTML = '';
    
    // 应用特性
    const result = feature.apply();
    
    // 验证结果
    expect(result).toBe(false);
  });
  
  test('当有输入容器和操作区域时，应该添加批量模式开关', () => {
    // 应用特性
    const result = feature.apply();
    
    // 验证结果
    expect(result).toBe(true);
    
    // 查找添加的开关容器
    const switchContainers = document.querySelectorAll('.dreamina-batch-mode-container');
    
    // 应该添加了两个开关
    expect(switchContainers.length).toBe(2);
    
    // 验证开关内容
    const firstSwitch = switchContainers[0] as HTMLElement;
    expect(firstSwitch.querySelector('span')?.textContent).toBe('批量模式');
    expect(firstSwitch.querySelector('.dreamina-switch')).not.toBeNull();
    expect(firstSwitch.querySelector('.dreamina-switch-slider')).not.toBeNull();
  });
  
  test('已存在的开关不会重复添加', () => {
    // 第一次应用
    feature.apply();
    
    // 验证已添加两个开关
    const switchesFirstApply = document.querySelectorAll('.dreamina-batch-mode-container');
    expect(switchesFirstApply.length).toBe(2);
    
    // 再次应用
    feature.apply();
    
    // 验证开关数量没有增加
    const switchesSecondApply = document.querySelectorAll('.dreamina-batch-mode-container');
    expect(switchesSecondApply.length).toBe(2);
  });
  
  test('点击开关应该切换活动状态', () => {
    // 应用特性
    feature.apply();
    
    // 获取第一个开关容器和开关元素
    const switchContainer = document.querySelector('.dreamina-batch-mode-container') as HTMLElement;
    const switchEl = switchContainer.querySelector('.dreamina-switch') as HTMLElement;
    const slider = switchContainer.querySelector('.dreamina-switch-slider') as HTMLElement;
    
    expect(switchContainer).not.toBeNull();
    expect(switchEl).not.toBeNull();
    expect(slider).not.toBeNull();
    
    // 模拟点击
    const clickEvent = new MouseEvent('click');
    // 模拟alert
    const originalAlert = window.alert;
    window.alert = jest.fn();
    
    // 初始状态
    expect(switchEl.classList.contains('active')).toBe(false);
    expect(switchEl.style.backgroundColor).toBe('rgb(204, 204, 204)');
    expect(slider.style.left).toBe('2px');
    
    // 触发点击 - 开启
    switchContainer.dispatchEvent(clickEvent);
    
    // 验证状态变化为开启
    expect(switchEl.classList.contains('active')).toBe(true);
    expect(switchEl.style.backgroundColor).toBe('rgb(22, 119, 255)');
    expect(slider.style.left).toBe('22px');
    expect(window.alert).toHaveBeenCalledWith('批量模式已开启！');
    
    // 再次点击 - 关闭
    switchContainer.dispatchEvent(clickEvent);
    
    // 验证状态变化为关闭
    expect(switchEl.classList.contains('active')).toBe(false);
    expect(switchEl.style.backgroundColor).toBe('rgb(204, 204, 204)');
    expect(slider.style.left).toBe('2px');
    expect(window.alert).toHaveBeenCalledWith('批量模式已关闭！');
    
    // 恢复alert
    window.alert = originalAlert;
  });
  
  test('使用defaultActive选项可以设置初始状态为开启', () => {
    // 创建默认开启的特性实例
    const activeFeature = new BatchModeButtonFeature({ 
      debug: true,
      defaultActive: true
    });
    
    // 设置模拟引擎
    activeFeature['engine'] = {
      logger: {
        log: jest.fn(),
        error: jest.fn()
      }
    } as any;
    
    // 应用特性
    activeFeature.apply();
    
    // 获取开关元素
    const switchEl = document.querySelector('.dreamina-switch') as HTMLElement;
    const slider = document.querySelector('.dreamina-switch-slider') as HTMLElement;
    
    // 验证初始状态为开启
    expect(switchEl.classList.contains('active')).toBe(true);
    expect(switchEl.style.backgroundColor).toBe('rgb(22, 119, 255)');
    expect(slider.style.left).toBe('22px');
    
    // 销毁特性
    activeFeature.destroy();
  });
  
  test('destroy应该移除所有添加的开关', () => {
    // 应用特性
    feature.apply();
    
    // 验证开关已添加
    const switchesBeforeDestroy = document.querySelectorAll('.dreamina-batch-mode-container');
    expect(switchesBeforeDestroy.length).toBe(2);
    
    // 销毁特性
    feature.destroy();
    
    // 验证所有开关被移除
    const switchesAfterDestroy = document.querySelectorAll('.dreamina-batch-mode-container');
    expect(switchesAfterDestroy.length).toBe(0);
  });
  
  test('当操作区域不存在时不应添加开关', () => {
    // 清空DOM
    document.body.innerHTML = `
      <div class="inputContainer-abc123">
        <!-- 没有操作区域 -->
      </div>
    `;
    
    // 应用特性
    const result = feature.apply();
    
    // 验证结果，因为没有成功添加任何开关，所以应该返回false
    expect(result).toBe(false);
    
    // 验证没有添加开关
    const switches = document.querySelectorAll('.dreamina-batch-mode-container');
    expect(switches.length).toBe(0);
  });
}); 