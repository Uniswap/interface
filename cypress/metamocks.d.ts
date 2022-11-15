import MetaMocks from 'metamocks';

export interface EthereumProvider {
  on?: (...args: any[]) => void;
  removeListener?: (...args: any[]) => void;
  autoRefreshOnNetworkChange?: boolean;
}

declare global {
  namespace Cypress {
    interface Chainable {
      registerAbiHandler: (...args: Parameters<MetaMocks['registerAbiHandler']>) => void;

      setupMetamocks(): void;
    }

    interface Window {
      ethereum?: EthereumProvider;
    }
  }
  namespace Mocha {
    interface Context {
      metamocks?: MetaMocks;
    }
  }
}
