import { Dialog } from 'components/Dialog/Dialog'
import { Share as ShareIcon } from 'components/Icons/Share'
import { ActionButtonStyle } from 'components/Tokens/TokenDetails/shared'
import { ActionTileWithIconAnimation } from 'pages/Referral/Components/ActionTileWithIconAnimation'
import { MoneyIcon, RewardIcon, TransactionIcon, UserIcon, VolumeIcon } from 'pages/Referral/Components/OverviewIcon'
import { memo, useState } from 'react'
import { AlertCircle } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'theme/components/CopyHelper'
import { Button, Flex, Separator, Text, TouchableArea, styled, useMedia, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const ACTION_TILE_GAP = 12
const ACTION_TILE_WIDTH = `calc(50% - ${ACTION_TILE_GAP / 2}px)`
const TWITTER_WIDTH = 560
const TWITTER_HEIGHT = 480

const ActionTilesContainer = styled(Flex, {
  flexDirection: 'row',
  gap: ACTION_TILE_GAP,
  flexWrap: 'wrap',
  width: '100%',
  $md: { width: '100%' },
  variants: {
    singleRow: {
      true: {
        width: '100%',
        flexWrap: 'nowrap',
      },
    },
  } as const,
})

const ActionTileWrapper = styled(Flex, {
  width: ACTION_TILE_WIDTH,
  variants: {
    singleRow: {
      true: {
        width: 'auto',
        flexGrow: 1,
        flexBasis: 0,
      },
    },
  } as const,
})

const BORDER_COLOR = '$surface3'
const BORDER_WIDTH = 1

function formatPercent(value: number): string {
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value * 100)}%`
}

function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value)
}

function openShareReferralTweetWindow(tweetText: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const positionX = (window.screen.width - TWITTER_WIDTH) / 2
  const positionY = (window.screen.height - TWITTER_HEIGHT) / 2
  const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

  window.open(
    tweetIntentUrl,
    'newwindow',
    `left=${positionX}, top=${positionY}, width=${TWITTER_WIDTH}, height=${TWITTER_HEIGHT}`,
  )
}

type ReferralOverviewProps = {
  yourRebateRate: number
  inviteeDiscountRate: number
  currentRewards: number
  referralCode: string
  referralLink: string
  invitedUsersCount: number
  inviteTransactionCount: number
  myTransactionVolume: number
  invitedTransactionVolume: number
  onOpenActivitiesTab?: () => void
}

export const ReferralOverview = memo(function ReferralOverview({
  yourRebateRate,
  inviteeDiscountRate,
  currentRewards,
  referralCode,
  referralLink,
  invitedUsersCount,
  inviteTransactionCount,
  myTransactionVolume,
  invitedTransactionVolume,
  onOpenActivitiesTab,
}: ReferralOverviewProps) {
  const media = useMedia()
  const colors = useSporeColors()
  const isSingleRow = !!media.xl && !media.md
  const isMobile = media.md
  const { t } = useTranslation()
  const [isClaimNoticeOpen, setIsClaimNoticeOpen] = useState(false)
  const shareReferralLink = referralLink || (typeof window !== 'undefined' ? window.location.href : '')

  const handleShareReferralOnTwitter = () => {
    openShareReferralTweetWindow(
      t('referral.overview.shareTweetText', {
        link: shareReferralLink,
      }),
    )
  }

  return (
    <>
      <Dialog
        isOpen={isClaimNoticeOpen}
        onClose={() => setIsClaimNoticeOpen(false)}
        icon={<AlertCircle size={20} color="currentColor" />}
        title={t('referral.overview.claimUnavailableModal.title')}
        subtext={t('referral.overview.claimUnavailableModal.description')}
        modalName={ModalName.Dialog}
        primaryButtonText={t('referral.overview.claimUnavailableModal.primaryAction')}
        primaryButtonOnClick={() => {
          setIsClaimNoticeOpen(false)
          onOpenActivitiesTab?.()
        }}
        secondaryButtonText={t('common.button.close')}
        secondaryButtonOnClick={() => setIsClaimNoticeOpen(false)}
        hasIconBackground
      />
      <Flex gap="$spacing40" mb="$spacing40">
        <Flex row gap="$spacing40" $xl={{ flexDirection: 'column' }}>
          {/* left card */}
          <Flex
            grow
            shrink
            minWidth="50%"
            borderWidth={BORDER_WIDTH}
            borderColor={BORDER_COLOR}
            overflow="hidden"
            borderRadius="$rounded16"
          >
            <Flex
              flex={1}
              p={isMobile ? '$spacing12' : '$spacing20'}
              backgroundColor="$surface1"
              gap={isMobile ? '$spacing12' : '$spacing16'}
            >
              <Flex row justifyContent="space-between" alignItems="center" gap="$spacing8">
                <Flex row gap="$spacing8" alignItems="center" flexWrap="wrap">
                  <Text variant="heading3" color="$neutral1">
                    {t('referral.overview.title')}
                  </Text>
                </Flex>
                <Button
                  size="small"
                  maxWidth="fit-content"
                  variant="branded"
                  onPress={() => setIsClaimNoticeOpen(true)}
                >
                  {t('referral.claimButton')}
                </Button>
              </Flex>

              <Flex row gap="$spacing24" flexWrap="wrap" alignItems="center" justifyContent="space-between">
                <Flex row grow gap="$spacing8" alignItems="center" flexWrap="wrap">
                  <Flex gap="$spacing2">
                    <Text variant="subheading1" color="$neutral2">
                      {t('referral.overview.yourRebate')}
                    </Text>
                    <Text variant={isMobile ? 'heading3' : 'heading3'} color="$neutral1">
                      {formatPercent(yourRebateRate)}
                    </Text>
                  </Flex>
                  <Flex width={1} height={32} backgroundColor="$surface2" display={isMobile ? 'none' : 'flex'} />
                  <Flex gap="$spacing2">
                    <Text variant="subheading1" color="$neutral2">
                      {t('referral.overview.inviteeDiscount')}
                    </Text>
                    <Text variant={isMobile ? 'heading3' : 'heading3'} color="$neutral1">
                      {formatPercent(inviteeDiscountRate)}
                    </Text>
                  </Flex>
                </Flex>
                <Flex gap="$spacing2">
                  <Flex row gap="$spacing2" alignItems="center" justifyContent="flex-end">
                    <Text variant="subheading1" color="$neutral2">
                      {t('referral.overview.currentRewards')}
                    </Text>
                    <MoneyIcon size={iconSizes.icon18} color="$neutral2" />
                  </Flex>
                  <Text textAlign="right" variant={isMobile ? 'heading3' : 'heading2'} color="$neutral1">
                    ${formatNumber(currentRewards)}
                  </Text>
                </Flex>
              </Flex>

              <Flex
                row
                justifyContent="space-between"
                alignItems="center"
                p={isMobile ? '$spacing8' : '$spacing12'}
                borderRadius="$rounded12"
                backgroundColor="$surface2"
                gap="$spacing8"
                minHeight={isMobile ? 36 : 48}
              >
                <Text variant={isMobile ? 'buttonLabel3' : 'buttonLabel2'} color="$neutral1" numberOfLines={1}>
                  {referralCode || '--'}
                </Text>
                <CopyHelper iconSize={14} iconPosition="right" toCopy={referralCode}>
                  <Text variant="body4" color="$neutral2">
                    {t('common.button.copy')}
                  </Text>
                </CopyHelper>
              </Flex>
              <Flex
                row
                justifyContent="space-between"
                alignItems="center"
                p={isMobile ? '$spacing8' : '$spacing12'}
                borderRadius="$rounded12"
                backgroundColor="$surface2"
                gap="$spacing8"
                minHeight={isMobile ? 36 : 48}
              >
                <Text variant={isMobile ? 'buttonLabel3' : 'buttonLabel2'} color="$neutral1" numberOfLines={1}>
                  {referralLink || '--'}
                </Text>
                <CopyHelper iconSize={14} iconPosition="right" toCopy={referralLink}>
                  <Text variant="body4" color="$neutral2">
                    {t('common.button.copy')}
                  </Text>
                </CopyHelper>
              </Flex>
              <Flex row alignItems="center" gap="$spacing8" flexWrap="wrap">
                <Text variant="body3" color="$neutral2">
                  {t('referral.overview.upgradeHint')}
                </Text>
                <TouchableArea {...ActionButtonStyle} onPress={handleShareReferralOnTwitter}>
                  <ShareIcon width={18} height={18} fill={colors.neutral1.val} />
                </TouchableArea>
              </Flex>
            </Flex>
          </Flex>
          {/* right card */}
          <Flex gap="$spacing16" grow shrink>
            <ActionTilesContainer grow>
              <ActionTileWrapper singleRow={isSingleRow} grow>
                <ActionTileWithIconAnimation
                  Icon={UserIcon}
                  dataTestId="send"
                  onClick={() => {}}
                  name={t('referral.overview.invitedUsers')}
                  value={formatNumber(invitedUsersCount, 0)}
                />
              </ActionTileWrapper>
              <ActionTileWrapper singleRow={isSingleRow} grow>
                <ActionTileWithIconAnimation
                  Icon={TransactionIcon}
                  dataTestId="send"
                  onClick={() => {}}
                  name={t('referral.overview.transactionCount')}
                  value={formatNumber(inviteTransactionCount, 0)}
                />
              </ActionTileWrapper>
              <ActionTileWrapper singleRow={isSingleRow} grow>
                <ActionTileWithIconAnimation
                  Icon={VolumeIcon}
                  dataTestId="send"
                  onClick={() => {}}
                  name={t('referral.overview.myVolume')}
                  value={`$${formatNumber(myTransactionVolume)}`}
                />
              </ActionTileWrapper>
              <ActionTileWrapper singleRow={isSingleRow} grow>
                <ActionTileWithIconAnimation
                  Icon={RewardIcon}
                  dataTestId="send"
                  onClick={() => {}}
                  name={t('referral.overview.invitedVolume')}
                  value={`$${formatNumber(invitedTransactionVolume)}`}
                />
              </ActionTileWrapper>
            </ActionTilesContainer>
          </Flex>
        </Flex>
        <Separator />
      </Flex>
    </>
  )
})
