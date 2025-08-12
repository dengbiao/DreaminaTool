import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import styles from "./BatchGenerator.module.scss";
import { ImageRadioType } from "../../../types/imageGenerator";
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
import {
  startBatchGeneration,
  stopBatchGeneration,
} from "../../../modules/batch-generate/api";
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

// 图片比例配置 (标清 1K - 非3.0模型)
const RATIO_CONFIGS_1K: RatioConfig[] = [
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

// 图片比例配置 (标清 1K - 3.0模型)
const RATIO_CONFIGS_MODEL3_1K: RatioConfig[] = [
  {
    ratio: "21:9",
    width: 2016,
    height: 864,
    type: ImageRadioType.TwentyOneNine,
  },
  { ratio: "16:9", width: 1664, height: 936, type: ImageRadioType.SixteenNine },
  { ratio: "3:2", width: 1584, height: 1056, type: ImageRadioType.ThreeTwo },
  { ratio: "4:3", width: 1472, height: 1104, type: ImageRadioType.FourThree },
  { ratio: "1:1", width: 1328, height: 1328, type: ImageRadioType.OneOne },
  { ratio: "3:4", width: 1104, height: 1472, type: ImageRadioType.ThreeFour },
  { ratio: "2:3", width: 1056, height: 1584, type: ImageRadioType.TwoThree },
  { ratio: "9:16", width: 936, height: 1664, type: ImageRadioType.NineSixteen },
];

// 图片比例配置 (高清 2K - 仅3.0模型)
const RATIO_CONFIGS_MODEL3_2K: RatioConfig[] = [
  {
    ratio: "21:9",
    width: 3024,
    height: 1296,
    type: ImageRadioType.TwentyOneNine,
  },
  {
    ratio: "16:9",
    width: 2560,
    height: 1440,
    type: ImageRadioType.SixteenNine,
  },
  { ratio: "3:2", width: 2496, height: 1664, type: ImageRadioType.ThreeTwo },
  { ratio: "4:3", width: 2304, height: 1728, type: ImageRadioType.FourThree },
  { ratio: "1:1", width: 2048, height: 2048, type: ImageRadioType.OneOne },
  { ratio: "3:4", width: 1728, height: 2304, type: ImageRadioType.ThreeFour },
  { ratio: "2:3", width: 1664, height: 2496, type: ImageRadioType.TwoThree },
  {
    ratio: "9:16",
    width: 1440,
    height: 2560,
    type: ImageRadioType.NineSixteen,
  },
];

// 本地存储键名常量
const STORAGE_KEYS = {
  MODEL: "jimeng_selected_model",
  RATIO: "jimeng_selected_ratio",
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
  // 动态模型列表
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);

  useEffect(() => {
    // 如果 selectedModel 为空，则获取模型列表
    if (!selectedModel) {
      setLoadingModels(true);
      chrome.runtime.sendMessage(
        {
          type: "GET_MODEL_LIST",
        },
        (response) => {
          if (
            response &&
            Array.isArray(response.models) &&
            response.models.length > 0
          ) {
            setModelConfigs(response.models);
            setSelectedModel(response.models[0]);
          } else {
            setModelConfigs([]);
            setSelectedModel(null);
          }
          setLoadingModels(false);
        }
      );
    }
  }, [selectedModel]);

  // 记住图片3.0模型的清晰度选择
  const [model3Clarity, setModel3Clarity] = useState<string>(() => {
    const savedClarity = localStorage.getItem("model3_clarity");
    return savedClarity || "1k";
  });

  // 当前使用的清晰度
  const is3Point0Model = selectedModel?.name.includes("图片 3.0");
  const currentClarity = is3Point0Model ? model3Clarity : "1k";

  // 根据当前模型和清晰度选择合适的比例配置
  const ratioConfigs = is3Point0Model
    ? currentClarity === "2k"
      ? RATIO_CONFIGS_MODEL3_2K // 图片3.0 + 2K模式
      : RATIO_CONFIGS_MODEL3_1K // 图片3.0 + 1K模式
    : RATIO_CONFIGS_1K; // 其他模型 (仅1K模式)

  // 选择的比例类型
  const [ratioType, setRatioType] = useState<number>(() => {
    const savedRatio = localStorage.getItem(STORAGE_KEYS.RATIO);
    if (savedRatio) {
      // 查找保存的比例，获取其类型
      const savedConfig = [
        ...RATIO_CONFIGS_1K,
        ...RATIO_CONFIGS_MODEL3_2K,
        ...RATIO_CONFIGS_MODEL3_1K,
      ].find((r) => r.ratio === savedRatio);
      return savedConfig?.type || ImageRadioType.OneOne; // 默认为1:1
    }
    return ImageRadioType.OneOne; // 默认为1:1
  });

  // 根据当前的比例类型和ratio配置，确定当前要显示的ratio
  const selectedRatio = useMemo(() => {
    const ratio = ratioConfigs.find((r) => r.type === ratioType);
    return ratio || ratioConfigs[4]; // 默认为1:1
  }, [ratioConfigs, ratioType]);

  // 当在ParamsPanel中改变比例选择时
  const handleRatioChange = (ratio: RatioConfig) => {
    setRatioType(ratio.type);
    localStorage.setItem(STORAGE_KEYS.RATIO, ratio.ratio);
  };

  // 当改变清晰度选择时
  const handleClarityChange = (clarity: string) => {
    if (is3Point0Model) {
      setModel3Clarity(clarity);
      localStorage.setItem("model3_clarity", clarity);
    }
  };

  // 当改变模型选择时
  const handleModelChange = (model: ModelConfig) => {
    setSelectedModel(model);
  };

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
    // 统一的进度更新处理函数
    const updateProgress = (newProgress: any) => {
      console.log("Updating progress:", newProgress);
      setProgress(newProgress);

      // 只有当所有任务都完成时（没有运行中和排队中的任务）才结束生成状态
      if (
        newProgress.runningTasks === 0 &&
        newProgress.queueLength === 0 &&
        newProgress.totalProcessed === newProgress.total
      ) {
        setIsGenerating(false);
      }
    };

    // 处理生成进度更新的消息
    const handleProgressUpdateMessage = (event: MessageEvent) => {
      console.log("Received page message:", event.data);
      if (event.data.type === "BATCH_PROGRESS_UPDATE") {
        updateProgress(event.data.progress);
      }
    };

    window.addEventListener("message", handleProgressUpdateMessage);

    // 清理函数
    return () => {
      window.removeEventListener("message", handleProgressUpdateMessage);
    };
  }, []);

  // 处理终止生成
  const handleStop = useCallback(() => {
    setIsStopped(true);
    // 使用新的API函数
    stopBatchGeneration().catch((error) => {
      console.error("Failed to stop batch generation:", error);
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
        await startBatchGeneration(prompts, params);
        // 移除这里的 setProgress，因为进度会通过消息更新
      } catch (error) {
        setStatus((error as Error).message);
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

  if (loadingModels) {
    return <div>模型列表加载中...</div>;
  }
  if (!selectedModel) {
    return <div>未获取到可用模型，请稍后重试。</div>;
  }

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
                clarity: currentClarity,
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
                clarity: currentClarity,
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
                clarity: currentClarity,
              })
            }
            isGenerating={isGenerating}
          />
        </div>

        <ParamsPanel
          mode={mode}
          modelConfigs={modelConfigs}
          ratioConfigs={ratioConfigs}
          onModelChange={handleModelChange}
          onRatioChange={handleRatioChange}
          onStrengthChange={setSampleStrength}
          onSeedChange={setSeed}
          onClarityChange={handleClarityChange}
          isCollapsed={paramsCollapsed}
          onCollapsedChange={setParamsCollapsed}
          clarity={currentClarity}
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
