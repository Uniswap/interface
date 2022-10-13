import { GetProviderArgs, Provider } from '@wagmi/core';
export declare type UseProviderArgs = Partial<GetProviderArgs>;
export declare function useProvider<TProvider extends Provider>({ chainId, }?: UseProviderArgs): TProvider;
