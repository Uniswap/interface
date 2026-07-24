import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags } from '@universe/gating'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGatedTokenDetailsRWAMatch } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Clock, InfoCircle } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useIsEquityOffHours } from 'uniswap/src/features/rwa/useIsEquityOffHours'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { openUri } from 'uniswap/src/utils/linking'

const OFF_HOURS_SHEET_SNAP_POINTS = [336]

export function OffHoursMarketWarning(): JSX.Element | null {
  const { t } = useTranslation()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const rwaMatch = useGatedTokenDetailsRWAMatch(FeatureFlags.RWATdp)
  const isOffHours = useIsEquityOffHours()

  const closeSheet = useCallback((): void => setIsSheetOpen(false), [])
  const openSheet = useCallback((): void => {
    setIsSheetOpen(true)
    sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      section: 'market-close-warning',
      token_address: rwaMatch?.token.address,
      token_symbol: rwaMatch?.token.symbol,
    })
  }, [rwaMatch])
  const openLearnMore = useCallback((): void => {
    openUri({ uri: UniswapHelpUrls.articles.rwaOffHours }).catch(() => undefined)
  }, [])

  if (!rwaMatch || !isOffHours) {
    return null
  }

  return (
    <>
      <TouchableArea
        row
        alignItems="center"
        backgroundColor="$surface2"
        borderRadius="$rounded12"
        gap="$spacing8"
        minHeight={44}
        mx="$spacing16"
        px="$spacing16"
        py="$spacing12"
        testID={TestID.TokenDetailsRWAOffHoursBanner}
        onPress={openSheet}
      >
        <Clock color="$neutral2" size="$icon.20" />
        <Text color="$neutral1" flex={1} numberOfLines={2} variant="body3">
          {t('tdp.rwa.offHours.banner')}
        </Text>
        <InfoCircle color="$neutral2" size="$icon.20" />
      </TouchableArea>

      {isSheetOpen ? (
        <Modal name={ModalName.RwaOffHours} snapPoints={OFF_HOURS_SHEET_SNAP_POINTS} onClose={closeSheet}>
          <Flex alignItems="center" gap="$spacing24" px="$spacing24" pb="$spacing36">
            <Flex alignItems="center" gap="$spacing16" width="100%">
              <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" height={48} width={48}>
                <Clock color="$neutral1" size="$icon.24" />
              </Flex>
              <Flex alignItems="center" gap="$spacing8" width="100%">
                <Text color="$neutral1" textAlign="center" variant="subheading1">
                  {t('tdp.rwa.offHours.title')}
                </Text>
                <Text color="$neutral2" textAlign="center" variant="body3">
                  {t('tdp.rwa.offHours.warning', { name: rwaMatch.asset.name, ticker: rwaMatch.asset.symbol })}
                </Text>
                <TouchableArea onPress={openLearnMore}>
                  <Text color="$neutral1" variant="buttonLabel3">
                    {t('common.button.learn')}
                  </Text>
                </TouchableArea>
              </Flex>
            </Flex>
            <TouchableArea
              centered
              backgroundColor="$surface3"
              borderRadius="$rounded16"
              height={48}
              width="100%"
              onPress={closeSheet}
            >
              <Text color="$neutral1" variant="buttonLabel2">
                {t('common.button.close')}
              </Text>
            </TouchableArea>
          </Flex>
        </Modal>
      ) : null}
    </>
  )
}
