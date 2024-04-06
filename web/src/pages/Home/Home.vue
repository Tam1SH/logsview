
<template>
	<main class="w-full h-full">
		<div class="h-full flex" ref="container">

			<div :style="{ width: `${right - restrictedX}` + 'px' }" class="h-full">
				<section class="h-[39px] bg-neutral-800 border-b border-b-neutral-700">
					<div class="">

					</div>
				</section>
				<section class="flex">
					<div class="ml-auto mr-2 gap-1 flex justify-center items-center">
						<Refresh 
							@click="logsStore.reload()"
							class="h-6 w-4 text-neutral-500 cursor-pointer"
							:class="{ 'animate-spin': logsStore.isLoading }"
						/>
						<span class="text-neutral-500">|</span>
						<span class="ml-auto text-neutral-500">{{ logsStore.logs.length }} out of {{ logsStore.logsCount ?? 0 }}</span>
						<span class="text-neutral-500">|</span>
						<el-popover
							placement="bottom-end"
							:width="400"
							trigger="click"
						>
							<div class="flex flex-col">
								<div class="flex items-center justify-between">
									<span class="font-bold">Get logs online</span>
									<el-switch
										v-model="socketUsage"
										@click="setSocketUsage"
									/>
								</div>
							</div>
							<template #reference>
								<el-icon><Setting class="h-6 w-4 text-neutral-500 cursor-pointer"/></el-icon>
							</template>
						</el-popover>

					</div>	
				</section>

				<div 
					class="scroll"
					id="jopa"
				>
					<el-tree-v2
						id="treeRef"
						ref="treeRef"
						:height="treeHeight"
					>
						<template #default="{ node }">
							<LogView 
								:log="node.data.log" 
								:checkIsLast="throttledCheckIsLast"
								:selectLog="selectLog"
							/>
						</template>
					</el-tree-v2>
				</div>

			</div>
			<div class="cursor-ew-resize z-10 w-2 hover:bg-blue-500 h-full fixed"
				ref="draggable"
				:style="{ right: `calc(${restrictedX}px - 4px)` }"
			>
			</div>
			<aside :style="{ width: `${restrictedX}` + 'px' }" class="aside flex border border-t-0 border-r-0 border-b-0 border-neutral-700">
				<el-tabs type="border-card" class="w-full !border-0 top-px">
					<el-tab-pane label="Current log" class="h-full">
						<CurrentLog :log="currentLog"/>
					</el-tab-pane>
					<el-tab-pane label="Filters">
						<template #label>
							<div class="flex gap-1 items-center">
								<el-icon><Filter /></el-icon>
								<span>Filters</span>
							</div>

						</template>
					</el-tab-pane>
				</el-tabs>
			</aside>
		</div>

	</main>
	
</template>


<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import CurrentLog from './components/CurrentLog.vue'
import LogView from './components/LogView.vue'
import { type Log } from '@/Api/api'
import { UseConnectionEnum, useLogsStore } from './LogsStore'
import { type ElTreeV2 } from 'element-plus'
import _ from 'lodash'
import { useDraggable, useElementBounding, clamp } from '@vueuse/core'

const socketUsage = ref(true)

const setSocketUsage = () => {
	if (socketUsage.value) {
		logsStore.connect(UseConnectionEnum.Connect)
	}
	else {
		logsStore.connect(UseConnectionEnum.NotAndDisconnect)
	}
}

const currentLog = ref(null as Log | null)

const container = ref()
const draggable = ref()

const { left, right } = useElementBounding(container)
const { width } = useElementBounding(draggable)
const { x } = useDraggable(draggable)
x.value = window.innerWidth / 3 * 2

const selectLog = (log: Log) => {
	currentLog.value = log
}

const restrictedX = computed(() => {
	return clamp(left.value + 400, right.value - x.value - width.value / 2, right.value - 400)
})

const logsStore = useLogsStore()

const treeRef = ref<InstanceType<typeof ElTreeV2>>()

const throttledCheckIsLast = _.throttle((log: Log) => {
	if (logsStore.checkIsLast(log)) {
		logsStore.fetchNextPageLogs()
	}
}, 400) 


logsStore.onSetData(logs => treeRef.value?.setData(logs))

logsStore.connect(UseConnectionEnum.Connect)
logsStore.setBatchSizeForFetch(200)
logsStore.setAppendBatchTimeout(500)
logsStore.setBatchSizeForSocket(50)
logsStore.fetchNextPageLogs()

let treeHeight = ref(window.innerHeight - 150)

const updateHeight = () => {
    treeHeight.value = window.innerHeight - 150
}
const updateWidth = () => {
	x.value = right.value - 400

}

onMounted(() => {
    window.addEventListener('resize', updateWidth);
    window.addEventListener('resize', updateHeight);
})

onUnmounted(() => {
    window.addEventListener('resize', updateWidth);
    window.removeEventListener('resize', updateHeight);
})



</script>

<style scoped lang="scss">
.scroll {
	@apply p-4 overflow-auto;
	height: calc(100vh - 118px);
}

.aside {
	height: calc(100vh - 48px);
}

</style>, computed
