/**
 * Scripts
 */
function dataTableIndexRenderer() {
  return function(d, type, row, meta) {
    return parseInt('' + meta.row) + 1;
  };
}

function dataTableActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (me[0] == "1" && me[1] == "1")
      html +=
      '<a class="btn btn-warning list-action" href="./' +
      editUrl +
      "/" +
      id +
      '" title="Edit"><i class="fa fa-edit"></i></a> ';
    if (me[2] == "1")
      html +=
      '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
    data-loading-text="Deleting …" data-id="' +
      id +
      '" title="Delete"><i class="fa fa-trash"></i></a>';
    return html;
  };
}

function dataTableOnlyEditRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (me[0] == "1" && me[1] == "1")
      html +=
      '<a class="btn btn-warning list-action" href="./' +
      editUrl +
      "/" +
      id +
      '" title="Edit"><i class="fa fa-edit"></i></a> ';
    return html;
  };
}

function dataItemTableActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.is_entry == 1) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
      data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    }
    return html;
  };
}

function dataTableReceiveActionsRenderer(editUrl, receiveUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (me[0] == "1" && me[1] == "1") {
      if (row.isreceived == 1) {
        html +=
          '<a class="btn btn-warning list-action disabled" href="./' +
          editUrl +
          "/" +
          id +
          '" title="Edit"><i class="fa fa-edit"></i></a> ';
      } else {
        html +=
          '<a class="btn btn-warning list-action" href="./' +
          editUrl +
          "/" +
          id +
          '" title="Edit"><i class="fa fa-edit"></i></a> ';
      }
      if (row.isallreceived == 1) {
        html +=
          '<a class="btn btn-primary list-action disabled" href="./' +
          receiveUrl +
          "/" +
          id +
          '" title="Receive"><i class="fa fa-hand-holding-heart"></i></a> ';
      } else {
        html +=
          '<a class="btn btn-primary list-action" href="./' +
          receiveUrl +
          "/" +
          id +
          '" title="Receive"><i class="fa fa-hand-holding-heart"></i></a> ';
      }
    }
    // if (row.isreceived == 1) {
    //   html +=
    //     '<a class="btn btn-warning list-action disabled" href="./' +
    //     editUrl +
    //     "/" +
    //     id +
    //     '" title="Edit"><i class="fa fa-edit"></i></a> ';

    //   html +=
    //     '<a class="btn btn-primary list-action disabled" href="./' +
    //     receiveUrl +
    //     "/" +
    //     id +
    //     '" title="Receive"><i class="fa fa-hand-holding-heart"></i></a> ';
    // } else {
    //   html +=
    //     '<a class="btn btn-warning list-action" href="./' +
    //     editUrl +
    //     "/" +
    //     id +
    //     '" title="Edit"><i class="fa fa-edit"></i></a> ';
    //   html +=
    //     '<a class="btn btn-primary list-action" href="./' +
    //     receiveUrl +
    //     "/" +
    //     id +
    //     '" title="Receive"><i class="fa fa-hand-holding-heart"></i></a> ';
    // }
    if (me[2] == "1")
      if (row.isreceived == 1) {
        html +=
          '<a class="btn btn-danger list-action disabled" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
          id +
          '" title="Delete"><i class="fa fa-trash"></i></a>';
      } else {
        html +=
          '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
          id +
          '" title="Delete"><i class="fa fa-trash"></i></a>';
      }
    return html;
  };
}

function dataTableGoldActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.finished == 'No') {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-info list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a>'

    }
    return html;
  };
}

function dataTableIsReceiveActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.isallreceived == 0) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action disabled" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action disabled" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    }



    // if (me[0] == "1" && me[1] == "1")
    //   html +=
    //   '<a class="btn btn-warning list-action" href="./' +
    //   editUrl +
    //   "/" +
    //   id +
    //   '" title="Edit"><i class="fa fa-edit"></i></a> ';
    // if (me[2] == "1")
    //   if (row.isreceived == 0) {
    //     console.log("delete");
    //     html +=
    //       '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
    //   data-loading-text="Deleting …" data-id="' +
    //       id +
    //       '" title="Delete"><i class="fa fa-trash"></i></a>';
    //   } else {
    //     console.log("isreceived ", row.isreceived);
    //     console.log("no delete");
    //     html +=
    //       '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
    //   data-loading-text="Deleting …" data-id="' +
    //       id +
    //       '" title="Delete" readonly><i class="fa fa-trash"></i></a>';
    //   }
    return html;
  };
}

function dataTableIsFinishActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.isfinished == 0) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a>'

    }
    return html;
  };
}

function dataTableGiveGoldsmithActionsRenderer(printUrl, editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    html += '<a class="btn btn-primary list-action" href="./' +
          printUrl +
          "/" +
          id +
          '" title="Print"><i class="fa fa-file"></i></a> ';
    if (row.isfinished == 0) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a>'

    }
    return html;
  };
}

function dataTableGiveOutsideActionsRenderer(printUrl, editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    html += '<a class="btn btn-primary list-action" href="./' +
          printUrl +
          "/" +
          id +
          '" title="Print"><i class="fa fa-file"></i></a> ';
    if (row.isfinished == 0) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a>'

    }
    return html;
  };
}

function dataTableGiveDiamondActionsRenderer(printUrl, editUrl, entryUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    html += '<a class="btn btn-primary list-action" href="./' +
          printUrl +
          "/" +
          id +
          '" title="Print"><i class="fa fa-file"></i></a> ';
    if (row.isfinished == 0) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else if (row.isfinished == 1 && row.status == "give_diamond") {
      if (me[1] == "1") {
        html += '<a class="btn btn-warning list-action" href="./' +
          editUrl +
          '/' +
          id +
          '" title="Detail"><i class="fa fa-list"></i></a> ';
        html +=
          '<a class="btn btn-success btn-give-diamond list-action mm" href="./' +
          entryUrl +
          "/" +
          id +
          '" title="အထည်အပ်"><span>အထည်အပ်</span></a>';
      }
      // <i class="fa fa-hand-holding-heart"></i>
      // html += '<button class="btn btn-danger btn-xs btn-delete" >Delete</button><a class="btn btn-success list-action" href="././get-diamond/entry" title="Detail"></a>';

    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a> ';
    }
    return html;
  };
}

function dataTableGetGoldsmithActionsRenderer(editUrl, entryUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.isfinished == 0) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else if (row.isfinished == 1 && row.status == "get_goldsmith" && row.use_status == "no-use") {
      if (me[1] == "1") {
        html += '<a class="btn btn-warning list-action" href="./' +
          editUrl +
          '/' +
          id +
          '" title="Detail"><i class="fa fa-list"></i></a> ';
        html +=
          '<a class="btn btn-success btn-give-diamond list-action mm" href="./' +
          entryUrl +
          "/" +
          id +
          '" title="အရောင်တင်"><span>အရောင်တင်</span></a>';
      }
      // <i class="fa fa-hand-holding-heart"></i>
      // html += '<button class="btn btn-danger btn-xs btn-delete" >Delete</button><a class="btn btn-success list-action" href="././get-diamond/entry" title="Detail"></a>';

    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a> ';
    }
    return html;
  };
}

function dataTableGetDiamondActionsRenderer(editUrl, entryUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.isfinished == 0) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else if (row.isfinished == 1 && row.status == "get_diamond" && row.use_status == "no-use") {
      if (me[1] == "1") {
        html += '<a class="btn btn-warning list-action" href="./' +
          editUrl +
          '/' +
          id +
          '" title="Detail"><i class="fa fa-list"></i></a> ';
        html +=
          '<a class="btn btn-success btn-give-diamond list-action mm" href="./' +
          entryUrl +
          "/" +
          id +
          '" title="အရောင်တင်"><span>အရောင်တင်</span></a>';
      }
      // <i class="fa fa-hand-holding-heart"></i>
      // html += '<button class="btn btn-danger btn-xs btn-delete" >Delete</button><a class="btn btn-success list-action" href="././get-diamond/entry" title="Detail"></a>';

    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a> ';
    }
    return html;
  };
}

