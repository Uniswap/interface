import * as React from 'react'

function SvgExpando(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path className="expando_svg__left" d="M18 15l-6-6" />
      <path className="expando_svg__right" d="M12 9l-6 6" />
    </svg>
  )
}

export default SvgExpando
