import { LogsApi, type Log, type GetLogsByRangeResponse, type GetLogsCountResponse } from "@/Api/api"
import { useFactoryApi, useQueryAPI } from "@/Api/useQueryApi"
import { useInfiniteQuery, type InfiniteData, useQueryClient } from "@tanstack/vue-query"
import { ElNotification, type ElTreeV2 } from "element-plus"
import { defineStore } from "pinia"
import { v4 } from "uuid"
import { computed, ref, type Ref } from "vue"


export type LogItem = {
	id: number,
	log: Log
}

export const useLogsStore = defineStore('logs', () => {
	
	const { query, remove } = useQueryAPI().getLogsCount()

	const logs = ref([] as LogItem[])

	const totalLogsCount = computed(() => {
		const fromDb = query.data?.value?.count ?? 0 
		const fromSocket = socketHandler.socketLogsCount.value
		
		return fromDb + fromSocket
	})

	const socketHandler = useSocketHandler({ unshiftLogs })
	const fetcher = useFetchHandler({ appendLogs })

	let treeRef = ref<InstanceType<typeof ElTreeV2>>()

	const setRef = (tree: Ref<InstanceType<typeof ElTreeV2>>) => {
		// eslint-disable-next-line vue/no-ref-as-operand
		treeRef = tree
	}

	const reset = async () => {

		logs.value = []
		socketHandler.reset()
		fetcher.reset()

		remove()
		await query.refetch()
		await fetchLogs()
		treeRef.value?.setData(logs.value)
	}

	function appendLogs(log: LogItem[]) {
		logs.value.push(...log)
		treeRef.value?.setData(logs.value)
	}

	function unshiftLogs(log: LogItem[]) {
		logs.value.unshift(...log)
		fetcher.addOffset(log.length)
		treeRef.value?.setData(logs.value)
	}

	const fetchLogs = async () => fetcher.fetchLogs()

	return { 
		treeRef, 
		logs, 
		fetchLogs, 
		logsCount: totalLogsCount, 
		unshiftLog: unshiftLogs, 
		setRef, 
		reload: reset, 
		isLoading: fetcher.isLoading, 
		setBatchSizeForFetch: fetcher.setBatchSizeForFetch,
		setAppendBatchTimeout: socketHandler.setAppendBatchTimeout,
		setBatchSizeForSocket: socketHandler.setBatchSizeForSocket
	}
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

type FetchHandlerParams = {
	appendLogs: (logs: LogItem[]) => void
}

function useFetchHandler({ appendLogs }: FetchHandlerParams) {

	const countBatch = ref(0)

	const count = ref(0)
	const offset = ref(0)

	const logsData = useLogs(() => {
		return {
			count,
			offset
		}
	})

	const addOffset = (offset_: number) => {
		offset.value = offset_
	}

	const setBatchSizeForFetch = (batch: number) => {
		countBatch.value = batch
	}

	const fetchLogs = async () => {

		count.value = offset.value + countBatch.value

		const { data } = await logsData.fetchNextPage()

		offset.value += countBatch.value
		
		const logs = data?.pages.at(data.pages.length - 1)
			?.logs.map(l => { return { id: l.time.getTime(), log: l } as LogItem })

		if (logs) {
			appendLogs(logs)
		}
	}

	const client = useQueryClient()

	const reset = () => {
		offset.value = 0
		count.value = countBatch.value
		client.removeQueries({ queryKey: ['getLogs'] })
	}
	return {
		fetchLogs,
		setBatchSizeForFetch,
		reset,
		addOffset,
		isLoading: logsData.isLoading
	}
}

type SocketHandlerParams = {
	unshiftLogs: (logs: LogItem[]) => void 
}

function useSocketHandler({ unshiftLogs } : SocketHandlerParams) {

	const socket = new WebSocket(`ws://localhost:3769/api/listenLogs/${v4()}`)
	const logBatch = ref([] as LogItem[])
	const socketLogsCount = ref(0)
	const appendBatchInterval = ref(0)
	const batchSize = ref(0)
	
	let intervalId: NodeJS.Timeout | null = null	
  
	socket.onclose = () => {
		ElNotification({
			type: 'error',
			message: 'Socket connection closed',
		})
	}

	socket.onmessage = (event) => {
		const log = JSON.parse(event.data) as Omit<Log, 'time'> & { time: string }
		const log_ = { 
			...log,
			time: new Date(log.time)
		}
  
		const item = { id: log_.time.getTime(), log: log_ } as LogItem
	
		logBatch.value.push(item)
			
		if (appendBatchInterval.value === 0) {
			unshiftLogs([item])
		}
	}
  
	function setAppendBatchTimeout(batchTimeout: number) {
		appendBatchInterval.value = batchTimeout

		if (batchTimeout === 0) {
			if (intervalId) {
				clearInterval(intervalId)
				intervalId = null
			}
		} else {
			if (!intervalId) {
				intervalId = setInterval(() => {
					if (logBatch.value.length > 0) {

						const logsToUnshift = batchSize.value === 0 ? logBatch.value : logBatch.value.splice(0, batchSize.value)
						unshiftLogs(logsToUnshift)

						socketLogsCount.value += logsToUnshift.length
						
						if (batchSize.value === 0) {
							logBatch.value = []
						}
					}
				}, appendBatchInterval.value)
			}
		}
	}

	function reset() {
		logBatch.value = []
		socketLogsCount.value = 0
	}

	function setBatchSizeForSocket(size: number) {
		batchSize.value = size
	}

	return {
		socket,
		logBatch,
		socketLogsCount,
		appendBatchInterval,
		batchSize,
		setAppendBatchTimeout,
		setBatchSizeForSocket,
		reset
	}
}
  
