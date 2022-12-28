import { BaseContract } from "@ethersproject/contracts";
import { MetamocksContext } from "./index";
import { BytesLike } from "@ethersproject/bytes";

export declare type BaseHandlerInterface = {
  abi: any[];
  context: MetamocksContext;
  handleCall(
    data: BytesLike,
    setResult?: (result: string) => void
  ): Promise<void>;
  handleTransaction(
    data: BytesLike,
    setResult: (arg0: string) => void
  ): Promise<void>;
};
export declare type AbiHandlerMethods<T extends BaseContract> = T["callStatic"];
export declare type AbiHandlerInterface<T extends BaseContract> =
  AbiHandlerMethods<T> & BaseHandlerInterface;
