import { Live2DModel } from '@/live2d/Live2DModel';
import { EventEmitter } from '@pixi/utils';
import { draggable } from '@/tools';

const THUMBNAIL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mMU22h6EgADqAHHuWdgTgAAAABJRU5ErkJggg==';

let uid = 0;

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

    constructor(url: string) {
        super();

        this.url = url;

        Live2DModel.from(url)
            .then(model => {
                this.initModel(model);
                this.emit('modelLoaded', model);
            })
            .catch(e => {
                this.error = e instanceof Error ? e.message : e + '';
            });
    }

    initModel(pixiModel: Live2DModel) {
        this.pixiModel = pixiModel;
        this.name = pixiModel.internalModel.settings.name;
        this.thumbnail = THUMBNAIL;
        this.aspectRatio = pixiModel.width / pixiModel.height;

        draggable(pixiModel);
    }

    fit(width: number, height: number) {
        if (this.pixiModel) {
            const scale = Math.min(width / this.pixiModel.width, height / this.pixiModel.height);

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
