<template>

	<el-popover
		placement="bottom"
		title="Title"
		:width="700"
		trigger="click"
	>
		<template #reference>
			<div class="flex gap-1 w-full h-[26px]">
				<span :class="getLogLevelColor(log.level)">[{{ log.level }}]</span>
				<span class="text-cyan-500">[{{ formatDate(log.time) }}]</span>
				<div class="w-2/3 flex">
					<span class="text-ellipsis overflow-hidden whitespace-nowrap w-full">{{ log.title }}</span>
				</div>
			</div>
		</template>
			<div class="flex flex-col">
				<span>Message: {{ log.message }}</span>
				<span>Data: {{ log.additional_data }}</span>
			</div>
	</el-popover>

</template>

<script setup lang="ts">
import Log from './Log'
import moment from 'moment'

const { log } = defineProps({ 
	log: {
		type: Log,
		required: true
	}
})

const getLogLevelColor = (logLevel: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL") => {
  switch (logLevel) {
    case "DEBUG":
      return "text-green-500"
    case "INFO":
      return "text-blue-500"
    case "WARNING":
      return "text-orange-500"
    case "ERROR":
      return "text-red-500"
    case "CRITICAL":
      return "text-violet-500"
    default:
      return "text-white"
  }
};


//use thirdparty lib with ~62 kb size for only one function? :D
const formatDate = (date: Date) => moment(date).format('DD.MM.YY HH:mm:ss.SSS')
</script>


<style lang="scss" scoped>
.expansion {
	@apply bg-transparent shadow-none;
}
</style>
