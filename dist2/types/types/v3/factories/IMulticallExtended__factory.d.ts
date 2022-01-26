import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IMulticallExtended, IMulticallExtendedInterface } from "../IMulticallExtended";
export declare class IMulticallExtended__factory {
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
    static createInterface(): IMulticallExtendedInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IMulticallExtended;
}
