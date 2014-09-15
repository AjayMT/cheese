var diffUtils = {};

(function () {
  function copyObject (object) {
    if (object === null) return null;

    var o = object.constructor();

    for (var k in object) {
      if (typeof object[k] === 'object') o[k] = copyObject(object[k]);
      else o[k] = object[k];
    }

    return o;
  }

  function createDiff (left, right) {
    var diff = {};

    if (left === right || JSON.stringify(left) === JSON.stringify(right)) return {};

    for (var k in right) {
      if (! left[k]) {
        if (typeof right[k] === 'object') diff[k] = copyObject(right[k]);
        else diff[k] = right[k];
      }
    }

    for (var j in left)
      if (right[j] === undefined || right[j] === null) diff[j] = null;

    for (var i in right) {
      if (Object.keys(diff).indexOf(i) !== -1) continue;
      if (typeof right[i] === 'object' && typeof left[i] === 'object')
        if (JSON.stringify(left[i]) !== JSON.stringify(right[i]))
          diff[i] = createDiff(left[i], right[i]);
      if (typeof right[i] !== 'object' || typeof left[i] !== 'object')
        if (left[i] !== right[i]) diff[i] = right[i];
    }

    return diff;
  };

  function applyDiff (diff, obj) {
    for (var k in diff) {
      if (diff[k] === null) {
        delete obj[k];
        continue;
      }

      if (! obj[k]) {
        if (typeof diff[k] === 'object') obj[k] = copyObject(diff[k]);
        else obj[k] = diff[k];
      }

      if (typeof diff[k] === 'object')
        applyDiff(diff[k], obj[k]);
      else
        obj[k] = diff[k];
    }
  };

  diffUtils.copyObject = copyObject;
  diffUtils.createDiff = createDiff;
  diffUtils.applyDiff = applyDiff;
})();

if (typeof module === 'object')
  module.exports = diffUtils;
