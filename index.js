'use strict';

var znFirebase = require('../../../lib/zn-firebase');
var Q = require('q');

/**
 * Expand a generic Firebase path and return a reference to it.
 *
 * @param {string} path
 *
 * @returns {Firebase} A Firebase reference.
 */
module.exports.expandPath = function (path) {
	var ref = znFirebase();

	if (Array.isArray(path) && path.length) {
		ref = ref.child(path.join('/'));
	} else if (path) {
		ref = ref.child(path);
	}

	return ref;
};

/**
 * Helper to load data from Firebase.
 *
 * @param {Array<string>|string} path A string or an array of path components that will be concatenated with '/' as the separator.
 * 	Ex: ['foo', 'bar', 'baz'] will become 'foo/bar/baz'
 *
 * @return {Promise<Object>}
 *
 * @see expandPath
 */
module.exports.load = function (path) {
	var def = Q.defer();

	module.exports.expandPath(path).once('value', function (snapshot) {
		def.resolve(snapshot.val());
	}, function (err) {
		def.reject(err);
	});

	return def.promise;
};

/**
 * Helper to save arbitrary data to Firebase.
 *
 * @param {Array<string>} path An array of path components that will be concatenated with '/' as the separator.
 * 	Ex: ['foo', 'bar', 'baz'] will become 'foo/bar/baz'
 * @param {Object} data
 *
 * @return {Promise}
 *
 * @see expandPath
 */
module.exports.save = function (path, data) {
	var def = Q.defer();

	module.exports.expandPath(path).update(data, function (err) {
		if (err) {
			def.reject(err);
		} else {
			def.resolve();
		}
	});

	return def.promise;
};

/**
 * Helper to save arbitrary data to Firebase.
 *
 * @param {Array<string>} path An array of path components that will be concatenated with '/' as the separator.
 * 	Ex: ['foo', 'bar', 'baz'] will become 'foo/bar/baz'
 * @param {function(string|number|boolean|null): string|number|boolean|undefined} updateFunction A developer-supplied function which will be passed the current data stored at this location (as a JavaScript object). The function should return the new value it would like written (as a JavaScript object). If undefined is returned (i.e. you return with no arguments) the transaction will be aborted and the data at this location will not be modified.
 * @param {boolean} applyLocally By default, events are raised each time the transaction update function runs. So if it is run multiple times, you may see intermediate states. You can set this to false to suppress these intermediate states and instead wait until the transaction has completed before events are raised.
 *
 * @return {Promise<string|number|boolean>} Value from the onComplete Function
 *
 * @see expandFirebasePath
 */
module.exports.transaction = function (path, updateFunction, applyLocally) {
	var def = Q.defer();
	var ref = module.exports.expandFirebasePath(path);

	ref.transaction(updateFunction, function (err, committed, snapshot) {
		if (err || !committed) {
			def.reject(err || 'update function return undefined; value not saved');
		} else {
			def.resolve(snapshot.val());
		}
	}, applyLocally);

	return def.promise;
};
