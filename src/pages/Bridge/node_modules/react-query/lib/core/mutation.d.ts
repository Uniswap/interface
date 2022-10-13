import type { MutationOptions, MutationStatus, MutationMeta } from './types';
import type { MutationCache } from './mutationCache';
import type { MutationObserver } from './mutationObserver';
import { Logger } from './logger';
import { Removable } from './removable';
interface MutationConfig<TData, TError, TVariables, TContext> {
    mutationId: number;
    mutationCache: MutationCache;
    options: MutationOptions<TData, TError, TVariables, TContext>;
    logger?: Logger;
    defaultOptions?: MutationOptions<TData, TError, TVariables, TContext>;
    state?: MutationState<TData, TError, TVariables, TContext>;
    meta?: MutationMeta;
}
export interface MutationState<TData = unknown, TError = unknown, TVariables = void, TContext = unknown> {
    context: TContext | undefined;
    data: TData | undefined;
    error: TError | null;
    failureCount: number;
    isPaused: boolean;
    status: MutationStatus;
    variables: TVariables | undefined;
}
interface FailedAction {
    type: 'failed';
}
interface LoadingAction<TVariables, TContext> {
    type: 'loading';
    variables?: TVariables;
    context?: TContext;
}
interface SuccessAction<TData> {
    type: 'success';
    data: TData;
}
interface ErrorAction<TError> {
    type: 'error';
    error: TError;
}
interface PauseAction {
    type: 'pause';
}
interface ContinueAction {
    type: 'continue';
}
interface SetStateAction<TData, TError, TVariables, TContext> {
    type: 'setState';
    state: MutationState<TData, TError, TVariables, TContext>;
}
export declare type Action<TData, TError, TVariables, TContext> = ContinueAction | ErrorAction<TError> | FailedAction | LoadingAction<TVariables, TContext> | PauseAction | SetStateAction<TData, TError, TVariables, TContext> | SuccessAction<TData>;
export declare class Mutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown> extends Removable {
    state: MutationState<TData, TError, TVariables, TContext>;
    options: MutationOptions<TData, TError, TVariables, TContext>;
    mutationId: number;
    meta: MutationMeta | undefined;
    private observers;
    private mutationCache;
    private logger;
    private retryer?;
    constructor(config: MutationConfig<TData, TError, TVariables, TContext>);
    setState(state: MutationState<TData, TError, TVariables, TContext>): void;
    addObserver(observer: MutationObserver<any, any, any, any>): void;
    removeObserver(observer: MutationObserver<any, any, any, any>): void;
    protected optionalRemove(): void;
    continue(): Promise<TData>;
    execute(): Promise<TData>;
    private dispatch;
}
export declare function getDefaultState<TData, TError, TVariables, TContext>(): MutationState<TData, TError, TVariables, TContext>;
export {};
