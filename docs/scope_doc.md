# Scope Objects

Scope is the glue between the view (our HTML) and the controller (our JavaScript code)

Scopes are used for four things in AngularJS
1. Sharing data between a controller/directive and its view template
2. Sharing data between different parts of the UI
3. Broadcasting and listening for events.
4. Watching for changes in data.

## Scope Constructor
### Description
Scope is implemented as a plain, old JavaScript object. It has two special function: $watch and $digest

### Private Variables
- $$watchers: an array that holds all the watches created by the user
- $$lastDirtyWatch: a reference to the last watch object that was dirty (change was detected & listener runs)


## Scope.prototype.$watch
### Description
Adds a watch to our scope, who's primary purpose to notify when any changes occur on the scope

### Syntax
scope.$watch(watchFn(scope), listenerFn, valueEq)

### Parameters
watchFn(scope): the piece of data we're watching. 
- Scope is sent as the first argument for accessibility's sake.
- You can set up a watch without a listener, if you want to know when a scope is digested and don't need a listener
- You should be able to remove a watch.
- You should be able to remove a watch, even during $digest.
- A watch should be able to destroy another watch during $digest.
- A watch should be able to destroy several watches during $digest.

listenerFn(newValue, oldValue, scope): the function that will be called if anything changes in watchFn
- newValue will capture the current value of watchFn while oldValue keeps track of the last state of watchFn. If newValue does not equal oldValue, that means we have a change and listenerFn must be run.
- If the first watch value is undefined, the listenerFn should be called by $digest
- On initialization, the first watch's old value defaults to newValue, else it's set to oldValue

valueEq
- boolean value. If true, $digest compares newValue and oldValue using lodash's _.isEqual() method. Else it makes the comparison using '==='
- if the watch property has a value of NaN, it should not detect any changes.


## Scope.prototype.$digest
Description
$digest iterates over all watchers attached to a scope. If it detects any changes in the watchFn, it will run the corresponding listener function.

- It will always call the listenerFn on first $digest.
- $digest will continually run until there are no changes detected from the watches
- $digest will run a maximum of 10 times when watches are unstable and $digest cannot reach a stable state of no changes
- $digest will only run until it reaches the last detected dirty watch. If there are watches after the last detected dirty watch, the loop is escaped
- if a new watch is added to scope via a listenerFn, $digest should still run the newly added watch.

## Exceptions
- Any thrown exception from a watch or a listener will just log an error to console.

## Final Test Cases
- it can be constructed and used as an object
- it calls the listener function of a watch on first $digest
- it calls the watch function with the scope as the argument
- it calls the listener function when the watched value changes
- it calls listener when watch value is first undefined
- it calls listener with new value as old value the first time
- it may have watchers that omit the listener function
- it triggers chained watchers in the same digest
- it gives up on the watches after 10 iterations
- it ends the digest when the last watch is clean
- it does not end digest so that new watches are not run
- it compares based on value if enabled
- it it correctly handles NaNs
- it catches exceptions in watch functions and continues
- it catches exceptions in listener functions and continues
- it allows destroying a $watch with a removal function
- it allows destroying a $watch during digest
- it allows a $watch to destroy another during digest
- it allows destroying several $watches during digest


