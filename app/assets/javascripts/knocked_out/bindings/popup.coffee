define [
  'jquery'
  'knockout'
], ($, ko) ->
  ko.bindingHandlers.popup =
    init: (element, valueAccessor, allBindings) ->
      if (ko.utils.tagNameLower(element) != "a")
        throw new Error("popup binding applies only to A elements")

      windowOptions = null

      callback = ->
        # We need to keep the click handlers options in place
        windowOptionsHash = ko.utils.unwrapObservable(valueAccessor()) || {}

        windowOptionsArray = []

        ko.utils.objectForEach windowOptionsHash, (key, value) ->
          windowOptionsArray.push("#{encodeURIComponent(key)}=#{encodeURIComponent(value)}")

        windowOptions = windowOptionsArray.join(',')

      ko.computed(callback, null, { disposeWhenNodeIsRemoved: element })

      ko.utils.registerEventHandler element, 'click', (event) ->
        window.open(element.href, element.target, windowOptions)

        false