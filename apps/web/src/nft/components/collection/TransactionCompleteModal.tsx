import { formatEther as ethersFormatEther } from '@ethersproject/units'
import { InterfaceModalName, NFTEventName } from '@uniswap/analytics-events'
import { OpacityHoverState } from 'components/Common/styles'
import { UniIcon } from 'components/Logo/UniIcon'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import styled from 'lib/styled-components'
import { Portal } from 'nft/components/common/Portal'
import { BackArrowIcon, ChevronUpIcon, LightningBoltIcon, TwitterIcon } from 'nft/components/icons'
import { Overlay } from 'nft/components/modals/Overlay'
import { useNativeUsdPrice, useSendTransaction, useTransactionResponse } from 'nft/hooks'
import { TxResponse, TxStateType } from 'nft/types'
import { generateTweetForPurchase, getSuccessfulImageSize, parseTransactionResponse } from 'nft/utils'
import { formatAssetEventProperties } from 'nft/utils/formatEventProperties'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { Flex, Image, Text, useSporeColors } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
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
          <style>
            {`
              .hideWebkitScrollbar {
                ::-webkit-scrollbar {
                  display: none;
                }
              }
            `}
          </style>
          <Flex
            height="100%"
            width="min-content"
            left="50%"
            ml={-320}
            top={0}
            zIndex={zIndexes.modal}
            overflow="scroll"
            pt={72}
            pb={72}
            px="$padding12"
            justifyContent="center"
            gap="$gap24"
            $md={{
              width: '100%',
              left: 0,
              ml: 'unset',
            }}
            $platform-web={{
              position: 'fixed',
              scrollbarWidth: 'none',
            }}
            className="hideWebkitScrollbar"
            onPress={closeTxCompleteScreen}
          >
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
                  backgroundColor="$surface1"
                  borderRadius="$rounded20"
                  flexWrap="wrap"
                  height="min-content"
                  position="relative"
                  width="min-content"
                  minWidth={640}
                  $md={{
                    width: '100%',
                    minWidth: 'unset',
                  }}
                  py={28}
                  boxShadow="$dropShadow"
                  $platform-web={{
                    boxSizing: 'border-box',
                  }}
                  onPress={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <UniIcon
                    color={colors.accent1.val}
                    width="36"
                    height="36"
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: 16,
                      ['@media' as string]: {
                        'screen and (min-width: 656px)': {
                          left: 32,
                          top: 20,
                        },
                      },
                    }}
                  />
                  <Flex flexWrap="wrap" width="100%" height="fit-content">
                    <Text
                      tag="h1"
                      color="$neutral1"
                      ml="auto"
                      mr="auto"
                      $md={{ mb: 8 }}
                      mt={0}
                      variant="heading1"
                      mb={4}
                    >
                      <Trans i18nKey="nft.complete" />
                    </Text>
                    <Text
                      tag="p"
                      color="$neutral2"
                      variant="body3"
                      width="100%"
                      ml="auto"
                      mr="auto"
                      textAlign="center"
                      mt={0}
                      mb={20}
                    >
                      <Trans i18nKey="nft.wishGranted" />
                    </Text>
                  </Flex>
                  <UploadLink onClick={shareTweet} target="_blank">
                    <TwitterIcon width={32} height={32} color={colors.neutral2.val} />
                  </UploadLink>
                  <Flex
                    $platform-web={{
                      flexWrap: 'wrap',
                    }}
                    width="100%"
                    overflow="scroll"
                    justifyContent="center"
                    height="min-content"
                    scrollbarWidth="none"
                    className="hideWebkitScrollbar"
                    style={{
                      maxHeight: nftsPurchased.length > 32 ? (isMobile ? '172px' : '292px') : 'min-content',
                    }}
                  >
                    {[...nftsPurchased].map((nft, index) => (
                      <img
                        style={{
                          borderRadius: 12,
                          flexShrink: 0,
                          height: 'auto',
                          width: 'auto',
                          boxSizing: 'border-box',
                          objectFit: 'contain',
                          marginRight: nftsPurchased.length > 1 ? 8 : 0,
                          marginBottom: nftsPurchased.length > 1 ? 8 : 0,
                          ['@media' as string]: {
                            'screen and (max-width: 656px)': {
                              marginRight: nftsPurchased.length ? 4 : 0,
                              marginBottom: nftsPurchased.length ? 4 : 0,
                            },
                          },
                          maxHeight: `${getSuccessfulImageSize(nftsPurchased.length, isMobile)}px`,
                          maxWidth: `${getSuccessfulImageSize(nftsPurchased.length, isMobile)}px`,
                        }}
                        src={nft.imageUrl}
                        alt={nft.name}
                        key={index}
                      />
                    ))}
                  </Flex>
                  {nftsPurchased.length > 32 && (
                    <Flex
                      height={20}
                      width={576}
                      ml="$spacing32"
                      mt={-20}
                      $platform-web={{
                        backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, var(--surface1) 100%)',
                      }}
                    />
                  )}
                  <Flex
                    width="100%"
                    height="fit-content"
                    row
                    mt={20}
                    flexWrap="wrap"
                    alignItems="center"
                    pr={40}
                    pl={40}
                    justifyContent="space-between"
                  >
                    <Flex row alignItems="center">
                      <Text variant="body3" color="$neutral1" mr={16}>
                        {nftsPurchased.length} NFT{nftsPurchased.length === 1 ? '' : 's'}
                      </Text>
                      <Text variant="body3" color="$neutral1">
                        {formatEther({
                          input: totalPurchaseValue.toString(),
                          type: NumberType.NFTToken,
                        })}{' '}
                        ETH
                      </Text>
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
                    backgroundColor="$surface1"
                    borderRadius="$rounded20"
                    flexWrap="wrap"
                    height="min-content"
                    position="relative"
                    mt={8}
                    boxShadow="$dropShadow"
                    py={32}
                    pr={24}
                    pl={32}
                    width="100%"
                    minWidth={640}
                    $md={{
                      pt: 24,
                      pr: 16,
                      pl: 24,
                      pb: 0,
                      width: '100%',
                      minWidth: 'unset',
                    }}
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
                      <Text tag="p" variant="body2" color="$neutral1" ml={4} mr="auto" mt={2} mb="auto" $md={{ mb: 0 }}>
                        Instant Refund
                      </Text>
                      <Text tag="p" color="$neutral1" variant="body3" width="100%" ml="auto" mr="auto" mt={10} mb={16}>
                        Uniswap returned{' '}
                        <span style={{ fontWeight: 535 }}>
                          {formatEther({
                            input: totalRefundValue.toString(),
                            type: NumberType.NFTToken,
                          })}{' '}
                          ETH
                        </span>{' '}
                        back to your wallet for unavailable items.
                      </Text>
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
                        <Text tag="p" variant="body3" color="$neutral2" mb={2} mt={1}>
                          {formatEther({
                            input: totalRefundValue.toString(),
                            type: NumberType.NFTToken,
                          })}{' '}
                          ETH
                        </Text>
                        <Text tag="p" variant="body4" color="$neutral2" mb={2} mt={3} ml={4}>
                          {formatNumberOrString({ input: totalUSDRefund, type: NumberType.FiatNFTToken })}
                        </Text>
                        <Text tag="p" variant="body3" width="100%" mb={0} mt={1} color="$neutral2">
                          for {nftsNotPurchased.length} unavailable item
                          {nftsNotPurchased.length === 1 ? '' : 's'}.
                        </Text>
                        <Flex
                          position="absolute"
                          right={0}
                          bottom={0}
                          justifyContent="flex-end"
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
                            <Text variant="body3" my="$spacing16" color="$neutral2">
                              View on Etherscan
                            </Text>
                          </a>
                        </Flex>
                      </Flex>
                    </Flex>
                    <Flex
                      height="100%"
                      width="50%"
                      flexWrap="wrap"
                      overflow="scroll"
                      row
                      display="inline-flex"
                      maxHeight={152}
                      scrollbarWidth="none"
                      className="hideWebkitScrollbar"
                      $md={{
                        width: '100%',
                        height: '100%',
                        pl: '$padding16',
                      }}
                    >
                      {nftsNotPurchased.map((nft, index) => (
                        <Flex flexWrap="wrap" height="fit-content" width={52} key={index}>
                          <Image
                            height={52}
                            width={52}
                            src={nft.imageUrl}
                            alt={nft.name}
                            key={index}
                            borderRadius="$rounded8"
                            mr={4}
                            mb={1}
                            borderColor="$surface1"
                            borderWidth={2}
                            $platform-web={{
                              filter: 'grayscale(100%)',
                              boxSizing: 'border-box',
                            }}
                          />
                        </Flex>
                      ))}
                    </Flex>
                    <Flex
                      width="50%"
                      ml="auto"
                      zIndex={zIndexes.default}
                      $platform-web={{
                        backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, var(--surface1) 100%)',
                      }}
                      height={30}
                      mr={18}
                      mt={-20}
                      $md={{
                        width: '100%',
                      }}
                    />
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
                    backgroundColor="$surface1"
                    borderRadius="$rounded20"
                    flexWrap="wrap"
                    ml={100}
                    $md={{
                      ml: 'auto',
                    }}
                    mr="auto"
                    boxShadow="$dropShadow"
                    width={344}
                    height="min-content"
                    $platform-web={{
                      textAlign: 'center',
                    }}
                    onPress={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Flex ml="auto" mr="auto" mt="$spacing16" mb="$spacing8">
                      {txState === TxStateType.Success ? (
                        <>
                          <LightningBoltIcon />
                          <Text tag="h1" variant="heading1" mb={4} $md={{ mb: 0 }}>
                            Instant Refund
                          </Text>
                        </>
                      ) : (
                        <Text tag="h1" variant="heading2" mb={4} $md={{ mb: 0 }}>
                          Failed Transaction
                        </Text>
                      )}
                    </Flex>
                    <Text tag="p" color="$neutral1" variant="body3" ml="auto" mr="auto" mt={4} mb={22}>
                      {txState === TxStateType.Success &&
                        `Selected item${
                          nftsPurchased.length === 1 ? ' is' : 's are'
                        } no longer available. Uniswap instantly refunded you for this incomplete transaction. `}
                      {formatNumberOrString({ input: txFeeFiat, type: NumberType.FiatNFTToken })} was used for gas in
                      attempt to complete this transaction. For support, please visit our{' '}
                      <a href="https://discord.gg/FCfyBSbCU5">Discord</a>
                    </Text>
                    <Flex
                      width="100%"
                      $platform-web={{
                        overflow: 'auto',
                      }}
                      maxHeight={210}
                      minHeight={58}
                    >
                      {nftsNotPurchased.length >= 3 && (
                        <Flex
                          backgroundColor="$surface1"
                          borderRadius="$rounded8"
                          height={52}
                          flexWrap="wrap"
                          mt={1}
                          mb={1}
                          cursor="pointer"
                          onPress={() => toggleShowUnavailable()}
                        >
                          {!showUnavailable && (
                            <Flex pl="20" pt="8" pb="8">
                              {nftsNotPurchased.slice(0, 3).map((asset, index) => (
                                <Image
                                  style={{ zIndex: 2 - index }}
                                  height={36}
                                  width={36}
                                  borderRadius="$rounded4"
                                  position="relative"
                                  borderColor="$surface1"
                                  borderWidth={2}
                                  ml={-16}
                                  $platform-web={{
                                    boxSizing: 'border-box',
                                    filter: 'grayscale(100%)',
                                  }}
                                  src={asset.imageUrl}
                                  alt={asset.name}
                                  key={index}
                                />
                              ))}
                            </Flex>
                          )}
                          <Flex row py="$padding8" pl="$padding12" $platform-web={{ fontStyle: 'normal' }}>
                            <Text variant="body2" color={showUnavailable ? '$neutral1' : '$neutral2'}>
                              Unavailable
                            </Text>
                            <Text variant="body3" color={showUnavailable ? '$neutral1' : '$neutral2'}>
                              {nftsNotPurchased.length} item{nftsNotPurchased.length === 1 ? '' : 's'}
                            </Text>
                          </Flex>
                          <ChevronUpIcon
                            style={{
                              marginBottom: 'auto',
                              marginLeft: '0',
                              marginRight: 'auto',
                              height: 20,
                              width: 20,
                              marginTop: 7,
                              transform: !showUnavailable ? 'rotate(180deg)' : 'none',
                            }}
                          />
                        </Flex>
                      )}
                      {(showUnavailable || nftsNotPurchased.length < 3) &&
                        nftsNotPurchased.map((asset, index) => (
                          <Flex backgroundColor="$surface1" p={4} mb={1} borderRadius="$rounded8" key={index}>
                            <Flex
                              height={48}
                              width={48}
                              flexShrink={0}
                              mr={4}
                              justifyContent="center"
                              alignItems="center"
                            >
                              <img
                                style={{
                                  borderRadius: 4,
                                  height: 'auto',
                                  maxHeight: 36,
                                  width: 'auto',
                                  maxWidth: 36,
                                  objectFit: 'contain',
                                  boxSizing: 'border-box',
                                  filter: 'grayscale(100%)',
                                }}
                                src={asset.imageUrl}
                                alt={asset.name}
                              />
                            </Flex>
                            <Flex flexWrap="wrap" mt="4">
                              <Flex ml={4} width="100%">
                                <Text tag="p" mb={2} variant="body3" color="$neutral2" mt={1}>
                                  {formatEther({
                                    input: asset.updatedPriceInfo
                                      ? asset.updatedPriceInfo.ETHPrice
                                      : asset.priceInfo.ETHPrice,
                                    type: NumberType.NFTToken,
                                  })}{' '}
                                  ETH
                                </Text>
                              </Flex>
                              <Text variant="body4" color="$neutral2" ml={4} mt={3} mb={2}>
                                {txState === TxStateType.Success ? 'Refunded' : asset.name}
                              </Text>
                            </Flex>
                          </Flex>
                        ))}
                    </Flex>
                    {showUnavailable && (
                      <Flex
                        width={266}
                        height={20}
                        mt={-20}
                        mb={20}
                        position="relative"
                        $platform-web={{
                          backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, var(--surface1) 100%)',
                        }}
                      />
                    )}
                    <Text tag="p" mb={2} variant="body3" color="$neutral2" mt={1}>
                      {formatEther({
                        input: totalRefundValue.toString(),
                        type: NumberType.NFTToken,
                      })}{' '}
                      ETH
                    </Text>
                    <Text tag="p" variant="body4" color="$neutral2" ml={4} mt={3} mb={2}>
                      {formatNumberOrString({ input: totalUSDRefund, type: NumberType.FiatNFTToken })}
                    </Text>
                    <Text tag="p" variant="body3" color="$neutral2" mt={1}>
                      for {nftsNotPurchased.length} unavailable item
                      {nftsNotPurchased.length === 1 ? '' : 's'}.
                    </Text>
                    <Flex mx="auto" alignItems="center" height="min-content" my="$spacing4">
                      <a href={txHashUrl} target="_blank" rel="noreferrer">
                        <Text variant="body2" color="$neutral2" my="$spacing12" letterSpacing={0.04}>
                          View on Etherscan
                        </Text>
                      </a>
                    </Flex>
                    <Flex
                      row
                      backgroundColor="$accent1"
                      cursor="pointer"
                      height={40}
                      alignItems="center"
                      ml="auto"
                      mr="auto"
                      my="$spacing16"
                      width={276}
                      borderRadius="$roundedFull"
                      onPress={() => closeTxCompleteScreen()}
                    >
                      <BackArrowIcon fill="white" style={{ marginLeft: 12, marginRight: 28 }} />
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
