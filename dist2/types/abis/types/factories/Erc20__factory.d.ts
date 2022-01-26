import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { Erc20, Erc20Interface } from "../Erc20";
export declare class Erc20__factory {
    static readonly abi: ({
        constant: boolean;
        inputs: {
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            name: string;
            type: string;
        }[];
        payable: boolean;
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    } | {
        payable: boolean;
        stateMutability: string;
        type: string;
        constant?: undefined;
        inputs?: undefined;
        name?: undefined;
        outputs?: undefined;
        anonymous?: undefined;
    } | {
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        constant?: undefined;
        outputs?: undefined;
        payable?: undefined;
        stateMutability?: undefined;
    })[];
    static createInterface(): Erc20Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): Erc20;
}
