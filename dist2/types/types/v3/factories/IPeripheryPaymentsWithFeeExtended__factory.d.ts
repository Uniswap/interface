import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IPeripheryPaymentsWithFeeExtended, IPeripheryPaymentsWithFeeExtendedInterface } from "../IPeripheryPaymentsWithFeeExtended";
export declare class IPeripheryPaymentsWithFeeExtended__factory {
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
    static createInterface(): IPeripheryPaymentsWithFeeExtendedInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IPeripheryPaymentsWithFeeExtended;
}
