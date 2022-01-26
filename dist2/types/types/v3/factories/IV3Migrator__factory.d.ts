import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IV3Migrator, IV3MigratorInterface } from "../IV3Migrator";
export declare class IV3Migrator__factory {
    static readonly abi: ({
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
    } | {
        inputs: {
            components: {
                internalType: string;
                name: string;
                type: string;
            }[];
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: never[];
        stateMutability: string;
        type: string;
    })[];
    static createInterface(): IV3MigratorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IV3Migrator;
}
