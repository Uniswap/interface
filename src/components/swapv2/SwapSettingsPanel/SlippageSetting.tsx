import { Trans, t } from '@lingui/macro'
import React from 'react'
import { useDispatch } from 'react-redux'
import { Flex } from 'rebass'
import styled from 'styled-components'

import QuestionHelper from 'components/QuestionHelper'
import SlippageControl from 'components/SlippageControl'
import PinButton from 'components/swapv2/SwapSettingsPanel/PinButton'
import SettingLabel from 'components/swapv2/SwapSettingsPanel/SettingLabel'
import { DEFAULT_SLIPPAGE, DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP } from 'constants/index'
import { useAppSelector } from 'state/hooks'
import { useCheckStablePairSwap } from 'state/swap/hooks'
import { pinSlippageControl } from 'state/user/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { checkRangeSlippage } from 'utils/slippage'

const Message = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;

  &[data-warning='true'] {
    color: ${({ theme }) => theme.warning};
  }

  &[data-error='true'] {
    color: ${({ theme }) => theme.red1};
  }
`

type Props = {
  shouldShowPinButton?: boolean
}

const SlippageSetting: React.FC<Props> = ({ shouldShowPinButton = true }) => {
  const dispatch = useDispatch()
  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()
  const isStablePairSwap = useCheckStablePairSwap()
  const { isValid, message } = checkRangeSlippage(rawSlippage, isStablePairSwap)
  const isWarning = isValid && !!message
  const isError = !isValid

  const isSlippageControlPinned = useAppSelector(state => state.user.isSlippageControlPinned)

  const handleClickPinSlippageControl = () => {
    dispatch(pinSlippageControl(!isSlippageControlPinned))
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        rowGap: '8px',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
        }}
      >
        <SettingLabel>
          <Trans>Max Slippage</Trans>
        </SettingLabel>
        <QuestionHelper
          placement="top"
          text={t`Transaction will revert if there is an adverse rate change that is higher than this %. This control will appear in Swap form if pinned.`}
        />

        {shouldShowPinButton && (
          <PinButton isActive={isSlippageControlPinned} onClick={handleClickPinSlippageControl} />
        )}
      </Flex>

      <SlippageControl
        rawSlippage={rawSlippage}
        setRawSlippage={setRawSlippage}
        isWarning={isWarning}
        defaultRawSlippage={isStablePairSwap ? DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP : DEFAULT_SLIPPAGE}
      />

      {!!message && (
        <Message data-warning={isWarning} data-error={isError}>
          {message}
        </Message>
      )}
    </Flex>
  )
}

export default SlippageSetting
