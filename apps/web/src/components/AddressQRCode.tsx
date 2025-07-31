import { AddressDisplay } from 'components/AccountDetails/AddressDisplay'
import Identicon from 'components/Identicon'
import { Trans } from 'react-i18next'
import { CopyHelper } from 'theme/components/CopyHelper'
import { Flex, QRCodeDisplay, Text, useSporeColors } from 'ui/src'
import { NetworkLogos } from 'uniswap/src/components/network/NetworkLogos'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useAddressColorProps } from 'uniswap/src/features/address/color'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useENSName } from 'uniswap/src/features/ens/api'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { shortenAddress } from 'utilities/src/addresses'

const UNICON_SIZE = 50
const QR_CODE_SIZE = 230

export function AddressQRCode({ accountAddress }: { accountAddress: Address }) {
  const colors = useSporeColors()
  const { data: ENSName } = useENSName(accountAddress)
  const { data: unitag } = useUnitagsAddressQuery({
    params: accountAddress ? { address: accountAddress } : undefined,
  })
  const hasSecondaryIdentifier = ENSName || unitag?.username
  const addressColor = useAddressColorProps(accountAddress)
  const { chains: enabledChainIds } = useEnabledChains({ platform: Platform.EVM })

  return (
    <Flex pt="$spacing12" gap="$spacing16">
      <Flex gap="$spacing12" mt="$spacing24">
        <Flex alignItems="center">
          <Text variant="heading3">
            <AddressDisplay enableCopyAddress={!hasSecondaryIdentifier} address={accountAddress} />
          </Text>
          {hasSecondaryIdentifier && (
            <CopyHelper color="$neutral2" iconSize={14} iconPosition="right" toCopy={accountAddress}>
              <Text variant="body3" color="neutral2">
                {shortenAddress(accountAddress)}
              </Text>
            </CopyHelper>
          )}
        </Flex>
        <QRCodeDisplay
          ecl="M"
          color={addressColor}
          containerBackgroundColor={colors.surface1.val}
          size={QR_CODE_SIZE}
          encodedValue={accountAddress!}
        >
          <Flex
            justifyContent="center"
            alignItems="center"
            p="$spacing4"
            backgroundColor="$surface1"
            borderRadius="$roundedFull"
          >
            <Identicon size={UNICON_SIZE} account={accountAddress} />
          </Flex>
        </QRCodeDisplay>
        <Text color="$neutral2" textAlign="center" variant="body4" maxWidth={QR_CODE_SIZE} alignSelf="center">
          <Trans i18nKey="qrScanner.wallet.title" values={{ numOfNetworks: Object.keys(enabledChainIds).length }} />
        </Text>
        <NetworkLogos chains={enabledChainIds} />
      </Flex>
    </Flex>
  )
}
