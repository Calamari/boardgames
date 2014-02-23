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

  $(doc).find('a[data-confirm]').on('click.behaviors', function(event) {
    event.preventDefault();
    var link  = $(event.currentTarget),
        data  = link.data('confirm'),
        layer = new Layer('#confirm-layer', {
          onSuccess: function() {
            if (link.data('method')) {
              handleMethod(link);
            } else {
              location.href = link.attr('href');
            }
          }
        });
    layer.element.find('.text').html(data.text);
    layer.element.find('.title').html(data.title);
    return false;
  });
}(jQuery, document));
