<script setup lang="ts">
import {Button} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Canvas from "@/components/Canvas.vue";
import { ThemeSwitcher } from "@/components/custom";
import { useTestStore } from "./stores/useTestStore";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

const testStore = useTestStore()
const {color} = storeToRefs(testStore)
function onChange(value: number | string) {
  testStore.setColor(value as string)
}

</script>

<template>
 <div class="w-full h-screen flex">
    <div class="flex-9/12 relative">
      <div class="top-0 right-0 absolute p-4 z-10">
        <ThemeSwitcher />
      </div>
      <Canvas />
    </div>
    <!-- kleine Demo-UI (optional) -->
    <div class="flex gap-2 flex-3/12 p-4 border-l-muted-foreground border-l">
      <Button >Do Moves</Button>
      <Input type="color" :default-value="testStore.color" @update:model-value="onChange" />
    </div>
</div>
</template>
