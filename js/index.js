var callCW;

(function () {

  callCW = function($){
  // cookies
  // http://www.quirksmode.org/js/cookies.html
  function setCookie(name, value, ttl) {
    var expires = "";
    var cookieDomain = "";
    if (ttl) {
      var date = new Date();
          //Get the UUID from serverdate.setTime(date.getTime() + (ttl * 60 * 1000));
      expires = "; expires=" + date.toGMTString();
    }
    document.cookie = name + "=" + escape(value) + expires + cookieDomain + "; path=/";
  }

  function getCookie(name) {
    var i, c;
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (i = 0; i < ca.length; i++) {
      c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      //
      if (c.indexOf(nameEQ) === 0) {
        return unescape(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  function destroyCookie(name) {
    setCookie(name, "", -1);
  }

  var options = {
    pageviewsEventName: "pageviews",
    inputChangeEventName: "input-changes",
    clicksEventName: "clicks",
    formSubmissionsEventName: "form-submissions",
    callbackTimeout: 1000,
    globalProperties: {
      page_url: window.location.href,
      referrer_url: document.referrer
    }
  };

  // create a common namespace with options
  var CommonWeb = {
    options: options
  };

  CommonWeb.addGlobalProperties = function(properties) {
    $.extend(CommonWeb.options.globalProperties, properties);
  }

  // initiate user tracking, using a GUID stored in a cookie
  // The user can pass in a custom cookie name and custom GUID, if they would like
  CommonWeb.trackSession = function(cookieName, defaultGuid) {
    if(typeof(cookieName) !== "string") {
      cookieName = "common_web_guid";
    }

    // // Look for the GUID in the currently set cookies
    // var cookies = document.cookie.split('; ');
    // var guid = null;

    // for(var i=0; i < cookies.length; i++) {
    //   cookieParts = cookies[i].split('=')
    //   if(cookieParts[0] === cookieName) {
    //     // Got it!
    //     guid = cookieParts[1];
    //     break;
    //   }
    // }

    var visitor_id = getCookie(cookieName);
    //
    //Hard Coded COOKIE NAME CHANGE SOON
    //
    var visitId = getCookie('customator_visit');
    //Get the UUID from server
    genSub = function() {
          return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
    // We didn't find our guid in the cookies, so we need to generate our own
    if (!visitor_id) {
      var expiry_time = 2 * 365 * 24 * 60;
      setCookie(cookieName, guid, expiry_time);
    }
    // if(!guid) {
    //   if(typeof(defaultGuid) === "string") {
    //     guid = defaultGuid;
    //   } else {
    //     guid = genSub() + genSub() + "-" + genSub() + "-" + 
    //       genSub() + "-" + genSub() + "-" + genSub() + genSub() + genSub();
    //   }

    //   var expiry_time = 2 * 365 * 24 * 60;
    //   setCookie(cookieName, guid, expiry_time);
    //   //
    //   // expiration_date = new Date();
    //   // expiration_date.setFullYear(expiration_date.getFullYear() + 1);

    //   // cookie_string = cookieName + "=" + guid + "; path/; expires=" + expiration_date.toGMTString();
    //   // document.cookie = cookie_string

    // }

    if(!visitId) {
      visitId = genSub() + genSub() + "-" + genSub() + "-" + 
          genSub() + "-" + genSub() + "-" + genSub() + genSub() + genSub();

      var expiry_time = 4 * 60;
      setCookie('customator_visit', visitId, expiry_time);
    }

    
    CommonWeb.addGlobalProperties({visitor_id: guid, visit_id: visitId});

  }

  // setup pageview tracking hooks, optionally including more properties
  // more properties can also be a function
  // do not double set along with track!
  CommonWeb.trackPageview = function (moreProperties) {

    var defaultProperties = CommonWeb.options.globalProperties;
    var properties = $.extend(true, {}, defaultProperties, toProperties(moreProperties));

    CommonWeb.Callback(CommonWeb.options.pageviewsEventName, properties);

  }

  CommonWeb.trackClicks = function (elements, moreProperties) {

    if (typeof elements === 'undefined') {
      elements = $("a");
    }

    $.each(elements, function (index, element) {

      $(element).on('click', function (event) {

        var timer = CommonWeb.options.callbackTimeout;

        // combine local and global moreProperties
        var properties = toClickProperties(event, element, moreProperties);

        // check if the page is probably going to unload
        var pageWillUnload = element.href && element.target !== '_blank' && !isMetaKey(event);
        var unloadCallback = function () {
        };

        // if the page will unload, don't let the JS event bubble
        // but navigate to the href after the click
        if (pageWillUnload) {
          unloadCallback = function () {
            window.location.href = element.href;
          };
          event.preventDefault();

          setTimeout(function() {
            window.location.href = element.href;
          }, timer);
        }

        CommonWeb.Callback(options.clicksEventName, properties, unloadCallback);

      });

    });

  }

  // track things that are not links; i.e. don't need any special tricks to
  // prevent page unloads
  CommonWeb.trackClicksPassive = function (elements, moreProperties) {

    $.each(elements, function (index, element) {

      $(element).on('click', function (event) {

        var properties = toClickProperties(event, element, moreProperties);
        CommonWeb.Callback(options.clicksEventName, properties);

      });

    });

  }

  // track form submissions
  CommonWeb.trackFormSubmissions = function (elements, moreProperties) {

    if (typeof elements === 'undefined') {
      elements = $("form");
    }

    $.each(elements, function (index, element) {

      var timer = CommonWeb.options.callbackTimeout;

      // use to avoid duplicate submits
      var callbackCalled = false;

      $(element).on('submit', function (event) {

        var properties = toSubmitProperties(event, element, moreProperties);

        // assume true for now in this method
        var pageWillUnload = true;
        var unloadCallback = function () {
        };

        if (pageWillUnload) {

          unloadCallback = function () {

            // not the best approach here.
            // the form can only be submitted
            // once, etc.
            if (!callbackCalled) {
              callbackCalled = true;
              element.submit();
            }

          };

          event.preventDefault();

          // We only want to fire the timeout if
          // we know the page will unload. Ajax 
          // form submissions shouldn't submit.
          setTimeout(function() {
            callbackCalled = true;
            element.submit();
          }, timer);
        }

        CommonWeb.Callback(options.formSubmissionsEventName, properties, unloadCallback);

      });

    });
  }

  CommonWeb.trackInputChanges = function (elements, moreProperties) {

    if (typeof elements === 'undefined') {
      elements = $("input, textarea, select");
    }

    $.each(elements, function(index, element) {
      var currentValue = $(element).val()

      $(element).on('change', function(event) {

        var properties = toChangeProperties(event, element, currentValue, moreProperties);
        CommonWeb.Callback(options.inputChangeEventName, properties);

        currentValue = $(element).val()
      });

    });
  }

  // define a namespace just for transformations of events and elements to properties
  // override as a workaround to add / remove properties
  CommonWeb.Transformations = {

    eventToProperties: function (event) {

      var properties = {};

      properties['timestamp'] = event.timestamp;
      properties['type'] = event.type;
      properties['metaKey'] = event.metaKey;

      return properties;

    },

    elementToProperties: function (element, extraProperties) {

      var properties = extraProperties || {};

      // add the tag name
      properties.tagName = element.tagName;

      // add the inner text for some tag types
      if (element.tagName === 'A') {
        properties.text = element.innerText;
      }

      // add each attribute
      $(element.attributes).each(function (index, attr) {
        properties[attr.nodeName] = attr.value;
      });

      // break classes out into an array if any exist
      var classes = $(element).attr('class');
      if (classes) {
        properties['classes'] = classes.split(/\s+/)
      }

      properties['path'] = $(element).getPath();

      return properties;

    },

    formElementToProperties: function (formElement) {

      var formValues = {};

      // TODO: remove dependency on jQuery
      formValues.form_values = $(formElement).serializeArray();
      // simple alias for now, but could do more as
      // far as the form values are concerned
      return this.elementToProperties(formElement, formValues);

    },

    inputElementToProperties: function(inputElement) {

      var inputValues = {
        value: $(inputElement).val()
      };

      var parentForm = $(inputElement).closest("form");
      if(parentForm.size() > 0) {
        inputValues.form = this.elementToProperties(parentForm[0])
      }

      return this.elementToProperties(inputElement, inputValues);

    }

  }

  function toClickProperties(event, element, moreProperties) {

    var defaultProperties = CommonWeb.options.globalProperties;
    var properties = $.extend(true, {}, defaultProperties, toProperties(moreProperties, [event, element]));

    var elementProperties = { element: CommonWeb.Transformations.elementToProperties(element, null) };
    var eventProperties = { event: CommonWeb.Transformations.eventToProperties(event) };

    return $.extend(true, {}, properties, elementProperties, eventProperties);

  }

  function toChangeProperties(event, element, previousValue, moreProperties) {

    var defaultProperties = CommonWeb.options.globalProperties;
    var properties = $.extend(true, {}, defaultProperties, toProperties(moreProperties, [event, element]));

    var elementProperties = { element: CommonWeb.Transformations.inputElementToProperties(element) };
    if(previousValue && previousValue !== "") {
      elementProperties.element.previousValue = previousValue
    }

    var eventProperties = { event: CommonWeb.Transformations.eventToProperties(event) };

    return $.extend(true, {}, properties, elementProperties, eventProperties);
  }

  function toSubmitProperties(event, element, moreProperties) {

    var defaultProperties = CommonWeb.options.globalProperties;
    var properties = $.extend(true, {}, defaultProperties, toProperties(moreProperties, [event, element]));

    var elementProperties = { element: CommonWeb.Transformations.formElementToProperties(element) };
    var eventProperties = { event: CommonWeb.Transformations.eventToProperties(event) };

    return $.extend(true, {}, properties, elementProperties, eventProperties);

  }

  function toProperties(propertiesOrFunction, args) {
    if (typeof propertiesOrFunction === 'function') {
      return propertiesOrFunction.apply(window, args);
    } else {
      return propertiesOrFunction
    }
  }

  function isMetaKey(event) {
    return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
  }

  /*
   jQuery-GetPath v0.01, by Dave Cardwell. (2007-04-27)

   http://davecardwell.co.uk/javascript/jquery/plugins/jquery-getpath/

   Copyright (c)2007 Dave Cardwell. All rights reserved.
   Released under the MIT License.


   Usage:
   var path = $('#foo').getPath();
   */
  jQuery.fn.extend({
    getPath: function( path ) {
      // The first time this function is called, path won't be defined.
      if ( typeof path == 'undefined' ) path = '';

      // If this element is <html> we've reached the end of the path.
      if ( this.is('html') )
        return 'html' + path;

      // Add the element name.
      var cur = this.get(0).nodeName.toLowerCase();

      // Determine the IDs and path.
      var id    = this.attr('id'),
        klass = this.attr('class');

      // Add the #id if there is one.
      if ( typeof id != 'undefined' )
        cur += '#' + id;

      // Add any classes.
      if ( typeof klass != 'undefined' )
      cur += '.' + klass.split(/[\s\n]+/).join('.');

      // Recurse up the DOM.
      return this.parent().getPath( ' > ' + cur + path );
    }
  });

  // backends

  CommonWeb.Keen = {
    Client: null,
    Debug: false,
    Callback: function (collection, properties, callback) {
      CommonWeb.Keen.Client.addEvent(collection, properties, function() {
        if (CommonWeb.Keen.Debug) {
          console.log(collection + ": " + JSON.stringify(properties));
        }
        if (callback) {
          callback();
        }
      });
    },
    globalProperties: {
      keen: {
        addons: [
          {
            "name": "keen:ip_to_geo",
            "input": {
              "ip": "ip_address"
            },
            "output": "ip_geo_info"
          },
          {
            "name": "keen:ua_parser",
            "input": {
              "ua_string": "user_agent"
            },
            "output": "parsed_user_agent"
          },
          {
            "name": "keen:url_parser",
            "input": {
              "url": "page_url"
            },
            "output": "parsed_page_url"
          },
          {
            "name": "keen:referrer_parser",
            "input": {
              "referrer_url": "referrer_url",
              "page_url": "page_url"
            },
            "output": "referrer_info"
          }
        ]
      },
      ip_address: "${keen.ip}",
      user_agent: "${keen.user_agent}"
    }
  };

  window.CommonWeb = CommonWeb;

  }

})();



LazyLoad = (function (doc) {
  // -- Private Variables ------------------------------------------------------

  // User agent and feature test information.
  var env,

  // Reference to the <head> element (populated lazily).
  head,

  // Requests currently in progress, if any.
  pending = {},

  // Number of times we've polled to check whether a pending stylesheet has
  // finished loading. If this gets too high, we're probably stalled.
  pollCount = 0,

  // Queued requests.
  queue = {css: [], js: []},

  // Reference to the browser's list of stylesheets.
  styleSheets = doc.styleSheets;

  // -- Private Methods --------------------------------------------------------

  /**
  Creates and returns an HTML element with the specified name and attributes.

  @method createNode
  @param {String} name element name
  @param {Object} attrs name/value mapping of element attributes
  @return {HTMLElement}
  @private
  */
  function createNode(name, attrs) {
    var node = doc.createElement(name), attr;

    for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        node.setAttribute(attr, attrs[attr]);
      }
    }

    return node;
  }

  /**
  Called when the current pending resource of the specified type has finished
  loading. Executes the associated callback (if any) and loads the next
  resource in the queue.

  @method finish
  @param {String} type resource type ('css' or 'js')
  @private
  */
  function finish(type) {
    var p = pending[type],
        callback,
        urls;

    if (p) {
      callback = p.callback;
      urls     = p.urls;

      urls.shift();
      pollCount = 0;

      // If this is the last of the pending URLs, execute the callback and
      // start the next request in the queue (if any).
      if (!urls.length) {
        callback && callback.call(p.context, p.obj);
        pending[type] = null;
        queue[type].length && load(type);
      }
    }
  }

  /**
  Populates the <code>env</code> variable with user agent and feature test
  information.

  @method getEnv
  @private
  */
  function getEnv() {
    var ua = navigator.userAgent;

    env = {
      // True if this browser supports disabling async mode on dynamically
      // created script nodes. See
      // http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
      async: doc.createElement('script').async === true
    };

    (env.webkit = /AppleWebKit\//.test(ua))
      || (env.ie = /MSIE|Trident/.test(ua))
      || (env.opera = /Opera/.test(ua))
      || (env.gecko = /Gecko\//.test(ua))
      || (env.unknown = true);
  }

  /**
  Loads the specified resources, or the next resource of the specified type
  in the queue if no resources are specified. If a resource of the specified
  type is already being loaded, the new request will be queued until the
  first request has been finished.

  When an array of resource URLs is specified, those URLs will be loaded in
  parallel if it is possible to do so while preserving execution order. All
  browsers support parallel loading of CSS, but only Firefox and Opera
  support parallel loading of scripts. In other browsers, scripts will be
  queued and loaded one at a time to ensure correct execution order.

  @method load
  @param {String} type resource type ('css' or 'js')
  @param {String|Array} urls (optional) URL or array of URLs to load
  @param {Function} callback (optional) callback function to execute when the
    resource is loaded
  @param {Object} obj (optional) object to pass to the callback function
  @param {Object} context (optional) if provided, the callback function will
    be executed in this object's context
  @private
  */
  function load(type, urls, callback, obj, context) {
    var _finish = function () { finish(type); },
        isCSS   = type === 'css',
        nodes   = [],
        i, len, node, p, pendingUrls, url;

    env || getEnv();

    if (urls) {
      // If urls is a string, wrap it in an array. Otherwise assume it's an
      // array and create a copy of it so modifications won't be made to the
      // original.
      urls = typeof urls === 'string' ? [urls] : urls.concat();

      // Create a request object for each URL. If multiple URLs are specified,
      // the callback will only be executed after all URLs have been loaded.
      //
      // Sadly, Firefox and Opera are the only browsers capable of loading
      // scripts in parallel while preserving execution order. In all other
      // browsers, scripts must be loaded sequentially.
      //
      // All browsers respect CSS specificity based on the order of the link
      // elements in the DOM, regardless of the order in which the stylesheets
      // are actually downloaded.
      if (isCSS || env.async || env.gecko || env.opera) {
        // Load in parallel.
        queue[type].push({
          urls    : urls,
          callback: callback,
          obj     : obj,
          context : context
        });
      } else {
        // Load sequentially.
        for (i = 0, len = urls.length; i < len; ++i) {
          queue[type].push({
            urls    : [urls[i]],
            callback: i === len - 1 ? callback : null, // callback is only added to the last URL
            obj     : obj,
            context : context
          });
        }
      }
    }

    // If a previous load request of this type is currently in progress, we'll
    // wait our turn. Otherwise, grab the next item in the queue.
    if (pending[type] || !(p = pending[type] = queue[type].shift())) {
      return;
    }

    head || (head = doc.head || doc.getElementsByTagName('head')[0]);
    pendingUrls = p.urls.concat();

    for (i = 0, len = pendingUrls.length; i < len; ++i) {
      url = pendingUrls[i];

      if (isCSS) {
          node = env.gecko ? createNode('style') : createNode('link', {
            href: url,
            rel : 'stylesheet'
          });
      } else {
        node = createNode('script', {src: url});
        node.async = false;
      }

      node.className = 'lazyload';
      node.setAttribute('charset', 'utf-8');

      if (env.ie && !isCSS && 'onreadystatechange' in node && !('draggable' in node)) {
        node.onreadystatechange = function () {
          if (/loaded|complete/.test(node.readyState)) {
            node.onreadystatechange = null;
            _finish();
          }
        };
      } else if (isCSS && (env.gecko || env.webkit)) {
        // Gecko and WebKit don't support the onload event on link nodes.
        if (env.webkit) {
          // In WebKit, we can poll for changes to document.styleSheets to
          // figure out when stylesheets have loaded.
          p.urls[i] = node.href; // resolve relative URLs (or polling won't work)
          pollWebKit();
        } else {
          // In Gecko, we can import the requested URL into a <style> node and
          // poll for the existence of node.sheet.cssRules. Props to Zach
          // Leatherman for calling my attention to this technique.
          node.innerHTML = '@import "' + url + '";';
          pollGecko(node);
        }
      } else {
        node.onload = node.onerror = _finish;
      }

      nodes.push(node);
    }

    for (i = 0, len = nodes.length; i < len; ++i) {
      head.appendChild(nodes[i]);
    }
  }

  /**
  Begins polling to determine when the specified stylesheet has finished loading
  in Gecko. Polling stops when all pending stylesheets have loaded or after 10
  seconds (to prevent stalls).

  Thanks to Zach Leatherman for calling my attention to the @import-based
  cross-domain technique used here, and to Oleg Slobodskoi for an earlier
  same-domain implementation. See Zach's blog for more details:
  http://www.zachleat.com/web/2010/07/29/load-css-dynamically/

  @method pollGecko
  @param {HTMLElement} node Style node to poll.
  @private
  */
  function pollGecko(node) {
    var hasRules;

    try {
      // We don't really need to store this value or ever refer to it again, but
      // if we don't store it, Closure Compiler assumes the code is useless and
      // removes it.
      hasRules = !!node.sheet.cssRules;
    } catch (ex) {
      // An exception means the stylesheet is still loading.
      pollCount += 1;

      if (pollCount < 200) {
        setTimeout(function () { pollGecko(node); }, 50);
      } else {
        // We've been polling for 10 seconds and nothing's happened. Stop
        // polling and finish the pending requests to avoid blocking further
        // requests.
        hasRules && finish('css');
      }

      return;
    }

    // If we get here, the stylesheet has loaded.
    finish('css');
  }

  /**
  Begins polling to determine when pending stylesheets have finished loading
  in WebKit. Polling stops when all pending stylesheets have loaded or after 10
  seconds (to prevent stalls).

  @method pollWebKit
  @private
  */
  function pollWebKit() {
    var css = pending.css, i;

    if (css) {
      i = styleSheets.length;

      // Look for a stylesheet matching the pending URL.
      while (--i >= 0) {
        if (styleSheets[i].href === css.urls[0]) {
          finish('css');
          break;
        }
      }

      pollCount += 1;

      if (css) {
        if (pollCount < 200) {
          setTimeout(pollWebKit, 50);
        } else {
          // We've been polling for 10 seconds and nothing's happened, which may
          // indicate that the stylesheet has been removed from the document
          // before it had a chance to load. Stop polling and finish the pending
          // request to prevent blocking further requests.
          finish('css');
        }
      }
    }
  }

  return {

    /**
    Requests the specified CSS URL or URLs and executes the specified
    callback (if any) when they have finished loading. If an array of URLs is
    specified, the stylesheets will be loaded in parallel and the callback
    will be executed after all stylesheets have finished loading.

    @method css
    @param {String|Array} urls CSS URL or array of CSS URLs to load
    @param {Function} callback (optional) callback function to execute when
      the specified stylesheets are loaded
    @param {Object} obj (optional) object to pass to the callback function
    @param {Object} context (optional) if provided, the callback function
      will be executed in this object's context
    @static
    */
    css: function (urls, callback, obj, context) {
      load('css', urls, callback, obj, context);
    },

    /**
    Requests the specified JavaScript URL or URLs and executes the specified
    callback (if any) when they have finished loading. If an array of URLs is
    specified and the browser supports it, the scripts will be loaded in
    parallel and the callback will be executed after all scripts have
    finished loading.

    Currently, only Firefox and Opera support parallel loading of scripts while
    preserving execution order. In other browsers, scripts will be
    queued and loaded one at a time to ensure correct execution order.

    @method js
    @param {String|Array} urls JS URL or array of JS URLs to load
    @param {Function} callback (optional) callback function to execute when
      the specified scripts are loaded
    @param {Object} obj (optional) object to pass to the callback function
    @param {Object} context (optional) if provided, the callback function
      will be executed in this object's context
    @static
    */
    js: function (urls, callback, obj, context) {
      load('js', urls, callback, obj, context);
    }

  };
})(this.document);

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

    return {mouse_position_x:canvasX, mouse_position_y:canvasY}
}

function applyPatches(){
  currentLocation = window.location.pathname;
  if (patches.hasOwnProperty(currentLocation)) {
    patches[currentLocation].forEach(function(p){
      var patch_payload = {}
      patch_payload[p["type"]+"_id"] = p["id"];
      patch_payload["element"] = p["element"];
      patch_payload["event"] = "impression";
      // console.log("Applying patch for " + p["type"] + " " + p["id"]);
      // trackImpression(patch_payload);
      var fn = new Function(p["element"]);
      fn();
    });
  }
};
function applyTrackers(){
  currentLocation = window.location.pathname;
  if (trackers.hasOwnProperty(currentLocation)) {
    trackers[currentLocation].forEach(function(p){
      var track_payload = {}
      track_payload["goal_id"] = p["id"];
      track_payload["element"] = p["element"];
      track_payload["event"] = "click";
      track_payload["eventtype"] = "goal";
      // console.log(JSON.stringify(tracking));
      var fn = new Function(p["element"]);
      trackClicks(fn(), track_payload);
    });
  }
};

function trackClicks(element, payload){
  if (window.CommonWeb){
    console.log(element);
    CommonWeb.trackClicks(element, function(event){
      mouse_coords = relMouseCoords(event);
        return {
          mouse_coords,
          timestamp: (new Date).getTime(),
          payload,
        }
    });
  }

}

function beginTracking(){
      applyPatches();
      callCW(window.jQuery);
      applyTrackers();
      console.log('Before Callback');
      CommonWeb.Callback = function(collection, properties, callback){
        var s = serialize(properties);
        httpRequest.open("get", "http://128.199.64.221:9880/customator.dev?json="+encodeURIComponent(JSON.stringify(properties)), true);
        httpRequest.send();
      };
      var globalProperties = {};
      globalProperties['viewport_width'] = $(window).width();
      globalProperties['viewport_height'] = $(window).height();
      globalProperties['page_width'] = $(document).width();
      globalProperties['page_height'] = $(document).height();
      for (var attr in tracking) {
        globalProperties[attr] = tracking[attr];
      }
      console.log(globalProperties);
      CommonWeb.addGlobalProperties(globalProperties);
      CommonWeb.trackSession('customator_guid');
      CommonWeb.trackPageview(function(){
        return {
          event: 'page_view'
          }
      });
      currentLocation = window.location.pathname;
      CommonWeb.trackFormSubmissions();
}

window.onload = function(){
	console.log('Customator Loaded');
  console.log(window.location.pathname);
  var libs_to_load = []
  if (!window.jQuery){
    console.log('No jQuery');
    libs_to_load.unshift('https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js');
    LazyLoad.js(libs_to_load, function(){
        beginTracking();
  	});
  }
  else {
    beginTracking();
  }
}

var patches = {"/Customator/index.html":[{"id":8,"type":"vars","element":"$(\".brands__list-item\").css(\"background-color\",\"blue\");"}]}

var tracking = {
  "test": "a",
  "test 2": ["a", "b", "c"],
}

var guid = '';

var trackers={"/Customator/index.html":[{"id":2,"element":"$(\"#thelink\")"}]}; 
