define(['icanhaz'], function(ICanHaz) {
  var HistoryView = function() {
    var $history;
    return {
      init: function($container) {
        $history = $container;
      },
      render: function(history, playbackTurn) {
        var turnCount = -5;
        $history.text('');
        _.each(history, function(entry) {
          if (entry.type() !== 'END_TURN') {
            turnCount++;
          }
          if (typeof playbackTurn === 'undefined' || playbackTurn === -1 || playbackTurn >= turnCount) {
            $entry = $('<div class="history_entry"></div>');
            $span = $('<span class="text"></span>');
            $span.addClass(entry.type().toLowerCase());
            $span.html(entry.toString());

            $entry.append($span);
            $history.append($entry);
          }
          // $entry = ich.history_entry({
          //   text: entry.toString(),
          //   type: entry.type().toLowerCase()
          // });
          // $history.append($entry);
        });
        $history.scrollTop($history[0].scrollHeight);
      }
    };
  };

  return HistoryView;
});
