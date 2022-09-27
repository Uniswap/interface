import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Row } from 'nft/components/Flex'
import { BackArrowIcon, ChevronUpIcon, LightningBoltIcon, UniIcon } from 'nft/components/icons'
import { Overlay, stopPropagation } from 'nft/components/modals/Overlay'
import { vars } from 'nft/css/sprinkles.css'
import { useIsMobile, useSendTransaction, useTransactionResponse } from 'nft/hooks'
import { TxResponse, TxStateType } from 'nft/types'
import {
  fetchPrice,
  formatEthPrice,
  formatUsdPrice,
  formatUSDPriceWithCommas,
  getSuccessfulImageSize,
  parseTransactionResponse,
  shortenTxHash,
} from 'nft/utils'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import * as styles from './TransactionCompleteModal.css'

const TxCompleteModal = () => {
  const [ethPrice, setEthPrice] = useState(3000)
  const [showUnavailable, setShowUnavailable] = useState(false)
  const txHash = useSendTransaction((state) => state.txHash)
  const setTxState = useSendTransaction((state) => state.setState)
  const txState = useSendTransaction((state) => state.state)
  const transactionStateRef = useRef(txState)
  const transactionResponse = useTransactionResponse((state) => state.transactionResponse)
  const setTransactionResponse = useTransactionResponse((state) => state.setTransactionResponse)
  const isMobile = useIsMobile()
  const txHashUrl = getExplorerLink(1, txHash, ExplorerDataType.TRANSACTION)
  const shouldShowModal = (txState === TxStateType.Success || txState === TxStateType.Failed) && txState
  const {
    nftsPurchased,
    nftsNotPurchased,
    showPurchasedModal,
    showRefundModal,
    totalPurchaseValue,
    totalRefundValue,
    totalUSDRefund,
    txFeeFiat,
  } = useMemo(() => {
    return parseTransactionResponse(transactionResponse, ethPrice)
  }, [transactionResponse, ethPrice])

  const toggleShowUnavailable = () => {
    setShowUnavailable(!showUnavailable)
  }

  function closeTxCompleteScreen() {
    setTransactionResponse({} as TxResponse)
    setTxState(TxStateType.New)
  }

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthPrice(price ?? 0)
    })
  }, [])

  useEffect(() => {
    useSendTransaction.subscribe((state) => (transactionStateRef.current = state.state))
  }, [])

  return (
    <>
      {shouldShowModal && (
        <Portal>
          <Overlay onClick={closeTxCompleteScreen} />
          <Box className={styles.modalContainer} onClick={closeTxCompleteScreen}>
            {/* Successfully purchased NFTs */}
            {showPurchasedModal && (
              <Box className={styles.successModal} onClick={stopPropagation}>
                <UniIcon color={vars.color.pink400} width="36" height="36" className={styles.uniLogo} />
                <Box display="flex" flexWrap="wrap" width="full" height="min">
                  <h1 className={styles.title}>Complete!</h1>
                  <p className={styles.subHeading}>Uniswap has granted your wish!</p>
                </Box>
                <Box
                  className={styles.successAssetsContainer}
                  style={{
                    maxHeight: nftsPurchased.length > 32 ? (isMobile ? '172px' : '292px') : 'min-content',
                  }}
                >
                  {[...nftsPurchased].map((nft, index) => (
                    <img
                      className={clsx(
                        styles.successAssetImage,
                        nftsPurchased.length > 1 && styles.successAssetImageGrid
                      )}
                      style={{
                        maxHeight: `${getSuccessfulImageSize(nftsPurchased.length, isMobile)}px`,
                        maxWidth: `${getSuccessfulImageSize(nftsPurchased.length, isMobile)}px`,
                      }}
                      src={nft.imageUrl}
                      alt={nft.name}
                      key={index}
                    />
                  ))}
                </Box>
                {nftsPurchased.length > 32 && <Box className={styles.overflowFade} />}
                <Box
                  display="flex"
                  width="full"
                  height="min"
                  flexDirection="row"
                  marginTop={{ sm: '20', md: '20' }}
                  flexWrap={{ sm: 'wrap', md: 'nowrap' }}
                  alignItems="center"
                  paddingRight={'40'}
                  paddingLeft={'40'}
                  className={styles.bottomBar}
                  justifyContent="space-between"
                >
                  <Row>
                    <Box marginRight="16">
                      {nftsPurchased.length} NFT{nftsPurchased.length === 1 ? '' : 's'}
                    </Box>
                    <Box>{formatEthPrice(totalPurchaseValue.toString())} ETH</Box>
                  </Row>
                  <a href={txHashUrl} target="_blank" rel="noreferrer">
                    <Box color="textPrimary" fontWeight="normal">
                      {shortenTxHash(txHash, 2, 2)}
                    </Box>
                  </a>
                </Box>
              </Box>
            )}
            {/* NFTs that were not purchased ie Refunds */}
            {showRefundModal &&
              /* Showing both purchases & refunds */
              (showPurchasedModal ? (
                <Box className={styles.mixedRefundModal} onClick={stopPropagation}>
                  <Box
                    height="full"
                    display="inline-flex"
                    flexWrap="wrap"
                    width={{ sm: 'full', md: 'half' }}
                    paddingRight={{ sm: '0', md: '32' }}
                  >
                    <LightningBoltIcon color="pink" />
                    <p className={styles.subtitle}>Instant Refund</p>
                    <p className={styles.interStd}>
                      Uniswap returned{' '}
                      <span style={{ fontWeight: '700' }}>{formatEthPrice(totalRefundValue.toString())} ETH</span> back
                      to your wallet for unavailable items.
                    </p>
                    <Box
                      display="flex"
                      flexWrap="wrap"
                      bottom="24"
                      width="full"
                      alignSelf="flex-end"
                      position={{ sm: 'absolute', md: 'static' }}
                    >
                      <p className={styles.totalEthCost} style={{ marginBottom: '2px' }}>
                        {formatEthPrice(totalRefundValue.toString())} ETH
                      </p>
                      <p className={styles.totalUsdRefund}>{formatUSDPriceWithCommas(totalUSDRefund)}</p>
                      <p className={styles.totalEthCost} style={{ width: '100%' }}>
                        for {nftsNotPurchased.length} unavailable item
                        {nftsNotPurchased.length === 1 ? '' : 's'}.
                      </p>
                      <Box
                        position={{ sm: 'absolute', md: 'relative' }}
                        right={{ sm: '0', md: 'auto' }}
                        bottom={{ sm: '0', md: 'auto' }}
                        justifyContent={{ sm: 'flex-end', md: 'flex-start' }}
                        textAlign={{ sm: 'right', md: 'left' }}
                        flexShrink="0"
                        marginRight={{ sm: '40', md: '24' }}
                        width={{ sm: 'half', md: 'auto' }}
                      >
                        <a href={txHashUrl} target="_blank" rel="noreferrer">
                          <Box fontWeight="normal" marginTop="16" className={styles.totalEthCost}>
                            {shortenTxHash(txHash, 2, 2)}
                          </Box>
                        </a>
                      </Box>
                    </Box>
                  </Box>
                  <Box className={styles.refundAssetsContainer}>
                    {nftsNotPurchased.map((nft, index) => (
                      <Box display="flex" flexWrap="wrap" height="min" width="52" key={index}>
                        <img className={styles.refundAssetImage} src={nft.imageUrl} alt={nft.name} key={index} />
                      </Box>
                    ))}
                  </Box>
                  <Box className={styles.refundOverflowFade} />
                </Box>
              ) : (
                // Only showing when all assets are unavailable
                <Box className={styles.fullRefundModal} onClick={stopPropagation}>
                  <Box marginLeft="auto" marginRight="auto" display="flex">
                    {txState === TxStateType.Success ? (
                      <>
                        <LightningBoltIcon />
                        <h1 className={styles.title}>Instant Refund</h1>
                      </>
                    ) : (
                      <h1 className={styles.title}>Failed Transaction</h1>
                    )}
                  </Box>
                  <p className={styles.bodySmall}>
                    {txState === TxStateType.Success &&
                      `Selected item${
                        nftsPurchased.length === 1 ? ' is' : 's are'
                      } no longer available. Uniswap instantly refunded you for this incomplete transaction. `}
                    {formatUsdPrice(txFeeFiat)} was used for gas in attempt to complete this transaction. For support,
                    please visit our <a href="https://discord.gg/FCfyBSbCU5">Discord</a>
                  </p>
                  <Box className={styles.allUnavailableAssets}>
                    {nftsNotPurchased.length >= 3 && (
                      <Box className={styles.toggleUnavailable} onClick={() => toggleShowUnavailable()}>
                        {!showUnavailable && (
                          <Box paddingLeft="20" paddingTop="8" paddingBottom="8">
                            {nftsNotPurchased.slice(0, 3).map((asset, index) => (
                              <img
                                style={{ zIndex: 2 - index }}
                                className={styles.unavailableAssetPreview}
                                src={asset.imageUrl}
                                alt={asset.name}
                                key={index}
                              />
                            ))}
                          </Box>
                        )}
                        <Box
                          color={showUnavailable ? 'textPrimary' : 'textSecondary'}
                          className={styles.unavailableText}
                        >
                          Unavailable
                          <Box className={styles.unavailableItems}>
                            {nftsNotPurchased.length} item{nftsNotPurchased.length === 1 ? '' : 's'}
                          </Box>
                        </Box>
                        <ChevronUpIcon className={`${!showUnavailable && styles.chevronDown} ${styles.chevron}`} />
                      </Box>
                    )}
                    {(showUnavailable || nftsNotPurchased.length < 3) &&
                      nftsNotPurchased.map((asset, index) => (
                        <Box
                          backgroundColor="backgroundSurface"
                          display="flex"
                          padding="4"
                          marginBottom="1"
                          borderRadius="8"
                          key={index}
                        >
                          <Box className={styles.assetContainer}>
                            <img className={styles.fullRefundImage} src={asset.imageUrl} alt={asset.name} />
                          </Box>
                          <Box flexWrap="wrap" marginTop="4">
                            <Box marginLeft="4" width="full" display="flex">
                              <p className={styles.totalEthCost} style={{ marginBottom: '2px' }}>
                                {formatEthPrice(
                                  asset.updatedPriceInfo ? asset.updatedPriceInfo.ETHPrice : asset.priceInfo.ETHPrice
                                )}{' '}
                                ETH
                              </p>
                            </Box>
                            <Box color="textPrimary" className={styles.totalUsdRefund}>
                              {txState === TxStateType.Success ? 'Refunded' : asset.name}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                  </Box>
                  {showUnavailable && <Box className={styles.fullRefundOverflowFade} />}
                  <p className={styles.totalEthCost} style={{ marginBottom: '2px' }}>
                    {formatEthPrice(totalRefundValue.toString())} ETH
                  </p>
                  <p className={styles.totalUsdRefund}>{formatUSDPriceWithCommas(totalUSDRefund)}</p>
                  <Box className={styles.walletAddress} marginLeft="auto" marginRight="0">
                    <a href={txHashUrl} target="_blank" rel="noreferrer">
                      <Box className={styles.addressHash}>{shortenTxHash(txHash, 2, 2)}</Box>
                    </a>
                  </Box>
                  <p className={styles.totalEthCost}>
                    for {nftsNotPurchased.length} unavailable item
                    {nftsNotPurchased.length === 1 ? '' : 's'}.
                  </p>
                  <Box
                    as="button"
                    border="none"
                    backgroundColor="genieBlue"
                    cursor="pointer"
                    className={styles.returnButton}
                    type="button"
                    onClick={() => closeTxCompleteScreen()}
                  >
                    <BackArrowIcon className={styles.fullRefundBackArrow} />
                    Return to Marketplace
                  </Box>
                </Box>
              ))}
          </Box>
        </Portal>
      )}
    </>
  )
}

export default TxCompleteModal
