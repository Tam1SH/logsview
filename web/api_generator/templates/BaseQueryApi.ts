/* eslint-disable */
/* tslint:disable */

type _ReturnType<T extends Function> = T extends (...args: any) => infer R ? R : any

type RemoveLast<T extends any[]> = 
	T extends [...infer _, infer L] 
		? L
		: T extends [...infer I, (infer _)?] 
			? I
			: never

type Flatten<T> = T extends [infer U] 
	? U 
	: T extends [(infer R)?] 
		? R 
		: T;

type ParametersWithoutLast<F extends Function> = 
	F extends (...args: any) => infer _ 
		? Flatten<RemoveLast<Parameters<F>>> 
		: never

export type ApiUseQueryOptions<TResult> =
	Omit<UseBaseQueryOptions<TResult, Error, TResult, unknown[]>, 'queryKey' | 'queryFn'>

export default class BaseQueryApi<
	TResult,
	TQueryHooksAPIBuilderOptions = ApiUseQueryOptions<TResult>
> {

	private options: Partial<TQueryHooksAPIBuilderOptions> & {
		apiFactory: ApiFactory
	}

	constructor(options: Partial<TQueryHooksAPIBuilderOptions> & { apiFactory: ApiFactory }) {
		this.options = options as any
	}
	
	protected _useQuery<TFunction extends Function, TFactoryFunction extends Function>(
		factory: TFactoryFunction,
		f: TFunction,
		args: () => ParametersWithoutLast<TFunction>,
		options? : {
			formatName? : string
		}
	) {

		const client = factory.call(this.options.apiFactory)

		if (!(f.name in client)) {
			throw new Error(`Method ${f.name} does not exist in the client`);
		}
		
		const queryClient = useQueryClient()
		
		const queryFn = async (): Promise<_ReturnType<typeof f>> => {
			try {
				const args_ = args() 
				// eslint-disable-next-line @typescript-eslint/return-await
				return await (Array.isArray(args_) 
					? f.call(client, ...args() as []) 
					: f.call(client, args())
					)
			}
			catch (error) {
				
				if (error instanceof ResponseError) {
					throw await error.response.json()
				}
				
				// eslint-disable-next-line @typescript-eslint/no-throw-literal
				throw { 
					code: 1,
					innerError: null,
					message: JSON.stringify(error),
					type: 'Unknown'
				} as ApiError
			}
		}

		return {
			query: useQuery<Awaited<ReturnType<typeof queryFn>>, ApiError>({
				queryKey: [options?.formatName ?? f.name],
				queryFn: () => queryFn() as Awaited<ReturnType<typeof queryFn>>,
				throwOnError : false,
				...this.options,

			}),
			remove: () => queryClient.removeQueries({
				queryKey: [options?.formatName ?? f.name]
			})
		}
	}

}