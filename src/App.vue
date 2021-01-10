<template>
  <v-app>
    <v-navigation-drawer absolute width="360" v-model="drawer" @transitionend="!drawer && (drawerSwitch=true)">
      <v-toolbar color="primary">
        <v-toolbar-title>Live2D Viewer</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn-toggle group rounded v-model="tab">
          <v-btn icon>
            <v-icon>mdi-cog</v-icon>
          </v-btn>
        </v-btn-toggle>
        <v-btn icon class="ml-1" @click="showUI(false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <div v-show="tab===undefined" class="model-page">
        <div class="header pa-3">
          <div class="d-flex align-center">
            <div class="text-h4">{{ '#' + selectedModelID }}</div>
            <v-spacer></v-spacer>
            <v-btn icon width="48" height="48" class="mr-n3" @click="creation.dialog=true">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </div>
          <div class="mt-2 text-h5">{{ selectedModelID ? modelName : 'Press + to create a model' }}</div>
        </div>

        <v-divider></v-divider>

        <ModelEditor v-if="tab===undefined" :id="selectedModelID"/>
      </div>

      <Settings v-show="tab===0"/>
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

    <ModelDropZone @error="error"/>

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
import ModelEditor from '@/components/ModelEditor.vue';
import ModelDropZone from '@/components/ModelDropZone.vue';
import Settings from '@/components/Settings.vue';

export default Vue.extend({
    name: 'App',
    components: { ModelList, ModelCreation, ModelEditor, ModelDropZone, Settings },
    data: () => ({
        drawer: true,
        drawerSwitch: false,
        loading: false,

        tab: -1 as number | undefined,

        modelList: {
            visible: true,
        },

        selectedModelID: 0,

        creation: {
            dialog: false,
            result: null,
        },

        snackbar: {
            visible: false,
            message: '',
        },
    }),
    computed: {
        modelName() {
            return this.$live2dApp.getModel(this.selectedModelID)?.name || '';
        },
    },
    methods: {
        showUI(show: boolean) {
            this.drawer = show;
            this.modelList.visible = show;
            this.drawerSwitch = false;
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
        // switch to the default tab
        this.tab = undefined;
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

>>> .v-toolbar__content
  padding-left 12px
  padding-right 12px

.v-btn-toggle > .v-btn.v-btn
  opacity 1

.model-page
  display flex
  flex-direction column
  overflow auto

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

// https://github.com/vuetifyjs/vuetify/issues/7283#issuecomment-572276385
// Reversed input variant
.v-input--reverse .v-input__slot
  flex-direction: row-reverse
  justify-content: flex-end

  .v-input--selection-controls__input
    margin-right: 0
    margin-left: 8px

  .v-label
    display: block
    flex: 1
</style>
