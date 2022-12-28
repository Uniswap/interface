import { BigNumber } from "@ethersproject/bignumber";
import { BytesLike, hexStripZeros } from "@ethersproject/bytes";
import { BaseContract } from "@ethersproject/contracts";
import { Interface } from "@ethersproject/abi";

const InputDataDecoder = require("ethereum-input-data-decoder");

export function encodeFunctionResult<T extends BaseContract>(
  abi: any,
  funcName: string,
  result: (BigNumber | string | number)[]
) {
  const iface = new Interface(abi);
  return iface.encodeFunctionResult(funcName, result);
}

export function decodeFunctionResult<T extends BaseContract>(
  abi: any,
  funcName: string,
  result: BytesLike
) {
  const iface = new Interface(abi);
  return iface.decodeFunctionResult(funcName, result);
}

export type DecodedCall<T extends BaseContract> = {
  inputs: any[];
  method: keyof T["functions"];
  names: any[];
  types: any[];
};

export function encodeFunctionData<T extends BaseContract>(
  abi: any,
  funcName: string,
  values?: ReadonlyArray<any>
) {
  const iface = new Interface(abi);
  return iface.encodeFunctionData(funcName, values);
}

export function decodeFunctionCall(abi: any, input: BytesLike) {
  const decoder = new InputDataDecoder(abi);
  const { method } = decoder.decodeData(input);
  const iface = new Interface(abi);
  return {
    method,
    inputs: iface.decodeFunctionData(method, input),
  };
}

export function formatChainId(chainId: string) {
  return hexStripZeros(BigNumber.from(chainId).toHexString());
}
