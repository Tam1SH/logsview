
<template>
	<main class="w-full h-full">
		<div class="h-full flex">
			<div class="w-2/3 h-full">
				<section class="h-10 bg-neutral-800 border-b border-b-neutral-700">
					<div class="">

					</div>
				</section>
				<section class="flex">
					<div class="ml-auto mr-2 gap-1 flex justify-center">
						<div class="m-auto">
							<Refresh 
								@click="logsStore.reload()"
								class="h-6 w-4 text-neutral-500 cursor-pointer "
								:class="{ 'animate-spin': logsStore.isLoading }"
							/>
						</div>
						<span class="text-neutral-500">|</span>
						<span class="ml-auto mr-2 text-neutral-500">{{ logsStore.logs.length }} of {{ logsStore.logsCount?.count ?? 0 }}</span>
					</div>	
				</section>
				<div class="scroll">
					<el-tree-v2
						ref="treeRef"
						:height="treeHeight"
						:width="700"
					>
					<template #default="{ node }">
						<LogView :log="node.data" />
					</template>
					</el-tree-v2>
				</div>

			</div>

			<aside class="aside w-1/3 flex bg-neutral-800 border border-t-0 border-neutral-700">
				<el-button
					@click="() => logsStore.fetchLogs()"
				>
				</el-button>
			</aside>
		</div>

	</main>
	
</template>


<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { ref, onMounted, onUnmounted, type Ref, onUpdated } from 'vue'
import LogView from './components/LogView.vue'
import { type Log } from '@/Api/api'
import { useLogsStore } from './LogsStore'
import type { ElTreeV2 } from 'element-plus'


const logsStore = useLogsStore()

const treeRef = ref<InstanceType<typeof ElTreeV2>>()

logsStore.setRef(treeRef as Ref<InstanceType<typeof ElTreeV2>>)

logsStore.setCountBatch(() => 10)
logsStore.fetchLogs()


let treeHeight = ref(window.innerHeight - 150)

const updateHeight = () => {
    treeHeight.value = window.innerHeight - 150
}


onUpdated(() => {
	console.log(logsStore.logsCount)
})
onMounted(async () => {
    window.addEventListener('resize', updateHeight);
})

onUnmounted(() => {
    window.removeEventListener('resize', updateHeight);
})

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
