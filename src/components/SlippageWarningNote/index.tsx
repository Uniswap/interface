import { Trans } from '@lingui/macro'
import { FC } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import WarningNote from 'components/WarningNote'
import { SLIPPAGE_STATUS, checkRangeSlippage } from 'utils/slippage'

type Props = {
  rawSlippage: number
  isStablePairSwap: boolean
  className?: string
}

export const SLIPPAGE_EXPLANATION_URL =
  'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage'

const TextUnderlineColor = styled(Text)`
  border-bottom: 1px solid ${({ theme }) => theme.text};
  width: fit-content;
  display: inline;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

const TextUnderlineTransparent = styled(Text)`
  border-bottom: 1px solid transparent;
  width: fit-content;
  display: inline;
`

const SlippageWarningNote: FC<Props> = ({ className, rawSlippage, isStablePairSwap }) => {
  const slippageStatus = checkRangeSlippage(rawSlippage, isStablePairSwap)

  if (slippageStatus === SLIPPAGE_STATUS.NORMAL) {
    return null
  }

  let msg = 'is high. Your transaction may be front-run'
  if (slippageStatus === SLIPPAGE_STATUS.LOW) {
    msg = 'is low. Your transaction may fail'
  }
  const shortText = (
    <div>
      <Trans>
        <TextUnderlineColor
          style={{ minWidth: 'max-content' }}
          as="a"
          href={SLIPPAGE_EXPLANATION_URL}
          target="_blank"
          rel="noreferrer"
        >
          Slippage
        </TextUnderlineColor>
        <TextUnderlineTransparent> {msg}</TextUnderlineTransparent>
      </Trans>
    </div>
  )

  return <WarningNote className={className} shortText={shortText} />
}

export default SlippageWarningNote
