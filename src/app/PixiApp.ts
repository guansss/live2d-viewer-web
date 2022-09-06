import { Filter } from '@/app/Filter';
import { Application } from '@pixi/app';
import { BatchRenderer, Renderer, extensions } from '@pixi/core';
import { Extract } from '@pixi/extract';
import { InteractionManager } from '@pixi/interaction';
import { TickerPlugin } from '@pixi/ticker';
import Stats from 'stats.js';

extensions.add(TickerPlugin, Extract, BatchRenderer, InteractionManager);

export class PixiApp extends Application {
    declare renderer: Renderer;

    constructor(stats: Stats) {
        super({
            view: document.getElementById('canvas') as HTMLCanvasElement,
            resizeTo: window,
            antialias: true,
            backgroundAlpha: 0,
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
