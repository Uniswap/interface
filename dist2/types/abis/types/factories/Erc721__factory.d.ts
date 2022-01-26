import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { Erc721, Erc721Interface } from "../Erc721";
export declare class Erc721__factory {
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
    static createInterface(): Erc721Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): Erc721;
}
