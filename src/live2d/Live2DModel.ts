import { Live2DModel as _Live2DModel } from 'pixi-live2d-display';
import { HitAreaFrames } from 'pixi-live2d-display/src/tools/HitAreaFrames';

export class Live2DModel extends _Live2DModel {
    hitAreaFrames!: HitAreaFrames;

    constructor() {
        super();

        this.once('modelLoaded', this._init);
    }

    _init() {
        this.hitAreaFrames = new HitAreaFrames();
        this.addChild(this.hitAreaFrames);

        this.anchor.set(0.5, 0.5);

        this.on('hit', this.startHitMotion);

        // TODO: remove this when upgrading pixi-live2d-display to beta.3
        (this.internalModel.motionManager as any).queueManager.setEventCallback?.(
            (caller: any, eventValue: string) => {
                this.emit('motion:' + eventValue);
            },
        );
    }

    startHitMotion(hitAreaNames: string[]) {
        for (let area of hitAreaNames) {
            area = area.toLowerCase();

            const possibleGroups = [
                area,
                'tap' + area,
                'tap_' + area,
                'tap',
            ];

            for (const possibleGroup of possibleGroups) {
                for (let group of Object.keys(this.internalModel.motionManager.definitions)) {
                    if (possibleGroup === group.toLowerCase()) {
                        this.motion(group);
                        return;
                    }
                }
            }
        }
    }
}
