import { getErrorMessage, } from './helpers';
export class HistoryProvider {
    constructor(datafeedUrl, requester, limitedServerResponse) {
        this._datafeedUrl = datafeedUrl;
        this._requester = requester;
        this._limitedServerResponse = limitedServerResponse;
    }
    getBars(symbolInfo, resolution, periodParams) {
        const requestParams = {
            symbol: symbolInfo.ticker || '',
            resolution: resolution,
            from: periodParams.from,
            to: periodParams.to,
        };
        if (periodParams.countBack !== undefined) {
            requestParams.countback = periodParams.countBack;
        }
        if (symbolInfo.currency_code !== undefined) {
            requestParams.currencyCode = symbolInfo.currency_code;
        }
        if (symbolInfo.unit_id !== undefined) {
            requestParams.unitId = symbolInfo.unit_id;
        }
        return new Promise(async (resolve, reject) => {
            try {
                const initialResponse = await this._requester.sendRequest(this._datafeedUrl, 'history', requestParams);
                const result = this._processHistoryResponse(initialResponse);
                if (this._limitedServerResponse) {
                    await this._processTruncatedResponse(result, requestParams);
                }
                resolve(result);
            }
            catch (e) {
                if (e instanceof Error || typeof e === 'string') {
                    const reasonString = getErrorMessage(e);
                    // tslint:disable-next-line:no-console
                    console.warn(`HistoryProvider: getBars() failed, error=${reasonString}`);
                    reject(reasonString);
                }
            }
        });
    }
    async _processTruncatedResponse(result, requestParams) {
        let lastResultLength = result.bars.length;
        try {
            while (this._limitedServerResponse &&
                this._limitedServerResponse.maxResponseLength > 0 &&
                this._limitedServerResponse.maxResponseLength === lastResultLength &&
                requestParams.from < requestParams.to) {
                // adjust request parameters for follow-up request
                if (requestParams.countback) {
                    requestParams.countback = requestParams.countback - lastResultLength;
                }
                if (this._limitedServerResponse.expectedOrder === 'earliestFirst') {
                    requestParams.from = Math.round(result.bars[result.bars.length - 1].time / 1000);
                }
                else {
                    requestParams.to = Math.round(result.bars[0].time / 1000);
                }
                const followupResponse = await this._requester.sendRequest(this._datafeedUrl, 'history', requestParams);
                const followupResult = this._processHistoryResponse(followupResponse);
                lastResultLength = followupResult.bars.length;
                // merge result with results collected so far
                if (this._limitedServerResponse.expectedOrder === 'earliestFirst') {
                    if (followupResult.bars[0].time === result.bars[result.bars.length - 1].time) {
                        // Datafeed shouldn't include a value exactly matching the `to` timestamp but in case it does
                        // we will remove the duplicate.
                        followupResult.bars.shift();
                    }
                    result.bars.push(...followupResult.bars);
                }
                else {
                    if (followupResult.bars[followupResult.bars.length - 1].time === result.bars[0].time) {
                        // Datafeed shouldn't include a value exactly matching the `to` timestamp but in case it does
                        // we will remove the duplicate.
                        followupResult.bars.pop();
                    }
                    result.bars.unshift(...followupResult.bars);
                }
            }
        }
        catch (e) {
            /**
             * Error occurred during followup request. We won't reject the original promise
             * because the initial response was valid so we will return what we've got so far.
             */
            if (e instanceof Error || typeof e === 'string') {
                const reasonString = getErrorMessage(e);
                // tslint:disable-next-line:no-console
                console.warn(`HistoryProvider: getBars() warning during followup request, error=${reasonString}`);
            }
        }
    }
    _processHistoryResponse(response) {
        if (response.s !== 'ok' && response.s !== 'no_data') {
            throw new Error(response.errmsg);
        }
        const bars = [];
        const meta = {
            noData: false,
        };
        if (response.s === 'no_data') {
            meta.noData = true;
            meta.nextTime = response.nextTime;
        }
        else {
            const volumePresent = response.v !== undefined;
            const ohlPresent = response.o !== undefined;
            for (let i = 0; i < response.t.length; ++i) {
                const barValue = {
                    time: response.t[i] * 1000,
                    close: parseFloat(response.c[i]),
                    open: parseFloat(response.c[i]),
                    high: parseFloat(response.c[i]),
                    low: parseFloat(response.c[i]),
                };
                if (ohlPresent) {
                    barValue.open = parseFloat(response.o[i]);
                    barValue.high = parseFloat(response.h[i]);
                    barValue.low = parseFloat(response.l[i]);
                }
                if (volumePresent) {
                    barValue.volume = parseFloat(response.v[i]);
                }
                bars.push(barValue);
            }
        }
        return {
            bars: bars,
            meta: meta,
        };
    }
}
