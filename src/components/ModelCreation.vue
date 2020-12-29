<template>
  <v-dialog :value="value" width="800" @input="$emit('input',$event)">
    <v-card>
      <v-toolbar color="primary" flat dense class="flex-grow-0">
        <v-toolbar-title>Create Model</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="create">
          <v-icon>mdi-check</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-8">
        <v-row>
          <v-text-field label="URL" single-line filled v-model="url" :rules="urlRules"></v-text-field>
        </v-row>
        <v-row>
          <v-spacer></v-spacer>
          <v-btn color="blue-grey" @click="picker.dialog=true">
            From source...
            <v-icon right>
              mdi-cloud-search
            </v-icon>
          </v-btn>
        </v-row>
      </v-card-text>
    </v-card>
    <ModelPicker v-model="picker.dialog" @select="url=$event"/>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import ModelPicker from './ModelPicker.vue';

export default Vue.extend({
    components: { ModelPicker },

    name: "ModelCreation",
    props: {
        value: Boolean,
    },
    data: () => ({
        url: '',

        picker: {
            dialog: false,
        },

        urlRules: [
            (url: string) => url.endsWith('model.json') || url.endsWith('model3.json') || 'Model file must end with .model.json or .model3.json',
        ],
    }),
    methods: {
        create() {
            this.url = this.url.replace(/\s/, '');

            if (!this.urlRules.every(rule => rule(this.url))) {
                return;
            }

            this.$live2dApp.addModel(this.url);

            this.$emit('input', false);
        },
    },
});
</script>

<style scoped lang="stylus">

</style>
