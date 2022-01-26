import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IUniswapV3PoolActions, IUniswapV3PoolActionsInterface } from "../IUniswapV3PoolActions";
export declare class IUniswapV3PoolActions__factory {
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
    static createInterface(): IUniswapV3PoolActionsInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3PoolActions;
}
