import { useContract } from "hooks/useContract";
import { useAccount } from "hooks/useAccount";
import { InterfaceEventName } from "@uniswap/analytics-events";
import { ethers } from "ethers";
import UniswapV3StakerABI from './UniswapV3StakerABI.json';
import { useEffect } from "react";
import { sendAnalyticsEvent } from "uniswap/src/features/telemetry/send";

export function useV3StakerContract(withSignerIfPossible = true) {
    const account = useAccount();
    const contract = useContract('0x1dfE3eEcbC234F2795Df358DD8Cc8DFAbdF38715', UniswapV3StakerABI, withSignerIfPossible);

    useEffect(() => {
        if (contract && account.isConnected) {
            sendAnalyticsEvent(InterfaceEventName.WALLET_PROVIDER_USED, {
                source: "useV3StakerContract",
                contract: {
                    name: "V3Staker",
                    address: contract.address,
                    withSignerIfPossible,
                    chainId: account.chainId,
                },
            });
        }
    }, [account.isConnected, account.chainId, contract, withSignerIfPossible]);

    return contract;
}
