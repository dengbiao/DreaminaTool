import React, { useState, useCallback, useEffect, useRef } from "react";
import styles from "./BatchGenerator.module.scss";
import {
  ImageRadioType,
  ImageGenerateResponse,
} from "../../../types/imageGenerator";
import { generateRequestHeaders } from "../../../utils/sign";
import { TabSelector } from "./components/TabSelector";
import { NormalMode, NormalModeHandle } from "./components/modes/NormalMode";
import {
  SharedParamsMode,
  SharedParamsModeHandle,
} from "./components/modes/SharedParamsMode";
import { ReplaceMode, ReplaceModeHandle } from "./components/modes/ReplaceMode";
import {
  GenerationMode,
  ModelConfig,
  RatioConfig,
  GenerationParams,
  ProgressInfo,
} from "./types";
import BatchGenerationService from "./services/batchGenerationProxy";
import { StatusBar } from "./components/StatusBar";
import { ParamsPanel } from "./components/ParamsPanel";

// Tab 配置
const GENERATION_TABS = [
  {
    id: GenerationMode.NORMAL,
    label: "普通模式",
    description: "每行输入一个完整的提示词，将按顺序批量生成图片",
  },
  {
    id: GenerationMode.SHARED_PARAMS,
    label: "通参模式",
    description: "设置共享参数，每行提示词将与共享参数组合生成",
  },
  {
    id: GenerationMode.REPLACE,
    label: "替换模式",
    description: "使用模板提示词，通过替换变量构造不同的提示词然后生成多张图片",
  },
];

// 模型配置
const MODEL_CONFIGS: ModelConfig[] = [
  {
    value: "high_aes_general_v30l:general_v3.0_18b",
    name: "图片 3.0",
    description: "影视质感，文字更准，直出2k高清图",
  },
  {
    value: "high_aes_general_v21_L:general_v2.1_L",
    name: "图片 2.1",
    description: "稳定的结构和更强的影视质感，支持生成中、英文文字",
  },
  {
    value: "model_generate_beta:v1",
    name: "图片 实验室",
    description: "创新的试验场，艺术风格更突出，仅在公司内网环境下可见",
  },
  {
    value: "high_aes_general_v20_L:general_v2.0_L",
    name: "图片 2.0 Pro",
    description: "大幅提升了多样性和真实的照片质感，开启创新与设计的视觉梦境",
  },
  {
    value: "high_aes_general_v20:general_v2.0",
    name: "图片 2.0",
    description: "更精准的描述词响应和多样的风格组合，模型极具想象力！",
  },
  {
    value: "text2img_xl_sft",
    name: "图片 XL Pro",
    description: "增强英文生成能力和参考图可控能力，使用引号强化文字效果",
  },
];

// 图片比例配置
const RATIO_CONFIGS: RatioConfig[] = [
  {
    ratio: "21:9",
    width: 1195,
    height: 512,
    type: ImageRadioType.TwentyOneNine,
  },
  { ratio: "16:9", width: 1024, height: 576, type: ImageRadioType.SixteenNine },
  { ratio: "3:2", width: 1024, height: 682, type: ImageRadioType.ThreeTwo },
  { ratio: "4:3", width: 1024, height: 768, type: ImageRadioType.FourThree },
  { ratio: "1:1", width: 1024, height: 1024, type: ImageRadioType.OneOne },
  { ratio: "3:4", width: 768, height: 1024, type: ImageRadioType.ThreeFour },
  { ratio: "2:3", width: 682, height: 1024, type: ImageRadioType.TwoThree },
  { ratio: "9:16", width: 576, height: 1024, type: ImageRadioType.NineSixteen },
];

// 本地存储键名常量
const STORAGE_KEYS = {
  MODEL: "jimeng_selected_model",
  RATIO: "jimeng_selected_ratio",
  STRENGTH: "jimeng_sample_strength",
  PARAMS_COLLAPSED: "jimeng_params_collapsed",
  PROMPT_HEIGHT: "jimeng_prompt_height",
  GENERATION_MODE: "jimeng_generation_mode",
};

interface ModeInputs {
  [GenerationMode.NORMAL]: string;
  [GenerationMode.SHARED_PARAMS]: {
    basePrompts: string;
    sharedParams: string;
  };
  [GenerationMode.REPLACE]: {
    template: string;
    variables: string;
  };
}

interface BatchGeneratorProps {
  scrollToBottom?: () => void;
}

