import {
  borderRadii,
  Flex,
  iconSizes,
  Separator,
  Text,
  TouchableArea,
  UniversalImage,
  useIsDarkMode,
} from '@universe/mycelium'
import { CreditCard } from '@universe/mycelium/icons/CreditCard'
import { QrCode } from '@universe/mycelium/icons/QrCode'
import { useShadowPropsShort } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import type { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import type { AddFundsPressParams } from 'uniswap/src/features/providers/webForNudgeTypes'
import type { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { useAddFundsActions } from '~/components/emptyWallet/AddFundsOptions'
import { useCexTransferProviderPress } from '~/components/ReceiveCryptoModal/useCexTransferProviderPress'

const PROVIDER_CARD_MIN_WIDTH = 160

type AddFundsOptionElementNames = {
  buy: ElementName
  receive: ElementName
  cexTransfer: ElementName
}

function AddFundsCard({
  icon,
  title,
  elementName,
  testID,
  disabled,
  onPress,
}: {
  icon: JSX.Element
  title: string
  elementName: ElementName
  testID?: string
  disabled?: boolean
  onPress: () => void
}): JSX.Element {
  const shadowProps = useShadowPropsShort()

  return (
    <Trace logPress element={elementName}>
      <TouchableArea
        width="100%"
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        p="$spacing16"
        disabled={disabled}
        hoverStyle={{ backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' }}
        testID={testID}
        onPress={onPress}
        {...shadowProps}
      >
        <Flex row alignItems="center" gap="$spacing12">
          {icon}
          <Text variant="body1" color="$neutral1">
            {title}
          </Text>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}

function ProviderCard({
  provider,
  elementName,
  onWidgetOpened,
  onWidgetError,
}: {
  provider: FORServiceProvider
  elementName: ElementName
  onWidgetOpened?: () => void
  onWidgetError: () => void
}): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const logoUrl = getOptionalServiceProviderLogo(provider.logos, isDarkMode)
  const { onPress, isLoading } = useCexTransferProviderPress(provider, { onWidgetOpened, onWidgetError })
  return (
    <AddFundsCard
      icon={
        <UniversalImage
          fallback={
            <Flex
              width={iconSizes.icon32}
              height={iconSizes.icon32}
              borderRadius="$rounded8"
              backgroundColor="$surface3"
            />
          }
          size={{ height: iconSizes.icon32, width: iconSizes.icon32 }}
          style={{ image: { borderRadius: borderRadii.rounded8 } }}
          uri={logoUrl}
        />
      }
      title={provider.name}
      elementName={elementName}
      disabled={isLoading}
      onPress={onPress}
    />
  )
}

export function AddFundsOptionCards({
  elementNames,
  buyParams,
  onLeave,
}: {
  elementNames: AddFundsOptionElementNames
  buyParams?: AddFundsPressParams
  /** Not called for Receive or the provider list, which open their own modal. */
  onLeave?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { providers, onBuy, onReceive, openCexTransferProviderList } = useAddFundsActions(buyParams)

  const handleBuy = useEvent(() => {
    onLeave?.()
    onBuy()
  })

  return (
    <Flex gap="$spacing8">
      <AddFundsCard
        icon={<CreditCard color="$accent1" size="$icon.32" />}
        title={t('addFunds.option.buy')}
        elementName={elementNames.buy}
        testID={TestID.AddFundsBuy}
        onPress={handleBuy}
      />
      <AddFundsCard
        icon={<QrCode color="$accent1" size="$icon.32" />}
        title={t('addFunds.option.transferWallet')}
        elementName={elementNames.receive}
        testID={TestID.AddFundsReceive}
        onPress={onReceive}
      />
      {providers.length > 0 && (
        <Flex gap="$spacing8">
          <Flex row alignItems="center" gap="$spacing16" py="$spacing4">
            <Separator />
            <Text variant="body3" color="$neutral2">
              {t('addFunds.option.transferAccount')}
            </Text>
            <Separator />
          </Flex>
          <Flex
            gap="$spacing8"
            $platform-web={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(${PROVIDER_CARD_MIN_WIDTH}px, 1fr))`,
            }}
          >
            {providers.map((provider) => (
              <ProviderCard
                key={provider.serviceProvider}
                provider={provider}
                elementName={elementNames.cexTransfer}
                onWidgetOpened={onLeave}
                onWidgetError={openCexTransferProviderList}
              />
            ))}
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
