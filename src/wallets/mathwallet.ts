import { action, observable } from 'mobx';
const { Harmony } = require('@harmony-js/core');
const defaults = {};

export class MathWallet {
  network: string;
  client: typeof Harmony;
  @observable public isAuthorized: boolean;
  redirectUrl!: string;

  private mathwallet: any;
  @observable public isMathWallet = false;

  @observable public sessionType: 'mathwallet' | 'ledger' | 'wallet' | null;
  @observable public address: string | null;
  @observable public base16Address: string | null;
  @observable public balance: string = '0';

  constructor(network: string, client: typeof Harmony) {
    this.network = network;
    this.client = client;

    this.isAuthorized = false;
    this.isMathWallet = false;
    this.sessionType = null;
    this.address = null;
    this.base16Address = null;

    setTimeout(async () => {
      this.initWallet();
    }, 500);

    setInterval(async () => {
      this.initWallet();
    }, 3000);

    this.initWallet();

    const session = localStorage.getItem(`harmony_${this.network}_mathwallet_session`) || '{}';
    const sessionObj = JSON.parse(session);

    if (sessionObj && sessionObj.address) {
      this.address = sessionObj.address;
      this.sessionType = sessionObj.sessionType;
      this.isAuthorized = true;
      this.setBase16Address();
    }
  }

  @action public signIn() {
    if (!this.mathwallet) {
      this.initWallet();
    }

    return this.mathwallet.getAccount().then((account: any) => {
      this.sessionType = `mathwallet`;
      this.address = account.address;
      this.isAuthorized = true;
      this.setBase16Address();

      this.syncLocalStorage();

      return Promise.resolve();
    });
  }

  @action public signOut() {
    if (this.sessionType === 'mathwallet' && this.isMathWallet) {
      return this.mathwallet
        .forgetIdentity()
        .then(() => {
          this.sessionType = null;
          this.address = null;
          this.base16Address = null;
          this.isAuthorized = false;
          this.balance = '0';

          this.syncLocalStorage();

          return Promise.resolve();
        })
        .catch((err: any) => {
          console.error(err.message);
        });
    }
  }

  private initWallet() {
    // @ts-ignore
    this.isMathWallet = window.harmony && window.harmony.isMathWallet;
    // @ts-ignore
    this.mathwallet = window.harmony;
  }

  private syncLocalStorage() {
    localStorage.setItem(
      `harmony_${this.network}_mathwallet_session`,
      JSON.stringify({
        address: this.address,
        sessionType: this.sessionType,
      }),
    );
  }

  private setBase16Address(): void {
    this.base16Address = this.client.crypto.fromBech32(this.address);
  }

  @action public signTransaction(txn: any) {
    if (this.sessionType === 'mathwallet' && this.isMathWallet) {
      return this.mathwallet.signTransaction(txn);
    }
  }

  public saveRedirectUrl(url: string) {
    if (!this.isAuthorized && url) {
      this.redirectUrl = url;
    }
  }

  @action public reset() {
    Object.assign(this, defaults);
  }

  @action public attachToContract(contract: any): any {
    contract.wallet.createAccount();

    if (contract.wallet.defaultSigner === "") {
      contract.wallet.defaultSigner = this.address;
    }
    
    contract.wallet.signTransaction = async (tx: any) => {
      try {
        tx.from = this.address;

        // @ts-ignore
        const signTx = await this.signTransaction(tx);
        
        return signTx;
      } catch (err) {

        if (err.type == "locked") {
          alert("Your MathWallet is locked! Please unlock it and try again!");
          return Promise.reject();
        } else if (err.type == "networkError") {
          // This happens when there's local storage data available after a browser shutdown
          // Despite local storage data being available, when txs are signed a sign in still need to have happened
          // Force sign in, then reinit wallet
          this.isAuthorized = false;
          await this.signIn();
          this.initWallet();

          try {
            tx.from = this.address;
            const signTx = await this.signTransaction(tx);
            return signTx;
          } catch (error) {
            return Promise.reject(error);
          }

        } else {
          alert("An error occurred - please check that you have MathWallet installed and that it is properly configured!");
          return Promise.reject();
        }
      }
    };

    return contract;
  }
}
