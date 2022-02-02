function imageUpload(container, eleValue, category) {
    var $elm = $(container);
    console.log("elm ", $elm);
    var $input = $(eleValue);
    console.log("input ", $input);
  
    var $uploadInput = $elm.find('#' + $input.attr('id') + 'File');
    if (!$uploadInput[0]) {
      $uploadInput = $('<input>', {
        id: $input.attr('id') + 'File',
        type: 'file',
        style: "display: none;",
        multiple: ""
      });
      $elm.append($uploadInput);
    }
  
    var imageUrl = $input.val();
    console.log("imageUrl ", imageUrl);
  
    if (imageUrl != '') {
      console.log(" no null ");
      $elm.find('.image-add-continer').hide();
      $elm.find('.form-image-preview').attr('src', '/file/stream?file=' + imageUrl);
    } else {
      console.log(" null ");
      $elm.find('.image-preview-container').hide();
    }
  
    $elm.find('.image-add').on('click', function() {
      console.log("click image");
      $uploadInput.click();
    });
  
    $uploadInput.uploader({
      url: '/file/upload/' + category,
      complete: function(data) {
        if (typeof data === 'object') {
          if (data.message == 'success' && Array.isArray(data.files) && data.files.length > 0) {
            $elm.find('.image-add-continer').hide();

            console.log("PREVIEW ==>> :", data.files[0]);
            $elm.find('img.image-preview').attr('src', '/file/stream?file=' + data.files[0]);
            $input.val(data.files[0]);
            $elm.find('.image-preview-container').show();
          }
        }
      }
    });
  
    $elm.find('.image-delete').on('click', function(ev) {
      if (confirm('Are you sure to remove this image?')) {
        $.ajax({
          url: '/file/delete',
          type: 'POST',
          data: {
            'file': $input.val()
          },
          success: function(data) {
            console.log(data.message);
            if (data.message == 'success') {
              $input.val('');
              $elm.find('img.image-preview').attr('src', '');
              $elm.find('.image-add-continer').show();
              $elm.find('.image-preview-container').hide();
            } else {
              alert(data.error);
            }
          },
          error: function(xhr, status, error) {
            console.log(error);
          }
        });
      }
    });
  }