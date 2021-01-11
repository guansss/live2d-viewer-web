<template>
  <div class="model-editor" v-if="model">
    <v-list expand>
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

      <v-list-group>
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title>Motions</v-list-item-title>
          </v-list-item-content>
        </template>

        <template v-slot:default>
          <template v-for="motionGroup in motionGroups">
            <v-subheader :key="motionGroup.name" class="px-3">{{ motionGroup.name || '(Nameless)' }}</v-subheader>
            <v-list-item ripple v-for="(motion,i) in motionGroup.motions" :key="motionGroup.name+i"
                         :set="active=motionState.currentGroup===motionGroup.name&&motionState.currentIndex===i"
                         @click="startMotion(motionGroup,i)">
              <div v-if="active" class="motion-progress" :style="motionProgressStyle"></div>
              <v-list-item-content :title="motion.file">
                <v-list-item-title :class="{'primary--text':active}">
                  {{ motion.file.replace('.mtn', '').replace('.motion3.json', '') }}
                </v-list-item-title>
              </v-list-item-content>
              <v-list-item-icon class="my-0 align-self-center">
                <v-icon size="32" color="primary" v-if="active">mdi-play</v-icon>
                <v-progress-circular indeterminate size="20" v-else-if="(motionState.reservedGroup===motionGroup.name&&motionState.reservedIndex===i)
                    ||(motionState.reservedIdleGroup===motionGroup.name&&motionState.reservedIdleIndex===i)"></v-progress-circular>
              </v-list-item-icon>
            </v-list-item>
          </template>
        </template>
      </v-list-group>

      <v-list-group>
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title>Filters</v-list-item-title>
          </v-list-item-content>
        </template>

        <v-subheader class="mt-3 pl-3">Not working properly with Cubism 4</v-subheader>

        <v-checkbox v-for="filter in filters" v-model="model.filters" class="v-input--reverse mx-3 mt-0" :key="filter"
                    :label="filter+(index=>index?` [${index}]`:'')(model.filters.indexOf(filter)+1)"
                    :value="filter"></v-checkbox>
      </v-list-group>
    </v-list>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { ModelEntity } from '@/app/ModelEntity';
import { Live2DModel } from '@/app/Live2DModel';
import { MotionPriority, MotionState } from 'pixi-live2d-display';
import clamp from 'lodash/clamp';
import { App } from '@/app/App';
import { Filter } from '@/app/Filter';

interface MotionGroup {
    name: string
    motions: {
        file: string
    }[]
}

export default Vue.extend({
    name: "ModelEditor",
    props: {
        id: {
            type: Number,
            default: -1,
        },
    },
    data: () => ({
        model: null as ModelEntity | null | undefined,

        selectedMotionGroup: '',
        selectedMotionIndex: -1,

        motionGroups: [] as MotionGroup[],
        motionState: null as MotionState | null | undefined,

        motionProgressUpdateID: -1,
        motionProgressStyle: {
            transform: `translateX(-100%)`,
        },

        filters: Object.keys(Filter.filters),
    }),
    computed: {
        rotationDeg() {
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
    created() {
        this.motionProgressUpdateID = setInterval(this.updateMotionProgress.bind(this), 50);
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

                this.motionGroups = [];
                this.motionState = undefined;
                this.model = undefined;
            }
        },
        pixiModelLoaded(pixiModel: Live2DModel) {
            const motionGroups: MotionGroup[] = [];

            const definitions = pixiModel.internalModel.motionManager.definitions;

            for (const [group, motions] of Object.entries(definitions)) {
                motionGroups.push({
                    name: group,
                    motions: motions?.map(motion => ({
                        file: motion.file || motion.File || '',
                    })) || [],
                });
            }

            this.motionGroups = motionGroups;
            this.motionState = pixiModel.internalModel.motionManager.state;
        },
        startMotion(motionGroup: MotionGroup, index: number) {
            this.model!.pixiModel!.motion(motionGroup.name, index, MotionPriority.FORCE);
        },
        updateMotionProgress() {
            if (!this.model?.pixiModel) {
                return;
            }

            const startTime = this.model.pixiModel.currentMotionStartTime;
            const duration = this.model.pixiModel.currentMotionDuration;
            const progress = clamp((this.model.pixiModel.elapsedTime - startTime) / duration, 0, 1);

            this.motionProgressStyle.transform = `translateX(${(progress - 1) * 100}%)`;
        },
    },
    beforeDestroy() {
        this.resetModel();
        clearInterval(this.motionProgressUpdateID);
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
  background var(--v-primary-base)
  transform translateX(-100%)
</style>
