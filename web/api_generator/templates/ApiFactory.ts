import { BaseAPI, Configuration, type HTTPHeaders } from './api/runtime'

export type ApiFactoryConstructorParams = { 
	accessToken? : string | Promise<string> | ((name?: string | undefined, scopes?: string[] | undefined) => string | Promise<string>) | undefined,
	refreshAccessToken?: () => Promise<String>,
	headers? : HTTPHeaders,
	readonly _fetch?: (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>,
	basePath?: string
}

export class ApiFactory {
	config : Configuration
	readonly refreshAccessToken: (() => Promise<String>) | undefined
	
	constructor({
		accessToken,
		headers,
		refreshAccessToken,
		_fetch = ApiFactory.getFetch(),
		basePath = ApiFactory.baseUrl()
	}: ApiFactoryConstructorParams) {

		this.config = new Configuration({
			basePath,
			fetchApi : _fetch,
			accessToken,
			headers

		})
		this.refreshAccessToken = refreshAccessToken
	}

	
	create<TClient extends BaseAPI>(
		ClientClass: new (configuration?: Configuration | undefined) => TClient
	) {
		return new ClientClass(this.config)
	}

	//TODO: its needed only for SSR
	static baseUrl() {
		return import.meta.env.VITE_BASE_PATH;
	}
	
	private static getFetch() {
		return typeof window === 'undefined' 
			? fetch
			: window.fetch.bind(window)
	}

}


export const createFactory = (params?: ApiFactoryConstructorParams) => new ApiFactory({ 
	accessToken: params?.accessToken, 
	refreshAccessToken: params?.refreshAccessToken,
	headers: params?.headers,
	_fetch: params?._fetch,
	basePath: params?.basePath
})
