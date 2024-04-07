import { defineStore } from "pinia"
import { computed } from "vue"



export const useSettingsStore = defineStore('settings', () => {
	
	const batchSizeForSocket = computed({
		get: () => parseInt(localStorage.getItem('batchSizeForSocket') ?? '100'),
		set: (val) => {
			localStorage.setItem('batchSizeForSocket', val.toString())
		}
	})


	const appendBatchTimeout = computed({
		get: () => parseInt(localStorage.getItem('appendBatchTimeout') ?? '1000'),
		set: (val) => {
			localStorage.setItem('appendBatchTimeout', val.toString())
		}
	})

	const usingSocket = computed({
		get: () => (localStorage.getItem('usingSocket') ?? 'true') === 'true',
		set: (val) => {
			localStorage.setItem('usingSocket', val.toString())
		}
	})

	const batchSize = computed({
		get: () => parseInt(localStorage.getItem('batchSizeForFetch') ?? '200'),
		set: (val) => {
			localStorage.setItem('batchSizeForFetch', val.toString())
		}
	})

	return {
		batchSize,
		usingSocket,
		batchSizeForSocket,
		appendBatchTimeout
	}
})