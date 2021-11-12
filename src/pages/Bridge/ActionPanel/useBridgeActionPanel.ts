import { useCallback, useState, useEffect } from 'react'
import { BigNumber } from 'ethers'
import { Token } from '@swapr/sdk'
import { isToken } from '../../../hooks/Tokens'
import { useBridge } from '../../../contexts/BridgeProvider'
import { useBridgeInfo } from '../../../state/bridge/hooks'
import { useBridgeService } from '../../../contexts/BridgeServiceProvider'
import { useHasPendingApproval } from '../../../state/transactions/hooks'
import { ApprovalState } from '../../../hooks/useApproveCallback'

const defaultAddresses = {
  walletAddress: undefined,
  gatewayAddress: undefined
}

export const useBridgeActionPanel = () => {
  const {
    bridge,
    chainIdPair: { isArbitrum }
  } = useBridge()
  const bridgeService = useBridgeService()
  const { currencyId, isBalanceSufficient, parsedAmount, bridgeCurrency } = useBridgeInfo()
  const [{ walletAddress, gatewayAddress }, setAddresses] = useState<{
    walletAddress?: string
    gatewayAddress?: string
  }>(defaultAddresses)
  const pendingApproval = useHasPendingApproval((bridgeCurrency as Token)?.address, gatewayAddress)
  const [allowance, setAllowance] = useState<BigNumber | undefined>(undefined)
  const [checkingAllowance, setCheckingAllowance] = useState(false)
  const [approvalState, setApprovalState] = useState<ApprovalState>(ApprovalState.UNKNOWN)
  const [showApprovalFlow, setShowApprovalFlow] = useState(false)

  const handleApprove = useCallback(async () => {
    if (!bridgeService || !currencyId || !bridgeCurrency) return
    await bridgeService.approveERC20(currencyId, gatewayAddress, bridgeCurrency.symbol)
  }, [bridgeService, currencyId, gatewayAddress, bridgeCurrency])

  useEffect(() => {
    if (!isArbitrum) {
      setShowApprovalFlow(false)
    }
  }, [currencyId, isArbitrum])

  useEffect(() => {
    if (!isArbitrum && approvalState === ApprovalState.NOT_APPROVED) {
      setShowApprovalFlow(true)
      return
    }
  }, [approvalState, isArbitrum])

  useEffect(() => {
    let active = true

    const checkAllowance = async () => {
      if (!bridge || !currencyId) return
      let tmpWalletAddress = walletAddress
      let tmpGatewayAddress = gatewayAddress

      setCheckingAllowance(true)

      if (!tmpWalletAddress && !tmpGatewayAddress) {
        ;[tmpWalletAddress, tmpGatewayAddress] = await Promise.all([
          bridge.l1Bridge.getWalletAddress(),
          bridge.l1Bridge.getGatewayAddress(currencyId)
        ])

        if (active) {
          setAddresses({ gatewayAddress: tmpGatewayAddress, walletAddress: tmpWalletAddress })
        }
      }

      if (tmpWalletAddress && tmpGatewayAddress) {
        const { contract } = await bridge?.l1Bridge.getL1TokenData(currencyId)
        const allowance = await contract.allowance(tmpWalletAddress, tmpGatewayAddress)

        if (active) {
          setAllowance(allowance)
        }
      }

      setCheckingAllowance(false)
    }

    if (!isArbitrum && isToken(bridgeCurrency) && !pendingApproval && parsedAmount) {
      checkAllowance()
    }

    return () => {
      active = false
    }
  }, [bridge, bridgeCurrency, currencyId, gatewayAddress, isArbitrum, parsedAmount, pendingApproval, walletAddress])

  useEffect(() => {
    if (isArbitrum || !isToken(bridgeCurrency) || !parsedAmount) return

    if (pendingApproval) {
      setApprovalState(ApprovalState.PENDING)
      return
    }

    if (checkingAllowance) {
      setApprovalState(ApprovalState.UNKNOWN)
      return
    }

    if (allowance) {
      if (parsedAmount.lessThan(allowance.toBigInt())) {
        setApprovalState(ApprovalState.APPROVED)
        return
      } else {
        setApprovalState(ApprovalState.NOT_APPROVED)
      }
    }
  }, [allowance, checkingAllowance, pendingApproval, bridgeCurrency, parsedAmount, isArbitrum])

  return {
    handleApprove,
    approvalState,
    isBalanceSufficient,
    parsedAmount,
    showApprovalFlow,
    bridgeCurrency,
    isArbitrum
  }
}
