'use strict'

var Scope = require('../src/scope');
var _ = require('lodash');

describe('Scope', function() {
  it('can be constructed and used as an object', function() {
    var test = new Scope();
    test.testVar = 'haggar';

    expect(test.testVar).toBe('haggar');
  });

  describe('digest', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('should call listener function on a watch\'s first $digest', function() {
      var watchFn = function() { return 'watta'; };
      var listenerFn = jasmine.createSpy();

      scope.$watch(watchFn, listenerFn);
      scope.$digest();

      expect(listenerFn).toHaveBeenCalled();
    });

    it('should send scope as the watcher\'s first argument', function() {
      // it calls the watch function with the scope as the argument
      var watchFn = jasmine.createSpy();
      var listenerFn = function() {};

      scope.$watch(watchFn, listenerFn);
      scope.$digest();

      expect(watchFn).toHaveBeenCalledWith(scope);
    });

    it('should call the listener function when the watched value changes', function() {
      // REDO
      scope.test = 'pokey';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.test; },
        function() { scope.counter++; }
      )

      expect(scope.counter).toBe(0);
      scope.$digest();
      expect(scope.counter).toBe(1);
      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.test = 'lafarge';
      expect(scope.counter).toBe(1);
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('should call listener, even if the first value is undefined', function() {
      var listenerFn = jasmine.createSpy();
      scope.$watch(
        function(scope) { return scope.nonExistant; },
        listenerFn
      );
      scope.$digest();
      expect(listenerFn).toHaveBeenCalled();
    });

    it('calls listener with new value as old value the first time', function() {
      // REDO
      scope.test = 'trampled';
      var testReturn;

      var watchFn = function(scope) { return scope.test; };
      var listenerFn = function(newValue, oldValue, scope) {
        testReturn = oldValue;
      }
      scope.$watch(watchFn, listenerFn);
      scope.$digest();
      expect(testReturn).toBe(scope.test);
    });

    it('may have watchers without a listener function', function() {
      // used to keep track of $digest with no side effects
      var watchFn = jasmine.createSpy();

      scope.$watch(watchFn);
      scope.$digest();
      expect(watchFn).toHaveBeenCalled();
    });

    it('triggers chained watchers in the same digest', function() {
      // REDO
      // the $digest should continually run until there no dirty watchers
      scope.name = 'Raleigh';

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
      expect(scope.initial).toBe('R.');
      scope.name = 'kentucky';
      scope.$digest();
      expect(scope.initial).toBe('K.');
    });

    it('should stop trying to update watchers after 10 times', function() {
      // REDO
      // we have to catch the case where watchers constantly update each other
      // which keeps $digest stuck in a dirty state
      scope.counterA = 0;
      scope.counterB = 0;

      scope.$watch(
        function(scope) { return scope.testValue; },
        function(newValue, oldValue, scope) {
          scope.counterB++;
        }
      );

      scope.$watch(
        function(scope) { return scope.testValue; },
        function(newValue, oldValue, scope) {
          scope.counterA++;
        }
      );

      expect((function(scope) { scope.$digest(); })).toThrow();
    });

    it('should end the digest when the last watcher is clean', function() {
      // REDO
      // because running all watchers with $digest is expensive, we need
      // to prevent it from running more time than it has to. this can
      // be accomplished by storing the last dirty watcher in scope.

      // Debugger: why does line 45 need to exist for this to pass?
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

      scope.array[0] = 1776;
      scope.$digest();
      expect(watchExecutions).toBe(301);
    });

    it('does not end $digest, so that new watchers are not run', function() {
      // REDO
      // edge case: when the listener registers a new watcher, this can 
      // stop $digest from picking up the new watcher
      scope.testValue = 'funk';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.testValue; },
        function(newValue, oldValue, scope) {
          scope.$watch(
            function(scope) { return scope.testValue; },
            function(newValue, oldValue, scope) {
              scope.counter++;
            }
          );
        }
      );
      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('compares based on value if enabled', function() {
      // REDO
      // if the value we're watching is an object or array, we want
      // to see if its contents were updated. '===' only tests 
      // reference, which won't pass this test case
      scope.array = ['iron'];
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.array; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        },
        true
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
      scope.array.push('man');
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('correctly handles NaNs', function() {
      // REDO
      // NaN can never equal itself, therefore, it'll will always be
      // dirty when running $digest. We need to handle this.
      // Why would I have to check if the value is number?
      // check isNaN makes sense... hmmm
      scope.test = 0/0;
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.test; },
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
      // REDO
      // it's a simple try-catch block. if it catches, just send the error to console
      scope.testValue = 'san diego';
      scope.counter = 0;

      scope.$watch(
        function(scope) { throw Error; },
        function(newValue, oldValue, scope) {}
      );

      scope.$watch(
        function(scope) { return scope.value; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      )

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('catches exceptions in listener functions and continues', function() {
      // REDO
      scope.testValue = 'carmen';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.testValue; },
        function(newValue, oldValue, scope) { throw Error; }
      );

      scope.$watch(
        function(scope) { return scope.testValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      )

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('allows destroying a $watch with a removal function', function() {
      // REDO
      // $watch now returns a function to destroy watcher that was created
      scope.testValue = 'tofu';
      scope.counter = 0;

      var destroyWatch = scope.$watch(
        function(scope) { return scope.testValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.testValue = 'tempeh';
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.testValue = 'multigrain';
      destroyWatch();
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('allows destroying a $watch during digest', function() {
      // REDO 
      // edge case 
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

    it('allows destroying several $watches during digest', function() {
      // doesn't cause a fail, but it will throw an exception, which 
      // we should catch
      scope.aValue = 'abc';
      scope.counter = 0;

      var destroyWatch1 = scope.$watch(
        function(scope) {
          destroyWatch1();
          destroyWatch2();
        }
      );

      var destroyWatch2 = scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(0);
    });
  });

  describe('eval', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('executes $evaled function and returns result', function() {
      scope.aValue = 42;

      var result = scope.$eval(function(scope) {
        return scope.aValue;
      });

      expect(result).toBe(42);
    });

    it('passes the second $eval argument straight through', function() {
      scope.aValue = 42;

      var result = scope.$eval(function(scope, arg) {
        return scope.aValue + arg;
      }, 2);

      expect(result).toBe(44);
    });
  });

  describe('$apply', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('executes the given function and starts the digest', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$apply(function(scope) {
        scope.aValue = 'RICHTER!';
      });
      expect(scope.counter).toBe(2);
    })
  });

  describe('$evalAsync', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('executes given function later in the same cycle', function() {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluated = false;
      scope.asyncEvaluatedImmediately = false;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.$evalAsync(function(scope) {
            scope.asyncEvaluated = true;
          });
          scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
        }
      );

      scope.$digest();
      expect(scope.asyncEvaluated).toBe(true);
      expect(scope.asyncEvaluatedImmediately).toBe(false);
    });
  });
});