import { PersistQueryClientOptions } from './persist';
import { QueryClientProviderProps } from '../reactjs';
export declare type PersistQueryClientProviderProps = QueryClientProviderProps & {
    persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>;
    onSuccess?: () => void;
};
export declare const PersistQueryClientProvider: ({ client, children, persistOptions, onSuccess, ...props }: PersistQueryClientProviderProps) => JSX.Element;
