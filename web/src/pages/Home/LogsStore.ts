import { LogsApi, type Log, type GetLogsByRangeResponse } from "@/Api/api"
import { useFactoryApi, useQueryAPI } from "@/Api/useQueryApi"
import { useInfiniteQuery,  useQueryClient } from "@tanstack/vue-query"
import { ElNotification } from "element-plus"
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

    const _onSetData = ref((() => {}) as (data: LogItem[]) => void)

    function onSetData(fn: (data: LogItem[]) => void) {
        _onSetData.value = fn
    }

    function checkIsLast(log: Log) {

        const lastLog = logs.value.at(-1)
        
        if (lastLog) {
            return lastLog.log.time.getTime() === log.time.getTime()
        }
        
        return false
    }

    async function reset() {

        logs.value = []
        socketHandler.reset()
        fetcher.reset()

        remove()
        await query.refetch()
        await fetchNextPageLogs()
        _onSetData.value(logs.value)
    }

    function appendLogs(log: LogItem[]) {
        logs.value.push(...log)
        _onSetData.value(logs.value)
    }

    function unshiftLogs(log: LogItem[]) {
        logs.value.unshift(...log)
        fetcher.addOffset(log.length)
        _onSetData.value(logs.value)
    }

    const fetchNextPageLogs = async () => fetcher.fetchLogs()

    return { 
        logs, 
        fetchNextPageLogs, 
        logsCount: totalLogsCount, 
        unshiftLog: unshiftLogs, 
        onSetData,
        reload: reset, 
        checkIsLast,
        isLoading: fetcher.isLoading, 
        setBatchSizeForFetch: fetcher.setBatchSizeForFetch,
        setAppendBatchTimeout: socketHandler.setAppendBatchTimeout,
        setBatchSizeForSocket: socketHandler.setBatchSizeForSocket,
        connect: (usage: UseConnectionEnum) => socketHandler.connect(usage, 0)
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

    const { query: { data: logsTotalCount }, remove } = useQueryAPI().getLogsCount()

    const countBatch = ref(0)

    const count = ref(0)
    const offset = ref(0)

    const logsData = useLogs(() => {
        return {
            count,
            offset
        }
    })

    function addOffset(offset_: number) {
        offset.value = offset_
    }

    function setBatchSizeForFetch(batch: number) {
        countBatch.value = batch
    }

    async function fetchLogs() {

        if(logsTotalCount.value?.count) {
            if(logsTotalCount.value.count <= offset.value) {
                return
            }
        }


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

    function reset() {
        offset.value = 0
        count.value = countBatch.value
        remove()
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

export enum UseConnectionEnum {
    Connect,
    NotAndDisconnect
}

function useSocketHandler({ unshiftLogs } : SocketHandlerParams) {

    let socket: WebSocket | null = null
	let closedSelf = false
    const logBatch = ref([] as LogItem[])
    const socketLogsCount = ref(0)
    const appendBatchInterval = ref(0)
    const batchSize = ref(0)
    
    let intervalId: NodeJS.Timeout | null = null	
  
    function connect(usage: UseConnectionEnum, countConnectionRetry = 0) {

        if (usage === UseConnectionEnum.Connect) {
			
            socket = new WebSocket(`ws://localhost:3769${import.meta.env.VITE_BASE_PATH}/api/listenLogs/${v4()}`)

            socket.onopen = () => {
                countConnectionRetry = 0
            }

            socket.onclose = () => {
				
				if (closedSelf)
					return

                if (countConnectionRetry <= 3) {
                    //for prevent stack growing
                    setTimeout(() => connect(usage, ++countConnectionRetry))
                }
                else {
                    ElNotification({
                        type: 'error',
                        message: 'The socket cannot establish a connection',
                        duration: 0
                    })
                }
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
        }

        if (usage === UseConnectionEnum.NotAndDisconnect) {
			closedSelf = true
            socket?.close()
            socket = null
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

                        const logsToUnshift = batchSize.value === 0 
                            ? logBatch.value 
                            : logBatch.value.splice(0, batchSize.value)
                        
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
        reset,
        connect
    }
}
  
