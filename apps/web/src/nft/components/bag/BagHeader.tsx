import { BagCloseIcon } from 'nft/components/icons'
import { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { TamaguiClickableStyle } from 'theme/components'
import { Button, Flex, Text } from 'ui/src'

interface BagHeaderProps {
  numberOfAssets: number
  closeBag: () => void
  resetFlow: () => void
  isProfilePage: boolean
}

const BASE_SIZING = 17
const INCREMENTAL_SIZING = 6

const getCircleSizing = (numberOfAssets: number): string => {
  const numberOfCharacters = numberOfAssets.toString().length
  return `${BASE_SIZING + INCREMENTAL_SIZING * numberOfCharacters}px`
}

export const BagHeader = ({ numberOfAssets, closeBag, resetFlow, isProfilePage }: BagHeaderProps) => {
  const sizing = useMemo(() => getCircleSizing(numberOfAssets), [numberOfAssets])

  return (
    <Flex alignItems="center" row gap="$spacing8" justifyContent="flex-start" my="$spacing16" mx="$spacing28">
      <Text variant="subheading1" fontSize={20} lineHeight={28} textAlign="center">
        {isProfilePage ? <Trans i18nKey="common.sell.label" /> : <Trans i18nKey="nft.bag" />}
      </Text>
      {numberOfAssets > 0 && (
        <>
          <Flex
            alignItems="center"
            backgroundColor="$accent1"
            borderRadius="$roundedFull"
            justifyContent="center"
            minWidth={sizing}
            minHeight={sizing}
            py="$spacing4"
            px="$spacing6"
          >
            <Text variant="body3" fontSize={10} color="$white" lineHeight={10}>
              {numberOfAssets}
            </Text>
          </Flex>
          <Button fill={false} emphasis="text-only" onPress={resetFlow} {...TamaguiClickableStyle}>
            <Trans i18nKey="tokens.selector.button.clear" />
          </Button>
        </>
      )}
      <Button
        fill={false}
        emphasis="text-only"
        backgroundColor="transparent"
        borderRadius="$rounded8"
        ml="auto"
        p={0}
        pt={2}
        onPress={closeBag}
        {...TamaguiClickableStyle}
      >
        <BagCloseIcon color="$neutral1" data-testid="nft-bag-close-icon" />
      </Button>
    </Flex>
  )
}
