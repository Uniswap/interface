import { TFunction } from 'i18next'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { Box, Flex } from 'src/components/layout'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { Text } from 'src/components/Text'
import { LocalTokensOrderBy, RemoteTokensOrderBy, TokensOrderBy } from 'src/features/explore/types'
import { getOrderByLabel } from 'src/features/explore/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { selectTokensOrderBy } from 'src/features/wallet/selectors'
import { setTokensOrderBy } from 'src/features/wallet/walletSlice'
import { flex } from 'src/styles/flex'

const CheckmarkSize = 18

export function useOrderByModal() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [isVisible, setIsVisible] = useState(false)

  const orderBy = useAppSelector(selectTokensOrderBy)

  const options = useMemo(
    () =>
      getOrderByModalOptions(
        orderBy,
        (newTokensOrderBy: TokensOrderBy) => {
          dispatch(setTokensOrderBy({ newTokensOrderBy }))
          setIsVisible(false)
        },
        t
      ),
    [orderBy, t, dispatch]
  )

  return {
    orderBy,
    setOrderByModalIsVisible: setIsVisible,
    orderByModal: useMemo(
      () => (
        <ActionSheetModal
          header={t('Sort by')}
          isVisible={isVisible}
          name={ModalName.Account}
          options={options}
          onClose={() => {
            setIsVisible(false)
          }}
        />
      ),
      [isVisible, options, t]
    ),
  }
}

function ModalOption({ isSelected, label }: { isSelected: boolean; label: string }) {
  const theme = useAppTheme()
  return (
    <Flex row justifyContent="space-between" p="md">
      {/* fake element to center the label  */}
      <Box height={CheckmarkSize} width={CheckmarkSize} />
      <Text style={flex.fill} textAlign="center" variant="body">
        {label}
      </Text>
      <Box height={CheckmarkSize} width={CheckmarkSize}>
        {isSelected && (
          <Check color={theme.colors.accentActive} height={CheckmarkSize} width={CheckmarkSize} />
        )}
      </Box>
    </Flex>
  )
}

const getOrderByModalOptions = (
  selected: TokensOrderBy,
  setOrderBy: (orderBy: TokensOrderBy) => void,
  t: TFunction
) => {
  return [
    {
      key: RemoteTokensOrderBy.MarketCapDesc,
      onPress: () => {
        setOrderBy(RemoteTokensOrderBy.MarketCapDesc)
      },
      render: () => (
        <ModalOption
          isSelected={selected === RemoteTokensOrderBy.MarketCapDesc}
          label={getOrderByLabel(RemoteTokensOrderBy.MarketCapDesc, t)}
        />
      ),
    },
    {
      key: RemoteTokensOrderBy.GlobalVolumeDesc,
      onPress: () => {
        setOrderBy(RemoteTokensOrderBy.GlobalVolumeDesc)
      },
      render: () => (
        <ModalOption
          isSelected={selected === RemoteTokensOrderBy.GlobalVolumeDesc}
          label={getOrderByLabel(RemoteTokensOrderBy.GlobalVolumeDesc, t)}
        />
      ),
    },
    {
      key: LocalTokensOrderBy.PriceChangePercentage24hDesc,
      onPress: () => {
        setOrderBy(LocalTokensOrderBy.PriceChangePercentage24hDesc)
      },
      render: () => (
        <ModalOption
          isSelected={selected === LocalTokensOrderBy.PriceChangePercentage24hDesc}
          label={getOrderByLabel(LocalTokensOrderBy.PriceChangePercentage24hDesc, t)}
        />
      ),
    },
    {
      key: LocalTokensOrderBy.PriceChangePercentage24hAsc,
      onPress: () => {
        setOrderBy(LocalTokensOrderBy.PriceChangePercentage24hAsc)
      },
      render: () => (
        <ModalOption
          isSelected={selected === LocalTokensOrderBy.PriceChangePercentage24hAsc}
          label={getOrderByLabel(LocalTokensOrderBy.PriceChangePercentage24hAsc, t)}
        />
      ),
    },
  ]
}
