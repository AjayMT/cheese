var DOMUtils = {};

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
    
    return (left.tagName === right.tagName);
  };
  
  DOMUtils.updateDOMElement = function (left, right) {
    if (left[0].isEqualNode(right[0])) return;
    if (right.children().length === 0 || ! this.tagsMatch(left[0], right[0])) {
      left.replaceWith(right);
      return;
    }
    
    var added = [], removed = [];
    
    for (var i = 0; i < right.children().length; i++)
      if (! listContains(left.children(), right.children()[i], this.tagsMatch, this))
        added.push($(right.children()[i]).clone(true, true));
    
    for (var j = 0; j < left.children().length; j++)
      if (! listContains(right.children(), left.children()[j], this.tagsMatch, this))
        removed.push($(left.children()[j]));
    
    for (var k = 0; k < right.children().length; k++)
      if (listContains(left.children(), right.children()[k], this.tagsMatch, this)) {
        var filterCallback = function (element) {
          if (element[0]) return DOMUtils.tagsMatch(right.children()[k], element[0]);
          else return DOMUtils.tagsMatch(right.children()[k], element);
        };
        
        var leftInstances = toArray(left.children()).filter(filterCallback);
        var rightInstances = toArray(right.children()).filter(filterCallback);
        var addedInstances = added.filter(filterCallback);
        var removedInstances = removed.filter(filterCallback);
        
        if (rightInstances.length > leftInstances.length) {
          var difference = rightInstances.length - leftInstances.length;
          if (difference > addedInstances.length) added.push($(right.children()[k]).clone(true, true));
        } else if (leftInstances.length > rightInstances.length) {
          difference = leftInstances.length - rightInstances.length;
          if (difference > removedInstances.length) removed.push($(leftInstances[0]));
        }
      }
    
    for (var l = added.length - 1; l >= 0; l--) {
      if (! added[l].nextElementSibling) left.append(added[l]);
      else left[0].insertBefore(added[l][0], left.children(added[l][0].nextElementSibling)[0]);
    }
    
    for (var m = 0; m < removed.length; m++)
      removed[m].remove();
    
    for (var n = 0; n < right[0].attributes.length; n++) {
      var attrName = right[0].attributes[n].name;
      left.attr(attrName, right.attr(attrName));
    }
    
    for (var o = 0; o < left[0].attributes.length; o++) {
      attrName = left[0].attributes[o].name;
      if (! right.attr(attrName)) left.removeAttr(attrName);
    }
    
    for (var p = 0; p < left.children().length; p++)
      this.updateDOMElement($(left.children()[p]), $(right.children()[p]).clone(true, true));
  };
})(jQuery);
