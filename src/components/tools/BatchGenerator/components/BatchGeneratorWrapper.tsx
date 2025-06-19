import React from "react";
import { BatchGenerator } from "../BatchGenerator";
import { RouteValidator } from "../../../common/RouteValidator";

interface BatchGeneratorWrapperProps {
  scrollToBottom?: () => void;
}

export const BatchGeneratorWrapper: React.FC<BatchGeneratorWrapperProps> = ({
  scrollToBottom,
}) => {
  return (
    <RouteValidator
      urlPattern={[/^https:\/\/jimeng\.jianying\.com\/ai-tool\/generate/]}
      title="请先进入生成流界面"
      description="批量生成功能需要在即梦生成流界面使用"
      redirectUrl="https://jimeng.jianying.com/ai-tool/image/generate"
      buttonText="进入生成流界面"
      toolId="batch-generator"
    >
      <BatchGenerator scrollToBottom={scrollToBottom} />
    </RouteValidator>
  );
};
