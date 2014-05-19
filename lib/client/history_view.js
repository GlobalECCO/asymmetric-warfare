define(['icanhaz'], function(ICanHaz) {
  var HistoryView = function() {
    var $history;
    return {
      init: function($container) {
        $history = $container;
      },
      render: function(history) {
        $history.text('');
        _.each(history, function(entry) {
          $entry = $('<div class="history_entry"></div>');
          $span = $('<span class="text"></span>');
          $span.addClass(entry.type().toLowerCase());
          $span.html(entry.toString());

          $entry.append($span);
          $history.append($entry);

          // $entry = ich.history_entry({
          //   text: entry.toString(),
          //   type: entry.type().toLowerCase()
          // });
          // $history.append($entry);
        });
      }
    };
  };

  return HistoryView;
});
