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
        <v-text-field single-line filled prepend-icon="mdi-link" label="URL" v-model="url" :messages="urlMessages"
                      :error="urlError"></v-text-field>

        <div class="d-flex mb-4">
          <v-spacer></v-spacer>
          <v-btn color="blue-grey" @click="picker.dialog=true">
            From source...
            <v-icon right>
              mdi-cloud-search
            </v-icon>
          </v-btn>
        </div>

        <v-file-input multiple filled show-size prepend-icon="mdi-file-upload"
                      placeholder="Not implemented yet, please just drag and drop all the files into this page"
                      v-model="inputFiles" @click.native.capture="fileInputClicked"></v-file-input>
      </v-card-text>
    </v-card>
    <ModelPicker v-model="picker.dialog" @select="url=$event"/>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import ModelPicker from './ModelPicker.vue';
import { validateURL } from '@/live2d/data';

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

        urlError: false,
        urlMessages: [] as string[],

        files: [] as File[],
        inputFiles: [] as File[],
        fileError: false,
        fileMessages: [] as string[],
    }),
    watch: {
        url(value) {
            const message = validateURL(value) || '';

            this.urlError = /error/i.test(message);
            this.urlMessages = [message].filter(Boolean);
        },
        inputFiles(value: File[]) {
            console.log(value);
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

            const id = this.$live2dApp.addModel(this.url);

            this.$emit('input', false);
            this.$emit('create', id);
        },
        fileInputClicked(e: MouseEvent) {
            const clickingOnIcon = (e.target as HTMLElement).classList.contains('v-icon');

            // don't open file picker when there's already selected files,
            // as canceling the picker will clear all the selected files
            if (this.inputFiles.length && !clickingOnIcon) {
                e.stopPropagation();
            }
        },
    },
});
</script>

<style scoped lang="stylus">

</style>
