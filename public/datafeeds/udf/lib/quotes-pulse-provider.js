import { getErrorMessage, logMessage, } from './helpers';
export class QuotesPulseProvider {
    constructor(quotesProvider) {
        this._subscribers = {};
        this._requestsPending = 0;
        this._quotesProvider = quotesProvider;
        setInterval(this._updateQuotes.bind(this, 1 /* Fast */), 10000 /* Fast */);
        setInterval(this._updateQuotes.bind(this, 0 /* General */), 60000 /* General */);
    }
    subscribeQuotes(symbols, fastSymbols, onRealtimeCallback, listenerGuid) {
        this._subscribers[listenerGuid] = {
            symbols: symbols,
            fastSymbols: fastSymbols,
            listener: onRealtimeCallback,
        };
        logMessage(`QuotesPulseProvider: subscribed quotes with #${listenerGuid}`);
    }
    unsubscribeQuotes(listenerGuid) {
        delete this._subscribers[listenerGuid];
        logMessage(`QuotesPulseProvider: unsubscribed quotes with #${listenerGuid}`);
    }
    _updateQuotes(updateType) {
        if (this._requestsPending > 0) {
            return;
        }
        for (const listenerGuid in this._subscribers) { // tslint:disable-line:forin
            this._requestsPending++;
            const subscriptionRecord = this._subscribers[listenerGuid];
            this._quotesProvider.getQuotes(updateType === 1 /* Fast */ ? subscriptionRecord.fastSymbols : subscriptionRecord.symbols)
                .then((data) => {
                this._requestsPending--;
                if (!this._subscribers.hasOwnProperty(listenerGuid)) {
                    return;
                }
                subscriptionRecord.listener(data);
                logMessage(`QuotesPulseProvider: data for #${listenerGuid} (${updateType}) updated successfully, pending=${this._requestsPending}`);
            })
                .catch((reason) => {
                this._requestsPending--;
                logMessage(`QuotesPulseProvider: data for #${listenerGuid} (${updateType}) updated with error=${getErrorMessage(reason)}, pending=${this._requestsPending}`);
            });
        }
    }
}
