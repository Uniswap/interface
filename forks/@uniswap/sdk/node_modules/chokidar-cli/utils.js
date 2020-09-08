var childProcess = require('child_process');
var _ = require('lodash');
var Promise = require('bluebird');

// Try to resolve path to shell.
// We assume that Windows provides COMSPEC env variable
// and other platforms provide SHELL env variable
var SHELL_PATH = process.env.SHELL || process.env.COMSPEC;
var EXECUTE_OPTION = process.env.COMSPEC !== undefined && process.env.SHELL === undefined ? '/c' : '-c';

// XXX: Wrapping tos to a promise is a bit wrong abstraction. Maybe RX suits
// better?
function run(cmd, opts) {
    if (!SHELL_PATH) {
        // If we cannot resolve shell, better to just crash
        throw new Error('$SHELL environment variable is not set.');
    }

    opts = _.merge({
        pipe: true,
        cwd: undefined,
        callback: function(child) {
            // Since we return promise, we need to provide
            // this callback if one wants to access the child
            // process reference
            // Called immediately after successful child process
            // spawn
        }
    }, opts);

    return new Promise(function(resolve, reject) {
        var child;

        try {
            child = childProcess.spawn(SHELL_PATH, [EXECUTE_OPTION, cmd], {
                cwd: opts.cwd,
                stdio: opts.pipe ? 'inherit' : null
            });
        } catch (e) {
            return Promise.reject(e);
        }

        opts.callback(child);

        function errorHandler(err) {
            child.removeListener('close', closeHandler);
            reject(err);
        }

        function closeHandler(exitCode) {
            child.removeListener('error', errorHandler);
            resolve(exitCode);
        }

        child.once('error', errorHandler);
        child.once('close', closeHandler);
    });
}

module.exports = {
    run: run
};
