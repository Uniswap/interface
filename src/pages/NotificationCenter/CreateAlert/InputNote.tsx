import { t } from '@lingui/macro'
import { FormEvent } from 'react'

import { StyledInput } from 'pages/NotificationCenter/CreateAlert/styleds'

export default function InputNote({ onChangeInput, value }: { onChangeInput: (v: string) => void; value: string }) {
  function autoGrow(e: FormEvent<HTMLTextAreaElement>) {
    const element = e.currentTarget
    element.style.height = Math.max(36, element.scrollHeight < 48 ? 36 : element.scrollHeight) + 'px'
  }
  const maxLength = 32
  return (
    <StyledInput
      placeholder={t`Add a note`}
      maxLength={maxLength}
      onInput={autoGrow}
      value={value}
      onChange={e => {
        const value = e.target.value
        if (value.length > maxLength) return
        onChangeInput(value)
      }}
      onKeyDown={e => (e.key === 'Enter' ? e.preventDefault() : undefined)}
    />
  )
}
