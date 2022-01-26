import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC20Minimal, IERC20MinimalInterface } from "../IERC20Minimal";
export declare class IERC20Minimal__factory {
    static readonly abi: ({
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        outputs?: undefined;
        stateMutability?: undefined;
    } | {
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
        anonymous?: undefined;
    })[];
    static createInterface(): IERC20MinimalInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC20Minimal;
}
