import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC1271, IERC1271Interface } from "../IERC1271";
export declare class IERC1271__factory {
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
    static createInterface(): IERC1271Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC1271;
}
