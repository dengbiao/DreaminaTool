import React from "react";
import { StoryAssistant } from "../StoryAssistant";
import { RouteValidator } from "../../../common/RouteValidator";

export const StoryAssistantWrapper: React.FC = () => {
  return (
    <RouteValidator
      urlPattern={/^https:\/\/jimeng\.jianying\.com\/ai-tool\/story-editor/}
      title="需要在故事编辑器页面使用此功能"
      description="故事创作助手需要在故事编辑器页面使用"
      redirectUrl="https://jimeng.jianying.com/ai-tool/story-editor"
      buttonText="打开故事编辑器"
      toolId="story-assistant"
    >
      <StoryAssistant />
    </RouteValidator>
  );
};
