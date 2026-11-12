const rotateCSS = `
  @keyframes rotateUniToken3D {
    0% {
      transform: perspective(1000px) rotateY(0deg);
    }
    100% {
      transform: perspective(1000px) rotateY(360deg);
    }
  }

  .UniTokenAnimated3D {
    animation: rotateUniToken3D 5s cubic-bezier(0.83, 0, 0.17, 1) infinite;
    filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15));
    padding-top: 2rem;
    display: block;
  }
`

interface UniTokenAnimatedProps {
  src: string
  alt?: string
  width?: number | string
}

export function UniTokenAnimated({ src, alt = '', width }: UniTokenAnimatedProps): JSX.Element {
  return (
    <>
      <style>{rotateCSS}</style>
      <img alt={alt} className="UniTokenAnimated3D" src={src} width={width} />
    </>
  )
}
