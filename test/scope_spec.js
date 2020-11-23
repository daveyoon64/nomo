'use strict';

var Scope = require('../src/scope');
var _ = require('lodash');

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

    it ('gives up on the watches after 10 iterations', function() {
      // $digest can be put into an unstable state when watchers always change
      // in this case the watchers constantly update a counter and digest never
      // stops detecting a change. We want to set the max repetitions to 10
      scope.counterA = 0;
      scope.counterB = 0;
  
      scope.$watch(
        function(scope) { return scope.counterA; }, 
        function(newValue, oldValue, scope) {
          scope.counterB++;
        }
      );
  
      scope.$watch(
        function(scope) { return scope.counterB; }, 
        function(newValue, oldValue, scope) {
          scope.counterA++;
        }
      );
      expect((function() { scope.$digest(); })).toThrow();
    });

    it ('ends the digest when the last watch is clean', function() {
      // because running all watchers with $digest can be very expensive
      // we need to prevent it from running more time than it has to.
      // this can be accomplished by storing the last dirty watcher in 
      // scope.
      scope.array = _.range(100);
      var watchExecutions = 0;

      _.times(100, function(i) {
        scope.$watch(
          function(scope) {
            watchExecutions++;
            return scope.array[i];
          },
          function(newValue, oldValue, scope) {}
        );
      });

      scope.$digest();
      expect(watchExecutions).toBe(200);

      scope.array[0] = 420;
      scope.$digest();
      expect(watchExecutions).toBe(301);
    });

    it ('does not end digest so that new watches are not run', function() {
      // edge case: when the listener function registers a new watcher, the new
      // watcher never runs because the $$lastDirtyWatch 
      scope.aValue = 'abc';
      scope.counter = 0;
  
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.$watch(
            function(scope) { return scope.aValue; },
            function(newValue, oldValue, scope) {
              scope.counter++;
            }
          );
        }
      );
      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it ('compares based on value if enabled', function() {
      // check the contents of an array or object, sent as a third arg when setting
      // up a watcher
      scope.aValue = [1, 2, 3];
      scope.counter = 0;
  
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        },
        true
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.aValue.push(4);
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('it correctly handles NaNs', function() {
      // NaN is never equal to itself, so you have to catch this
      scope.number = 0/0;
      scope.counter = 0;
  
      scope.$watch(
        function(scope) { return scope.number; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
  
      scope.$digest();
      expect(scope.counter).toBe(1);
  
      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('catches exceptions in watch functions and continues', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { throw 'Error'; },
        function(newValue, oldValue, scope) { }
      );
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('catches exceptions in listener functions and continues', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { 
          throw 'Error';
        }
      );
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('allows destroying a $watch with a removal function', function() {
      // calling $watch returns a function, when invoked, destroys the watcher
      // that's pretty freakin' slick
      scope.aValue = 'abc';
      scope.counter = 0;

      var destroyWatch = scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.aValue = 'def';
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.aValue = 'ghi';
      destroyWatch();
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('allows destroying a $watch during digest', function() {
      scope.aValue = 'abc';

      var watchCalls = [];

      scope.$watch(
        function(scope) {
          watchCalls.push('first');
          return scope.aValue;
        }
      );

      var destroyWatch = scope.$watch(
        function(scope) {
          watchCalls.push('second');
          destroyWatch();
        }
      );

      scope.$watch(
        function(scope) {
          watchCalls.push('third');
          return scope.aValue;
        }
      );

      scope.$digest();
      expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third']);
    });

    it('allows a $watch to destroy another during digest', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          destroyWatch();
        }
      );

      var destroyWatch = scope.$watch(
        function(scope) { },
        function(newValue, oldValue, scope) {}
      );

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });
  });
});