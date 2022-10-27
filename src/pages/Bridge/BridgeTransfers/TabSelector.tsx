import styled, { css } from 'styled-components'

import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

const TabItem = styled.div<{ isActive?: boolean }>`
  text-align: center;
  height: fit-content;
  padding: 4px 12px;
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  user-select: none;

  border-radius: 20px;

  transition: all 150ms;

  ${({ isActive, theme }) =>
    isActive &&
    css`
      font-weight: 500;
      text-align: center;
      color: ${theme.text};
      background: ${theme.buttonGray};
    `}
`

type Props = {
  className?: string
}

const TabSelector: React.FC<Props> = ({ className }) => {
  const { mixpanelHandler } = useMixpanel()
  return (
    <div className={className}>
      <TabItem
        isActive={true}
        role="button"
        onClick={() => {
          mixpanelHandler(MIXPANEL_TYPE.BRIDGE_CLICK_HISTORY_TRANSFER_TAB)
        }}
      >
        Transfer History
      </TabItem>
    </div>
  )
}

export default styled(TabSelector)`
  width: 100%;
  height: 46px; // to make it align with the swap container
  display: flex;
  gap: 16px;
  align-items: center;
`
