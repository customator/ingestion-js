var httpRequest = new XMLHttpRequest();

serialize = function(obj, prefix) {
  var str = [];
  for(var p in obj) {
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
      str.push(typeof v == "object" ?
        serialize(v, k) :
        encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
  }
  return str.join("&");
}

window.onload = function(){
	console.log('Loaded');
	var	lazyloader = document.createElement("script");
	lazyloader.type = "text/javascript";
	lazyloader.async = !0;
	lazyloader.src="https://f2be67ea0ae8d203e5c981405fe4519423aee692.googledrive.com/host/0B6BJml1-TTkLfkxhMjRDRGc1Q0RfWXdyd3h3QThPWlpoZjh0NXBYek1LVUVDY01URExjcGs/lazyload.js";
	var n=document.getElementsByTagName("script")[0];
	n.parentNode.insertBefore(lazyloader,n);
	lazyloader.onload = function(){
		LazyLoad.js(['https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js', 'https://f2be67ea0ae8d203e5c981405fe4519423aee692.googledrive.com/host/0B6BJml1-TTkLfkxhMjRDRGc1Q0RfWXdyd3h3QThPWlpoZjh0NXBYek1LVUVDY01URExjcGs/common-web.min.js'], function(){
			CommonWeb.Callback = function(collection, properties, callback){
				console.log(properties);
				var s = serialize(properties);
				console.log(s)
			};
			CommonWeb.trackSession();
			CommonWeb.trackPageview();
			CommonWeb.trackClicksPassive($("input"));
			CommonWeb.trackClicks();
			$('#thebutton').click(function(event){
				console.log('here');
				$('#thebutton').val('Hi!!!!');
			});
		});
	}
}


