var DOMUtils = {};

(function ($) {
  function listContains (list, element, compareFunc, context) {
    for (var i = 0; i < list.length; i++)
      if (! compareFunc.call(context, element, list[i])) return false;
    
    return true;
  }
  
  function listsMatch (left, right, compareFunc, context) {
    if (left.length !== right.length) return false;
    for (var i = 0; i < left.length; i++)
      if (! compareFunc.call(context, left[i], right[i])) return false;
    
    return true;
  }
  
  DOMUtils.insertDOMElementAtIndex =  function (parent, index, element) {
    if (! parent.children[index + 1]) parent.appendChild(element);
    else parent.insertBefore(element, parent.children[index + 1]);
    
    return element;
  };

  DOMUtils.findAbsoluteChildren = function (element) {
    var absoluteChildren = [];
    
    for (var i = 0; i < element.children.length; i++) {
      var child = element.children[i];
      if (child.children.length > 0)
        absoluteChildren = absoluteChildren.concat(this.findAbsoluteChildren(child));
      else
        absoluteChildren.push(child);
    }
    
    return absoluteChildren;
  };
  
  DOMUtils.findParents = function (element) {
    var parents = [];
    
    if (! element) return [];
    
    if (element.parentElement) {
      parents.push(element.parentElement);
      parents = parents.concat(this.findParents(element.parentElement));
    }
    
    return parents;
  };
  
  DOMUtils.getAttributeNamesForElement = function (element) {
    var names = [];
    
    if (! element) return [];
    
    for (var i = 0; i < element.attributes.length; i++)
      names.push(element.attributes[i].name);
    
    return names;
  };
  
  DOMUtils.tagsMatch = function (left, right) {
    var leftAttr = this.getAttributeNamesForElement(left);
    var rightAttr = this.getAttributeNamesForElement(right);
    
    if (! left || ! right) return false;
    
    return (left.tagName === right.tagName && listsMatch(leftAttr, rightAttr, 
                                                         function (a, b) { return a === b; }, window));
  };
  
  DOMUtils.diffTagLists = function (left, right) {
    var diff = { added: [], removed: [] };
    for (var i = 0; i < right.length; i++)
      if (! listContains(left, right[i], this.tagsMatch, this)) diff.added.push(right[i]);
    
    for (var j = 0; j < left.length; j++)
      if (! listContains(right, left[i], this.tagsMatch, this)) diff.removed.push(left[i]);
    
    return diff;
  };
  
  DOMUtils.getChildrenWithCommonAncestry = function (left, right) {
    var common = [];
    
    for (var i = 0; i < left.length; i++)
      for (var j = 0; j < right.length; j++)
        if (listsMatch(this.findParents(left[i]), this.findParents(right[j]), this.tagsMatch, this))
          if (common.indexOf(right[j]) === -1) common.push([left[i], right[j]]);
    
    return common;
  };
  
  DOMUtils.updateDOMElement = function (left, right) {
    var leftChildren = this.findAbsoluteChildren(left);
    var rightChildren = this.findAbsoluteChildren(right);
    var commonChildren = this.getChildrenWithCommonAncestry(leftChildren, rightChildren);
    
    for (var i = 0; i < commonChildren.length; i++) {
      $(commonChildren[i][0]).replaceWith(commonChildren[i][1]);
    }
  };
})(jQuery);
