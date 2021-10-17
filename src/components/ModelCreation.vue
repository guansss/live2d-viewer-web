<template>
  <v-dialog :value="value" width="800" @input="$emit('input',$event)">
    <v-card>
      <v-toolbar color="primary" flat dense class="flex-grow-0">
        <v-toolbar-title>Create Model</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="create">
          <v-icon>mdi-checkbox-marked-circle-outline</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-8">
        <v-text-field single-line filled label="URL" v-model="url" :messages="urlMessages"
                      :error="urlError" @keyup.enter="create"></v-text-field>

        <div class="d-flex align-center">
          <v-btn icon small color="grey" @click="dropHelpDialog=true"><v-icon size="20">mdi-help-circle</v-icon></v-btn>
          <span>Drag and drop supported</span>

          <v-spacer></v-spacer>

          <v-btn color="blue-grey" @click="picker.dialog=true">From source...<v-icon right>
            mdi-cloud-search</v-icon>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    <v-dialog width="1000" max-width="80vw" v-model="dropHelpDialog">
      <v-img src="drop.jpg" @click="dropHelpDialog=false"></v-img>
    </v-dialog>
    <ModelPicker v-model="picker.dialog" @select="url=$event"/>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import ModelPicker from './ModelPicker.vue';
import { validateURL } from '@/app/data';
import { App } from '@/app/App';

export default Vue.extend({
    components: { ModelPicker },

    name: "ModelCreation",
    props: {
        value: Boolean,
    },
    data: () => ({
        url: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D/Senko_Normals/senko.model3.json',

        dropHelpDialog: false,

        picker: {
            dialog: false,
        },

        urlError: false,
        urlMessages: [] as string[],
    }),
    watch: {
        url(value) {
            const message = validateURL(value) || '';

            this.urlError = /error/i.test(message);
            this.urlMessages = [message].filter(Boolean);
        },
    },
    methods: {
        create() {
            this.url = this.url.replace(/\s/, '');

            if (!this.url) {
                this.urlError = true;
                this.urlMessages = ['Please enter a URL'];
            }

            if (this.urlError) {
                return;
            }

            const id = App.addModel(this.url);

            this.$emit('input', false);
            this.$emit('create', id);
        },
    },
});
</script>

<style scoped lang="stylus">

</style>
