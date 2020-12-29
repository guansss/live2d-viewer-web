import { Live2DModel } from '@/live2d/Live2DModel';
import { EventEmitter } from '@pixi/utils';
import { draggable } from '@/tools';

let uid = 0;

export class ModelEntity extends EventEmitter {
    id = uid++;
    url = '';

    thumbnail = '';

    name = 'New Model';
    visible = true;

    scaleX = 1;
    scaleY = 1;

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

        draggable(pixiModel);

        this.thumbnail = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mMU22h6EgADqAHHuWdgTgAAAABJRU5ErkJggg==';
    }

    fit(width: number, height: number) {
        if (this.pixiModel) {
            const scale = Math.min(width / this.pixiModel.width, height / this.pixiModel.height);

            this.pixiModel.scale.set(scale);
        }
    }

    scale(scaleX?: number, scaleY?: number) {
        scaleX = scaleX ?? this.scaleX;
        scaleY = scaleY ?? this.scaleY;
        this.scaleX = scaleX;
        this.scaleY = scaleY;

        if (this.pixiModel) {
            this.pixiModel.scale.set(scaleX, scaleY);
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
}
