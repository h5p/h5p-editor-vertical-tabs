var H5PEditor = H5PEditor || {};

/**
 * Vertical tabs widget module for lists.
 *
 * @param {jQuery} $
 */
H5PEditor.widgets.verticalTabs = H5PEditor.VerticalTabs = (function ($) {
  /**
   * Initialize widget.
   *
   * @param {Object} parent
   * @param {Object} field
   * @param {Object} params
   * @param {function} setValue
   * @returns {_L8.C}
   */
  function C(parent, field, params, setValue) {
    var that = this;

    if (field.entity === undefined) {
      field.entity = 'item';
    }

    if (params === undefined) {
      this.params = [];
      setValue(field, this.params);
    } else {
      this.params = params;
    }

    this.field = field;
    this.parent = parent;
    this.$items = [];
    this.children = [];
    this.library = parent.library + '/' + field.name;

    this.passReadies = true;
    parent.ready(function () {
      that.passReadies = false;
    });
  };

  /**
   * Append field to wrapper.
   *
   * @param {jQuery} $wrapper
   * @returns {undefined}
   */
  C.prototype.appendTo = function ($wrapper) {
    var that = this;

    var label = '';
    if (this.field.label !== 0) {
      label = '<label class="h5peditor-label">' + (this.field.label === undefined ? this.field.name : this.field.label) + '</label>';
    }

    var html = H5PEditor.createItem(this.field.type, label + '<div class="h5p-vtab-wrapper"><div class="h5p-vtabs"><ol class="h5p-ul"></ol><input type="button" value="' + H5PEditor.t('core', 'addEntity', {':entity': this.field.entity}) + '"/></div><div class="h5p-vtab-forms"></div></div>', this.field.description);
    $(html).appendTo($wrapper);

    this.$tabs = $wrapper.find('.h5p-ul');
    this.$forms = $wrapper.find('.h5p-vtab-forms');

    this.$add = this.$tabs.next().click(function () {
      if (that.field.max !== undefined && that.params.length === that.field.max) {
        return;
      }
      var index = that.params.length;
      that.add(index);
      that.open(index);
    });

    for (var i = 0; i < this.params.length; i++) {
      this.add(i);
    }

    // Add min. fields.
    var missing = this.field.min - this.params.length;
    while (missing > 0) {
      that.$add.click();
      missing--;
    }
  };

  /**
   * Create new tab.
   *
   * @param {Number} index
   * @returns {undefined}
   */
  C.prototype.add = function (index) {
    var that = this;

    var current = (index === 0 ? ' h5p-current' : '');
    var $tab = $('<li class="h5p-vtab-li' + current + '"><a href="#" class="h5p-order"></a><a href="#" class="h5p-vtab-a"><span class="h5p-index-label">' + (index + 1) + '</span>. <span class="h5p-label">' + C.UCFirst(this.field.entity) + '</span></a></li>').appendTo(this.$tabs);
    var $form = $('<div class="h5p-vtab-form' + current + '"></div>').appendTo(this.$forms);

    if (!this.passReadies) {
      this.readies = [];
    }

    var widget = this.field.field.widget === undefined ? this.field.field.type : this.field.field.widget;
    var item = this.children[index] = new H5PEditor.widgets[widget](this, this.field.field, this.params[index], function (field, value) {
      that.params[$tab.index()] = value;
    });
    item.appendTo($form);

    if (!this.passReadies) {
      for (var j = 0; j < this.readies.length; j++) {
        this.readies[j]();
      }
      delete this.readies;
    }

    var $label = $tab.children('.h5p-vtab-a').click(function () {
      that.open($tab.index());
      return false;
    }).children('.h5p-label');

    $tab.children('.h5p-order').mousedown(function (event) {
      that.startSort($tab, event.clientX, event.clientY);
      return false;
    }).click(function () {
      return false;
    });

    $('<a href="#" class="h5p-remove"></a>').prependTo($form).click(function () {
      if (confirm(ns.t('core', 'confirmRemoval', {':type': that.field.entity}))) {
        that.removeTab($tab.index());
      }
      return false;
    });

    if (item instanceof ns.Group) {
      item.expand();
    }
    else if (this.field.field.type === 'library') {
      item.changes.push(function (library) {
        var libraryTitle;

        if (library === undefined) {
          // For older versions of cåre.
          libraryTitle = item.$select.children('option:selected').text();
        }
        else {
          libraryTitle = library.title;
        }

        $label.text(libraryTitle);
      });
    }
  };

  /**
   * Open the given tab.
   *
   * @param {Number} index
   * @returns {undefined}
   */
  C.prototype.open = function (index, skipValidation) {
    var $current = this.$tabs.children('.h5p-current');
    if (skipValidation === true || this.children[$current.index()].validate() !== false) {
      // Make sure tab is valid before opening another.
      $current.removeClass('h5p-current');
      this.$tabs.children(':eq(' + index + ')').addClass('h5p-current');
      this.$forms.children('.h5p-current').removeClass('h5p-current').end().children(':eq(' + index + ')').addClass('h5p-current');
    }
  };

  /**
   * Remove the given tab.
   *
   * @param {Number} index
   */
  C.prototype.removeTab = function (index) {
    if (this.params.length !== 1) {
      var next = index - 1;
      if (next !== -1) {
        this.open(next, true);
      }
      else {
        this.open(index + 1, true);
      }
    }
    this.$tabs.children(':eq(' + index + ')').remove();
    this.$forms.children(':eq(' + index + ')').remove();
    this.params.splice(index, 1);
    this.reindexIndexLabels();
  };

  /**
   * Start sorting the selected tab.
   *
   * @param {jQuery} $tab
   * @param {Number} x
   * @param {Number} y
   * @returns {undefined}
   */
  C.prototype.startSort = function ($tab, x, y) {
    var eventData = {
      instance: this
    };

    H5P.$body.bind('mouseup', eventData, C.endSort).bind('mouseleave', eventData, C.endSort).css({'-moz-user-select': 'none', '-webkit-user-select': 'none', 'user-select': 'none', '-ms-user-select': 'none'}).mousemove(eventData, C.sort).attr('unselectable', 'on')[0].onselectstart = H5P.$body[0].ondragstart = function () {
      return false;
    };

    var offset = $tab.offset();
    this.adjust = {
      x: x - offset.left,
      y: y - offset.top
    };
    this.$tab = $tab;
    this.formOffset = this.$tabs.offsetParent().offset();
    var width = $tab.width();
    var height = $tab.height();
    $tab.css({width: width, height: height}).addClass('h5p-moving');
    this.$placeholder = $('<li class="h5p-placeholder"><a href="#" class="h5p-vtab-a" style="box-sizing:border-box; height:' + height + 'px">&nbsp;</a></li>').insertAfter($tab);
  };

  /**
   * Run on every mousemove, trying to sort.
   *
   * @param {Object} event
   * @returns {unresolved}
   */
  C.sort = function (event) {
    var that = event.data.instance;

    // Adjust so the mouse is placed on top of the icon.
    var x = event.clientX - that.adjust.x;
    var y = event.clientY - that.adjust.y;
    that.$tab.css({
      left: x - that.formOffset.left,
      top: y - that.formOffset.top
    });

    // Try to move up.
    var $prev = that.$tab.prev();
    if ($prev.length && y < $prev.offset().top + ($prev.height() / 2)) {
      var oldIndex = that.$tab.index();
      var newIndex = oldIndex - 1;
      $prev.insertAfter(that.$placeholder);
      var $form = that.$forms.children(':eq(' + oldIndex + ')');
      $form.prev().insertAfter($form);
      that.swap(that.params, oldIndex, newIndex);
      that.swap(that.children, oldIndex, newIndex);
      return;
    }

    // Try to move down.
    var $next = that.$tab.next().next();
    if ($next.length && y + that.$tab.height() > $next.offset().top + ($next.height() / 2)) {
      var oldIndex = that.$tab.index();
      var newIndex = oldIndex + 1;
      $next.insertBefore(that.$tab);
      var $form = that.$forms.children(':eq(' + oldIndex + ')');
      $form.next().insertBefore($form);
      that.swap(that.params, oldIndex, newIndex);
      that.swap(that.children, oldIndex, newIndex);
    }
  };

  /**
   * Swap elements in array.
   *
   * @param {Array} list
   * @param {Number} oldIndex
   * @param {Number} newIndex
   * @returns {undefined}
   */
  C.prototype.swap = function (list, oldIndex, newIndex) {
    var oldItem = list[oldIndex];
    list[oldIndex] = list[newIndex];
    list[newIndex] = oldItem;
  };

  /**
   * End sorting, mouse release.
   *
   * @param {Object} event
   * @returns {undefined}
   */
  C.endSort = function (event) {
    var that = event.data.instance;
    that.$tab.removeClass('h5p-moving').css({top: '', left: '', height: ''});
    that.$placeholder.remove();
    H5P.$body.unbind('mousemove', C.sort).unbind('mouseup', C.endSort).unbind('mouseleave', C.endSort).css({'-moz-user-select': '', '-webkit-user-select': '', 'user-select': '', '-ms-user-select': ''}).removeAttr('unselectable')[0].onselectstart = H5P.$body[0].ondragstart = null;
    that.reindexIndexLabels();
  };

  /**
   * Reindex index labels. (Makes it easier to keep track of questions)
   *
   * @returns {undefined}
   */
  C.prototype.reindexIndexLabels = function () {
    this.$tabs.find('.h5p-index-label').each(function (index, element) {
      $(element).text(index + 1);
    });
  };

  /**
   * Convert first letter of given string to upper case.
   *
   * @param {String} word
   * @returns {String}
   */
  C.UCFirst = function (word) {
    return word.substr(0,1).toUpperCase() + word.substr(1);
  };

  /**
   * Validate the current field.
   *
   * @returns {Boolean}
   */
  C.prototype.validate = function () {
    var valid = true;

    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].validate() === false) {
        valid = false;
      }
    }

    return valid;
  };

  /**
   * Remove the field from DOM.
   *
   * @returns {undefined}
   */
  C.prototype.remove = function () {
    H5PEditor.removeChildren(this.children);
    this.$tabs.parent().parent().remove();
  };

  /**
   * Collect functions to execute once the tree is complete.
   *
   * @param {function} ready
   * @returns {undefined}
   */
  C.prototype.ready = function (ready) {
    if (this.passReadies) {
      this.parent.ready(ready);
    }
    else {
      this.readies.push(ready);
    }
  };

  /**
   * Translate UI texts for this library.
   *
   * @param {String} key
   * @param {Object} vars
   * @returns {@exp;H5PEditor@call;t}
   */
  C.t = function (key, vars) {
    return H5PEditor.t('H5PEditor.VerticalTabs', key, vars);
  };

  return C;
})(H5P.jQuery);

// Default english translations
H5PEditor.language['H5PEditor.VerticalTabs'] = {
  libraryStrings: {
    sortHelp: 'Press and drag to sort tabs.'
  }
};
