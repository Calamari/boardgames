var traits = {
  apply: function(object, traitName) {
    return Object.extend(object, traits[traitName]);
  }
};
