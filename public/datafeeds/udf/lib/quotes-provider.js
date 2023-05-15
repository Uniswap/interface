import { getErrorMessage, logMessage, } from './helpers';
export class QuotesProvider {
    constructor(datafeedUrl, requester) {
        this._datafeedUrl = datafeedUrl;
        this._requester = requester;
    }
    getQuotes(symbols) {
        return new Promise((resolve, reject) => {
            this._requester.sendRequest(this._datafeedUrl, 'quotes', { symbols: symbols })
                .then((response) => {
                if (response.s === 'ok') {
                    resolve(response.d);
                }
                else {
                    reject(response.errmsg);
                }
            })
                .catch((error) => {
                const errorMessage = getErrorMessage(error);
                logMessage(`QuotesProvider: getQuotes failed, error=${errorMessage}`);
                reject(`network error: ${errorMessage}`);
            });
        });
    }
}
