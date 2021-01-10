import { ModelEntity } from '@/live2d/ModelEntity';
import { Application } from '@pixi/app';
import { Live2DModel } from '@/live2d/Live2DModel';
import { BatchRenderer, Renderer } from '@pixi/core';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import { InteractionManager } from '@pixi/interaction';
import { config, ExtendedFileList, SoundManager } from 'pixi-live2d-display';
import { Extract } from '@pixi/extract';
import './patches';
import './zip';
import { load, save } from '@/tools/storage';
import Stats from 'stats.js';

const stats = new Stats();
stats.showPanel(0);
stats.dom.style.left = '';
stats.dom.style.right = '0';

Application.registerPlugin(TickerPlugin as any);
Live2DModel.registerTicker(Ticker);

Renderer.registerPlugin('extract', Extract as any);
Renderer.registerPlugin('batch', BatchRenderer);
Renderer.registerPlugin('interaction', InteractionManager);

config.logLevel = config.LOG_LEVEL_VERBOSE;

export class Live2DApp {
    readonly models: ModelEntity[] = [];

    pixiApp: Application;

    private _volume = load('volume', 0.5);
    private _showHitAreaFrames = load('hitAreaFrames', true);
    private _showModelFrame = load('modelFrame', false);
    private _showStats = load('stats', true);

    constructor(canvas: HTMLCanvasElement) {
        this.pixiApp = new Application({
            view: canvas,
            resizeTo: window,
            antialias: true,
            transparent: true,
            autoStart: false,
        });
        this.pixiApp.stage.interactive = true;

        this.pixiApp.ticker.add(() => {
            stats.begin();
            this.pixiApp.render();
            stats.end();
        });

        this.pixiApp.start();

        // trigger the setters
        this.showStats = this.showStats;
        this.volume = this.volume;
    }

    addModel(source: string | ExtendedFileList): number {
        const model = new ModelEntity(source, this.pixiApp.renderer);

        this.initModel(model);
        this.models.push(model);

        return model.id;
    }

    getModel(id: number) {
        return this.models.find(m => m.id === id);
    }

    private initModel(model: ModelEntity) {
        model.on('modelLoaded', async (pixiModel: Live2DModel) => {
            if (!this.pixiApp.stage.children.includes(pixiModel)) {
                this.pixiApp.stage.addChild(pixiModel);

                pixiModel.backgroundVisible = this.showModelFrame;
                pixiModel.hitAreaFrames.visible = this.showHitAreaFrames;
                pixiModel.position.set(this.pixiApp.renderer.width / 2, this.pixiApp.renderer.height / 2);

                model.fit(this.pixiApp.renderer.width, this.pixiApp.renderer.height);
            }
        });
    }

    removeModel(id: number) {
        const model = this.models.find(model => model.id === id);

        if (model) {
            this.models.splice(this.models.indexOf(model), 1);

            if (model.pixiModel) {
                this.pixiApp.stage.removeChild(model.pixiModel);
            }

            model.destroy();
        }
    }

    get showStats(): boolean {
        return this._showStats;
    }

    set showStats(value: boolean) {
        this._showStats = value;

        if (value) {
            document.body.appendChild(stats.dom);
        } else {
            stats.dom.parentElement?.removeChild(stats.dom);
        }

        save('stats', value);
    }

    get volume(): number {
        return this._volume;
    }

    set volume(value: number) {
        this._volume = value;
        SoundManager.volume = value;
        save('volume', value);
    }

    set showModelFrame(value: boolean) {
        this._showModelFrame = value;

        for (const model of this.models) {
            if (model?.pixiModel) {
                model.pixiModel.backgroundVisible = value;
            }
        }

        save('modelFrame', value);
    }

    get showModelFrame(): boolean {
        return this._showModelFrame;
    }

    set showHitAreaFrames(value: boolean) {
        this._showHitAreaFrames = value;

        for (const model of this.models) {
            if (model?.pixiModel) {
                model.pixiModel.hitAreaFrames.visible = value;
            }
        }

        save('hitAreaFrames', value);
    }

    get showHitAreaFrames(): boolean {
        return this._showHitAreaFrames;
    }
}
