/* eslint-disable-next-line no-restricted-imports */
import { useCloseModal } from 'state/application/hooks'
import { useAppSelector } from 'state/hooks'
import { InterfaceState } from 'state/webReducer'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useTranslation } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'

export function AddLiquidityModal() {
  const { t } = useTranslation()

  const { initialState } = useAppSelector((state: InterfaceState) => state.application.openModal!)

  const onClose = useCloseModal(ModalName.AddLiquidity)

  if (!initialState) {
    throw new Error('AddLiquidityModal must have an initial state when opening')
  }

  const position = (initialState as any).v4Position.poolPosition

  const chainId = UniverseChainId.Mainnet

  return (
    <Modal name={ModalName.AddLiquidity} onClose={onClose} isDismissible>
      <Flex row>
        <TouchableArea onPress={onClose}>
          <X color="$neutral1" size="$icon.24" />
        </TouchableArea>
        <Flex grow>
          <Text textAlign="center" variant="subheading1" color="$neutral1">
            {t('common.addLiquidity')}
          </Text>
        </Flex>
      </Flex>
      <Flex row>
        <SplitLogo inputCurrencyInfo={null} outputCurrencyInfo={null} size={44} chainId={chainId} />
        <Flex>
          <Flex row>
            <Text variant="heading3">
              {position?.token0?.symbol} / {position?.token1?.symbol}
            </Text>
            {/* tags */}
          </Flex>
          {/* in range */}
        </Flex>
      </Flex>
      {/* input currency panel */}
      {/* output currency panel */}
      {/* new position */}
      {/* new position */}
      {/* network cost */}
      <Button onPress={() => undefined}>{t('common.add.label')}</Button>
    </Modal>
  )
}
