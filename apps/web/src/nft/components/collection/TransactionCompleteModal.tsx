import { formatEther as ethersFormatEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { InterfaceModalName, NFTEventName } from '@uniswap/analytics-events'
import { Trace, useTrace } from 'analytics'
import clsx from 'clsx'
import { OpacityHoverState } from 'components/Common'
import { UniIcon } from 'components/Logo/UniIcon'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Row } from 'nft/components/Flex'
import { BackArrowIcon, ChevronUpIcon, LightningBoltIcon, TwitterIcon } from 'nft/components/icons'
import { Overlay, stopPropagation } from 'nft/components/modals/Overlay'
import { themeVars, vars } from 'nft/css/sprinkles.css'
import { useIsMobile, useNativeUsdPrice, useSendTransaction, useTransactionResponse } from 'nft/hooks'
import { TxResponse, TxStateType } from 'nft/types'
import { generateTweetForPurchase, getSuccessfulImageSize, parseTransactionResponse } from 'nft/utils'
import { formatAssetEventProperties } from 'nft/utils/formatEventProperties'
import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import * as styles from './TransactionCompleteModal.css'

const TWITTER_WIDTH = 560
const TWITTER_HEIGHT = 480

const UploadLink = styled.a`
  position: absolute;
  right: 32px;
  top: 32px;
  color: ${({ theme }) => theme.neutral2};
  cursor: pointer;

  ${OpacityHoverState}

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    right: 12px;
    top: 28px;
  }
`

