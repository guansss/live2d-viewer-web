<template>
  <v-slide-y-reverse-transition>
    <v-sheet v-if="show&&models.length" class="model-list" width="100%">
      <v-item-group mandatory class="flex-grow-1" :value="selectedIndex" @change="select">
        <transition-group class="model-group d-flex pa-1 pa-xl-2" name="move">
          <v-item v-for="(model,i) in models" :key="model.id" v-slot="{ active, toggle }">
            <v-card :color="model.error?'#631f1f':active?'grey darken-2':'grey darken-3'" class="ma-1 ma-xl-2" @click="toggle">
              <v-tooltip top :disabled="!model.error">
                <template v-slot:activator="{ on, attrs }">
                  <v-img :src="model.thumbnail" :width="model.error?paneHeight:model.aspectRatio*paneHeight" :height="paneHeight"
                         v-bind="attrs" v-on="on">
                    <template v-slot:placeholder>
                      <v-row class="fill-height ma-0" align="center" justify="center">
                        <v-progress-circular v-if="!model.error" indeterminate
                                             color="grey lighten-5"></v-progress-circular>
                        <v-icon v-else>mdi-alert-circle</v-icon>
                      </v-row>
                    </template>

                    <v-card-title class="ml-1 pa-0 flex-nowrap text-subtitle-2 text-xl-subtitle-1">
                      <span class="model-item-title text-truncate">{{ '#' + model.id + ' ' + model.name }}</span>
                      <v-spacer></v-spacer>
                      <v-btn icon v-if="active" @click.stop="remove(model.id)"><v-icon size="20">mdi-close</v-icon>
                      </v-btn>
                    </v-card-title>
                  </v-img>
                </template>
                {{ model.error }}
              </v-tooltip>
            </v-card>
          </v-item>
        </transition-group>
      </v-item-group>
    </v-sheet>
  </v-slide-y-reverse-transition>
</template>

<script lang="ts">
import Vue from 'vue';
import { ModelEntity } from '@/app/ModelEntity';
import { App } from '@/app/App';

export default Vue.extend({
    name: "ModelList",
    props: {
        value: Number,
        show: Boolean,
    },
    data: () => ({
        models: [] as ModelEntity[],
    }),
    computed: {
        paneHeight() {
            return this.$vuetify.breakpoint.xl ? 192 : 144;
        },
        selectedIndex() {
            return this.models.findIndex(model => model.id === this.value);
        },
    },
    created() {
        this.models = App.models;
    },
    methods: {
        select(index: number) {
            const id = this.models[index]?.id ?? 0;

            this.$emit('input', id);
        },
        remove(id: number) {
            if (this.models.length === 1) {
                this.$emit('input', 0);
            }

            App.removeModel(id);
        },
    },
});
</script>

<style scoped lang="stylus">
.model-list
  position relative
  background-color transparent !important
  pointer-events auto

  &:before
    content ''
    position absolute
    top 0
    right 0
    bottom 0
    left 0
    background-color rgba(0, 0, 0, .3)

.model-group
  overflow auto

.v-card
  pointer-events auto

.model-item-title
  line-height 36px

// animation

.move-move
  transition transform .2s
</style>
