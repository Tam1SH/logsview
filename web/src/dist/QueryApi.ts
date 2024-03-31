import BaseQueryApi, { type ApiUseQueryOptions } from "./BaseQueryApi";
import { type UseQueryReturnType } from "@tanstack/vue-query";
import {
	LogsApi,
	type ApiError,
	type GetLogsCountResponse,
	type LogDto,
} from "./api/index";

export default class QueryApi<
	TResult,
	TQueryHooksAPIBuilderOptions = ApiUseQueryOptions<TResult>,
> extends BaseQueryApi<TResult, TQueryHooksAPIBuilderOptions> {
	getLogsCount(args: () => undefined = () => {}): {
		query: UseQueryReturnType<GetLogsCountResponse, ApiError>;
		remove: () => void;
	} {
		return this._useQuery(
			() => this.options.apiFactory.create(LogsApi),
			LogsApi.prototype.getLogsCount,
			args,
		);
	}

	insertLog(args: () => LogDto): {
		query: UseQueryReturnType<any, ApiError>;
		remove: () => void;
	} {
		return this._useQuery(
			() => this.options.apiFactory.create(LogsApi),
			LogsApi.prototype.insertLog,
			args,
		);
	}
}
