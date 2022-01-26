import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC20PermitAllowed, IERC20PermitAllowedInterface } from "../IERC20PermitAllowed";
export declare class IERC20PermitAllowed__factory {
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
    static createInterface(): IERC20PermitAllowedInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC20PermitAllowed;
}
