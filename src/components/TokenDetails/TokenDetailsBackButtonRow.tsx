import { Currency } from '@uniswap/sdk-core'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModal, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { Text } from 'src/components/Text'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { CHAIN_INFO } from 'src/constants/chains'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { ElementName, ModalName } from 'src/features/telemetry/constants'

interface TokenDetailsHeaderProps {
  currency: Currency
  otherChainBalances: PortfolioBalance[] | null
}

export function TokenDetailsBackButtonRow({
  currency,
  otherChainBalances,
}: TokenDetailsHeaderProps) {
  const theme = useAppTheme()
  const currentChainId = currency.chainId

  const hasOtherBalances = Boolean(otherChainBalances?.length)

  const { t } = useTranslation()
  const [showActionModal, setShowActionModal] = useState(false)

  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const options = useMemo(
    (): MenuItemProp[] | null => [
      {
        // add current network with checkmark at the top of options
        key: `${ElementName.NetworkButton}-${String(currentChainId)}`,
        onPress: () => setShowActionModal(false),
        render: () => (
          <>
            <Separator />
            <Flex row alignItems="center" justifyContent="space-between" px="lg" py="md">
              <NetworkLogo chainId={currentChainId} size={24} />
              <Text color="textPrimary" variant="body">
                {CHAIN_INFO[currentChainId].label}
              </Text>
              <Box height={24} width={24}>
                <Check color={theme.colors.accentActive} height={24} width={24} />
              </Box>
            </Flex>
          </>
        ),
      },
      ...(otherChainBalances?.map((balance) => {
        const chainId = balance.currencyInfo.currency.chainId
        const info = CHAIN_INFO[chainId]

        return {
          key: `${ElementName.NetworkButton}-${String(chainId)}`,
          onPress: () => {
            tokenDetailsNavigation.preload(balance.currencyInfo.currencyId)
            tokenDetailsNavigation.navigate(balance.currencyInfo.currencyId)
            setShowActionModal(false)
          },
          render: () => (
            <>
              <Separator />
              <Flex row alignItems="center" justifyContent="space-between" px="lg" py="md">
                <NetworkLogo chainId={chainId} size={24} />
                <Text color="textPrimary" variant="body">
                  {info.label}
                </Text>
                <Box height={24} width={24} />
              </Flex>
            </>
          ),
        }
      }) ?? []),
    ],
    [currentChainId, otherChainBalances, theme.colors.accentActive, tokenDetailsNavigation]
  )

  return (
    <>
      {options && (
        <ActionSheetModal
          header={
            <Flex centered gap="xxs" py="md">
              <Text variant="mediumLabel">{t('Switch Network')}</Text>
            </Flex>
          }
          isVisible={showActionModal}
          name={ModalName.NetworkSelector}
          options={options}
          onClose={() => setShowActionModal(false)}
        />
      )}
      <Flex row alignItems="center" justifyContent="space-between" pt="sm" px="sm">
        <BackButton />
        <Button disabled={!hasOtherBalances} onPress={() => setShowActionModal(true)}>
          <Flex centered row bg="backgroundContainer" borderRadius="sm" gap="xxs" p="xs">
            <NetworkLogo chainId={currency.chainId} size={16} />
            <Text color="textSecondary" pl="xxxs" textAlign="center" variant="smallLabel">
              {CHAIN_INFO[currency.chainId].label}
            </Text>
            {hasOtherBalances && (
              <Chevron color={theme.colors.textSecondary} direction="s" height={16} width={16} />
            )}
          </Flex>
        </Button>
      </Flex>
    </>
  )
}
