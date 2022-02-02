// UMD
(function(factory) {
  "use strict";
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], function ($) {
      return factory($, window, document);
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = function (root, $) {
      if (!root) {
        root = window;
      }
      if (!$) {
        $ = typeof window !== 'undefined' ? require('jquery') : require('jquery')(root);
      }
      return factory($, root, root.document);
    };
  } else {
    // Browser
    factory(jQuery, window, document);
  }
}(function($, window, document) {
  var zoneOffsetCodes = {"Y": "GMT-12:00", "X": "GMT-11:00", "W": "GMT-10:00", "V†": "GMT-09:30", "V": "GMT-09:00",
                        "U": "GMT-08:00", "T": "GMT-07:00", "S": "GMT-06:00", "R": "GMT-05:00", "Q": "GMT-04:00",
                        "P†": "GMT-03:30", "P": "GMT-03:00", "O": "GMT-02:00", "N": "GMT-01:00", "Z": "GMT-00:00",
                        "A": "GMT+01:00", "B": "GMT+02:00", "C": "GMT+03:00", "C†": "GMT+03:30", "D": "GMT+04:00",
                        "D†": "GMT+04:30", "E": "GMT+05:00", "E†": "GMT+05:30", "E*": "GMT+05:45", "F": "GMT+06:00",
                        "F†": "GMT+06:30", "G": "GMT+07:00", "H": "GMT+08:00", "H†": "GMT+08:30", "H*": "GMT+08:45",
                        "I": "GMT+09:00", "I†": "GMT+09:30", "K": "GMT+10:00", "K†": "GMT+10:30", "L": "GMT+11:00",
                        "M": "GMT+12:00", "M*": "GMT+12:45", "M†": "GMT+13:00"};

  $.fn.dataTable.render.date = function(from, to) {
    // Argument shifting
    if (arguments.length === 1) {
      to = from;
      from = 'YYYY-MM-DD';
    }
    return function(d, type, row) {
      if (typeof d === 'undefined' || d == null) {
        return '';
      }
      if (('' + d).match(/^([0:T\s]+)(.*)$/)) {
        return '';

      } else {
        d = d.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, '$1 $2$3');
        var date = new Date();
        var dateMatch = ('' + d).match(/^(\d{2,4}-\d{1,2}-\d{1,2}) (\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/);
        if (dateMatch != null) {
          var input = dateMatch[1] + ' ' + dateMatch[2];
          try {
            date = window.date.parse(input, 'YYYY-MM-DD HH:mm:ss.SSS', true);
          } catch(e) {
            console.log(e);
          }

          var timeZone = dateMatch[3];
          if (!/^GMT[\-\+][\d\:]{2,5}$/.test(timeZone)) {
            timeZone = zoneOffsetCodes[dateMatch[3]];
          }
          var utc = false;
          timeZone = timeZone.replace(/^(GMT)([\-\+])(\d{1,2})(\d{2,})$/, '$1$2$3:$4');
          var zoneMatch = timeZone.match(/^(GMT)([\-\+])(\d{1,2}):(\d{2,})$/);
          if (zoneMatch != null) {
            utc = /^[0:]{1,2}$/.test(zoneMatch[3]) && /^[0:]{2,}$/.test(zoneMatch[4]);
            if (!utc) {
              var diff = ((parseInt(zoneMatch[3]) * 60) + parseInt(zoneMatch[4])) * 60000;
              if (zoneMatch[2] == '-') {
                date = new Date(date.getTime() - diff);
              } else {
                date = new Date(date.getTime() + diff);
              }
            }
          }

        } else {
          try {
            date = window.date.parse(input, from, true);
          } catch(e) {
            console.log(e);
          }
        }

        // Order and type get a number value from Moment, everything else sees the rendered value
        return window.date.format(date, (type === 'sort' || type === 'type') ? 'x' : to);
      }
    };
  };
}));
