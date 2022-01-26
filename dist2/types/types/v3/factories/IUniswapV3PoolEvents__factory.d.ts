import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IUniswapV3PoolEvents, IUniswapV3PoolEventsInterface } from "../IUniswapV3PoolEvents";
export declare class IUniswapV3PoolEvents__factory {
    static readonly abi: {
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
    }[];
    static createInterface(): IUniswapV3PoolEventsInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3PoolEvents;
}