function dataTableGetOutsideActionsRenderer(editUrl, entryUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.isfinished == 0) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else if (row.isfinished == 1 && row.status == null) {
      if (me[1] == "1") {
        html += '<a class="btn btn-warning list-action" href="./' +
          editUrl +
          '/' +
          id +
          '" title="Detail"><i class="fa fa-list"></i></a> ';
        html +=
          '<a class="btn btn-success btn-give-diamond list-action mm" href="./' +
          entryUrl +
          "/" +
          id +
          '" title="အရောင်တင်"><span>အရောင်တင်</span></a>';
      }
      // <i class="fa fa-hand-holding-heart"></i>
      // html += '<button class="btn btn-danger btn-xs btn-delete" >Delete</button><a class="btn btn-success list-action" href="././get-diamond/entry" title="Detail"></a>';

    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a> ';
    }
    return html;
  };
}

function dataTablePolishFinishActionsRenderer(barcodeUrl, detailUrl, counterUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.is_stock == 0 && row.is_sale == 0 && row.is_detail == 0)
      html +=
        '<a class="btn btn-success list-action mm" href="./' +
        detailUrl +
        "/" +
        id +
        '" title="အသေးစိတ်"><span>အသေးစိတ်</span></a> ';
    if (row.is_stock == 0 && row.is_sale == 0 && row.is_detail == 1)
      html +=
        // '<a class="btn btn-secondary list-action" role="button" data-toggle="modal" data-target="#dialogBarcode" \
        // data-loading-text="Barcode …" data-id="' +
        // id +
        // '" title="Barcode"><i class="fa fa-barcode"></i></a> ' +
        '<a class="btn btn-secondary list-action mm" href="./' +
        barcodeUrl +
        "/" +
        row.item_id +
        '" title="Barcode"><i class="fa fa-barcode"></i></a> ' +
        '<a class="btn btn-info list-action mm" href="./' +
        counterUrl +
        "/" +
        row.item_id +
        '" title="counterချ"><span>counterချ</span></a> ';
    return html;
  };
}

function dataTableIsActiveActionsRenderer(previewUrl, editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.is_active == 1) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-primary list-action" href="./' +
        previewUrl +
        "/" +
        id +
        '" title="Print"><i class="fa fa-file"></i></a> ';
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a> ';
    }
    return html;
  };
}

function dataTableReturnActionsRenderer(access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.is_active == 1) {
      html +=
        '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogGiveGoldsmithConfirm" \
        data-loading-text="Giving…" data-id="' +
        id +
        '" title="Give Goldsmith"><i class="fa fa-user"></i></a> ';
      html +=
        '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogPolishConfirm" \
        data-loading-text="Polishing …" data-id="' +
        id +
        '" title="Polish"><i class="fa fa-broom"></i></a> ';
      html +=
        '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogBoilConfirm" \
        data-loading-text="Boiling…" data-id="' +
        id +
        '" title="Boil"><i class="fa fa-random"></i></a> ';
    }
    // if (row.is_active == 1) {
    //   html +=
    //     '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogGiveGoldsmithConfirm" \
    //     data-loading-text="Giving…" data-id="' +
    //     id +
    //     '" title="Give Goldsmith"><i class="fa fa-user"></i></a> ';
    //   // html +=
    //   // '<a class="btn btn-primary list-action" href="./' +
    //   // goldsmithUrl +
    //   // '" title="Give Goldsmith"><i class="fa fa-user"></i></a> ';
    // }
    // if (row.is_active == 1 || row.status == "goldsmith") {
    //   html +=
    //     '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogPolishConfirm" \
    //     data-loading-text="Polishing …" data-id="' +
    //     id +
    //     '" title="Polish"><i class="fa fa-broom"></i></a> ';
    //   // html +=
    //   // '<a class="btn btn-primary list-action" href="./' +
    //   // polishUrl +
    //   // '" title="Polish"><i class="fa fa-broom"></i></a> ';
    // }
    // if (row.is_active == 1 || row.status == "goldsmith" || row.status == "polish") {
    //   html +=
    //     '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogBoilConfirm" \
    //     data-loading-text="Boiling…" data-id="' +
    //     id +
    //     '" title="Give Goldsmith"><i class="fa fa-random"></i></a> ';
    //   // html +=
    //   // '<a class="btn btn-primary list-action" href="./' +
    //   // boilUrl +
    //   // '" title="Boil"><i class="fa fa-random"></i></a> ';
    // }
    return html;
  };
}

