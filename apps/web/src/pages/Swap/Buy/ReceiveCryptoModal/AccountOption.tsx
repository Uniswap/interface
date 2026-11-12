import { Platform } from '@universe/chains'
import { Text } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { shortenAddress } from 'utilities/src/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { AddressDisplay } from '~/features/wallet/components/AccountDetails/AddressDisplay'
import { StatusIcon } from '~/features/wallet/components/StatusIcon'

const Container = styled('div', {
  platform: 'web',
  base: 'flex pr-[8px]',
})
const Identifiers = styled('div', {
  platform: 'web',
  base: 'whitespace-nowrap flex flex-col justify-center ml-[8px] select-none overflow-hidden flex-[1_1_auto]',
})

export function AccountOption({
  account,
  ensUsername,
  uniswapUsername,
}: {
  account: string
  ensUsername?: string | null
  uniswapUsername?: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  const { t } = useTranslation()

  const { chains } = useEnabledChains({ platform: isEVMAddress(account) ? Platform.EVM : Platform.SVM })
  const platformAddressDisplay = isEVMAddress(account)
    ? `${MAINNET_CHAIN_INFO.name} +${chains.length - 1} ${t('extension.connection.networks').toLowerCase()}`
    : SOLANA_CHAIN_INFO.name

  return (
    <Container onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <StatusIcon address={account} size={40} />
      <Identifiers>
        <Text variant="body2">
          <AddressDisplay address={account} />
        </Text>
        {uniswapUsername || ensUsername ? (
          <Text variant="body4" color="$neutral2">
            {isHovered ? platformAddressDisplay : shortenAddress({ address: account })}
          </Text>
        ) : (
          <Text variant="body4" color="$neutral2">
            {platformAddressDisplay}
          </Text>
        )}
      </Identifiers>
    </Container>
  )
}
