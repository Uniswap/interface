import { createMulticall, ListenerOptions } from "@uniswap/redux-multicall";
import { ChainId } from "@taraswap/sdk-core";
import { CHAIN_INFO, useSupportedChainId } from "constants/chains";
import { useAccount } from "hooks/useAccount";
import {
  useInterfaceMulticall,
  useMainnetInterfaceMulticall,
} from "hooks/useContract";
import useBlockNumber, {
  useMainnetBlockNumber,
} from "lib/hooks/useBlockNumber";
import { useMemo } from "react";

const multicall = createMulticall();

export default multicall;

const MAINNET_LISTENER_OPTIONS = { blocksPerFetch: 1 };

export function MulticallUpdater() {
  const { chainId } = useAccount();
  const supportedChain = useSupportedChainId(chainId);
  const latestBlockNumber = useBlockNumber();
  const contract = useInterfaceMulticall();
  const listenerOptions: ListenerOptions = useMemo(
    () => ({
      blocksPerFetch: supportedChain
        ? CHAIN_INFO[supportedChain].blockPerMainnetEpochForChainId
        : 1,
    }),
    [supportedChain]
  );

  const latestMainnetBlockNumber = useMainnetBlockNumber();
  const mainnetContract = useMainnetInterfaceMulticall();

  return (
    <>
      <multicall.Updater
        chainId={ChainId.MAINNET}
        latestBlockNumber={latestMainnetBlockNumber}
        contract={mainnetContract}
        listenerOptions={MAINNET_LISTENER_OPTIONS}
      />
      {chainId !== ChainId.MAINNET && (
        <multicall.Updater
          chainId={chainId}
          latestBlockNumber={latestBlockNumber}
          contract={contract}
          listenerOptions={listenerOptions}
        />
      )}
    </>
  );
}
