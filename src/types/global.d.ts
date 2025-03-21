declare global {
  interface Window {
    __debugger: {
      storyEditorPageController: {
        _timelineManager: {
          _draftController: {
            segment: {
              addEmptySegment: () => { ok: boolean; value: string };
            };
          };
        };
        _getMainEditor: (service: any) => {
          getDataSdk: () => {
            api: {
              segment: {
                setDescription: (params: { segmentId: string; desc: string }) => Promise<void>;
              };
            };
          };
        };
        _editorContainerService: any;
      };
    };
  }
}

export {}; 