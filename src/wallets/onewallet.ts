import { AbstractWallet } from './AbstractWallet';
import { Hmy } from '../blockchain';

const {HarmonyExtension} = require('@harmony-js/core');
//const { Harmony } = require('@harmony-js/core');
const defaults = {};

export class OneWallet extends AbstractWallet {
  private onewallet: any;
  public isOneWallet = false;

  constructor(network: string, client: Hmy) {
    super(network, client);

    this.isOneWallet = false;

    setTimeout(async () => {
      this.initWallet();
    }, 500);

    setInterval(async () => {
      this.initWallet();
    }, 3000);

    this.initWallet();

    const session = localStorage.getItem(`harmony_${this.network}_onewallet_session`) || '{}';
    const sessionObj = JSON.parse(session);

    if (sessionObj && sessionObj.address) {
      this.address = sessionObj.address;
      this.sessionType = sessionObj.sessionType;
      this.isAuthorized = true;
      this.setBase16Address();
    }
  }

  public signIn() {
    if (!this.onewallet) {
      this.initWallet();
    }

    return this.onewallet.getAccount().then((account: any) => {
      this.sessionType = `onewallet`;
      this.address = account.address;
      this.isAuthorized = true;
      this.setBase16Address();

      this.syncLocalStorage();

      return Promise.resolve();
    });
  }

  public signOut() {
    if (this.sessionType === 'onewallet' && this.isOneWallet) {
      return this.onewallet
        .forgetIdentity()
        .then(() => {
          this.sessionType = '';
          this.address = null;
          this.base16Address = null;
          this.isAuthorized = false;

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
    if (window.onewallet) {
      // @ts-ignore
      this.onewallet = window.onewallet;
      this.isOneWallet = true;

      this.extension = new HarmonyExtension(this.onewallet);
      this.extension.provider = this.client.client.provider;
      this.extension.messenger = this.client.client.messenger;
      this.extension.setShardID(0)
      this.extension.wallet.messenger = this.client.client.messenger;
      this.extension.blockchain.messenger = this.client.client.messenger;
      this.extension.transactions.messenger = this.client.client.messenger;
      this.extension.contracts.wallet = this.extension.wallet
    }
  }

  private syncLocalStorage() {
    localStorage.setItem(
      `harmony_${this.network}_onewallet_session`,
      JSON.stringify({
        address: this.address,
        sessionType: this.sessionType,
      }),
    );
  }

  private setBase16Address(): void {
    this.base16Address = this.client.client.crypto.fromBech32(this.address);
  }

  public signTransaction(txn: any) {
    if (this.sessionType === 'onewallet' && this.isOneWallet) {
      return this.onewallet.signTransaction(txn);
    }
  }

  public saveRedirectUrl(url: string) {
    if (!this.isAuthorized && url) {
      this.redirectUrl = url;
    }
  }

  public reset() {
    Object.assign(this, defaults);
  }

  public attachToContract(contract: any): any {
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
        if (err.type === "locked") {
          alert("Your OneWallet is locked! Please unlock it and try again!");
          return Promise.reject();
        } else if (err.type === "networkError") {
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
          alert("An error occurred - please check that you have OneWallet installed and that it is properly configured!");
          return Promise.reject();
        }
      }
    };

    return contract;
  }
}
