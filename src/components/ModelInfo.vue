<template>
  <v-dialog width="1000" max-width="90vw" :value="value" @input="$emit('input',$event)">
    <v-card height="90vh" class="d-flex flex-column">
      <v-toolbar color="primary" flat dense class="flex-grow-0">
        <v-toolbar-title>Model Info</v-toolbar-title>
        <v-spacer></v-spacer>

        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon @click="log" v-bind="attrs" v-on="on"><v-icon>mdi-console</v-icon></v-btn>
          </template>
          <span>Print to console</span>
        </v-tooltip>

        <v-btn icon @click="$emit('input',false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-8 overflow-auto">
        <div class="mb-6 text-no-wrap">URL: {{ url }}</div>
        <pre class="code">{{ settingsJSON }}</pre>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { App } from '@/app/App';
import Vue from 'vue';

export default Vue.extend({
    name: "ModelInfo",
    props: {
        value: Boolean,
        id: Number,
    },
    data: () => ({
        url: '',
        settingsJSON: '',
    }),
    watch: {
        value(value: boolean) {
            if (value) {
                const model = App.getModel(this.id);
                const settings = model?.pixiModel?.internalModel.settings;

                this.url = model?.url || '';
                this.settingsJSON = JSON.stringify(settings?.json || {}, null, 2);
            }
        },
    },
    methods: {
        log() {
            console.log(JSON.parse(this.settingsJSON));
        },
    },
});
</script>

<style scoped lang="stylus">
.code
  font-family Consolas, monospace
</style>
