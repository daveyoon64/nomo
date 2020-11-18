'use strict';

var Scope = require('../src/scope');

describe('Scope', function() {
  it('can be constructed and used as an object', function() {
    var testScope = new Scope();
    testScope.value = 'bubbles';

    expect(testScope.value).toBe('bubbles');
  });

  describe('digest', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('calls the listener function of a watch on first $digest', function() {
      var watchFn = function() { return 'whatever'; };
      var listenerFn = jasmine.createSpy();

      scope.$watch(watchFn, listenerFn);
      scope.$digest();

      expect(listenerFn).toHaveBeenCalled();
    });

    it('calls the watch function with the scope as the argument', function() {
      // we care about data on 'scope' changing, so $digest should send scope as an arg
      // for future access
      var watchFn = jasmine.createSpy();
      var listenerFn = function() {} ;
      scope.$watch(watchFn, listenerFn);

      scope.$digest();

      expect(watchFn).toHaveBeenCalledWith(scope);
    });

    it('calls the listener function when the watched value changes', function() {
      scope.testProp = 'piglet';
      scope.counter = 0;
      var watchFn = function(scope) { return scope.testProp; };
      var listenerFn = function(newValue, oldValue, scope) { scope.counter++; };
      scope.$watch(watchFn, listenerFn);

      expect(scope.counter).toBe(0);
      scope.$digest();
      expect(scope.counter).toBe(1);
      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.testProp = 'mcbeal';
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('calls listener when watch value is first undefined', function() {
      // covers case where the first change in the watched function is undefined
      // we still need the listener to run, therefore, we need to init watcher.last
      // to something unique. In this case, a function reference
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('calls listener with new value as old value the first time', function() {
      // however, we don't want to show a function reference. it's confusing.
      // instead when watcher invokes listenerFn, we'll set oldValue to the 
      // change from watcher.watchFn
      scope.testValue = 'starfighter';
      var oldValueGiven;

      scope.$watch(
        function(scope) { return scope.testValue; },
        function(newValue, oldValue, scope) { oldValueGiven = oldValue;}
      );

      scope.$digest();
      expect(oldValueGiven).toBe('starfighter');
    });

    it('may have watchers that omit the listener function', function() {
      // when you want to know when scope is digested & don't need listener
      var watchFn = jasmine.createSpy().and.returnValue('something');
      scope.$watch(watchFn);
      scope.$digest();

      expect(watchFn).toHaveBeenCalled();
    });

    it('triggers chained watchers in the same digest', function() {
      // run digest continually until there no are changes.
      // order of changes should not matter
      scope.name = "Hideo";

      scope.$watch(
        function(scope) { return scope.nameUpper; },
        function(newValue, oldValue, scope) {
          if (newValue) {
            scope.initial = newValue.substring(0,1) + '.';
          }
        }
      );
      scope.$watch(
        function(scope) { return scope.name; },
        function(newValue, oldValue, scope) {
          if (newValue) {
            scope.nameUpper = newValue.toUpperCase();
          }
        }
      );

      scope.$digest();
      expect(scope.initial).toBe('H.');

      scope.name = "Nomo";
      scope.$digest();
      expect(scope.initial).toBe('N.');
    });
  });
});