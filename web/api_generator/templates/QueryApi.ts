export default class QueryApi<
  TResult,
  TQueryHooksAPIBuilderOptions = ApiUseQueryOptions<TResult>,
> extends BaseQueryApi<TResult, TQueryHooksAPIBuilderOptions> {
  getLogsCount(args: () => undefined = () => {}): Promise<number> {
    return this._useQuery(
      () => this.options.apiFactory.create(LogsApi),
      LogsApi.prototype.getLogsCount,
      args,
    );
  }
  insertLog(args: () => LogDto): Promise<any> {
    return this._useQuery(
      () => this.options.apiFactory.create(LogsApi),
      LogsApi.prototype.insertLog,
      args,
    );
  }
}
