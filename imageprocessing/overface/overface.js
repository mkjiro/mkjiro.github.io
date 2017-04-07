// キャンバス
var src_canvas;
var src_ctx;
var checknum;	//処理番号

// イメージ
var image;

window.onload = function () {
	src_canvas = document.getElementById("SrcCanvas");
	src_ctx = src_canvas.getContext("2d");

	image = document.getElementById("image_source");
}

// ドラッグオーバー
function onDragOver(event) {
	event.preventDefault();
}

// ドロップ    
function onDrop(event) {
	onAddFile(event);
	event.preventDefault();
}

// ユーザーによりファイルが追加された  
function onAddFile(event) {
	var files;
	var reader = new FileReader();

	if (event.target.files) {
		files = event.target.files;
	} else {
		files = event.dataTransfer.files;
	}

	// ファイルが読み込まれた
	reader.onload = function (event) {
		//選択されているラジオボタンをチェック
		if(document.effectCheck.Radio1.checked == true){
			checknum = 1;
		}else if(document.effectCheck.Radio2.checked == true){
			checknum = 2;
		}else if(document.effectCheck.Radio3.checked == true){
			checknum = 3;
		}else if(document.effectCheck.Radio4.checked == true){
			checknum = 4;
		}else{
			checknum = 1;
		}

		// イメージが読み込まれた
		image.onload = function () {

			src_canvas.width = image.width;
			src_canvas.height = image.height;
			src_ctx.clearRect(0,0,src_canvas.width,src_ctx.height);	//一旦クリアする（大事）
			src_ctx.drawImage(image, 0, 0);

			console.time('処理');

			// 顔検出
			var comp = ccv.detect_objects({
				"canvas": ccv.grayscale(ccv.pre(image)),
				"cascade": cascade,
				"interval": 100,		//検出精度。値を大きくすると処理がその分かかる
				"min_neighbors": 1
			});

			// 結果の表示
			switch(checknum){
				case 1:
					drawRedRect(comp);
					break;
				case 2:
					mosaic(comp);
					break;
				case 3:
					overlapWaraiface(comp);
					break;
				case 4:
					shuffleFaces(comp);
					break;
				default:
					drawRedRect(comp);
			}

			if (comp.length === 0) {
				console.log('顔を検出できませんでした。');
			}

			console.timeEnd('処理');
		};

		// イメージが読み込めない
		image.onerror = function () {
			alert('このファイルは読み込めません。');
		};

		image.src = reader.result;
	};

	if (files[0]) {
		reader.readAsDataURL(files[0]);
	}
}

//赤枠で囲む
function drawRedRect(comp){
	src_ctx.lineWidth = 2;
	src_ctx.strokeStyle = "#ff0000";

	for (var i = 0; i < comp.length; i++) {
		src_ctx.strokeRect(comp[i].x, comp[i].y, comp[i].width, comp[i].height);
	}
}

//モザイク処理をする
function mosaic(comp){
	var srcData = src_ctx.getImageData(0, 0, src_canvas.width, src_canvas.height);
	//var dstData = src_ctx.createImageData(src_canvas.width, src_canvas.height);
	var dstData = src_ctx.getImageData(0, 0, src_canvas.width, src_canvas.height);
	var src = srcData.data;
	var dst = dstData.data;

	for(var num = 0;num < comp.length;num++){
		var y = parseInt(comp[num].y), x = parseInt(comp[num].x);
		var mosaicLevel = 10;
		for(var j = y;j < y+comp[num].height;j+=mosaicLevel){
			for(var i = x;i < x+comp[num].width;i+=mosaicLevel){
				//平均値を求める
				var ave = {r:0,g:0,b:0};
				for(var rj = 0;rj < mosaicLevel;rj++){
					for(var ri = 0; ri < mosaicLevel;ri++){
						var idx = ((i+ri) + (j+rj)*image.width)*4;
						ave.b += src[idx+0];
						ave.g += src[idx+1];
						ave.r += src[idx+2];					
					}
				}
				ave.b /= mosaicLevel*mosaicLevel;
				ave.g /= mosaicLevel*mosaicLevel;
				ave.r /= mosaicLevel*mosaicLevel;
				//平均値を画素値にする
				for(var rj = 0;rj < mosaicLevel;rj++){
					for(var ri = 0; ri < mosaicLevel;ri++){
						var idx = ((i+ri) + (j+rj)*image.width)*4;
						dst[idx+0] = ave.b;
						dst[idx+1] = ave.g;
						dst[idx+2] = ave.r;
					}
				}
			}
		}
	}
	src_ctx.putImageData(dstData, 0, 0);
}