export const BatchGenerator: React.FC<BatchGeneratorProps> = ({
  scrollToBottom,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(
    MODEL_CONFIGS[0]
  );
  const [selectedRatio, setSelectedRatio] = useState<RatioConfig>(
    RATIO_CONFIGS[4]
  );
  const [sampleStrength, setSampleStrength] = useState(5);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [paramsCollapsed, setParamsCollapsed] = useState(() => {
    const savedCollapsed = localStorage.getItem(STORAGE_KEYS.PARAMS_COLLAPSED);
    return savedCollapsed !== null ? savedCollapsed === "true" : true;
  });
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [mode, setMode] = useState<GenerationMode>(() => {
    const savedMode = localStorage.getItem(STORAGE_KEYS.GENERATION_MODE);
    return (savedMode as GenerationMode) || GenerationMode.NORMAL;
  });

  // 检查URL中是否有toolId参数，如果有则移除
  useEffect(() => {
    const url = new URL(window.location.href);
    const toolId = url.searchParams.get("toolId");

    if (toolId === "batch-generator") {
      // 移除toolId参数
      url.searchParams.delete("toolId");

      // 使用history API更新URL，不刷新页面
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  // 引用各个模式组件的处理函数
  const normalModeRef = useRef<NormalModeHandle>(null);
  const sharedParamsModeRef = useRef<SharedParamsModeHandle>(null);
  const replaceModeRef = useRef<ReplaceModeHandle>(null);

  // 处理模式切换
  const handleModeChange = (newMode: GenerationMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEYS.GENERATION_MODE, newMode);
  };

  // 处理生成按钮点击事件
  const handleGenerateClick = () => {
    if (isGenerating) return;

    // 调用滚动到底部的方法
    if (scrollToBottom) {
      // 延迟一点执行，确保进度条已经显示
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }

    switch (mode) {
      case GenerationMode.NORMAL:
        normalModeRef.current?.handleGenerate();
        break;
      case GenerationMode.SHARED_PARAMS:
        sharedParamsModeRef.current?.handleGenerate();
        break;
      case GenerationMode.REPLACE:
        replaceModeRef.current?.handleGenerate();
        break;
    }
  };

  // 监听批量生成进度更新
  useEffect(() => {
    const handleProgressUpdate = (message: any) => {
      console.log("Received message in BatchGenerator:", message);
      if (message.type === "BATCH_PROGRESS_UPDATE") {
        setProgress(message.progress);
      }
    };

    // 同时监听 chrome.runtime.onMessage 和 window message
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data.type === "FROM_PAGE_BATCH_PROGRESS_UPDATE") {
        console.log("Received window message:", event.data);
        setProgress(event.data.progress);
      }
    };

    chrome.runtime.onMessage.addListener(handleProgressUpdate);
    window.addEventListener("message", handleWindowMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleProgressUpdate);
      window.removeEventListener("message", handleWindowMessage);
    };
  }, [scrollToBottom]);

  // 处理终止生成
  const handleStop = useCallback(() => {
    setIsStopped(true);
    // 通过消息机制发送终止信号
    chrome.runtime.sendMessage({
      type: "STOP_BATCH_GENERATE",
    });
  }, []);

  // 开始批量生成
  const startGeneration = useCallback(
    async (prompts: string[], params: GenerationParams) => {
      if (isGenerating || !prompts.length) return;

      setIsGenerating(true);
      setIsStopped(false);
      setStatus(""); // 清除之前的状态
      setProgress(null); // 清除之前的进度

      // 滚动到底部
      requestAnimationFrame(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      });

      try {
        const result = await BatchGenerationService.startBatchGeneration(
          prompts,
          params
        );
        setProgress({
          totalProcessed: prompts.length,
          total: prompts.length,
          queueLength: 0,
          runningTasks: 0,
          successCount: result.successCount,
          failCount: result.failCount,
        });
      } catch (error) {
        setStatus((error as Error).message);
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating]
  );

  // 保存参数面板的展开/收起状态
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.PARAMS_COLLAPSED,
      String(paramsCollapsed)
    );
  }, [paramsCollapsed]);

  return (
    <div className={styles.batchGenerator}>
      <TabSelector
        tabs={GENERATION_TABS}
        activeMode={mode}
        onModeChange={handleModeChange}
      />

      <div className={styles.content}>
        <div
          style={{ display: mode === GenerationMode.NORMAL ? "block" : "none" }}
        >
          <NormalMode
            ref={normalModeRef}
            onGenerate={(prompts) =>
              startGeneration(prompts, {
                model: selectedModel,
                ratio: selectedRatio,
                strength: sampleStrength,
                seed: seed,
              })
            }
            isGenerating={isGenerating}
          />
        </div>

        <div
          style={{
            display: mode === GenerationMode.SHARED_PARAMS ? "block" : "none",
          }}
        >
          <SharedParamsMode
            ref={sharedParamsModeRef}
            onGenerate={(prompts) =>
              startGeneration(prompts, {
                model: selectedModel,
                ratio: selectedRatio,
                strength: sampleStrength,
                seed: seed,
              })
            }
            isGenerating={isGenerating}
          />
        </div>

        <div
          style={{
            display: mode === GenerationMode.REPLACE ? "block" : "none",
          }}
        >
          <ReplaceMode
            ref={replaceModeRef}
            onGenerate={(prompts) =>
              startGeneration(prompts, {
                model: selectedModel,
                ratio: selectedRatio,
                strength: sampleStrength,
                seed: seed,
              })
            }
            isGenerating={isGenerating}
          />
        </div>

        <ParamsPanel
          mode={mode}
          modelConfigs={MODEL_CONFIGS}
          ratioConfigs={RATIO_CONFIGS}
          onModelChange={setSelectedModel}
          onRatioChange={setSelectedRatio}
          onStrengthChange={setSampleStrength}
          onSeedChange={setSeed}
          isCollapsed={paramsCollapsed}
          onCollapsedChange={setParamsCollapsed}
        />

        <button
          className={styles.generateButton}
          onClick={handleGenerateClick}
          disabled={isGenerating}
        >
          {isGenerating ? "生成中..." : "开始批量生成"}
        </button>

        <StatusBar
          status={status}
          progress={progress}
          onStop={handleStop}
          isGenerating={isGenerating}
          isStopped={isStopped}
        />
      </div>
    </div>
  );
};
