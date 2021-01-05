<template>
  <v-row v-if="model" class="ma-0">
    <v-col cols="12">
      <div class="display-1">{{ '#' + model.id + ' ' + model.name }}</div>
    </v-col>

    <v-col cols="12">
      <v-slider dense class="pb-0" prepend-icon="mdi-magnify" v-model="model.scaleX" :messages="String(model.scaleX)"
                min="0.01" max="3" step="0.01"></v-slider>
    </v-col>
    <v-col cols="12">
      <v-slider dense class="pb-0" prepend-icon="mdi-rotate-right" v-model="model.rotation" :messages="rotationDeg"
                min="0" max="6.28" step="0.01"></v-slider>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { ModelEntity } from '@/live2d/ModelEntity';

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
            this.model = this.$live2dApp.getModel(this.id);
        },
    },
});
</script>

<style scoped lang="stylus">

</style>
