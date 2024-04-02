import { createFactory, type ApiFactory } from "./ApiFactory"
import type { ApiUseQueryOptions } from "./BaseQueryApi"
import QueryApi from "./QueryApi"

export function useQueryAPI<
	TResult,
	TQueryHooksAPIBuilderOptions = ApiUseQueryOptions<TResult>
	>(options: Partial<TQueryHooksAPIBuilderOptions> & { apiFactory?: ApiFactory } = {}) {
	
	if (!options.apiFactory) {
		options.apiFactory = useFactoryApi()
	}
	
	return new QueryApi<TResult, TQueryHooksAPIBuilderOptions>(
		options as Partial<TQueryHooksAPIBuilderOptions> & { apiFactory: ApiFactory }
	)
}

export function useFactoryApi() {
	return createFactory({
		accessToken: () => '',
	})
}
