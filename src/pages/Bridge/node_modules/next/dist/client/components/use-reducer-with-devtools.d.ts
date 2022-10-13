import type { reducer } from './reducer';
import type { ReducerAction, Dispatch } from 'react';
declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION__: any;
    }
}
export declare function useReducerWithReduxDevtools(fn: typeof reducer, initialState: ReturnType<typeof reducer>): [
    ReturnType<typeof reducer>,
    Dispatch<ReducerAction<typeof reducer>>,
    () => void
];
