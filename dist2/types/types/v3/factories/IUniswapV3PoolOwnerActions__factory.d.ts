import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IUniswapV3PoolOwnerActions, IUniswapV3PoolOwnerActionsInterface } from "../IUniswapV3PoolOwnerActions";
export declare class IUniswapV3PoolOwnerActions__factory {
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
    static createInterface(): IUniswapV3PoolOwnerActionsInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3PoolOwnerActions;
}
