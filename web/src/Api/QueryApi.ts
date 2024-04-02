/* tslint:disable */
/* eslint-disable */

import BaseQueryApi, {
	type ApiUseQueryOptions,
	type UseQueryReturnWrapperType,
} from "./BaseQueryApi";
import {
	LogsApi,
	type GetLogsByRangeModel,
	type GetLogsByRangeResponse,
	type GetLogsCountResponse,
	type LogDto,
} from "./api/index";

export default class QueryApi<
	TResult,
	TQueryHooksAPIBuilderOptions = ApiUseQueryOptions<TResult>,
> extends BaseQueryApi<TResult, TQueryHooksAPIBuilderOptions> {
	getLogsByRange(
		args: () => GetLogsByRangeModel,
	): UseQueryReturnWrapperType<GetLogsByRangeResponse> {
		return this._useQuery(
			() => this.options.apiFactory.create(LogsApi),
			LogsApi.prototype.getLogsByRange,
			args,
		);
	}
	getLogsCount(
		args: () => undefined = () => {},
	): UseQueryReturnWrapperType<GetLogsCountResponse> {
		return this._useQuery(
			() => this.options.apiFactory.create(LogsApi),
			LogsApi.prototype.getLogsCount,
			args,
		);
	}
	insertLog(args: () => LogDto): UseQueryReturnWrapperType<any> {
		return this._useQuery(
			() => this.options.apiFactory.create(LogsApi),
			LogsApi.prototype.insertLog,
			args,
		);
	}
}
