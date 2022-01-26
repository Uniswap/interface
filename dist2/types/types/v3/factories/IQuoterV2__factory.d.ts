import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IQuoterV2, IQuoterV2Interface } from "../IQuoterV2";
export declare class IQuoterV2__factory {
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
    static createInterface(): IQuoterV2Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): IQuoterV2;
}
