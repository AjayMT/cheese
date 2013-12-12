var DOMUtils = {};

(function ($) {
  function listContains (list, element, compareFunc) {
    for (var i = 0; i < list.length; i++)
      if (! compareFunc(element, list[i])) return false;
    
    return true;
  }
  
  DOMUtils.insertDOMElementAtIndex =  function (parent, index, element) {
    if (! parent.childNodes[index + 1]) parent.appendChild(element);
    else parent.insertBefore(element, parent.childNodes[index + 1]);
    
    return element;
  };

  DOMUtils.findAbsoluteChildren = function (element) {
    var absoluteChildren = [];
    
    for (var i = 0; i < element.childNodes.length; i++) {
      var child = element.childNodes[i];
      if (child.childNodes.length > 0) {
        absoluteChildren = absoluteChildren.concat(this.findAbsoluteChildren(child));
      } else {
        absoluteChildren.push(child);
      }
    }
    
    return absoluteChildren;
  };
  
  DOMUtils.findParents = function (element) {
    var parents = [];
    if (element.parentNode)
      if (element.parentNode !== document) {
        parents = parents.concat(element.parentNode);
        parents = parents.concat(this.findParents(element.parentNode));
      }
    
    return parents;
  };
  
  DOMUtils.tagsMatch = function (left, right) {
    for (var k in $(left).attr(left.attributes))
      if (! $(right).attr(k)) return false;

    for (var j in $(right).attr(right.attributes))
      if (! $(left).attr(j)) return false;
    
    return (left.tagName === right.tagName);
  };
  
  DOMUtils.diffTagLists = function (left, right) {
    var diff = { added: {}, removed: {} };
    
    for (var i = 0; i < right.length; i++)
      if (! listContains(left, right[i], this.tagsMatch)) diff.added[i] = right[i];
    
    for (var j = 0; j < left.length; j++)
      if (! listContains(right, left[i], this.tagsMatch)) diff.remove[i] = left[i];
    
    return diff;
  };
  
  DOMUtils.constructChildParentMap = function (element) {
    var absoluteChildren = this.findAbsoluteChildren(element);
    var map = {};
    
    for (var i = 0; i < absoluteChildren.length; i++) {
      map[absoluteChildren[i]] = this.findParents(absoluteChildren[i]);
    }
    
    return map;
  };
  
  DOMUtils.getChildrenWithCommonAncestry = function (left, right) {
    var common = {};
    
    for (var leftChild in left)
      for (var rightChild in right)
        if (this.diffTagLists(left[leftChild], right[rightChild]).added === {} &&
            this.diffTagLists(left[leftChild], right[rightChild]).removed === {})
          if (Object.keys(common).indexOf(left[leftChild]) === -1) common[left[leftChild]] = rightChild;
    
    return common;
  };
  
  DOMUtils.updateDOMElement = function (left, right) {
    var leftMap = this.constructChildParentMap(left);
    var rightMap = this.constructChildParentMap(right);
    var commonMap = this.getChildrenWithCommonAncestry(leftMap, rightMap);
    
    for (var list in commonMap) {
      var old = Object.keys(leftMap)[Object.keys(leftMap).indexOf(commonMap[list])];
      $(old).replaceWith(commonMap[list]);
    }
  };
})(jQuery);
