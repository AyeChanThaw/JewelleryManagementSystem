$(document).ready(function() {

    $("#wgt_gm").keypress(function(e){
        var keycode = (event.keyCode ? event.keyCode : event.which);

        if(keycode == '13' && event.key === "Enter")
        { 
            $("#wgt_k").val("");
            $("#wgt_p").val("");
            $("#wgt_y").val("");

            $CurrentGm = parseFloat($("#wgt_gm").val());
            console.log ('Gm :', $CurrentGm);
            $wgt_k = (parseFloat( $CurrentGm) / 16.6).toFixed(3) ;
            console.log ('wgt_k :', $wgt_k);
            $k = (parseFloat( $CurrentGm) / 16.6).toFixed();
            $mmk = parseInt($k);
            
            var value = $wgt_k.toString();
            var result = [];
            var arrValue = value.split(".");
            result.push( arrValue );
            console.log("result array:", result);
            var kyat =  result[0];
            var wgtk = kyat[0];
            $("#wgt_k").val(wgtk);
            if ( wgtp != 0)
            {
            var wgtp = ("0." + kyat[1]);
            }
            else var wgtp = 0;
            console.log("console k:", wgtk);
            console.log("console pae:", wgtp);

            $wgt_p = (parseFloat( wgtp * 16 )).toFixed(2) ;
            console.log ('console wgt_p:', $wgt_p);
            $p = (parseFloat( wgtp * 16 )).toFixed();
            $mmp = parseInt($p);
            
            var value = $wgt_p.toString(); 
            var result = [];
            var arrValue = value.split(".");
            result.push( arrValue );
            var valuep =  result[0];
            var wgtp = valuep[0];
            $("#wgt_p").val(wgtp);
            if ( wgty != 0)
            {
            var wgty = ("0." + valuep[1]);
            }
            else var wgty = 0;
            console.log("console pae2:", wgtp);
            console.log("console y:", wgty);

            $wgt_y = parseFloat( wgty ) * 8;
            console.log ('console wgt_y:', $wgt_y);
            $y = parseFloat( wgty * 8).toFixed(0);
            $("#wgt_y").val($y);         
        }
    });

    $("#losswgt_y").keypress(function(e){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13' && event.key === "Enter")
        { 
            $CurrentY = parseFloat($("#losswgt_y").val() / 8 ).toFixed(2);
            console.log ('y', $CurrentY);
            
            var tmpP = parseFloat($("#losswgt_p").val()) + parseFloat($CurrentY);
            $CurrentP = tmpP  / 16 ;
            console.log ('p', $CurrentP);

            $CurrentKyet = parseFloat( $CurrentP +  parseFloat($("#losswgt_k").val()));
            console.log ('kyet', $CurrentKyet);

            $losswgt_gm = parseFloat( $CurrentKyet * 16.6 ).toFixed(3);
            console.log ('loss_gm', $losswgt_gm);
            $("#losswgt_gm").val($losswgt_gm);

        }
    });

    $("#gemwgt_gm").keypress(function(e){
        var keycode = (event.keyCode ? event.keyCode : event.which);

        if(keycode == '13' && event.key === "Enter")
        { 
            $("#gemwgt_k").val("");
            $("#gemwgt_p").val("");
            $("#gemwgt_y").val("");

            $CurrentgemGm = parseFloat($("#gemwgt_gm").val());
            console.log ('Gm :', $CurrentgemGm);
            $wgt_k = (parseFloat( $CurrentgemGm) / 16.6).toFixed(3) ;
            console.log ('wgt_k :', $wgt_k);
            $k = (parseFloat( $CurrentgemGm) / 16.6).toFixed();
            var value = $wgt_k.toString();
            var result = [];
            var arrValue = value.split(".");
            result.push( arrValue );
            console.log("result array:", result);
            var kyat =  result[0];
            var wgtk = parseInt(kyat[0]);
            $("#gemwgt_k").val(wgtk);
            if ( wgtp != 0)
            {
            var wgtp = ("0." + kyat[1]);
            }
            else var wgtp = 0;
            console.log("console k:", wgtk);
            console.log("console pae:", wgtp);

            $wgt_p = (parseFloat( wgtp * 16 )).toFixed(2) ;
            console.log ('console wgt_p:', $wgt_p);
            $p = (parseFloat( wgtp * 16 )).toFixed();
            $mmp = parseInt($p);
            
            var value = $wgt_p.toString(); 
            var result = [];
            var arrValue = value.split(".");
            result.push( arrValue );
            var valuep =  result[0];
            var wgtp = parseInt(valuep[0]);
            $("#gemwgt_p").val(wgtp);
            if ( wgty != 0)
            {
            var wgty = ("0." + valuep[1]);
            }
            else var wgty = 0;
            console.log("console pae2:", wgtp);
            console.log("console y:", wgty);

            $wgt_y = parseFloat( wgty ) * 8;
            console.log ('console wgt_y:', $wgt_y);
            $y = parseFloat( wgty * 8).toFixed(0);
            $("#gemwgt_y").val($y);      
        }
    });

    $("#netwgt_gm").keypress(function(e){
        var keycode = (event.keyCode ? event.keyCode : event.which);

        if(keycode == '13' && event.key === "Enter")
        { 
            $("#netwgt_k").val("");
            $("#netwgt_p").val("");
            $("#netwgt_y").val("");

            $CurrentGm = parseFloat($("#netwgt_gm").val());
            console.log ('Gm :', $CurrentGm);
            $wgt_k = (parseFloat( $CurrentGm) / 16.6).toFixed(3) ;
            console.log ('wgt_k :', $wgt_k);
            $k = (parseFloat( $CurrentGm) / 16.6).toFixed();
            var value = $wgt_k.toString();
            var result = [];
            var arrValue = value.split(".");
            result.push( arrValue );
            console.log("result array:", result);
            var kyat =  result[0];
            var wgtk = parseInt(kyat[0]);
            $("#netwgt_k").val(wgtk);
            if ( wgtp != 0)
            {
            var wgtp = ("0." + kyat[1]);
            }
            else var wgtp = 0;
            console.log("console k:", wgtk);
            console.log("console pae:", wgtp);

            $wgt_p = (parseFloat( wgtp * 16 )).toFixed(2) ;
            console.log ('console wgt_p:', $wgt_p);
            $p = (parseFloat( wgtp * 16 )).toFixed();
            $mmp = parseInt($p);
            
            var value = $wgt_p.toString(); 
            var result = [];
            var arrValue = value.split(".");
            result.push( arrValue );
            var valuep =  result[0];
            var wgtp = parseInt(valuep[0]);
            $("#netwgt_p").val(wgtp);
            if ( wgty != 0)
            {
            var wgty = ("0." + valuep[1]);
            }
            else var wgty = 0;
            console.log("console pae2:", wgtp);
            console.log("console y:", wgty);

            $wgt_y = parseFloat( wgty ) * 8;
            console.log ('console wgt_y:', $wgt_y);
            $y = parseFloat( wgty * 8).toFixed(0);
            $("#netwgt_y").val($y);         
        }
    });
    
    $("#givegold_gm").keypress(function(e){
        var keycode = (event.keyCode ? event.keyCode : event.which);

        if(keycode == '13' && event.key === "Enter")
        { 
            $("#givegold_k").val("");
            $("#givegold_p").val("");
            $("#givegold_y").val("");

            $CurrentGm = parseFloat($("#givegold_gm").val());
            console.log ('Gm :', $CurrentGm);
            $wgt_k = (parseFloat( $CurrentGm) / 16.6).toFixed(3) ;
            console.log ('wgt_k :', $wgt_k);
            $k = (parseFloat( $CurrentGm) / 16.6).toFixed();
            var value = $wgt_k.toString();
            var result = [];
            var arrValue = value.split(".");
            result.push( arrValue );
            console.log("result array:", result);
            var kyat =  result[0];
            var wgtk = parseInt(kyat[0]);
            $("#givegold_k").val(wgtk);
            if ( wgtp != 0)
            {
            var wgtp = ("0." + kyat[1]);
            }
            else var wgtp = 0;
            console.log("console k:", wgtk);
            console.log("console pae:", wgtp);

            $wgt_p = (parseFloat( wgtp * 16 )).toFixed(2) ;
            console.log ('console wgt_p:', $wgt_p);
            $p = (parseFloat( wgtp * 16 )).toFixed();
            $mmp = parseInt($p);
            
            var value = $wgt_p.toString(); 
            var result = [];
            var arrValue = value.split(".");
            result.push( arrValue );
            var valuep =  result[0];
            var wgtp = parseInt(valuep[0]);
            $("#givegold_p").val(wgtp);
            if ( wgty != 0)
            {
            var wgty = ("0." + valuep[1]);
            }
            else var wgty = 0;
            console.log("console pae2:", wgtp);
            console.log("console y:", wgty);

            $wgt_y = parseFloat( wgty ) * 8;
            console.log ('console wgt_y:', $wgt_y);
            $y = parseFloat( wgty * 8).toFixed(0);
            $("#givegold_y").val($y);   
            
            
        }
    });
     
    $("#tot_amount").keypress(function(e){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13' && event.key === "Enter")
        {           
            var tot_amount = $("#tot_amount").val();
            var tax = $("#tax").val();
            var discount = $("#discount").val();
            var net_amount = parseFloat(tot_amount) + parseFloat(tax) + parseFloat(discount);
            console.log("NET AMOUNT : ", net_amount);
            $("#net_amount").val(net_amount);   
        }
    });
    $("#tax").keypress(function(e){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13' && event.key === "Enter")
        {           
            var tot_amount = $("#tot_amount").val();
            var tax = $("#tax").val();
            var discount = $("#discount").val();
            var net_amount = parseFloat(tot_amount) + parseFloat(tax) + parseFloat(discount);
            console.log("NET AMOUNT : ", net_amount);
            $("#net_amount").val(net_amount);   
        }
    });
    $("#discount").keypress(function(e){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13' && event.key === "Enter")
        {           
            var tot_amount = $("#tot_amount").val();
            var tax = $("#tax").val();
            var discount = $("#discount").val();
            var net_amount = parseFloat(tot_amount) + parseFloat(tax) + parseFloat(discount);
            console.log("NET AMOUNT : ", net_amount);
            $("#net_amount").val(net_amount);   
        }
    });
    $("#advance_amount").keypress(function(e){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13' && event.key === "Enter")
        {           
            $tmptot_amount = $("#tot_amount").val();
            $tmpadvance_amount = $("#advance_amount").val();
            console.log("tmpadvance_amount :", $tmpadvance_amount)
            $tmpbalance_amount = $tmptot_amount - $tmpadvance_amount;
            $("#balance_amount").val($tmpbalance_amount);
            console.log("tmpbalance_amount :", $tmpbalance_amount)
        }
    });
});  