import React from 'react'
import useTheme from 'hooks/useTheme'

function Discord() {
  const theme = useTheme()
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14">
      <g fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
        <g stroke={theme.subText} strokeWidth="1">
          <g>
            <g>
              <g>
                <path
                  d="M42.818 3.5S41.151 2.154 39.182 2l-.178.366c1.78.45 2.597 1.093 3.45 1.884-1.471-.775-2.923-1.5-5.454-1.5-2.53 0-3.983.725-5.455 1.5.854-.791 1.826-1.506 3.45-1.884L34.819 2c-2.065.2-3.636 1.5-3.636 1.5S29.32 6.285 29 11.75c1.876 2.232 4.727 2.25 4.727 2.25l.597-.819c-1.013-.363-2.155-1.01-3.142-2.181 1.177.919 2.954 1.875 5.818 1.875 2.864 0 4.64-.956 5.818-1.875-.987 1.17-2.129 1.818-3.142 2.181l.597.819s2.85-.018 4.727-2.25c-.32-5.465-2.182-8.25-2.182-8.25zm-8.182 6.75c-.703 0-1.272-.671-1.272-1.5s.57-1.5 1.272-1.5c.704 0 1.273.671 1.273 1.5s-.57 1.5-1.273 1.5zm4.728 0c-.704 0-1.273-.671-1.273-1.5s.57-1.5 1.273-1.5 1.272.671 1.272 1.5-.57 1.5-1.272 1.5z"
                  transform="translate(-1073 -4535) translate(0 4509) translate(320 25) translate(725)"
                />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

export default Discord
