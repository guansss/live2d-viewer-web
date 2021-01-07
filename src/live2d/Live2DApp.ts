import { ModelEntity } from '@/live2d/ModelEntity';
import { Application } from '@pixi/app';
import { Live2DModel } from '@/live2d/Live2DModel';
import { BatchRenderer, Renderer } from '@pixi/core';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import { InteractionManager } from '@pixi/interaction';
import { config } from 'pixi-live2d-display';
import { Extract } from '@pixi/extract';
import { settings } from '@pixi/settings';
import './patches';
import { splitFilesBySettingsFile } from '@/live2d/upload';

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
        });
        this.pixiApp.stage.interactive = true;
    }

    addModel(url: string): number {
        const model = new ModelEntity(url);

        this.initModel(model);
        this.models.push(model);

        return model.id;
    }

    addModels(files: File[]): void {
        const fileGroups = splitFilesBySettingsFile(files);

        for (const fileGroup of fileGroups) {
            const model = new ModelEntity(files);

            this.initModel(model);
            this.models.push(model);
        }
    }

    getModel(id: number) {
        return this.models.find(m => m.id === id);
    }

    private initModel(model: ModelEntity) {
        model.on('modelLoaded', (pixiModel: Live2DModel) => {
            if (!this.pixiApp.stage.children.includes(pixiModel)) {
                this.pixiApp.stage.addChild(pixiModel);

                pixiModel.position.set(this.pixiApp.renderer.width / 2, this.pixiApp.renderer.height / 2);
                model.fit(this.pixiApp.renderer.width, this.pixiApp.renderer.height);

                try {
                    model.thumbnail = this.createThumbnail(pixiModel);
                } catch (e) {
                    model.error = e.message;
                }
            }
        });
    }

    createThumbnail(pixiModel: Live2DModel): string {
        let dataURL: string | undefined;

        settings.RESOLUTION = 0.2;
        pixiModel.hitAreaFrames.visible = false;

        try {
            dataURL = this.pixiApp.renderer.extract.base64(pixiModel, 'image/webp', 0.01);
        } finally {
            settings.RESOLUTION = 1;
            pixiModel.hitAreaFrames.visible = true;
        }

        return dataURL;
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
