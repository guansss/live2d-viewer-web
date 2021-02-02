<template>
  <div class="settings pa-3 flex-column flex-grow-1">
    <div>
      <v-slider dense class="mt-4 mb-10" prepend-icon="mdi-volume-high" v-model="volume" :messages="~~(volume*100)+'%'"
                min="0" max="1" step="0.02"></v-slider>

      <v-switch class="v-input--reverse" v-model="hitAreaFrames" label="Show hit area frames"></v-switch>
      <v-switch class="v-input--reverse" v-model="modelFrame" label="Show model frames"></v-switch>
      <v-switch class="v-input--reverse" v-model="stats" label="Show stats"></v-switch>

      <template v-if="currentBackground">
        <v-divider></v-divider>
        <v-subheader class="px-0">Background</v-subheader>
        <div class="mt-2 d-flex align-center">
          <span>{{ currentBackground }}</span>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="resetBackground">Reset</v-btn>
        </div>
      </template>
    </div>

    <v-spacer></v-spacer>
    <v-divider></v-divider>
    <div class="pt-4 d-flex align-center">
      <v-icon class="mr-2">mdi-github</v-icon>
      <span>View source or report bugs on <a href="https://github.com/guansss/live2d-viewer-web"
                              class="text-decoration-none">GitHub</a></span></div>

    <span class="pt-4 body-2 text--secondary">Last built: {{ lastUpdated }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Background } from '@/tools/Background';
import { App } from '@/app/App';

export default Vue.extend({
    name: "Settings",
    data: () => ({
        volume: 0,
        hitAreaFrames: false,
        modelFrame: false,
        stats: false,
        lastUpdated: new Date(__BUILD_TIME__).toLocaleString(),
        currentBackground: Background.current,
    }),
    watch: {
        stats(value: boolean) {
            App.showStats = value;
        },
        volume(value: number) {
            App.volume = value;
        },
        hitAreaFrames(value: boolean) {
            App.showHitAreaFrames = value;
        },
        modelFrame(value: boolean) {
            App.showModelFrame = value;
        },
    },
    created() {
        this.stats = App.showStats;
        this.volume = App.volume;
        this.hitAreaFrames = App.showHitAreaFrames;
        this.modelFrame = App.showModelFrame;

        Background.emitter.on('change', this.backgroundChanged, this);
    },
    methods: {
        resetBackground() {
            Background.reset();
        },
        backgroundChanged(background: string) {
            this.currentBackground = background;
        },
    },
    beforeDestroy() {
        Background.emitter.off('change', this.backgroundChanged);
    },
});
</script>

<style scoped lang="stylus">
.settings
  display flex
</style>
