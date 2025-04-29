/**
 * 抠图按钮特性测试
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import ImageMattingButtonFeature from '../../src/features/image-matting-button';

describe('ImageMattingButtonFeature', () => {
  let feature: ImageMattingButtonFeature;
  
  beforeEach(() => {
    // 重置DOM
    document.body.innerHTML = `
      <div class="workDetailWrap-xyz123">
        <div class="groupName-abc">编辑</div>
        <div class="group-def">
          <div class="optItem-ghi">
            <svg></svg>
            <span>消除笔</span>
          </div>
        </div>
      </div>
    `;
    
    // 创建特性实例
    feature = new ImageMattingButtonFeature();
    
    // 模拟引擎
    feature['engine'] = {
      logger: {
        log: jest.fn(),
        error: jest.fn()
      }
    } as any;
  });
  
  test('按钮添加后可以通过destroy方法移除', () => {
    // 应用特性，添加按钮
    const result = feature.apply();
    expect(result).toBe(true);
    
    // 验证按钮已添加
    const addedButton = document.querySelector('.dreamina-matting-button');
    expect(addedButton).not.toBeNull();
    
    // 调用destroy方法
    feature.destroy();
    
    // 验证按钮已被移除
    const buttonAfterDestroy = document.querySelector('.dreamina-matting-button');
    expect(buttonAfterDestroy).toBeNull();
    
    // 验证状态已重置
    expect(feature['buttonAdded']).toBe(false);
  });
  
  test('在constructor中正确设置了onRemove选项', () => {
    // 检查规则配置是否包含onRemove
    const rules = (feature as any)['rules'];
    
    expect(rules).toBeDefined();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].onRemove).toBe(true);
    expect(rules[0].selector).toContain('workDetailWrap');
  });
  
  test('已添加按钮时再次应用不会重复添加', () => {
    // 第一次应用
    feature.apply();
    
    // 验证按钮已添加，只有一个
    const firstButtonCount = document.querySelectorAll('.dreamina-matting-button').length;
    expect(firstButtonCount).toBe(1);
    
    // 第二次应用
    feature.apply();
    
    // 验证按钮数量没有增加
    const secondButtonCount = document.querySelectorAll('.dreamina-matting-button').length;
    expect(secondButtonCount).toBe(1);
  });
  
  test('destroy方法能移除所有抠图按钮', () => {
    // 应用特性，添加按钮
    feature.apply();
    
    // 手动添加第二个按钮模拟可能的多按钮情况
    const extraButton = document.createElement('div');
    extraButton.className = 'optItem-xyz dreamina-matting-button';
    extraButton.innerHTML = '<span>抠图</span>';
    
    const groupElement = document.querySelector('.group-def');
    if (groupElement) {
      groupElement.appendChild(extraButton);
    }
    
    // 验证有两个按钮
    const buttonsBefore = document.querySelectorAll('.dreamina-matting-button');
    expect(buttonsBefore.length).toBe(2);
    
    // 调用destroy方法
    feature.destroy();
    
    // 验证所有按钮都被移除
    const buttonsAfter = document.querySelectorAll('.dreamina-matting-button');
    expect(buttonsAfter.length).toBe(0);
  });
  
  test('工作区域不存在时apply返回false', () => {
    // 清空DOM
    document.body.innerHTML = '';
    
    // 应用特性
    const result = feature.apply();
    
    // 应该返回false，表示应用失败
    expect(result).toBe(false);
    
    // 查看是否有记录错误
    const logger = feature['engine']?.logger;
    if (logger && typeof logger.error === 'function') {
      expect(logger.error).toHaveBeenCalled();
    }
  });
}); 