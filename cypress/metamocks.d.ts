import MetaMocks from "metamocks";
import {injected} from "./support/ethereum";

declare global {
  namespace Cypress {
    interface Chainable {
      setupMetamocks(): void;
    }

    interface ApplicationWindow {
      ethereum: typeof injected;
    }
  }
  namespace Mocha {
    interface Context {
      metamocks: MetaMocks;
    }
  }
}
