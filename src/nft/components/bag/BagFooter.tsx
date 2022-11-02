import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Loader from 'components/Loader'
import { SupportedChainId } from 'constants/chains'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { bodySmall } from 'nft/css/common.css'
import { useWalletBalance } from 'nft/hooks/useWalletBalance'
import { BagStatus } from 'nft/types'
import { ethNumberStandardFormatter, formatWeiToDecimal } from 'nft/utils'
import { useCallback, useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import { useModalIsOpen, useToggleWalletModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { switchChain } from 'utils/switchChain'

import * as styles from './BagFooter.css'

const Footer = styled.div<{ $showWarning: boolean }>`
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  color: ${({ theme }) => theme.textPrimary};
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  border-top-left-radius: ${({ $showWarning }) => ($showWarning ? '0' : '12')}px;
  border-top-right-radius: ${({ $showWarning }) => ($showWarning ? '0' : '12')}px;
`

const WarningIcon = styled(AlertTriangle)`
  width: 14px;
  margin-right: 4px;
  color: ${({ theme }) => theme.accentWarning};
`
const WarningText = styled(ThemedText.BodyPrimary)`
  align-items: center;
  color: ${({ theme }) => theme.accentWarning};
  display: flex;
  justify-content: center;
  margin: 12px 0 !important;
  text-align: center;
`

interface ActionButtonProps {
  bagStatus: BagStatus
  disabled?: boolean
  isPending?: boolean
  onClick: () => void
  walletModalIsOpen?: boolean
  sufficientBalance: boolean | undefined
}

const ActionButton = ({ bagStatus, onClick, walletModalIsOpen, sufficientBalance }: ActionButtonProps) => {
  const { account, chainId } = useWeb3React()
  const connected = Boolean(account && chainId)

  const isPending = PENDING_BAG_STATUSES.includes(bagStatus) || walletModalIsOpen
  let disabled = true
  let buttonText = <Trans>Something went wrong</Trans>
  if (!connected || walletModalIsOpen) {
    disabled = false
    buttonText = <Trans>Connect wallet</Trans>
  } else if (connected && chainId !== SupportedChainId.MAINNET) {
    disabled = false
    buttonText = <Trans>Switch networks</Trans>
  } else if (bagStatus === BagStatus.FETCHING_FINAL_ROUTE || bagStatus === BagStatus.CONFIRMING_IN_WALLET) {
    disabled = true
    buttonText = <Trans>Proceed in wallet</Trans>
  } else if (bagStatus === BagStatus.PROCESSING_TRANSACTION) {
    disabled = true
    buttonText = <Trans>Transaction pending</Trans>
  } else if (sufficientBalance === true) {
    disabled = false
    buttonText = <Trans>Pay</Trans>
  } else if (sufficientBalance === false) {
    disabled = true
    buttonText = <Trans>Pay</Trans>
  }
  return (
    <Row as="button" color="explicitWhite" className={styles.payButton} disabled={disabled} onClick={onClick}>
      {isPending && <Loader size="20px" stroke="white" />}
      {buttonText}
    </Row>
  )
}
interface WarningProps {
  bagStatus: BagStatus
  sufficientBalance: undefined | boolean
}

const Warning = ({ bagStatus, sufficientBalance }: WarningProps) => {
  const { account, chainId } = useWeb3React()
  const connected = Boolean(account && chainId)
  let warningText = null

  if (connected && chainId !== SupportedChainId.MAINNET) {
    warningText = <Trans>Wrong network</Trans>
  } else if (sufficientBalance === false) {
    warningText = <Trans>Insufficient funds</Trans>
  } else if (bagStatus === BagStatus.WARNING) {
    warningText = <Trans>Something went wrong. Please try again.</Trans>
  }
  if (!warningText) {
    return null
  }
  return (
    <WarningText fontSize="14px" lineHeight="20px">
      <WarningIcon />
      {warningText}
    </WarningText>
  )
}

interface BagFooterProps {
  isConnected: boolean
  totalEthPrice: BigNumber
  totalUsdPrice: number | undefined
  bagStatus: BagStatus
  fetchAssets: () => void
}

const PENDING_BAG_STATUSES = [
  BagStatus.FETCHING_ROUTE,
  BagStatus.CONFIRMING_IN_WALLET,
  BagStatus.FETCHING_FINAL_ROUTE,
  BagStatus.PROCESSING_TRANSACTION,
]

export const BagFooter = ({ totalEthPrice, totalUsdPrice, bagStatus, fetchAssets }: BagFooterProps) => {
  const toggleWalletModal = useToggleWalletModal()
  const walletModalIsOpen = useModalIsOpen(ApplicationModal.WALLET)
  const { account, chainId, connector } = useWeb3React()
  const connected = Boolean(account && chainId)

  const handleClick = useCallback(() => {
    if (!connected) {
      toggleWalletModal()
    } else if (connected && chainId !== SupportedChainId.MAINNET) {
      switchChain(connector, SupportedChainId.MAINNET)
    } else {
      fetchAssets()
    }
  }, [connected, chainId, toggleWalletModal, connector, fetchAssets])

  const { balance: balanceInEth } = useWalletBalance()
  const sufficientBalance = useMemo(() => {
    if (!connected || chainId !== SupportedChainId.MAINNET) {
      return undefined
    }
    return parseEther(balanceInEth).gte(totalEthPrice)
  }, [connected, chainId, balanceInEth, totalEthPrice])

  return (
    <Column className={styles.footerContainer}>
      <Footer $showWarning={bagStatus === BagStatus.WARNING}>
        <Column gap="4" paddingTop="8" paddingBottom="20">
          <Row justifyContent="space-between">
            <Box>
              <ThemedText.HeadlineSmall>Total</ThemedText.HeadlineSmall>
            </Box>
            <Box>
              <ThemedText.HeadlineSmall>
                {formatWeiToDecimal(totalEthPrice.toString())}&nbsp;ETH
              </ThemedText.HeadlineSmall>
            </Box>
          </Row>
          <Row justifyContent="flex-end" color="textSecondary" className={bodySmall}>
            {`${ethNumberStandardFormatter(totalUsdPrice, true)}`}
          </Row>
        </Column>
        <Warning bagStatus={bagStatus} sufficientBalance={sufficientBalance} />
        <ActionButton
          onClick={handleClick}
          bagStatus={bagStatus}
          walletModalIsOpen={walletModalIsOpen}
          sufficientBalance={sufficientBalance}
        />
      </Footer>
    </Column>
  )
}
