(function($, doc) {
  'use strict';

  // Handles "data-method" on links such as:
  // <a href="/users/5" data-method="delete" rel="nofollow" data-confirm="Are you sure?">Delete</a>
  function handleMethod(link) {
    var href   = link.attr('href'),
        method = link.data('method'),
        target = link.attr('target'),
        csrfParam = $('meta[name=csrf-param]').attr('content'),
        csrfToken = $('meta[name=csrf-token]').attr('content'),
        form = $('<form method="post" action="' + href + '"></form>'),
        metadataInput = '<input name="_method" value="' + method + '" type="hidden" />';

    if (csrfParam !== undefined && csrfToken !== undefined) {
      metadataInput += '<input name="' + csrfParam + '" value="' + csrfToken + '" type="hidden" />';
    }

    if (target) { form.attr('target', target); }

    form.hide().append(metadataInput).appendTo('body');
    form.submit();
  }

  $(function() {
    $(doc).on('click.behaviors', 'a[data-method]', function() {
      handleMethod($(this));
      return false;
    });
  });
}(jQuery, document));
