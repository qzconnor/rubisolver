<script setup lang="ts">
import { RubiksCube } from "@/components/custom";

import { ref } from 'vue'
import { TresCanvas } from '@tresjs/core'
import type { RubikAPI } from "./components/custom/RubiksCube.vue";

const cubeRef = ref<RubikAPI | null>(null)
</script>

<template>
 <div class="w-full h-screen relative">
    <TresCanvas render-mode="manual" class="w-full h-full">
      <TresPerspectiveCamera :position="[6,6,6]" :fov="55" />
      <!-- Würfel einhängen -->
      <RubiksCube ref="cubeRef" />
    </TresCanvas>

    <!-- kleine Demo-UI (optional) -->
    <div class="absolute top-2 left-2 flex gap-2">
      <!-- <button @click="doMoves">Do Moves</button> -->
    </div>
</div>
</template>
