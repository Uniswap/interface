const FavoriteStar = ({ width, height }: { width?: number; height?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width || 34} height={height || 33} viewBox="0 0 34 33">
      <g fill="none" fillRule="evenodd">
        <g>
          <g>
            <g>
              <path
                fill="#08A1E7"
                d="M0.75 0.502L34.544 0.502 0.75 33.502z"
                transform="translate(-365 -208) translate(364.25 157) translate(0 50.498)"
              />
              <path
                fill="#FAFAFA"
                d="M6.616 13.916c-.253.133-.56.11-.79-.06-.23-.169-.345-.454-.295-.736l.404-2.318L4.232 9.17c-.208-.199-.284-.499-.196-.772.088-.274.325-.474.61-.514l2.364-.338 1.068-2.129C8.204 5.162 8.465 5 8.75 5c.285 0 .545.162.672.417l1.067 2.13 2.365.337c.285.04.522.24.61.514.088.273.012.573-.197.772l-1.703 1.632.405 2.319c.05.281-.064.567-.295.736-.23.169-.537.192-.79.06L8.75 12.814l-2.134 1.102z"
                transform="translate(-365 -208) translate(364.25 157) translate(0 50.498)"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

export default FavoriteStar
