import React from 'react'
import styled from 'styled-components';

export const DisclaimerBar = () => {
  return (
    <Bar>
      <Disclaimer>Swapr.dev is an unofficial build meant for development and testing purposes. <a href="https://swapr.eth.link/" target="_blank" rel="noopener noreferrer">Please visit Swapr.eth</a></Disclaimer>
    </Bar>
  )
}

const Bar = styled.div`
  width: 100%;
  padding: 8px;
  background: rgba(242, 153, 74, 0.15);
  border-bottom: 1px solid rgba(242, 153, 74, 0.5);
`;

const Disclaimer = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  text-align: center;
  color: #F2994A;

  a {
    font-weight: 700;
    color: inherit;
    text-decoration: none;
  }
`;

