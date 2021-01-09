import { ModelEntity } from '@/live2d/ModelEntity';
import { Application } from '@pixi/app';
import { Live2DModel } from '@/live2d/Live2DModel';
import { BatchRenderer, Renderer } from '@pixi/core';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import { InteractionManager } from '@pixi/interaction';
import { config, ExtendedFileList } from 'pixi-live2d-display';
import { Extract } from '@pixi/extract';
import './patches';
import './zip';

Application.registerPlugin(TickerPlugin as any);
Live2DModel.registerTicker(Ticker);

Renderer.registerPlugin('extract', Extract as any);
Renderer.registerPlugin('batch', BatchRenderer);
Renderer.registerPlugin('interaction', InteractionManager);

config.logLevel = config.LOG_LEVEL_VERBOSE;

export class Live2DApp {
    readonly models: ModelEntity[] = [];

    pixiApp: Application;

    constructor(canvas: HTMLCanvasElement) {
        this.pixiApp = new Application({
            view: canvas,
            resizeTo: window,
            antialias: true,
        });
        this.pixiApp.stage.interactive = true;
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
}
