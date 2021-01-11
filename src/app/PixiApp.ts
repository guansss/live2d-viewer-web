import { Application } from '@pixi/app';
import { TickerPlugin } from '@pixi/ticker';
import { BatchRenderer, Renderer } from '@pixi/core';
import { Extract } from '@pixi/extract';
import { InteractionManager } from '@pixi/interaction';
import Stats from 'stats.js';
import { Filter } from '@/app/Filter';

Application.registerPlugin(TickerPlugin as any);

Renderer.registerPlugin('extract', Extract as any);
Renderer.registerPlugin('batch', BatchRenderer);
Renderer.registerPlugin('interaction', InteractionManager);

export class PixiApp extends Application {

    constructor(stats: Stats) {
        super({
            view: document.getElementById('canvas') as HTMLCanvasElement,
            resizeTo: window,
            antialias: true,
            transparent: true,
        });

        this.ticker.remove(this.render, this);

        this.ticker.add(() => {
            stats.begin();

            Filter.update(this.ticker.deltaMS);

            this.render();

            stats.end();
        });
    }
}
