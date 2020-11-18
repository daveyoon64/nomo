'use strict'

var _ = require('lodash');

function Scope() {
  this.$$watchers = [];
};

function initListenerFn() {};

Scope.prototype.$watch = function(watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function() {},
    last: initListenerFn
  }
  this.$$watchers.push(watcher);
}

Scope.prototype.$$digestOnce = function() {
  // digest has to keep on running until no changes are detected
  var self = this;
  var newValue, oldValue, dirty;
  _.forEach(this.$$watchers, function(watcher) {
    newValue = watcher.watchFn(self);
    oldValue = watcher.last;
    if (newValue !== oldValue) {
      watcher.last = newValue;
      watcher.listenerFn(newValue, (oldValue === initListenerFn ? newValue : oldValue), self);
      dirty = true;
    }
  });
  return dirty;
}

Scope.prototype.$digest = function() {
  // digest has to keep on running until no changes are detected
  var dirty;
  do {
    dirty = this.$$digestOnce();
  } while(dirty)
}

module.exports = Scope;