//笑い男処理をする
function overlapWaraiface(comp){
	var waraiimg = new Image();
	waraiimg.src = "waraiface.png";
	waraiimg.onload = function(){
		for(var num = 0;num < comp.length;num++){
			src_ctx.drawImage(waraiimg,parseInt(comp[num].x),parseInt(comp[num].y),comp[num].width,comp[num].height);
		}
	}
	// var waraiimg = new Image();
	// waraiimg.src = "waraiface.png";
	// waraiimg.addEventListener("load",function(){
	// 		src_ctx.drawImage(waraiimg,parseInt(comp[0].x),parseInt(comp[0].y),comp[0].width,comp[0].height);
	// 	},false);		
	
}

//顔面をシャッフルする
function shuffleFaces(comp){
	var srcData = src_ctx.getImageData(0, 0, src_canvas.width, src_canvas.height);	//入力画像（貼り付ける顔）
	//var dstData = src_ctx.createImageData(src_canvas.width, src_canvas.height);
	var dstData = src_ctx.getImageData(0, 0, src_canvas.width, src_canvas.height);	//出力画像（下の顔）
	var src = srcData.data;
	var dst = dstData.data;

	var zrs = 1;				//ずらしサイズ
	var blenddistraito = 0.7;	//ブレンディングを行う距離（画像端がスタートで中心がゴール：0～1）
	for(var num = 0;num < comp.length;num++){
		var dnum = num;
		var snum = (num+zrs)%comp.length;
		var dy = parseInt(comp[num].y), dx = parseInt(comp[num].x);
		var sy = parseInt(comp[(num+zrs)%comp.length].y),sx = parseInt(comp[(num+zrs)%comp.length].x);
		var dhalfwidth = comp[num].width/2;
		var dhalfheight = comp[num].height/2;
		var dwmax = dhalfwidth;
		var dwmin = dhalfwidth*blenddistraito;
		var dhmax = dhalfheight;
		var dhmin = dhalfheight*blenddistraito;
		//貼り付け先の平均色を求める
		var avecolor = {r:0,g:0,b:0};
		var limitsimilarity = 20;
		for(var j = 0;j < comp[dnum].height;j++){
			for(var i = 0;i < comp[dnum].width;i++){
				var didx = ((i+dx) + (j+dy)*image.width)*4;
				avecolor.r += dst[didx+0];
				avecolor.g += dst[didx+1];
				avecolor.b += dst[didx+2];
			}
		}
		avecolor.r /= comp[dnum].height*comp[dnum].width;
		avecolor.g /= comp[dnum].height*comp[dnum].width;
		avecolor.b /= comp[dnum].height*comp[dnum].width;

		console.log(comp[num]);

		//dstへsrcのトリミング範囲をコピー
		for(var j = 0;j < comp[num].height;j++){
			for(var i = 0;i < comp[num].width;i++){
				var didx = ((i+dx) + (j+dy)*image.width)*4;
				var sidx = ((parseInt(i*(comp[snum].width/comp[dnum].width))+sx)	//ニアレストネイバー
				 + (parseInt(j*(comp[snum].height/comp[dnum].height))+sy)*image.width)*4;
				//色合いを似せる(予定)
				var alpha;	//アルファブレンディングのパラメータ設定(交換先画像：0～1：交換元画像)
				var dis = Math.sqrt(Math.pow(j-dhalfheight,2) + Math.pow(i-dhalfwidth,2));	//中心からの長さ
				if(comp[num].width < comp[num].height){
					alpha = (dis - dwmin)/(dwmax - dwmin);
				}else{
					alpha = (dis - dhmin)/(dhmax - dhmin);
				}
				//console.log(alpha);
				alpha = alpha < 1.0 ? alpha : 1.0;
				alpha = alpha > 0.0 ? alpha : 0.0;
				//貼り付け先の色が平均値に近い場合は貼り付け先の色にする
				var diff = (Math.abs(avecolor.r - dst[didx+0]) + Math.abs(avecolor.g - dst[didx+1]) + Math.abs(avecolor.b - dst[didx+2]));
				if(limitsimilarity > diff){
					//alpha = 1.0;
				}													 
				//アルファブレンディング
				dst[didx+0] = (src[sidx+0] * (1-alpha) + dst[didx+0] * (alpha));
				dst[didx+1] = (src[sidx+1] * (1-alpha) + dst[didx+1] * (alpha));
				dst[didx+2] = (src[sidx+2] * (1-alpha) + dst[didx+2] * (alpha));
			}
		}
	}
	src_ctx.putImageData(dstData, 0, 0);
}

//ピクセル値を返す
function getPixel(img,y,x,k){
	y = parseInt(y), x = parseInt(x);
	console.log("sum:"+ image.width*image.height*3 + " y:" + y + " x:" + x);
	var idx = (x + y*image.width)*4;
	console.log(idx);
	return img.data[idx+k];
}