function dataTableReturnGoldsmithActionsRenderer(entryUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (me[0] == "1" && me[1] == "1") {
      if (row.use_status == "no-use") {
        html +=
        '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogUndoConfirm" \
        data-loading-text="Undo…" data-id="' +
        id +
        '" title="Undo"><i class="fa fa-reply"></i></a> ';

        html +=
          '<a class="btn btn-warning list-action" href="./' +
          entryUrl + '/' + id +
          '" title="Edit"><i class="fa fa-plus"></i></a> ';
      }
    }
    return html;
  };
}

function dataTableReturnGoldsmithFinishActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.is_polish == 0) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
      data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a> ';
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogPolishConfirm" \
        data-loading-text="Polishing …" data-id="' +
        row.return_item_id +
        '" title="Polish"><i class="fa fa-broom"></i></a> ';
    }
    return html;
  };
}

function dataTableSaleDiamondActionsRenderer(shopUrl, customerUrl, editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.is_active == 1) {
      if (me[0] == "1" && me[1] == "1")
        console.log("row.delivery ", row.delivery_type);
        console.log("row.delivery date ", row.delivery_date );
        if (row.delivery_type == "delivery" && row.deliver_date == undefined) {
          html +=
          '<a class="btn btn-success list-action" role="button" data-toggle="modal" data-target="#dialogDeliverConfirm" \
          data-loading-text="Delivering …" data-id="' +
          id +
          '" title="Deliver"><i class="fa fa-truck"></i></a> ';
        }
        html +=
        '<a class="btn btn-primary list-action" href="./' +
        shopUrl +
        "/" +
        id +
        '" title="Shop Print"><i class="fa fa-file"></i></a> ';
        html +=
        '<a class="btn btn-primary list-action" href="./' +
        customerUrl +
        "/" +
        id +
        '" title="Customer Print"><i class="fa fa-file"></i></a> ';
        // html +=
        // '<a class="btn btn-warning list-action" href="./' +
        // editUrl +
        // "/" +
        // id +
        // '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a> ';
    }
    return html;
  };
}

function dataTableSaleGoldActionsRenderer(previewUrl, editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.is_active == 1) {
      if (me[0] == "1" && me[1] == "1")
        if (row.delivery_type == "delivery" && row.deliver_date == undefined) {
          html +=
          '<a class="btn btn-success list-action" role="button" data-toggle="modal" data-target="#dialogDeliverConfirm" \
          data-loading-text="Delivering …" data-id="' +
          id +
          '" title="Deliver"><i class="fa fa-truck"></i></a> ';
        }
        html +=
        '<a class="btn btn-primary list-action" href="./' +
        previewUrl +
        "/" +
        id +
        '" title="Shop Print"><i class="fa fa-file"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a> ';
    }
    return html;
  };
}

function dataTableBrokenActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (me[0] == "1" && me[1] == "1")
      html +=
      '<a class="btn btn-warning list-action" href="./' +
      editUrl +
      "/" +
      id +
      '" title="Edit"><i class="fa fa-edit"></i></a> ';
    if (me[2] == "1")
      html +=
      '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
    data-loading-text="Deleting …" data-id="' +
      id +
      '" title="Delete"><i class="fa fa-trash"></i></a>';
    if (row.ifsold == null)
      html +=
      '<a class="btn btn-success list-action" role="button" data-toggle="modal" data-target="#dialogBrokenConfirm" \
      data-loading-text="Broken …" data-id="' +
      id +
      '" title="Broken"><i class="fa fa-hammer"></i></a>';
    return html;
  };
}

function dataTablePurchaseActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.finished == 'No') {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else {
      if (me[1] == "1")
        html += '<a class="btn btn-info list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a>'

    }
    return html;
  };
}

function dataTablePolishActionsRenderer(editUrl, counterUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.is_place_counter == 0) {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
      data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a> ';
      if (me[0] == "1" && me[1] == "1")
          html +=
          '<a class="btn btn-info list-action mm" href="./' +
          counterUrl +
          "/" +
          row.id +
          '" title="counterချ"><span>counterချ</span></a> ';
    } else {
      html += '<a class="btn btn-info list-action" href="./' +
        editUrl +
        '/' +
        id +
        '" title="Detail"><i class="fa fa-list"></i></a>'
    }
    return html;
  };
}

function dataTableOrderMouldActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.status == "order_mould" && row.use_status == "no-use") {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    } else {
      // if (me[1] == "1")
      //   html += '<a class="btn btn-warning list-action" href="./' +
      //   editUrl +
      //   '/' +
      //   id +
      //   '" title="Detail"><i class="fa fa-list"></i></a>'

    }
    return html;
  };
}

function dataTableRecoverActionsRenderer(access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    html +=
      '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogRecoverConfirm" \
      data-loading-text="Recovery…" data-id="' +
      id +
      '" title="Recovery"><i class="fa fa-retweet"></i></a> ';
    return html;
  };
}

// function dataTablePurchaseActionsRenderer(editUrl, access) {
//   var me = access.split(",");
//   return function(d, type, row) {
//     var id = row.id || "#";
//     var html = "";
//     if (me[0] == "1" && me[1] == "1")
//       html +=
//       '<a class="btn btn-warning list-action" href="./' +
//       editUrl +
//       "/" +
//       id +
//       '" title="Edit"><i class="fa fa-edit"></i></a> ';
//     if (me[2] == "1")
//       html +=
//       '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
//     data-loading-text="Deleting …" data-id="' +
//       id +
//       '" title="Delete"><i class="fa fa-trash"></i></a>';
//     return html;
//   };
// }

function dataTableActionsImageRenderer(editUrl, imageEditUrl) {
  return function(d, type, row) {
    const id = row.id || "#";
    return '<a class="btn btn-warning list-action" href="./' + imageEditUrl + '/' + id + '" title="Edit Images"><i class="fa fa-picture"></i></a> \
    <a class="btn btn-warning list-action" href="./' + editUrl + '/' + id + '" title="Edit"><i class="fa fa-edit"></i></a> \
    <a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
      data-loading-text="Deleting …" data-id="' + id + '" title="Delete"><i class="fa fa-trash"></i></a>';
  };
}

function dataTableDateRenderer() {
  return $.fn.dataTable.render.date('YYYY-MM-DD', 'DD/MM/YYYY');
}

