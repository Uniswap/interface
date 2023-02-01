import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DollarIcon } from 'assets/svg/dollar.svg'
import { ButtonLight } from 'components/Button'
import SendIcon from 'components/Icons/SendIcon'
import { ClickHandlerProps } from 'components/WalletPopup/AccountInfo'

const MinimalActionButton = styled(ButtonLight)`
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  padding: 0;
`

type Props = {
  className?: string
} & ClickHandlerProps
const MinimalActionButtonGroup: React.FC<Props> = ({
  onClickBuy,
  onClickReceive,
  onClickSend,
  className,
  disabledSend,
}) => {
  return (
    <Flex
      className={className}
      sx={{
        gap: '4px',
        height: '100%',
        alignItems: 'center',
      }}
    >
      <MinimalActionButton onClick={onClickBuy}>
        <DollarIcon width={'24px'} height={'24px'} />
      </MinimalActionButton>
      <MinimalActionButton onClick={onClickReceive}>
        <SendIcon size={14} style={{ transform: 'rotate(180deg)' }} />
      </MinimalActionButton>
      <MinimalActionButton onClick={onClickSend} disabled={disabledSend}>
        <SendIcon size={14} />
      </MinimalActionButton>
    </Flex>
  )
}

export default styled(MinimalActionButtonGroup)``
