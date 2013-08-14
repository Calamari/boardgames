var traits = {
  apply: function(object, traitName) {
    for (var key in traits[traitName]) {
      if (traits[traitName].hasOwnProperty(key)) {
        object[key] = traits[traitName][key];
      }
    }
    return object;
  }
};
