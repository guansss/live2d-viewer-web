import { Live2DFactoryContext, Live2DModel as BaseLive2DModel } from 'pixi-live2d-display';
import { HitAreaFrames } from 'pixi-live2d-display/extra';
import { Sprite } from '@pixi/sprite';
import { Texture, Renderer } from '@pixi/core';
import { Ticker } from '@pixi/ticker';
import './patches';
import './zip';
import { Filter } from '@/app/Filter';

BaseLive2DModel.registerTicker(Ticker);

export class Live2DModel extends BaseLive2DModel {
    factoryContext!: Live2DFactoryContext;

    hitAreaFrames: HitAreaFrames;
    background: Sprite;

    backgroundVisible = false;

    currentMotionStartTime = performance.now();
    currentMotionDuration = 0;

    constructor() {
        super();

        this.hitAreaFrames = new HitAreaFrames();
        this.hitAreaFrames.visible = false;

        this.background = Sprite.from(Texture.WHITE);
        this.background.alpha = 0.2;
        this.background.visible = false;

        this.once('modelLoaded', this._init);
    }

    _init() {
        this.addChild(this.hitAreaFrames);
        this.addChild(this.background);

        this.background.width = this.internalModel.width;
        this.background.height = this.internalModel.height;

        this.anchor.set(0.5, 0.5);

        this.on('hit', this.startHitMotion);

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

        const expressionManager = this.internalModel.motionManager.expressionManager;

        if (expressionManager) {
            const originalStartMotion = (expressionManager as any)._setExpression;

            (expressionManager as any)._setExpression = (expression: any) => {
                originalStartMotion.call(expressionManager, expression);

                this.emit('expressionSet', expressionManager.expressions.indexOf(expression));
            };

            let reserveExpressionIndex = expressionManager.reserveExpressionIndex;

            Object.defineProperty(expressionManager, 'reserveExpressionIndex', {
                get: () => reserveExpressionIndex,
                set: (index: number) => {
                    reserveExpressionIndex = index;

                    this.emit('expressionReserved', index);
                },
            });
        }
    }

    startHitMotion(hitAreaNames: string[]) {
        for (let area of hitAreaNames) {
            area = area.toLowerCase();

            const possibleGroups = [area, 'tap' + area, 'tap_' + area, 'tap'];

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

    updateTransform() {
        super.updateTransform();

        // since the background's `visible` is always false, we need to manually update its transform
        if (this.backgroundVisible) {
            this.background.updateTransform();
        }
    }

    override _render(renderer: Renderer) {
        // render background before the model
        if (this.backgroundVisible) {
            this.background.visible = true;

            this.background.render(renderer);

            this.background.visible = false;
        }

        super._render(renderer);
    }

    destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }) {
        super.destroy(options);

        Filter.release(this);
    }
}
