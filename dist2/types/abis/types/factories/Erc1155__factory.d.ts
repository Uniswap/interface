import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { Erc1155, Erc1155Interface } from "../Erc1155";
export declare class Erc1155__factory {
    static readonly abi: {
        constant: boolean;
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
        payable: boolean;
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): Erc1155Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): Erc1155;
}
