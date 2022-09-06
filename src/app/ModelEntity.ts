import { Live2DModel } from './Live2DModel';
import { EventEmitter } from '@pixi/utils';
import { draggable } from '@/tools/dragging';
import { settings } from '@pixi/settings';
import { Renderer } from '@pixi/core';
import { Extract } from '@pixi/extract';
import { Filter } from '@/app/Filter';
import { ModelLoadingState } from './ModelLoadingState';
import { Live2DFactory } from 'pixi-live2d-display';

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

    filters: (keyof typeof Filter.filters)[] = [];

    loadingState = new ModelLoadingState();

    error = '';

    pixiModel?: Live2DModel;

    constructor(source: string | File[], renderer: Renderer) {
        super();

        this.loadModel(source).then();
    }

    async loadModel(source: string | File[]) {
        if (typeof source === 'string') {
            this.url = source;
        } else {
            this.url = '(Local files)';
        }

        // don't use Live2DModel.fromSync() because when loading from local files,
        // the "settingsJSONLoaded" and "settingsLoaded" events will be emitted before
        // we're able to listen to the Live2DModel instance
        // TODO: (plugin) improve model creation?
        const pixiModel = new Live2DModel();

        this.loadingState.watch(pixiModel);

        try {
            await Live2DFactory.setupLive2DModel(pixiModel, source);

            this.modelLoaded(pixiModel);
            this.emit('modelLoaded', pixiModel);
        } catch (e) {
            console.warn(e);

            this.error = e instanceof Error ? e.message : e + '';
        }
    }

    modelLoaded(pixiModel: Live2DModel) {
        this.pixiModel = pixiModel;
        this.name = pixiModel.internalModel.settings.name;
        this.thumbnail = THUMBNAIL;
        this.aspectRatio = pixiModel.width / pixiModel.height;

        this.updateFilters();

        draggable(pixiModel);
    }

    initThumbnail(renderer: Renderer) {
        const pixiModel = this.pixiModel!;
        settings.RESOLUTION = 0.2;

        const hitAreaFramesVisible = pixiModel.hitAreaFrames.visible;
        const backgroundVisible = pixiModel.backgroundVisible;
        pixiModel.hitAreaFrames.visible = false;
        pixiModel.backgroundVisible = false;

        try {
            const canvas = (renderer.plugins.extract as Extract).canvas(pixiModel);

            canvas.toBlob(blob => this.thumbnail = URL.createObjectURL(blob!), 'image/webp', 0.01);
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

    updateFilters() {
        if (this.pixiModel) {
            Filter.set(this.pixiModel, this.filters);
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
