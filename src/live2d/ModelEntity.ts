import { Live2DModel } from '@/live2d/Live2DModel';
import { EventEmitter } from '@pixi/utils';
import { draggable } from '@/tools/dragging';
import { settings } from '@pixi/settings';
import { Renderer } from '@pixi/core';

// 1x1 green image
const THUMBNAIL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mMU22h6EgADqAHHuWdgTgAAAABJRU5ErkJggg==';

let uid = 1;

export class ModelEntity extends EventEmitter {
    id = uid++;
    url = '';

    thumbnail = '';
    aspectRatio = 1;

    name = 'New Model';
    visible = true;

    private _scaleX = 1;
    private _scaleY = 1;
    private _rotation = 0;
    private _zIndex = 0;

    error = '';

    pixiModel?: Live2DModel;

    renderer: Renderer;

    constructor(source: string | File[], renderer: Renderer) {
        super();

        this.renderer = renderer;

        this.loadModel(source).then();
    }

    async loadModel(source: string | File[]) {
        if (typeof source === 'string') {
            this.url = source;
        } else {
            this.url = '(Local files)';
        }

        try {
            this.pixiModel = await Live2DModel.from(source);
        } catch (e) {
            console.warn(e);

            this.error = e instanceof Error ? e.message : e + '';
        }

        if (this.pixiModel) {
            this.initModel(this.pixiModel);
            this.emit('modelLoaded', this.pixiModel);
            this.initThumbnail(this.pixiModel);
        }
    }

    initModel(pixiModel: Live2DModel) {
        this.pixiModel = pixiModel;
        this.name = pixiModel.internalModel.settings.name;
        this.thumbnail = THUMBNAIL;
        this.aspectRatio = pixiModel.width / pixiModel.height;

        draggable(pixiModel);
    }

    initThumbnail(pixiModel: Live2DModel) {
        settings.RESOLUTION = 0.2;

        const hitAreaFramesVisible = pixiModel.hitAreaFrames.visible;
        const backgroundVisible = pixiModel.backgroundVisible;
        pixiModel.hitAreaFrames.visible = false;
        pixiModel.backgroundVisible = false;

        try {
            const canvas = this.renderer.extract.canvas(pixiModel);

            canvas.toBlob(blob => this.thumbnail = URL.createObjectURL(blob), 'image/webp', 0.01);
        } catch (e) {
            console.warn(e);
        }

        settings.RESOLUTION = 1;
        pixiModel.hitAreaFrames.visible = hitAreaFramesVisible;
        pixiModel.backgroundVisible = backgroundVisible;
    }

    fit(width: number, height: number) {
        if (this.pixiModel) {
            let scale = Math.min(width / this.pixiModel.width, height / this.pixiModel.height);

            scale = Math.round(scale * 10) / 10;

            this.scale(scale, scale);
        }
    }

    scale(scaleX?: number, scaleY?: number) {
        this._scaleX = scaleX ?? this._scaleX;
        this._scaleY = scaleY ?? this._scaleY;

        if (this.pixiModel) {
            this.pixiModel.scale.set(this._scaleX, this._scaleY);
        }
    }

    rotate(rotation: number) {
        this._rotation = rotation;

        if (this.pixiModel) {
            this.pixiModel.rotation = rotation;
        }
    }

    setZIndex(zIndex: number) {
        this._zIndex = zIndex;

        if (this.pixiModel) {
            this.pixiModel.zIndex = zIndex;
        }
    }

    setVisible(visible: boolean) {
        this.visible = visible;

        if (this.pixiModel) {
            this.pixiModel.visible = visible;
        }
    }

    destroy() {
        if (this.pixiModel) {
            this.pixiModel.destroy({ children: true });
            this.pixiModel = undefined;

            URL.revokeObjectURL(this.thumbnail);
        }
    }

    get zIndex(): number {
        return this._zIndex;
    }

    set zIndex(value: number) {
        this.setZIndex(value);
    }

    get rotation(): number {
        return this._rotation;
    }

    set rotation(value: number) {
        this.rotate(value);
    }

    get scaleY(): number {
        return this._scaleY;
    }

    set scaleY(value: number) {
        this.scale(undefined, value);
    }

    get scaleX(): number {
        return this._scaleX;
    }

    set scaleX(value: number) {
        this.scale(value, value);
    }
}
