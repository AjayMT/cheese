
/* global jQuery, require, module */

var DOMUtils = {};

if (typeof require === 'function' && typeof module === 'object') {
  var jQuery = require('./jquery-1.10.2.min.js');
  module.exports = DOMUtils;
}

(function ($) {
  function listContains (list, element, compareFunc, context) {
    for (var i = 0; i < list.length; i++)
      if (compareFunc.call(context, element, list[i])) return true;

    return false;
  }

  function toArray (list) {
    var array = [];
    for (var i = 0; i < list.length; i++)
      array[i] = list[i];

    return array;
  }

  DOMUtils.tagsMatch = function (left, right) {
    if (! left || ! right) return false;

    if (left.tagName && right.tagName) return (left.tagName === right.tagName);
    else return left.isEqualNode(right);
  };

  DOMUtils.updateDOMElement = function (left, right) {
    if (left[0].isEqualNode(right[0])) return;
    if (right[0].childNodes.length === 0 || ! this.tagsMatch(left[0], right[0])) {
      left.replaceWith(right);
      return;
    }

    var added = [], removed = [];

    for (var i = 0; i < right[0].childNodes.length; i++)
      if (! listContains(left[0].childNodes, right[0].childNodes[i], this.tagsMatch, this))
        added.push($(right[0].childNodes[i]).clone(true, true));

    for (var j = 0; j < left[0].childNodes.length; j++)
      if (! listContains(right[0].childNodes, left[0].childNodes[j], this.tagsMatch, this))
        removed.push($(left[0].childNodes[j]));

    for (var k = 0; k < right[0].childNodes.length; k++)
      if (listContains(left[0].childNodes, right[0].childNodes[k], this.tagsMatch, this)) {
        var filterCallback = function (element) {
          if (element[0]) return DOMUtils.tagsMatch(right[0].childNodes[k], element[0]);
          else return DOMUtils.tagsMatch(right[0].childNodes[k], element);
        };

        var leftInstances = toArray(left[0].childNodes).filter(filterCallback);
        var rightInstances = toArray(right[0].childNodes).filter(filterCallback);
        var addedInstances = added.filter(filterCallback);
        var removedInstances = removed.filter(filterCallback);

        if (rightInstances.length > leftInstances.length) {
          var difference = rightInstances.length - leftInstances.length;
          if (difference > addedInstances.length) added.push($(right[0].childNodes[k]).clone(true, true));
        } else if (leftInstances.length > rightInstances.length) {
          difference = leftInstances.length - rightInstances.length;
          if (difference > removedInstances.length) removed.push($(leftInstances[0]));
        }
      }

    for (var l = added.length - 1; l >= 0; l--) {
      if (! added[l].nextSibling) left.append(added[l]);
      else left[0].insertBefore(added[l][0], left.children(added[l][0].nextSibling)[0]);
    }

    for (var m = 0; m < removed.length; m++)
      removed[m].remove();

    if (left[0].attributes && right[0].attributes) {
      for (var n = 0; n < right[0].attributes.length; n++) {
        var attrName = right[0].attributes[n].name;
        left.attr(attrName, right.attr(attrName));
      }

      for (var o = 0; o < left[0].attributes.length; o++) {
        attrName = left[0].attributes[o].name;
        if (! right.attr(attrName)) left.removeAttr(attrName);
      }
    }

    for (var p = 0; p < left[0].childNodes.length; p++)
      this.updateDOMElement($(left[0].childNodes[p]), $(right[0].childNodes[p]).clone(true, true));
  };
})(jQuery);
