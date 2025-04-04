import { formatEther as ethersFormatEther } from '@ethersproject/units'
import { InterfaceModalName, NFTEventName } from '@uniswap/analytics-events'
import clsx from 'clsx'
import { OpacityHoverState } from 'components/Common/styles'
import { UniIcon } from 'components/Logo/UniIcon'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import styled from 'lib/styled-components'
import * as styles from 'nft/components/collection/TransactionCompleteModal.css'
import { Portal } from 'nft/components/common/Portal'
import { BackArrowIcon, ChevronUpIcon, LightningBoltIcon, TwitterIcon } from 'nft/components/icons'
import { Overlay } from 'nft/components/modals/Overlay'
import { useNativeUsdPrice, useSendTransaction, useTransactionResponse } from 'nft/hooks'
import { TxResponse, TxStateType } from 'nft/types'
import { generateTweetForPurchase, getSuccessfulImageSize, parseTransactionResponse } from 'nft/utils'
import { formatAssetEventProperties } from 'nft/utils/formatEventProperties'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const TWITTER_WIDTH = 560
const TWITTER_HEIGHT = 480

const UploadLink = styled.a`
  position: absolute;
  right: 32px;
  top: 32px;
  color: ${({ theme }) => theme.neutral2};
  cursor: pointer;

  ${OpacityHoverState}

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
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
  const colors = useSporeColors()
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
      }, width=${TWITTER_WIDTH}, height=${TWITTER_HEIGHT}`,
    )
  }

  return (
    <>
      {shouldShowModal && (
        <Portal>
          <Overlay onClick={closeTxCompleteScreen} />
          <Flex className={styles.modalContainer} onPress={closeTxCompleteScreen}>
            {/* Successfully purchased NFTs */}
            {showPurchasedModal && (
              <Trace
                logImpression
                eventOnTrigger={NFTEventName.NFT_BUY_BAG_SUCCEEDED}
                properties={{
                  buy_quantity: nftsPurchased.length,
                  usd_value: parseFloat(ethersFormatEther(totalPurchaseValue)) * ethUsdPrice,
                  transaction_hash: txHash,
                  using_erc20: purchasedWithErc20,
                  ...formatAssetEventProperties(nftsPurchased),
                  ...trace,
                }}
              >
                <Flex
                  className={styles.successModal}
                  onPress={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <UniIcon color={colors.accent1.val} width="36" height="36" className={styles.uniLogo} />
                  <Flex flexWrap="wrap" width="100%" height="fit-content">
                    <h1 className={styles.title}>
                      <Trans i18nKey="nft.complete" />
                    </h1>
                    <p className={styles.subHeading}>
                      <Trans i18nKey="nft.wishGranted" />
                    </p>
                  </Flex>
                  <UploadLink onClick={shareTweet} target="_blank">
                    <TwitterIcon width={32} height={32} color={colors.neutral2.val} />
                  </UploadLink>
                  <Flex
                    className={styles.successAssetsContainer}
                    style={{
                      maxHeight: nftsPurchased.length > 32 ? (isMobile ? '172px' : '292px') : 'min-content',
                    }}
                  >
                    {[...nftsPurchased].map((nft, index) => (
                      <img
                        className={clsx(
                          styles.successAssetImage,
                          nftsPurchased.length > 1 && styles.successAssetImageGrid,
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
                  </Flex>
                  {nftsPurchased.length > 32 && <Flex className={styles.overflowFade} />}
                  <Flex
                    width="100%"
                    height="fit-content"
                    row
                    mt={20}
                    flexWrap="wrap"
                    alignItems="center"
                    pr={40}
                    pl={40}
                    className={styles.bottomBar}
                    justifyContent="space-between"
                  >
                    <Flex row alignItems="center">
                      <Flex mr={16}>
                        {nftsPurchased.length} NFT{nftsPurchased.length === 1 ? '' : 's'}
                      </Flex>
                      <Flex>
                        {formatEther({
                          input: totalPurchaseValue.toString(),
                          type: NumberType.NFTToken,
                        })}{' '}
                        ETH
                      </Flex>
                    </Flex>
                    <a href={txHashUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <Text color="$neutral2" variant="body2">
                        <Trans i18nKey="common.etherscan.link" />
                      </Text>
                    </a>
                  </Flex>
                </Flex>
              </Trace>
            )}
            {/* NFTs that were not purchased ie Refunds */}
            {showRefundModal &&
              /* Showing both purchases & refunds */
              (showPurchasedModal ? (
                <Trace
                  logImpression
                  eventOnTrigger={NFTEventName.NFT_BUY_BAG_REFUNDED}
                  properties={{
                    buy_quantity: nftsPurchased.length,
                    fail_quantity: nftsNotPurchased.length,
                    refund_amount_usd: totalUSDRefund,
                    transaction_hash: txHash,
                    ...trace,
                  }}
                >
                  <Flex
                    className={styles.mixedRefundModal}
                    onPress={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Flex
                      display="inline-flex"
                      flexWrap="wrap"
                      width="100%"
                      pr={0}
                      $lg={{
                        width: '50%',
                        pr: 32,
                      }}
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
                      <Flex
                        flexWrap="wrap"
                        bottom={24}
                        width="100%"
                        alignSelf="flex-end"
                        position="absolute"
                        $lg={{
                          position: 'static',
                        }}
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
                        <Flex
                          position="absolute"
                          right={0}
                          bottom={0}
                          justifyContent="flex-end"
                          $platform-web={{ textAlign: 'right' }}
                          flexShrink={0}
                          mr={40}
                          width="50%"
                          $lg={{
                            position: 'relative',
                            right: 'auto',
                            bottom: 'auto',
                            justifyContent: 'flex-start',
                            '$platform-web': { textAlign: 'left' },
                            mr: 24,
                            width: 'auto',
                          }}
                        >
                          <a href={txHashUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                            <Text variant="body2" mt={16} color="$neutral2" className={styles.totalEthCost}>
                              View on Etherscan
                            </Text>
                          </a>
                        </Flex>
                      </Flex>
                    </Flex>
                    <Flex className={styles.refundAssetsContainer}>
                      {nftsNotPurchased.map((nft, index) => (
                        <Flex flexWrap="wrap" height="fit-content" width={52} key={index}>
                          <img className={styles.refundAssetImage} src={nft.imageUrl} alt={nft.name} key={index} />
                        </Flex>
                      ))}
                    </Flex>
                    <Flex className={styles.refundOverflowFade} />
                  </Flex>
                </Trace>
              ) : (
                // Only showing when all assets are unavailable
                <Trace
                  logImpression
                  eventOnTrigger={NFTEventName.NFT_BUY_BAG_REFUNDED}
                  properties={{
                    buy_quantity: 0,
                    fail_quantity: nftsNotPurchased.length,
                    refund_amount_usd: totalUSDRefund,
                    ...trace,
                  }}
                >
                  <Flex
                    className={styles.fullRefundModal}
                    onPress={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Flex ml="auto" mr="auto">
                      {txState === TxStateType.Success ? (
                        <>
                          <LightningBoltIcon />
                          <h1 className={styles.title}>Instant Refund</h1>
                        </>
                      ) : (
                        <h1 className={styles.title}>Failed Transaction</h1>
                      )}
                    </Flex>
                    <p className={styles.bodySmall}>
                      {txState === TxStateType.Success &&
                        `Selected item${
                          nftsPurchased.length === 1 ? ' is' : 's are'
                        } no longer available. Uniswap instantly refunded you for this incomplete transaction. `}
                      {formatNumberOrString({ input: txFeeFiat, type: NumberType.FiatNFTToken })} was used for gas in
                      attempt to complete this transaction. For support, please visit our{' '}
                      <a href="https://discord.gg/FCfyBSbCU5">Discord</a>
                    </p>
                    <Flex className={styles.allUnavailableAssets}>
                      {nftsNotPurchased.length >= 3 && (
                        <Flex className={styles.toggleUnavailable} onPress={() => toggleShowUnavailable()}>
                          {!showUnavailable && (
                            <Flex pl="20" pt="8" pb="8">
                              {nftsNotPurchased.slice(0, 3).map((asset, index) => (
                                <img
                                  style={{ zIndex: 2 - index }}
                                  className={styles.unavailableAssetPreview}
                                  src={asset.imageUrl}
                                  alt={asset.name}
                                  key={index}
                                />
                              ))}
                            </Flex>
                          )}
                          <Flex row className={styles.unavailableText}>
                            <Text variant="body2" color={showUnavailable ? '$neutral1' : '$neutral2'}>
                              Unavailable
                            </Text>
                            <Text
                              variant="body2"
                              color={showUnavailable ? '$neutral1' : '$neutral2'}
                              className={styles.unavailableItems}
                            >
                              {nftsNotPurchased.length} item{nftsNotPurchased.length === 1 ? '' : 's'}
                            </Text>
                          </Flex>
                          <ChevronUpIcon className={`${!showUnavailable && styles.chevronDown} ${styles.chevron}`} />
                        </Flex>
                      )}
                      {(showUnavailable || nftsNotPurchased.length < 3) &&
                        nftsNotPurchased.map((asset, index) => (
                          <Flex backgroundColor="$surface1" p={4} mb={1} borderRadius="$rounded8" key={index}>
                            <Flex className={styles.assetContainer}>
                              <img className={styles.fullRefundImage} src={asset.imageUrl} alt={asset.name} />
                            </Flex>
                            <Flex flexWrap="wrap" mt="4">
                              <Flex ml={4} width="100%">
                                <p className={styles.totalEthCost} style={{ marginBottom: '2px' }}>
                                  {formatEther({
                                    input: asset.updatedPriceInfo
                                      ? asset.updatedPriceInfo.ETHPrice
                                      : asset.priceInfo.ETHPrice,
                                    type: NumberType.NFTToken,
                                  })}{' '}
                                  ETH
                                </p>
                              </Flex>
                              <Text variant="body2" color="$neutral1" className={styles.totalUsdRefund}>
                                {txState === TxStateType.Success ? 'Refunded' : asset.name}
                              </Text>
                            </Flex>
                          </Flex>
                        ))}
                    </Flex>
                    {showUnavailable && <Flex className={styles.fullRefundOverflowFade} />}
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
                    <Flex className={styles.walletAddress} ml="auto" mr="0">
                      <a href={txHashUrl} target="_blank" rel="noreferrer">
                        <Text variant="body2" className={styles.addressHash}>
                          View on Etherscan
                        </Text>
                      </a>
                    </Flex>
                    <p className={styles.totalEthCost}>
                      for {nftsNotPurchased.length} unavailable item
                      {nftsNotPurchased.length === 1 ? '' : 's'}.
                    </p>
                    <Flex
                      row
                      backgroundColor="$accent1"
                      cursor="pointer"
                      className={styles.returnButton}
                      onPress={() => closeTxCompleteScreen()}
                    >
                      <BackArrowIcon className={styles.fullRefundBackArrow} />
                      <Text variant="buttonLabel2" color="$neutral1">
                        Return to Marketplace
                      </Text>
                    </Flex>
                  </Flex>
                </Trace>
              ))}
          </Flex>
        </Portal>
      )}
    </>
  )
}

export default TxCompleteModal
