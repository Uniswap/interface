import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { CreateAuctionTokenLogo } from '~/pages/Liquidity/CreateAuction/components/CreateAuctionTokenLogo'
import {
  LaunchAuctionProgressIndicator,
  type LaunchProgressStep,
} from '~/pages/Liquidity/CreateAuction/components/LaunchAuctionProgressIndicator'
import { ReviewAuctionDateTime } from '~/pages/Liquidity/CreateAuction/components/reviewLaunch/ReviewLaunchStepPrimitives'
import type { TokenAccentHex } from '~/pages/Liquidity/CreateAuction/tokenAccentHex'
import type { AuctionTokenAmounts } from '~/pages/Liquidity/CreateAuction/types'

const TOKEN_LOGO_SIZE = 40

interface LaunchAuctionReviewModalProps {
  isOpen: boolean
  onClose: () => void
  tokenName: string
  tokenSymbol: string
  description?: string
  isNewToken: boolean
  committed: AuctionTokenAmounts
  startTime?: Date
  endTime?: Date
  feeTierDisplay: string
  raiseCurrencySymbol: string
  tokenColor?: TokenAccentHex
  progressSteps: LaunchProgressStep[]
  currentProgressStepIndex: number
  currentStepPending: boolean
  isLaunching: boolean
  onLaunchToken: () => void
}

function AmountColumn({ label, value, symbol }: { label: string; value: number; symbol: string }): JSX.Element {
  return (
    <Flex fill gap="$spacing4">
      <Text variant="body4" color="$neutral2">
        {label}
      </Text>
      <SubscriptZeroPrice
        value={value}
        symbol={symbol}
        variant="body1"
        color="$neutral1"
        minSignificantDigits={1}
        maxSignificantDigits={4}
      />
    </Flex>
  )
}

export function LaunchAuctionReviewModal({
  isOpen,
  onClose,
  tokenName,
  tokenSymbol,
  description,
  isNewToken,
  committed,
  startTime,
  endTime,
  feeTierDisplay,
  raiseCurrencySymbol,
  tokenColor,
  progressSteps,
  currentProgressStepIndex,
  currentStepPending,
  isLaunching,
  onLaunchToken,
}: LaunchAuctionReviewModalProps): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const showProgress = currentProgressStepIndex >= 0 && progressSteps.length > 0

  const postAuctionTokenAmount = formatNumberOrString({
    value: committed.postAuctionLiquidityAmount.toExact(),
    type: NumberType.TokenNonTx,
  })

  return (
    <Modal
      name={ModalName.LaunchAuctionReview}
      isModalOpen={isOpen}
      onClose={onClose}
      maxWidth={420}
      padding="$spacing0"
      pt="$spacing12"
      pb="$spacing8"
      paddingX="$spacing8"
    >
      <Flex width="100%" gap="$spacing12">
        <Flex gap="$spacing12" px="$spacing12">
          <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8">
            <Text variant="subheading2" color="$neutral2">
              {t('toucan.createAuction.review.title')}
            </Text>
            <TouchableArea onPress={onClose}>
              <X size="$icon.20" color="$neutral2" />
            </TouchableArea>
          </Flex>

          <Flex row alignItems="center" gap="$spacing16">
            <CreateAuctionTokenLogo size={TOKEN_LOGO_SIZE} />
            <Flex fill gap="$spacing4">
              <Text variant="heading3" color="$neutral1">
                {tokenName}
              </Text>
              <Text variant="body2" color="$neutral2">
                {tokenSymbol}
              </Text>
            </Flex>
          </Flex>

          {showProgress ? (
            <LaunchAuctionProgressIndicator
              steps={progressSteps}
              currentStepIndex={currentProgressStepIndex}
              tokenSymbol={tokenSymbol}
              submitting={currentStepPending}
            />
          ) : (
            <>
              {description ? (
                <Text variant="body3" color="$neutral1">
                  {description}
                </Text>
              ) : null}

              <Flex row gap="$spacing16">
                {isNewToken ? (
                  <AmountColumn
                    label={t('toucan.createAuction.reviewModal.creating')}
                    value={Number(committed.totalSupply.toExact())}
                    symbol={tokenSymbol}
                  />
                ) : null}
                <AmountColumn
                  label={t('common.depositing')}
                  value={Number(committed.auctionSupplyAmount.toExact())}
                  symbol={tokenSymbol}
                />
              </Flex>

              {startTime || endTime ? (
                <Flex row gap="$spacing16">
                  <Flex fill gap="$spacing4">
                    <Text variant="body4" color="$neutral2">
                      {t('toucan.createAuction.reviewModal.auctionStarts')}
                    </Text>
                    {startTime ? <ReviewAuctionDateTime date={startTime} /> : null}
                  </Flex>
                  <Flex fill gap="$spacing4">
                    <Text variant="body4" color="$neutral2">
                      {t('toucan.createAuction.reviewModal.auctionEnds')}
                    </Text>
                    {endTime ? <ReviewAuctionDateTime date={endTime} /> : null}
                  </Flex>
                </Flex>
              ) : null}

              <Flex backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12" gap="$spacing8">
                <Flex row alignItems="center" gap="$spacing4">
                  <InfoCircleFilled size="$icon.16" color="$neutral2" />
                  <Text variant="body3" color="$neutral2">
                    {t('toucan.details.postAuctionLiquidity')}
                  </Text>
                </Flex>
                <Text variant="body3" color="$neutral1">
                  {t('toucan.createAuction.reviewModal.postAuctionLiquidityDescription', {
                    feeTier: feeTierDisplay,
                    tokenAmount: postAuctionTokenAmount,
                    tokenSymbol,
                    raiseCurrency: raiseCurrencySymbol,
                  })}
                </Text>
              </Flex>
            </>
          )}
        </Flex>

        {showProgress ? null : (
          <Flex row>
            <Button
              size="large"
              emphasis="primary"
              fill
              backgroundColor={isLaunching ? undefined : tokenColor}
              loading={isLaunching}
              isDisabled={isLaunching}
              onPress={onLaunchToken}
            >
              {t('toucan.createAuction.launchToken')}
            </Button>
          </Flex>
        )}
      </Flex>
    </Modal>
  )
}
