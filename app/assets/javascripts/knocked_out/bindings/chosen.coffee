define [
  'jquery'
  'knockout'
  'chosen'
], ($, ko) ->

  dependentBindings = ['options', 'selectedOptions', 'value', 'attr']

  ko.bindingHandlers.chosen =
    'after': dependentBindings
    init: (element, valueAccessor, allBindings) ->
      $element = $(element)
      if (ko.utils.tagNameLower(element) != "select")
        throw new Error("chosen binding applies only to SELECT elements")

      callback = ->
        isFirstEvaluation = ko.computedContext.isInitial()
        value = ko.utils.unwrapObservable(valueAccessor())

        if (isFirstEvaluation)
          $element.chosen(value)
        else
          $element.chosen('destroy').chosen(value)

      ko.computed(callback, null, { disposeWhenNodeIsRemoved: element })

      changeCallback = ->
        isFirstEvaluation = ko.computedContext.isInitial()
        
        # Register a dependency on binding changes
        for binding in dependentBindings
          bindingValueAccessor = allBindings.get(binding)

          if bindingValueAccessor
            bindingValue = ko.utils.unwrapObservable(bindingValueAccessor)

        unless isFirstEvaluation
          $element.trigger("chosen:updated")

      ko.computed(changeCallback, null, { disposeWhenNodeIsRemoved: element })

      ko.utils.domNodeDisposal.addDisposeCallback element, ->
        $element.chosen('destroy')