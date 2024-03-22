import React from 'react';
import { SwapPoolTabs } from '../../components/NavigationTabs';
import { AutoColumn } from '../../components/Column';
import AppBody from '../AppBody'; // Corrected import statement
import styled from 'styled-components';

const IframeContainer = styled.div`
  width: 100%;
  height: 600px; // Adjust height as needed
`;

const CoveringElement = styled.div`
  position: absolute;
  top: 140;
  left: 20;
  width: 50%;
  height: 8%;
  background-color: #212429; /* or any color you want to cover the logo */
  z-index: 1; /* ensure it's above the iframe */
`;

export default function Aggregator() {
  return (
    <>
      <AppBody>
        <SwapPoolTabs active={'aggregator'} />
        <AutoColumn gap="lg" justify="center">
          <IframeContainer>
          <CoveringElement />

            <iframe
              title="LlamaSwap Widget"
              name="LlamaSwap Widget"
              src="https://swap.defillama.com?chain=avax"
              width="100%"
              height="100%"
              allow="fullscreen"
              frameBorder="0"
              scrolling="no"
            ></iframe>
          </IframeContainer>
        </AutoColumn>
      </AppBody>
    </>
  );
}
