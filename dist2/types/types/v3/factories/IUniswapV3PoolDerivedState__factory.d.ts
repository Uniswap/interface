import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IUniswapV3PoolDerivedState, IUniswapV3PoolDerivedStateInterface } from "../IUniswapV3PoolDerivedState";
export declare class IUniswapV3PoolDerivedState__factory {
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
    static createInterface(): IUniswapV3PoolDerivedStateInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3PoolDerivedState;
}
