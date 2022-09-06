<template>
  <v-dialog :value="value" @input="$emit('input',$event)" width="1500" max-width="90vw">
    <v-card height="1000" max-height="90vh" class="d-flex flex-column">
      <v-toolbar color="primary" flat dense class="flex-grow-0">
        <v-toolbar-title>Select a Model</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="submit">
          <v-icon>mdi-checkbox-marked-circle-outline</v-icon>
        </v-btn>
      </v-toolbar>

      <v-row no-gutters class="content-row flex-grow-1">
        <v-col class="content-col">
          <v-treeview activatable return-object :load-children="fetchModels" :active="activeFolders" :items="tree"
                      item-key="id" open-on-click @update:active="$event.length&&(activeFolders=$event)"
                      @update:open="folderOpened">
            <template v-slot:prepend="{ open }">
              <v-icon>
                {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
              </v-icon>
            </template>
            <template v-slot:label="{ item }">
                <span :class="{'text-decoration-line-through':item.error}">{{ item.name }}</span>
                <v-chip x-small class="model-count ml-1 px-2 text--secondary">{{ item.modelCount }}</v-chip>
            </template>
          </v-treeview>
        </v-col>

        <v-divider vertical></v-divider>

        <v-col class="content-col">
          <v-list-item-group v-model="selectedFileIndex">
            <v-list-item v-for="(file,i) in activeFolderFiles" :key="file" color="primary"
                         @dblclick.native="selectedFileIndex=i;submit()">
              <v-list-item-content>
                <v-list-item-title>{{ file }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-col>
      </v-row>

      <v-divider></v-divider>

      <v-card-actions>
        <span class="text--secondary text-caption">The listed models were scraped from <a target="_blank"
                                                                             href="https://github.com/Eikanya/Live2d-model">Eikanya/Live2d-model</a>.
          All credit goes to their respective creators.</span>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { xor } from 'lodash-es';
import { getFileURL, getRootNodes, loadRootNode, TreeNode } from '@/app/data';

export default Vue.extend({
    name: "ModelPicker",
    props: {
        value: Boolean,
    },

    data: () => ({
        search: '',
        tree: getRootNodes(),

        openedFolders: [] as TreeNode[],
        activeFolders: [] as TreeNode[],
        selectedFileIndex: -1,

        alert: '',
    }),
    computed: {
        activeFolderFiles() {
            return this.activeFolders.length ? this.activeFolders[0].files || [] : [];
        },
    },
    watch: {
        activeFolders(value: TreeNode[], oldValue: TreeNode[]) {
            const hasChanged = xor(value, oldValue).length !== 0;

            if (hasChanged) {
                this.selectedFileIndex = -1;
            }
        },
        selectedFileIndex() {
            this.alert = '';
        },
    },
    created() {
    },
    methods: {
        async fetchModels(node: TreeNode) {
            await loadRootNode(node);
        },
        folderOpened(openedFolders: TreeNode[]) {
            const diff = xor(openedFolders, this.openedFolders);

            if (diff.length) {
                this.activeFolders = diff.slice(0);
                this.openedFolders = openedFolders;
            } else {
                this.activeFolders = this.tree.slice(0, 1);
            }
        },
        submit() {
            if (this.activeFolders.length && this.selectedFileIndex >= 0) {
                const file = getFileURL(this.activeFolders[0], this.activeFolderFiles[this.selectedFileIndex]);

                if (file) {
                    this.$emit('select', file);
                }
            }

            this.$emit('input', false);
        },
        log(...args: any[]) {
            console.log(...args);
        },
    },
});
</script>

<style scoped lang="stylus">
.content-row
  overflow auto

.content-col
  height 100%
  overflow auto

.model-count
  vertical-align text-top
  pointer-events none
</style>
