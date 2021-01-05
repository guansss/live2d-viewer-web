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
        <v-row>
          <v-text-field label="URL" single-line filled v-model="url" :messages="urlMessages"
                        :error="urlError"></v-text-field>
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
import { validateURL } from '@/data/model';

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

            if (this.urlError) {
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
