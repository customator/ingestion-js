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

function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = document.body;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}
}

window.onload = function(){
	console.log('Customator Loaded');
	var	lazyloader = document.createElement("script");
	lazyloader.type = "text/javascript";
	lazyloader.async = !0;
	lazyloader.src="http://customator.io/ingestion-js/js/lazyload.js";
	var n=document.getElementsByTagName("script")[0];
	n.parentNode.insertBefore(lazyloader,n);
	lazyloader.onload = function(){
		LazyLoad.js(['https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js', 'http://customator.io/ingestion-js/js/common-web.js'], function(){
			CommonWeb.Callback = function(collection, properties, callback){
				var s = serialize(properties);
				httpRequest.open("get", "http://128.199.64.221:9880/customator.dev?json="+encodeURIComponent(JSON.stringify(properties)), true);
				httpRequest.send();
			};
			CommonWeb.addGlobalProperties({
				page_info: {
					viewport_width: $(window).width(),
					viewport_height: $(window).height(),
					page_width: $(document).width(),
					page_height: $(document).height(),
				},
			});
			CommonWeb.trackSession('customator_guid');
			CommonWeb.trackPageview(function(){
				return {
					event: {
						'type' : 'page_view',
					},
				}
			});
      var elements = undefined;
      CommonWeb.trackClicks($("a"), function(event){
        mouse_coords = relMouseCoords(event);
        return {
          mouse_coords,
          time: {
          timestamp: (new Date).getTime(),
          },
        };
      });
			CommonWeb.trackClicksPassive($("input"), function(event){
				mouse_coords = relMouseCoords(event);
        return {
          mouse_coords,
          time: {
          timestamp: (new Date).getTime(),
          },
        };
			});
      CommonWeb.trackFormSubmissions();
		});
	}
}


