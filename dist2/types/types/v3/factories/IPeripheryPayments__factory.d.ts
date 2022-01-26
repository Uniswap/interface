import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IPeripheryPayments, IPeripheryPaymentsInterface } from "../IPeripheryPayments";
export declare class IPeripheryPayments__factory {
    static readonly abi: {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: never[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): IPeripheryPaymentsInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IPeripheryPayments;
}
