<template>
  <v-app>
    <v-navigation-drawer absolute width="360" v-model="drawer" @transitionend="!drawer && (drawerSwitch=true)">
      <v-toolbar color="primary">
        <v-toolbar-title>Live2D Viewer</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon href="https://github.com/guansss/live2d-viewer-web">
          <v-icon>mdi-github</v-icon>
        </v-btn>
        <v-btn icon @click="creation.dialog=true">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-btn icon @click="showUI(false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider></v-divider>

      <ModelEditor :id="selectedModelID"/>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid class="pa-0 fill-height flex-column">
        <v-spacer></v-spacer>
        <ModelList v-model="selectedModelID" :show="modelList.visible"/>
      </v-container>
      <ModelCreation v-model="creation.dialog" @create="selectedModelID=$event"/>
    </v-main>

    <v-fab-transition>
      <v-btn fab top left absolute dark color="accent" v-show="drawerSwitch" @click="showUI(true)">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-fab-transition>

    <ModelDropZone @upload="upload" @error="error"/>

    <v-snackbar v-model="snackbar.visible" timeout="-1">
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn icon v-bind="attrs" @click="snackbar.visible=false"><v-icon>mdi-close</v-icon></v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import ModelList from './components/ModelList.vue';
import ModelCreation from './components/ModelCreation.vue';
import { ModelEntity } from '@/live2d/ModelEntity';
import ModelEditor from '@/components/ModelEditor.vue';
import ModelDropZone from '@/components/ModelDropZone.vue';

export default Vue.extend({
    name: 'App',

    components: { ModelList, ModelCreation, ModelEditor, ModelDropZone },

    data: () => ({
        drawer: true,
        drawerSwitch: false,
        loading: false,

        modelList: {
            visible: true,
        },

        selectedModelID: -1,

        creation: {
            dialog: false,
            result: null,
        },

        drop: {},

        snackbar: {
            visible: false,
            message: '',
        },

        models: [] as ModelEntity[],
    }),
    computed: {},

    methods: {
        showUI(show: boolean) {
            this.drawer = show;
            this.modelList.visible = show;
            this.drawerSwitch = false;
        },
        upload(files: File[]) {
            this.$live2dApp.addModels(files);
        },
        error(e: any) {
            const message = e && e.message || e + '';

            if (message) {
                this.snackbar.message = message;
                this.snackbar.visible = true;
            }
        },
        log(...args: any[]) {
            console.log(...args);
        },
    },
    created() {
        this.models = this.$live2dApp.models;
        this.creation.dialog = true;
    },
});
</script>

<style scoped lang="stylus">
.v-main
  padding-left 360px !important

>>> .v-navigation-drawer__content
  display flex
  flex-direction column

  .v-toolbar
    flex-grow initial !important

.model-editor
  overflow auto
</style>

<style lang="stylus">
*
  margin: 0
  padding: 0
  box-sizing: border-box

html
  overflow: hidden !important

#canvas
  position: absolute

#app
  pointer-events none

.v-btn--fab.v-size--default.v-btn--absolute.v-btn--top
  top: 16px
  pointer-events auto
</style>
