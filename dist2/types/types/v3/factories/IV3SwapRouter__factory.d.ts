import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IV3SwapRouter, IV3SwapRouterInterface } from "../IV3SwapRouter";
export declare class IV3SwapRouter__factory {
    static readonly abi: ({
        inputs: {
            components: {
                internalType: string;
                name: string;
                type: string;
            }[];
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
    } | {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: never[];
        stateMutability: string;
        type: string;
    })[];
    static createInterface(): IV3SwapRouterInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IV3SwapRouter;
}
