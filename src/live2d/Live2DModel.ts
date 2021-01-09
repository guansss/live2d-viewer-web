import { Live2DModel as _Live2DModel } from 'pixi-live2d-display';
import { HitAreaFrames } from 'pixi-live2d-display/src/tools/HitAreaFrames';

export class Live2DModel extends _Live2DModel {
    hitAreaFrames: HitAreaFrames;

    currentMotionStartTime = performance.now();
    currentMotionDuration = 0;

    constructor() {
        super();

        this.hitAreaFrames = new HitAreaFrames();

        this.once('modelLoaded', this._init);
    }

    _init() {
        this.addChild(this.hitAreaFrames);

        this.anchor.set(0.5, 0.5);

        this.on('hit', this.startHitMotion);

        // TODO: remove this when upgrading pixi-live2d-display to beta.3
        (this.internalModel.motionManager as any).queueManager.setEventCallback?.(
            (caller: any, eventValue: string) => {
                this.emit('motion:' + eventValue);
            },
        );

        this.internalModel.motionManager.on('motionStart', (group: string, index: number) => {
            this.currentMotionStartTime = this.elapsedTime;
            this.currentMotionDuration = 0;

            const motion = this.internalModel.motionManager.motionGroups[group]?.[index];

            if (motion) {
                if ('_loopDurationSeconds' in motion) {
                    this.currentMotionDuration = motion._loopDurationSeconds * 1000;
                } else if ('getDurationMSec' in motion) {
                    this.currentMotionDuration = motion.getDurationMSec();
                }
            }
        });
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
