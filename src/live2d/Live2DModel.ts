import { Live2DModel as _Live2DModel } from 'pixi-live2d-display';
import { HitAreaFrames } from 'pixi-live2d-display/src/tools/HitAreaFrames';
import { createSettingsJSON } from '@/live2d/patches';

async function createFrom(url: string): Promise<Live2DModel> {
    const json = await createSettingsJSON(url);

    return _Live2DModel.from.call(Live2DModel, json) as Promise<Live2DModel>;
}

export class Live2DModel extends _Live2DModel {

}

Live2DModel.from = createFrom as any;
