import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Button, ColorTokens, Flex } from 'ui/src'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const KEEP_OPEN_MSG_DELAY = 3 * ONE_SECOND_MS

/**
 * For swaps that take longer to confirm, this component shows an animated
 * text that prompts the user to keep their wallet open.
 */
export function DelayedSubmissionText({ color }: { color?: ColorTokens }): JSX.Element {
  const { t } = useTranslation()
  const [showKeepOpenMessage, setShowKeepOpenMessage] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setShowKeepOpenMessage(true), KEEP_OPEN_MSG_DELAY)
    return () => clearTimeout(timeout)
  }, [])

  // Use different key to re-trigger animation when message changes
  const key = showKeepOpenMessage ? 'submitting-text-msg1' : 'submitting-text-msg2'

  return (
    <AnimatePresence key={key}>
      <Flex animateEnterExit="fadeInDownOutDown" animation="quicker">
        <Button.Text color={color}>
          {showKeepOpenMessage ? t('swap.button.submitting.keep.open') : t('swap.button.submitting')}
        </Button.Text>
      </Flex>
    </AnimatePresence>
  )
}
