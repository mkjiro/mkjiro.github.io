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
	var srcData = src_ctx.getImageData(0, 0, src_canvas.width, src_canvas.height);
	//var dstData = src_ctx.createImageData(src_canvas.width, src_canvas.height);
	var dstData = src_ctx.getImageData(0, 0, src_canvas.width, src_canvas.height);
	var src = srcData.data;
	var dst = dstData.data;

	var zrs = 1;	//ずらしサイズ
	var blendlevel = 40;	//ブレンディングレベル
	for(var num = 0;num < comp.length;num++){
		var dnum = num;
		var snum = (num+zrs)%comp.length;
		var dy = parseInt(comp[num].y), dx = parseInt(comp[num].x);
		var sy = parseInt(comp[(num+zrs)%comp.length].y),sx = parseInt(comp[(num+zrs)%comp.length].x);
		for(var j = 0;j < comp[num].height;j++){
			for(var i = 0;i < comp[num].width;i++){
				var didx = ((i+dx) + (j+dy)*image.width)*4;
				var sidx = ((parseInt(i*(comp[snum].width/comp[dnum].width))+sx)
				 + (parseInt(j*(comp[snum].height/comp[dnum].height))+sy)*image.width)*4;
				//dstへsrcのトリミング範囲をコピー
				if((j < blendlevel || comp[num].height - blendlevel < j ) 
					||( i < blendlevel || comp[num].width - blendlevel < i )){
					//アルファブレンディングのパラメータ設定
					var alphaj = 1;
					if(j < blendlevel || comp[num].height - blendlevel < j)
						alphaj = j < blendlevel ? j / blendlevel :  (comp[num].height - j)/blendlevel;
					var alphai = 1;
					if(i < blendlevel || comp[num].width - blendlevel < i)
						alphai = i < blendlevel ? i / blendlevel :  (comp[num].width - i)/blendlevel;
					var alpha = (alphaj + alphai)/2;					 
					dst[didx+0] = (src[sidx+0] * alpha + dst[didx+0] * (1-alpha));
					dst[didx+1] = (src[sidx+1] * alpha + dst[didx+1] * (1-alpha));
					dst[didx+2] = (src[sidx+2] * alpha + dst[didx+2] * (1-alpha));
				}else{
					dst[didx+0] = src[sidx+0];
					dst[didx+1] = src[sidx+1];
					dst[didx+2] = src[sidx+2];
				}
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