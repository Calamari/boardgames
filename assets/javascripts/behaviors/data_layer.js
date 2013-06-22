(function($, doc) {
  "use strict";

  // Handles "data-layer" on links such as:
  // <a href="#" data-layer="my-layer">Delete</a>
  function openLayer(link) {
    var layerId = link.data('layer');

    new Layer('#' + layerId);
  }

  $(doc).on('click.behaviors', 'a[data-layer]', function(event) {
    event.preventDefault();
    openLayer($(this));
    return false;
  });
}(jQuery, document));
