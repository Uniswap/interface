'use strict';

const isArray = require('lodash/isArray');
const isPlainObject = require('lodash/isPlainObject');
const isObject = require('lodash/isObject');
const extend = require('lodash/extend');
const keys = require('lodash/keys');
const reduce = require('lodash/reduce');
const pick = require('lodash/pick');
const toArray = require('lodash/toArray');
const toPlainObject = require('lodash/toPlainObject');
const utils = require('./utils');

/**
 * @summary Constructor for a Jayson Method
 * @class Method
 * @param {Function} [handler] Function to set as handler
 * @param {Object} [options] 
 * @param {Function} [options.handler] Same as separate handler
 * @param {Boolean} [options.useContext=false] When true, the handler expects a context object
 * @param {Array|Object} [options.params] Defines params that the handler accepts
 */
const Method = function(handler, options) {

  if(!(this instanceof Method)) {
    return new Method(handler, options);
  }

  // only got passed options
  if(isPlainObject(handler)) {
    options = handler;
    handler = null;
  }

  const defaults = {
    useContext: false,
  };

  options = options || {};

  this.options = utils.merge(defaults, options);
  this.handler = handler || options.handler;
};

module.exports = Method;

/**
 * @summary Returns the handler function associated with this method
 * @return {Function}
 */
Method.prototype.getHandler = function() {
  return this.handler;
};

/**
 * @summary Sets the handler function associated with this method
 * @param {Function} handler
 */
Method.prototype.setHandler = function(handler) {
  this.handler = handler;
};

/**
 * @summary Prepare parameters for the method handler
 * @private
 */
Method.prototype._getHandlerParams = function(params) {
  const options = this.options;

  const isObjectParams = !isArray(params) && isObject(params) && params;
  const isArrayParams = isArray(params);

  switch(true) {

      // handler always gets an array
    case options.params === Array:
      return isArrayParams ? params : toArray(params);

      // handler always gets an object
    case options.params === Object:
      return isObjectParams ? params : toPlainObject(params);

      // handler gets a list of defined properties that should always be set
    case isArray(options.params): {
      const undefinedParams = reduce(options.params, function(undefinedParams, key) {
        undefinedParams[key] = undefined;
        return undefinedParams;
      }, {});
      return extend(undefinedParams, pick(params, keys(params)));
    }

      // handler gets a map of defined properties and their default values
    case isPlainObject(options.params):
      return extend({}, options.params, pick(params, keys(params)));

      // give params as is
    default:
      return params;

  }

};

/**
 * @summary Executes this method in the context of a server
 * @param {Server} server
 * @param {Array|Object} requestParams
 * @param {Object} [context]
 * @param {Function} callback
 */
Method.prototype.execute = function(server, requestParams, context, callback) {
  if(typeof(context) === 'function') {
    callback = context;
    context = {};
  }

  if(!context) {
    context = {};
  }

  // when useContext is true, the handler gets a context object every time
  const useContext = Boolean(this.options.useContext);
  const handler = this.getHandler();
  const params = this._getHandlerParams(requestParams);

  const args = useContext ? [params, context, callback] : [params, callback];
  return handler.call(server, ...args);
};
