
(function($){

    $.uploader = function(element, options) {
      this.options = $.extend(true, {}, $.uploader.defaults, options);
      this.$elm = $(element);
      var progressbar = this.options.progressbar;
      this.$elmProgress = null;
      if ((typeof progressbar === 'string' && progressbar != '')
          || (typeof progressbar === 'object')){
        this.$elmProgress = $(this.options.progressbar);
      }
      this.init();
    };
  
    $.uploader.prototype = {
      init: function () {
        var self = this;
  
        this.$elm.on('change', function(){
          var files = $(this).get(0).files;
          if (files.length > 0) {
            // create a FormData object which will be sent as the data payload in the AJAX request
            var formData = new FormData();
  
            // loop through all the selected files and add them to the formData object
            for (var i = 0; i < files.length; i++) {
              var file = files[i];
              var fileName = file.name;
              if (self.options.basename && self.options.basename != '') {
                fileName = self.options.basename;
                if (files.length > 1) {
                  fileName += '_' + i;
                }
                var match = /(\.[^\.]+)$/.exec(file.name);
                if (match) {
                  fileName += match[1];
                }
              }
              // add the files to formData object for the data payload
              formData.append(self.options.field, file, fileName);
            }
  
            $.ajax({
              url: self.options.url,
              type: self.options.method,
              data: formData,
              processData: false,
              contentType: false,
              success: function(data){
                console.log('upload successful!');
                if (typeof self.options.complete === 'function') {
                  self.options.complete(data);
                } else {
                  $(document).trigger('status.uploadComplete', [data]);
                }
              },
              error: function(xhr, status, error) {
                console.log(error);
                if (typeof self.options.error === 'function') {
                  self.options.error(error);
                }
              },
              xhr: function() {
                // create an XMLHttpRequest
                var xhr = new XMLHttpRequest();
  
                // listen to the 'progress' event
                xhr.upload.addEventListener('progress', function(evt) {
                  if (evt.lengthComputable) {
                    // calculate the percentage of upload completed
                    var percentComplete = evt.loaded / evt.total;
                    percentComplete = parseInt(percentComplete * 100);
  
                    if (self.$elmProgress != null) {
                      // update the Bootstrap progress bar with the new percentage
                      self.$elmProgress.text(percentComplete + '%');
                      self.$elmProgress.width(percentComplete + '%');
  
                      // once the upload reaches 100%, set the progress bar text to done
                      if (percentComplete === 100) {
                        self.$elmProgress.html('Done');
                      }
  
                    } else if (typeof self.options.progress === 'function') {
                      self.options.progress(percentComplete);
                    }
                  }
                }, false);
                return xhr;
              }
            });
          }
        });
      }
    };
  
    $.uploader.defaults = {
      url: '/upload',
      method: 'POST',
      field: 'uploads[]',
      basename: null,
      progressbar: '',
      complete: undefined,
      progress: undefined,
      error: undefined
    };
  
    $.fn.uploader = function(options) {
      return this.each(function() {
        new $.uploader(this, options);
      });
      };
  
  })(window.jQuery);
  
  