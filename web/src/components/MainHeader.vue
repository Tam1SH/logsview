<template>
	<header class="h-12 bg-neutral-800 w-full shadow-md border-b border-b-neutral-700">
		<div class="flex items-center h-full">
			<div class="ml-1 flex items-center gap-2">
				<img :src="logslogo" class="w-12 h-12"/>
				<!-- <span class="text-lg">
					Logsview
				</span> -->
			</div>
		</div>
	</header>
</template>

<script setup lang="ts">
import logslogo from '@/assets/logslogo.png'

</script>