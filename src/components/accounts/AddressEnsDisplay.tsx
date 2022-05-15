import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import CopyIcon from 'src/assets/icons/copy-sheets.svg'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { ElementName } from 'src/features/telemetry/constants'
import { Theme } from 'src/styles/theme'
import { shortenAddress } from 'src/utils/addresses'
import { setClipboard } from 'src/utils/clipboard'

interface Props {
  address: Address | undefined
  mainSize?: number
  secondarySize?: number
  mainColor?: keyof Theme['colors']
  secondaryColor?: keyof Theme['colors']
  gap?: keyof Theme['spacing']
  showCopy?: boolean
  align?: 'center' | 'flex-start' | 'flex-end'
}

/**
 * Display dynamic stack of ENS and address, or only address if no ens
 */
export default function AddressEnsDisplay({
  address,
  mainSize = 16,
  secondarySize = 12,
  mainColor = 'deprecated_textColor',
  secondaryColor = 'deprecated_gray400',
  showCopy = true,
  gap = 'sm',
  align = 'flex-start',
}: Props) {
  const theme = useAppTheme()
  const ens = useENS(ChainId.Mainnet, address)

  const onPressCopyAddress = () => {
    if (!address) return
    setClipboard(address)
  }

  if (!address) {
    return null
  }

  return (
    <Flex alignItems={align} gap={gap}>
      {/* top line */}
      <Flex centered row gap="sm">
        <Text color={mainColor} fontSize={mainSize} fontWeight={'500'}>
          {ens.name ?? shortenAddress(address)}
        </Text>
        {showCopy && !ens.name && (
          <Button name={ElementName.Copy} onPress={onPressCopyAddress}>
            <CopyIcon color={theme.colors[mainColor]} height={mainSize} width={mainSize} />
          </Button>
        )}
      </Flex>
      {/* bottom line , only show if valid ens */}
      {ens.name && (
        <Flex centered row gap="sm">
          <Text color={secondaryColor} fontSize={secondarySize} fontWeight={'500'}>
            {shortenAddress(address)}
          </Text>
          {showCopy && (
            <Button name={ElementName.Copy} onPress={onPressCopyAddress}>
              <CopyIcon
                color={theme.colors[secondaryColor]}
                height={secondarySize}
                width={secondarySize}
              />
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  )
}
