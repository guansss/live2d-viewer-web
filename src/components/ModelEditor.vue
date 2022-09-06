<template>
  <div class="model-editor" v-if="model">
    <v-list expand v-if="hasPixiModel">
      <v-list-group :value="true">
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title>Display</v-list-item-title>
          </v-list-item-content>
        </template>

        <v-list-item>
          <v-list-item-content>
            <div>
              <v-slider dense class="mt-2" prepend-icon="mdi-magnify" v-model="model.scaleX"
                  :messages="String(model.scaleX)" min="0.01" max="3" step="0.01"></v-slider>
              <v-slider dense class="mt-2" prepend-icon="mdi-rotate-right" v-model="model.rotation"
                  :messages="rotationDeg" min="0" max="6.28" step="0.01"></v-slider>
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-list-group>

      <v-list-group :data-set="motionCount=motionGroups.reduce((sum, { motions }) => sum + motions.length, 0)"
          :disabled="!motionCount" v-model="motionExpand">
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title :class="{'text--secondary':!motionCount}">Motions ({{ motionCount }})
            </v-list-item-title>
          </v-list-item-content>
        </template>

        <template v-slot:default>
          <template v-for="motionGroup in motionGroups">
            <v-subheader :key="motionGroup.name" class="px-3">{{ motionGroup.name || '(Nameless)' }}</v-subheader>
            <v-list-item ripple v-for="(motion,i) in motionGroup.motions" :key="motionGroup.name+i"
                :data-set="active=motionState.currentGroup===motionGroup.name&&motionState.currentIndex===i"
                :disabled="!!motion.error" @click="startMotion(motionGroup,i)">
              <div v-if="active" class="motion-progress"></div>
              <v-list-item-content :title="motion.file">
                <v-list-item-title :class="{'primary--text':active,'text-decoration-line-through':motion.error}">
                  {{ motion.file.replace('.mtn', '').replace('.motion3.json', '') }}
                </v-list-item-title>
              </v-list-item-content>
              <v-list-item-icon class="my-0 align-self-center">
                <v-icon size="32" color="primary" v-if="active">mdi-play</v-icon>
                <v-progress-circular indeterminate size="20" width="2" v-else-if="(motionState.reservedGroup===motionGroup.name&&motionState.reservedIndex===i)
                    ||(motionState.reservedIdleGroup===motionGroup.name&&motionState.reservedIdleIndex===i)" />
              </v-list-item-icon>
            </v-list-item>
          </template>
        </template>
      </v-list-group>

      <v-list-group :disabled="!expressions.length">
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title :class="{'text--secondary':!expressions.length}">Expressions ({{ expressions.length }})
            </v-list-item-title>
          </v-list-item-content>
        </template>

        <template v-slot:default>
          <v-list-item ripple
              v-for="(expression,i) in expressions"
              :key="i"
              :data-set="active=currentExpressionIndex===i"
              :disabled="!!expression.error"
              @click="setExpression(i)">
            <v-list-item-content :title="expression.file">
              <v-list-item-title :class="{'primary--text':active,'text-decoration-line-through':expression.error}">
                {{ expression.file.replace('.exp.json', '').replace('.exp3.json', '') }}
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-icon class="my-0 align-self-center">
              <v-icon size="28" color="primary" v-if="active">mdi-emoticon-outline</v-icon>
              <v-progress-circular indeterminate size="20" width="2" v-else-if="pendingExpressionIndex===i" />
            </v-list-item-icon>
          </v-list-item>
        </template>
      </v-list-group>

      <v-list-group>
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title>Filters</v-list-item-title>
          </v-list-item-content>
        </template>

        <div class="mt-3"></div>

        <v-checkbox v-for="filter in filters" v-model="model.filters" class="v-input--reverse mx-3 mt-0" :key="filter"
            :label="filter+(index=>index?` [${index}]`:'')(model.filters.indexOf(filter)+1)"
            :value="filter"></v-checkbox>
      </v-list-group>
    </v-list>
    <template v-else>
      <pre class="pa-3 text--secondary">{{ model.loadingState.text }}</pre>
      <pre v-if="model.error" class="error--text px-3 text-wrap">{{ model.error }}</pre>
    </template>
  </div>
</template>

<script lang="ts">
import { App } from '@/app/App';
import { Filter } from '@/app/Filter';
import { Live2DModel } from '@/app/Live2DModel';
import { ModelEntity } from '@/app/ModelEntity';
import { clamp } from 'lodash-es';
import { MotionPriority, MotionState } from 'pixi-live2d-display';
import Vue from 'vue';

interface MotionGroupEntry {
    name: string
    motions: {
        file: string;
        error?: any;
    }[]
}

interface ExpressionEntry {
    file: string;
    error?: any;
}

