define ["jquery", "knockout", "flowplayer"], ($, ko) ->
  ko.bindingHandlers.flowplayer =
    init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
      currentPlayer = null
      callback = ->
        isFirstEvaluation = ko.computedContext.isInitial()
        value = ko.utils.unwrapObservable(valueAccessor())

        $(element).flowplayer value, (e, api, clip) ->
          currentPlayer = api

      ko.computed(callback, null, { disposeWhenNodeIsRemoved: element })

      ko.utils.domNodeDisposal.addDisposeCallback element, ->
        if currentPlayer
          currentPlayer.unload()