<template>
  <div class="model-editor" v-if="model">
    <div class="pa-2 d-flex align-center">
      <div class="text-h4">{{ '#' + model.id }}</div>
    </div>
    <div class="pa-2 text-h5">{{ model.name }}</div>

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
                         @click="startMotion(motionGroup,i)">
              <v-list-item-content>
                <v-list-item-title
                    :class="{'primary--text':motionState.currentGroup===motionGroup.name&&motionState.currentIndex===i}">
                  {{ motion.file }}
                </v-list-item-title>
              </v-list-item-content>
              <v-list-item-icon class="my-0 align-self-center">
                <v-icon size="32" color="primary"
                        v-if="motionState.currentGroup===motionGroup.name&&motionState.currentIndex===i">mdi-play</v-icon>
                <v-progress-circular indeterminate size="20" v-else-if="(motionState.reservedGroup===motionGroup.name&&motionState.reservedIndex===i)
                    ||(motionState.reservedIdleGroup===motionGroup.name&&motionState.reservedIdleIndex===i)"></v-progress-circular>
              </v-list-item-icon>
            </v-list-item>
          </template>
        </template>
      </v-list-group>
    </v-list>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { ModelEntity } from '@/live2d/ModelEntity';
import { Live2DModel } from '@/live2d/Live2DModel';
import { MotionPriority, MotionState } from 'pixi-live2d-display';

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

        activeMotionIndex: -1,
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
        scaleX(scaleX: number) {
            this.model!.scale(scaleX, scaleX);
        },
        rotation(rotation: number) {
            this.model!.rotate(rotation);
        },
    },
    methods: {
        updateModel() {
            this.resetModel();

            this.model = this.$live2dApp.getModel(this.id);

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
            }
        },
        pixiModelLoaded(pixiModel: Live2DModel) {
            const motionGroups: MotionGroup[] = [];

            const definitions = pixiModel.internalModel.motionManager.definitions;

            for (const [group, motions] of Object.entries(definitions)) {
                motionGroups.push({
                    name: group,
                    motions: motions?.map(motion => ({
                        file: motion.file || motion.File,
                    })) || [],
                });
            }

            this.motionGroups = motionGroups;
            this.motionState = pixiModel.internalModel.motionManager.state;
        },
        startMotion(motionGroup: MotionGroup, index: number) {
            this.model!.pixiModel!.motion(motionGroup.name, index, MotionPriority.FORCE);
        },
    },
});
</script>

<style scoped lang="stylus">
>>> .v-list-item
  padding 0 12px !important
</style>
