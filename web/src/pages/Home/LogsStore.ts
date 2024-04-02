import { LogsApi, type Log, type GetLogsByRangeResponse } from "@/Api/api"
import { useFactoryApi, useQueryAPI } from "@/Api/useQueryApi"
import { useInfiniteQuery, type InfiniteData, useQueryClient } from "@tanstack/vue-query"
import type { ElTreeV2 } from "element-plus"
import { defineStore } from "pinia"
import { v4 } from "uuid"
import { computed, ref, type Ref } from "vue"


export const useLogsStore = defineStore('logs', () => {
	
	const { query, remove } = useQueryAPI().getLogsCount()

	const logsData = useLogs(() => {
		return {
			count,
			offset
		}
	})
	
	const socket = new WebSocket(`ws://localhost:3769/api/listenLogs/${v4()}`)

	const client = useQueryClient()

	let treeRef = ref<InstanceType<typeof ElTreeV2>>()


	socket.onmessage =  (event) => {
		const log = JSON.parse(event.data) as Log

		unshiftLog(log)
	}

	const setCountBatch = (batch: () => number) => {
		countBatch.value = batch
	}

	const setRef = (tree: Ref<InstanceType<typeof ElTreeV2>>) => {
		// eslint-disable-next-line vue/no-ref-as-operand
		treeRef = tree
	}

	const countBatch = ref(() => 0 as number)

	const count = ref(0)
	const offset = ref(0)




	const reload = async () => {
		count.value = countBatch.value()
		offset.value = 0
		logs.value = []

		client.removeQueries({ queryKey: ['getLogs'] })
		remove()
		await query.refetch()
		await fetchLogs()
		treeRef.value?.setData(logs.value)

	}

	const unshiftLog = (log: Log) => {
		count.value = offset.value + 1
		logs.value.unshift(log)
		offset.value += 1
		treeRef.value?.setData(logs.value)
	}

	const fetchLogs = async () => {

		const count_ = countBatch.value()
		count.value = offset.value + count_

		const { data } = await logsData.fetchNextPage()

		offset.value += count_
		
		const lastPage = data?.pages.at(data.pages.length - 1)
		if (lastPage) {
			logs.value.push(...lastPage.logs)
			treeRef.value?.setData(logs.value)
		}
	}

	const logs = ref([] as Log[])

	return { treeRef, logs, fetchLogs, logsCount: query.data, unshiftLog, setRef, reload, isLoading: logsData.isLoading, setCountBatch }
})

type UseLogsParams = {
	count: Ref<number>, 
	offset: Ref<number>
}

function useLogs(args: () => UseLogsParams) {

	const factory = useFactoryApi()

	const logsApi = factory.create(LogsApi)

	return useInfiniteQuery<GetLogsByRangeResponse>({
		queryKey: ['getLogs'],
		enabled : false,
		queryFn: () => {
			const { offset, count } = args()
			
			return logsApi.getLogsByRange({
				start: offset.value,
				end : count.value
			})
		},
		
		getNextPageParam: (_, pages) => {
			return pages.reduce((acc, val) => acc + val.logs.length, 0)
		},

		initialPageParam: []
	})
}
