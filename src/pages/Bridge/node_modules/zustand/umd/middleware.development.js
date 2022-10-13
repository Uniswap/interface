(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.zustandMiddleware = {}));
})(this, (function (exports) { 'use strict';

  function _extends() {
    _extends = Object.assign ? Object.assign.bind() : function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };
    return _extends.apply(this, arguments);
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  var reduxImpl = function reduxImpl(reducer, initial) {
    return function (set, _get, api) {
      api.dispatch = function (action) {
        set(function (state) {
          return reducer(state, action);
        }, false, action);
        return action;
      };

      api.dispatchFromDevtools = true;
      return _extends({
        dispatch: function dispatch() {
          var _ref;

          return (_ref = api).dispatch.apply(_ref, arguments);
        }
      }, initial);
    };
  };

  var redux = reduxImpl;

  var _excluded = ["enabled", "anonymousActionType"];

  var devtoolsImpl = function devtoolsImpl(fn, devtoolsOptions) {
    if (devtoolsOptions === void 0) {
      devtoolsOptions = {};
    }

    return function (set, get, api) {
      var _devtoolsOptions = devtoolsOptions,
          enabled = _devtoolsOptions.enabled,
          anonymousActionType = _devtoolsOptions.anonymousActionType,
          options = _objectWithoutPropertiesLoose(_devtoolsOptions, _excluded);

      var extensionConnector;

      try {
        extensionConnector = (enabled != null ? enabled : true) && window.__REDUX_DEVTOOLS_EXTENSION__;
      } catch (_unused) {}

      if (!extensionConnector) {
        if (enabled) {
          console.warn('[zustand devtools middleware] Please install/enable Redux devtools extension');
        }

        return fn(set, get, api);
      }

      var extension = extensionConnector.connect(options);
      var isRecording = true;

      api.setState = function (state, replace, nameOrAction) {
        var r = set(state, replace);
        if (!isRecording) return r;
        extension.send(nameOrAction === undefined ? {
          type: anonymousActionType || 'anonymous'
        } : typeof nameOrAction === 'string' ? {
          type: nameOrAction
        } : nameOrAction, get());
        return r;
      };

      var setStateFromDevtools = function setStateFromDevtools() {
        var originalIsRecording = isRecording;
        isRecording = false;
        set.apply(void 0, arguments);
        isRecording = originalIsRecording;
      };

      var initialState = fn(api.setState, get, api);
      extension.init(initialState);

      if (api.dispatchFromDevtools && typeof api.dispatch === 'function') {
        var didWarnAboutReservedActionType = false;
        var originalDispatch = api.dispatch;

        api.dispatch = function () {
          for (var _len = arguments.length, a = new Array(_len), _key = 0; _key < _len; _key++) {
            a[_key] = arguments[_key];
          }

          if (a[0].type === '__setState' && !didWarnAboutReservedActionType) {
            console.warn('[zustand devtools middleware] "__setState" action type is reserved ' + 'to set state from the devtools. Avoid using it.');
            didWarnAboutReservedActionType = true;
          }
          originalDispatch.apply(void 0, a);
        };
      }
      extension.subscribe(function (message) {
        switch (message.type) {
          case 'ACTION':
            if (typeof message.payload !== 'string') {
              console.error('[zustand devtools middleware] Unsupported action format');
              return;
            }

            return parseJsonThen(message.payload, function (action) {
              if (action.type === '__setState') {
                setStateFromDevtools(action.state);
                return;
              }

              if (!api.dispatchFromDevtools) return;
              if (typeof api.dispatch !== 'function') return;
              api.dispatch(action);
            });

          case 'DISPATCH':
            switch (message.payload.type) {
              case 'RESET':
                setStateFromDevtools(initialState);
                return extension.init(api.getState());

              case 'COMMIT':
                return extension.init(api.getState());

              case 'ROLLBACK':
                return parseJsonThen(message.state, function (state) {
                  setStateFromDevtools(state);
                  extension.init(api.getState());
                });

              case 'JUMP_TO_STATE':
              case 'JUMP_TO_ACTION':
                return parseJsonThen(message.state, function (state) {
                  setStateFromDevtools(state);
                });

              case 'IMPORT_STATE':
                {
                  var _nextLiftedState$comp;

                  var nextLiftedState = message.payload.nextLiftedState;
                  var lastComputedState = (_nextLiftedState$comp = nextLiftedState.computedStates.slice(-1)[0]) == null ? void 0 : _nextLiftedState$comp.state;
                  if (!lastComputedState) return;
                  setStateFromDevtools(lastComputedState);
                  extension.send(null, nextLiftedState);
                  return;
                }

              case 'PAUSE_RECORDING':
                return isRecording = !isRecording;
            }

            return;
        }
      });
      return initialState;
    };
  };

  var devtools = devtoolsImpl;

  var parseJsonThen = function parseJsonThen(stringified, f) {
    var parsed;

    try {
      parsed = JSON.parse(stringified);
    } catch (e) {
      console.error('[zustand devtools middleware] Could not parse the received json', e);
    }

    if (parsed !== undefined) f(parsed);
  };

  var subscribeWithSelectorImpl = function subscribeWithSelectorImpl(fn) {
    return function (set, get, api) {
      var origSubscribe = api.subscribe;

      api.subscribe = function (selector, optListener, options) {
        var listener = selector;

        if (optListener) {
          var equalityFn = (options == null ? void 0 : options.equalityFn) || Object.is;
          var currentSlice = selector(api.getState());

          listener = function listener(state) {
            var nextSlice = selector(state);

            if (!equalityFn(currentSlice, nextSlice)) {
              var previousSlice = currentSlice;
              optListener(currentSlice = nextSlice, previousSlice);
            }
          };

          if (options != null && options.fireImmediately) {
            optListener(currentSlice, currentSlice);
          }
        }

        return origSubscribe(listener);
      };

      var initialState = fn(set, get, api);
      return initialState;
    };
  };

  var subscribeWithSelector = subscribeWithSelectorImpl;

  var combine = function combine(initialState, create) {
    return function () {
      return Object.assign({}, initialState, create.apply(void 0, arguments));
    };
  };

  var toThenable = function toThenable(fn) {
    return function (input) {
      try {
        var result = fn(input);

        if (result instanceof Promise) {
          return result;
        }

        return {
          then: function then(onFulfilled) {
            return toThenable(onFulfilled)(result);
          },
          catch: function _catch(_onRejected) {
            return this;
          }
        };
      } catch (e) {
        return {
          then: function then(_onFulfilled) {
            return this;
          },
          catch: function _catch(onRejected) {
            return toThenable(onRejected)(e);
          }
        };
      }
    };
  };

  var persistImpl = function persistImpl(config, baseOptions) {
    return function (set, get, api) {
      var options = _extends({
        getStorage: function getStorage() {
          return localStorage;
        },
        serialize: JSON.stringify,
        deserialize: JSON.parse,
        partialize: function partialize(state) {
          return state;
        },
        version: 0,
        merge: function merge(persistedState, currentState) {
          return _extends({}, currentState, persistedState);
        }
      }, baseOptions);

      var _hasHydrated = false;
      var hydrationListeners = new Set();
      var finishHydrationListeners = new Set();
      var storage;

      try {
        storage = options.getStorage();
      } catch (e) {}

      if (!storage) {
        return config(function () {
          console.warn("[zustand persist middleware] Unable to update item '" + options.name + "', the given storage is currently unavailable.");
          set.apply(void 0, arguments);
        }, get, api);
      }

      var thenableSerialize = toThenable(options.serialize);

      var setItem = function setItem() {
        var state = options.partialize(_extends({}, get()));
        var errorInSync;
        var thenable = thenableSerialize({
          state: state,
          version: options.version
        }).then(function (serializedValue) {
          return storage.setItem(options.name, serializedValue);
        }).catch(function (e) {
          errorInSync = e;
        });

        if (errorInSync) {
          throw errorInSync;
        }

        return thenable;
      };

      var savedSetState = api.setState;

      api.setState = function (state, replace) {
        savedSetState(state, replace);
        void setItem();
      };

      var configResult = config(function () {
        set.apply(void 0, arguments);
        void setItem();
      }, get, api);
      var stateFromStorage;

      var hydrate = function hydrate() {
        if (!storage) return;
        _hasHydrated = false;
        hydrationListeners.forEach(function (cb) {
          return cb(get());
        });
        var postRehydrationCallback = (options.onRehydrateStorage == null ? void 0 : options.onRehydrateStorage(get())) || undefined;
        return toThenable(storage.getItem.bind(storage))(options.name).then(function (storageValue) {
          if (storageValue) {
            return options.deserialize(storageValue);
          }
        }).then(function (deserializedStorageValue) {
          if (deserializedStorageValue) {
            if (typeof deserializedStorageValue.version === 'number' && deserializedStorageValue.version !== options.version) {
              if (options.migrate) {
                return options.migrate(deserializedStorageValue.state, deserializedStorageValue.version);
              }

              console.error("State loaded from storage couldn't be migrated since no migrate function was provided");
            } else {
              return deserializedStorageValue.state;
            }
          }
        }).then(function (migratedState) {
          var _get;

          stateFromStorage = options.merge(migratedState, (_get = get()) != null ? _get : configResult);
          set(stateFromStorage, true);
          return setItem();
        }).then(function () {
          postRehydrationCallback == null ? void 0 : postRehydrationCallback(stateFromStorage, undefined);
          _hasHydrated = true;
          finishHydrationListeners.forEach(function (cb) {
            return cb(stateFromStorage);
          });
        }).catch(function (e) {
          postRehydrationCallback == null ? void 0 : postRehydrationCallback(undefined, e);
        });
      };

      api.persist = {
        setOptions: function setOptions(newOptions) {
          options = _extends({}, options, newOptions);

          if (newOptions.getStorage) {
            storage = newOptions.getStorage();
          }
        },
        clearStorage: function clearStorage() {
          var _storage;

          (_storage = storage) == null ? void 0 : _storage.removeItem(options.name);
        },
        getOptions: function getOptions() {
          return options;
        },
        rehydrate: function rehydrate() {
          return hydrate();
        },
        hasHydrated: function hasHydrated() {
          return _hasHydrated;
        },
        onHydrate: function onHydrate(cb) {
          hydrationListeners.add(cb);
          return function () {
            hydrationListeners.delete(cb);
          };
        },
        onFinishHydration: function onFinishHydration(cb) {
          finishHydrationListeners.add(cb);
          return function () {
            finishHydrationListeners.delete(cb);
          };
        }
      };
      hydrate();
      return stateFromStorage || configResult;
    };
  };

  var persist = persistImpl;

  exports.combine = combine;
  exports.devtools = devtools;
  exports.persist = persist;
  exports.redux = redux;
  exports.subscribeWithSelector = subscribeWithSelector;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
