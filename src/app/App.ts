import { ModelEntity } from './ModelEntity';
import { ExtendedFileList, SoundManager } from 'pixi-live2d-display';
import { save } from '@/utils/storage';
import Stats from 'stats.js';
import { PixiApp } from '@/app/PixiApp';
import { Live2DModel } from '@/app/Live2DModel';

const stats = new Stats();
stats.showPanel(0);
stats.dom.style.left = '';
stats.dom.style.right = '0';

export class App {
    static models: ModelEntity[] = [];

    static pixiApp = new PixiApp(stats);

    private static _volume = SoundManager.volume;
    private static _showHitAreaFrames = false;
    private static _showModelFrame = false;
    private static _showStats = true;

    static addModel(source: string | ExtendedFileList): number {
        const model = new ModelEntity(source, this.pixiApp.renderer);

        this.initModel(model);
        this.models.push(model);

        return model.id;
    }

    static getModel(id: number) {
        return this.models.find(m => m.id === id);
    }

    private static initModel(model: ModelEntity) {
        model.on('modelLoaded', async (pixiModel: Live2DModel) => {
            if (!this.pixiApp.stage.children.includes(pixiModel)) {
                this.pixiApp.stage.addChild(pixiModel);

                pixiModel.backgroundVisible = this.showModelFrame;
                pixiModel.hitAreaFrames.visible = this.showHitAreaFrames;
                pixiModel.position.set(this.pixiApp.renderer.width / 2, this.pixiApp.renderer.height / 2);

                model.fit(this.pixiApp.renderer.width, this.pixiApp.renderer.height);
                model.initThumbnail(this.pixiApp.renderer);
            }
        });
    }

    static removeModel(id: number) {
        const model = this.models.find(model => model.id === id);

        if (model) {
            this.models.splice(this.models.indexOf(model), 1);

            if (model.pixiModel) {
                this.pixiApp.stage.removeChild(model.pixiModel);
            }

            model.destroy();
        }
    }

    @save('stats')
    static set showStats(value: boolean) {
        this._showStats = value;

        if (value) {
            document.body.appendChild(stats.dom);
        } else {
            stats.dom.parentElement?.removeChild(stats.dom);
        }
    }

    static get showStats(): boolean {
        return this._showStats;
    }

    @save('volume')
    static set volume(value: number) {
        this._volume = value;
        SoundManager.volume = value;
    }

    static get volume(): number {
        return this._volume;
    }

    @save('modelFrame')
    static set showModelFrame(value: boolean) {
        this._showModelFrame = value;

        for (const model of this.models) {
            if (model?.pixiModel) {
                model.pixiModel.backgroundVisible = value;
            }
        }
    }

    static get showModelFrame(): boolean {
        return this._showModelFrame;
    }

    @save('hitAreaFrames')
    static set showHitAreaFrames(value: boolean) {
        this._showHitAreaFrames = value;

        for (const model of this.models) {
            if (model?.pixiModel) {
                model.pixiModel.hitAreaFrames.visible = value;
            }
        }
    }

    static get showHitAreaFrames(): boolean {
        return this._showHitAreaFrames;
    }
}
