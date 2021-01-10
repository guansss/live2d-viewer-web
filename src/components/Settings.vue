<template>
  <div class="settings pa-3 flex-column flex-grow-1">
    <div>
      <v-slider dense class="mt-2" prepend-icon="mdi-volume-high" v-model="volume" :messages="~~(volume*100)+'%'"
                min="0" max="1" step="0.02"></v-slider>

      <v-switch class="v-input--reverse" v-model="hitAreaFrames" label="Show hit area frames"></v-switch>
      <v-switch class="v-input--reverse" v-model="modelFrame" label="Show model frames"></v-switch>
    </div>

    <v-spacer></v-spacer>
    <v-divider></v-divider>

    <div class="pt-4 pb-1 d-flex align-center">
      <v-icon class="mr-2">mdi-github</v-icon>
      <span>View source on <a href="https://github.com/guansss/live2d-viewer-web"
                              class="text-decoration-none">GitHub</a></span></div>
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
    }),
    watch: {
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
