
import moment from 'moment'

export const getLogLevelColor = (logLevel: "debug" | "info" | "warning" | "error" | "critical") => {
	switch (logLevel) {
		case "debug":
			return "text-green-500"
		case "info":
			return "text-blue-500"
		case "warning":
			return "text-orange-500"
		case "error":
			return "text-red-500"
		case "critical":
			return "text-violet-500"
		default:
			return "text-white"
	}
  };

export const formatDate = (date: Date) => moment(date).format('DD.MM.YY HH:mm:ss.SSS')