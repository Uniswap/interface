import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ArgentWalletContract, ArgentWalletContractInterface } from "../ArgentWalletContract";
export declare class ArgentWalletContract__factory {
    static readonly abi: ({
        inputs: {
            components: {
                internalType: string;
                name: string;
                type: string;
            }[];
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
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    })[];
    static createInterface(): ArgentWalletContractInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ArgentWalletContract;
}
