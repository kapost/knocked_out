define(["underscore", "knockout", "query-string"], function(_, ko, QueryString) {

  var escapeRegExp = function(string) {
    return string.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  };

  function KnockedOutRoute(name, router, config) {
    this.name = name;
    this.router = router;
    this.component = config.component;
    this.path = config.path;
  }

  _.extend(KnockedOutRoute.prototype, {
    match: function(path, queryParams) {
      //TODO: Add support for url parameters
      var params, sessionData;
      path = path.replace(this.router.matchBase, '');
      if (path === this.path) {
        if (queryParams) {
          params = _.defaults({}, queryParams);
        } else {
          sessionData = this.loadSessionData();
          params = _.defaults({}, sessionData);
        }
        return params;
      } else {
        return null;
      }
    },
    navigate: function(params) {
      if (params) {
        this.storeSessionData(params);
      } else {
        params = this.loadSessionData();
      }
      return _.defaults({}, params);
    },
    serialize: function(params) {
      //TODO: Add support for url parameters
      var full_url;
      full_url = this.router.base + this.path;
      if (!_.isEmpty(params)) {
        full_url += "?" + QueryString.stringify(params);
      }
      return full_url;
    },
    loadSessionData: function() {
      var cachedData;
      if (!window.localStorage) {
        return null;
      }
      cachedData = localStorage.getItem(this.storageKey());
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    },
    storeSessionData: function(params) {
      var json;
      if (!window.localStorage) {
        return null;
      }
      if (params) {
        json = JSON.stringify(params);
        return localStorage.setItem(this.storageKey(), json);
      } else {
        return localStorage.removeItem(this.storageKey());
      }
    },
    storageKey: function() {
      return "" + this.name + "|" + this.component + "|config";
    }
  });

  function KnockedOutRouter(options) {
    this.page = ko.observable();
    this.component = ko.observable({});
    this.base = options.base || '';
    this.matchBase = new RegExp("^" + (escapeRegExp(options.base)));
    this.setupRoutes();
  }

  _.extend(KnockedOutRouter.prototype, {
    start: function() {
      this.attachHistoryHandler();
      return this.performUrlMatch();
    },
    performUrlMatch: function() {
      var match, name, path, queryParams, queryString, anchorHash, route, _ref;
      path = window.location.pathname;
      queryString = window.location.search;
      anchorHash = window.location.hash;
      queryParams = queryString ? QueryString.parse(queryString) : null;
      _ref = this.routes;
      for (name in _ref) {
        route = _ref[name];
        match = route.match(path, queryParams);
        if (match) {
          return this.navigateToRoute(route, match, {
            update: false
          }, anchorHash);
        }
      }
      return false;
    },
    navigateToRoute: function(route, params, options, anchorHash) {
      options || (options = {});
      params = route.navigate(params);
      if (options.update !== false) {
        if (options.replace) {
          this.replaceHistory(route.serialize(params));
        } else {
          this.updateHistory(route.serialize(params));
        }
      }
      params = _.defaults({}, params, {
        router: this,
        anchorHash: anchorHash
      });
      if (options.navigate !== false) {
        this.component({
          name: route.component,
          params: params
        });
        return this.page(route.name);
      }
    },
    createRouteHelper: function(name, route) {
      this[name] = (function(_this) {
        return function(params, options) {
          return _this.navigateToRoute(route, params, options);
        };
      })(this);
      this["" + name + "_path"] = function(params, options) {
        return route.serialize(params);
      };
    },
    setupRoutes: function() {
      var name, route, routeConfig, _ref;
      _ref = this.routes;
      for (name in _ref) {
        routeConfig = _ref[name];
        route = new KnockedOutRoute(name, this, routeConfig);
        this.routes[name] = route;
        this.createRouteHelper(name, route);
      }
      return true;
    },
    updateHistory: function(url) {
      if (window.history) {
        return window.history.pushState(null, document.title, url);
      }
    },
    replaceHistory: function(url) {
      if (window.history) {
        return window.history.replaceState(null, document.title, url);
      }
    },
    attachHistoryHandler: function() {
      if (window.addEventListener) {
        return window.addEventListener("popstate", (function(_this) {
          return function(e) {
            return _this.performUrlMatch();
          };
        })(this));
      }
    }
  });

  return KnockedOutRouter;
});
