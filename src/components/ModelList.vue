<template>
  <v-slide-y-reverse-transition>
    <v-sheet v-if="show&&models.length" width="100%">
      <v-row class="ma-0">
        <v-item-group mandatory class="model-list d-flex pa-2" :value="selectedIndex" @change="select">
          <v-item v-for="(model,i) in models" :key="model.id" v-slot="{ active, toggle }">
            <v-card :color="model.error?'#631f1f':active?'blue-grey darken-3':'blue-grey darken-4'" class="ma-2"
                    @click="toggle">
              <v-tooltip top :disabled="!model.error">
                <template v-slot:activator="{ on, attrs }">
                  <v-img contain :src="model.thumbnail" :width="model.error?undefined:model.aspectRatio*192"
                         height="192" v-bind="attrs" v-on="on">
                    <template v-slot:placeholder>
                      <v-row class="fill-height ma-0" align="center" justify="center">
                        <v-progress-circular v-if="!model.error" indeterminate
                                             color="grey lighten-5"></v-progress-circular>
                        <v-icon v-else>mdi-alert-circle</v-icon>
                      </v-row>
                    </template>

                    <v-card-title class="pa-1 subtitle-1">{{ '#' + model.id + ' ' + model.name }}</v-card-title>
                  </v-img>
                </template>
                {{ model.error }}
              </v-tooltip>
            </v-card>
          </v-item>
        </v-item-group>
      </v-row>
    </v-sheet>
  </v-slide-y-reverse-transition>
</template>

<script lang="ts">
import Vue from 'vue';
import { ModelEntity } from '@/live2d/ModelEntity';

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
        selectedIndex() {
            return this.models.findIndex(model => model.id === this.value);
        },
    },
    created() {
        this.models = this.$live2dApp.models;
    },
    methods: {
        select(index: number) {
            const id = this.models[index]?.id ?? -1;

            this.$emit('input', id);
        },
    },
});
</script>

<style scoped lang="stylus">
.v-sheet
  pointer-events auto

.model-list
  overflow auto
</style>
