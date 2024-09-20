import { AutoColumn } from 'components/deprecated/Column'
import ClaimPopup from 'components/Popups/ClaimPopup'
import PopupItem from 'components/Popups/PopupItem'
import styled from 'lib/styled-components'
import { useActivePopups } from 'state/application/hooks'
import { Z_INDEX } from 'theme/zIndex'
import { AnimatePresence, Flex } from 'ui/src'

const FixedPopupColumn = styled(AutoColumn)`
  position: fixed;
  max-width: 348px;
  width: 100%;
  z-index: ${Z_INDEX.fixed};
  transition: ${({ theme }) => `top ${theme.transition.timing.inOut} ${theme.transition.duration.slow}`};
`

export default function Popups() {
  // get all popups
  const activePopups = useActivePopups()

  return (
    <Flex
      position="absolute"
      top="$spacing12"
      width="100vw"
      alignItems="flex-end"
      pr="$spacing12"
      $sm={{
        alignItems: 'center',
        pr: '$none',
      }}
    >
      <FixedPopupColumn gap="20px" data-testid="popups">
        <ClaimPopup />
        <AnimatePresence>
          {activePopups.map((item, i) => (
            <PopupItem key={i} content={item.content} popKey={item.key} removeAfterMs={item.removeAfterMs} />
          ))}
        </AnimatePresence>
      </FixedPopupColumn>
    </Flex>
  )
}
