import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";
import { CallOverrides } from "ethers";

import ENS_ABI from "../../../src/abis/ens-registrar.json";
import { EnsRegistrar } from "../../../src/abis/types";
import { AbiHandler, AbiHandlerInterface } from "../../metamocks/index";
import { TEST_ADDRESS_NEVER_USE } from "../../metamocks/test-utils/data";

export default class EnsRegistrarMockContract
  extends AbiHandler<EnsRegistrar>
  implements AbiHandlerInterface<EnsRegistrar>
{
  abi = ENS_ABI;

  isApprovedForAll(
    owner: string,
    operator: string,
    overrides: CallOverrides | undefined
  ): Promise<boolean> {
    return Promise.resolve(false);
  }

  old(overrides: CallOverrides | undefined): Promise<string> {
    return Promise.resolve("");
  }

  owner(
    node: BytesLike,
    overrides: CallOverrides | undefined
  ): Promise<string> {
    return Promise.resolve("");
  }

  recordExists(
    node: BytesLike,
    overrides: CallOverrides | undefined
  ): Promise<boolean> {
    return Promise.resolve(false);
  }

  resolver(
    node: BytesLike,
    overrides: CallOverrides | undefined
  ): Promise<string> {
    return Promise.resolve(TEST_ADDRESS_NEVER_USE);
  }

  setApprovalForAll(
    operator: string,
    approved: boolean,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  setOwner(
    node: BytesLike,
    owner: string,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  setRecord(
    node: BytesLike,
    owner: string,
    resolver: string,
    ttl: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  setResolver(
    node: BytesLike,
    resolver: string,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  setSubnodeOwner(
    node: BytesLike,
    label: BytesLike,
    owner: string,
    overrides: CallOverrides | undefined
  ): Promise<string> {
    return Promise.resolve("");
  }

  setSubnodeRecord(
    node: BytesLike,
    label: BytesLike,
    owner: string,
    resolver: string,
    ttl: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  setTTL(
    node: BytesLike,
    ttl: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  ttl(
    node: BytesLike,
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return Promise.resolve(BigNumber.from(0));
  }
}
