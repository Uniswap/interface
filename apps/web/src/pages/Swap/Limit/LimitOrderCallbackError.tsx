import { ReactNode } from 'react'
import { Flex, styled, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'

const LimitOrderCallbackErrorInner = styled(Flex, {
  flexDirection: 'row',
  backgroundColor: '$statusCritical2',
  borderRadius: '$rounded12',
  alignItems: 'center',
  mt: -32,
  width: '100%',
  zIndex: -1,
  pt: 48,
  pr: 20,
  pb: 16,
  pl: 16,
})

const LimitOrderCallbackErrorInnerAlertTriangle = styled(Flex, {
  backgroundColor: '$statusCritical2',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
  borderRadius: '$rounded12',
  minWidth: 48,
  height: 48,
})

export function LimitOrderCallbackError({ error }: { error: ReactNode }) {
  return (
    <LimitOrderCallbackErrorInner>
      <LimitOrderCallbackErrorInnerAlertTriangle>
        <AlertTriangleFilled size={24} color="$statusCritical" />
      </LimitOrderCallbackErrorInnerAlertTriangle>
      <Text variant="body4" color="$statusCritical" $platform-web={{ wordBreak: 'break-word' }}>
        {error}
      </Text>
    </LimitOrderCallbackErrorInner>
  )
}
