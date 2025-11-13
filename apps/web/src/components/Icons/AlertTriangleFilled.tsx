import { StyledSVG } from 'components/Icons/shared'
import { useSporeColors } from 'ui/src'

export default function AlertTriangleFilled({ size = '16px', ...rest }: { size?: string; [k: string]: any }) {
  const colors = useSporeColors()
  return (
    <StyledSVG fill={colors.neutral2.val} viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" size={size} {...rest}>
      <path
        d="m25.2086 20.0103-7.7081-14.41555c-1.4933-2.793-5.5055-2.793-7 0l-7.70806 14.41555c-1.36966 2.562.49005 5.6559 3.40088 5.6559h15.61438c2.9097 0 4.7706-3.095 3.4009-5.6559zm-12.0831-8.3441c0-.483.392-.875.875-.875s.875.392.875.875v4.6667c0 .483-.392.875-.875.875s-.875-.392-.875-.875zm.8984 9.3333c-.644 0-1.1727-.5226-1.1727-1.1666s.517-1.1667 1.161-1.1667h.0117c.6452 0 1.1667.5227 1.1667 1.1667s-.5227 1.1666-1.1667 1.1666z"
        fill="#9b9b9b"
      />
    </StyledSVG>
  )
}
