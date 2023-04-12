import styled from 'styled-components'

const TabItem = styled.div<{ isActive?: boolean }>`
  text-align: center;
  height: fit-content;
  padding: 4px 12px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
  user-select: none;
  border-radius: 20px;
  transition: all 150ms;
`

type Props = {
  className?: string
}

const TabSelector: React.FC<Props> = ({ className }) => {
  return (
    <div className={className}>
      <TabItem isActive={true}>Transfer History</TabItem>
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
