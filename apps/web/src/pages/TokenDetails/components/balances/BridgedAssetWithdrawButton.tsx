import { useAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { WormholeModalAtom } from 'uniswap/src/components/BridgedAsset/WormholeModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { useModalState } from '~/hooks/useModalState'
import { useTDPContext } from '~/pages/TokenDetails/context/TDPContext'

export function BridgedAssetWithdrawButton(): JSX.Element | null {
  const { t } = useTranslation()
  const { currencyChainId, address } = useTDPContext()
  const currencyInfo = useCurrencyInfo(buildCurrencyId(currencyChainId, address))
  const { openModal } = useModalState(ModalName.Wormhole)
  const [, setWormholeModalCurrencyInfo] = useAtom(WormholeModalAtom)
  const handlePress = useEvent(() => {
    if (currencyInfo) {
      setWormholeModalCurrencyInfo({ currencyInfo })
      openModal()
    }
  })

  const bridgedWithdrawalInfo = currencyInfo?.bridgedWithdrawalInfo
  if (!bridgedWithdrawalInfo) {
    return null
  }
  return (
    <TouchableArea onPress={handlePress} hoverStyle={{ opacity: 0.8 }}>
      <Flex row gap="$spacing8">
        <Text variant="buttonLabel3" color="$neutral2">
          {t('bridgedAsset.wormhole.withdrawToNativeChain', { nativeChainName: bridgedWithdrawalInfo.chain })}
        </Text>
        <ExternalLink color="$neutral3" size="$icon.16" />
      </Flex>
    </TouchableArea>
  )
}
