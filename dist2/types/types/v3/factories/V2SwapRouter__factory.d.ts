import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { V2SwapRouter, V2SwapRouterInterface } from "../V2SwapRouter";
export declare class V2SwapRouter__factory {
    static readonly abi: ({
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
    } | {
        stateMutability: string;
        type: string;
        inputs?: undefined;
        name?: undefined;
        outputs?: undefined;
    })[];
    static createInterface(): V2SwapRouterInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): V2SwapRouter;
}
