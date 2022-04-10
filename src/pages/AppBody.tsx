import React from 'react'
import styled, { css } from 'styled-components/macro'

const Glow = css`
  animation: glow 10s ease-in-out infinite;
  -webkit-animation: glow 10s ease-in-out infinite;

  @keyframes glow {
    0% {
      box-shadow: 0 0 20px rgba(39, 210, 234, 0.1), 0 0 30px rgba(39, 210, 234, 0.1), 0 0 40px rgba(39, 210, 234, 0.1),
        0 0 50px rgba(39, 210, 234, 0.1), 0 0 60px rgba(39, 210, 234, 0.1), 0 0 70px rgba(39, 210, 234, 0.1),
        0 0 80px rgba(39, 210, 234, 0.1);
    }
    50% {
      //  box-shadow: 0 0 20px rgba(39, 210, 234, 0.1), 0 0 30px rgba(39, 210, 234, 0.1), 0 0 40px rgba(39, 210, 234, 0.1),
      //  0 0 50px rgba(39, 210, 234, 0.1), 0 0 60px rgba(39, 210, 234, 0.1), 0 0 70px rgba(39, 210, 234, 0.1),
      //  0 0 80px rgba(39, 210, 234, 0.1);
      box-shadow: 0 0 20px rgba(39, 210, 234, 0.15), 0 0 30px rgba(39, 210, 234, 0.15),
        0 0 40px rgba(39, 210, 234, 0.15), 0 0 50px rgba(39, 210, 234, 0.2), 0 0 60px rgba(39, 210, 234, 0.2),
        0 0 70px rgba(39, 210, 234, 0.3), 0 0 80px rgba(39, 210, 234, 0.3);
    }
    100% {
      box-shadow: 0 0 20px rgba(39, 210, 234, 0.1), 0 0 30px rgba(39, 210, 234, 0.1), 0 0 40px rgba(39, 210, 234, 0.1),
        0 0 50px rgba(39, 210, 234, 0.1), 0 0 60px rgba(39, 210, 234, 0.1), 0 0 70px rgba(39, 210, 234, 0.1),
        0 0 80px rgba(39, 210, 234, 0.1);
      //box-shadow: 0 0 20px rgba(39, 210, 234, 0.2), 0 0 30px rgba(39, 210, 234, 0.2), 0 0 40px rgba(39, 210, 234, 0.2),
      //  0 0 50px rgba(39, 210, 234, 0.6), 0 0 60px rgba(39, 210, 234, 0.6), 0 0 70px rgba(39, 210, 234, 0.6),
      //  0 0 80px rgba(39, 210, 234, 0.6);
    }
  }

  @-webkit-keyframes glow {
    0% {
      //box-shadow: 0 0 20px rgba(39, 210, 234, 0.1), 0 0 30px rgba(39, 210, 234, 0.1), 0 0 40px rgba(39, 210, 234, 0.1),
      //0 0 50px rgba(39, 210, 234, 0.1), 0 0 60px rgba(39, 210, 234, 0.1), 0 0 70px rgba(39, 210, 234, 0.1),
      //0 0 80px rgba(39, 210, 234, 0.1);
    }
    //50% {
    //  box-shadow: 0 0 20px 3px rgba(230, 0, 122, 0.4) inset;
    //}
    100% {
      //box-shadow: 0 0 20px rgba(39, 210, 234, 0.2), 0 0 30px rgba(39, 210, 234, 0.2), 0 0 40px rgba(39, 210, 234, 0.2),
      //0 0 50px rgba(39, 210, 234, 0.6), 0 0 60px rgba(39, 210, 234, 0.6), 0 0 70px rgba(39, 210, 234, 0.6),
      //0 0 80px rgba(39, 210, 234, 0.6);
    }
  }
`

export const BodyWrapper = styled.div<{ margin?: string }>`
  position: relative;
  margin-top: ${({ margin }) => margin ?? '0px'};
  max-width: 480px;
  width: 100%;
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.darkTransparent3} 0%, ${theme.dark2} 50%, ${theme.darkTransparent3} 100%);`};
  border-radius: 8px;
  margin-top: 1rem;
  border: 1px solid rgba(12, 92, 146, 0.7);
  backdrop-filter: blur(4px) saturate(150%);
  ${Glow}
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children, ...rest }: { children: React.ReactNode }) {
  return <BodyWrapper {...rest}>{children}</BodyWrapper>
}
