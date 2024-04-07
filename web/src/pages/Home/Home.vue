
<template>
	<main class="w-full h-full">
		<div class="h-full flex" ref="container">

			<div :style="{ width: `${right - restrictedX}` + 'px' }" class="h-full">
				<el-tabs
				
					:ref="tabsHackRef"
					type="border-card" 
					class="w-full !border-0 top-px !bg-neutral-900"
				>
					<el-tab-pane class="h-full">
						<template #label>
							<span class="hack">
								Database
							</span>
						</template>
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
										<el-divider class="!mt-2 !mb-2"/>
										<div class="flex flex-col justify-between">
											<span class="font-bold">Batch size for fetch</span>
											<el-slider
												v-model="batchSizeUi"
												:show-input-controls="false"
												@change="setBatchSizeForFetch"
												:min="0"
												:max="10000"
												show-input size="small"
											/>
										</div>
										<el-divider class="!mt-2 !mb-2"/>
										<div class="flex flex-col justify-between">
											<span class="font-bold">Append batch timeout for socket</span>
											<el-slider
												v-model="appendBatchTimeoutUi"
												:show-input-controls="false"
												@change="setAppendBatchTimeout"
												:min="0"
												:max="10000"
												show-input size="small"
											/>
										</div>
										<el-divider class="!mt-2 !mb-2"/>
										<div class="flex flex-col justify-between">
											<span class="font-bold">Batch size for socket</span>
											<el-slider
												v-model="batchSizeForSocketUi"
												:show-input-controls="false"
												@change="setBatchSizeForSocket"
												:min="0"
												:max="10000"
												show-input size="small"
											/>
										</div>
									</div>
									<template #reference>
										<el-icon><Setting class="h-6 w-4 text-neutral-500 cursor-pointer"/></el-icon>
									</template>
								</el-popover>

							</div>
						</section>
						<div class="scroll">
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
					</el-tab-pane>
					<el-tab-pane>
						<template #label>
							<span class="hack">
								Logspout
							</span>
						</template>
					</el-tab-pane>
				</el-tabs>



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
import { type ElTabs, type ElTreeV2 } from 'element-plus'
import _ from 'lodash'
import { useDraggable, useElementBounding, clamp } from '@vueuse/core'
import type { Arrayable } from 'element-plus/lib/utils/typescript.js'
import { useSettingsStore } from './SettingsStore'




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

const settingsStore = useSettingsStore()
const logsStore = useLogsStore()

const treeRef = ref<InstanceType<typeof ElTreeV2>>()
const tabsHackRef = ref()

const throttledCheckIsLast = _.throttle((log: Log) => {
	if (logsStore.checkIsLast(log)) {
		logsStore.fetchNextPageLogs()
	}
}, 400) 


logsStore.onSetData(logs => treeRef.value?.setData(logs))

const selectConnect = () => {
	if (settingsStore.usingSocket) {
		return UseConnectionEnum.Connect
	}
	else {
		return UseConnectionEnum.NotAndDisconnect
	}
}

logsStore.connect(selectConnect())
logsStore.setBatchSizeForFetch(settingsStore.batchSize)
logsStore.setAppendBatchTimeout(settingsStore.appendBatchTimeout)
logsStore.setBatchSizeForSocket(settingsStore.batchSizeForSocket)
logsStore.fetchNextPageLogs()

const socketUsage = ref(settingsStore.usingSocket)
const batchSizeUi = ref(settingsStore.batchSize)
const batchSizeForSocketUi = ref(settingsStore.batchSizeForSocket)
const appendBatchTimeoutUi = ref(settingsStore.appendBatchTimeout)

const setBatchSizeForSocket = (value: Arrayable<number>) => {
	logsStore.setBatchSizeForSocket(value as number)
	settingsStore.batchSizeForSocket = value as number
}

const setAppendBatchTimeout = (value: Arrayable<number>) => {
    logsStore.setAppendBatchTimeout(value as number)
	settingsStore.appendBatchTimeout = value as number
}

const setBatchSizeForFetch = (value: Arrayable<number>) => {
	logsStore.setBatchSizeForFetch(value as number)
	settingsStore.batchSize = value as number
}

const setSocketUsage = () => {

	settingsStore.usingSocket = socketUsage.value

	if (socketUsage.value) {
		logsStore.connect(UseConnectionEnum.Connect)
	}
	else {
		logsStore.connect(UseConnectionEnum.NotAndDisconnect)
	}
}


let treeHeight = ref(window.innerHeight - 150)

const updateHeight = () => {
    treeHeight.value = window.innerHeight - 150
}
const updateWidth = () => {
	x.value = right.value - 400

}

onMounted(() => {
	console.log(tabsHackRef.value)
    window.addEventListener('resize', updateWidth);
    window.addEventListener('resize', updateHeight);
})

onUnmounted(() => {
    window.addEventListener('resize', updateWidth);
    window.removeEventListener('resize', updateHeight);
})



</script>

<style lang="scss">
.hack { }
.el-tabs__item:has(.hack).is-active {
	@apply bg-neutral-900 #{!important};
}

</style>
<style scoped lang="scss">

.scroll {
	@apply p-4 overflow-auto;
	height: calc(100vh - 118px);
}

.aside {
	height: calc(100vh - 48px);
}

</style>
