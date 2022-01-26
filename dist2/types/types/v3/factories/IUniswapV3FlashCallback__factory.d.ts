import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IUniswapV3FlashCallback, IUniswapV3FlashCallbackInterface } from "../IUniswapV3FlashCallback";
export declare class IUniswapV3FlashCallback__factory {
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
    static createInterface(): IUniswapV3FlashCallbackInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3FlashCallback;
}