export default Vue.extend({
    name: 'ModelEditor',
    props: {
        id: {
            type: Number,
            default: 0,
        },
        visible: Boolean,
    },
    data: () => ({
        model: null as ModelEntity | null | undefined,

        motionExpand: false,
        motionGroups: [] as MotionGroupEntry[],
        motionState: null as MotionState | null | undefined,

        motionProgressTimerID: -1,

        expressions: [] as ExpressionEntry[],
        currentExpressionIndex: -1,
        pendingExpressionIndex: -1,

        filters: Object.keys(Filter.filters),
    }),
    computed: {
        hasPixiModel(): boolean {
            return !!this.motionState;
        },
        rotationDeg(): string {
            return Math.round((this.model?.rotation || 0) / Math.PI * 180) + '°';
        },
    },
    watch: {
        id: {
            immediate: true,
            handler() {
                this.updateModel();
            },
        },
        'model.filters'() {
            this.model?.updateFilters();
        },

        // immediately update progress when current motion has changed
        'motionState.currentGroup': 'updateMotionProgress',
    },
    mounted() {
        this.motionProgressTimerID = setInterval(this.updateMotionProgress, 50);
    },
    methods: {
        updateModel() {
            this.resetModel();

            this.model = App.getModel(this.id);

            if (this.model) {
                if (this.model.pixiModel) {
                    this.pixiModelLoaded(this.model.pixiModel);
                } else {
                    this.model.once('modelLoaded', this.pixiModelLoaded);
                }
            }
        },
        resetModel() {
            if (this.model) {
                this.model.off('modelLoaded', this.pixiModelLoaded);
                this.model.pixiModel?.off('expressionSet', this.expressionSet);
                this.model.pixiModel?.off('expressionReserved', this.expressionReserved);
                this.model.pixiModel?.internalModel.motionManager?.off('motionLoadError', this.motionLoadError);
                this.model.pixiModel?.internalModel.motionManager?.expressionManager?.off('expressionLoadError', this.expressionLoadError);

                this.motionGroups = [];
                this.motionState = undefined;
                this.model = undefined;
            }
        },
        pixiModelLoaded(pixiModel: Live2DModel) {
            const motionManager = pixiModel.internalModel.motionManager;
            const motionGroups: MotionGroupEntry[] = [];

            const definitions = motionManager.definitions;

            for (const [group, motions] of Object.entries(definitions)) {
                motionGroups.push({
                    name: group,
                    motions: motions?.map((motion, index) => ({
                        file: motion.file || motion.File || '',
                        error: motionManager.motionGroups[group]![index]! === null ? 'Failed to load' : undefined,
                    })) || [],
                });
            }

            this.motionGroups = motionGroups;
            this.motionState = motionManager.state;

            const expressionManager = motionManager.expressionManager;
            this.expressions = expressionManager?.definitions.map((expression, index) => ({
                file: expression.file || expression.File || '',
                error: expressionManager!.expressions[index]! === null ? 'Failed to load' : undefined,
            })) || [];

            this.currentExpressionIndex = expressionManager?.expressions.indexOf(expressionManager!.currentExpression) ?? -1;
            this.pendingExpressionIndex = expressionManager?.reserveExpressionIndex ?? -1;

            pixiModel.on('expressionSet', this.expressionSet);
            pixiModel.on('expressionReserved', this.expressionReserved);
            motionManager.on('motionLoadError', this.motionLoadError);
            expressionManager?.on('expressionLoadError', this.expressionLoadError);
        },
        expressionSet(index: number) {
            this.currentExpressionIndex = index;
        },
        expressionReserved(index: number) {
            this.pendingExpressionIndex = index;
        },
        motionLoadError(group: string, index: number, error: any) {
            const motionGroup = this.motionGroups.find(motionGroup => motionGroup.name === group);

            if (motionGroup) {
                motionGroup.motions[index]!.error = error;
            }
        },
        expressionLoadError(index: number, error: any) {
            this.expressions[index]!.error = error;
        },
        startMotion(motionGroup: MotionGroupEntry, index: number) {
            this.model?.pixiModel?.motion(motionGroup.name, index, MotionPriority.FORCE);
        },
        setExpression(index: number) {
            this.model?.pixiModel?.expression(index);
        },
        updateMotionProgress() {
            if (!(this.model?.pixiModel && this.motionState?.currentGroup !== undefined && this.motionExpand && this.visible && this.$el)) {
                return;
            }

            const startTime = this.model.pixiModel.currentMotionStartTime;
            const duration = this.model.pixiModel.currentMotionDuration;
            const progress = clamp((this.model.pixiModel.elapsedTime - startTime) / duration, 0, 1);

            // using a CSS variable can be a lot faster than letting Vue update a style object bound to the element
            // since that will cause the component to re-render
            (this.$el as HTMLElement).style.setProperty('--progress', progress * 100 + '%');
        },
    },
    beforeDestroy() {
        this.resetModel();
        clearInterval(this.motionProgressTimerID);
    },
});
</script>

<style scoped lang="stylus">
>>> .v-list-item
    padding 0 12px !important

.motion-progress
    position absolute
    z-index -1
    top 0
    bottom 0
    left 0
    right 0
    opacity .24
    background linear-gradient(var(--v-primary-base), var(--v-primary-base)) no-repeat
    background-size var(--progress, 0) auto
</style>
