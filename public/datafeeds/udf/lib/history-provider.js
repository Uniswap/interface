import { getErrorMessage, } from './helpers';
export class HistoryProvider {
    constructor(datafeedUrl, requester) {
        this._datafeedUrl = datafeedUrl;
        this._requester = requester;
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
        return new Promise((resolve, reject) => {
            this._requester.sendRequest(this._datafeedUrl, 'history', requestParams)
                .then((response) => {
                if (response.s !== 'ok' && response.s !== 'no_data') {
                    reject(response.errmsg);
                    return;
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
                resolve({
                    bars: bars,
                    meta: meta,
                });
            })
                .catch((reason) => {
                const reasonString = getErrorMessage(reason);
                // tslint:disable-next-line:no-console
                console.warn(`HistoryProvider: getBars() failed, error=${reasonString}`);
                reject(reasonString);
            });
        });
    }
}
