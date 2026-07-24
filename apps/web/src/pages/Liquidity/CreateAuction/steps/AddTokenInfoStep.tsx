import { SharedEventName } from '@uniswap/analytics-events'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { CreateNewTokenForm } from '~/pages/Liquidity/CreateAuction/components/CreateNewTokenForm'
import { ExistingTokenForm } from '~/pages/Liquidity/CreateAuction/components/ExistingTokenForm'
import { HookTile } from '~/pages/Liquidity/CreateAuction/components/HookTile'
import { QuickLaunchToggleCard } from '~/pages/Liquidity/CreateAuction/components/QuickLaunchSection'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'

export function AddTokenInfoStep() {
  const { t } = useTranslation()
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)
  const { setTokenMode } = useCreateAuctionStoreActions()
  const trace = useTrace()

  // HookTile is a custom component that doesn't forward an injected onPress, so the source-toggle
  // ELEMENT_CLICKED is fired here rather than via a <Trace logPress> wrapper.
  const switchToCreateNew = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.AuctionTokenSourceToggle,
      token_source: 'new',
    })
    setTokenMode(TokenMode.CREATE_NEW)
  })
  const switchToExisting = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.AuctionTokenSourceToggle,
      token_source: 'existing',
    })
    setTokenMode(TokenMode.EXISTING)
  })

  return (
    <Flex gap="$spacing16">
      <Flex row gap="$spacing12">
        <HookTile
          selected={tokenForm.mode === TokenMode.CREATE_NEW}
          title={t('toucan.createAuction.step.tokenInfo.createNew')}
          description={t('toucan.createAuction.step.tokenInfo.createNew.description')}
          onPress={switchToCreateNew}
        />
        <HookTile
          selected={tokenForm.mode === TokenMode.EXISTING}
          title={t('toucan.createAuction.step.tokenInfo.existing')}
          description={t('toucan.createAuction.step.tokenInfo.existing.description')}
          onPress={switchToExisting}
        />
      </Flex>
      <QuickLaunchToggleCard />
      <Flex
        backgroundColor="$surface1"
        borderWidth="$spacing1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        p="$spacing24"
        gap="$spacing24"
        $md={{ borderWidth: 0, borderRadius: '$none', p: '$none' }}
      >
        {tokenForm.mode === TokenMode.CREATE_NEW ? (
          <CreateNewTokenForm createNew={tokenForm} />
        ) : (
          <ExistingTokenForm existing={tokenForm} />
        )}
      </Flex>
    </Flex>
  )
}
