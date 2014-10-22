// This is https://github.com/knockout/knockout/pull/1448 and is required to allow
// backbone collections to be used in the foreach binding.
(function(global, undefined) {
  'use strict';

  function remapArrayHelpers(ko) {
    var remap = function(originalFunctionName, constructorFunction) {
      var originalFunction = ko.utils[originalFunctionName];

      ko.utils[originalFunctionName] = constructorFunction(originalFunction);
    };

    remap('arrayForEach', function(originalFunction) {
      return function(array, action, owner) {
        if (array && typeof array.forEach == 'function') {
          return array.forEach(action, owner);
        }
        return originalFunction(array, action, owner); // owner is not defined on the original function
      };
    });

    remap('arrayIndexOf', function(originalFunction) {
      return function(array, item) {
        if (array && typeof array.indexOf == 'function') {
          return array.indexOf(item); // We are missing fromIndex
        }
        return originalFunction(array, item);
      };
    });

    remap('arrayFirst', function(originalFunction) {
      return function(array, predicate, owner) {
        if (array && typeof array.find == 'function') {
          return array.find(predicate, owner);
        }
        return originalFunction(array, predicate, owner);
      };
    });

    remap('arrayMap', function(originalFunction) {
      return function(array, mapping, owner) {
        if (array && typeof array.map == 'function') {
          return array.map(mapping, owner);
        }
        return originalFunction(array, mapping, owner); // owner is not defined on the original function
      };
    });

    remap('arrayFilter', function(originalFunction) {
      return function(array, mapping, owner) {
        if (array && typeof array.filter == 'function') {
          return array.filter(mapping, owner);
        }
        return originalFunction(array, mapping, owner); // owner is not defined on the original function
      };
    });

    remap('arrayGetDistinctValues', function(originalFunction) {
      return function(array) {
        if (array && typeof array.reduce == 'function') {
          return array.reduce(function(uniques, item) {
            if (ko.utils.arrayIndexOf(uniques, item) < 0) {
              uniques.push(item);
            }
            return uniques;
          }, []);
        }
        return originalFunction(array); // owner is not defined on the original function
      };
    });
  }

  function attachToKo(ko) {
    remapArrayHelpers(ko);
  }

  // Determines which module loading scenario we're in, grabs dependencies, and attaches to KO
  function prepareExports() {
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
      // Node.js case - load KO synchronously
      var ko = require('knockout');
      attachToKo(ko);
      module.exports = ko;
    } else if (typeof define === 'function' && define.amd) {
      define(['knockout'], attachToKo);
    } else if ('ko' in global) {
      // Non-module case - attach to the global instance
      attachToKo(global.ko);
    }
  }

  prepareExports();

})(this);
