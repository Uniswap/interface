import { BigNumber } from '@ethersproject/bignumber'
import ethereumLogoUrl from 'assets/images/ethereum-logo.png'
import Loader from 'components/Loader'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { bodySmall, header2, subheadSmall } from 'nft/css/common.css'
import { BagStatus } from 'nft/types'
import { ethNumberStandardFormatter, formatWeiToDecimal } from 'nft/utils/currency'
import { useModalIsOpen, useToggleWalletModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'

import * as styles from './BagFooter.css'

interface BagFooterProps {
  balance: BigNumber
  isConnected: boolean
  sufficientBalance: boolean
  totalEthPrice: BigNumber
  totalUsdPrice: number | undefined
  bagStatus: BagStatus
  setBagStatus: (status: BagStatus) => void
  fetchReview: () => void
  assetsAreInReview: boolean
}

const PENDING_BAG_STATUSES = [
  BagStatus.FETCHING_ROUTE,
  BagStatus.CONFIRMING_IN_WALLET,
  BagStatus.FETCHING_FINAL_ROUTE,
  BagStatus.PROCESSING_TRANSACTION,
]

export const BagFooter = ({
  balance,
  isConnected,
  sufficientBalance,
  totalEthPrice,
  totalUsdPrice,
  bagStatus,
  setBagStatus,
  fetchReview,
  assetsAreInReview,
}: BagFooterProps) => {
  const toggleWalletModal = useToggleWalletModal()
  const walletModalIsOpen = useModalIsOpen(ApplicationModal.WALLET)

  const isPending = PENDING_BAG_STATUSES.includes(bagStatus) || walletModalIsOpen
  const isDisabled = isConnected && (isPending || !sufficientBalance || assetsAreInReview)

  const showWarning = isConnected && (!sufficientBalance || bagStatus === BagStatus.WARNING)

  return (
    <Column className={styles.footerContainer}>
      {showWarning && (
        <Row className={styles.warningContainer}>
          {!sufficientBalance
            ? `Insufficient funds (${formatWeiToDecimal(balance.toString())} ETH)`
            : `Something went wrong. Please try again.`}
        </Row>
      )}
      <Column
        borderTopLeftRadius={showWarning ? '0' : '12'}
        borderTopRightRadius={showWarning ? '0' : '12'}
        className={styles.footer}
      >
        <Box marginBottom="8" style={{ lineHeight: '20px', opacity: '0.54' }} className={subheadSmall}>
          Total
        </Box>
        <Column marginBottom="16">
          <Row justifyContent="space-between">
            <Box className={header2}>{`${formatWeiToDecimal(totalEthPrice.toString())}`}</Box>
            <Row className={styles.ethPill}>
              <Box as="img" src={ethereumLogoUrl} alt="Ethereum" width="24" height="24" />
              ETH
            </Row>
          </Row>
          <Box fontWeight="normal" style={{ lineHeight: '20px', opacity: '0.6' }} className={bodySmall}>
            {`${ethNumberStandardFormatter(totalUsdPrice, true)}`}
          </Box>
        </Column>
        <Row
          as="button"
          color="explicitWhite"
          className={styles.payButton}
          disabled={isDisabled}
          onClick={() => {
            if (!isConnected) {
              toggleWalletModal()
            } else if (bagStatus === BagStatus.ADDING_TO_BAG) {
              fetchReview()
            } else if (bagStatus === BagStatus.CONFIRM_REVIEW || bagStatus === BagStatus.WARNING) {
              setBagStatus(BagStatus.FETCHING_FINAL_ROUTE)
            }
          }}
        >
          {isPending && <Loader size="20px" stroke="backgroundSurface" />}
          {!isConnected || walletModalIsOpen
            ? 'Connect wallet'
            : bagStatus === BagStatus.FETCHING_FINAL_ROUTE || bagStatus === BagStatus.CONFIRMING_IN_WALLET
            ? 'Proceed in wallet'
            : bagStatus === BagStatus.PROCESSING_TRANSACTION
            ? 'Transaction pending'
            : 'Pay'}
        </Row>
      </Column>
    </Column>
  )
}
