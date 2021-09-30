import React from 'react'
import { Button, ButtonProps } from 'src/components/buttons/Button'

export function SubmitButton(props: ButtonProps) {
  return <Button px="md" py="sm" backgroundColor="green" color="white" {...props} />
}
