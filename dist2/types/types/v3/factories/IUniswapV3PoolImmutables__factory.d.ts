import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IUniswapV3PoolImmutables, IUniswapV3PoolImmutablesInterface } from "../IUniswapV3PoolImmutables";
export declare class IUniswapV3PoolImmutables__factory {
    static readonly abi: {
        inputs: never[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): IUniswapV3PoolImmutablesInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3PoolImmutables;
}