const TxCompleteModal = () => {
  const ethUsdPrice = useNativeUsdPrice()
  const { formatEther, formatNumberOrString } = useFormatter()
  const [showUnavailable, setShowUnavailable] = useState(false)
  const txHash = useSendTransaction((state) => state.txHash)
  const purchasedWithErc20 = useSendTransaction((state) => state.purchasedWithErc20)
  const setTxState = useSendTransaction((state) => state.setState)
  const txState = useSendTransaction((state) => state.state)
  const transactionStateRef = useRef(txState)
  const transactionResponse = useTransactionResponse((state) => state.transactionResponse)
  const setTransactionResponse = useTransactionResponse((state) => state.setTransactionResponse)
  const isMobile = useIsMobile()
  const txHashUrl = getExplorerLink(1, txHash, ExplorerDataType.TRANSACTION)
  const shouldShowModal = (txState === TxStateType.Success || txState === TxStateType.Failed) && txState
  const trace = useTrace({ modal: InterfaceModalName.NFT_TX_COMPLETE })
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
    return parseTransactionResponse(transactionResponse, ethUsdPrice)
  }, [transactionResponse, ethUsdPrice])

  const toggleShowUnavailable = () => {
    setShowUnavailable(!showUnavailable)
  }

  function closeTxCompleteScreen() {
    setTransactionResponse({} as TxResponse)
    setTxState(TxStateType.New)
  }

  useEffect(() => {
    useSendTransaction.subscribe((state) => (transactionStateRef.current = state.state))
  }, [])

  const shareTweet = () => {
    window.open(
      generateTweetForPurchase(nftsPurchased, txHashUrl),
      'newwindow',
      `left=${(window.screen.width - TWITTER_WIDTH) / 2}, top=${
        (window.screen.height - TWITTER_HEIGHT) / 2
      }, width=${TWITTER_WIDTH}, height=${TWITTER_HEIGHT}`
    )
  }

  return (
    <>
      {shouldShowModal && (
        <Portal>
          <Overlay onClick={closeTxCompleteScreen} />
          <Box className={styles.modalContainer} onClick={closeTxCompleteScreen}>
            {/* Successfully purchased NFTs */}
            {showPurchasedModal && (
              <Trace
                name={NFTEventName.NFT_BUY_BAG_SUCCEEDED}
                properties={{
                  buy_quantity: nftsPurchased.length,
                  usd_value: parseFloat(ethersFormatEther(totalPurchaseValue)) * ethUsdPrice,
                  transaction_hash: txHash,
                  using_erc20: purchasedWithErc20,
                  ...formatAssetEventProperties(nftsPurchased),
                  ...trace,
                }}
                shouldLogImpression
              >
                <Box className={styles.successModal} onClick={stopPropagation}>
                  <UniIcon color={vars.color.pink400} width="36" height="36" className={styles.uniLogo} />
                  <Box display="flex" flexWrap="wrap" width="full" height="min">
                    <h1 className={styles.title}>
                      <Trans>Complete!</Trans>
                    </h1>
                    <p className={styles.subHeading}>
                      <Trans>Uniswap has granted your wish!</Trans>
                    </p>
                  </Box>
                  <UploadLink onClick={shareTweet} target="_blank">
                    <TwitterIcon width={32} height={32} color={themeVars.colors.neutral2} />
                  </UploadLink>
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
                    paddingRight="40"
                    paddingLeft="40"
                    className={styles.bottomBar}
                    justifyContent="space-between"
                  >
                    <Row>
                      <Box marginRight="16">
                        {nftsPurchased.length} NFT{nftsPurchased.length === 1 ? '' : 's'}
                      </Box>
                      <Box>
                        {formatEther({
                          input: totalPurchaseValue.toString(),
                          type: NumberType.NFTToken,
                        })}{' '}
                        ETH
                      </Box>
                    </Row>
                    <a href={txHashUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <Box color="neutral2" fontWeight="book">
                        <Trans>View on Etherscan</Trans>
                      </Box>
                    </a>
                  </Box>
                </Box>
              </Trace>
            )}
            {/* NFTs that were not purchased ie Refunds */}
            {showRefundModal &&
              /* Showing both purchases & refunds */
              (showPurchasedModal ? (
                <Trace
                  name={NFTEventName.NFT_BUY_BAG_REFUNDED}
                  properties={{
                    buy_quantity: nftsPurchased.length,
                    fail_quantity: nftsNotPurchased.length,
                    refund_amount_usd: totalUSDRefund,
                    transaction_hash: txHash,
                    ...trace,
                  }}
                  shouldLogImpression
                >
                  <Box className={styles.mixedRefundModal} onClick={stopPropagation}>
                    <Box
                      display="inline-flex"
                      flexWrap="wrap"
                      width={{ sm: 'full', md: 'half' }}
                      paddingRight={{ sm: '0', md: '32' }}
                    >
                      <LightningBoltIcon color="pink" />
                      <p className={styles.subtitle}>Instant Refund</p>
                      <p className={styles.interStd}>
                        Uniswap returned{' '}
                        <span style={{ fontWeight: 535 }}>
                          {formatEther({
                            input: totalRefundValue.toString(),
                            type: NumberType.NFTToken,
                          })}{' '}
                          ETH
                        </span>{' '}
                        back to your wallet for unavailable items.
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
                          {formatEther({
                            input: totalRefundValue.toString(),
                            type: NumberType.NFTToken,
                          })}{' '}
                          ETH
                        </p>
                        <p className={styles.totalUsdRefund}>
                          {formatNumberOrString({ input: totalUSDRefund, type: NumberType.FiatNFTToken })}
                        </p>
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
                          <a href={txHashUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                            <Box fontWeight="book" marginTop="16" color="neutral2" className={styles.totalEthCost}>
                              View on Etherscan
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
                </Trace>
              ) : (
                // Only showing when all assets are unavailable
                <Trace
                  name={NFTEventName.NFT_BUY_BAG_REFUNDED}
                  properties={{
                    buy_quantity: 0,
                    fail_quantity: nftsNotPurchased.length,
                    refund_amount_usd: totalUSDRefund,
                    ...trace,
                  }}
                  shouldLogImpression
                >
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
                      {formatNumberOrString({ input: txFeeFiat, type: NumberType.FiatNFTToken })} was used for gas in
                      attempt to complete this transaction. For support, please visit our{' '}
                      <a href="https://discord.gg/FCfyBSbCU5">Discord</a>
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
                          <Box color={showUnavailable ? 'neutral1' : 'neutral2'} className={styles.unavailableText}>
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
                            backgroundColor="surface1"
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
                                  {formatEther({
                                    input: asset.updatedPriceInfo
                                      ? asset.updatedPriceInfo.ETHPrice
                                      : asset.priceInfo.ETHPrice,
                                    type: NumberType.NFTToken,
                                  })}{' '}
                                  ETH
                                </p>
                              </Box>
                              <Box color="neutral1" className={styles.totalUsdRefund}>
                                {txState === TxStateType.Success ? 'Refunded' : asset.name}
                              </Box>
                            </Box>
                          </Box>
                        ))}
                    </Box>
                    {showUnavailable && <Box className={styles.fullRefundOverflowFade} />}
                    <p className={styles.totalEthCost} style={{ marginBottom: '2px' }}>
                      {formatEther({
                        input: totalRefundValue.toString(),
                        type: NumberType.NFTToken,
                      })}{' '}
                      ETH
                    </p>
                    <p className={styles.totalUsdRefund}>
                      {formatNumberOrString({ input: totalUSDRefund, type: NumberType.FiatNFTToken })}
                    </p>
                    <Box className={styles.walletAddress} marginLeft="auto" marginRight="0">
                      <a href={txHashUrl} target="_blank" rel="noreferrer">
                        <Box className={styles.addressHash}>View on Etherscan</Box>
                      </a>
                    </Box>
                    <p className={styles.totalEthCost}>
                      for {nftsNotPurchased.length} unavailable item
                      {nftsNotPurchased.length === 1 ? '' : 's'}.
                    </p>
                    <Box
                      as="button"
                      border="none"
                      backgroundColor="accent1"
                      cursor="pointer"
                      className={styles.returnButton}
                      type="button"
                      onClick={() => closeTxCompleteScreen()}
                    >
                      <BackArrowIcon className={styles.fullRefundBackArrow} />
                      Return to Marketplace
                    </Box>
                  </Box>
                </Trace>
              ))}
          </Box>
        </Portal>
      )}
    </>
  )
}

export default TxCompleteModal
