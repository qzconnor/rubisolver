<script setup lang="ts">
import { ref } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { type RubikAPI, Dounut } from "@/components/custom";
import { OrbitControls } from '@tresjs/cientos'

const cubeRef = ref<RubikAPI | null>(null)

function doMoves() {
  cubeRef.value?.rotate("B", 1)
}

</script>
<template>
    <TresCanvas  class="h-full">
        <TresPerspectiveCamera />
        <OrbitControls :enable-damping="true" :damping-factor="0.08" :make-default="true" />
        <Dounut />
        <!--  -->
    </TresCanvas>
</template>