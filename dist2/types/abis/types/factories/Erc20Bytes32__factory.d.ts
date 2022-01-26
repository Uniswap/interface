import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { Erc20Bytes32, Erc20Bytes32Interface } from "../Erc20Bytes32";
export declare class Erc20Bytes32__factory {
    static readonly abi: {
        constant: boolean;
        inputs: never[];
        name: string;
        outputs: {
            name: string;
            type: string;
        }[];
        payable: boolean;
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): Erc20Bytes32Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): Erc20Bytes32;
}
