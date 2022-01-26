/// <reference types="react" />
declare const multicall: {
    reducerPath: string;
    reducer: import("redux").Reducer<import("@uniswap/redux-multicall").MulticallState, import("redux").AnyAction>;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        addMulticallListeners: (state: import("immer/dist/internal").WritableDraft<import("@uniswap/redux-multicall").MulticallState>, action: {
            payload: import("@uniswap/redux-multicall").MulticallListenerPayload;
            type: string;
        }) => void;
        removeMulticallListeners: (state: import("immer/dist/internal").WritableDraft<import("@uniswap/redux-multicall").MulticallState>, action: {
            payload: import("@uniswap/redux-multicall").MulticallListenerPayload;
            type: string;
        }) => void;
        fetchingMulticallResults: (state: import("immer/dist/internal").WritableDraft<import("@uniswap/redux-multicall").MulticallState>, action: {
            payload: import("@uniswap/redux-multicall").MulticallFetchingPayload;
            type: string;
        }) => void;
        errorFetchingMulticallResults: (state: import("immer/dist/internal").WritableDraft<import("@uniswap/redux-multicall").MulticallState>, action: {
            payload: import("@uniswap/redux-multicall").MulticallFetchingPayload;
            type: string;
        }) => void;
        updateMulticallResults: (state: import("immer/dist/internal").WritableDraft<import("@uniswap/redux-multicall").MulticallState>, action: {
            payload: import("@uniswap/redux-multicall").MulticallResultsPayload;
            type: string;
        }) => void;
    }>;
    hooks: {
        useMultipleContractSingleData: (chainId: number | undefined, latestBlockNumber: number | undefined, addresses: (string | undefined)[], contractInterface: import("@ethersproject/abi").Interface, methodName: string, callInputs?: (string | number | import("ethers").BigNumber | (string | number | import("ethers").BigNumber)[] | undefined)[] | undefined, options?: (Partial<import("@uniswap/redux-multicall").ListenerOptions> & {
            gasRequired?: number | undefined;
        }) | undefined) => import("@uniswap/redux-multicall").CallState[];
        useSingleContractMultipleData: (chainId: number | undefined, latestBlockNumber: number | undefined, contract: import("ethers").Contract | null | undefined, methodName: string, callInputs: ((string | number | import("ethers").BigNumber | (string | number | import("ethers").BigNumber)[] | undefined)[] | undefined)[], options?: (Partial<import("@uniswap/redux-multicall").ListenerOptions> & {
            gasRequired?: number | undefined;
        }) | undefined) => import("@uniswap/redux-multicall").CallState[];
        useSingleContractWithCallData: (chainId: number | undefined, latestBlockNumber: number | undefined, contract: import("ethers").Contract | null | undefined, callDatas: string[], options?: (Partial<import("@uniswap/redux-multicall").ListenerOptions> & {
            gasRequired?: number | undefined;
        }) | undefined) => import("@uniswap/redux-multicall").CallState[];
        useSingleCallResult: (chainId: number | undefined, latestBlockNumber: number | undefined, contract: import("ethers").Contract | null | undefined, methodName: string, inputs?: (string | number | import("ethers").BigNumber | (string | number | import("ethers").BigNumber)[] | undefined)[] | undefined, options?: (Partial<import("@uniswap/redux-multicall").ListenerOptions> & {
            gasRequired?: number | undefined;
        }) | undefined) => import("@uniswap/redux-multicall").CallState;
    };
    Updater: (props: Pick<import("@uniswap/redux-multicall/dist/updater").UpdaterProps, "chainId" | "latestBlockNumber" | "contract" | "isDebug">) => JSX.Element;
};
export declare const store: import("redux").Store<import("redux").EmptyObject & {
    [x: string]: any;
}, import("redux").AnyAction>;
export default multicall;
export declare function MulticallUpdater(): JSX.Element;
