var img = null;
var blist = [];
var sp = null;
$(document).ready(function(){
	$.getJSON('../js/system.json',function(data){
		sp = data;
	});
});

/**
 * 扫描成功之后内容设置
 * @param {Object} t 
 * @param {Object} r 条码值
 * @param {Object} f 文件路径
 */
function doScaned(t, r, f){
	if(blist.length == 0){
		$('#history').html('');
	}
	var d = new Date();
	var h=d.getHours(),m=d.getMinutes(),s=d.getSeconds(),ms=d.getMilliseconds();
	if(h < 10){ h='0'+h; }
	if(m < 10){ m='0'+m; }
	if(s < 10){ s='0'+s; }
	var ts = '['+h+':'+m+':'+s +']';
	var html = getHtml(blist.length, ts, r, 1);
	for(var i = blist.length; i>0; i--){
		if(blist[i-1].result !== ''){
			html += getHtml(i-1, blist[i-1].dt,blist[i-1].result,blist[i-1].cnt);
		}
	}
	$('#history').html(html);
	blist[blist.length] = {type:t,result:r,file:f,cnt:1,dt:ts};
	update(t, r, f);
}

/**
 * 生成DIV相应的HTML
 * @param {Object} divId DIVID
 * @param {Object} d 时间
 * @param {Object} r 条码
 * @param {Object} cnt 数量
 */
function getHtml(divId, d, r, cnt){
	var divHtmlStr = '<div id="' + divId + '" class="row div-list">';
	divHtmlStr += '<div class="col-xs-7">';
	divHtmlStr += '    <div>';
	divHtmlStr += d;
	divHtmlStr += '    </div>';
	divHtmlStr += '    <div>';
	divHtmlStr += r;
	divHtmlStr += '    </div>';
	divHtmlStr += '</div>';
	divHtmlStr += '<div class="col-xs-5">';
	divHtmlStr += '    <div class="col-xs-3"><img src="../img/num_minus.png" class="img-num minus-num" onclick="doMinus(this)" /></div>';
	divHtmlStr += '    <div class="col-xs-6"><input type="number" class="input-num" readonly="readonly" value="' + cnt + '" ></input></div>';
	divHtmlStr += '    <div class="col-xs-3"><img src="../img/num_add.png"  class="img-num add-num" onclick="doAdd(this)"  /></div>';
	divHtmlStr += '</div>';
	divHtmlStr += '<div style="clear:both;"></div>';
	divHtmlStr += '</div>';
	return divHtmlStr;
}


/**
 * 件数删减
 * @param {Object} obj
 */
function doMinus(obj){
	var cnt = $(obj).parent().next().children('.input-num').val();
	var idIndex = $(obj).parent().parent().parent().attr('id');
	var resNum = Number(cnt) - 1;
	if(resNum === 0){
		delected(idIndex);
		return;
	}
	blist[idIndex].cnt = resNum;
	$(obj).parent().next().children('.input-num').val(resNum);
}
/**
 * 件数增加 
 * @param {Object} obj
 */
function doAdd(obj){
	var cnt = $(obj).parent().prev().children(".input-num").val();
	var idIndex = $(obj).parent().parent().parent().attr('id');
	var resNum = Number(cnt) + 1;
	blist[idIndex].cnt = resNum;
	$(obj).parent().prev().children(".input-num").val(resNum);
}
/**
 * 删除数据
 * @param {Object} id
 */
function delected(id){
	var h = blist[id];
	plus.nativeUI.confirm('确定要删除' + h.result + '吗？',
	function(event){
		if(event.index === 0){
			$('#' + id).hide();
			blist[id] = {type:'',result:'',file:'',cnt:0};
		}
	});
}

/**
 * 页面下方日志更新
 * @param {Object} t 时间
 * @param {Object} r 条码
 * @param {Object} f 文件
 */
function update(t, r, f){
	outSet('扫描成功：');
	outLine(t);
	outLine(r);
	outLine('\n图片地址：'+f);
	if(!f || f=='null'){
		img.src = '../img/barcode.png';	
	} else{
		plus.io.resolveLocalFileSystemURL(f, function(entry){
			img.src=entry.toLocalURL();
		});
		//img.src = 'http://localhost:13131/'+f;
	}
}

function onempty(){
	if(window.plus){
		plus.nativeUI.alert('无扫描记录');
	} else {
		alert('无扫描记录');
	}
}

/**
 * 删除历史扫描记录
 */
function cleanHistroy(){
	if(blist.length > 0){
		$('#history').html('<div class="row div-list">无历史记录</div>');
		blist = [];
	}
	plus.io.resolveLocalFileSystemURL('_doc/barcode/', function(entry){
		entry.removeRecursively(function(){
			// Success
		}, function(e){
			//alert( "failed"+e.message );
		});
	});
}

/**
 * 上传数据
 */
function uploadInvoice(typeCd, reasonTxt){
	var reqData = new Object();
    reqData.shopId = sp.shopId;
    reqData.type = typeCd;
    reqData.reason = reasonTxt;
    reqData.barCodeItemLst = blist;
	doAjax({
            url : sp.serviceBaseUrl + '/rest/shop/upload_invoice',
            type : 'POST',
            dataType : "json",
            data : JSON.stringify(reqData),
            onSuccess : function(json) {
                plus.nativeUI.alert(json.optStr);
                cleanHistroy();
            }
        });
};