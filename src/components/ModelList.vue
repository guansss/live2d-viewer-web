<template>
  <v-slide-y-reverse-transition>
    <v-sheet v-if="show&&models.length" width="100%" class="pa-4">
      <v-row>
        <v-item-group mandatory class="d-flex">
          <v-item v-for="model in models" :key="model.id" v-slot="{ active, toggle }">
            <v-card :color="model.error?'#631f1f':'blue-grey darken-4'" class="ma-2" @click="toggle">
              <v-tooltip top :disabled="!model.error">
                <template v-slot:activator="{ on, attrs }">
                  <v-img :src="model.thumbnail" min-width="150" max-width="300" height="192" v-bind="attrs" v-on="on">
                    <template v-slot:placeholder>
                      <v-row class="fill-height ma-0" align="center" justify="center">
                        <v-progress-circular v-if="!model.error" indeterminate
                                             color="grey lighten-5"></v-progress-circular>
                        <v-icon v-else>mdi-alert-circle</v-icon>
                      </v-row>
                    </template>

                    <v-card-title class="pa-1 subtitle-1">{{ model.name }}</v-card-title>
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
        show: Boolean,
    },
    data: () => ({
        models: [] as ModelEntity[],
    }),
    created() {
        this.models = this.$live2dApp.models;
    },
});
</script>

<style scoped lang="stylus">
.v-sheet
  pointer-events auto
</style>
