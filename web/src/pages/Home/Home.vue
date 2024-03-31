
<template>
	<main class="w-full h-full">
		<div class="h-full flex">
			<div class="w-2/3 h-full">
				<section class="h-10 bg-neutral-800 border-b border-b-neutral-700">
					<div class="">

					</div>
				</section>
				
				<div class="scroll">
					<el-tree-v2
						:data="logs"
						:height="800"
						:width="700"
						:filter-method="(value, data) => { console.log(value, data); return true }"
					>
					<template #default="{ node }">
						<LogView :log="node.data" />
					</template>
					</el-tree-v2>
				</div>

			</div>

			<aside class="aside w-1/3 flex bg-neutral-800 border border-t-0 border-neutral-700">

			</aside>
		</div>

	</main>
	
</template>


<script setup lang="ts">

import { v4 as uuidv4 } from 'uuid'
import { nextTick, ref } from 'vue'
import Log, { logEntrySchema, type LogEntry } from './components/Log'
import LogView from './components/LogView.vue';

const randomUuid = uuidv4()

const gen_logs = () => {

	return new Array(200).fill(null).map((_, i) => {
		return new Log(
			new Date(Date.now() + i * 10),
			'CRITICAL',
			'none',
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vel pharetra vel turpis nunc eget lorem dolor. Sollicitudin aliquam ultrices sagittis orci a. Lacus suspendisse faucibus interdum posuere lorem ipsum. Velit aliquet sagittis id consectetur purus ut. Pellentesque eu tincidunt tortor aliquam nulla facilisi cras fermentum odio. A diam maecenas sed enim ut sem viverra aliquet. ',
			'SomeService',
			'SomeController',
			{},
			{}
		)
	})
}

const logs = ref(gen_logs() as LogEntry[])

let socket = new WebSocket(`ws://localhost:3769/api/listenLogs/${randomUuid}`)

socket.onmessage =  (event) => {
	const log = logEntrySchema.parse(
		JSON.parse(event.data)
	)
	logs.value = [Log.fromJSON(log), ...logs.value]
	// logs.value.push(Log.fromJSON(log))
	
}

</script>

<style scoped lang="scss">
.scroll {
	@apply p-4 overflow-auto;
	height: calc(100vh - 88px);
}

.aside {
	height: calc(100vh - 48px);
}

</style>
