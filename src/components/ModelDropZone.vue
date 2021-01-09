<template>
  <div :class="['drop-zone', {active:draggingOver}]">
    <div v-if="draggingOver" class="text-h1">Drop Files</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { uploadedFiles } from '@/live2d/upload';
import { isDraggingFile, readFiles } from '@/utils/file';
import { ExtendedFileList } from 'pixi-live2d-display';

export default Vue.extend({
    name: "ModelDropZone",

    data: () => ({
        draggingOver: false,
    }),
    created() {
        document.ondragenter = e => isDraggingFile(e) && (this.draggingOver = true);
        document.ondragleave = e => isDraggingFile(e) && (this.draggingOver = !!e.relatedTarget);
        document.ondragover = e => isDraggingFile(e) && e.preventDefault();
        document.ondrop = e => isDraggingFile(e) && this.drop(e);
    },
    methods: {
        async drop(e: DragEvent) {
            e.preventDefault();

            this.draggingOver = false;

            if (e.dataTransfer?.items.length) {
                const files = await readFiles(e.dataTransfer.items);

                this.upload(files);
            }
        },
        async upload(files: File[]) {
            try {
                const settingsArray = await uploadedFiles(files);

                if (settingsArray.length) {
                    for (const settings of settingsArray) {
                        const fileList = files as ExtendedFileList;

                        fileList.settings = settings;

                        this.$live2dApp.addModel(fileList);
                    }
                } else {
                    this.$live2dApp.addModel(files);
                }
            } catch (e) {
                e.message = 'Failed to load model: ' + e.message;

                this.$emit('error', e);
            }
        },
    },
});
</script>

<style scoped lang="stylus">
.drop-zone
  position fixed
  z-index 9999
  top: 0
  right: 0
  bottom: 0
  left: 0
  display flex
  align-items center
  justify-content center
  transition background-color ease-out .2s

  &.active
    background rgba(0, 0, 0, .3)
</style>
