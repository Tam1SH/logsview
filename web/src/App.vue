<template>
	<DefaultLayout v-if="$route.meta.layout === 'default'" />
	<router-view />
</template>

<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'

import { useQueryProvider } from "vue-query"

useQueryProvider()

</script>