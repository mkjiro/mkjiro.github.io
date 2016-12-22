//参考サイト
//http://www.webopixel.net/lab/sample/12/0308scrollshow/pagetop-fade.html#
//トップへ戻る用
$(function() {
	var topBtn = $('#page-top');	
	topBtn.hide();
	$(window).scroll(function () {
		if ($(this).scrollTop() > 100) {
			topBtn.fadeIn();
		} else {
			topBtn.fadeOut();
		}
	});
	//スクロールしてトップ
    topBtn.click(function () {
		$('body,html').animate({
			scrollTop: 0
		}, 500);
		return false;
    });
});

//オマケスイルカ
$(function() {
	var iruka = $('#iruka');	
	iruka.hide();
	$(window).scroll(function () {
		if ($(this).scrollTop() > 100) {
			iruka.fadeIn();
		} else {
			iruka.fadeOut();
		}
	});
	//スクロールしてトップ
  iruka.click(function () {
	iruka.hide("slow");
	return false;
  });
});