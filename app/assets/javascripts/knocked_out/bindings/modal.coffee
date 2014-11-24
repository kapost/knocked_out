define ["jquery", "knockout", "../lib/modal"], ($, ko) ->
  update = (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    shouldShow = ko.unwrap(valueAccessor())
    $(element).modal(if shouldShow then 'show' else 'hide')

  ko.bindingHandlers.modal =
    init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
      options = {
        show: false
        type: allBindings.get('modalType')
      }

      $(element).modal(options).on 'hidden.modal', ->
        isOpen = valueAccessor()
        if (ko.isWriteableObservable(isOpen))
          isOpen(false)

      ko.bindingHandlers['if'].init.apply(this, arguments)

    update: update

  ko.bindingHandlers.modalWith =
    init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
      $(element).modal({show: false}).on 'hidden.modal', ->
        data = valueAccessor()
        if (ko.isWriteableObservable(data))
          data(null)

      ko.bindingHandlers['with'].init.apply(this, arguments)

    update: update
