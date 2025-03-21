import { Tool } from '../../types/tools';
import * as bodyPix from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

interface DragBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export class MattingTool implements Tool {
    public readonly name = '智能抠图';
    public container: HTMLElement | null = null;
    private isModelLoading: boolean = true;
    private model: bodyPix.BodyPix | null = null;
    private imageCanvas: HTMLCanvasElement | null = null;
    private maskCanvas: HTMLCanvasElement | null = null;
    private canvasContainer: HTMLElement | null = null;
    private currentImage: HTMLImageElement | null = null;
    private isDrawing = false;
    private brushMode = 'brush';
    private brushSize = 20;
    private undoStack: ImageData[] = [];
    private redoStack: ImageData[] = [];
    private currentMode: 'brush' | 'eraser' | 'matting' | null = null;
    private elements: {
        brushBtn: HTMLButtonElement | null;
        eraserBtn: HTMLButtonElement | null;
        mattingBtn: HTMLButtonElement | null;
        undoBtn: HTMLButtonElement | null;
        redoBtn: HTMLButtonElement | null;
        previewBtn: HTMLButtonElement | null;
        downloadBtn: HTMLButtonElement | null;
    } | null = null;

    constructor() {
        this.initializeModel();
    }

    private async initializeModel() {
        try {
            this.showLoading('正在加载模型...');
            
            // 初始化 TensorFlow.js WebGL 后端
            await tf.setBackend('webgl');
            console.log('TensorFlow.js backend initialized:', tf.getBackend());
            
            this.model = await bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 0.75,
                quantBytes: 2
            });
            
