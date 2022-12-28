import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { MaxUint256, Zero } from "@ethersproject/constants";
import { AbiHandler, AbiHandlerInterface } from "../../index";

import ERC20_ABI from "../abis/erc20.json";
import { Erc20 } from "../abis/types";
import { TEST_CONTRACT_ADDRESS, TOKEN_BALANCE } from "../data";
import { CallOverrides } from "ethers";

export const tokenBalance = BigNumber.from(10).pow(16);

export class Erc20AbiHandler
  extends AbiHandler<Erc20>
  implements AbiHandlerInterface<Erc20>
{
  abi = ERC20_ABI;
  allowedList: string[] = [];

  async allowance(
    _owner: string,
    _spender: string,
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return this.allowedList.includes(_spender) ? MaxUint256 : Zero;
  }

  async approve(
    _spender: string,
    _value: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<boolean> {
    this.allowedList.push(_spender);
    return true;
  }

  async balanceOf(
    _owner: string,
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return TOKEN_BALANCE;
  }

  decimals(overrides: CallOverrides | undefined): Promise<number> {
    throw new Error("Method not implemented.");
  }

  name(overrides: CallOverrides | undefined): Promise<string> {
    throw new Error("Method not implemented.");
  }

  symbol(overrides: CallOverrides | undefined): Promise<string> {
    throw new Error("Method not implemented.");
  }

  totalSupply(overrides: CallOverrides | undefined): Promise<BigNumber> {
    throw new Error("Method not implemented.");
  }

  transfer(
    _to: string,
    _value: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  transferFrom(
    _from: string,
    _to: string,
    _value: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}

export class Erc20AbiHandlerAllowAll extends Erc20AbiHandler {
  async allowance(
    _owner: string,
    _spender: string,
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    if (_spender === TEST_CONTRACT_ADDRESS) {
      return MaxUint256;
    }
    return Zero;
  }
}
