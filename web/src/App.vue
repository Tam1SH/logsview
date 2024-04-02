<template>
	<DefaultLayout v-if="$route.meta.layout === 'default'" />
	<VueQueryDevtools />
	<router-view />
</template>

<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>