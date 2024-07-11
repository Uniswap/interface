import { Web3Provider } from "@ethersproject/providers";
import { ChainId } from "@taraswap/sdk-core";
import { SupportedInterfaceChain } from "constants/chains";
import { useMemo } from "react";
import type { Client, Transport } from "viem";
import { useClient, useConnectorClient } from "wagmi";

const providers = new WeakMap<Client, Web3Provider>();

function clientToProvider(
  client?: Client<Transport, SupportedInterfaceChain>,
  chainId?: number
) {
  // console.log("client & chhainId", client, chainId);
  if (!client) {
    return undefined;
  }
  const { chain, transport } = client;
  const network =
    chain && chain.contracts
      ? {
          chainId: chain.id,
          name: chain.name,
          ensAddress:
            "ensRegistry" in chain.contracts
              ? chain.contracts.ensRegistry?.address
              : undefined,
        }
      : client.chain.id === ChainId.TARAXA_TESTNET ||
        client.chain.id === ChainId.TARAXA
      ? { chainId: client.chain.id, name: chain.name }
      : chainId
      ? { chainId, name: "Unsupported" }
      : undefined;
  if (!network) {
    return undefined;
  }

  if (providers?.has(client)) {
    return providers.get(client);
  } else {
    const provider = new Web3Provider(transport, network);
    providers.set(client, provider);
    return provider;
  }
}

/** Hook to convert a viem Client to an ethers.js Provider with a default disconnected Network fallback. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient({ chainId });
  // console.log("connectorClient", client);
  const disconnectedClient = useClient({ chainId });
  // console.log("disconnectedClient", disconnectedClient);
  return useMemo(
    () => clientToProvider(client ?? disconnectedClient, chainId),
    [chainId, client, disconnectedClient]
  );
}

/** Hook to convert a connected viem Client to an ethers.js Provider. */
export function useEthersWeb3Provider({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient({ chainId });
  return useMemo(() => clientToProvider(client, chainId), [chainId, client]);
}
