import { TFunction } from 'i18next'
import React, { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { Box, Flex } from 'src/components/layout'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { Text } from 'src/components/Text'
import { ClientSideOrderBy, CoingeckoOrderBy } from 'src/features/dataApi/coingecko/types'
import { ModalName } from 'src/features/telemetry/constants'
import { flex } from 'src/styles/flex'

const CheckmarkSize = 18

export function useOrderByModal() {
  const { t } = useTranslation()
  const [isVisible, toggleModalVisible] = useReducer((visible) => !visible, false)
  const [orderBy, setOrderBy] = useState<CoingeckoOrderBy | ClientSideOrderBy>(
    CoingeckoOrderBy.MarketCapDesc
  )

  const options = useMemo(
    () =>
      getOrderByModalOptions(
        orderBy,
        (newOrderBy: CoingeckoOrderBy | ClientSideOrderBy) => {
          setOrderBy(newOrderBy)
          toggleModalVisible()
        },
        t
      ),
    [orderBy, t]
  )

  return {
    orderBy,
    toggleModalVisible,
    orderByModal: useMemo(
      () => (
        <ActionSheetModal
          header={t('Sort tokens by')}
          isVisible={isVisible}
          name={ModalName.Account}
          options={options}
          onClose={() => toggleModalVisible()}
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
      <Text style={flex.fill} textAlign="center" variant="body1">
        {label}
      </Text>
      <Box height={CheckmarkSize} width={CheckmarkSize}>
        {isSelected && (
          <Check
            color={theme.colors.neutralTextSecondary}
            height={CheckmarkSize}
            width={CheckmarkSize}
          />
        )}
      </Box>
    </Flex>
  )
}

const getOrderByModalOptions = (
  selected: CoingeckoOrderBy | ClientSideOrderBy,
  setOrderBy: (orderBy: CoingeckoOrderBy | ClientSideOrderBy) => void,
  t: TFunction
) => {
  return [
    {
      key: CoingeckoOrderBy.MarketCapDesc,
      onPress: () => {
        setOrderBy(CoingeckoOrderBy.MarketCapDesc)
      },
      render: () => (
        <ModalOption
          isSelected={selected === CoingeckoOrderBy.MarketCapDesc}
          label={t('Market Cap')}
        />
      ),
    },
    {
      key: CoingeckoOrderBy.VolumeDesc,
      onPress: () => {
        setOrderBy(CoingeckoOrderBy.VolumeDesc)
      },
      render: () => (
        <ModalOption isSelected={selected === CoingeckoOrderBy.VolumeDesc} label={t('Volume')} />
      ),
    },
    {
      key: ClientSideOrderBy.PriceChangePercentage24hDesc,
      onPress: () => {
        setOrderBy(ClientSideOrderBy.PriceChangePercentage24hDesc)
      },
      render: () => (
        <ModalOption
          isSelected={selected === ClientSideOrderBy.PriceChangePercentage24hDesc}
          label={t('Percent change')}
        />
      ),
    },
  ]
}
