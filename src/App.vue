<template>
  <v-app>
    <v-navigation-drawer absolute width="360" v-model="drawer" @transitionend="!drawer && (drawerSwitch=true)">
      <v-toolbar color="primary">
        <v-toolbar-title>Live2D Viewer</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="creation.dialog=true">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-btn icon @click="showUI(false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item v-for="model in models" :key="model.id" link>
          <v-list-item-content>
            <v-list-item-title>{{ model.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid class="pa-0 fill-height flex-column">
        <v-spacer></v-spacer>
        <ModelList :show="modelList.visible"/>
      </v-container>
      <ModelCreation v-model="creation.dialog"/>
    </v-main>
    <v-fab-transition>
      <v-btn fab top left absolute dark color="accent" v-show="drawerSwitch" @click="showUI(true)">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-fab-transition>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import ModelList from './components/ModelList.vue';
import ModelCreation from './components/ModelCreation.vue';
import { ModelEntity } from '@/live2d/ModelEntity';

export default Vue.extend({
    name: 'App',

    components: { ModelList, ModelCreation },

    data: () => ({
        drawer: true,
        drawerSwitch: false,
        loading: false,

        edit: {
            dialog: false,
            index: 0,
        },

        modelList: {
            visible: true,
        },

        creation: {
            dialog: false,
            result: null,
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
        log(...args: any[]) {
            console.log(...args);
        },
    },
    created() {
        this.models = this.$live2dApp.models;
        this.creation.dialog = true;
    },
    async mounted() {

    },
});
</script>

<style scoped lang="stylus">
.v-main
  padding-left 360px !important
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
