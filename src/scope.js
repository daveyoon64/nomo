'use strict'

var _ = require('lodash');

function Scope() {
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
}
// used to initialize scope.last in case the first watcher
// is actually undefined. This works because is only ever 
// equal to itself.
function initLastProp() {};

Scope.prototype.$watch = function(watchFn, listenerFn, eqValue) {
  var self = this;
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function() {}, 
    last: initLastProp,
    eqValue: !!eqValue
  };
  this.$$lastDirtyWatch = null;
  this.$$watchers.unshift(watcher);
  return function() {
    var watcherIndex = self.$$watchers.indexOf(watcher);
    if (watcherIndex >= 0) {
      self.$$watchers.splice(watcherIndex, 1);
      self.$$lastDirtyWatch = null;
    }
  }
};

Scope.prototype.$$digestOnce = function() {
  var self = this;
  var newValue, oldValue, dirty;
  _.forEachRight(this.$$watchers, function(watcher) {
    try {
      if (watcher) {
        newValue = watcher.watchFn(self);
        oldValue = watcher.last;
        if (!self.$$isEqual(newValue, oldValue, watcher.eqValue)) {
          self.$$lastDirtyWatch = watcher;
          watcher.last = (watcher.eqValue ? _.cloneDeep(newValue) : newValue);
          watcher.listenerFn(newValue, (oldValue === initLastProp ? newValue : oldValue), self);
          dirty = true;
        } else if (watcher === self.$$lastDirtyWatch) {
          return false;
        }
      }
    } catch(e) {
      console.log(e);
    }
  });
  return dirty;
};

Scope.prototype.$digest = function() {
  var dirty;
  var ttl = 10;
  this.$$lastDirtyWatch = null;
  do {
    dirty = this.$$digestOnce();
    if(dirty && !(ttl--)) {
      throw '10 $digest iterations reached';
    }
  } while(dirty)
};

Scope.prototype.$$isEqual = function(newValue, oldValue, eqValue) {
  if (eqValue) {
    return _.isEqual(newValue, oldValue);
  } else {
    return newValue === oldValue || (
      typeof newValue === 'number' &&
      typeof oldValue === 'number' && 
      isNaN(newValue) && 
      isNaN(oldValue)
    );
  }
}
module.exports = Scope;