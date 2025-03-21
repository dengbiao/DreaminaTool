import { ImageGenerateResponse } from "../../../../types/imageGenerator";
import { GenerationParams } from "../types";

/**
 * 代理配置接口
 */
export interface ProxyConfig {
  methodName: string;
  customLogic: Function;
}

// 当前选中的生成参数
let currentGenerationParams: GenerationParams | null = null;

/**
 * 设置当前生成参数
 */
export function setCurrentGenerationParams(params: GenerationParams) {
  currentGenerationParams = params;
}

/**
 * 获取 imageManager 实例
 */
function getImageManager() {
  const parent = (window as any).__debugger._containerService._childs.values()
    .toArray()
    .find((item: any) =>
      item.services._entries.values()
        .toArray()
        .find((child: any) => child.__origin__ && child.__origin__.imageManager)
    );

  return parent && parent.services._entries.values()
    .toArray()
    .find((child: any) => child.__origin__ && child.__origin__.imageManager)
    .__origin__.imageManager;
}

/**
 * 生成代理配置
 */
export function generateProxyConfigs(): ProxyConfig[] {
  return [
    // 代理 canCustomSize 属性
    {
      methodName: 'Object.getOwnPropertyDescriptor',
      customLogic: function(obj: any, prop: string) {
        if (obj === getImageManager() && prop === 'canCustomSize') {
          return {
            configurable: true,
            enumerable: true,
            get: () => window.__BATCH_GENERATING__ ? true : obj.canCustomSize
          };
        }
        return originalMethods['Object.getOwnPropertyDescriptor'].apply(this, arguments);
      }
    },

    // 代理 selectModelKey 属性
    {
      methodName: 'Object.getOwnPropertyDescriptor',
      customLogic: function(obj: any, prop: string) {
        if (obj === getImageManager() && prop === 'selectModelKey') {
          return {
            configurable: true,
            enumerable: true,
            get: () => {
              if (window.__BATCH_GENERATING__ && currentGenerationParams) {
                return currentGenerationParams.model.value;
              }
              return obj.selectModelKey;
            }
          };
        }
        return originalMethods['Object.getOwnPropertyDescriptor'].apply(this, arguments);
      }
    },

    // 代理 selectModel 属性
    {
      methodName: 'Object.getOwnPropertyDescriptor',
      customLogic: function(obj: any, prop: string) {
        if (obj === getImageManager() && prop === 'selectModel') {
          return {
            configurable: true,
            enumerable: true,
            get: () => {
              if (window.__BATCH_GENERATING__ && currentGenerationParams) {
                const imageManager = getImageManager();
                return imageManager.modelList.find(
                  (m: any) => m.modelReqKey === imageManager.selectModelKey
                );
              }
              return obj.selectModel;
            }
          };
        }
        return originalMethods['Object.getOwnPropertyDescriptor'].apply(this, arguments);
      }
    },

    // 代理 imageRatio 属性
    {
      methodName: 'Object.getOwnPropertyDescriptor',
      customLogic: function(obj: any, prop: string) {
        if (obj === getImageManager() && prop === 'imageRatio') {
          return {
            configurable: true,
            enumerable: true,
            get: () => {
              if (window.__BATCH_GENERATING__ && currentGenerationParams) {
                return currentGenerationParams.ratio;
              }
              return obj.imageRatio;
            }
          };
        }
        return originalMethods['Object.getOwnPropertyDescriptor'].apply(this, arguments);
      }
    }
  ];
}

// 保存原始方法的引用
const originalMethods: { [key: string]: Function } = {}; 