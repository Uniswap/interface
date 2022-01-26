import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IPeripheryPaymentsWithFee, IPeripheryPaymentsWithFeeInterface } from "../IPeripheryPaymentsWithFee";
export declare class IPeripheryPaymentsWithFee__factory {
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
    static createInterface(): IPeripheryPaymentsWithFeeInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IPeripheryPaymentsWithFee;
}
