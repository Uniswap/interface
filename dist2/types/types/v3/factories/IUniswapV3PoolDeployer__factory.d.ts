import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IUniswapV3PoolDeployer, IUniswapV3PoolDeployerInterface } from "../IUniswapV3PoolDeployer";
export declare class IUniswapV3PoolDeployer__factory {
    static readonly abi: {
        inputs: never[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): IUniswapV3PoolDeployerInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3PoolDeployer;
}
