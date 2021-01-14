import { PixelateFilter } from '@pixi/filter-pixelate';
import { OutlineFilter } from '@pixi/filter-outline';
import { AsciiFilter } from '@pixi/filter-ascii';
import { AlphaFilter } from '@pixi/filter-alpha';
import { CRTFilter } from '@pixi/filter-crt';
import { NoiseFilter } from '@pixi/filter-noise';
import { DisplayObject } from '@pixi/display';

export namespace Filter {
    export const filters = {
        Outline: new OutlineFilter(4),
        Pixelate: new PixelateFilter(4),
        CRT: new CRTFilter({
            lineWidth: 3,
            lineContrast: 0.3,
            vignetting: 0,
        }),
        Noise: new NoiseFilter(0.4),
        Ascii: new AsciiFilter(),
        Alpha: new AlphaFilter(0.7),
    };

    export function set(target: DisplayObject, filterNames: (keyof typeof filters)[]) {
        target.filters = [];

        for (const name of filterNames) {
            target.filters.push(filters[name]);
        }
    }

    export function update(dt: number) {
        filters.Noise.seed = Math.random();
        filters.CRT.seed = Math.random();
        filters.CRT.time += dt * 0.01;
    }

    export function release(target: DisplayObject) {
        target.filters = [];
    }
}
