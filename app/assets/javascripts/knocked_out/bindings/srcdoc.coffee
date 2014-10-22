define ["jquery", "knockout"], ($, ko) ->
  hasSrcDoc = !!("srcdoc" in document.createElement("iframe"))

  ko.bindingHandlers.srcdoc =
    init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
      callback = ->
        value = ko.utils.unwrapObservable(valueAccessor()) || ''

        if 'srcdoc' of element # check if element has a property named srcdoc
          element.srcdoc = value
        else
          element.contentWindow.contents = value
          element.src = 'javascript:window["contents"]'

      ko.computed(callback, null, { disposeWhenNodeIsRemoved: element })