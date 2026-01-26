import { permit2Address } from '@uniswap/permit2-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { usePermitAllowance } from 'hooks/usePermitAllowance'
import { useTokenAllowance } from 'hooks/useTokenAllowance'
import { useMemo, useState, useCallback } from 'react'
import { AVERAGE_L1_BLOCK_TIME_MS } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import useInterval from 'lib/hooks/useInterval'
import { getV3PositionManagerAddress } from 'uniswap/src/constants/v3Addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Hook to check on-chain token approvals for LP position creation
 * This is a pure on-chain check that doesn't rely on Trading API
 * Supports both traditional ERC20 approve and Permit2 authorization
 * 
 * @param token0 - First token in the pair
 * @param token1 - Second token in the pair
 * @param amount0 - Amount of token0 to check approval for
 * @param amount1 - Amount of token1 to check approval for
 * @param owner - Address of the token owner (user's wallet address)
 * @param chainId - Chain ID to check approvals on
 * @returns Approval status for both tokens (including Permit2)
 */
export function useOnChainLpApproval({
  token0,
  token1,
  amount0,
  amount1,
  owner,
  chainId,
}: {
  token0?: Token
  token1?: Token
  amount0?: CurrencyAmount<Token>
  amount1?: CurrencyAmount<Token>
  owner?: string
  chainId?: UniverseChainId
}): {
  token0Allowance?: CurrencyAmount<Token>
  token1Allowance?: CurrencyAmount<Token>
  token0Permit2Allowance?: CurrencyAmount<Token>
  token1Permit2Allowance?: CurrencyAmount<Token>
  token0NeedsApproval: boolean
  token1NeedsApproval: boolean
  token0NeedsPermit2Approval: boolean
  token1NeedsPermit2Approval: boolean
  isSyncing: boolean
  positionManagerAddress?: string
} {
  // Get Position Manager address for the chain
  const positionManagerAddress = useMemo(() => {
    if (!chainId) return undefined
    // getV3PositionManagerAddress handles both extended and official chains
    return getV3PositionManagerAddress(chainId)
  }, [chainId])

  // Get Permit2 address for the chain
  const permit2AddressForChain = useMemo(() => {
    if (!chainId) return undefined
    return permit2Address(chainId)
  }, [chainId])

  // Check token0 traditional allowance (direct to Position Manager)
  const {
    tokenAllowance: token0Allowance,
    isSyncing: token0Syncing,
  } = useTokenAllowance({
    token: token0,
    owner,
    spender: positionManagerAddress,
  })

  // Check token1 traditional allowance (direct to Position Manager)
  const {
    tokenAllowance: token1Allowance,
    isSyncing: token1Syncing,
  } = useTokenAllowance({
    token: token1,
    owner,
    spender: positionManagerAddress,
  })

  // Check token0 Permit2 allowance (token -> Permit2 -> Position Manager)
  const {
    permitAllowance: token0Permit2Allowance,
    expiration: token0Permit2Expiration,
  } = usePermitAllowance({
    token: token0,
    owner,
    spender: positionManagerAddress,
  })

  // Check token1 Permit2 allowance (token -> Permit2 -> Position Manager)
  const {
    permitAllowance: token1Permit2Allowance,
    expiration: token1Permit2Expiration,
  } = usePermitAllowance({
    token: token1,
    owner,
    spender: positionManagerAddress,
  })

  // Check if token0 is approved to Permit2 (needed for Permit2 to work)
  const {
    tokenAllowance: token0Permit2Approval,
    isSyncing: token0Permit2ApprovalSyncing,
  } = useTokenAllowance({
    token: token0,
    owner,
    spender: permit2AddressForChain,
  })

  // Check if token1 is approved to Permit2 (needed for Permit2 to work)
  const {
    tokenAllowance: token1Permit2Approval,
    isSyncing: token1Permit2ApprovalSyncing,
  } = useTokenAllowance({
    token: token1,
    owner,
    spender: permit2AddressForChain,
  })

  // Signature and PermitAllowance will expire, so they should be rechecked at an interval.
  // Calculate now such that the signature will still be valid for the submitting block.
  const [now, setNow] = useState(Math.floor((Date.now() + AVERAGE_L1_BLOCK_TIME_MS) / 1000))
  useInterval(
    useCallback(() => setNow(Math.floor((Date.now() + AVERAGE_L1_BLOCK_TIME_MS) / 1000)), []),
    AVERAGE_L1_BLOCK_TIME_MS,
  )

  // Determine if approvals are needed
  // For Permit2: check if Permit2 allowance exists, is sufficient, and not expired
  const token0HasValidPermit2 = useMemo(() => {
    if (!amount0 || !token0Permit2Allowance || !token0Permit2Expiration) {
      return false
    }
    // Check if Permit2 allowance is sufficient and not expired
    return (
      (token0Permit2Allowance.greaterThan(amount0) || token0Permit2Allowance.equalTo(amount0)) &&
      token0Permit2Expiration >= now
    )
  }, [amount0, token0Permit2Allowance, token0Permit2Expiration, now])

  const token1HasValidPermit2 = useMemo(() => {
    if (!amount1 || !token1Permit2Allowance || !token1Permit2Expiration) {
      return false
    }
    // Check if Permit2 allowance is sufficient and not expired
    return (
      (token1Permit2Allowance.greaterThan(amount1) || token1Permit2Allowance.equalTo(amount1)) &&
      token1Permit2Expiration >= now
    )
  }, [amount1, token1Permit2Allowance, token1Permit2Expiration, now])

  // Token needs approval if:
  // 1. Traditional allowance is insufficient AND
  // 2. Permit2 allowance is insufficient or expired
  const token0NeedsApproval = useMemo(() => {
    if (!amount0) {
      return false
    }
    // If Permit2 is valid, no need for traditional approval
    if (token0HasValidPermit2) {
      return false
    }
    // Check traditional allowance
    if (!token0Allowance) {
      return true
    }
    return token0Allowance.lessThan(amount0)
  }, [amount0, token0Allowance, token0HasValidPermit2])

  const token1NeedsApproval = useMemo(() => {
    if (!amount1) {
      return false
    }
    // If Permit2 is valid, no need for traditional approval
    if (token1HasValidPermit2) {
      return false
    }
    // Check traditional allowance
    if (!token1Allowance) {
      return true
    }
    return token1Allowance.lessThan(amount1)
  }, [amount1, token1Allowance, token1HasValidPermit2])

  // Token needs Permit2 approval if:
  // 1. Token is approved to Permit2 AND
  // 2. Permit2 allowance to Position Manager is insufficient or expired
  const token0NeedsPermit2Approval = useMemo(() => {
    if (!amount0 || !token0Permit2Approval) {
      return false
    }
    // Check if token is approved to Permit2
    const isApprovedToPermit2 = token0Permit2Approval.greaterThan(0)
    if (!isApprovedToPermit2) {
      return false
    }
    // If Permit2 allowance is valid, no need for Permit2 approval
    if (token0HasValidPermit2) {
      return false
    }
    // Permit2 allowance is insufficient or expired
    return true
  }, [amount0, token0Permit2Approval, token0HasValidPermit2])

  const token1NeedsPermit2Approval = useMemo(() => {
    if (!amount1 || !token1Permit2Approval) {
      return false
    }
    // Check if token is approved to Permit2
    const isApprovedToPermit2 = token1Permit2Approval.greaterThan(0)
    if (!isApprovedToPermit2) {
      return false
    }
    // If Permit2 allowance is valid, no need for Permit2 approval
    if (token1HasValidPermit2) {
      return false
    }
    // Permit2 allowance is insufficient or expired
    return true
  }, [amount1, token1Permit2Approval, token1HasValidPermit2])

  const isSyncing =
    token0Syncing ||
    token1Syncing ||
    token0Permit2ApprovalSyncing ||
    token1Permit2ApprovalSyncing

  return {
    token0Allowance,
    token1Allowance,
    token0Permit2Allowance,
    token1Permit2Allowance,
    token0NeedsApproval,
    token1NeedsApproval,
    token0NeedsPermit2Approval,
    token1NeedsPermit2Approval,
    isSyncing,
    positionManagerAddress,
  }
}
