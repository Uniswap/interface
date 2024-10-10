/* eslint-disable-next-line no-restricted-imports */
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { PositionInfo } from 'components/Liquidity/types'
import { getProtocolItems } from 'components/Liquidity/utils'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { ZERO_ADDRESS } from 'constants/misc'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useMemo } from 'react'
import { Button, Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useClaimLpFeesCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useClaimLpFeesCalldataQuery'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useTranslation } from 'uniswap/src/i18n'
import { NumberType } from 'utilities/src/format/types'

type ClaimFeeModalProps = {
  positionInfo: PositionInfo
  isOpen: boolean
  onClose: () => void
  token0Fees?: CurrencyAmount<Currency>
  token1Fees?: CurrencyAmount<Currency>
  token0FeesUsd?: CurrencyAmount<Currency>
  token1FeesUsd?: CurrencyAmount<Currency>
}

export function ClaimFeeModal({
  positionInfo,
  onClose,
  isOpen,
  token0Fees,
  token1Fees,
  token0FeesUsd,
  token1FeesUsd,
}: ClaimFeeModalProps) {
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()
  const currencyInfo0 = useCurrencyInfo(token0Fees?.currency)
  const currencyInfo1 = useCurrencyInfo(token1Fees?.currency)
  const account = useAccount()

  const claimLpFeesParams = useMemo(() => {
    return {
      params: {
        protocol: getProtocolItems(positionInfo.version),
        tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
        walletAddress: account.address,
        chainId: positionInfo.currency0Amount.currency.chainId,
        position: {
          pool: {
            token0: positionInfo.currency0Amount.currency.isNative
              ? ZERO_ADDRESS
              : positionInfo.currency0Amount.currency.address,
            token1: positionInfo.currency1Amount.currency.isNative
              ? ZERO_ADDRESS
              : positionInfo.currency1Amount.currency.address,
            fee: positionInfo.feeTier ? Number(positionInfo.feeTier) : undefined,
            tickSpacing: positionInfo?.tickSpacing ? Number(positionInfo?.tickSpacing) : undefined,
            hooks: positionInfo.v4hook,
          },
          tickLower: positionInfo.tickLower ? Number(positionInfo.tickLower) : undefined,
          tickUpper: positionInfo.tickUpper ? Number(positionInfo.tickUpper) : undefined,
        },
        expectedTokenOwed0RawAmount: token0Fees?.quotient.toString(),
        expectedTokenOwed1RawAmount: token1Fees?.quotient.toString(),
      },
    }
  }, [account.address, positionInfo, token0Fees, token1Fees])

  const { data } = useClaimLpFeesCalldataQuery(claimLpFeesParams)

  const signer = useEthersSigner()

  return (
    <Modal name={ModalName.FeeClaim} onClose={onClose} isDismissible isModalOpen={isOpen}>
      <Flex gap="$gap16">
        <GetHelpHeader
          link={uniswapUrls.helpArticleUrls.lpCollectFees}
          title={t('pool.claimFees')}
          closeModal={onClose}
          closeDataTestId="ClaimFeeModal-close-icon"
        />
        {token0Fees && token1Fees && (
          <Flex backgroundColor="$surface3" borderRadius="$rounded12" p="$padding16" gap="$gap12">
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row gap="$gap8" alignItems="center">
                <CurrencyLogo currencyInfo={currencyInfo0} size={iconSizes.icon24} />
                <Text variant="body1" color="neutral1">
                  {token0Fees.currency.symbol}
                </Text>
              </Flex>
              <Flex row gap="$gap8" alignItems="center">
                <Text variant="body1" color="$neutral1">
                  {formatCurrencyAmount({ value: token0Fees })}
                </Text>
                {token0FeesUsd && (
                  <Text variant="body1" color="$neutral2">
                    ({formatCurrencyAmount({ value: token0FeesUsd, type: NumberType.FiatTokenPrice })})
                  </Text>
                )}
              </Flex>
            </Flex>
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row gap="$gap8" alignItems="center">
                <CurrencyLogo currencyInfo={currencyInfo1} size={iconSizes.icon24} />
                <Text variant="body1" color="neutral1">
                  {token1Fees.currency.symbol}
                </Text>
              </Flex>
              <Flex row gap="$gap8" alignItems="center">
                <Text variant="body1" color="$neutral1">
                  {formatCurrencyAmount({ value: token1Fees })}
                </Text>
                {token1FeesUsd && (
                  <Text variant="body1" color="$neutral2">
                    ({formatCurrencyAmount({ value: token1FeesUsd, type: NumberType.FiatTokenPrice })})
                  </Text>
                )}
              </Flex>
            </Flex>
          </Flex>
        )}
        <Button
          onPress={() => {
            if (signer && data?.claim) {
              signer.sendTransaction(data?.claim)
            }
          }}
        >
          <Text variant="buttonLabel2">{t('pool.claimFees.button.label')}</Text>
        </Button>
      </Flex>
    </Modal>
  )
}