function doDelete(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (data.error) {
          $('#delErrorMsg').html(data.data);
          $('#alertDeleteSuccess').hide();
          $('#alertDeleteError').show();
        } else if (data.success) {
          $('#alertDeleteError').hide();
          $('#alertDeleteSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
        // if (typeof data !== 'undefined' && typeof data.data == 'string') {
        //   console.log("data not undefined and string");
        //   $('#delErrorMsg').html(data.data);
        //   $('#alertDeleteSuccess').hide();
        //   $('#alertDeleteError').show();

        // } else if (typeof data === 'undefined' || data.data == 0) {
        //   console.log("data not undefined and 0");
        //   $('#delErrorMsg').html('Can not delete data.');
        //   $('#alertDeleteSuccess').hide();
        //   $('#alertDeleteError').show();

        // } else {
        //   console.log("Successful");
        //   $('#alertDeleteError').hide();
        //   $('#alertDeleteSuccess').show();

        //   if (typeof successCallback === 'function') {
        //     successCallback();
        //   }
        // }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function doBroken(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (typeof data !== 'undefined' && typeof data.data == 'string') {
          $('#brokenErrorMsg').html(data.data);
          $('#alertBrokenSuccess').hide();
          $('#alertBrokenError').show();

        } else if (typeof data === 'undefined' || data.data == 0) {
          $('#brokenErrorMsg').html('Can not break data.');
          $('#alertBrokenSuccess').hide();
          $('#alertBrokenError').show();

        } else {
          $('#alertBrokenError').hide();
          $('#alertBrokenSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function doGoldsmith(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (data.error) {
          $('#giveGoldsmithErrorMsg').html(data.data);
          $('#alertGiveGoldsmithSuccess').hide();
          $('#alertGiveGoldsmithError').show();
        } else if (data.success) {
          $('#alertGiveGoldsmithError').hide();
          $('#alertGiveGoldsmithSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function doPolish(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (data.error) {
          $('#polishErrorMsg').html(data.data);
          $('#alertPolishSuccess').hide();
          $('#alertPolishError').show();
        } else if (data.success) {
          $('#alertPolishError').hide();
          $('#alertPolishSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function doBoil(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (data.error) {
          $('#boilErrorMsg').html(data.data);
          $('#alertBoilSuccess').hide();
          $('#alertBoilError').show();
        } else if (data.success) {
          $('#alertBoilError').hide();
          $('#alertBoilSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function doUndo(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (data.error) {
          $('#delErrorMsg').html(data.data);
          $('#alertUndoSuccess').hide();
          $('#alertUndoError').show();
        } else if (data.success) {
          $('#alertUndoError').hide();
          $('#alertUndoSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function doRecover(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (data.error) {
          $('#recoverErrorMsg').html(data.data);
          $('#alertRecoverSuccess').hide();
          $('#alertRecoverError').show();
        } else if (data.success) {
          $('#alertRecoverError').hide();
          $('#alertRecoverSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function doSave(url, token, data, successCallback) {
  console.log("data ", data);
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "data": data,
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        console.log("success data ", data);
        // if (typeof data !== 'undefined' && typeof data.data == 'string') {
        //   $('#delErrorMsg').html(data.data);
        //   $('#alertDeleteSuccess').hide();
        //   $('#alertDeleteError').show();

        // } else if (typeof data === 'undefined' || data.data == 0) {
        //   $('#delErrorMsg').html('Can not delete data.');
        //   $('#alertDeleteSuccess').hide();
        //   $('#alertDeleteError').show();

        // } else if (data.error) {
        //   $('#delErrorMsg').html('Can not delete data.');
        //   $('#alertDeleteSuccess').hide();
        //   $('#alertDeleteError').show();
        // } else {
        //   $('#alertDeleteError').hide();
        //   $('#alertDeleteSuccess').show();

        //   if (typeof successCallback === 'function') {
            successCallback();
        //   }
        // }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function isValidEmail(email) {
  return /^([a-zA-Z])+([a-zA-Z0-9_.+-])+\@(([a-zA-Z])+\.+?(com|co|in|org|net|edu|info|gov|vekomy))\.?(com|co|in|org|net|edu|info|gov)?$/.test(email);
}

function dataTableCodeRenderer() {
  return function(d, type, row, meta) {
    if (row.stock_code && row.stock_code != null) {
      return row.stock_code;
    } else {
      return row.sale_voc_no;
    }
  };
}

function dataTableIsReceiveRenderer() {
  return function(d, type, row) {
    if (row.isallreceived == 1) {
      return "ပြီး";
    } else {
      return "မပြီး";
    }
  }
}

function dataTableGoldrate() {
  return function(d, type, row) {
    if (row.goldrate == "a") {
      return "၁၆ ပဲရည်";
    } else if (row.goldrate == "b") {
      return "၁၅ ပဲရည်";
    } else if (row.goldrate == "c") {
      return "၁၄ ပဲရည်";
    } else if (row.goldrate == "d") {
      return "၁၃ ပဲရည်";
    } else {
      return "";
    }
  }
}

function dataTableUserName() {
  return function(d, type, row) {
    if (row.cashier_id == 0)
      return "admin";
    else
      return row.username;
  }
}

function dataTableDeleteUser() {
  return function(d, type, row) {
    if (row.deleted_user_id == 0)
      return "admin";
    else
      return row.username;
  }
}

function show_sub(id) {
  $("#" + id).slideToggle("down", function() {
    $(this).toggleClass("show");
  });
}

$(function() {
  $('[data-hide="alert"]').on('click', function() {
    $(this).closest('div.alert').hide();
  });

  $('input[role="number"]').on('keydown', function(e) {
    // Allow: backspace, delete, tab, escape, enter and .
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }).on('paste', function(e) {
    // Get pasted data via clipboard API
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text').toUpperCase();
    if (!(/^[\d.]+/.test(pastedData))) {
      e.stopPropagation();
      e.preventDefault();
    }
  });

  $('input[role="decimalnumber"]').on('keydown', function(e) {
    // Allow: backspace, delete, tab, escape, enter and .
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }).on('paste', function(e) {
    // Get pasted data via clipboard API
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text').toUpperCase();
    if (!(/^[\d]+/.test(pastedData))) {
      e.stopPropagation();
      e.preventDefault();
    }
  });


  $('input[role="decimalnumber"]').on('keydown', function(e) {
    // Allow: backspace, delete, tab, escape, enter and .
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }).on('paste', function(e) {
    // Get pasted data via clipboard API
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text').toUpperCase();
    if (!(/^[\d]+/.test(pastedData))) {
      e.stopPropagation();
      e.preventDefault();
    }
  });

  // $('input.fromdate').datepicker({
  //   format: "dd/mm/yyyy",
  //   autoclose: true,
  //   todayHighlight: true,
  //   orientation: 'bottom'
  // }).datepicker('update', new Date());

  $('input.fromdate').datepicker({
    format: "dd/mm/yyyy",
    autoclose: true,
    todayHighlight: true,
    orientation: 'bottom'
  }).on("changeDate", function(e) {
    var toid = $(this).attr('to');
    if (typeof toid !== 'undefined' && toid != '') {
      $("input[id='" + toid + "']").datepicker('setStartDate', e.date);
    } else {
      $("input.todate").datepicker('setStartDate', e.date);
    }
  });

  $('input.todate').datepicker({
    format: "dd/mm/yyyy",
    autoclose: true,
    todayHighlight: true,
    orientation: 'bottom'
  }).on("changeDate", function(e) {
    var fromid = $(this).attr('from');
    if (typeof fromid !== 'undefined' && fromid != '') {
      $("input[id='" + fromid + "']").datepicker('setEndDate', e.date);
    } else {
      $("input.fromdate").datepicker('setEndDate', e.date);
    }
  });


  $('input[role="phone"]').on('keydown', function(e) {
    //alert(e.keyCode);
    // Allow: backspace, delete, tab, escape, enter, comma, space and dash
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 188, 32, 173]) !== -1 ||
      // Allow: Plus
      (e.keyCode === 61 && e.shiftKey === true) ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }).on('paste', function(e) {
    // Get pasted data via clipboard API
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text').toUpperCase();
    if (!(/^[\d/]+/.test(pastedData))) {
      e.stopPropagation();
      e.preventDefault();
    }
  });

  $('input[role="time"]').on('keydown', function(e) {
    //alert(e.keyCode);
    // Allow: backspace, delete, tab, escape, enter and .
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
      // Allow: colon
      (e.keyCode === 59 && e.shiftKey === true) ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }).on('paste', function(e) {
    // Get pasted data via clipboard API
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text').toUpperCase();
    if (!(/^[\d/]+[:\.][\d/]+/.test(pastedData))) {
      e.stopPropagation();
      e.preventDefault();
    }
  });

  $('input[role="date"]').on('keydown', function(e) {
    // Allow: backspace, delete, tab, escape, enter and slash
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 191]) !== -1 ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }).on('paste', function(e) {
    // Get pasted data via clipboard API
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text').toUpperCase();
    if (!(/^[\d/]+/.test(pastedData))) {
      e.stopPropagation();
      e.preventDefault();
    }
  });

  $('input[editable="false"]').on('keydown paste input propertychange', function(e) {
      e.stopPropagation();
      e.preventDefault();
    })
    .attr('autocomplete', 'off')
    .attr('tabIndex', -1)
    .attr('focusable', false);

  var nowDate = new Date(Date.now());
  $('input.date').datepicker({
    format: "dd/mm/yyyy",
    autoclose: true,
    todayHighlight: true,
    orientation: 'bottom'
  }).on('hide', function(e) {
    if (typeof e.date == 'undefined' && $(this).val() == '') {
      $(this).val(window.date.format(nowDate, "DD/MM/YYYY"));
    }
  });
});

$(document).ready(function() {
  $('#list-dashboard').on('error.dt', function(e, settings, techNote, message) {
    console.log('DataTables Error: ', message);
    alert('Read data error!');
  }).DataTable({
    data: [
      ["1,001", "Lorem", "ipsum", "dolor", "sit"],
      ["1,002", "amet", "consectetur", "adipiscing", "elit"],
      ["1,003", "Integer", "nec", "odio", "Praesent"],
      ["1,003", "libero", "Sed", "cursus", "ante"],
      ["1,004", "dapibus", "diam", "Sed", "nisi"],
      ["1,005", "Nulla", "quis", "sem", "at"],
      ["1,006", "nibh", "elementum", "imperdiet", "Duis"],
      ["1,007", "sagittis", "ipsum", "Praesent", "mauris"],
      ["1,008", "Fusce", "nec", "tellus", "sed"],
      ["1,009", "augue", "semper", "porta", "Mauris"],
      ["1,010", "massa", "Vestibulum", "lacinia", "arcu"],
      ["1,011", "eget", "nulla", "Class", "aptent"],
      ["1,012", "taciti", "sociosqu", "ad", "litora"],
      ["1,013", "torquent", "per", "conubia", "nosa"],
      ["1,014", "per", "inceptos", "himenaeos", "Curabitur"],
      ["1,015", "sodales", "ligula", "in", "libero"]
    ],
    columns: [
      { title: "#" },
      { title: "Header" },
      { title: "Header" },
      { title: "Header" },
      { title: "Header" }
    ],
    "columnDefs": []
  });
});

function numberWithCommas(number) {
  var parts = number.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function dataTableImageRenderer() {
  return function(d, type, row) {
    var html = '<img src="' + row.image + '" height="30px" weight="100px" title="" alt="" />';
    return html;
  }
}

function dataTableUsername() {
  return function(d, type, row) {
    if (row.username == null) {
      return "admin";
    } else {
      return row.username;
    }
  }
}

function dataTableAmtWithCommas() {
  return function(d, type, row) {
    var parts = row.net_amount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableKPTRenderer() {
  return function(d, type, row) {
    var kpy = row.wgt_k + '-' + row.wgt_p + '-' + row.wgt_y;
    return kpy;
  }
}

function dataTableNetPriceWithCommas() {
  return function(d, type, row) {
    var parts = row.netprice.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableNetPriceUSDWithCommas() {
  return function(d, type, row) {
    var parts = row.netprice_usd.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableDebtPriceWithCommas() {
  return function(d, type, row) {
    var parts = row.debtprice.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableDebtAmountWithCommas() {
  return function(d, type, row) {
    var parts = row.debt_amount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableBankAmountWithCommas() {
  return function(d, type, row) {
    var parts = row.bank_amount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableCashAmountWithCommas() {
  return function(d, type, row) {
    var parts = row.cash_amount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableBalanceWithCommas() {
  return function(d, type, row) {
    var parts = row.balance.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableQtyWithCommas() {
  return function(d, type, row) {
    var parts = row.quantity.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableCostWithCommas() {
  return function(d, type, row) {
    var parts = row.cost.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableSalaryWithCommas() {
  return function(d, type, row) {
    var parts = row.salary.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableOpenBalWithCommas() {
  return function(d, type, row) {
    var parts = row.open_balance.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableAmtWithCommas() {
  return function(d, type, row) {
    var parts = row.amount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTablePriceWithCommas() {
  return function(d, type, row) {
    var parts = row.price.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableTotalAmtWithCommas() {
  return function(d, type, row) {
    var parts = row.total_amount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableTotPriceWithCommas(val) {
  
  return function(d, type, row) {
    var parts = row.total_price.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableWithCommas(val) {
  return function(d, type, row) {
    var parts = row.val.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableWithUSD() {
  return function(d, type, row) {
    var parts = row.balance.toString().split(".");
    parts[0] = "USD " + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableWithMMK() {
  return function(d, type, row) {
    var parts = row.balance.toString().split(".");
    parts[0] = "MMK " + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableWithPayUSD() {
  return function(d, type, row) {
    var parts = row.pay_usd.toString().split(".");
    parts[0] = "USD " + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableWithAmtUSD() {
  return function(d, type, row) {
    var parts = row.amount.toString().split(".");
    parts[0] = "USD " + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableWithPayMMK() {
  return function(d, type, row) {
    var parts = row.pay_mmk.toString().split(".");
    parts[0] = "MMK " + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataDigits() {
  return this.each(function(){ 
    $(this).text( $(this).text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") ); 
  })
}