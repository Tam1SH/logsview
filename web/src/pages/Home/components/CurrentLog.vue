<template>
	<div v-if="log != null" class="flex flex-col gap-2">
		<div class="flex gap-1">
			<span class="text-neutral-500">
				level:
			</span>
			<span :class="getLogLevelColor(log.level)">
				{{ log.level }}
			</span>
		</div>

		<div class="flex gap-1">
			<span class="text-neutral-500">
				date:
			</span>
			<span>
				{{ formatDate(log.time) }}
			</span>
		</div>

		<div class="flex gap-1">
			<span class="text-neutral-500">
				title:
			</span>
			<span>
				{{ log.title }}
			</span>
		</div>

		<div class="flex gap-1 items-center">
			<span class="text-neutral-500">
				request ID:
			</span>
			<span>
				{{ log.requestId }}
			</span>
			<div class="w-6 h-4">
				<el-icon><Connection class="text-neutral-500" /></el-icon>
			</div>
		</div>

		<div class="flex gap-1">
			<span class="text-neutral-500">
				service name:
			</span>
			<span>
				{{ log.serviceName ?? 'empty' }}
			</span>
		</div>
		<div class="flex gap-1">
			<span class="text-neutral-500">
				controller name:
			</span>
			<span>
				{{ log.controllerName ?? 'empty' }}
			</span>
		</div>
		<div class="flex flex-col gap-1">
			<span class="text-neutral-500">
				message:
			</span>
			<span class="bg-neutral-700 rounded-md p-2">
				<code 
					class="language-javascript !bg-transparent !text-sm !whitespace-break-spaces flex-wrap" 
					style="font-family: system-ui;"
				>
					{{ JSON.parse(log.message) }}
				</code>
			</span>
		</div>
		<div class="flex flex-col gap-1">
			<span class="text-neutral-500">
				additional data:
			</span>
			<span class="bg-neutral-700 rounded-md p-2">
				<code 
					class="language-json flex !bg-transparent !text-sm !whitespace-break-spaces" 
					style="font-family: system-ui;"
				>
					{{ log.additionalData }}
				</code>
			</span>
		</div>

	</div>
	<div v-if="log == null" class="flex h-full items-center justify-center">
		<span class="text-neutral-500">
			No log selected
		</span>
	</div>
</template>

<script setup lang="ts">
import type { Log } from '@/Api/api';
import { formatDate, getLogLevelColor } from '../utils';

import Prism from "prismjs";
import "prismjs/themes/prism.css"
import 'prism-themes/themes/prism-cb.css'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-javascript'
import { onUpdated } from 'vue';
// import Prism from "prismjs";
// import 'prismjs/components/prism-json';

const { log: log } = defineProps({
	log: {
		type: Object as () => Log | null
	}
})

onUpdated(() => {
	window.Prism = window.Prism || {}
    window.Prism.manual = true
    Prism.highlightAll()
})
</script>
<style lang="scss">
.token.operator {
	@apply bg-transparent
}
</style>