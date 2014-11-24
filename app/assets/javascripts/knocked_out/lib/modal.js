/* ========================================================================
 * Geronimo: modal.js v1.0.0
 * 
 * A jQuery Modal plugin that works with the Geronimo CSS.
 * 
 * Events:
 *   - show.modal: The modal has been added to the DOM but the animation has begun.
 *   - hide.modal: The modal is still apart of the DOM and the hide animation has begun.
 *   - shown.modal: The modals show animation has completed.
 *   - hidden.modal: The modals hide animation has completed and has been removed from the DOM.
 * Example:
 *     $("<div><h3>Hello world</h3></div>").modal('show')
 * ========================================================================
 * Copyright 2011-2014 Kapost.
 * Licensed under MIT (https://github.com/kapost/knocked_out/blob/master/LICENSE)
 * ======================================================================== */


+function ($, global) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function (element, options) {
    this.options        = options;
    this.$body          = $(document.body);
    this.$element       = $(element);
    this.isShown        = null;
    this.$modal         = $('<div class="modal" tabindex="-1"><div class="modal-wrapper"></div></div>');
    this.$placeholder   = $('<span style="display: none;"></span>');

    this.$modal.addClass(options.type || 'message');

    // Hide the modal if you click in on the background
    this.$modal.on('click.modal', $.proxy(function (e) {
      if (e.target == this.$modal[0]) {
        if (this.hide()) e.preventDefault();
      }
    }, this));

    this.transitionEnd = $.proxy(function () {
      var e;

      if (this.isShown) {
        e = $.Event('shown.modal', {});
      } else {
        e = $.Event('hidden.modal', {});
        this.hideModal();
      }

      this.$element.trigger(e);
    }, this);

    // Close the modal on escape and prevent key events from reaching the parent
    this.$modal.on('keyup', $.proxy(function (e) {
      if (e.which == 27) this.hide();
      // We stop propagation because we don't want any hot keys or anything outside of the modal to trigger
      e.stopPropagation();

      return false;
    }, this));
  };

  Modal.VERSION  = '1.0.0';

  Modal.DEFAULTS = {
    keyboard: true,
    show: true
  };

  Modal.prototype.toggle = function () {
    return this.isShown ? this.hide() : this.show();
  };

  Modal.prototype.show = function () {
    var e = $.Event('show.modal', {}),
        self = this;

    this.$element.trigger(e);

    if (this.isShown || e.isDefaultPrevented()) return false;

    this.isShown = true;

    this.hijackMousetrap();

    this.$element.after(this.$placeholder).addClass('modal-inner');

    this.$element.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', this.transitionEnd);

    this.$modal.find('.modal-wrapper').append(this.$element);

    this.$body.append(this.$modal);

    this.$modal.offset(); // Re-flow the page

    this.$modal.addClass('show-modal'); // Start animation

    this.enforceFocus();

    this.$modal.find('.js-close-modal').on('click', function(){
      self.$modal.trigger('click.modal');
    });

    return true;
  };

  Modal.prototype.hide = function () {
    var e = $.Event('hide.modal', {});

    this.$element.trigger(e);

    if (!this.isShown || e.isDefaultPrevented()) return false;

    this.isShown = false;

    this.hijackMousetrap();

    this.enforceFocus();

    this.$modal.removeClass('show-modal'); // Start animation

    return true;
  };

  Modal.prototype.enforceFocus = function () {
    if (this.isShown) {
      $(document).off('focusin.modal').on('focusin.modal', $.proxy(function (e) {
        if (this.$modal[0] !== e.target && !this.$modal.has(e.target).length) {
          this.$modal.trigger('focus');
        }
      }, this));

      this.$modal.trigger('focus');
    } else {
      $(document).off('focusin.modal');
    }

    return this;
  };

  Modal.prototype.hideModal = function () {
    this.$element.removeClass('modal-inner');
    this.$element.off('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', this.transitionEnd);
    this.$placeholder.after(this.$element).detach();
    this.$modal.detach();

    return this;
  };

  // This is a horrible hack. The DOM events for keyup don't seem to hit the
  // jquery event handler before the mousetrap events so we need to expliclty disable
  // mousetrap.
  Modal.prototype.hijackMousetrap = function() {
    if (!global.Mousetrap) return;

    if (this.isShown) {
      this._mousetrapStopCallback = Mousetrap.stopCallback;
      Mousetrap.stopCallback = function() {
        return true;
      };
    } else {
      if (this._mousetrapStopCallback) {
        Mousetrap.stopCallback = this._mousetrapStopCallback;

        delete this._mousetrapStopCallback;
      }
    }
  };

  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('geronimo.modal');
      var options = $.extend({}, Modal.DEFAULTS, typeof option == 'object' && option);

      if (!data) $this.data('geronimo.modal', (data = new Modal(this, options)));
      if (typeof option == 'string') data[option](_relatedTarget);
      else if (options.show) data.show(_relatedTarget);
    });
  }

  var old = $.fn.modal;

  $.fn.modal             = Plugin;
  $.fn.modal.Constructor = Modal;

  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old;
    return this;
  };

}(jQuery, this);
