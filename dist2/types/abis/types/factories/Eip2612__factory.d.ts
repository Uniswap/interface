import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { Eip2612, Eip2612Interface } from "../Eip2612";
export declare class Eip2612__factory {
    static readonly abi: {
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
    }[];
    static createInterface(): Eip2612Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): Eip2612;
}
