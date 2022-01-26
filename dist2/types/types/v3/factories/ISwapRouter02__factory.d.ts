import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ISwapRouter02, ISwapRouter02Interface } from "../ISwapRouter02";
export declare class ISwapRouter02__factory {
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
    })[];
    static createInterface(): ISwapRouter02Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): ISwapRouter02;
}
