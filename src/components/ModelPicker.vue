<template>
  <v-dialog :value="value" @input="$emit('input',$event)" width="80vw">
    <v-card height="80vh" class="d-flex flex-column">
      <v-toolbar color="primary" flat dense class="flex-grow-0">
        <v-toolbar-title>Select a Model</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="submit">
          <v-icon>mdi-check</v-icon>
        </v-btn>
      </v-toolbar>

      <v-row no-gutters class="content-row flex-grow-1">
        <v-col class="content-col">
          <v-card-text>
            <v-treeview activatable return-object :load-children="fetchModels" :active="activeFolders" :items="tree"
                        item-key="id" open-on-click @update:active="$event.length&&(activeFolders=$event)"
                        @update:open="folderOpened">
              <template v-slot:prepend="{ open }">
                <v-icon>
                  {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
                </v-icon>
              </template>
            </v-treeview>
          </v-card-text>
        </v-col>

        <v-divider vertical></v-divider>

        <v-col class="content-col">
          <v-card-text>
            <v-list-item-group v-model="selectedFileIndex">
              <v-list-item v-for="(file,i) in activeFolderFiles" :key="file" color="primary"
                           @dblclick.native="selectedFileIndex=i;submit()">
                <v-list-item-content>
                  <v-list-item-title>{{ file }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-card-text>
        </v-col>
      </v-row>

      <v-divider></v-divider>

      <v-card-actions>
        <v-alert dense text type="error" v-visible="alert" class="mb-0">{{ alert }}</v-alert>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import xor from 'lodash/xor';
import { getFilePath, getRootNodes, loadRootNode, TreeNode } from '@/data/model-list';

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
        fetchModels(node: TreeNode) {
            return loadRootNode(node);
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
                const file = getFilePath(this.activeFolders[0], this.activeFolderFiles[this.selectedFileIndex]);

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
</style>
