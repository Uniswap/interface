/* eslint-disable import/no-unused-modules */

import { PointTxList } from 'pages/Referral/Components/TransactionList'
import { useTranslation } from 'react-i18next'
import { CopyToClipboard } from 'theme/components/CopyHelper'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, useMedia } from 'ui/src'

interface TransactionPoint {
  txHash: string
  createdAt: string
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(value)
}

export function Referrals({
  referralPoints,
  referralCode,
  inviteesCount,
  transactions,
  loading,
}: {
  referralPoints: number
  referralCode: string
  inviteesCount: number
  transactions: TransactionPoint[]
  loading: boolean
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const isMobile = media.md
  const referralUrl =
    typeof window !== 'undefined' && referralCode ? `${window.location.origin}/referral?code=${referralCode}` : ''

  return (
    <Flex gap="$spacing32" flexDirection="column" width="100%">
      {/* Section 1: My Invite Code */}
      <Flex flexDirection="column" gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          {t('referral.referrals.inviteCodeTitle')}
        </Text>

        <Flex flexDirection="row" gap="$spacing16" flexWrap="wrap" alignItems="flex-end">
          <Flex
            p="$spacing16"
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            borderWidth={1}
            borderColor="$surface3"
            alignItems="center"
            justifyContent="center"
            width={isMobile ? '100%' : 'fit-content'}
            maxWidth={isMobile ? '100%' : 340}
            alignSelf="flex-start"
          >
            <CopyToClipboard toCopy={referralUrl}>
              <Text
                variant="heading3"
                color="$neutral1"
                maxWidth={isMobile ? '100%' : 280}
                numberOfLines={1}
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                textAlign="left"
                {...EllipsisTamaguiStyle}
              >
                {referralCode.length > 0 ? referralCode : '--'}
              </Text>
            </CopyToClipboard>
          </Flex>
        </Flex>
      </Flex>

      {/* Section 2: Your Referral Results */}
      <Flex flexDirection="column" gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          {t('referral.referrals.resultsTitle')}
        </Text>

        {loading ? (
          <Flex p="$spacing16" justifyContent="center">
            <Text variant="body2" color="$neutral2">
              {t('referral.referrals.resultsLoading')}
            </Text>
          </Flex>
        ) : (
          <Flex flexDirection="column" gap="$spacing16">
            <Flex flexDirection="row" gap="$spacing16" flexWrap="wrap">
              <Flex
                p="$spacing16"
                borderRadius="$rounded16"
                borderWidth={1}
                borderColor="$surface3"
                backgroundColor="$surface2"
                gap="$spacing4"
                width={isMobile ? '100%' : 'fit-content'}
                minWidth={isMobile ? '100%' : 140}
              >
                <Text variant="body2" color="$neutral2">
                  {t('referral.referrals.inviteesCountLabel')}
                </Text>
                <Text variant="heading3" color="$neutral1">
                  {inviteesCount}
                </Text>
              </Flex>

              <Flex
                p="$spacing16"
                borderRadius="$rounded16"
                borderWidth={1}
                borderColor="$surface3"
                backgroundColor="$surface2"
                gap="$spacing4"
                width={isMobile ? '100%' : 'fit-content'}
                minWidth={isMobile ? '100%' : 140}
              >
                <Text variant="body2" color="$neutral2">
                  {t('referral.referrals.referralPointsLabel')}
                </Text>
                <Text variant="heading3" color="$neutral1">
                  {formatNumber(referralPoints)}
                </Text>
              </Flex>
            </Flex>

            <Flex height={1} backgroundColor="$surface3" width="100%" />

            <Flex flexDirection="column" gap="$spacing2" mt="$spacing24">
              <PointTxList transactions={transactions} loading={loading} />
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
