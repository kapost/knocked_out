define ["jquery", "knockout", "tooltip"], ($, ko) ->
  update = (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    value = ko.unwrap(valueAccessor())
    $(element).attr('title', value).tooltip('destroy').tooltip()

  ko.bindingHandlers.tooltip =
    init: update
    update: update
