// 监听消息并执行分镜创建
window.addEventListener('message', async (event) => {
  if (event.data?.type === 'CREATE_STORY_SHOTS') {
    try {
      // @ts-ignore
      const results = await window.createStoryShots(event.data.descriptions);
      window.postMessage({ 
        type: 'STORY_SHOTS_RESULT', 
        results 
      }, '*');
    } catch (error) {
      window.postMessage({ 
        type: 'STORY_SHOTS_RESULT', 
        results: [{ ok: false, error: '执行创建分镜失败' }] 
      }, '*');
    }
  }
}); 