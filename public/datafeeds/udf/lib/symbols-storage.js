import { getErrorMessage, logMessage, } from './helpers';
function extractField(data, field, arrayIndex, valueIsArray) {
    const value = data[field];
    if (Array.isArray(value) && (!valueIsArray || Array.isArray(value[0]))) {
        return value[arrayIndex];
    }
    return value;
}
function symbolKey(symbol, currency, unit) {
    // here we're using a separator that quite possible shouldn't be in a real symbol name
    return symbol + (currency !== undefined ? '_%|#|%_' + currency : '') + (unit !== undefined ? '_%|#|%_' + unit : '');
}
export class SymbolsStorage {
    constructor(datafeedUrl, datafeedSupportedResolutions, requester) {
        this._exchangesList = ['NYSE', 'FOREX', 'AMEX'];
        this._symbolsInfo = {};
        this._symbolsList = [];
        this._datafeedUrl = datafeedUrl;
        this._datafeedSupportedResolutions = datafeedSupportedResolutions;
        this._requester = requester;
        this._readyPromise = this._init();
        this._readyPromise.catch((error) => {
            // seems it is impossible
            // tslint:disable-next-line:no-console
            console.error(`SymbolsStorage: Cannot init, error=${error.toString()}`);
        });
    }
    // BEWARE: this function does not consider symbol's exchange
    resolveSymbol(symbolName, currencyCode, unitId) {
        return this._readyPromise.then(() => {
            const symbolInfo = this._symbolsInfo[symbolKey(symbolName, currencyCode, unitId)];
            if (symbolInfo === undefined) {
                return Promise.reject('invalid symbol');
            }
            return Promise.resolve(symbolInfo);
        });
    }
    searchSymbols(searchString, exchange, symbolType, maxSearchResults) {
        return this._readyPromise.then(() => {
            const weightedResult = [];
            const queryIsEmpty = searchString.length === 0;
            searchString = searchString.toUpperCase();
            for (const symbolName of this._symbolsList) {
                const symbolInfo = this._symbolsInfo[symbolName];
                if (symbolInfo === undefined) {
                    continue;
                }
                if (symbolType.length > 0 && symbolInfo.type !== symbolType) {
                    continue;
                }
                if (exchange && exchange.length > 0 && symbolInfo.exchange !== exchange) {
                    continue;
                }
                const positionInName = symbolInfo.name.toUpperCase().indexOf(searchString);
                const positionInDescription = symbolInfo.description.toUpperCase().indexOf(searchString);
                if (queryIsEmpty || positionInName >= 0 || positionInDescription >= 0) {
                    const alreadyExists = weightedResult.some((item) => item.symbolInfo === symbolInfo);
                    if (!alreadyExists) {
                        const weight = positionInName >= 0 ? positionInName : 8000 + positionInDescription;
                        weightedResult.push({ symbolInfo: symbolInfo, weight: weight });
                    }
                }
            }
            const result = weightedResult
                .sort((item1, item2) => item1.weight - item2.weight)
                .slice(0, maxSearchResults)
                .map((item) => {
                const symbolInfo = item.symbolInfo;
                return {
                    symbol: symbolInfo.name,
                    full_name: symbolInfo.full_name,
                    description: symbolInfo.description,
                    exchange: symbolInfo.exchange,
                    params: [],
                    type: symbolInfo.type,
                    ticker: symbolInfo.name,
                };
            });
            return Promise.resolve(result);
        });
    }
    _init() {
        const promises = [];
        const alreadyRequestedExchanges = {};
        for (const exchange of this._exchangesList) {
            if (alreadyRequestedExchanges[exchange]) {
                continue;
            }
            alreadyRequestedExchanges[exchange] = true;
            promises.push(this._requestExchangeData(exchange));
        }
        return Promise.all(promises)
            .then(() => {
            this._symbolsList.sort();
            logMessage('SymbolsStorage: All exchanges data loaded');
        });
    }
    _requestExchangeData(exchange) {
        return new Promise((resolve, reject) => {
            this._requester.sendRequest(this._datafeedUrl, 'symbol_info', { group: exchange })
                .then((response) => {
                try {
                    this._onExchangeDataReceived(exchange, response);
                }
                catch (error) {
                    reject(error instanceof Error ? error : new Error(`SymbolsStorage: Unexpected exception ${error}`));
                    return;
                }
                resolve();
            })
                .catch((reason) => {
                logMessage(`SymbolsStorage: Request data for exchange '${exchange}' failed, reason=${getErrorMessage(reason)}`);
                resolve();
            });
        });
    }
    _onExchangeDataReceived(exchange, data) {
        let symbolIndex = 0;
        try {
            const symbolsCount = data.symbol.length;
            const tickerPresent = data.ticker !== undefined;
            for (; symbolIndex < symbolsCount; ++symbolIndex) {
                const symbolName = data.symbol[symbolIndex];
                const listedExchange = extractField(data, 'exchange-listed', symbolIndex);
                const tradedExchange = extractField(data, 'exchange-traded', symbolIndex);
                const fullName = tradedExchange + ':' + symbolName;
                const currencyCode = extractField(data, 'currency-code', symbolIndex);
                const unitId = extractField(data, 'unit-id', symbolIndex);
                const ticker = tickerPresent ? extractField(data, 'ticker', symbolIndex) : symbolName;
                const symbolInfo = {
                    ticker: ticker,
                    name: symbolName,
                    base_name: [listedExchange + ':' + symbolName],
                    full_name: fullName,
                    listed_exchange: listedExchange,
                    exchange: tradedExchange,
                    currency_code: currencyCode,
                    original_currency_code: extractField(data, 'original-currency-code', symbolIndex),
                    unit_id: unitId,
                    original_unit_id: extractField(data, 'original-unit-id', symbolIndex),
                    unit_conversion_types: extractField(data, 'unit-conversion-types', symbolIndex, true),
                    description: extractField(data, 'description', symbolIndex),
                    has_intraday: definedValueOrDefault(extractField(data, 'has-intraday', symbolIndex), false),
                    has_no_volume: definedValueOrDefault(extractField(data, 'has-no-volume', symbolIndex), undefined),
                    visible_plots_set: definedValueOrDefault(extractField(data, 'visible-plots-set', symbolIndex), undefined),
                    minmov: extractField(data, 'minmovement', symbolIndex) || extractField(data, 'minmov', symbolIndex) || 0,
                    minmove2: extractField(data, 'minmove2', symbolIndex) || extractField(data, 'minmov2', symbolIndex),
                    fractional: extractField(data, 'fractional', symbolIndex),
                    pricescale: extractField(data, 'pricescale', symbolIndex),
                    type: extractField(data, 'type', symbolIndex),
                    session: extractField(data, 'session-regular', symbolIndex),
                    session_holidays: extractField(data, 'session-holidays', symbolIndex),
                    corrections: extractField(data, 'corrections', symbolIndex),
                    timezone: extractField(data, 'timezone', symbolIndex),
                    supported_resolutions: definedValueOrDefault(extractField(data, 'supported-resolutions', symbolIndex, true), this._datafeedSupportedResolutions),
                    has_daily: definedValueOrDefault(extractField(data, 'has-daily', symbolIndex), true),
                    intraday_multipliers: definedValueOrDefault(extractField(data, 'intraday-multipliers', symbolIndex, true), ['1', '5', '15', '30', '60']),
                    has_weekly_and_monthly: extractField(data, 'has-weekly-and-monthly', symbolIndex),
                    has_empty_bars: extractField(data, 'has-empty-bars', symbolIndex),
                    volume_precision: definedValueOrDefault(extractField(data, 'volume-precision', symbolIndex), 0),
                    format: 'price',
                };
                this._symbolsInfo[ticker] = symbolInfo;
                this._symbolsInfo[symbolName] = symbolInfo;
                this._symbolsInfo[fullName] = symbolInfo;
                if (currencyCode !== undefined || unitId !== undefined) {
                    this._symbolsInfo[symbolKey(ticker, currencyCode, unitId)] = symbolInfo;
                    this._symbolsInfo[symbolKey(symbolName, currencyCode, unitId)] = symbolInfo;
                    this._symbolsInfo[symbolKey(fullName, currencyCode, unitId)] = symbolInfo;
                }
                this._symbolsList.push(symbolName);
            }
        }
        catch (error) {
            throw new Error(`SymbolsStorage: API error when processing exchange ${exchange} symbol #${symbolIndex} (${data.symbol[symbolIndex]}): ${Object(error).message}`);
        }
    }
}
function definedValueOrDefault(value, defaultValue) {
    return value !== undefined ? value : defaultValue;
}
