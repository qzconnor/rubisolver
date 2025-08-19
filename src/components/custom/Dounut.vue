<script setup lang="ts">
import { useTestStore } from '@/stores/useTestStore';
import { storeToRefs } from 'pinia';

const testStore = useTestStore()
const {color} = storeToRefs(testStore)
</script>


<template>
    <TresMesh>
        <TresTorusGeometry :args="[1, 0.5, 16, 32]" />
        <TresMeshBasicMaterial :color="color" />
    </TresMesh>
    <TresAmbientLight :intensity="1" />
</template>