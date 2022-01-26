import { Web3ReactHooks } from 'widgets-web3-react/core';
import { Connector } from 'widgets-web3-react/types';
export declare type Web3ReactState = [Connector, Web3ReactHooks];
export declare const urlAtom: import("jotai").WritableAtom<Web3ReactState, typeof import("jotai/utils").RESET | (Web3ReactState | ((prev: Web3ReactState) => Web3ReactState)), void>;
export declare const injectedAtom: import("jotai").WritableAtom<Web3ReactState, typeof import("jotai/utils").RESET | (Web3ReactState | ((prev: Web3ReactState) => Web3ReactState)), void>;
