import z from 'zod'

export const logEntrySchema = z.object({
    time: z.coerce.date(),
    level: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']),
    request_id: z.string(),
    title: z.string(),
    service_name: z.string().optional(),
    controller_name: z.string().optional(),
    message: z.record(z.string()).optional(),
    additional_data: z.record(z.string()).optional(),
})


export type LogEntry = z.infer<typeof logEntrySchema>

export default class Log {
	constructor(
		readonly time: Date,
		readonly level: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL",
		readonly request_id: string,
		readonly title: string,
		readonly service_name?: string,
		readonly controller_name?: string,
		readonly message?: Record<string, string>,
		readonly additional_data?: Record<string, string>
	) {}

	static fromJSON(json: LogEntry) {
		
		return new Log(
			json.time, 
			json.level, 
			json.request_id, 
			json.title, 
			json.service_name, 
			json.controller_name, 
			json.message, 
			json.additional_data
		)
	}
}