            this.isModelLoading = false;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load BodyPix model:', error);
            this.showError('模型加载失败');
        }
    }

    private showLoading(message: string) {
        const loadingOverlay = this.container?.querySelector('.loading-overlay') as HTMLElement;
        if (loadingOverlay) {
            const messageEl = loadingOverlay.querySelector('p');
            if (messageEl) messageEl.textContent = message;
            loadingOverlay.classList.add('visible');
        }
    }

    private hideLoading() {
        const loadingOverlay = this.container?.querySelector('.loading-overlay') as HTMLElement;
        if (loadingOverlay) {
            loadingOverlay.classList.remove('visible');
        }
    }

    private showError(message: string) {
        // TODO: 实现错误提示UI
        console.error(message);
    }

    createUI(container: HTMLElement) {
        this.container = container;

        // 创建主容器
        const mattingContainer = document.createElement('div');
        mattingContainer.className = 'matting-container';

        // 创建主要内容
        const content = document.createElement('div');
        content.className = 'matting-content empty';

        // 工具栏
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        toolbar.innerHTML = `
            <div class="tool-group">
                <button class="tool-btn primary" id="uploadBtn" data-tooltip="上传图片">
                    <svg viewBox="0 0 24 24" class="icon-upload"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </button>
            </div>
            <div class="tool-group">
                <button class="tool-btn" id="brushBtn" disabled data-tooltip="笔刷">
                    <svg viewBox="0 0 24 24" class="icon-brush"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/></svg>
                </button>
                <button class="tool-btn" id="eraserBtn" disabled data-tooltip="橡皮擦">
                    <svg viewBox="0 0 24 24" class="icon-eraser"><path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83l3.85 3.85c.78.78 2.05.78 2.83 0L20.41 10.27c.78-.78.78-2.05 0-2.83l-3.85-3.85c-.39-.39-.9-.59-1.42-.59z"/></svg>
                </button>
                <button class="tool-btn" id="mattingBtn" disabled data-tooltip="抠图">
                    <svg viewBox="0 0 24 24" class="icon-matting">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                        <path d="M12 17.07L9.43 14.5c-.78-.78-.78-2.05 0-2.83L12 9.1l2.57 2.57c.78.78.78 2.05 0 2.83L12 17.07z"/>
                    </svg>
                </button>
            </div>
            <div class="tool-group">
                <button class="tool-btn" id="undoBtn" disabled data-tooltip="撤销">
                    <svg viewBox="0 0 24 24" class="icon-undo"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
                </button>
                <button class="tool-btn" id="redoBtn" disabled data-tooltip="重做">
                    <svg viewBox="0 0 24 24" class="icon-redo"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
                </button>
            </div>
            <div class="tool-group">
                <button class="tool-btn" id="previewBtn" disabled data-tooltip="预览">
                    <svg viewBox="0 0 24 24" class="icon-preview"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                </button>
                <button class="tool-btn primary" id="downloadBtn" disabled data-tooltip="下载">
                    <svg viewBox="0 0 24 24" class="icon-download"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                </button>
            </div>
        `;

        // 上传占位区域
        const uploadPlaceholder = document.createElement('div');
        uploadPlaceholder.className = 'upload-placeholder';
        uploadPlaceholder.innerHTML = `
            <svg class="upload-icon" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
            </svg>
            <span class="upload-text">开始智能抠图</span>
            <span class="upload-subtext">点击上传或拖拽图片到此处</span>
        `;

        // 画布容器
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.className = 'canvas-container';

        // 初始化画布
        this.imageCanvas = document.createElement('canvas');
        this.imageCanvas.id = 'imageCanvas';
        this.maskCanvas = document.createElement('canvas');
        this.maskCanvas.id = 'maskCanvas';

        // 加载遮罩
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <svg class="loading-spinner" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity=".3"/>
                <path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.41 3.59-8 8-8z"/>
            </svg>
            <p>正在加载模型...</p>
        `;

        // 组装DOM结构
        this.canvasContainer.appendChild(this.imageCanvas);
        this.canvasContainer.appendChild(this.maskCanvas);
        
        content.appendChild(toolbar);
        content.appendChild(uploadPlaceholder);
        content.appendChild(this.canvasContainer);
        
        mattingContainer.appendChild(content);
        mattingContainer.appendChild(loadingOverlay);
        
        // 将整个容器添加到传入的container中
        this.container.appendChild(mattingContainer);

        // 设置事件监听
        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (!this.container) {
            console.error('Container element not found');
            return;
        }

        // 初始化所有按钮引用
        this.elements = {
            brushBtn: this.container.querySelector('#brushBtn'),
            eraserBtn: this.container.querySelector('#eraserBtn'),
            mattingBtn: this.container.querySelector('#mattingBtn'),
            undoBtn: this.container.querySelector('#undoBtn'),
            redoBtn: this.container.querySelector('#redoBtn'),
            previewBtn: this.container.querySelector('#previewBtn'),
            downloadBtn: this.container.querySelector('#downloadBtn')
        };

        // 检查所有必需的元素是否存在
        const missingElements = Object.entries(this.elements)
            .filter(([, element]) => !element)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements);
            return;
        }

        // 工具按钮事件监听
        this.elements.brushBtn?.addEventListener('click', () => {
            if (this.currentMode === 'brush') {
                this.disableBrushMode();
            } else {
                this.enableBrushMode();
            }
        });

        this.elements.eraserBtn?.addEventListener('click', () => {
            if (this.currentMode === 'eraser') {
                this.disableEraserMode();
            } else {
                this.enableEraserMode();
            }
        });

        this.elements.mattingBtn?.addEventListener('click', () => {
            if (this.currentMode === 'matting') {
                this.disableMattingMode();
            } else {
                this.enableMattingMode();
            }
        });

        // 文件上传处理
        const uploadBtn = this.container.querySelector('#uploadBtn') as HTMLButtonElement;
        if (uploadBtn) {
            const createFileInput = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files && target.files[0]) {
                        this.handleImageUpload(target.files[0]);
                    }
                };
                return input;
            };

            uploadBtn.addEventListener('click', () => {
                createFileInput().click();
            });
        }

        // 点击空态区域上传
        const uploadPlaceholder = this.container.querySelector('.upload-placeholder') as HTMLElement;
        if (uploadPlaceholder) {
            uploadPlaceholder.addEventListener('click', () => {
                const createFileInput = () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: Event) => {
                        const target = e.target as HTMLInputElement;
                        if (target.files && target.files[0]) {
                            this.handleImageUpload(target.files[0]);
                        }
                    };
                    return input;
                };
                createFileInput().click();
            });
        }

        // 拖放处理
        const handleDragEvent = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDragEnter = (e: DragEvent) => {
            handleDragEvent(e);
            const content = this.container?.querySelector('.matting-content') as HTMLElement | null;
            if (content) {
                content.classList.add('drag-over');
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            handleDragEvent(e);
            if (!this.container) return;
            
            const uploadPlaceholder = this.container.querySelector('.upload-placeholder') as HTMLElement | null;
            if (!uploadPlaceholder) return;
            
            const bounds: DragBounds = uploadPlaceholder.getBoundingClientRect();
            const { clientX, clientY } = e;
            
            if (
                clientX <= bounds.left ||
                clientX >= bounds.right ||
                clientY <= bounds.top ||
                clientY >= bounds.bottom
            ) {
                const content = this.container.querySelector('.matting-content') as HTMLElement | null;
                if (content) {
                    content.classList.remove('drag-over');
                }
            }
        };

        const handleDrop = (e: DragEvent) => {
            handleDragEvent(e);
            const content = this.container?.querySelector('.matting-content') as HTMLElement | null;
            if (content) {
                content.classList.remove('drag-over');
            }
            
            if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
                this.handleImageUpload(e.dataTransfer.files[0]);
            }
        };

        if (uploadPlaceholder) {
            uploadPlaceholder.addEventListener('dragenter', handleDragEnter);
            uploadPlaceholder.addEventListener('dragover', handleDragEvent);
            uploadPlaceholder.addEventListener('dragleave', handleDragLeave);
            uploadPlaceholder.addEventListener('drop', handleDrop);
        }

        // 工具按钮处理
        this.elements.undoBtn?.addEventListener('click', () => this.undo());
        this.elements.redoBtn?.addEventListener('click', () => this.redo());
        this.elements.downloadBtn?.addEventListener('click', () => this.downloadResult());

        // 预览按钮处理
        this.elements.previewBtn?.addEventListener('click', () => {
            if (this.elements.previewBtn?.classList.contains('active')) {
                this.disablePreviewMode();
            } else {
                this.enablePreviewMode();
            }
        });

        // 画布事件处理
        if (this.maskCanvas) {
            this.maskCanvas.addEventListener('mousedown', this.startDrawing.bind(this));
            this.maskCanvas.addEventListener('mousemove', this.draw.bind(this));
            this.maskCanvas.addEventListener('mouseup', this.stopDrawing.bind(this));
            this.maskCanvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        } else {
            console.warn('Mask canvas not initialized');
        }
    }

    private async handleImageUpload(file: File) {
        if (!file || !file.type.startsWith('image/')) {
            console.log('Invalid file type:', file?.type);
            return;
        }

        console.log('Starting image upload:', file.name);
        const reader = new FileReader();
        reader.onload = async (e) => {
            console.log('FileReader loaded');
            const img = new Image();
            img.onload = async () => {
                console.log('Image loaded:', img.width, 'x', img.height);
                this.currentImage = img;
                this.resetCanvases();
                await this.processImage();
                this.enableTools();
                this.container?.querySelector('.matting-content')?.classList.remove('empty');
                this.container?.querySelector('.matting-content')?.classList.add('has-image');
            };
            img.onerror = (err) => {
                console.error('Image loading error:', err);
            };
            img.src = e.target?.result as string;
        };
        reader.onerror = (err) => {
            console.error('FileReader error:', err);
        };
        reader.readAsDataURL(file);
    }

    private resetCanvases() {
        if (!this.currentImage || !this.imageCanvas || !this.maskCanvas || !this.canvasContainer) {
            console.error('resetCanvases: Missing required elements', {
                hasImage: !!this.currentImage,
                hasImageCanvas: !!this.imageCanvas,
                hasMaskCanvas: !!this.maskCanvas,
                hasCanvasContainer: !!this.canvasContainer
            });
            return;
        }

        const imageCanvas = this.imageCanvas;
        const maskCanvas = this.maskCanvas;
        const container = this.canvasContainer;

        // 确保容器可见并且有正确的尺寸
        container.style.display = 'flex';
        container.style.minHeight = '400px';
        container.style.height = '100%';
        container.style.position = 'relative';

        // 先将画布添加到容器中
        if (!container.contains(imageCanvas)) {
            container.appendChild(imageCanvas);
        }
        if (!container.contains(maskCanvas)) {
            container.appendChild(maskCanvas);
        }

        // 等待DOM更新完成后再计算尺寸
        setTimeout(() => {
            const { width: imgWidth, height: imgHeight } = this.currentImage!;
            const containerRect = container.getBoundingClientRect();
            
            console.log('Container raw dimensions:', containerRect);
            
            // 确保容器尺寸有效
            if (containerRect.width <= 0 || containerRect.height <= 0) {
                console.error('Invalid container dimensions:', containerRect);
                return;
            }

            // 设置内边距
            const padding = 40;
            const maxWidth = Math.max(containerRect.width - padding * 2, 100);
            const maxHeight = Math.max(containerRect.height - padding * 2, 100);

            console.log('Container dimensions:', {
                width: containerRect.width,
                height: containerRect.height,
                maxWidth,
                maxHeight
            });

            // 计算缩放比例，保持宽高比
            const scaleWidth = maxWidth / imgWidth;
            const scaleHeight = maxHeight / imgHeight;
            const scale = Math.min(scaleWidth, scaleHeight, 1); // 不放大图片

            console.log('Scale factors:', {
                scaleWidth,
                scaleHeight,
                finalScale: scale
            });

            // 计算最终尺寸
            const scaledWidth = Math.max(Math.round(imgWidth * scale), 1);
            const scaledHeight = Math.max(Math.round(imgHeight * scale), 1);

            console.log('Final dimensions:', {
                scaledWidth,
                scaledHeight
            });

            // 设置画布尺寸
            [imageCanvas, maskCanvas].forEach(canvas => {
                canvas.width = scaledWidth;
                canvas.height = scaledHeight;
                canvas.style.width = `${scaledWidth}px`;
                canvas.style.height = `${scaledHeight}px`;
                canvas.style.position = 'absolute';
                canvas.style.left = '50%';
                canvas.style.top = '50%';
                canvas.style.transform = 'translate(-50%, -50%)';
                canvas.style.display = 'block';
            });

            // 立即重绘图像
            const ctx = imageCanvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                ctx.clearRect(0, 0, scaledWidth, scaledHeight);
                ctx.drawImage(this.currentImage!, 0, 0, scaledWidth, scaledHeight);
                console.log('Image drawn to canvas');
            }

            // 设置遮罩画布在图像画布上层
            maskCanvas.style.zIndex = '1';
            imageCanvas.style.zIndex = '0';

            // 更新容器高度以适应画布
            container.style.minHeight = `${scaledHeight + padding * 2}px`;
        }, 100);
    }

    private async processImage() {
        if (!this.currentImage || !this.model || !this.imageCanvas || !this.maskCanvas) {
            console.error('Missing required elements for image processing', {
                hasImage: !!this.currentImage,
                hasModel: !!this.model,
                hasImageCanvas: !!this.imageCanvas,
                hasMaskCanvas: !!this.maskCanvas
            });
            return;
        }

        try {
            this.showLoading('正在处理图片...');

            // 确保画布尺寸与图片一致
            this.imageCanvas.width = this.currentImage.width;
            this.imageCanvas.height = this.currentImage.height;
            this.maskCanvas.width = this.currentImage.width;
            this.maskCanvas.height = this.currentImage.height;

            // 在图像画布上绘制原始图片
            const imageCtx = this.imageCanvas.getContext('2d');
            if (!imageCtx) {
                throw new Error('Failed to get image canvas context');
            }
            imageCtx.drawImage(this.currentImage, 0, 0);

            // 在蒙版画布上创建透明背景
            const maskCtx = this.maskCanvas.getContext('2d');
            if (!maskCtx) {
                throw new Error('Failed to get mask canvas context');
            }
            maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);

            // 保存初始状态
            this.saveState();

            // 启用工具按钮
            this.enableTools();

            this.hideLoading();
        } catch (error) {
            console.error('Error processing image:', error);
            this.showError('图片处理失败');
            this.hideLoading();
        }
    }

    private enableTools() {
        if (!this.elements) return;

        // 启用所有工具按钮
        Object.values(this.elements).forEach(button => {
            if (button) button.disabled = false;
        });

        // 初始化画布事件监听
        if (this.maskCanvas) {
            this.maskCanvas.addEventListener('mousedown', this.startDrawing.bind(this));
            this.maskCanvas.addEventListener('mousemove', this.draw.bind(this));
            this.maskCanvas.addEventListener('mouseup', this.stopDrawing.bind(this));
            this.maskCanvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        }
    }

    private disableTools() {
        if (!this.elements) return;

        // 禁用所有工具按钮
        Object.values(this.elements).forEach(button => {
            if (button) {
                button.disabled = true;
                button.classList.remove('active');
            }
        });

        // 移除画布事件监听
        if (this.maskCanvas) {
            this.maskCanvas.removeEventListener('mousedown', this.startDrawing.bind(this));
            this.maskCanvas.removeEventListener('mousemove', this.draw.bind(this));
            this.maskCanvas.removeEventListener('mouseup', this.stopDrawing.bind(this));
            this.maskCanvas.removeEventListener('mouseleave', this.stopDrawing.bind(this));
        }
    }

    private startDrawing(e: MouseEvent) {
        this.isDrawing = true;
        this.draw(e);
    }

    private draw(e: MouseEvent) {
        if (!this.isDrawing || !this.maskCanvas) return;

        const rect = this.maskCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ctx = this.maskCanvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
        if (this.brushMode === 'brush') {
            ctx.fillStyle = 'rgba(87, 242, 135, 0.3)';
            ctx.fill();
        } else if (this.brushMode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    private stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    private saveState() {
        if (!this.maskCanvas) return;

        const ctx = this.maskCanvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        this.undoStack.push(imageData);
        this.redoStack = [];
        this.updateUndoRedoButtons();
    }

    private undo() {
        if (!this.maskCanvas || this.undoStack.length === 0) return;

        const ctx = this.maskCanvas.getContext('2d');
        if (!ctx) return;

        const currentState = ctx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        this.redoStack.push(currentState);

        const previousState = this.undoStack.pop();
        if (previousState) {
            ctx.putImageData(previousState, 0, 0);
        }

        this.updateUndoRedoButtons();
    }

    private redo() {
        if (!this.maskCanvas || this.redoStack.length === 0) return;

        const ctx = this.maskCanvas.getContext('2d');
        if (!ctx) return;

        const currentState = ctx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        this.undoStack.push(currentState);

        const nextState = this.redoStack.pop();
        if (nextState) {
            ctx.putImageData(nextState, 0, 0);
        }

        this.updateUndoRedoButtons();
    }

    private updateUndoRedoButtons() {
        const undoBtn = this.container?.querySelector('#undoBtn') as HTMLButtonElement;
        const redoBtn = this.container?.querySelector('#redoBtn') as HTMLButtonElement;

        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
        }
    }

    private enableBrushMode() {
        this.brushMode = 'brush';
    }

    private disableBrushMode() {
        this.brushMode = 'none';
    }

    private enableEraserMode() {
        this.brushMode = 'eraser';
    }

    private disableEraserMode() {
        this.brushMode = 'none';
    }

    private enablePreviewMode() {
        if (!this.canvasContainer || !this.imageCanvas || !this.maskCanvas) return;
        
        // 保存当前状态用于恢复
        const maskCtx = this.maskCanvas.getContext('2d');
        if (!maskCtx) return;
        
        const currentState = maskCtx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        this.undoStack.push(currentState);

        // 创建临时画布来处理预览效果
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.maskCanvas.width;
        tempCanvas.height = this.maskCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // 绘制原始图像
        tempCtx.drawImage(this.imageCanvas, 0, 0);
        
        // 获取原始图像数据
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const maskData = currentState;

        // 处理预览效果：未选中区域变透明
        for (let i = 0; i < maskData.data.length; i += 4) {
            if (maskData.data[i] === 0) { // 如果是蒙版区域
                imageData.data[i + 3] = Math.round(imageData.data[i + 3] * 0.3); // 未选中区域设为30%透明度
            }
        }

        // 应用预览效果
        tempCtx.putImageData(imageData, 0, 0);
        
        // 更新显示
        const ctx = this.imageCanvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
            ctx.drawImage(tempCanvas, 0, 0);
        }
        
        // 清除蒙版显示
        maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        
        // 添加预览模式类
        this.canvasContainer.classList.add('preview-mode');
    }

    private disablePreviewMode() {
        if (!this.canvasContainer || !this.imageCanvas || !this.maskCanvas) return;
        
        // 恢复原始图像
        const ctx = this.imageCanvas.getContext('2d');
        if (ctx && this.currentImage) {
            ctx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
            ctx.drawImage(this.currentImage, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
        }

        // 恢复蒙版状态
        if (this.undoStack.length > 0) {
            const previousState = this.undoStack.pop();
            if (previousState) {
                const maskCtx = this.maskCanvas.getContext('2d');
                if (maskCtx) {
                    maskCtx.putImageData(previousState, 0, 0);
                }
            }
        }

        // 移除预览模式类
        this.canvasContainer.classList.remove('preview-mode');
    }

    private downloadResult() {
        if (!this.imageCanvas || !this.maskCanvas) return;

        const canvas = document.createElement('canvas');
        canvas.width = this.imageCanvas.width;
        canvas.height = this.imageCanvas.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(this.imageCanvas, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const maskCtx = this.maskCanvas.getContext('2d');
        if (!maskCtx) return;

        const maskData = maskCtx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        
        for (let i = 0; i < maskData.data.length; i += 4) {
            if (maskData.data[i] === 0) {
                imageData.data[i + 3] = 0;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);

        const link = document.createElement('a') as HTMLAnchorElement;
        link.download = 'matting-result.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    private async enableMattingMode() {
        if (!this.elements || !this.elements.mattingBtn) {
            console.error('Matting button not initialized');
            return;
        }

        if (!this.currentImage || !this.model || !this.maskCanvas) {
            console.error('Required elements not initialized for matting', {
                hasImage: !!this.currentImage,
                hasModel: !!this.model,
                hasMaskCanvas: !!this.maskCanvas
            });
            return;
        }

        try {
            this.showLoading('正在处理图片...');
            this.currentMode = 'matting';
            this.elements.mattingBtn.classList.add('active');
            
            // 使用BodyPix进行图像分割
            const segmentation = await this.model.segmentPerson(this.currentImage, {
                flipHorizontal: false,
                internalResolution: 'medium',
                segmentationThreshold: 0.7
            });

            if (!segmentation || !this.maskCanvas) {
                throw new Error('Segmentation failed or mask canvas not available');
            }

            // 将分割结果绘制到mask画布上
            const maskCtx = this.maskCanvas.getContext('2d');
            if (!maskCtx) {
                throw new Error('Failed to get mask canvas context');
            }

            // 清除现有的mask
            maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);

            // 创建ImageData来绘制mask
            const imageData = maskCtx.createImageData(this.maskCanvas.width, this.maskCanvas.height);
            const data = imageData.data;
            
            // 将分割结果转换为mask
            for (let i = 0; i < segmentation.data.length; i++) {
                const j = i * 4;
                if (segmentation.data[i]) {
                    data[j] = 87;     // R
                    data[j + 1] = 242; // G
                    data[j + 2] = 135; // B
                    data[j + 3] = 76;  // A (30%)
                }
            }

            // 将mask绘制到画布上
            maskCtx.putImageData(imageData, 0, 0);
            
            // 保存初始状态用于撤销
            this.saveState();
            
            this.hideLoading();
        } catch (error) {
            console.error('Error in matting mode:', error);
            this.showError('抠图处理失败');
            this.disableMattingMode();
            this.hideLoading();
        }
    }

    private disableMattingMode() {
        if (!this.elements?.mattingBtn) return;
        
        this.currentMode = null;
        this.elements.mattingBtn.classList.remove('active');
        
        // 清除mask画布
        if (this.maskCanvas) {
            const ctx = this.maskCanvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
            }
        }
        
        console.log('禁用抠图模式');
    }
} 