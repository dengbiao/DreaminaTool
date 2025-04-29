/**
 * 添加导出按钮示例
 * 在详情页添加自定义导出按钮
 */

import BaseFeature from '../core/base-feature';
import type { FeatureOptions } from '../core/base-feature';
import { waitForElement, createSiteStyledButton } from '../utils/dom-utils';
import type { Rule } from '../core/rules/rule-engine';

export interface ExportButtonOptions extends FeatureOptions {
  /**
   * 导出格式
   */
  format?: 'json' | 'csv' | 'txt';
  
  /**
   * 自定义按钮文本
   */
  buttonText?: string;
  
  /**
   * 自定义点击处理函数
   */
  onClick?: (e: MouseEvent) => void;
}

/**
 * 详情页导出按钮特性
 */
export default class ExportButtonFeature extends BaseFeature {
  private buttonAdded: boolean;
  private format: string;
  private buttonConfig: {
    text: string;
    onClick: (e: MouseEvent) => void;
  };

  /**
   * 创建导出按钮特性
   * @param options 特性配置选项
   */
  constructor(options: ExportButtonOptions = {}) {
    // 定义详情页规则
    const rules: Rule[] = [
      {
        type: 'combined',
        operator: 'AND',
        triggerOn: ['dom', 'route'],
        rules: [
          {
            type: 'route',
            pattern: /\/detail\/\d+/,  // 匹配详情页路由
          },
          {
            type: 'dom',
            selector: '.operation-buttons-area',  // 确保按钮容器存在
          }
        ]
      }
    ];
    
    super({
      id: 'exportButton',
      name: '导出按钮',
      description: '在详情页添加导出按钮',
      rules,
      ...options
    });
    
    this.buttonAdded = false;
    this.format = options.format || 'json';
    this.buttonConfig = {
      text: options.buttonText || `导出${this.format.toUpperCase()}`,
      onClick: options.onClick || this.handleExport.bind(this)
    };
  }

  /**
   * 应用特性
   */
  apply(): boolean {
    if (!super.apply()) return false;
    
    // 等待按钮容器元素出现
    waitForElement('.operation-buttons-area').then(container => {
      if (container && !this.buttonAdded) {
        // 创建新按钮
        const button = createSiteStyledButton(
          this.buttonConfig.text, 
          this.buttonConfig.onClick
        );
        
        // 添加按钮到容器
        container.appendChild(button);
        this.buttonAdded = true;
        
        if (this.engine && this.engine.logger) {
          this.engine.logger.log(`已添加导出${this.format.toUpperCase()}按钮到详情页`);
        }
      }
    });
    
    return true;
  }

  /**
   * 导出处理函数
   */
  private handleExport(e: MouseEvent): void {
    e.preventDefault();
    
    try {
      // 获取详情页数据
      const detailData = this.getDetailData();
      
      // 根据格式导出
      switch (this.format) {
        case 'json':
          this.exportJson(detailData);
          break;
        case 'csv':
          this.exportCsv(detailData);
          break;
        case 'txt':
          this.exportTxt(detailData);
          break;
        default:
          this.exportJson(detailData);
      }
      
      // 显示导出成功提示
      this.showSuccessMessage();
    } catch (error) {
      console.error('导出失败:', error);
      this.showErrorMessage(error as Error);
    }
  }
  
  /**
   * 获取详情页数据
   */
  private getDetailData(): any {
    // 这里实现从页面获取数据的逻辑
    // 实际项目中应根据页面结构实现
    
    // 示例：获取详情标题和描述
    const title = document.querySelector('.detail-title')?.textContent || '未知标题';
    const description = document.querySelector('.detail-description')?.textContent || '';
    const id = window.location.pathname.split('/').pop() || '';
    
    return {
      id,
      title,
      description,
      exportTime: new Date().toISOString()
    };
  }
  
  /**
   * 导出JSON
   */
  private exportJson(data: any): void {
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, 'application/json', `export_${Date.now()}.json`);
  }
  
  /**
   * 导出CSV
   */
  private exportCsv(data: any): void {
    // 简单CSV转换
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).join(',');
    const csv = `${headers}\n${values}`;
    
    this.downloadFile(csv, 'text/csv', `export_${Date.now()}.csv`);
  }
  
  /**
   * 导出文本
   */
  private exportTxt(data: any): void {
    let text = '';
    for (const [key, value] of Object.entries(data)) {
      text += `${key}: ${value}\n`;
    }
    
    this.downloadFile(text, 'text/plain', `export_${Date.now()}.txt`);
  }
  
  /**
   * 下载文件
   */
  private downloadFile(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  /**
   * 显示成功消息
   */
  private showSuccessMessage(): void {
    alert(`导出${this.format.toUpperCase()}成功！`);
  }
  
  /**
   * 显示错误消息
   */
  private showErrorMessage(error: Error): void {
    alert(`导出失败: ${error.message}`);
  }
  
  /**
   * 销毁特性
   */
  destroy(): void {
    // 移除已添加的按钮
    if (this.buttonAdded) {
      const button = document.querySelector('.dreamina-custom-btn');
      if (button) {
        button.remove();
      }
      this.buttonAdded = false;
    }
    
    super.destroy();
  }
} 