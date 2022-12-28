import {Wallet} from "@ethersproject/wallet";
import {BigNumber} from "@ethersproject/bignumber";

export const TEST_PRIVATE_KEY =
    "0xe580410d7c37d26c6ad1a837bbae46bc27f9066a466fb3a66e770523b4666d19";
export const TEST_ADDRESS_NEVER_USE = new Wallet(TEST_PRIVATE_KEY).address;
export const TEST_ERC20_CONTRACT_ADDRESS = "0x15F2d9E865f8b2FFF525fE07c9cAdC7855F93eF7"
export const TEST_MULTICALL_CONTRACT_ADDRESS = "0x0Ad0ea0377DA534941AF360607884927E3a03c8c"
export const TEST_CONTRACT_ADDRESS = "0x1184a2e723E1EC42fAe4AeA53f4805D502CCeF92"
export const CHAIN_ID = 30;
export const TOKEN_BALANCE = BigNumber.from(10).pow(16);
