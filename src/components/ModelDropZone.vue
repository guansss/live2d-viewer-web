<template>
  <div :class="['drop-zone', {active:draggingOver}]">
    <div v-if="draggingOver" class="text-h1">Drop Files</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { validateUploadedFiles } from '@/live2d/upload';
import { readFiles } from '@/utils/file';

export default Vue.extend({
    name: "ModelDropZone",

    data: () => ({
        draggingOver: false,
    }),
    created() {
        document.ondragenter = () => this.draggingOver = true;
        document.ondragleave = e => this.draggingOver = !!e.relatedTarget;
        document.ondragover = e => e.preventDefault();
        document.ondrop = e => this.drop(e);
    },
    methods: {
        async drop(e: DragEvent) {
            e.preventDefault();

            this.draggingOver = false;

            if (e.dataTransfer?.items?.length) {
                const files = await readFiles(e.dataTransfer.items);

                try {
                    const validFiles = await validateUploadedFiles(files);

                    this.$emit('upload', validFiles);
                } catch (e) {
                    e.message = 'Failed to load model: ' + e.message;

                    this.$emit('error', e);
                }
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

  &.active
    background rgba(0, 0, 0, .3)
</style>
