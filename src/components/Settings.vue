<template>
  <div class="settings pa-3 flex-column flex-grow-1">
    <div>
      <v-slider dense class="mt-4 mb-10" prepend-icon="mdi-volume-high" v-model="volume" :messages="~~(volume*100)+'%'"
                min="0" max="1" step="0.02"></v-slider>

      <v-switch class="v-input--reverse" v-model="hitAreaFrames" label="Show hit area frames"></v-switch>
      <v-switch class="v-input--reverse" v-model="modelFrame" label="Show model frames"></v-switch>
      <v-switch class="v-input--reverse" v-model="stats" label="Show stats"></v-switch>
    </div>

    <v-spacer></v-spacer>
    <v-divider></v-divider>
    <div class="pt-4 d-flex align-center">
      <v-icon class="mr-2">mdi-github</v-icon>
      <span>View source on <a href="https://github.com/guansss/live2d-viewer-web"
                              class="text-decoration-none">GitHub</a></span></div>

    <span class="pt-4 body-2 text--secondary">Last updated: {{ lastUpdated }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    name: "Settings",
    data: () => ({
        volume: 0,
        hitAreaFrames: false,
        modelFrame: false,
        stats: false,
        lastUpdated: new Date(__BUILD_TIME__).toLocaleString(),
    }),
    watch: {
        stats(value: boolean) {
            this.$live2dApp.showStats = value;
        },
        volume(value: number) {
            this.$live2dApp.volume = value;
        },
        hitAreaFrames(value: boolean) {
            this.$live2dApp.showHitAreaFrames = value;
        },
        modelFrame(value: boolean) {
            this.$live2dApp.showModelFrame = value;
        },
    },
    created() {
        this.stats = this.$live2dApp.showStats;
        this.volume = this.$live2dApp.volume;
        this.hitAreaFrames = this.$live2dApp.showHitAreaFrames;
        this.modelFrame = this.$live2dApp.showModelFrame;
    },
});
</script>

<style scoped lang="stylus">
.settings
  display flex
</style>
