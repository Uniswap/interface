import { useContractKit } from '@celo-tools/use-contractkit'
import { JSBI, TokenAmount } from '@ubeswap/sdk'
import { UBE } from 'constants/tokens'
import { BigNumber } from 'ethers'
import { useReleaseUbeContract, useTokenContract } from 'hooks/useContract'
import { useEffect, useState } from 'react'
import { useSingleContractMultipleData } from 'state/multicall/hooks'
import { useUnclaimedStakingRewards } from 'state/stake/hooks'

const DECIMALS = BigNumber.from(10).pow(18)
const HARDCAP = BigNumber.from(100_000_000).mul(DECIMALS)
const RELEASED = BigNumber.from(25_700_000).mul(DECIMALS)

// Addresses that do not contribute to circulating supply
const nonCirculatingAddresses = {
  MiningReleaseEscrow: '0x9d0a92AA8832518328D14Ed5930eC6B44448165e',
  PoolManager: '0x9Ee3600543eCcc85020D6bc77EB553d1747a65D2',
}

/**
 * Fetches the circulating supply
 */
export const useCirculatingSupply = (): TokenAmount | undefined => {
  const { network } = useContractKit()
  const chainId = network.chainId
  const ube = chainId ? UBE[chainId] : undefined
  const ubeContract = useTokenContract(ube?.address)
  const releaseUbe = useReleaseUbeContract()

  // compute amount that is locked up
  const balancesRaw = useSingleContractMultipleData(
    ubeContract,
    'balanceOf',
    Object.values(nonCirculatingAddresses).map((addr) => [addr])
  )
  // if we are still loading, do not load
  const balances = balancesRaw?.find((result) => !result.result)
    ? null
    : (balancesRaw.map((b) => b.result?.[0] ?? BigNumber.from(0)) as readonly BigNumber[])
  const lockedBalancesSum = balances?.reduce((sum, b) => b.add(sum), BigNumber.from(0))

  // add amount of tokens that could be claimed but are not being claimed
  const { noncirculatingSupply } = useUnclaimedStakingRewards()

  // compute amount that has been released
  const [released, setReleased] = useState<BigNumber | null>(null)
  useEffect(() => {
    void (async () => {
      if (releaseUbe) {
        setReleased(RELEASED.sub(await releaseUbe.releasableSupplyOfPrincipal(RELEASED)))
      }
    })()
  }, [releaseUbe])

  if (!lockedBalancesSum || !released || !noncirculatingSupply) {
    return undefined
  }

  return ube
    ? new TokenAmount(
        ube,
        JSBI.BigInt(HARDCAP.sub(lockedBalancesSum).sub(released).sub(noncirculatingSupply).toString())
      )
    : undefined
}
