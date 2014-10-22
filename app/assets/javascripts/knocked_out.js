/* jshint undef: true, unused: true */
/* global document, console */

(function(global, undefined) {
  'use strict';

  function attach(ko, _, Backbone) {

    var KnockedOut = {};

    KnockedOut.VERSION = '0.1.0';

    // KnockedOut.observeModel
    // -------------
    // KnockedOut observeModel will register onto a Backbone models event system
    // and notify the observable when any changes occur

    var observeModel = KnockedOut.observeModel = function(model) {
      var activeModel;

      // Only register once per observable
      if (model._watchingModelEvents) {
        return null;
      }

      model.isLoading = ko.observable(false);

      var eventHandler = function(event, args) {
        switch(event) {
          case 'request': // The model has begun a fetch request
            model.isLoading(true);
            break;
          case 'sync': // When a model is successfully synced with the server
          case 'error': // When a model has failed to sync with the server
            model.isLoading(false);
            break;
          case 'change': // When a model is changed
          case 'destroy': // When a model is destroyed
            model.valueHasMutated();
            break;
          default:
            break;
        }
      };

      var modelChanged = function(newModel) {
        if (newModel !== activeModel) {
          if (activeModel) {
            activeModel.off('all', eventHandler);
          }
          if (newModel) {
            newModel.on('all', eventHandler);
          }
        }
        activeModel = newModel;
      };

      var subscription = model.subscribe(modelChanged),
          originalDispose = subscription.dispose;

      subscription.dispose = function() {
        originalDispose.call(this, arguments);
        modelChanged(null);
        delete model._watchingModelEvents;
        subscription.dispose = originalDispose;
      };

      model._watchingModelEvents = true;

      modelChanged(model());

      return subscription;
    };

    // KnockedOut.observeCollection
    // -------------
    // KnockedOut observeCollection will register onto a Backbone Collections
    // event system and notify the observable when any changes occur

    var observeCollection = KnockedOut.observeCollection = function(collection) {
      var activeCollection;

      // Don't listen for changes if a different ViewModel has already done it
      if (collection._watchingCollectionEvents) {
        return null;
      }

      collection.isLoading = ko.observable(false);

      var eventHandler = function(event, args) {
        //TODO: In the future we can support the diffCache array
        switch(event) {
          case 'request': // The collection has begun a fetch request
            if (args == collection()) {
              collection.isLoading(true);
            }
            break;
          case 'sync': // When a collection is successfully synced with the server
          case 'error': // When a collection has failed to sync with the server
            if (args == collection()) {
              collection.isLoading(false);
            }
            break;
          case 'add': // Model as added
          case 'remove': // Model was removed from a collection
          case 'reset': // The collections entire contents have been replaced
            collection.valueHasMutated();
            break;
          default:
            break;
        }
      };

      var collectionChanged = function(newCollection) {
        if (newCollection !== activeCollection) {
          if (activeCollection) {
            activeCollection.off('all', eventHandler);
          }
          if (newCollection) {
            newCollection.on('all', eventHandler);
          }
        }
        activeCollection = newCollection;
      };

      var subscription = collection.subscribe(collectionChanged),
          originalDispose = subscription.dispose;

      subscription.dispose = function() {
        originalDispose.call(this, arguments);
        collectionChanged(null);
        delete collection._watchingCollectionEvents;
        subscription.dispose = originalDispose;
      };

      collection._watchingCollectionEvents = true;

      collectionChanged(collection());

      return subscription;
    };

    // KnockedOut.ViewModel
    // -------------

    // KnockedOut ViewModels are used to bind to Backbone Models

    var viewModelOptions = [];

    var ViewModel = KnockedOut.ViewModel = function(options) {
      this.cid = _.uniqueId('viewmodel');
      options = options || {};
      _.extend(this, _.pick(options, viewModelOptions));

      this._subscriptions = {};

      var observables = _.defaults(_.result(this, 'observables') || {}, {model: null, collection: null});
      observables = _.defaults(_.pick(options, _.keys(observables)), observables);
      this.createObservables(observables);

      this.observeModel('model');
      this.observeCollection('collection');

      this.createAttributes(_.result(this, 'attributes'), {debounce: _.result(this, 'debounce')});
      this.createComputeds(_.result(this, 'computeds'));
      this.initialize.apply(this, arguments);
    };

    // Use Backbone's extend function
    ViewModel.extend = Backbone.Model.extend;

    _.extend(ViewModel.prototype, {
      // A list of subscriptions to release when the ViewModel is destroyed
      _subscriptions: null,

      observables: null,
      attributes: null,
      computeds: null,
      // A hash of attributes to debounce and for now long
      debounce: null,

      // Initialize is an empty function by default. Override it with your own
      // initialization logic.
      initialize: function(){},

      observeModel: function(key) {
        var subscription = observeModel(this[key]);
        if (subscription) {
          this.registerSubscription(key, subscription);
        }

        return this;
      },

      observeCollection: function(key) {
        var subscription = observeCollection(this[key]);        
        if (subscription) {
          this.registerSubscription(key, subscription);
        }

        return this;
      },

      // Creates a set of observables on the ViewModel.
      //
      // Object keys are names and values are defaults
      // i.e {hello: 'world'} creates an observable called
      //     hello with the value 'world'
      // If the value is a function it will be evaluated
      // in the context of the View Model
      createObservables: function(observables) {
        if (!observables) return this;

        for (var key in observables) {
          var value = observables[key];

          if (ko.isObservable(value)) {
            this[key] = value;
          } else {
            if (_.isFunction(value))
              value = value.call(this);

            if (ko.isObservable(value)) {
              this[key] = value;
            } else if (_.isArray(value)) {
              this[key] = ko.observableArray(value);
            } else {
              this[key] = ko.observable(value);
            }
          }
        }

        return this;
      },

      readFunctionConstructor: function(attr) {
        return function() {
          var model = this.model();

          if (model) {
            return model.get(attr);
          }
          return undefined;
        };
      },

      writeFunctionConstructor: function(attr) {
        return function(value) {
          var model = this.model();

          return model.set(attr, value);
        };
      },

      debouncedWriteFunctionConstructor: function(writeFunction, timeout) {
        var timeoutInstance;
        var self;
        var pendingValue;
        var callback = function() {
          var value = pendingValue;
          pendingValue = undefined;
          writeFunction.call(self, value);
        };

        return function (value, force) {
          self = this;
          pendingValue = value;
          clearTimeout(timeoutInstance);
          if (force)
            callback();
          else
            timeoutInstance = setTimeout(callback, timeout);
        };
      },

      // Creates a set of observables on the ViewModel.
      //
      // Object keys are names and values are defaults
      // i.e {hello: 'world'} creates an observable called
      //     hello with the value 'world'
      createAttributes: function(attributes, options) {
        if (!attributes) return this;

        var debounce = (options ? options.debounce : {}) || {};

        for (var key in attributes) {
          var attr = attributes[key];

          var writeFunction = this.writeFunctionConstructor(attr);
          var debounceOptions = debounce[key];
          if (debounceOptions !== undefined) {
            writeFunction = this.debouncedWriteFunctionConstructor(writeFunction, debounceOptions);
          }

          this.registerComputed(key, this.readFunctionConstructor(attr), writeFunction);
        }

        return this;
      },

      // Creates a set of computed observables on the ViewModel.
      //
      // Object keys are names and values are read functions
      // i.e {hello: function() { return this.hello() + 'world';}}
      //
      createComputeds: function(computeds) {
        if (!computeds) return this;

        for (var key in computeds) {
          var readFunction = computeds[key];

          this.registerComputed(key, readFunction);
        }

        return this;
      },

      // Registers a computed with the given key
      // If readFunction is an object it expects a read property to be defined.
      // Optional properties include write, owner, comparer and defer.
      registerComputed: function(key, readFunction, writeFunction) {
        var registration, comparer;

        if (!key || !readFunction) return this;
        
        if (_.isFunction(readFunction)) {
          registration = {
            read: readFunction,
            write: writeFunction,
            owner: this
          };
        } else {
          registration = _.defaults(_.pick(readFunction, 'read', 'write', 'owner'), {owner: this});
          if (readFunction.defer !== undefined) registration.deferEvaluation = true;
          comparer = readFunction.comparer;
        }

        var subscription = ko.computed(registration);

        if (comparer)
          subscription.equalityComparer = comparer;

        this.registerSubscription(key, subscription);

        this[key] = subscription;

        return this;
      },

      registerSubscription: function(key, subscription) {
        var prevSubscription = this._subscriptions[key];

        if (prevSubscription) {
          prevSubscription.dispose();
          delete this._subscriptions[key];
        }

        this._subscriptions[key] = subscription;

        return this;
      },

      dispose: function() {
        for (var key in this._subscriptions) {
          var subscription = this._subscriptions[key];
          subscription.dispose();
          delete this._subscriptions[key];
        }

      }
    });

    return KnockedOut;
  }

  // Determines which module loading scenario we're in, grabs dependencies, and attaches to KO
  function prepareExports() {
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
      // Node.js case - load KO synchronously
      var ko = require('knockout');
      var _ = require('underscore');
      var Backbone = require('backbone');
      module.exports = attach(ko, _, Backbone);
    } else if (typeof define === 'function' && define.amd) {
      define(['knockout', 'underscore', 'backbone'], attach);
    } else if ('ko' in global && '_' in global && 'Backbone' in global) {
      // Non-module case - attach to the global instance
      global.KnockedOut = attach(global.ko, global._, global.Backbone);
    }
  }

  prepareExports();

})(this);
