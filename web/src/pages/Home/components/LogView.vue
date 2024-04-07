<template>
	<div
		class="flex gap-1 w-full h-[26px]"
		@click="selectLog(log)"
	>
		<span :class="getLogLevelColor(log.level)">[{{ log.level }}]</span>
		<span class="text-cyan-500">[{{ formatDate(log.time) }}]</span>
		<div class="w-2/3 flex">
			<span class="text-ellipsis overflow-hidden whitespace-nowrap w-full">{{ log.title }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { formatDate, getLogLevelColor } from '../utils'
import type { Log } from '@/Api/api';
import { onMounted, type PropType } from 'vue';

const { log, checkIsLast, selectLog } = defineProps({

	selectLog: {
		type: Function as PropType<(log: Log) => void>,
		required: true
	},
	checkIsLast: {
		type: Function as PropType<(log: Log) => void>,
		required: true
	},
	log: {
		type: Object as () => Log,
		required: true
	}
})

onMounted(() => {
	checkIsLast(log)
})

</script>


<style lang="scss" scoped>
.expansion {
	@apply bg-transparent shadow-none;
}
</style>
