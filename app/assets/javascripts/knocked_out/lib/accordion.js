/* jshint undef: true, unused: true */
/* global jQuery, document, console */

/* ========================================================================
 * Geronimo: accordian.js v1.0.0
 * 
 * A jQuery Accordion plugin that works with the Geronimo CSS.
 * 
 * Events:
 *   - show.accordion: The accordion has been added to the DOM but the animation has begun.
 *   - hide.accordion: The accordion is still apart of the DOM and the hide animation has begun.
 *   - shown.accordion: The accordions show animation has completed.
 *   - hidden.accordion: The accordions hide animation has completed and has been removed from the DOM.
 * Example:
 *     $("<select></select>").accordion()
 * ========================================================================
 * Copyright 2011-2014 Kapost.
 * Licensed under MIT (https://github.com/kapost/knocked_out/blob/master/LICENSE)
 * ======================================================================== */


+function ($, global) {
  'use strict';

  // ACCORDION CLASS DEFINITION
  // ======================

  var Accordion = function (element, options) {
    this.options        = options;
    this.$body          = $(document.body);
    this.$select        = $(element);
    this.isShown        = null;
    this.$item          = this.$select.closest('.filter-item');
    this.$button        = $('<div class="filter-button"><div class="button-text"></div><div class="ico-arrow-down"></div></div>');
    this.$list          = $('<ul class="filter-options"></ul>');

    this.$select.on('change.accordion', $.proxy(function (e) {
      this.resyncOptions();
    }, this));

    this.$select.on('accordion:updated.accordion', $.proxy(function (e) {
      this.update();
    }, this));

    // Hide the accordion if you click in on the background
    this.$button.on('click.accordion', $.proxy(function (e) {
      this.$item.toggleClass('current');
    }, this));

    this.$list.on('li click.accordion', $.proxy(function (e) {
    }, this));

    this.$select.hide();

    this.update();

    this.$select.after(this.$list);
    if (!options.omitButton)
      this.$select.after(this.$button);
  };

  Accordion.VERSION  = '1.0.0';

  Accordion.DEFAULTS = {
    invertActive: false,
    omitButton: false
  };

  Accordion.prototype = {
    update: function () {
      this.updateName();
      this.$list.empty();
      this.createOptions();

      return this;
    },
    updateName: function () {
      var name = this.$select.data('placeholder');
      this.$button.find('.button-text').text(name).prop('title', name);

      return this;
    },
    createOptions: function() {
      var self = this;
      var options = [];
      var invert = this.options.invertActive;
      this.buttonMap = [];
      
      this.$select.find('option').each(function(i) {
        var $option = $(this),
            $button = $('<li></li>').addClass('option-button'),
            $buttonText = $('<div></div>').addClass('button-text').text($option.text()),
            $buttonClose = $('<div></div>').addClass('ico-close');
        $button.append($buttonText).append($buttonClose);

        $button.on('click.accordion', $.proxy(function(e) {
          $button.toggleClass('active');
          $option.prop('selected', (!invert && $button.hasClass('active')) || (invert && !$button.hasClass('active')));
          this.$select.change();
        }, self));

        if (i !== 0 || $option.val()){
          options.push($button);
          self.buttonMap.push({$option: $option, $button: $button});
        }
      });

      this.$list.append(options);

      this.resyncOptions();
    },
    resyncOptions: function() {
      if (!this.buttonMap) return;
      var invert = this.options.invertActive;

      for (var i = 0, l = this.buttonMap.length; i < l; ++i) {
        var map = this.buttonMap[i];

        if ((!invert && map.$option.prop('selected')) || (invert && !map.$option.prop('selected'))) {
          map.$button.addClass('active');
        } else {
          map.$button.removeClass('active');
        }
      }
    },
    destroy: function() {
      this.$select.off('.accordion').show().removeData('geronimo.accordion');
      this.$button.detach();
      this.$list.detach();
    }
  };

  // ACCORDION PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('geronimo.accordion');
      var options = $.extend({}, Accordion.DEFAULTS, typeof option == 'object' && option);

      if (!data) $this.data('geronimo.accordion', (data = new Accordion(this, options)));
      if (typeof option == 'string') data[option](_relatedTarget);
    });
  }

  var old = $.fn.accordion;

  $.fn.accordion             = Plugin;
  $.fn.accordion.Constructor = Accordion;

  // ACCORDION NO CONFLICT
  // =================

  $.fn.accordion.noConflict = function () {
    $.fn.accordion = old;
    return this;
  };

}(jQuery, this);
