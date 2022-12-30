import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { CallOverrides } from "ethers";

import { Weth } from "../../../src/abis/types";
import WETH_ABI from "../../../src/abis/weth.json";
import { AbiHandler, AbiHandlerInterface } from "../../metamocks/index";

export default class WethMockContract
  extends AbiHandler<Weth>
  implements AbiHandlerInterface<Weth>
{
  abi = WETH_ABI;

  allowance(
    arg0: string,
    arg1: string,
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return Promise.resolve(BigNumber.from(0));
  }

  approve(
    guy: string,
    wad: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<boolean> {
    return Promise.resolve(false);
  }

  balanceOf(
    arg0: string,
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return Promise.resolve(BigNumber.from(10).pow(18));
  }

  decimals(overrides: CallOverrides | undefined): Promise<number> {
    return Promise.resolve(0);
  }

  deposit(overrides: CallOverrides | undefined): Promise<void> {
    return Promise.resolve(undefined);
  }

  name(overrides: CallOverrides | undefined): Promise<string> {
    return Promise.resolve("");
  }

  symbol(overrides: CallOverrides | undefined): Promise<string> {
    return Promise.resolve("");
  }

  totalSupply(overrides: CallOverrides | undefined): Promise<BigNumber> {
    return Promise.resolve(BigNumber.from(0));
  }

  transfer(
    dst: string,
    wad: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<boolean> {
    return Promise.resolve(false);
  }

  transferFrom(
    src: string,
    dst: string,
    wad: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<boolean> {
    return Promise.resolve(false);
  }

  withdraw(
    wad: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined);
  }
}
