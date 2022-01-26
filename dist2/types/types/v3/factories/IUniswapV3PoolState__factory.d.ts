import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IUniswapV3PoolState, IUniswapV3PoolStateInterface } from "../IUniswapV3PoolState";
export declare class IUniswapV3PoolState__factory {
    static readonly abi: {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): IUniswapV3PoolStateInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3PoolState;
}
