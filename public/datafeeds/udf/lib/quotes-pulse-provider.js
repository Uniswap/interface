import { getErrorMessage, logMessage, } from './helpers';
export class QuotesPulseProvider {
    constructor(quotesProvider) {
        this._subscribers = {};
        this._requestsPending = 0;
        this._timers = null;
        this._quotesProvider = quotesProvider;
    }
    subscribeQuotes(symbols, fastSymbols, onRealtimeCallback, listenerGuid) {
        this._subscribers[listenerGuid] = {
            symbols: symbols,
            fastSymbols: fastSymbols,
            listener: onRealtimeCallback,
        };
        this._createTimersIfRequired();
        logMessage(`QuotesPulseProvider: subscribed quotes with #${listenerGuid}`);
    }
    unsubscribeQuotes(listenerGuid) {
        delete this._subscribers[listenerGuid];
        if (Object.keys(this._subscribers).length === 0) {
            this._destroyTimers();
        }
        logMessage(`QuotesPulseProvider: unsubscribed quotes with #${listenerGuid}`);
    }
    _createTimersIfRequired() {
        if (this._timers === null) {
            const fastTimer = setInterval(this._updateQuotes.bind(this, 1 /* SymbolsType.Fast */), 10000 /* UpdateTimeouts.Fast */);
            const generalTimer = setInterval(this._updateQuotes.bind(this, 0 /* SymbolsType.General */), 60000 /* UpdateTimeouts.General */);
            this._timers = { fastTimer, generalTimer };
        }
    }
    _destroyTimers() {
        if (this._timers !== null) {
            clearInterval(this._timers.fastTimer);
            clearInterval(this._timers.generalTimer);
            this._timers = null;
        }
    }
    _updateQuotes(updateType) {
        if (this._requestsPending > 0) {
            return;
        }
        // eslint-disable-next-line guard-for-in
        for (const listenerGuid in this._subscribers) {
            this._requestsPending++;
            const subscriptionRecord = this._subscribers[listenerGuid];
            this._quotesProvider.getQuotes(updateType === 1 /* SymbolsType.Fast */ ? subscriptionRecord.fastSymbols : subscriptionRecord.symbols)
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
