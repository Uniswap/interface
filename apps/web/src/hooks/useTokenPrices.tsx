import { useState, useEffect } from 'react';
import { indexerTaraswap } from 'components/Incentives/types';

interface TokenPrice {
  id: string;
  derivedETH: string;
}

const PRICE_QUERY = `
  query tokenPrices($tokenIds: [String!]!) {
    tokens(where: { id_in: $tokenIds }) {
      id
      derivedETH
    }
  }
`;

export const useTokenPrices = (tokenAddresses: string[]) => {
  const [prices, setPrices] = useState<{ [key: string]: number | null }>({});

  useEffect(() => {
    const fetchPrices = async () => {
      if (!tokenAddresses.length || !indexerTaraswap) return;

      try {
        const response = await fetch(indexerTaraswap, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: PRICE_QUERY,
            variables: {
              tokenIds: tokenAddresses.map(addr => addr.toLowerCase()),
            },
          }),
        });

        const data = await response.json();
        if (data?.data?.tokens) {
          const newPrices: { [key: string]: number | null } = {};
          data.data.tokens.forEach((token: TokenPrice) => {
            newPrices[token.id] = parseFloat(token.derivedETH) || null;
          });
          setPrices(newPrices);
        }
      } catch (error) {
        console.error('Error fetching token prices:', error);
      }
    };

    fetchPrices();
  }, [tokenAddresses]);

  return prices;
}; 