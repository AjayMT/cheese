var diffUtils = {};

diffUtils.createDiff = function (left, right) {
  var diff = {};
  
  for (var k in right) {
    if (! left[k]) diff[k] = right[k];
  }
  
  for (var j in left) {
    if (! right[j]) diff[j] = null;
  }
  
  for (var i in right) {
    if (typeof right[i] === 'object') {
      if (left[i] !== right[i])
        diff[i] = this.createDiff(left[i], right[i]);
    } else {
      if (left[i] !== right[i]) diff[i] = right[i];
    }
  }
  
  return diff;
};

diffUtils.applyDiff = function (diff, obj) {
  for (var k in diff) {
    if (diff[k] === null) {
      delete obj[k];
      continue;
    }
    
    if (! obj[k]) {
      obj[k] = diff[k];
    }
    
    if (typeof diff[k] === 'object') {
      this.applyDiff(diff[k], obj[k]);
    } else {
      obj[k] = diff[k];
    }
  }
};

if (typeof module === 'object') {
  module.exports = diffUtils;
}
