import { CSSProperties } from 'react'
import Skeleton from 'react-loading-skeleton'

import useTheme from 'hooks/useTheme'

type Props = {
  content: React.ReactNode
  isShowingSkeleton: boolean
  skeletonStyle?: CSSProperties
}

const ValueWithLoadingSkeleton: React.FC<Props> = ({ content, isShowingSkeleton, skeletonStyle }) => {
  const theme = useTheme()
  if (isShowingSkeleton) {
    return (
      <Skeleton
        style={skeletonStyle}
        height="16px"
        baseColor={theme.border}
        highlightColor={theme.buttonGray}
        borderRadius="5rem"
      />
    )
  }

  return <>{content}</>
}

export default ValueWithLoadingSkeleton
