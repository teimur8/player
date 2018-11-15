document.createElement("video");
document.createElement("audio");
document.createElement("track");
var vjs = function(id, options, ready) {
    var tag;
    if (typeof id === "string") {
        if (id.indexOf("#") === 0) {
            id = id.slice(1)
        }
        if (vjs.players[id]) {
            if (options) {
                vjs.log.warn('Player "' + id + '" is already initialised. Options will not be applied.')
            }
            if (ready) {
                vjs.players[id].ready(ready)
            }
            return vjs.players[id]
        } else {
            tag = vjs.el(id)
        }
    } else {
        tag = id
    }
    if (!tag || !tag.nodeName) {
        throw new TypeError("The element or ID supplied is not valid. (videojs)")
    }
    return tag["player"] || new vjs.Player(tag, options, ready)
};
var videojs = window["videojs"] = vjs;
vjs.CDN_VERSION = "4.12";
vjs.ACCESS_PROTOCOL = "https:" == document.location.protocol ? "https://" : "http://";
vjs["VERSION"] = "4.12.6";
vjs.options = {
    techOrder: ["html5", "flash"],
    html5: {},
    flash: {},
    defaultVolume: .85,
    playbackRates: [],
    inactivityTimeout: 2e3,
    children: {
        mediaLoader: {},
        posterImage: {},
        loadingSpinner: {},
        bigPlayButton: {},
        controlBar: {}
    },
    language: document.getElementsByTagName("html")[0].getAttribute("lang") || navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language || "en",
    languages: {},
    notSupportedMessage: "No compatible source was found for this video."
};
if (vjs.CDN_VERSION !== "GENERATED" + "_CDN_VSN") {
    videojs.options["flash"]["swf"] = vjs.ACCESS_PROTOCOL + "vjs.zencdn.net/" + vjs.CDN_VERSION + "/video-js.swf"
}
vjs.addLanguage = function(code, data) {
    if (vjs.options["languages"][code] !== undefined) {
        vjs.options["languages"][code] = vjs.util.mergeOptions(vjs.options["languages"][code], data)
    } else {
        vjs.options["languages"][code] = data
    }
    return vjs.options["languages"]
};
vjs.players = {};
if (typeof define === "function" && define["amd"]) {
    define("videojs", [], function() {
        return videojs
    })
} else if (typeof exports === "object" && typeof module === "object") {
    module["exports"] = videojs
}
vjs.CoreObject = vjs["CoreObject"] = function() {};
vjs.CoreObject.extend = function(props) {
    var init, subObj;
    props = props || {};
    init = props["init"] || props.init || this.prototype["init"] || this.prototype.init || function() {};
    subObj = function() {
        init.apply(this, arguments)
    };
    subObj.prototype = vjs.obj.create(this.prototype);
    subObj.prototype.constructor = subObj;
    subObj.extend = vjs.CoreObject.extend;
    subObj.create = vjs.CoreObject.create;
    for (var name in props) {
        if (props.hasOwnProperty(name)) {
            subObj.prototype[name] = props[name]
        }
    }
    return subObj
};
vjs.CoreObject.create = function() {
    var inst = vjs.obj.create(this.prototype);
    this.apply(inst, arguments);
    return inst
};
vjs.on = function(elem, type, fn) {
    if (vjs.obj.isArray(type)) {
        return _handleMultipleEvents(vjs.on, elem, type, fn)
    }
    var data = vjs.getData(elem);
    if (!data.handlers) data.handlers = {};
    if (!data.handlers[type]) data.handlers[type] = [];
    if (!fn.guid) fn.guid = vjs.guid++;
    data.handlers[type].push(fn);
    if (!data.dispatcher) {
        data.disabled = false;
        data.dispatcher = function(event) {
            if (data.disabled) return;
            event = vjs.fixEvent(event);
            var handlers = data.handlers[event.type];
            if (handlers) {
                var handlersCopy = handlers.slice(0);
                for (var m = 0, n = handlersCopy.length; m < n; m++) {
                    if (event.isImmediatePropagationStopped()) {
                        break
                    } else {
                        handlersCopy[m].call(elem, event)
                    }
                }
            }
        }
    }
    if (data.handlers[type].length == 1) {
        if (elem.addEventListener) {
            elem.addEventListener(type, data.dispatcher, false)
        } else if (elem.attachEvent) {
            elem.attachEvent("on" + type, data.dispatcher)
        }
    }
};
vjs.off = function(elem, type, fn) {
    if (!vjs.hasData(elem)) return;
    var data = vjs.getData(elem);
    if (!data.handlers) {
        return
    }
    if (vjs.obj.isArray(type)) {
        return _handleMultipleEvents(vjs.off, elem, type, fn)
    }
    var removeType = function(t) {
        data.handlers[t] = [];
        vjs.cleanUpEvents(elem, t)
    };
    if (!type) {
        for (var t in data.handlers) removeType(t);
        return
    }
    var handlers = data.handlers[type];
    if (!handlers) return;
    if (!fn) {
        removeType(type);
        return
    }
    if (fn.guid) {
        for (var n = 0; n < handlers.length; n++) {
            if (handlers[n].guid === fn.guid) {
                handlers.splice(n--, 1)
            }
        }
    }
    vjs.cleanUpEvents(elem, type)
};
vjs.cleanUpEvents = function(elem, type) {
    var data = vjs.getData(elem);
    if (data.handlers[type].length === 0) {
        delete data.handlers[type];
        if (elem.removeEventListener) {
            elem.removeEventListener(type, data.dispatcher, false)
        } else if (elem.detachEvent) {
            elem.detachEvent("on" + type, data.dispatcher)
        }
    }
    if (vjs.isEmpty(data.handlers)) {
        delete data.handlers;
        delete data.dispatcher;
        delete data.disabled
    }
    if (vjs.isEmpty(data)) {
        vjs.removeData(elem)
    }
};
vjs.fixEvent = function(event) {
    function returnTrue() {
        return true
    }

    function returnFalse() {
        return false
    }
    if (!event || !event.isPropagationStopped) {
        var old = event || window.event;
        event = {};
        for (var key in old) {
            if (key !== "layerX" && key !== "layerY" && key !== "keyLocation") {
                if (!(key == "returnValue" && old.preventDefault)) {
                    event[key] = old[key]
                }
            }
        }
        if (!event.target) {
            event.target = event.srcElement || document
        }
        event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
        event.preventDefault = function() {
            if (old.preventDefault) {
                old.preventDefault()
            }
            event.returnValue = false;
            event.isDefaultPrevented = returnTrue;
            event.defaultPrevented = true
        };
        event.isDefaultPrevented = returnFalse;
        event.defaultPrevented = false;
        event.stopPropagation = function() {
            if (old.stopPropagation) {
                old.stopPropagation()
            }
            event.cancelBubble = true;
            event.isPropagationStopped = returnTrue
        };
        event.isPropagationStopped = returnFalse;
        event.stopImmediatePropagation = function() {
            if (old.stopImmediatePropagation) {
                old.stopImmediatePropagation()
            }
            event.isImmediatePropagationStopped = returnTrue;
            event.stopPropagation()
        };
        event.isImmediatePropagationStopped = returnFalse;
        if (event.clientX != null) {
            var doc = document.documentElement,
                body = document.body;
            event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0)
        }
        event.which = event.charCode || event.keyCode;
        if (event.button != null) {
            event.button = event.button & 1 ? 0 : event.button & 4 ? 1 : event.button & 2 ? 2 : 0
        }
    }
    return event
};
vjs.trigger = function(elem, event) {
    var elemData = vjs.hasData(elem) ? vjs.getData(elem) : {};
    var parent = elem.parentNode || elem.ownerDocument;
    if (typeof event === "string") {
        event = {
            type: event,
            target: elem
        }
    }
    event = vjs.fixEvent(event);
    if (elemData.dispatcher) {
        elemData.dispatcher.call(elem, event)
    }
    if (parent && !event.isPropagationStopped() && event.bubbles !== false) {
        vjs.trigger(parent, event)
    } else if (!parent && !event.defaultPrevented) {
        var targetData = vjs.getData(event.target);
        if (event.target[event.type]) {
            targetData.disabled = true;
            if (typeof event.target[event.type] === "function") {
                event.target[event.type]()
            }
            targetData.disabled = false
        }
    }
    return !event.defaultPrevented
};
vjs.one = function(elem, type, fn) {
    if (vjs.obj.isArray(type)) {
        return _handleMultipleEvents(vjs.one, elem, type, fn)
    }
    var func = function() {
        vjs.off(elem, type, func);
        fn.apply(this, arguments)
    };
    func.guid = fn.guid = fn.guid || vjs.guid++;
    vjs.on(elem, type, func)
};

function _handleMultipleEvents(fn, elem, type, callback) {
    vjs.arr.forEach(type, function(type) {
        fn(elem, type, callback)
    })
}
var hasOwnProp = Object.prototype.hasOwnProperty;
vjs.createEl = function(tagName, properties) {
    var el;
    tagName = tagName || "div";
    properties = properties || {};
    el = document.createElement(tagName);
    vjs.obj.each(properties, function(propName, val) {
        if (propName.indexOf("aria-") !== -1 || propName == "role") {
            el.setAttribute(propName, val)
        } else {
            el[propName] = val
        }
    });
    return el
};
vjs.capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
};
vjs.obj = {};
vjs.obj.create = Object.create || function(obj) {
    function F() {}
    F.prototype = obj;
    return new F
};
vjs.obj.each = function(obj, fn, context) {
    for (var key in obj) {
        if (hasOwnProp.call(obj, key)) {
            fn.call(context || this, key, obj[key])
        }
    }
};
vjs.obj.merge = function(obj1, obj2) {
    if (!obj2) {
        return obj1
    }
    for (var key in obj2) {
        if (hasOwnProp.call(obj2, key)) {
            obj1[key] = obj2[key]
        }
    }
    return obj1
};
vjs.obj.deepMerge = function(obj1, obj2) {
    var key, val1, val2;
    obj1 = vjs.obj.copy(obj1);
    for (key in obj2) {
        if (hasOwnProp.call(obj2, key)) {
            val1 = obj1[key];
            val2 = obj2[key];
            if (vjs.obj.isPlain(val1) && vjs.obj.isPlain(val2)) {
                obj1[key] = vjs.obj.deepMerge(val1, val2)
            } else {
                obj1[key] = obj2[key]
            }
        }
    }
    return obj1
};
vjs.obj.copy = function(obj) {
    return vjs.obj.merge({}, obj)
};
vjs.obj.isPlain = function(obj) {
    return !!obj && typeof obj === "object" && obj.toString() === "[object Object]" && obj.constructor === Object
};
vjs.obj.isArray = Array.isArray || function(arr) {
    return Object.prototype.toString.call(arr) === "[object Array]"
};
vjs.isNaN = function(num) {
    return num !== num
};
vjs.bind = function(context, fn, uid) {
    if (!fn.guid) {
        fn.guid = vjs.guid++
    }
    var ret = function() {
        return fn.apply(context, arguments)
    };
    ret.guid = uid ? uid + "_" + fn.guid : fn.guid;
    return ret
};
vjs.cache = {};
vjs.guid = 1;
vjs.expando = "vdata" + (new Date).getTime();
vjs.getData = function(el) {
    var id = el[vjs.expando];
    if (!id) {
        id = el[vjs.expando] = vjs.guid++
    }
    if (!vjs.cache[id]) {
        vjs.cache[id] = {}
    }
    return vjs.cache[id]
};
vjs.hasData = function(el) {
    var id = el[vjs.expando];
    return !(!id || vjs.isEmpty(vjs.cache[id]))
};
vjs.removeData = function(el) {
    var id = el[vjs.expando];
    if (!id) {
        return
    }
    delete vjs.cache[id];
    try {
        delete el[vjs.expando]
    } catch (e) {
        if (el.removeAttribute) {
            el.removeAttribute(vjs.expando)
        } else {
            el[vjs.expando] = null
        }
    }
};
vjs.isEmpty = function(obj) {
    for (var prop in obj) {
        if (obj[prop] !== null) {
            return false
        }
    }
    return true
};
vjs.hasClass = function(element, classToCheck) {
    return (" " + element.className + " ").indexOf(" " + classToCheck + " ") !== -1
};
vjs.addClass = function(element, classToAdd) {
    if (!vjs.hasClass(element, classToAdd)) {
        element.className = element.className === "" ? classToAdd : element.className + " " + classToAdd
    }
};
vjs.removeClass = function(element, classToRemove) {
    var classNames, i;
    if (!vjs.hasClass(element, classToRemove)) {
        return
    }
    classNames = element.className.split(" ");
    for (i = classNames.length - 1; i >= 0; i--) {
        if (classNames[i] === classToRemove) {
            classNames.splice(i, 1)
        }
    }
    element.className = classNames.join(" ")
};
vjs.TEST_VID = vjs.createEl("video");
(function() {
    var track = document.createElement("track");
    track.kind = "captions";
    track.srclang = "en";
    track.label = "English";
    vjs.TEST_VID.appendChild(track)
})();
vjs.USER_AGENT = navigator.userAgent;
vjs.IS_IPHONE = /iPhone/i.test(vjs.USER_AGENT);
vjs.IS_IPAD = /iPad/i.test(vjs.USER_AGENT);
vjs.IS_IPOD = /iPod/i.test(vjs.USER_AGENT);
vjs.IS_IOS = vjs.IS_IPHONE || vjs.IS_IPAD || vjs.IS_IPOD;
vjs.IOS_VERSION = function() {
    var match = vjs.USER_AGENT.match(/OS (\d+)_/i);
    if (match && match[1]) {
        return match[1]
    }
}();
vjs.IS_ANDROID = /Android/i.test(vjs.USER_AGENT);
vjs.ANDROID_VERSION = function() {
    var match = vjs.USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i),
        major, minor;
    if (!match) {
        return null
    }
    major = match[1] && parseFloat(match[1]);
    minor = match[2] && parseFloat(match[2]);
    if (major && minor) {
        return parseFloat(match[1] + "." + match[2])
    } else if (major) {
        return major
    } else {
        return null
    }
}();
vjs.IS_OLD_ANDROID = vjs.IS_ANDROID && /webkit/i.test(vjs.USER_AGENT) && vjs.ANDROID_VERSION < 2.3;
vjs.IS_FIREFOX = /Firefox/i.test(vjs.USER_AGENT);
vjs.IS_CHROME = /Chrome/i.test(vjs.USER_AGENT);
vjs.IS_IE8 = /MSIE\s8\.0/.test(vjs.USER_AGENT);
vjs.TOUCH_ENABLED = !!("ontouchstart" in window || window.DocumentTouch && document instanceof window.DocumentTouch);
vjs.BACKGROUND_SIZE_SUPPORTED = "backgroundSize" in vjs.TEST_VID.style;
vjs.setElementAttributes = function(el, attributes) {
    vjs.obj.each(attributes, function(attrName, attrValue) {
        if (attrValue === null || typeof attrValue === "undefined" || attrValue === false) {
            el.removeAttribute(attrName)
        } else {
            el.setAttribute(attrName, attrValue === true ? "" : attrValue)
        }
    })
};
vjs.getElementAttributes = function(tag) {
    var obj, knownBooleans, attrs, attrName, attrVal;
    obj = {};
    knownBooleans = "," + "autoplay,controls,loop,muted,default" + ",";
    if (tag && tag.attributes && tag.attributes.length > 0) {
        attrs = tag.attributes;
        for (var i = attrs.length - 1; i >= 0; i--) {
            attrName = attrs[i].name;
            attrVal = attrs[i].value;
            if (typeof tag[attrName] === "boolean" || knownBooleans.indexOf("," + attrName + ",") !== -1) {
                attrVal = attrVal !== null ? true : false
            }
            obj[attrName] = attrVal
        }
    }
    return obj
};
vjs.getComputedDimension = function(el, strCssRule) {
    var strValue = "";
    if (document.defaultView && document.defaultView.getComputedStyle) {
        strValue = document.defaultView.getComputedStyle(el, "").getPropertyValue(strCssRule)
    } else if (el.currentStyle) {
        strValue = el["client" + strCssRule.substr(0, 1).toUpperCase() + strCssRule.substr(1)] + "px"
    }
    return strValue
};
vjs.insertFirst = function(child, parent) {
    if (parent.firstChild) {
        parent.insertBefore(child, parent.firstChild)
    } else {
        parent.appendChild(child)
    }
};
vjs.browser = {};
vjs.el = function(id) {
    if (id.indexOf("#") === 0) {
        id = id.slice(1)
    }
    return document.getElementById(id)
};
vjs.formatTime = function(seconds, guide) {
    guide = guide || seconds;
    var s = Math.floor(seconds % 60),
        m = Math.floor(seconds / 60 % 60),
        h = Math.floor(seconds / 3600),
        gm = Math.floor(guide / 60 % 60),
        gh = Math.floor(guide / 3600);
    if (isNaN(seconds) || seconds === Infinity) {
        h = m = s = "-"
    }
    h = h > 0 || gh > 0 ? h + ":" : "";
    m = ((h || gm >= 10) && m < 10 ? "0" + m : m) + ":";
    s = s < 10 ? "0" + s : s;
    return h + m + s
};
vjs.blockTextSelection = function() {
    document.body.focus();
    document.onselectstart = function() {
        return false
    }
};
vjs.unblockTextSelection = function() {
    document.onselectstart = function() {
        return true
    }
};
vjs.trim = function(str) {
    return (str + "").replace(/^\s+|\s+$/g, "")
};
vjs.round = function(num, dec) {
    if (!dec) {
        dec = 0
    }
    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec)
};
vjs.createTimeRange = function(start, end) {
    return {
        length: 1,
        start: function() {
            return start
        },
        end: function() {
            return end
        }
    }
};
vjs.setLocalStorage = function(key, value) {
    try {
        var localStorage = window.localStorage || false;
        if (!localStorage) {
            return
        }
        localStorage[key] = value
    } catch (e) {
        if (e.code == 22 || e.code == 1014) {
            vjs.log("LocalStorage Full (VideoJS)", e)
        } else {
            if (e.code == 18) {
                vjs.log("LocalStorage not allowed (VideoJS)", e)
            } else {
                vjs.log("LocalStorage Error (VideoJS)", e)
            }
        }
    }
};
vjs.getAbsoluteURL = function(url) {
    if (!url.match(/^https?:\/\//)) {
        url = vjs.createEl("div", {
            innerHTML: '<a href="' + url + '">x</a>'
        }).firstChild.href
    }
    return url
};
vjs.parseUrl = function(url) {
    var div, a, addToBody, props, details;
    props = ["protocol", "hostname", "port", "pathname", "search", "hash", "host"];
    a = vjs.createEl("a", {
        href: url
    });
    addToBody = a.host === "" && a.protocol !== "file:";
    if (addToBody) {
        div = vjs.createEl("div");
        div.innerHTML = '<a href="' + url + '"></a>';
        a = div.firstChild;
        div.setAttribute("style", "display:none; position:absolute;");
        document.body.appendChild(div)
    }
    details = {};
    for (var i = 0; i < props.length; i++) {
        details[props[i]] = a[props[i]]
    }
    if (details.protocol === "http:") {
        details.host = details.host.replace(/:80$/, "")
    }
    if (details.protocol === "https:") {
        details.host = details.host.replace(/:443$/, "")
    }
    if (addToBody) {
        document.body.removeChild(div)
    }
    return details
};

function _logType(type, args) {
    var argsArray, noop, console;
    argsArray = Array.prototype.slice.call(args);
    noop = function() {};
    console = window["console"] || {
        log: noop,
        warn: noop,
        error: noop
    };
    if (type) {
        argsArray.unshift(type.toUpperCase() + ":")
    } else {
        type = "log"
    }
    vjs.log.history.push(argsArray);
    argsArray.unshift("VIDEOJS:");
    try {
        if (console[type].apply) {
            console[type].apply(console, argsArray)
        } else {
            console[type](argsArray.join(" "))
        }
    } catch (e) {
        console.log(e)
    }
}
vjs.log = function() {
    _logType(null, arguments)
};
vjs.log.history = [];
vjs.log.error = function() {
    _logType("error", arguments)
};
vjs.log.warn = function() {
    _logType("warn", arguments)
};
vjs.findPosition = function(el) {
    var box, docEl, body, clientLeft, scrollLeft, left, clientTop, scrollTop, top;
    if (el.getBoundingClientRect && el.parentNode) {
        box = el.getBoundingClientRect()
    }
    if (!box) {
        return {
            left: 0,
            top: 0
        }
    }
    docEl = document.documentElement;
    body = document.body;
    clientLeft = docEl.clientLeft || body.clientLeft || 0;
    scrollLeft = window.pageXOffset || body.scrollLeft;
    left = box.left + scrollLeft - clientLeft;
    clientTop = docEl.clientTop || body.clientTop || 0;
    scrollTop = window.pageYOffset || body.scrollTop;
    top = box.top + scrollTop - clientTop;
    return {
        left: vjs.round(left),
        top: vjs.round(top)
    }
};
vjs.arr = {};
vjs.arr.forEach = function(array, callback, thisArg) {
    if (vjs.obj.isArray(array) && callback instanceof Function) {
        for (var i = 0, len = array.length; i < len; ++i) {
            callback.call(thisArg || vjs, array[i], i, array)
        }
    }
    return array
};
vjs.xhr = function(options, callback) {
    var XHR, request, urlInfo, winLoc, fileUrl, crossOrigin, abortTimeout, successHandler, errorHandler;
    if (typeof options === "string") {
        options = {
            uri: options
        }
    }
    videojs.util.mergeOptions({
        method: "GET",
        timeout: 45 * 1e3
    }, options);
    callback = callback || function() {};
    successHandler = function() {
        window.clearTimeout(abortTimeout);
        callback(null, request, request.response || request.responseText)
    };
    errorHandler = function(err) {
        window.clearTimeout(abortTimeout);
        if (!err || typeof err === "string") {
            err = new Error(err)
        }
        callback(err, request)
    };
    XHR = window.XMLHttpRequest;
    if (typeof XHR === "undefined") {
        XHR = function() {
            try {
                return new window.ActiveXObject("Msxml2.XMLHTTP.6.0")
            } catch (e) {}
            try {
                return new window.ActiveXObject("Msxml2.XMLHTTP.3.0")
            } catch (f) {}
            try {
                return new window.ActiveXObject("Msxml2.XMLHTTP")
            } catch (g) {}
            throw new Error("This browser does not support XMLHttpRequest.")
        }
    }
    request = new XHR;
    request.uri = options.uri;
    urlInfo = vjs.parseUrl(options.uri);
    winLoc = window.location;
    crossOrigin = urlInfo.protocol + urlInfo.host !== winLoc.protocol + winLoc.host;
    if (crossOrigin && window.XDomainRequest && !("withCredentials" in request)) {
        request = new window.XDomainRequest;
        request.onload = successHandler;
        request.onerror = errorHandler;
        request.onprogress = function() {};
        request.ontimeout = function() {}
    } else {
        fileUrl = urlInfo.protocol == "file:" || winLoc.protocol == "file:";
        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                if (request.timedout) {
                    return errorHandler("timeout")
                }
                if (request.status === 200 || fileUrl && request.status === 0) {
                    successHandler()
                } else {
                    errorHandler()
                }
            }
        };
        if (options.timeout) {
            abortTimeout = window.setTimeout(function() {
                if (request.readyState !== 4) {
                    request.timedout = true;
                    request.abort()
                }
            }, options.timeout)
        }
    }
    try {
        request.open(options.method || "GET", options.uri, true)
    } catch (err) {
        return errorHandler(err)
    }
    if (options.withCredentials) {
        request.withCredentials = true
    }
    if (options.responseType) {
        request.responseType = options.responseType
    }
    try {
        request.send()
    } catch (err) {
        return errorHandler(err)
    }
    return request
};
vjs.util = {};
vjs.util.mergeOptions = function(obj1, obj2) {
    var key, val1, val2;
    obj1 = vjs.obj.copy(obj1);
    for (key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            val1 = obj1[key];
            val2 = obj2[key];
            if (vjs.obj.isPlain(val1) && vjs.obj.isPlain(val2)) {
                obj1[key] = vjs.util.mergeOptions(val1, val2)
            } else {
                obj1[key] = obj2[key]
            }
        }
    }
    return obj1
};
vjs.EventEmitter = function() {};
vjs.EventEmitter.prototype.allowedEvents_ = {};
vjs.EventEmitter.prototype.on = function(type, fn) {
    var ael = this.addEventListener;
    this.addEventListener = Function.prototype;
    vjs.on(this, type, fn);
    this.addEventListener = ael
};
vjs.EventEmitter.prototype.addEventListener = vjs.EventEmitter.prototype.on;
vjs.EventEmitter.prototype.off = function(type, fn) {
    vjs.off(this, type, fn)
};
vjs.EventEmitter.prototype.removeEventListener = vjs.EventEmitter.prototype.off;
vjs.EventEmitter.prototype.one = function(type, fn) {
    vjs.one(this, type, fn)
};
vjs.EventEmitter.prototype.trigger = function(event) {
    var type = event.type || event;
    if (typeof event === "string") {
        event = {
            type: type
        }
    }
    event = vjs.fixEvent(event);
    if (this.allowedEvents_[type] && this["on" + type]) {
        this["on" + type](event)
    }
    vjs.trigger(this, event)
};
vjs.EventEmitter.prototype.dispatchEvent = vjs.EventEmitter.prototype.trigger;
vjs.Component = vjs.CoreObject.extend({
    init: function(player, options, ready) {
        this.player_ = player;
        this.options_ = vjs.obj.copy(this.options_);
        options = this.options(options);
        this.id_ = options["id"] || options["el"] && options["el"]["id"];
        if (!this.id_) {
            this.id_ = (player.id && player.id() || "no_player") + "_component_" + vjs.guid++
        }
        this.name_ = options["name"] || null;
        this.el_ = options["el"] || this.createEl();
        this.children_ = [];
        this.childIndex_ = {};
        this.childNameIndex_ = {};
        this.initChildren();
        this.ready(ready);
        if (options.reportTouchActivity !== false) {
            this.enableTouchActivity()
        }
    }
});
vjs.Component.prototype.dispose = function() {
    this.trigger({
        type: "dispose",
        bubbles: false
    });
    if (this.children_) {
        for (var i = this.children_.length - 1; i >= 0; i--) {
            if (this.children_[i].dispose) {
                this.children_[i].dispose()
            }
        }
    }
    this.children_ = null;
    this.childIndex_ = null;
    this.childNameIndex_ = null;
    this.off();
    if (this.el_.parentNode) {
        this.el_.parentNode.removeChild(this.el_)
    }
    vjs.removeData(this.el_);
    this.el_ = null
};
vjs.Component.prototype.player_ = true;
vjs.Component.prototype.player = function() {
    return this.player_
};
vjs.Component.prototype.options_;
vjs.Component.prototype.options = function(obj) {
    if (obj === undefined) return this.options_;
    return this.options_ = vjs.util.mergeOptions(this.options_, obj)
};
vjs.Component.prototype.el_;
vjs.Component.prototype.createEl = function(tagName, attributes) {
    return vjs.createEl(tagName, attributes)
};
vjs.Component.prototype.localize = function(string) {
    var lang = this.player_.language(),
        languages = this.player_.languages();
    if (languages && languages[lang] && languages[lang][string]) {
        return languages[lang][string]
    }
    return string
};
vjs.Component.prototype.el = function() {
    return this.el_
};
vjs.Component.prototype.contentEl_;
vjs.Component.prototype.contentEl = function() {
    return this.contentEl_ || this.el_
};
vjs.Component.prototype.id_;
vjs.Component.prototype.id = function() {
    return this.id_
};
vjs.Component.prototype.name_;
vjs.Component.prototype.name = function() {
    return this.name_
};
vjs.Component.prototype.children_;
vjs.Component.prototype.children = function() {
    return this.children_
};
vjs.Component.prototype.childIndex_;
vjs.Component.prototype.getChildById = function(id) {
    return this.childIndex_[id]
};
vjs.Component.prototype.childNameIndex_;
vjs.Component.prototype.getChild = function(name) {
    return this.childNameIndex_[name]
};
vjs.Component.prototype.addChild = function(child, options) {
    var component, componentClass, componentName;
    if (typeof child === "string") {
        componentName = child;
        options = options || {};
        componentClass = options["componentClass"] || vjs.capitalize(componentName);
        options["name"] = componentName;
        component = new window["videojs"][componentClass](this.player_ || this, options)
    } else {
        component = child
    }
    this.children_.push(component);
    if (typeof component.id === "function") {
        this.childIndex_[component.id()] = component
    }
    componentName = componentName || component.name && component.name();
    if (componentName) {
        this.childNameIndex_[componentName] = component
    }
    if (typeof component["el"] === "function" && component["el"]()) {
        this.contentEl().appendChild(component["el"]())
    }
    return component
};
vjs.Component.prototype.removeChild = function(component) {
    if (typeof component === "string") {
        component = this.getChild(component)
    }
    if (!component || !this.children_) return;
    var childFound = false;
    for (var i = this.children_.length - 1; i >= 0; i--) {
        if (this.children_[i] === component) {
            childFound = true;
            this.children_.splice(i, 1);
            break
        }
    }
    if (!childFound) return;
    this.childIndex_[component.id()] = null;
    this.childNameIndex_[component.name()] = null;
    var compEl = component.el();
    if (compEl && compEl.parentNode === this.contentEl()) {
        this.contentEl().removeChild(component.el())
    }
};
vjs.Component.prototype.initChildren = function() {
    var parent, parentOptions, children, child, name, opts, handleAdd;
    parent = this;
    parentOptions = parent.options();
    children = parentOptions["children"];
    if (children) {
        handleAdd = function(name, opts) {
            if (parentOptions[name] !== undefined) {
                opts = parentOptions[name]
            }
            if (opts === false) return;
            parent[name] = parent.addChild(name, opts)
        };
        if (vjs.obj.isArray(children)) {
            for (var i = 0; i < children.length; i++) {
                child = children[i];
                if (typeof child == "string") {
                    name = child;
                    opts = {}
                } else {
                    name = child.name;
                    opts = child
                }
                handleAdd(name, opts)
            }
        } else {
            vjs.obj.each(children, handleAdd)
        }
    }
};
vjs.Component.prototype.buildCSSClass = function() {
    return ""
};
vjs.Component.prototype.on = function(first, second, third) {
    var target, type, fn, removeOnDispose, cleanRemover, thisComponent;
    if (typeof first === "string" || vjs.obj.isArray(first)) {
        vjs.on(this.el_, first, vjs.bind(this, second))
    } else {
        target = first;
        type = second;
        fn = vjs.bind(this, third);
        thisComponent = this;
        removeOnDispose = function() {
            thisComponent.off(target, type, fn)
        };
        removeOnDispose.guid = fn.guid;
        this.on("dispose", removeOnDispose);
        cleanRemover = function() {
            thisComponent.off("dispose", removeOnDispose)
        };
        cleanRemover.guid = fn.guid;
        if (first.nodeName) {
            vjs.on(target, type, fn);
            vjs.on(target, "dispose", cleanRemover)
        } else if (typeof first.on === "function") {
            target.on(type, fn);
            target.on("dispose", cleanRemover)
        }
    }
    return this
};
vjs.Component.prototype.off = function(first, second, third) {
    var target, otherComponent, type, fn, otherEl;
    if (!first || typeof first === "string" || vjs.obj.isArray(first)) {
        vjs.off(this.el_, first, second)
    } else {
        target = first;
        type = second;
        fn = vjs.bind(this, third);
        this.off("dispose", fn);
        if (first.nodeName) {
            vjs.off(target, type, fn);
            vjs.off(target, "dispose", fn)
        } else {
            target.off(type, fn);
            target.off("dispose", fn)
        }
    }
    return this
};
vjs.Component.prototype.one = function(first, second, third) {
    var target, type, fn, thisComponent, newFunc;
    if (typeof first === "string" || vjs.obj.isArray(first)) {
        vjs.one(this.el_, first, vjs.bind(this, second))
    } else {
        target = first;
        type = second;
        fn = vjs.bind(this, third);
        thisComponent = this;
        newFunc = function() {
            thisComponent.off(target, type, newFunc);
            fn.apply(this, arguments)
        };
        newFunc.guid = fn.guid;
        this.on(target, type, newFunc)
    }
    return this
};
vjs.Component.prototype.trigger = function(event) {
    vjs.trigger(this.el_, event);
    return this
};
vjs.Component.prototype.isReady_;
vjs.Component.prototype.isReadyOnInitFinish_ = true;
vjs.Component.prototype.readyQueue_;
vjs.Component.prototype.ready = function(fn) {
    if (fn) {
        if (this.isReady_) {
            fn.call(this)
        } else {
            if (this.readyQueue_ === undefined) {
                this.readyQueue_ = []
            }
            this.readyQueue_.push(fn)
        }
    }
    return this
};
vjs.Component.prototype.triggerReady = function() {
    this.isReady_ = true;
    var readyQueue = this.readyQueue_;
    if (readyQueue && readyQueue.length > 0) {
        for (var i = 0, j = readyQueue.length; i < j; i++) {
            readyQueue[i].call(this)
        }
        this.readyQueue_ = [];
        this.trigger("ready")
    }
};
vjs.Component.prototype.hasClass = function(classToCheck) {
    return vjs.hasClass(this.el_, classToCheck)
};
vjs.Component.prototype.addClass = function(classToAdd) {
    vjs.addClass(this.el_, classToAdd);
    return this
};
vjs.Component.prototype.removeClass = function(classToRemove) {
    vjs.removeClass(this.el_, classToRemove);
    return this
};
vjs.Component.prototype.show = function() {
    this.removeClass("vjs-hidden");
    return this
};
vjs.Component.prototype.hide = function() {
    this.addClass("vjs-hidden");
    return this
};
vjs.Component.prototype.lockShowing = function() {
    this.addClass("vjs-lock-showing");
    return this
};
vjs.Component.prototype.unlockShowing = function() {
    this.removeClass("vjs-lock-showing");
    return this
};
vjs.Component.prototype.disable = function() {
    this.hide();
    this.show = function() {}
};
vjs.Component.prototype.width = function(num, skipListeners) {
    return this.dimension("width", num, skipListeners)
};
vjs.Component.prototype.height = function(num, skipListeners) {
    return this.dimension("height", num, skipListeners)
};
vjs.Component.prototype.dimensions = function(width, height) {
    return this.width(width, true).height(height)
};
vjs.Component.prototype.dimension = function(widthOrHeight, num, skipListeners) {
    if (num !== undefined) {
        if (num === null || vjs.isNaN(num)) {
            num = 0
        }
        if (("" + num).indexOf("%") !== -1 || ("" + num).indexOf("px") !== -1) {
            this.el_.style[widthOrHeight] = num
        } else if (num === "auto") {
            this.el_.style[widthOrHeight] = ""
        } else {
            this.el_.style[widthOrHeight] = num + "px"
        }
        if (!skipListeners) {
            this.trigger("resize")
        }
        return this
    }
    if (!this.el_) return 0;
    var val = this.el_.style[widthOrHeight];
    var pxIndex = val.indexOf("px");
    if (pxIndex !== -1) {
        return parseInt(val.slice(0, pxIndex), 10)
    } else {
        return parseInt(this.el_["offset" + vjs.capitalize(widthOrHeight)], 10)
    }
};
vjs.Component.prototype.onResize;
vjs.Component.prototype.emitTapEvents = function() {
    var touchStart, firstTouch, touchTime, couldBeTap, noTap, xdiff, ydiff, touchDistance, tapMovementThreshold, touchTimeThreshold;
    touchStart = 0;
    firstTouch = null;
    tapMovementThreshold = 10;
    touchTimeThreshold = 200;
    this.on("touchstart", function(event) {
        if (event.touches.length === 1) {
            firstTouch = vjs.obj.copy(event.touches[0]);
            touchStart = (new Date).getTime();
            couldBeTap = true
        }
    });
    this.on("touchmove", function(event) {
        if (event.touches.length > 1) {
            couldBeTap = false
        } else if (firstTouch) {
            xdiff = event.touches[0].pageX - firstTouch.pageX;
            ydiff = event.touches[0].pageY - firstTouch.pageY;
            touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
            if (touchDistance > tapMovementThreshold) {
                couldBeTap = false
            }
        }
    });
    noTap = function() {
        couldBeTap = false
    };
    this.on("touchleave", noTap);
    this.on("touchcancel", noTap);
    this.on("touchend", function(event) {
        firstTouch = null;
        if (couldBeTap === true) {
            touchTime = (new Date).getTime() - touchStart;
            if (touchTime < touchTimeThreshold) {
                event.preventDefault();
                this.trigger("tap")
            }
        }
    })
};
vjs.Component.prototype.enableTouchActivity = function() {
    var report, touchHolding, touchEnd;
    if (!this.player().reportUserActivity) {
        return
    }
    report = vjs.bind(this.player(), this.player().reportUserActivity);
    this.on("touchstart", function() {
        report();
        this.clearInterval(touchHolding);
        touchHolding = this.setInterval(report, 250)
    });
    touchEnd = function(event) {
        report();
        this.clearInterval(touchHolding)
    };
    this.on("touchmove", report);
    this.on("touchend", touchEnd);
    this.on("touchcancel", touchEnd)
};
vjs.Component.prototype.setTimeout = function(fn, timeout) {
    fn = vjs.bind(this, fn);
    var timeoutId = setTimeout(fn, timeout);
    var disposeFn = function() {
        this.clearTimeout(timeoutId)
    };
    disposeFn.guid = "vjs-timeout-" + timeoutId;
    this.on("dispose", disposeFn);
    return timeoutId
};
vjs.Component.prototype.clearTimeout = function(timeoutId) {
    clearTimeout(timeoutId);
    var disposeFn = function() {};
    disposeFn.guid = "vjs-timeout-" + timeoutId;
    this.off("dispose", disposeFn);
    return timeoutId
};
vjs.Component.prototype.setInterval = function(fn, interval) {
    fn = vjs.bind(this, fn);
    var intervalId = setInterval(fn, interval);
    var disposeFn = function() {
        this.clearInterval(intervalId)
    };
    disposeFn.guid = "vjs-interval-" + intervalId;
    this.on("dispose", disposeFn);
    return intervalId
};
vjs.Component.prototype.clearInterval = function(intervalId) {
    clearInterval(intervalId);
    var disposeFn = function() {};
    disposeFn.guid = "vjs-interval-" + intervalId;
    this.off("dispose", disposeFn);
    return intervalId
};
vjs.Button = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options);
        this.emitTapEvents();
        this.on("tap", this.onClick);
        this.on("click", this.onClick);
        this.on("focus", this.onFocus);
        this.on("blur", this.onBlur)
    }
});
vjs.Button.prototype.createEl = function(type, props) {
    var el;
    props = vjs.obj.merge({
        className: this.buildCSSClass(),
        role: "button",
        "aria-live": "polite",
        tabIndex: 0
    }, props);
    el = vjs.Component.prototype.createEl.call(this, type, props);
    if (!props.innerHTML) {
        this.contentEl_ = vjs.createEl("div", {
            className: "vjs-control-content"
        });
        this.controlText_ = vjs.createEl("span", {
            className: "vjs-control-text",
            innerHTML: this.localize(this.buttonText) || "Need Text"
        });
        this.contentEl_.appendChild(this.controlText_);
        el.appendChild(this.contentEl_)
    }
    return el
};
vjs.Button.prototype.buildCSSClass = function() {
    return "vjs-control " + vjs.Component.prototype.buildCSSClass.call(this)
};
vjs.Button.prototype.onClick = function() {};
vjs.Button.prototype.onFocus = function() {
    vjs.on(document, "keydown", vjs.bind(this, this.onKeyPress))
};
vjs.Button.prototype.onKeyPress = function(event) {
    if (event.which == 32 || event.which == 13) {
        event.preventDefault();
        this.onClick()
    }
};
vjs.Button.prototype.onBlur = function() {
    vjs.off(document, "keydown", vjs.bind(this, this.onKeyPress))
};
vjs.Slider = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options);
        this.bar = this.getChild(this.options_["barName"]);
        this.handle = this.getChild(this.options_["handleName"]);
        this.on("mousedown", this.onMouseDown);
        this.on("touchstart", this.onMouseDown);
        this.on("focus", this.onFocus);
        this.on("blur", this.onBlur);
        this.on("click", this.onClick);
        this.on(player, "controlsvisible", this.update);
        this.on(player, this.playerEvent, this.update)
    }
});
vjs.Slider.prototype.createEl = function(type, props) {
    props = props || {};
    props.className = props.className + " vjs-slider";
    props = vjs.obj.merge({
        role: "slider",
        "aria-valuenow": 0,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        tabIndex: 0
    }, props);
    return vjs.Component.prototype.createEl.call(this, type, props)
};
vjs.Slider.prototype.onMouseDown = function(event) {
    event.preventDefault();
    vjs.blockTextSelection();
    this.addClass("vjs-sliding");
    this.on(document, "mousemove", this.onMouseMove);
    this.on(document, "mouseup", this.onMouseUp);
    this.on(document, "touchmove", this.onMouseMove);
    this.on(document, "touchend", this.onMouseUp);
    this.onMouseMove(event)
};
vjs.Slider.prototype.onMouseMove = function() {};
vjs.Slider.prototype.onMouseUp = function() {
    vjs.unblockTextSelection();
    this.removeClass("vjs-sliding");
    this.off(document, "mousemove", this.onMouseMove);
    this.off(document, "mouseup", this.onMouseUp);
    this.off(document, "touchmove", this.onMouseMove);
    this.off(document, "touchend", this.onMouseUp);
    this.update()
};
vjs.Slider.prototype.update = function() {
    if (!this.el_) return;
    var barProgress, progress = this.getPercent(),
        handle = this.handle,
        bar = this.bar;
    if (typeof progress !== "number" || progress !== progress || progress < 0 || progress === Infinity) {
        progress = 0
    }
    barProgress = progress;
    if (handle) {
        var box = this.el_,
            boxWidth = box.offsetWidth,
            handleWidth = handle.el().offsetWidth,
            handlePercent = handleWidth ? handleWidth / boxWidth : 0,
            boxAdjustedPercent = 1 - handlePercent,
            adjustedProgress = progress * boxAdjustedPercent;
        barProgress = adjustedProgress + handlePercent / 2;
        handle.el().style.left = vjs.round(adjustedProgress * 100, 2) + "%"
    }
    if (bar) {
        bar.el().style.width = vjs.round(barProgress * 100, 2) + "%"
    }
};
vjs.Slider.prototype.calculateDistance = function(event) {
    var el, box, boxX, boxY, boxW, boxH, handle, pageX, pageY;
    el = this.el_;
    box = vjs.findPosition(el);
    boxW = boxH = el.offsetWidth;
    handle = this.handle;
    if (this.options()["vertical"]) {
        boxY = box.top;
        if (event.changedTouches) {
            pageY = event.changedTouches[0].pageY
        } else {
            pageY = event.pageY
        }
        if (handle) {
            var handleH = handle.el().offsetHeight;
            boxY = boxY + handleH / 2;
            boxH = boxH - handleH
        }
        return Math.max(0, Math.min(1, (boxY - pageY + boxH) / boxH))
    } else {
        boxX = box.left;
        if (event.changedTouches) {
            pageX = event.changedTouches[0].pageX
        } else {
            pageX = event.pageX
        }
        if (handle) {
            var handleW = handle.el().offsetWidth;
            boxX = boxX + handleW / 2;
            boxW = boxW - handleW
        }
        return Math.max(0, Math.min(1, (pageX - boxX) / boxW))
    }
};
vjs.Slider.prototype.onFocus = function() {
    this.on(document, "keydown", this.onKeyPress)
};
vjs.Slider.prototype.onKeyPress = function(event) {
    if (event.which == 37 || event.which == 40) {
        event.preventDefault();
        this.stepBack()
    } else if (event.which == 38 || event.which == 39) {
        event.preventDefault();
        this.stepForward()
    }
};
vjs.Slider.prototype.onBlur = function() {
    this.off(document, "keydown", this.onKeyPress)
};
vjs.Slider.prototype.onClick = function(event) {
    event.stopImmediatePropagation();
    event.preventDefault()
};
vjs.SliderHandle = vjs.Component.extend();
vjs.SliderHandle.prototype.defaultValue = 0;
vjs.SliderHandle.prototype.createEl = function(type, props) {
    props = props || {};
    props.className = props.className + " vjs-slider-handle";
    props = vjs.obj.merge({
        innerHTML: '<span class="vjs-control-text">' + this.defaultValue + "</span>"
    }, props);
    return vjs.Component.prototype.createEl.call(this, "div", props)
};
vjs.Menu = vjs.Component.extend();
vjs.Menu.prototype.addItem = function(component) {
    this.addChild(component);
    component.on("click", vjs.bind(this, function() {
        this.unlockShowing()
    }))
};
vjs.Menu.prototype.createEl = function() {
    var contentElType = this.options().contentElType || "ul";
    this.contentEl_ = vjs.createEl(contentElType, {
        className: "vjs-menu-content"
    });
    var el = vjs.Component.prototype.createEl.call(this, "div", {
        append: this.contentEl_,
        className: "vjs-menu"
    });
    el.appendChild(this.contentEl_);
    vjs.on(el, "click", function(event) {
        event.preventDefault();
        event.stopImmediatePropagation()
    });
    return el
};
vjs.MenuItem = vjs.Button.extend({
    init: function(player, options) {
        vjs.Button.call(this, player, options);
        this.selected(options["selected"])
    }
});
vjs.MenuItem.prototype.createEl = function(type, props) {
    return vjs.Button.prototype.createEl.call(this, "li", vjs.obj.merge({
        className: "vjs-menu-item",
        innerHTML: this.localize(this.options_["label"])
    }, props))
};
vjs.MenuItem.prototype.onClick = function() {
    this.selected(true)
};
vjs.MenuItem.prototype.selected = function(selected) {
    if (selected) {
        this.addClass("vjs-selected");
        this.el_.setAttribute("aria-selected", true)
    } else {
        this.removeClass("vjs-selected");
        this.el_.setAttribute("aria-selected", false)
    }
};
vjs.MenuButton = vjs.Button.extend({
    init: function(player, options) {
        vjs.Button.call(this, player, options);
        this.update();
        this.on("keydown", this.onKeyPress);
        this.el_.setAttribute("aria-haspopup", true);
        this.el_.setAttribute("role", "button")
    }
});
vjs.MenuButton.prototype.update = function() {
    var menu = this.createMenu();
    if (this.menu) {
        this.removeChild(this.menu)
    }
    this.menu = menu;
    this.addChild(menu);
    if (this.items && this.items.length === 0) {
        this.hide()
    } else if (this.items && this.items.length > 1) {
        this.show()
    }
};
vjs.MenuButton.prototype.buttonPressed_ = false;
vjs.MenuButton.prototype.createMenu = function() {
    var menu = new vjs.Menu(this.player_);
    if (this.options().title) {
        menu.contentEl().appendChild(vjs.createEl("li", {
            className: "vjs-menu-title",
            innerHTML: vjs.capitalize(this.options().title),
            tabindex: -1
        }))
    }
    this.items = this["createItems"]();
    if (this.items) {
        for (var i = 0; i < this.items.length; i++) {
            menu.addItem(this.items[i])
        }
    }
    return menu
};
vjs.MenuButton.prototype.createItems = function() {};
vjs.MenuButton.prototype.buildCSSClass = function() {
    return this.className + " vjs-menu-button " + vjs.Button.prototype.buildCSSClass.call(this)
};
vjs.MenuButton.prototype.onFocus = function() {};
vjs.MenuButton.prototype.onBlur = function() {};
vjs.MenuButton.prototype.onClick = function() {
    this.one("mouseout", vjs.bind(this, function() {
        this.menu.unlockShowing();
        this.el_.blur()
    }));
    if (this.buttonPressed_) {
        this.unpressButton()
    } else {
        this.pressButton()
    }
};
vjs.MenuButton.prototype.onKeyPress = function(event) {
    if (event.which == 32 || event.which == 13) {
        if (this.buttonPressed_) {
            this.unpressButton()
        } else {
            this.pressButton()
        }
        event.preventDefault()
    } else if (event.which == 27) {
        if (this.buttonPressed_) {
            this.unpressButton()
        }
        event.preventDefault()
    }
};
vjs.MenuButton.prototype.pressButton = function() {
    this.buttonPressed_ = true;
    this.menu.lockShowing();
    this.el_.setAttribute("aria-pressed", true);
    if (this.items && this.items.length > 0) {
        this.items[0].el().focus()
    }
};
vjs.MenuButton.prototype.unpressButton = function() {
    this.buttonPressed_ = false;
    this.menu.unlockShowing();
    this.el_.setAttribute("aria-pressed", false)
};
vjs.MediaError = function(code) {
    if (typeof code === "number") {
        this.code = code
    } else if (typeof code === "string") {
        this.message = code
    } else if (typeof code === "object") {
        vjs.obj.merge(this, code)
    }
    if (!this.message) {
        this.message = vjs.MediaError.defaultMessages[this.code] || ""
    }
};
vjs.MediaError.prototype.code = 0;
vjs.MediaError.prototype.message = "";
vjs.MediaError.prototype.status = null;
vjs.MediaError.errorTypes = ["MEDIA_ERR_CUSTOM", "MEDIA_ERR_ABORTED", "MEDIA_ERR_NETWORK", "MEDIA_ERR_DECODE", "MEDIA_ERR_SRC_NOT_SUPPORTED", "MEDIA_ERR_ENCRYPTED"];
vjs.MediaError.defaultMessages = {
    1: "You aborted the video playback",
    2: "A network error caused the video download to fail part-way.",
    3: "The video playback was aborted due to a corruption problem or because the video used features your browser did not support.",
    4: "The video could not be loaded, either because the server or network failed or because the format is not supported.",
    5: "The video is encrypted and we do not have the keys to decrypt it."
};
for (var errNum = 0; errNum < vjs.MediaError.errorTypes.length; errNum++) {
    vjs.MediaError[vjs.MediaError.errorTypes[errNum]] = errNum;
    vjs.MediaError.prototype[vjs.MediaError.errorTypes[errNum]] = errNum
}(function() {
    var apiMap, specApi, browserApi, i;
    vjs.browser.fullscreenAPI;
    apiMap = [
        ["requestFullscreen", "exitFullscreen", "fullscreenElement", "fullscreenEnabled", "fullscreenchange", "fullscreenerror"],
        ["webkitRequestFullscreen", "webkitExitFullscreen", "webkitFullscreenElement", "webkitFullscreenEnabled", "webkitfullscreenchange", "webkitfullscreenerror"],
        ["webkitRequestFullScreen", "webkitCancelFullScreen", "webkitCurrentFullScreenElement", "webkitCancelFullScreen", "webkitfullscreenchange", "webkitfullscreenerror"],
        ["mozRequestFullScreen", "mozCancelFullScreen", "mozFullScreenElement", "mozFullScreenEnabled", "mozfullscreenchange", "mozfullscreenerror"],
        ["msRequestFullscreen", "msExitFullscreen", "msFullscreenElement", "msFullscreenEnabled", "MSFullscreenChange", "MSFullscreenError"]
    ];
    specApi = apiMap[0];
    for (i = 0; i < apiMap.length; i++) {
        if (apiMap[i][1] in document) {
            browserApi = apiMap[i];
            break
        }
    }
    if (browserApi) {
        vjs.browser.fullscreenAPI = {};
        for (i = 0; i < browserApi.length; i++) {
            vjs.browser.fullscreenAPI[specApi[i]] = browserApi[i]
        }
    }
})();
vjs.Player = vjs.Component.extend({
    init: function(tag, options, ready) {
        this.tag = tag;
        tag.id = tag.id || "vjs_video_" + vjs.guid++;
        this.tagAttributes = tag && vjs.getElementAttributes(tag);
        options = vjs.obj.merge(this.getTagSettings(tag), options);
        this.language_ = options["language"] || vjs.options["language"];
        this.languages_ = options["languages"] || vjs.options["languages"];
        this.cache_ = {};
        this.poster_ = options["poster"] || "";
        this.controls_ = !!options["controls"];
        tag.controls = false;
        options.reportTouchActivity = false;
        this.isAudio(this.tag.nodeName.toLowerCase() === "audio");
        vjs.Component.call(this, this, options, ready);
        if (this.controls()) {
            this.addClass("vjs-controls-enabled")
        } else {
            this.addClass("vjs-controls-disabled")
        }
        if (this.isAudio()) {
            this.addClass("vjs-audio")
        }
        vjs.players[this.id_] = this;
        if (options["plugins"]) {
            vjs.obj.each(options["plugins"], function(key, val) {
                this[key](val)
            }, this)
        }
        this.listenForUserActivity()
    }
});
vjs.Player.prototype.language_;
vjs.Player.prototype.language = function(languageCode) {
    if (languageCode === undefined) {
        return this.language_
    }
    this.language_ = languageCode;
    return this
};
vjs.Player.prototype.languages_;
vjs.Player.prototype.languages = function() {
    return this.languages_
};
vjs.Player.prototype.options_ = vjs.options;
vjs.Player.prototype.dispose = function() {
    this.trigger("dispose");
    this.off("dispose");
    vjs.players[this.id_] = null;
    if (this.tag && this.tag["player"]) {
        this.tag["player"] = null
    }
    if (this.el_ && this.el_["player"]) {
        this.el_["player"] = null
    }
    if (this.tech) {
        this.tech.dispose()
    }
    vjs.Component.prototype.dispose.call(this)
};
vjs.Player.prototype.getTagSettings = function(tag) {
    var tagOptions, dataSetup, options = {
        sources: [],
        tracks: []
    };
    tagOptions = vjs.getElementAttributes(tag);
    dataSetup = tagOptions["data-setup"];
    if (dataSetup !== null) {
        vjs.obj.merge(tagOptions, vjs.JSON.parse(dataSetup || "{}"))
    }
    vjs.obj.merge(options, tagOptions);
    if (tag.hasChildNodes()) {
        var children, child, childName, i, j;
        children = tag.childNodes;
        for (i = 0, j = children.length; i < j; i++) {
            child = children[i];
            childName = child.nodeName.toLowerCase();
            if (childName === "source") {
                options["sources"].push(vjs.getElementAttributes(child))
            } else if (childName === "track") {
                options["tracks"].push(vjs.getElementAttributes(child))
            }
        }
    }
    return options
};
vjs.Player.prototype.createEl = function() {
    var el = this.el_ = vjs.Component.prototype.createEl.call(this, "div"),
        tag = this.tag,
        attrs;
    tag.removeAttribute("width");
    tag.removeAttribute("height");
    attrs = vjs.getElementAttributes(tag);
    vjs.obj.each(attrs, function(attr) {
        if (attr == "class") {
            el.className = attrs[attr]
        } else {
            el.setAttribute(attr, attrs[attr])
        }
    });
    tag.id += "_html5_api";
    tag.className = "vjs-tech";
    tag["player"] = el["player"] = this;
    this.addClass("vjs-paused");
    this.width(this.options_["width"], true);
    this.height(this.options_["height"], true);
    tag.initNetworkState_ = tag.networkState;
    if (tag.parentNode) {
        tag.parentNode.insertBefore(el, tag)
    }
    vjs.insertFirst(tag, el);
    this.el_ = el;
    this.on("loadstart", this.onLoadStart);
    this.on("waiting", this.onWaiting);
    this.on(["canplay", "canplaythrough", "playing", "ended"], this.onWaitEnd);
    this.on("seeking", this.onSeeking);
    this.on("seeked", this.onSeeked);
    this.on("ended", this.onEnded);
    this.on("play", this.onPlay);
    this.on("firstplay", this.onFirstPlay);
    this.on("pause", this.onPause);
    this.on("progress", this.onProgress);
    this.on("durationchange", this.onDurationChange);
    this.on("fullscreenchange", this.onFullscreenChange);
    return el
};
vjs.Player.prototype.loadTech = function(techName, source) {
    if (this.tech) {
        this.unloadTech()
    }
    if (techName !== "Html5" && this.tag) {
        vjs.Html5.disposeMediaElement(this.tag);
        this.tag = null
    }
    this.techName = techName;
    this.isReady_ = false;
    var techReady = function() {
        this.player_.triggerReady()
    };
    var techOptions = vjs.obj.merge({
        source: source,
        parentEl: this.el_
    }, this.options_[techName.toLowerCase()]);
    if (source) {
        this.currentType_ = source.type;
        if (source.src == this.cache_.src && this.cache_.currentTime > 0) {
            techOptions["startTime"] = this.cache_.currentTime
        }
        this.cache_.src = source.src
    }
    this.tech = new window["videojs"][techName](this, techOptions);
    this.tech.ready(techReady)
};
vjs.Player.prototype.unloadTech = function() {
    this.isReady_ = false;
    this.tech.dispose();
    this.tech = false
};
vjs.Player.prototype.onLoadStart = function() {
    this.removeClass("vjs-ended");
    this.error(null);
    if (!this.paused()) {
        this.trigger("firstplay")
    } else {
        this.hasStarted(false)
    }
};
vjs.Player.prototype.hasStarted_ = false;
vjs.Player.prototype.hasStarted = function(hasStarted) {
    if (hasStarted !== undefined) {
        if (this.hasStarted_ !== hasStarted) {
            this.hasStarted_ = hasStarted;
            if (hasStarted) {
                this.addClass("vjs-has-started");
                this.trigger("firstplay")
            } else {
                this.removeClass("vjs-has-started")
            }
        }
        return this
    }
    return this.hasStarted_
};
vjs.Player.prototype.onLoadedMetaData;
vjs.Player.prototype.onLoadedData;
vjs.Player.prototype.onLoadedAllData;
vjs.Player.prototype.onPlay = function() {
    this.removeClass("vjs-ended");
    this.removeClass("vjs-paused");
    this.addClass("vjs-playing");
    this.hasStarted(true)
};
vjs.Player.prototype.onWaiting = function() {
    this.addClass("vjs-waiting")
};
vjs.Player.prototype.onWaitEnd = function() {
    this.removeClass("vjs-waiting")
};
vjs.Player.prototype.onSeeking = function() {
    this.addClass("vjs-seeking");
    $(".vid-subs").addClass("none")
};
vjs.Player.prototype.onSeeked = function() {
    this.removeClass("vjs-seeking")
};
vjs.Player.prototype.onFirstPlay = function() {
    if (typeof moviesGetUri !== "undefined") moviesGetUri();
    if (this.options_["starttime"]) {
        this.currentTime(this.options_["starttime"])
    }
    this.addClass("vjs-has-started")
};
vjs.Player.prototype.onPause = function() {
    this.removeClass("vjs-playing");
    this.addClass("vjs-paused")
};
vjs.Player.prototype.onTimeUpdate;
vjs.Player.prototype.onProgress = function() {
    if (this.bufferedPercent() == 1) {
        this.trigger("loadedalldata")
    }
};
vjs.Player.prototype.onEnded = function() {
    this.addClass("vjs-ended");
    if (this.options_["loop"]) {
        this.currentTime(0);
        this.play()
    } else if (!this.paused()) {
        this.pause()
    }
};
vjs.Player.prototype.onDurationChange = function() {
    var duration = this.techGet("duration");
    if (duration) {
        if (duration < 0) {
            duration = Infinity
        }
        this.duration(duration);
        if (duration === Infinity) {
            this.addClass("vjs-live")
        } else {
            this.removeClass("vjs-live")
        }
    }
};
vjs.Player.prototype.onVolumeChange;
vjs.Player.prototype.onFullscreenChange = function() {
    if (this.isFullscreen()) {
        this.addClass("vjs-fullscreen")
    } else {
        this.removeClass("vjs-fullscreen")
    }
};
vjs.Player.prototype.onError;
vjs.Player.prototype.cache_;
vjs.Player.prototype.getCache = function() {
    return this.cache_
};
vjs.Player.prototype.techCall = function(method, arg) {
    if (this.tech && !this.tech.isReady_) {
        this.tech.ready(function() {
            this[method](arg)
        })
    } else {
        try {
            this.tech[method](arg)
        } catch (e) {
            vjs.log(e);
            throw e
        }
    }
};
vjs.Player.prototype.techGet = function(method) {
    if (this.tech && this.tech.isReady_) {
        try {
            return this.tech[method]()
        } catch (e) {
            if (this.tech[method] === undefined) {
                vjs.log("Video.js: " + method + " method not defined for " + this.techName + " playback technology.", e)
            } else {
                if (e.name == "TypeError") {
                    vjs.log("Video.js: " + method + " unavailable on " + this.techName + " playback technology element.", e);
                    this.tech.isReady_ = false
                } else {
                    vjs.log(e)
                }
            }
            throw e
        }
    }
    return
};
vjs.Player.prototype.play = function() {
    this.techCall("play");
    return this
};
vjs.Player.prototype.pause = function() {
    this.techCall("pause");
    return this
};
vjs.Player.prototype.paused = function() {
    return this.techGet("paused") === false ? false : true
};
vjs.Player.prototype.currentTime = function(seconds) {
    if (seconds !== undefined) {
        this.techCall("setCurrentTime", seconds);
        return this
    }
    return this.cache_.currentTime = this.techGet("currentTime") || 0
};
vjs.Player.prototype.duration = function(seconds) {
    if (seconds !== undefined) {
        this.cache_.duration = parseFloat(seconds);
        return this
    }
    if (this.cache_.duration === undefined) {
        this.onDurationChange()
    }
    return this.cache_.duration || 0
};
vjs.Player.prototype.remainingTime = function() {
    return this.duration() - this.currentTime()
};
vjs.Player.prototype.buffered = function() {
    var buffered = this.techGet("buffered");
    if (!buffered || !buffered.length) {
        buffered = vjs.createTimeRange(0, 0)
    }
    return buffered
};
vjs.Player.prototype.bufferedPercent = function() {
    var duration = this.duration(),
        buffered = this.buffered(),
        bufferedDuration = 0,
        start, end;
    if (!duration) {
        return 0
    }
    for (var i = 0; i < buffered.length; i++) {
        start = buffered.start(i);
        end = buffered.end(i);
        if (end > duration) {
            end = duration
        }
        bufferedDuration += end - start
    }
    return bufferedDuration / duration
};
vjs.Player.prototype.bufferedEnd = function() {
    var buffered = this.buffered(),
        duration = this.duration(),
        end = buffered.end(buffered.length - 1);
    if (end > duration) {
        end = duration
    }
    return end
};
vjs.Player.prototype.volume = function(percentAsDecimal) {
    var vol;
    if (percentAsDecimal !== undefined) {
        vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal)));
        this.cache_.volume = vol;
        this.techCall("setVolume", vol);
        vjs.setLocalStorage("volume", vol);
        return this
    }
    vol = parseFloat(this.techGet("volume"));
    return isNaN(vol) ? 1 : vol
};
vjs.Player.prototype.muted = function(muted) {
    if (muted !== undefined) {
        this.techCall("setMuted", muted);
        return this
    }
    return this.techGet("muted") || false
};
vjs.Player.prototype.supportsFullScreen = function() {
    return this.techGet("supportsFullScreen") || false
};
vjs.Player.prototype.isFullscreen_ = false;
vjs.Player.prototype.isFullscreen = function(isFS) {
    if (isFS !== undefined) {
        this.isFullscreen_ = !!isFS;
        return this
    }
    return this.isFullscreen_
};
vjs.Player.prototype.isFullScreen = function(isFS) {
    vjs.log.warn('player.isFullScreen() has been deprecated, use player.isFullscreen() with a lowercase "s")');
    return this.isFullscreen(isFS)
};
vjs.Player.prototype.requestFullscreen = function() {
    var fsApi = vjs.browser.fullscreenAPI;
    this.isFullscreen(true);
    if (fsApi) {
        vjs.on(document, fsApi["fullscreenchange"], vjs.bind(this, function(e) {
            this.isFullscreen(document[fsApi.fullscreenElement]);
            if (this.isFullscreen() === false) {
                vjs.off(document, fsApi["fullscreenchange"], arguments.callee)
            }
            this.trigger("fullscreenchange")
        }));
        this.el_[fsApi.requestFullscreen]()
    } else if (this.tech.supportsFullScreen()) {
        this.techCall("enterFullScreen")
    } else {
        this.enterFullWindow();
        this.trigger("fullscreenchange")
    }
    return this
};
vjs.Player.prototype.requestFullScreen = function() {
    vjs.log.warn('player.requestFullScreen() has been deprecated, use player.requestFullscreen() with a lowercase "s")');
    return this.requestFullscreen()
};
vjs.Player.prototype.exitFullscreen = function() {
    var fsApi = vjs.browser.fullscreenAPI;
    this.isFullscreen(false);
    if (fsApi) {
        document[fsApi.exitFullscreen]()
    } else if (this.tech.supportsFullScreen()) {
        this.techCall("exitFullScreen")
    } else {
        this.exitFullWindow();
        this.trigger("fullscreenchange")
    }
    return this
};
vjs.Player.prototype.cancelFullScreen = function() {
    vjs.log.warn("player.cancelFullScreen() has been deprecated, use player.exitFullscreen()");
    return this.exitFullscreen()
};
vjs.Player.prototype.enterFullWindow = function() {
    this.isFullWindow = true;
    this.docOrigOverflow = document.documentElement.style.overflow;
    vjs.on(document, "keydown", vjs.bind(this, this.fullWindowOnEscKey));
    document.documentElement.style.overflow = "hidden";
    vjs.addClass(document.body, "vjs-full-window");
    this.trigger("enterFullWindow")
};
vjs.Player.prototype.fullWindowOnEscKey = function(event) {
    if (event.keyCode === 27) {
        if (this.isFullscreen() === true) {
            this.exitFullscreen()
        } else {
            this.exitFullWindow()
        }
    }
};
vjs.Player.prototype.exitFullWindow = function() {
    this.isFullWindow = false;
    vjs.off(document, "keydown", this.fullWindowOnEscKey);
    document.documentElement.style.overflow = this.docOrigOverflow;
    vjs.removeClass(document.body, "vjs-full-window");
    this.trigger("exitFullWindow")
};
vjs.Player.prototype.selectSource = function(sources) {
    for (var i = 0, j = this.options_["techOrder"]; i < j.length; i++) {
        var techName = vjs.capitalize(j[i]),
            tech = window["videojs"][techName];
        if (!tech) {
            vjs.log.error('The "' + techName + '" tech is undefined. Skipped browser support check for that tech.');
            continue
        }
        if (tech.isSupported()) {
            for (var a = 0, b = sources; a < b.length; a++) {
                var source = b[a];
                if (tech["canPlaySource"](source)) {
                    return {
                        source: source,
                        tech: techName
                    }
                }
            }
        }
    }
    return false
};
vjs.Player.prototype.src = function(source) {
    if (source === undefined) {
        return this.techGet("src")
    }
    if (vjs.obj.isArray(source)) {
        this.sourceList_(source)
    } else if (typeof source === "string") {
        this.src({
            src: source
        })
    } else if (source instanceof Object) {
        if (source.type && !window["videojs"][this.techName]["canPlaySource"](source)) {
            this.sourceList_([source])
        } else {
            this.cache_.src = source.src;
            this.currentType_ = source.type || "";
            this.ready(function() {
                if (window["videojs"][this.techName].prototype.hasOwnProperty("setSource")) {
                    this.techCall("setSource", source)
                } else {
                    this.techCall("src", source.src)
                }
                if (this.options_["preload"] == "auto") {
                    this.load()
                }
                if (this.options_["autoplay"]) {
                    this.play()
                }
            })
        }
    }
    return this
};
vjs.Player.prototype.sourceList_ = function(sources) {
    var sourceTech = this.selectSource(sources);
    if (sourceTech) {
        if (sourceTech.tech === this.techName) {
            this.src(sourceTech.source)
        } else {
            this.loadTech(sourceTech.tech, sourceTech.source)
        }
    } else {
        this.setTimeout(function() {
            this.error({
                code: 4,
                message: this.localize(this.options()["notSupportedMessage"])
            })
        }, 0);
        this.triggerReady()
    }
};
vjs.Player.prototype.load = function() {
    this.techCall("load");
    return this
};
vjs.Player.prototype.currentSrc = function() {
    return this.techGet("currentSrc") || this.cache_.src || ""
};
vjs.Player.prototype.currentType = function() {
    return this.currentType_ || ""
};
vjs.Player.prototype.preload = function(value) {
    if (value !== undefined) {
        this.techCall("setPreload", value);
        this.options_["preload"] = value;
        return this
    }
    return this.techGet("preload")
};
vjs.Player.prototype.autoplay = function(value) {
    if (value !== undefined) {
        this.techCall("setAutoplay", value);
        this.options_["autoplay"] = value;
        return this
    }
    return this.techGet("autoplay", value)
};
vjs.Player.prototype.loop = function(value) {
    if (value !== undefined) {
        this.techCall("setLoop", value);
        this.options_["loop"] = value;
        return this
    }
    return this.techGet("loop")
};
vjs.Player.prototype.poster_;
vjs.Player.prototype.poster = function(src) {
    if (src === undefined) {
        return this.poster_
    }
    if (!src) {
        src = ""
    }
    this.poster_ = src;
    this.techCall("setPoster", src);
    this.trigger("posterchange");
    return this
};
vjs.Player.prototype.controls_;
vjs.Player.prototype.controls = function(bool) {
    if (bool !== undefined) {
        bool = !!bool;
        if (this.controls_ !== bool) {
            this.controls_ = bool;
            if (bool) {
                this.removeClass("vjs-controls-disabled");
                this.addClass("vjs-controls-enabled");
                this.trigger("controlsenabled")
            } else {
                this.removeClass("vjs-controls-enabled");
                this.addClass("vjs-controls-disabled");
                this.trigger("controlsdisabled")
            }
        }
        return this
    }
    return this.controls_
};
vjs.Player.prototype.usingNativeControls_;
vjs.Player.prototype.usingNativeControls = function(bool) {
    if (bool !== undefined) {
        bool = !!bool;
        if (this.usingNativeControls_ !== bool) {
            this.usingNativeControls_ = bool;
            if (bool) {
                this.addClass("vjs-using-native-controls");
                this.trigger("usingnativecontrols")
            } else {
                this.removeClass("vjs-using-native-controls");
                this.trigger("usingcustomcontrols")
            }
        }
        return this
    }
    return this.usingNativeControls_
};
vjs.Player.prototype.error_ = null;
vjs.Player.prototype.error = function(err) {
    if (err === undefined) {
        return this.error_
    }
    if (err === null) {
        this.error_ = err;
        this.removeClass("vjs-error");
        return this
    }
    if (err instanceof vjs.MediaError) {
        this.error_ = err
    } else {
        this.error_ = new vjs.MediaError(err)
    }
    this.trigger("error");
    this.addClass("vjs-error");
    vjs.log.error("(CODE:" + this.error_.code + " " + vjs.MediaError.errorTypes[this.error_.code] + ")", this.error_.message, this.error_);
    return this
};
vjs.Player.prototype.ended = function() {
    return this.techGet("ended")
};
vjs.Player.prototype.seeking = function() {
    return this.techGet("seeking")
};
vjs.Player.prototype.userActivity_ = true;
vjs.Player.prototype.reportUserActivity = function(event) {
    this.userActivity_ = true
};
vjs.Player.prototype.userActive_ = true;
vjs.Player.prototype.userActive = function(bool) {
    if (bool !== undefined) {
        bool = !!bool;
        if (bool !== this.userActive_) {
            this.userActive_ = bool;
            if (bool) {
                this.userActivity_ = true;
                this.removeClass("vjs-user-inactive");
                this.addClass("vjs-user-active");
                this.trigger("useractive")
            } else {
                this.userActivity_ = false;
                if (this.tech) {
                    this.tech.one("mousemove", function(e) {
                        e.stopPropagation();
                        e.preventDefault()
                    })
                }
                this.removeClass("vjs-user-active");
                this.addClass("vjs-user-inactive");
                this.trigger("userinactive")
            }
        }
        return this
    }
    return this.userActive_
};
vjs.Player.prototype.listenForUserActivity = function() {
    var onActivity, onMouseMove, onMouseDown, mouseInProgress, onMouseUp, activityCheck, inactivityTimeout, lastMoveX, lastMoveY;
    onActivity = vjs.bind(this, this.reportUserActivity);
    onMouseMove = function(e) {
        if (e.screenX != lastMoveX || e.screenY != lastMoveY) {
            lastMoveX = e.screenX;
            lastMoveY = e.screenY;
            onActivity()
        }
    };
    onMouseDown = function() {
        onActivity();
        this.clearInterval(mouseInProgress);
        mouseInProgress = this.setInterval(onActivity, 250)
    };
    onMouseUp = function(event) {
        onActivity();
        this.clearInterval(mouseInProgress)
    };
    this.on("mousedown", onMouseDown);
    this.on("mousemove", onMouseMove);
    this.on("mouseup", onMouseUp);
    this.on("keydown", onActivity);
    this.on("keyup", onActivity);
    activityCheck = this.setInterval(function() {
        if (this.userActivity_) {
            this.userActivity_ = false;
            this.userActive(true);
            this.clearTimeout(inactivityTimeout);
            var timeout = this.options()["inactivityTimeout"];
            if (timeout > 0) {
                inactivityTimeout = this.setTimeout(function() {
                    if (!this.userActivity_) {
                        this.userActive(false)
                    }
                }, timeout)
            }
        }
    }, 250)
};
vjs.Player.prototype.playbackRate = function(rate) {
    if (rate !== undefined) {
        this.techCall("setPlaybackRate", rate);
        return this
    }
    if (this.tech && this.tech["featuresPlaybackRate"]) {
        return this.techGet("playbackRate")
    } else {
        return 1
    }
};
vjs.Player.prototype.isAudio_ = false;
vjs.Player.prototype.isAudio = function(bool) {
    if (bool !== undefined) {
        this.isAudio_ = !!bool;
        return this
    }
    return this.isAudio_
};
vjs.Player.prototype.networkState = function() {
    return this.techGet("networkState")
};
vjs.Player.prototype.readyState = function() {
    return this.techGet("readyState")
};
vjs.Player.prototype.textTracks = function() {
    return this.tech && this.tech["textTracks"]()
};
vjs.Player.prototype.remoteTextTracks = function() {
    return this.tech && this.tech["remoteTextTracks"]()
};
vjs.Player.prototype.addTextTrack = function(kind, label, language) {
    return this.tech && this.tech["addTextTrack"](kind, label, language)
};
vjs.Player.prototype.addRemoteTextTrack = function(options) {
    return this.tech && this.tech["addRemoteTextTrack"](options)
};
vjs.Player.prototype.removeRemoteTextTrack = function(track) {
    this.tech && this.tech["removeRemoteTextTrack"](track)
};
vjs.ControlBar = vjs.Component.extend();
vjs.ControlBar.prototype.options_ = {
    loadEvent: "play",
    children: {
        playToggle: {},
        durationDisplay: {},
        liveDisplay: {},
        progressControl: {},
        fullscreenToggle: {},
        volumeControl: {}
    }
};
vjs.ControlBar.prototype.createEl = function() {
    return vjs.createEl("div", {
        className: "vjs-control-bar"
    })
};
vjs.LiveDisplay = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options)
    }
});
vjs.LiveDisplay.prototype.createEl = function() {
    var el = vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-live-controls vjs-control"
    });
    this.contentEl_ = vjs.createEl("div", {
        className: "vjs-live-display",
        innerHTML: '<span class="vjs-control-text">' + this.localize("Stream Type") + "</span>" + this.localize("LIVE"),
        "aria-live": "off"
    });
    el.appendChild(this.contentEl_);
    return el
};
vjs.PlayToggle = vjs.Button.extend({
    init: function(player, options) {
        vjs.Button.call(this, player, options);
        this.on(player, "play", this.onPlay);
        this.on(player, "pause", this.onPause)
    }
});
vjs.PlayToggle.prototype.buttonText = "Play";
vjs.PlayToggle.prototype.buildCSSClass = function() {
    return "vjs-play-control " + vjs.Button.prototype.buildCSSClass.call(this)
};
vjs.PlayToggle.prototype.onClick = function() {
    if (this.player_.paused()) {
        this.player_.play()
    } else {
        this.player_.pause()
    }
};
vjs.PlayToggle.prototype.onPlay = function() {
    this.removeClass("vjs-paused");
    this.addClass("vjs-playing");
    this.el_.children[0].children[0].innerHTML = this.localize("Pause")
};
vjs.PlayToggle.prototype.onPause = function() {
    this.removeClass("vjs-playing");
    this.addClass("vjs-paused");
    this.el_.children[0].children[0].innerHTML = this.localize("Play")
};
vjs.CurrentTimeDisplay = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options);
        this.on(player, "timeupdate", this.updateContent)
    }
});
vjs.CurrentTimeDisplay.prototype.createEl = function() {
    var el = vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-current-time vjs-time-controls vjs-control"
    });
    this.contentEl_ = vjs.createEl("div", {
        className: "vjs-current-time-display",
        innerHTML: '<span class="vjs-control-text">Current Time </span>' + "0:00",
        "aria-live": "off"
    });
    el.appendChild(this.contentEl_);
    return el
};
vjs.CurrentTimeDisplay.prototype.updateContent = function() {
    var time = this.player_.scrubbing ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.contentEl_.innerHTML = '<span class="vjs-control-text">' + this.localize("Current Time") + "</span> " + vjs.formatTime(time, this.player_.duration())
};
vjs.DurationDisplay = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options);
        this.on(player, "timeupdate", this.updateContent)
    }
});
vjs.DurationDisplay.prototype.createEl = function() {
    var el = vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-duration vjs-time-controls vjs-control"
    });
    this.contentEl_ = vjs.createEl("div", {
        className: "vjs-duration-display",
        innerHTML: "0:00",
        "aria-live": "off"
    });
    el.appendChild(this.contentEl_);
    return el
};
vjs.DurationDisplay.prototype.updateContent = function() {
    var duration = this.player_.duration();
    if (duration) {
        this.contentEl_.innerHTML = vjs.formatTime(duration)
    }
};
vjs.TimeDivider = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options)
    }
});
vjs.TimeDivider.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-time-divider",
        innerHTML: "<div><span>/</span></div>"
    })
};
vjs.RemainingTimeDisplay = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options);
        this.on(player, "timeupdate", this.updateContent)
    }
});
vjs.RemainingTimeDisplay.prototype.createEl = function() {
    var el = vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-remaining-time vjs-time-controls vjs-control"
    });
    this.contentEl_ = vjs.createEl("div", {
        className: "vjs-remaining-time-display",
        innerHTML: '<span class="vjs-control-text">' + this.localize("Remaining Time") + "</span> " + "-0:00",
        "aria-live": "off"
    });
    el.appendChild(this.contentEl_);
    return el
};
vjs.RemainingTimeDisplay.prototype.updateContent = function() {
    if (this.player_.duration()) {
        this.contentEl_.innerHTML = '<span class="vjs-control-text">' + this.localize("Remaining Time") + "</span> " + "-" + vjs.formatTime(this.player_.remainingTime())
    }
};
vjs.FullscreenToggle = vjs.Button.extend({
    init: function(player, options) {
        vjs.Button.call(this, player, options)
    }
});
vjs.FullscreenToggle.prototype.buttonText = "Fullscreen";
vjs.FullscreenToggle.prototype.buildCSSClass = function() {
    return "vjs-fullscreen-control " + vjs.Button.prototype.buildCSSClass.call(this)
};
vjs.FullscreenToggle.prototype.onClick = function() {
    if (!this.player_.isFullscreen()) {
        this.player_.requestFullscreen()
    } else {
        this.player_.exitFullscreen()
    }
};
vjs.ProgressControl = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options)
    }
});
vjs.ProgressControl.prototype.options_ = {
    children: {
        seekBar: {}
    }
};
vjs.ProgressControl.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-progress-control vjs-control"
    })
};
vjs.SeekBar = vjs.Slider.extend({
    init: function(player, options) {
        vjs.Slider.call(this, player, options);
        this.on(player, "timeupdate", this.updateARIAAttributes);
        player.ready(vjs.bind(this, this.updateARIAAttributes))
    }
});
vjs.SeekBar.prototype.options_ = {
    children: {
        loadProgressBar: {},
        playProgressBar: {},
        seekHandle: {}
    },
    barName: "playProgressBar",
    handleName: "seekHandle"
};
vjs.SeekBar.prototype.playerEvent = "timeupdate";
vjs.SeekBar.prototype.createEl = function() {
    return vjs.Slider.prototype.createEl.call(this, "div", {
        className: "vjs-progress-holder",
        "aria-label": "video progress bar"
    })
};
vjs.SeekBar.prototype.updateARIAAttributes = function() {
    var time = this.player_.scrubbing ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.setAttribute("aria-valuenow", vjs.round(this.getPercent() * 100, 2));
    this.el_.setAttribute("aria-valuetext", vjs.formatTime(time, this.player_.duration()))
};
vjs.SeekBar.prototype.getPercent = function() {
    return this.player_.currentTime() / this.player_.duration()
};
vjs.SeekBar.prototype.onMouseDown = function(event) {
    vjs.Slider.prototype.onMouseDown.call(this, event);
    this.player_.scrubbing = true;
    this.player_.addClass("vjs-scrubbing");
    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause()
};
vjs.SeekBar.prototype.onMouseMove = function(event) {
    var newTime = this.calculateDistance(event) * this.player_.duration();
    if (newTime == this.player_.duration()) {
        newTime = newTime - .1
    }
    this.player_.currentTime(newTime)
};
vjs.SeekBar.prototype.onMouseUp = function(event) {
    vjs.Slider.prototype.onMouseUp.call(this, event);
    this.player_.scrubbing = false;
    this.player_.removeClass("vjs-scrubbing");
    if (this.videoWasPlaying) {
        this.player_.play()
    }
};
vjs.SeekBar.prototype.stepForward = function() {
    this.player_.currentTime(this.player_.currentTime() + 5)
};
vjs.SeekBar.prototype.stepBack = function() {
    this.player_.currentTime(this.player_.currentTime() - 5)
};
vjs.LoadProgressBar = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options);
        this.on(player, "progress", this.update)
    }
});
vjs.LoadProgressBar.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-load-progress",
        innerHTML: '<span class="vjs-control-text"><span>' + this.localize("Loaded") + "</span>: 0%</span>"
    })
};
vjs.LoadProgressBar.prototype.update = function() {
    var i, start, end, part, buffered = this.player_.buffered(),
        duration = this.player_.duration(),
        bufferedEnd = this.player_.bufferedEnd(),
        children = this.el_.children,
        percentify = function(time, end) {
            var percent = time / end || 0;
            return percent * 100 + "%"
        };
    this.el_.style.width = percentify(bufferedEnd, duration);
    for (i = 0; i < buffered.length; i++) {
        start = buffered.start(i), end = buffered.end(i), part = children[i];
        if (!part) {
            part = this.el_.appendChild(vjs.createEl())
        }
        part.style.left = percentify(start, bufferedEnd);
        part.style.width = percentify(end - start, bufferedEnd)
    }
    for (i = children.length; i > buffered.length; i--) {
        this.el_.removeChild(children[i - 1])
    }
};
vjs.PlayProgressBar = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options)
    }
});
vjs.PlayProgressBar.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-play-progress",
        innerHTML: '<span class="vjs-control-text"><span>' + this.localize("Progress") + "</span>: 0%</span>"
    })
};
vjs.SeekHandle = vjs.SliderHandle.extend({
    init: function(player, options) {
        vjs.SliderHandle.call(this, player, options);
        this.on(player, "timeupdate", this.updateContent)
    }
});
vjs.SeekHandle.prototype.defaultValue = "00:00";
vjs.SeekHandle.prototype.createEl = function() {
    return vjs.SliderHandle.prototype.createEl.call(this, "div", {
        className: "vjs-seek-handle",
        "aria-live": "off"
    })
};
vjs.SeekHandle.prototype.updateContent = function() {
    var time = this.player_.scrubbing ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.innerHTML = '<span class="vjs-control-text">' + vjs.formatTime(time, this.player_.duration()) + "</span>"
};
vjs.VolumeControl = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options);
        if (player.tech && player.tech["featuresVolumeControl"] === false) {
            this.addClass("vjs-hidden")
        }
        this.on(player, "loadstart", function() {
            if (player.tech["featuresVolumeControl"] === false) {
                this.addClass("vjs-hidden")
            } else {
                this.removeClass("vjs-hidden")
            }
        })
    }
});
vjs.VolumeControl.prototype.options_ = {
    children: {
        volumeBar: {}
    }
};
vjs.VolumeControl.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-volume-control vjs-control"
    })
};
vjs.VolumeBar = vjs.Slider.extend({
    init: function(player, options) {
        vjs.Slider.call(this, player, options);
        this.on(player, "volumechange", this.updateARIAAttributes);
        player.ready(vjs.bind(this, this.updateARIAAttributes))
    }
});
vjs.VolumeBar.prototype.updateARIAAttributes = function() {
    this.el_.setAttribute("aria-valuenow", vjs.round(this.player_.volume() * 100, 2));
    this.el_.setAttribute("aria-valuetext", vjs.round(this.player_.volume() * 100, 2) + "%")
};
vjs.VolumeBar.prototype.options_ = {
    children: {
        volumeLevel: {},
        volumeHandle: {}
    },
    barName: "volumeLevel",
    handleName: "volumeHandle"
};
vjs.VolumeBar.prototype.playerEvent = "volumechange";
vjs.VolumeBar.prototype.createEl = function() {
    return vjs.Slider.prototype.createEl.call(this, "div", {
        className: "vjs-volume-bar",
        "aria-label": "volume level"
    })
};
vjs.VolumeBar.prototype.onMouseMove = function(event) {
    if (this.player_.muted()) {
        this.player_.muted(false)
    }
    this.player_.volume(this.calculateDistance(event))
};
vjs.VolumeBar.prototype.getPercent = function() {
    if (this.player_.muted()) {
        return 0
    } else {
        return this.player_.volume()
    }
};
vjs.VolumeBar.prototype.stepForward = function() {
    this.player_.volume(this.player_.volume() + .1)
};
vjs.VolumeBar.prototype.stepBack = function() {
    this.player_.volume(this.player_.volume() - .1)
};
vjs.VolumeLevel = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options)
    }
});
vjs.VolumeLevel.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-volume-level",
        innerHTML: '<span class="vjs-control-text"></span>'
    })
};
vjs.VolumeHandle = vjs.SliderHandle.extend();
vjs.VolumeHandle.prototype.defaultValue = "00:00";
vjs.VolumeHandle.prototype.createEl = function() {
    return vjs.SliderHandle.prototype.createEl.call(this, "div", {
        className: "vjs-volume-handle"
    })
};
vjs.MuteToggle = vjs.Button.extend({
    init: function(player, options) {
        vjs.Button.call(this, player, options);
        this.on(player, "volumechange", this.update);
        if (player.tech && player.tech["featuresVolumeControl"] === false) {
            this.addClass("vjs-hidden")
        }
        this.on(player, "loadstart", function() {
            if (player.tech["featuresVolumeControl"] === false) {
                this.addClass("vjs-hidden")
            } else {
                this.removeClass("vjs-hidden")
            }
        })
    }
});
vjs.MuteToggle.prototype.createEl = function() {
    return vjs.Button.prototype.createEl.call(this, "div", {
        className: "vjs-mute-control vjs-control",
        innerHTML: '<div><span class="vjs-control-text">' + this.localize("Mute") + "</span></div>"
    })
};
vjs.MuteToggle.prototype.onClick = function() {
    this.player_.muted(this.player_.muted() ? false : true)
};
vjs.MuteToggle.prototype.update = function() {
    var vol = this.player_.volume(),
        level = 3;
    if (vol === 0 || this.player_.muted()) {
        level = 0
    } else if (vol < .33) {
        level = 1
    } else if (vol < .67) {
        level = 2
    }
    if (this.player_.muted()) {
        if (this.el_.children[0].children[0].innerHTML != this.localize("Unmute")) {
            this.el_.children[0].children[0].innerHTML = this.localize("Unmute")
        }
    } else {
        if (this.el_.children[0].children[0].innerHTML != this.localize("Mute")) {
            this.el_.children[0].children[0].innerHTML = this.localize("Mute")
        }
    }
    for (var i = 0; i < 4; i++) {
        vjs.removeClass(this.el_, "vjs-vol-" + i)
    }
    vjs.addClass(this.el_, "vjs-vol-" + level)
};
vjs.VolumeMenuButton = vjs.MenuButton.extend({
    init: function(player, options) {
        vjs.MenuButton.call(this, player, options);
        this.on(player, "volumechange", this.volumeUpdate);
        if (player.tech && player.tech["featuresVolumeControl"] === false) {
            this.addClass("vjs-hidden")
        }
        this.on(player, "loadstart", function() {
            if (player.tech["featuresVolumeControl"] === false) {
                this.addClass("vjs-hidden")
            } else {
                this.removeClass("vjs-hidden")
            }
        });
        this.addClass("vjs-menu-button")
    }
});
vjs.VolumeMenuButton.prototype.createMenu = function() {
    var menu = new vjs.Menu(this.player_, {
        contentElType: "div"
    });
    var vc = new vjs.VolumeBar(this.player_, this.options_["volumeBar"]);
    vc.on("focus", function() {
        menu.lockShowing()
    });
    vc.on("blur", function() {
        menu.unlockShowing()
    });
    menu.addChild(vc);
    return menu
};
vjs.VolumeMenuButton.prototype.onClick = function() {
    vjs.MuteToggle.prototype.onClick.call(this);
    vjs.MenuButton.prototype.onClick.call(this)
};
vjs.VolumeMenuButton.prototype.createEl = function() {
    return vjs.Button.prototype.createEl.call(this, "div", {
        className: "vjs-volume-menu-button vjs-menu-button vjs-control",
        innerHTML: '<div><span class="vjs-control-text">' + this.localize("Mute") + "</span></div>"
    })
};
vjs.VolumeMenuButton.prototype.volumeUpdate = vjs.MuteToggle.prototype.update;
vjs.PlaybackRateMenuButton = vjs.MenuButton.extend({
    init: function(player, options) {
        vjs.MenuButton.call(this, player, options);
        this.updateVisibility();
        this.updateLabel();
        this.on(player, "loadstart", this.updateVisibility);
        this.on(player, "ratechange", this.updateLabel)
    }
});
vjs.PlaybackRateMenuButton.prototype.buttonText = "Playback Rate";
vjs.PlaybackRateMenuButton.prototype.className = "vjs-playback-rate";
vjs.PlaybackRateMenuButton.prototype.createEl = function() {
    var el = vjs.MenuButton.prototype.createEl.call(this);
    this.labelEl_ = vjs.createEl("div", {
        className: "vjs-playback-rate-value",
        innerHTML: 1
    });
    el.appendChild(this.labelEl_);
    return el
};
vjs.PlaybackRateMenuButton.prototype.createMenu = function() {
    var menu = new vjs.Menu(this.player());
    var rates = this.player().options()["playbackRates"];
    if (rates) {
        for (var i = rates.length - 1; i >= 0; i--) {
            menu.addChild(new vjs.PlaybackRateMenuItem(this.player(), {
                rate: rates[i] + "x"
            }))
        }
    }
    return menu
};
vjs.PlaybackRateMenuButton.prototype.updateARIAAttributes = function() {
    this.el().setAttribute("aria-valuenow", this.player().playbackRate())
};
vjs.PlaybackRateMenuButton.prototype.onClick = function() {
    var currentRate = this.player().playbackRate();
    var rates = this.player().options()["playbackRates"];
    var newRate = rates[0];
    for (var i = 0; i < rates.length; i++) {
        if (rates[i] > currentRate) {
            newRate = rates[i];
            break
        }
    }
    this.player().playbackRate(newRate)
};
vjs.PlaybackRateMenuButton.prototype.playbackRateSupported = function() {
    return this.player().tech && this.player().tech["featuresPlaybackRate"] && this.player().options()["playbackRates"] && this.player().options()["playbackRates"].length > 0
};
vjs.PlaybackRateMenuButton.prototype.updateVisibility = function() {
    if (this.playbackRateSupported()) {
        this.removeClass("vjs-hidden")
    } else {
        this.addClass("vjs-hidden")
    }
};
vjs.PlaybackRateMenuButton.prototype.updateLabel = function() {
    if (this.playbackRateSupported()) {
        this.labelEl_.innerHTML = this.player().playbackRate() + "x"
    }
};
vjs.PlaybackRateMenuItem = vjs.MenuItem.extend({
    contentElType: "button",
    init: function(player, options) {
        var label = this.label = options["rate"];
        var rate = this.rate = parseFloat(label, 10);
        options["label"] = label;
        options["selected"] = rate === 1;
        vjs.MenuItem.call(this, player, options);
        this.on(player, "ratechange", this.update)
    }
});
vjs.PlaybackRateMenuItem.prototype.onClick = function() {
    vjs.MenuItem.prototype.onClick.call(this);
    this.player().playbackRate(this.rate)
};
vjs.PlaybackRateMenuItem.prototype.update = function() {
    this.selected(this.player().playbackRate() == this.rate)
};
vjs.PosterImage = vjs.Button.extend({
    init: function(player, options) {
        vjs.Button.call(this, player, options);
        this.update();
        player.on("posterchange", vjs.bind(this, this.update))
    }
});
vjs.PosterImage.prototype.dispose = function() {
    this.player().off("posterchange", this.update);
    vjs.Button.prototype.dispose.call(this)
};
vjs.PosterImage.prototype.createEl = function() {
    var el = vjs.createEl("div", {
        className: "vjs-poster",
        tabIndex: -1
    });
    if (!vjs.BACKGROUND_SIZE_SUPPORTED) {
        this.fallbackImg_ = vjs.createEl("img");
        el.appendChild(this.fallbackImg_)
    }
    return el
};
vjs.PosterImage.prototype.update = function() {
    var url = this.player().poster();
    this.setSrc(url);
    if (url) {
        this.show()
    } else {
        this.hide()
    }
};
vjs.PosterImage.prototype.setSrc = function(url) {
    var backgroundImage;
    if (this.fallbackImg_) {
        this.fallbackImg_.src = url
    } else {
        backgroundImage = "";
        if (url) {
            backgroundImage = 'url("' + url + '")'
        }
        this.el_.style.backgroundImage = backgroundImage
    }
};
vjs.PosterImage.prototype.onClick = function() {
    this.player_.play()
};
vjs.LoadingSpinner = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options)
    }
});
vjs.LoadingSpinner.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-loading-spinner"
    })
};
vjs.BigPlayButton = vjs.Button.extend();
vjs.BigPlayButton.prototype.createEl = function() {
    return vjs.Button.prototype.createEl.call(this, "div", {
        className: "vjs-big-play-button",
        innerHTML: '<span aria-hidden="true"></span>',
        "aria-label": "play video"
    })
};
vjs.BigPlayButton.prototype.onClick = function() {
    this.player_.play()
};
vjs.ErrorDisplay = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options);
        this.update();
        this.on(player, "error", this.update)
    }
});
vjs.ErrorDisplay.prototype.createEl = function() {
    var el = vjs.Component.prototype.createEl.call(this, "div", {
        className: "vjs-error-display"
    });
    this.contentEl_ = vjs.createEl("div");
    el.appendChild(this.contentEl_);
    return el
};
vjs.ErrorDisplay.prototype.update = function() {
    if (this.player().error()) {
        this.contentEl_.innerHTML = this.localize(this.player().error().message)
    }
};
(function() {
    var createTrackHelper;
    vjs.MediaTechController = vjs.Component.extend({
        init: function(player, options, ready) {
            options = options || {};
            options.reportTouchActivity = false;
            vjs.Component.call(this, player, options, ready);
            if (!this["featuresProgressEvents"]) {
                this.manualProgressOn()
            }
            if (!this["featuresTimeupdateEvents"]) {
                this.manualTimeUpdatesOn()
            }
            this.initControlsListeners();
            this.initTextTrackListeners()
        }
    });
    vjs.MediaTechController.prototype.initControlsListeners = function() {
        var player, activateControls;
        player = this.player();
        activateControls = function() {
            if (player.controls() && !player.usingNativeControls()) {
                this.addControlsListeners()
            }
        };
        this.ready(activateControls);
        this.on(player, "controlsenabled", activateControls);
        this.on(player, "controlsdisabled", this.removeControlsListeners);
        this.ready(function() {
            if (this.networkState && this.networkState() > 0) {
                this.player().trigger("loadstart")
            }
        })
    };
    vjs.MediaTechController.prototype.addControlsListeners = function() {
        var userWasActive;
        this.on("mousedown", this.onClick);
        this.on("touchstart", function(event) {
            userWasActive = this.player_.userActive()
        });
        this.on("touchmove", function(event) {
            if (userWasActive) {
                this.player().reportUserActivity()
            }
        });
        this.on("touchend", function(event) {
            event.preventDefault()
        });
        this.emitTapEvents();
        this.on("tap", this.onTap)
    };
    vjs.MediaTechController.prototype.removeControlsListeners = function() {
        this.off("tap");
        this.off("touchstart");
        this.off("touchmove");
        this.off("touchleave");
        this.off("touchcancel");
        this.off("touchend");
        this.off("click");
        this.off("mousedown")
    };
    vjs.MediaTechController.prototype.onClick = function(event) {
        if (event.button !== 0) return;
        if (this.player().controls()) {
            if (this.player().paused()) {
                this.player().play()
            } else {
                this.player().pause()
            }
        }
    };
    vjs.MediaTechController.prototype.onTap = function() {
        this.player().userActive(!this.player().userActive())
    };
    vjs.MediaTechController.prototype.manualProgressOn = function() {
        this.manualProgress = true;
        this.trackProgress()
    };
    vjs.MediaTechController.prototype.manualProgressOff = function() {
        this.manualProgress = false;
        this.stopTrackingProgress()
    };
    vjs.MediaTechController.prototype.trackProgress = function() {
        this.progressInterval = this.setInterval(function() {
            var bufferedPercent = this.player().bufferedPercent();
            if (this.bufferedPercent_ != bufferedPercent) {
                this.player().trigger("progress")
            }
            this.bufferedPercent_ = bufferedPercent;
            if (bufferedPercent === 1) {
                this.stopTrackingProgress()
            }
        }, 500)
    };
    vjs.MediaTechController.prototype.stopTrackingProgress = function() {
        this.clearInterval(this.progressInterval)
    };
    vjs.MediaTechController.prototype.manualTimeUpdatesOn = function() {
        var player = this.player_;
        this.manualTimeUpdates = true;
        this.on(player, "play", this.trackCurrentTime);
        this.on(player, "pause", this.stopTrackingCurrentTime);
        this.one("timeupdate", function() {
            this["featuresTimeupdateEvents"] = true;
            this.manualTimeUpdatesOff()
        })
    };
    vjs.MediaTechController.prototype.manualTimeUpdatesOff = function() {
        var player = this.player_;
        this.manualTimeUpdates = false;
        this.stopTrackingCurrentTime();
        this.off(player, "play", this.trackCurrentTime);
        this.off(player, "pause", this.stopTrackingCurrentTime)
    };
    vjs.MediaTechController.prototype.trackCurrentTime = function() {
        if (this.currentTimeInterval) {
            this.stopTrackingCurrentTime()
        }
        this.currentTimeInterval = this.setInterval(function() {
            this.player().trigger("timeupdate")
        }, 250)
    };
    vjs.MediaTechController.prototype.stopTrackingCurrentTime = function() {
        this.clearInterval(this.currentTimeInterval);
        this.player().trigger("timeupdate")
    };
    vjs.MediaTechController.prototype.dispose = function() {
        if (this.manualProgress) {
            this.manualProgressOff()
        }
        if (this.manualTimeUpdates) {
            this.manualTimeUpdatesOff()
        }
        vjs.Component.prototype.dispose.call(this)
    };
    vjs.MediaTechController.prototype.setCurrentTime = function() {
        if (this.manualTimeUpdates) {
            this.player().trigger("timeupdate")
        }
    };
    vjs.MediaTechController.prototype.initTextTrackListeners = function() {
        var player = this.player_,
            tracks, textTrackListChanges = function() {
                var textTrackDisplay = player.getChild("textTrackDisplay"),
                    controlBar;
                if (textTrackDisplay) {
                    textTrackDisplay.updateDisplay()
                }
            };
        tracks = this.textTracks();
        if (!tracks) {
            return
        }
        tracks.addEventListener("removetrack", textTrackListChanges);
        tracks.addEventListener("addtrack", textTrackListChanges);
        this.on("dispose", vjs.bind(this, function() {
            tracks.removeEventListener("removetrack", textTrackListChanges);
            tracks.removeEventListener("addtrack", textTrackListChanges)
        }))
    };
    vjs.MediaTechController.prototype.textTracks_;
    vjs.MediaTechController.prototype.textTracks = function() {
        this.player_.textTracks_ = this.player_.textTracks_ || new vjs.TextTrackList;
        return this.player_.textTracks_
    };
    vjs.MediaTechController.prototype.remoteTextTracks = function() {
        this.player_.remoteTextTracks_ = this.player_.remoteTextTracks_ || new vjs.TextTrackList;
        return this.player_.remoteTextTracks_
    };
    createTrackHelper = function(self, kind, label, language, options) {
        var tracks = self.textTracks(),
            track;
        options = options || {};
        options["kind"] = kind;
        if (label) {
            options["label"] = label
        }
        if (language) {
            options["language"] = language
        }
        options["player"] = self.player_;
        track = new vjs.TextTrack(options);
        tracks.addTrack_(track);
        return track
    };
    vjs.MediaTechController.prototype.addTextTrack = function(kind, label, language) {
        if (!kind) {
            throw new Error("TextTrack kind is required but was not provided")
        }
        return createTrackHelper(this, kind, label, language)
    };
    vjs.MediaTechController.prototype.addRemoteTextTrack = function(options) {
        var track = createTrackHelper(this, options["kind"], options["label"], options["language"], options);
        this.remoteTextTracks().addTrack_(track);
        return {
            track: track
        }
    };
    vjs.MediaTechController.prototype.removeRemoteTextTrack = function(track) {
        this.textTracks().removeTrack_(track);
        this.remoteTextTracks().removeTrack_(track)
    };
    vjs.MediaTechController.prototype.setPoster = function() {};
    vjs.MediaTechController.prototype["featuresVolumeControl"] = true;
    vjs.MediaTechController.prototype["featuresFullscreenResize"] = false;
    vjs.MediaTechController.prototype["featuresPlaybackRate"] = false;
    vjs.MediaTechController.prototype["featuresProgressEvents"] = false;
    vjs.MediaTechController.prototype["featuresTimeupdateEvents"] = false;
    vjs.MediaTechController.prototype["featuresNativeTextTracks"] = false;
    vjs.MediaTechController.withSourceHandlers = function(Tech) {
        Tech.registerSourceHandler = function(handler, index) {
            var handlers = Tech.sourceHandlers;
            if (!handlers) {
                handlers = Tech.sourceHandlers = []
            }
            if (index === undefined) {
                index = handlers.length
            }
            handlers.splice(index, 0, handler)
        };
        Tech.selectSourceHandler = function(source) {
            var handlers = Tech.sourceHandlers || [],
                can;
            for (var i = 0; i < handlers.length; i++) {
                can = handlers[i].canHandleSource(source);
                if (can) {
                    return handlers[i]
                }
            }
            return null
        };
        Tech.canPlaySource = function(srcObj) {
            var sh = Tech.selectSourceHandler(srcObj);
            if (sh) {
                return sh.canHandleSource(srcObj)
            }
            return ""
        };
        Tech.prototype.setSource = function(source) {
            var sh = Tech.selectSourceHandler(source);
            if (!sh) {
                if (Tech.nativeSourceHandler) {
                    sh = Tech.nativeSourceHandler
                } else {
                    vjs.log.error("No source hander found for the current source.")
                }
            }
            this.disposeSourceHandler();
            this.off("dispose", this.disposeSourceHandler);
            this.currentSource_ = source;
            this.sourceHandler_ = sh.handleSource(source, this);
            this.on("dispose", this.disposeSourceHandler);
            return this
        };
        Tech.prototype.disposeSourceHandler = function() {
            if (this.sourceHandler_ && this.sourceHandler_.dispose) {
                this.sourceHandler_.dispose()
            }
        }
    };
    vjs.media = {}
})();
vjs.Html5 = vjs.MediaTechController.extend({
    init: function(player, options, ready) {
        var nodes, nodesLength, i, node, nodeName, removeNodes;
        if (options["nativeCaptions"] === false || options["nativeTextTracks"] === false) {
            this["featuresNativeTextTracks"] = false
        }
        vjs.MediaTechController.call(this, player, options, ready);
        this.setupTriggers();
        var source = options["source"];
        if (source && (this.el_.currentSrc !== source.src || player.tag && player.tag.initNetworkState_ === 3)) {
            this.setSource(source)
        }
        if (this.el_.hasChildNodes()) {
            nodes = this.el_.childNodes;
            nodesLength = nodes.length;
            removeNodes = [];
            while (nodesLength--) {
                node = nodes[nodesLength];
                nodeName = node.nodeName.toLowerCase();
                if (nodeName === "track") {
                    if (!this["featuresNativeTextTracks"]) {
                        removeNodes.push(node)
                    } else {
                        this.remoteTextTracks().addTrack_(node["track"])
                    }
                }
            }
            for (i = 0; i < removeNodes.length; i++) {
                this.el_.removeChild(removeNodes[i])
            }
        }
        if (this["featuresNativeTextTracks"]) {
            this.on("loadstart", vjs.bind(this, this.hideCaptions))
        }
        if (vjs.TOUCH_ENABLED && player.options()["nativeControlsForTouch"] === true) {
            this.useNativeControls()
        }
        player.ready(function() {
            if (this.tag && this.options_["autoplay"] && this.paused()) {
                delete this.tag["poster"];
                this.play()
            }
        });
        this.triggerReady()
    }
});
vjs.Html5.prototype.dispose = function() {
    vjs.Html5.disposeMediaElement(this.el_);
    vjs.MediaTechController.prototype.dispose.call(this)
};
vjs.Html5.prototype.createEl = function() {
    var player = this.player_,
        track, trackEl, i, el = player.tag,
        attributes, newEl, clone;
    if (!el || this["movingMediaElementInDOM"] === false) {
        if (el) {
            clone = el.cloneNode(false);
            vjs.Html5.disposeMediaElement(el);
            el = clone;
            player.tag = null
        } else {
            el = vjs.createEl("video");
            attributes = videojs.util.mergeOptions({}, player.tagAttributes);
            if (!vjs.TOUCH_ENABLED || player.options()["nativeControlsForTouch"] !== true) {
                delete attributes.controls
            }
            vjs.setElementAttributes(el, vjs.obj.merge(attributes, {
                id: player.id() + "_html5_api",
                class: "vjs-tech"
            }))
        }
        el["player"] = player;
        if (player.options_.tracks) {
            for (i = 0; i < player.options_.tracks.length; i++) {
                track = player.options_.tracks[i];
                trackEl = document.createElement("track");
                trackEl.kind = track.kind;
                trackEl.label = track.label;
                trackEl.srclang = track.srclang;
                trackEl.src = track.src;
                if ("default" in track) {
                    trackEl.setAttribute("default", "default")
                }
                el.appendChild(trackEl)
            }
        }
        vjs.insertFirst(el, player.el())
    }
    var settingsAttrs = ["autoplay", "preload", "loop", "muted"];
    for (i = settingsAttrs.length - 1; i >= 0; i--) {
        var attr = settingsAttrs[i];
        var overwriteAttrs = {};
        if (typeof player.options_[attr] !== "undefined") {
            overwriteAttrs[attr] = player.options_[attr]
        }
        vjs.setElementAttributes(el, overwriteAttrs)
    }
    return el
};
vjs.Html5.prototype.hideCaptions = function() {
    var tracks = this.el_.querySelectorAll("track"),
        track, i = tracks.length,
        kinds = {
            captions: 1,
            subtitles: 1
        };
    while (i--) {
        track = tracks[i].track;
        if (track && track["kind"] in kinds && !tracks[i]["default"]) {
            track.mode = "disabled"
        }
    }
};
vjs.Html5.prototype.setupTriggers = function() {
    for (var i = vjs.Html5.Events.length - 1; i >= 0; i--) {
        this.on(vjs.Html5.Events[i], this.eventHandler)
    }
};
vjs.Html5.prototype.eventHandler = function(evt) {
    if (evt.type == "error" && this.error()) {
        this.player().error(this.error().code)
    } else {
        evt.bubbles = false;
        this.player().trigger(evt)
    }
};
vjs.Html5.prototype.useNativeControls = function() {
    var tech, player, controlsOn, controlsOff, cleanUp;
    tech = this;
    player = this.player();
    tech.setControls(player.controls());
    controlsOn = function() {
        tech.setControls(true)
    };
    controlsOff = function() {
        tech.setControls(false)
    };
    player.on("controlsenabled", controlsOn);
    player.on("controlsdisabled", controlsOff);
    cleanUp = function() {
        player.off("controlsenabled", controlsOn);
        player.off("controlsdisabled", controlsOff)
    };
    tech.on("dispose", cleanUp);
    player.on("usingcustomcontrols", cleanUp);
    player.usingNativeControls(true)
};
vjs.Html5.prototype.play = function() {
    this.el_.play()
};
vjs.Html5.prototype.pause = function() {
    this.el_.pause()
};
vjs.Html5.prototype.paused = function() {
    return this.el_.paused
};
vjs.Html5.prototype.currentTime = function() {
    return this.el_.currentTime
};
vjs.Html5.prototype.setCurrentTime = function(seconds) {
    try {
        this.el_.currentTime = seconds
    } catch (e) {
        vjs.log(e, "Video is not ready. (Video.js)")
    }
};
vjs.Html5.prototype.duration = function() {
    return this.el_.duration || 0
};
vjs.Html5.prototype.buffered = function() {
    return this.el_.buffered
};
vjs.Html5.prototype.volume = function() {
    return this.el_.volume
};
vjs.Html5.prototype.setVolume = function(percentAsDecimal) {
    this.el_.volume = percentAsDecimal
};
vjs.Html5.prototype.muted = function() {
    return this.el_.muted
};
vjs.Html5.prototype.setMuted = function(muted) {
    this.el_.muted = muted
};
vjs.Html5.prototype.width = function() {
    return this.el_.offsetWidth
};
vjs.Html5.prototype.height = function() {
    return this.el_.offsetHeight
};
vjs.Html5.prototype.supportsFullScreen = function() {
    if (typeof this.el_.webkitEnterFullScreen == "function") {
        if (/Android/.test(vjs.USER_AGENT) || !/Chrome|Mac OS X 10.5/.test(vjs.USER_AGENT)) {
            return true
        }
    }
    return false
};
vjs.Html5.prototype.enterFullScreen = function() {
    var video = this.el_;
    if ("webkitDisplayingFullscreen" in video) {
        this.one("webkitbeginfullscreen", function() {
            this.player_.isFullscreen(true);
            this.one("webkitendfullscreen", function() {
                this.player_.isFullscreen(false);
                this.player_.trigger("fullscreenchange")
            });
            this.player_.trigger("fullscreenchange")
        })
    }
    if (video.paused && video.networkState <= video.HAVE_METADATA) {
        this.el_.play();
        this.setTimeout(function() {
            video.pause();
            video.webkitEnterFullScreen()
        }, 0)
    } else {
        video.webkitEnterFullScreen()
    }
};
vjs.Html5.prototype.exitFullScreen = function() {
    this.el_.webkitExitFullScreen()
};
vjs.Html5.prototype.src = function(src) {
    if (src === undefined) {
        return this.el_.src
    } else {
        this.setSrc(src)
    }
};
vjs.Html5.prototype.setSrc = function(src) {
    this.el_.src = src
};
vjs.Html5.prototype.load = function() {
    this.el_.load()
};
vjs.Html5.prototype.currentSrc = function() {
    return this.el_.currentSrc
};
vjs.Html5.prototype.poster = function() {
    return this.el_.poster
};
vjs.Html5.prototype.setPoster = function(val) {
    this.el_.poster = val
};
vjs.Html5.prototype.preload = function() {
    return this.el_.preload
};
vjs.Html5.prototype.setPreload = function(val) {
    this.el_.preload = val
};
vjs.Html5.prototype.autoplay = function() {
    return this.el_.autoplay
};
vjs.Html5.prototype.setAutoplay = function(val) {
    this.el_.autoplay = val
};
vjs.Html5.prototype.controls = function() {
    return this.el_.controls
};
vjs.Html5.prototype.setControls = function(val) {
    this.el_.controls = !!val
};
vjs.Html5.prototype.loop = function() {
    return this.el_.loop
};
vjs.Html5.prototype.setLoop = function(val) {
    this.el_.loop = val
};
vjs.Html5.prototype.error = function() {
    return this.el_.error
};
vjs.Html5.prototype.seeking = function() {
    return this.el_.seeking
};
vjs.Html5.prototype.ended = function() {
    return this.el_.ended
};
vjs.Html5.prototype.defaultMuted = function() {
    return this.el_.defaultMuted
};
vjs.Html5.prototype.playbackRate = function() {
    return this.el_.playbackRate
};
vjs.Html5.prototype.setPlaybackRate = function(val) {
    this.el_.playbackRate = val
};
vjs.Html5.prototype.networkState = function() {
    return this.el_.networkState
};
vjs.Html5.prototype.readyState = function() {
    return this.el_.readyState
};
vjs.Html5.prototype.textTracks = function() {
    if (!this["featuresNativeTextTracks"]) {
        return vjs.MediaTechController.prototype.textTracks.call(this)
    }
    return this.el_.textTracks
};
vjs.Html5.prototype.addTextTrack = function(kind, label, language) {
    if (!this["featuresNativeTextTracks"]) {
        return vjs.MediaTechController.prototype.addTextTrack.call(this, kind, label, language)
    }
    return this.el_.addTextTrack(kind, label, language)
};
vjs.Html5.prototype.addRemoteTextTrack = function(options) {
    if (!this["featuresNativeTextTracks"]) {
        return vjs.MediaTechController.prototype.addRemoteTextTrack.call(this, options)
    }
    var track = document.createElement("track");
    options = options || {};
    if (options["kind"]) {
        track["kind"] = options["kind"]
    }
    if (options["label"]) {
        track["label"] = options["label"]
    }
    if (options["language"] || options["srclang"]) {
        track["srclang"] = options["language"] || options["srclang"]
    }
    if (options["default"]) {
        track["default"] = options["default"]
    }
    if (options["id"]) {
        track["id"] = options["id"]
    }
    if (options["src"]) {
        track["src"] = options["src"]
    }
    this.el().appendChild(track);
    if (track.track["kind"] === "metadata") {
        track["track"]["mode"] = "hidden"
    } else {
        track["track"]["mode"] = "disabled"
    }
    track["onload"] = function() {
        var tt = track["track"];
        if (track.readyState >= 2) {
            if (tt["kind"] === "metadata" && tt["mode"] !== "hidden") {
                tt["mode"] = "hidden"
            } else if (tt["kind"] !== "metadata" && tt["mode"] !== "disabled") {
                tt["mode"] = "disabled"
            }
            track["onload"] = null
        }
    };
    this.remoteTextTracks().addTrack_(track.track);
    return track
};
vjs.Html5.prototype.removeRemoteTextTrack = function(track) {
    if (!this["featuresNativeTextTracks"]) {
        return vjs.MediaTechController.prototype.removeRemoteTextTrack.call(this, track)
    }
    var tracks, i;
    this.remoteTextTracks().removeTrack_(track);
    tracks = this.el()["querySelectorAll"]("track");
    for (i = 0; i < tracks.length; i++) {
        if (tracks[i] === track || tracks[i]["track"] === track) {
            tracks[i]["parentNode"]["removeChild"](tracks[i]);
            break
        }
    }
};
vjs.Html5.isSupported = function() {
    try {
        vjs.TEST_VID["volume"] = .5
    } catch (e) {
        return false
    }
    return vjs.TEST_VID.canPlayType && !!vjs.TEST_VID.canPlayType("video/mp4")
};
vjs.MediaTechController.withSourceHandlers(vjs.Html5);
vjs.Html5.nativeSourceHandler = {};
vjs.Html5.nativeSourceHandler.canHandleSource = function(source) {
    var match, ext;

    function canPlayType(type) {
        try {
            return vjs.TEST_VID.canPlayType(type)
        } catch (e) {
            return ""
        }
    }
    if (source.type) {
        return canPlayType(source.type)
    } else if (source.src) {
        match = source.src.match(/\.([^.\/\?]+)(\?[^\/]+)?$/i);
        ext = match && match[1];
        return canPlayType("video/" + ext)
    }
    return ""
};
vjs.Html5.nativeSourceHandler.handleSource = function(source, tech) {
    tech.setSrc(source.src)
};
vjs.Html5.nativeSourceHandler.dispose = function() {};
vjs.Html5.registerSourceHandler(vjs.Html5.nativeSourceHandler);
vjs.Html5.canControlVolume = function() {
    var volume = vjs.TEST_VID.volume;
    vjs.TEST_VID.volume = volume / 2 + .1;
    return volume !== vjs.TEST_VID.volume
};
vjs.Html5.canControlPlaybackRate = function() {
    var playbackRate = vjs.TEST_VID.playbackRate;
    vjs.TEST_VID.playbackRate = playbackRate / 2 + .1;
    return playbackRate !== vjs.TEST_VID.playbackRate
};
vjs.Html5.supportsNativeTextTracks = function() {
    var supportsTextTracks;
    supportsTextTracks = !!vjs.TEST_VID.textTracks;
    if (supportsTextTracks && vjs.TEST_VID.textTracks.length > 0) {
        supportsTextTracks = typeof vjs.TEST_VID.textTracks[0]["mode"] !== "number"
    }
    if (supportsTextTracks && vjs.IS_FIREFOX) {
        supportsTextTracks = false
    }
    return supportsTextTracks
};
vjs.Html5.prototype["featuresVolumeControl"] = vjs.Html5.canControlVolume();
vjs.Html5.prototype["featuresPlaybackRate"] = vjs.Html5.canControlPlaybackRate();
vjs.Html5.prototype["movingMediaElementInDOM"] = !vjs.IS_IOS;
vjs.Html5.prototype["featuresFullscreenResize"] = true;
vjs.Html5.prototype["featuresProgressEvents"] = true;
vjs.Html5.prototype["featuresNativeTextTracks"] = vjs.Html5.supportsNativeTextTracks();
(function() {
    var canPlayType, mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i,
        mp4RE = /^video\/mp4/i;
    vjs.Html5.patchCanPlayType = function() {
        if (vjs.ANDROID_VERSION >= 4) {
            if (!canPlayType) {
                canPlayType = vjs.TEST_VID.constructor.prototype.canPlayType
            }
            vjs.TEST_VID.constructor.prototype.canPlayType = function(type) {
                if (type && mpegurlRE.test(type)) {
                    return "maybe"
                }
                return canPlayType.call(this, type)
            }
        }
        if (vjs.IS_OLD_ANDROID) {
            if (!canPlayType) {
                canPlayType = vjs.TEST_VID.constructor.prototype.canPlayType
            }
            vjs.TEST_VID.constructor.prototype.canPlayType = function(type) {
                if (type && mp4RE.test(type)) {
                    return "maybe"
                }
                return canPlayType.call(this, type)
            }
        }
    };
    vjs.Html5.unpatchCanPlayType = function() {
        var r = vjs.TEST_VID.constructor.prototype.canPlayType;
        vjs.TEST_VID.constructor.prototype.canPlayType = canPlayType;
        canPlayType = null;
        return r
    };
    vjs.Html5.patchCanPlayType()
})();
vjs.Html5.Events = "loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange".split(",");
vjs.Html5.disposeMediaElement = function(el) {
    if (!el) {
        return
    }
    el["player"] = null;
    if (el.parentNode) {
        el.parentNode.removeChild(el)
    }
    while (el.hasChildNodes()) {
        el.removeChild(el.firstChild)
    }
    el.removeAttribute("src");
    if (typeof el.load === "function") {
        (function() {
            try {
                el.load()
            } catch (e) {}
        })()
    }
};
vjs.Flash = vjs.MediaTechController.extend({
    init: function(player, options, ready) {
        vjs.MediaTechController.call(this, player, options, ready);
        var source = options["source"],
            objId = player.id() + "_flash_api",
            playerOptions = player.options_,
            flashVars = vjs.obj.merge({
                readyFunction: "videojs.Flash.onReady",
                eventProxyFunction: "videojs.Flash.onEvent",
                errorEventProxyFunction: "videojs.Flash.onError",
                autoplay: playerOptions.autoplay,
                preload: playerOptions.preload,
                loop: playerOptions.loop,
                muted: playerOptions.muted
            }, options["flashVars"]),
            params = vjs.obj.merge({
                wmode: "opaque",
                bgcolor: "#000000"
            }, options["params"]),
            attributes = vjs.obj.merge({
                id: objId,
                name: objId,
                class: "vjs-tech"
            }, options["attributes"]);
        if (source) {
            this.ready(function() {
                this.setSource(source)
            })
        }
        vjs.insertFirst(this.el_, options["parentEl"]);
        if (options["startTime"]) {
            this.ready(function() {
                this.load();
                this.play();
                this["currentTime"](options["startTime"])
            })
        }
        if (vjs.IS_FIREFOX) {
            this.ready(function() {
                this.on("mousemove", function() {
                    this.player().trigger({
                        type: "mousemove",
                        bubbles: false
                    })
                })
            })
        }
        player.on("stageclick", player.reportUserActivity);
        this.el_ = vjs.Flash.embed(options["swf"], this.el_, flashVars, params, attributes)
    }
});
vjs.Flash.prototype.dispose = function() {
    vjs.MediaTechController.prototype.dispose.call(this)
};
vjs.Flash.prototype.play = function() {
    this.el_.vjs_play()
};
vjs.Flash.prototype.pause = function() {
    this.el_.vjs_pause()
};
vjs.Flash.prototype.src = function(src) {
    if (src === undefined) {
        return this["currentSrc"]()
    }
    return this.setSrc(src)
};
vjs.Flash.prototype.setSrc = function(src) {
    src = vjs.getAbsoluteURL(src);
    this.el_.vjs_src(src);
    if (this.player_.autoplay()) {
        var tech = this;
        this.setTimeout(function() {
            tech.play()
        }, 0)
    }
};
vjs.Flash.prototype["setCurrentTime"] = function(time) {
    this.lastSeekTarget_ = time;
    this.el_.vjs_setProperty("currentTime", time);
    vjs.MediaTechController.prototype.setCurrentTime.call(this)
};
vjs.Flash.prototype["currentTime"] = function(time) {
    if (this.seeking()) {
        return this.lastSeekTarget_ || 0
    }
    return this.el_.vjs_getProperty("currentTime")
};
vjs.Flash.prototype["currentSrc"] = function() {
    if (this.currentSource_) {
        return this.currentSource_.src
    } else {
        return this.el_.vjs_getProperty("currentSrc")
    }
};
vjs.Flash.prototype.load = function() {
    this.el_.vjs_load()
};
vjs.Flash.prototype.poster = function() {
    this.el_.vjs_getProperty("poster")
};
vjs.Flash.prototype["setPoster"] = function() {};
vjs.Flash.prototype.buffered = function() {
    return vjs.createTimeRange(0, this.el_.vjs_getProperty("buffered"))
};
vjs.Flash.prototype.supportsFullScreen = function() {
    return false
};
vjs.Flash.prototype.enterFullScreen = function() {
    return false
};
(function() {
    var api = vjs.Flash.prototype,
        readWrite = "rtmpConnection,rtmpStream,preload,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted".split(","),
        readOnly = "error,networkState,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight".split(","),
        i;

    function createSetter(attr) {
        var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
        api["set" + attrUpper] = function(val) {
            return this.el_.vjs_setProperty(attr, val)
        }
    }

    function createGetter(attr) {
        api[attr] = function() {
            return this.el_.vjs_getProperty(attr)
        }
    }
    for (i = 0; i < readWrite.length; i++) {
        createGetter(readWrite[i]);
        createSetter(readWrite[i])
    }
    for (i = 0; i < readOnly.length; i++) {
        createGetter(readOnly[i])
    }
})();
vjs.Flash.isSupported = function() {
    return vjs.Flash.version()[0] >= 10
};
vjs.MediaTechController.withSourceHandlers(vjs.Flash);
vjs.Flash.nativeSourceHandler = {};
vjs.Flash.nativeSourceHandler.canHandleSource = function(source) {
    var type;
    if (!source.type) {
        return ""
    }
    type = source.type.replace(/;.*/, "").toLowerCase();
    if (type in vjs.Flash.formats) {
        return "maybe"
    }
    return ""
};
vjs.Flash.nativeSourceHandler.handleSource = function(source, tech) {
    tech.setSrc(source.src)
};
vjs.Flash.nativeSourceHandler.dispose = function() {};
vjs.Flash.registerSourceHandler(vjs.Flash.nativeSourceHandler);
vjs.Flash.formats = {
    "video/flv": "FLV",
    "video/x-flv": "FLV",
    "video/mp4": "MP4",
    "video/m4v": "MP4"
};
vjs.Flash["onReady"] = function(currSwf) {
    var el, player;
    el = vjs.el(currSwf);
    player = el && el.parentNode && (el.parentNode.player || el.parentNode.parentNode && el.parentNode.parentNode.player);
    if (player) {
        el["player"] = player;
        vjs.Flash["checkReady"](player.tech)
    }
};
vjs.Flash["checkReady"] = function(tech) {
    if (!tech.el()) {
        return
    }
    if (tech.el().vjs_getProperty) {
        tech.triggerReady()
    } else {
        this.setTimeout(function() {
            vjs.Flash["checkReady"](tech)
        }, 50)
    }
};
vjs.Flash["onEvent"] = function(swfID, eventName) {
    var player = vjs.el(swfID)["player"];
    player.trigger(eventName)
};
vjs.Flash["onError"] = function(swfID, err) {
    var player = vjs.el(swfID)["player"];
    var msg = "FLASH: " + err;
    if (err == "srcnotfound") {
        player.error({
            code: 4,
            message: msg
        })
    } else {
        player.error(msg)
    }
};
vjs.Flash.version = function() {
    var version = "0,0,0";
    try {
        version = new window.ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version").replace(/\D+/g, ",").match(/^,?(.+),?$/)[1]
    } catch (e) {
        try {
            if (navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin) {
                version = (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1]
            }
        } catch (err) {}
    }
    return version.split(",")
};
vjs.Flash.embed = function(swf, placeHolder, flashVars, params, attributes) {
    var code = vjs.Flash.getEmbedCode(swf, flashVars, params, attributes),
        obj = vjs.createEl("div", {
            innerHTML: code
        }).childNodes[0],
        par = placeHolder.parentNode;
    placeHolder.parentNode.replaceChild(obj, placeHolder);
    obj[vjs.expando] = placeHolder[vjs.expando];
    var newObj = par.childNodes[0];
    setTimeout(function() {
        newObj.style.display = "block"
    }, 1e3);
    return obj
};
vjs.Flash.getEmbedCode = function(swf, flashVars, params, attributes) {
    var objTag = '<object type="application/x-shockwave-flash" ',
        flashVarsString = "",
        paramsString = "",
        attrsString = "";
    if (flashVars) {
        vjs.obj.each(flashVars, function(key, val) {
            flashVarsString += key + "=" + val + "&amp;"
        })
    }
    params = vjs.obj.merge({
        movie: swf,
        flashvars: flashVarsString,
        allowScriptAccess: "always",
        allowNetworking: "all"
    }, params);
    vjs.obj.each(params, function(key, val) {
        paramsString += '<param name="' + key + '" value="' + val + '" />'
    });
    attributes = vjs.obj.merge({
        data: swf,
        width: "100%",
        height: "100%"
    }, attributes);
    vjs.obj.each(attributes, function(key, val) {
        attrsString += key + '="' + val + '" '
    });
    return objTag + attrsString + ">" + paramsString + "</object>"
};
vjs.Flash.streamingFormats = {
    "rtmp/mp4": "MP4",
    "rtmp/flv": "FLV"
};
vjs.Flash.streamFromParts = function(connection, stream) {
    return connection + "&" + stream
};
vjs.Flash.streamToParts = function(src) {
    var parts = {
        connection: "",
        stream: ""
    };
    if (!src) {
        return parts
    }
    var connEnd = src.indexOf("&");
    var streamBegin;
    if (connEnd !== -1) {
        streamBegin = connEnd + 1
    } else {
        connEnd = streamBegin = src.lastIndexOf("/") + 1;
        if (connEnd === 0) {
            connEnd = streamBegin = src.length
        }
    }
    parts.connection = src.substring(0, connEnd);
    parts.stream = src.substring(streamBegin, src.length);
    return parts
};
vjs.Flash.isStreamingType = function(srcType) {
    return srcType in vjs.Flash.streamingFormats
};
vjs.Flash.RTMP_RE = /^rtmp[set]?:\/\//i;
vjs.Flash.isStreamingSrc = function(src) {
    return vjs.Flash.RTMP_RE.test(src)
};
vjs.Flash.rtmpSourceHandler = {};
vjs.Flash.rtmpSourceHandler.canHandleSource = function(source) {
    if (vjs.Flash.isStreamingType(source.type) || vjs.Flash.isStreamingSrc(source.src)) {
        return "maybe"
    }
    return ""
};
vjs.Flash.rtmpSourceHandler.handleSource = function(source, tech) {
    var srcParts = vjs.Flash.streamToParts(source.src);
    tech["setRtmpConnection"](srcParts.connection);
    tech["setRtmpStream"](srcParts.stream)
};
vjs.Flash.registerSourceHandler(vjs.Flash.rtmpSourceHandler);
vjs.MediaLoader = vjs.Component.extend({
    init: function(player, options, ready) {
        vjs.Component.call(this, player, options, ready);
        if (!player.options_["sources"] || player.options_["sources"].length === 0) {
            for (var i = 0, j = player.options_["techOrder"]; i < j.length; i++) {
                var techName = vjs.capitalize(j[i]),
                    tech = window["videojs"][techName];
                if (tech && tech.isSupported()) {
                    player.loadTech(techName);
                    break
                }
            }
        } else {
            player.src(player.options_["sources"])
        }
    }
});
vjs.TextTrackMode = {
    disabled: "disabled",
    hidden: "hidden",
    showing: "showing"
};
vjs.TextTrackKind = {
    subtitles: "subtitles",
    captions: "captions",
    descriptions: "descriptions",
    chapters: "chapters",
    metadata: "metadata"
};
(function() {
    vjs.TextTrack = function(options) {
        var tt, id, mode, kind, label, language, cues, activeCues, timeupdateHandler, changed, prop;
        options = options || {};
        if (!options["player"]) {
            throw new Error("A player was not provided.")
        }
        tt = this;
        if (vjs.IS_IE8) {
            tt = document.createElement("custom");
            for (prop in vjs.TextTrack.prototype) {
                tt[prop] = vjs.TextTrack.prototype[prop]
            }
        }
        tt.player_ = options["player"];
        mode = vjs.TextTrackMode[options["mode"]] || "disabled";
        kind = vjs.TextTrackKind[options["kind"]] || "subtitles";
        label = options["label"] || "";
        language = options["language"] || options["srclang"] || "";
        id = options["id"] || "vjs_text_track_" + vjs.guid++;
        if (kind === "metadata" || kind === "chapters") {
            mode = "hidden"
        }
        tt.cues_ = [];
        tt.activeCues_ = [];
        cues = new vjs.TextTrackCueList(tt.cues_);
        activeCues = new vjs.TextTrackCueList(tt.activeCues_);
        changed = false;
        timeupdateHandler = vjs.bind(tt, function() {
            this["activeCues"];
            if (changed) {
                this["trigger"]("cuechange");
                changed = false
            }
        });
        if (mode !== "disabled") {
            tt.player_.on("timeupdate", timeupdateHandler)
        }
        Object.defineProperty(tt, "kind", {
            get: function() {
                return kind
            },
            set: Function.prototype
        });
        Object.defineProperty(tt, "label", {
            get: function() {
                return label
            },
            set: Function.prototype
        });
        Object.defineProperty(tt, "language", {
            get: function() {
                return language
            },
            set: Function.prototype
        });
        Object.defineProperty(tt, "id", {
            get: function() {
                return id
            },
            set: Function.prototype
        });
        Object.defineProperty(tt, "mode", {
            get: function() {
                return mode
            },
            set: function(newMode) {
                if (!vjs.TextTrackMode[newMode]) {
                    return
                }
                mode = newMode;
                if (mode === "showing") {
                    this.player_.on("timeupdate", timeupdateHandler)
                }
                this.trigger("modechange")
            }
        });
        Object.defineProperty(tt, "cues", {
            get: function() {
                if (!this.loaded_) {
                    return null
                }
                return cues
            },
            set: Function.prototype
        });
        Object.defineProperty(tt, "activeCues", {
            get: function() {
                var i, l, active, ct, cue;
                if (!this.loaded_) {
                    return null
                }
                if (this["cues"].length === 0) {
                    return activeCues
                }
                ct = this.player_.currentTime();
                i = 0;
                l = this["cues"].length;
                active = [];
                for (; i < l; i++) {
                    cue = this["cues"][i];
                    if (cue["startTime"] <= ct && cue["endTime"] >= ct) {
                        active.push(cue)
                    } else if (cue["startTime"] === cue["endTime"] && cue["startTime"] <= ct && cue["startTime"] + .5 >= ct) {
                        active.push(cue)
                    }
                }
                changed = false;
                if (active.length !== this.activeCues_.length) {
                    changed = true
                } else {
                    for (i = 0; i < active.length; i++) {
                        if (indexOf.call(this.activeCues_, active[i]) === -1) {
                            changed = true
                        }
                    }
                }
                this.activeCues_ = active;
                activeCues.setCues_(this.activeCues_);
                return activeCues
            },
            set: Function.prototype
        });
        if (options.src) {
            loadTrack(options.src, tt)
        } else {
            tt.loaded_ = true
        }
        if (vjs.IS_IE8) {
            return tt
        }
    };
    vjs.TextTrack.prototype = vjs.obj.create(vjs.EventEmitter.prototype);
    vjs.TextTrack.prototype.constructor = vjs.TextTrack;
    vjs.TextTrack.prototype.allowedEvents_ = {
        cuechange: "cuechange"
    };
    vjs.TextTrack.prototype.addCue = function(cue) {
        var tracks = this.player_.textTracks(),
            i = 0;
        if (tracks) {
            for (; i < tracks.length; i++) {
                if (tracks[i] !== this) {
                    tracks[i].removeCue(cue)
                }
            }
        }
        this.cues_.push(cue);
        this["cues"].setCues_(this.cues_)
    };
    vjs.TextTrack.prototype.removeCue = function(removeCue) {
        var i = 0,
            l = this.cues_.length,
            cue, removed = false;
        for (; i < l; i++) {
            cue = this.cues_[i];
            if (cue === removeCue) {
                this.cues_.splice(i, 1);
                removed = true
            }
        }
        if (removed) {
            this.cues.setCues_(this.cues_)
        }
    };
    var loadTrack, parseCues, indexOf;
    loadTrack = function(src, track) {
        vjs.xhr(src, vjs.bind(this, function(err, response, responseBody) {
            if (err) {
                return vjs.log.error(err)
            }
            track.loaded_ = true;
            parseCues(responseBody, track)
        }))
    };
    parseCues = function(srcContent, track) {
        if (typeof window["WebVTT"] !== "function") {
            return window.setTimeout(function() {
                parseCues(srcContent, track)
            }, 25)
        }
        var parser = new window["WebVTT"]["Parser"](window, window["vttjs"], window["WebVTT"]["StringDecoder"]());
        parser["oncue"] = function(cue) {
            track.addCue(cue)
        };
        parser["onparsingerror"] = function(error) {
            vjs.log.error(error)
        };
        parser["parse"](srcContent);
        parser["flush"]()
    };
    indexOf = function(searchElement, fromIndex) {
        var k;
        if (this == null) {
            throw new TypeError('"this" is null or not defined')
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (len === 0) {
            return -1
        }
        var n = +fromIndex || 0;
        if (Math.abs(n) === Infinity) {
            n = 0
        }
        if (n >= len) {
            return -1
        }
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
            if (k in O && O[k] === searchElement) {
                return k
            }
            k++
        }
        return -1
    }
})();
vjs.TextTrackList = function(tracks) {
    var list = this,
        prop, i = 0;
    if (vjs.IS_IE8) {
        list = document.createElement("custom");
        for (prop in vjs.TextTrackList.prototype) {
            list[prop] = vjs.TextTrackList.prototype[prop]
        }
    }
    tracks = tracks || [];
    list.tracks_ = [];
    Object.defineProperty(list, "length", {
        get: function() {
            return this.tracks_.length
        }
    });
    for (; i < tracks.length; i++) {
        list.addTrack_(tracks[i])
    }
    if (vjs.IS_IE8) {
        return list
    }
};
vjs.TextTrackList.prototype = vjs.obj.create(vjs.EventEmitter.prototype);
vjs.TextTrackList.prototype.constructor = vjs.TextTrackList;
vjs.TextTrackList.prototype.allowedEvents_ = {
    change: "change",
    addtrack: "addtrack",
    removetrack: "removetrack"
};
(function() {
    var event;
    for (event in vjs.TextTrackList.prototype.allowedEvents_) {
        vjs.TextTrackList.prototype["on" + event] = null
    }
})();
vjs.TextTrackList.prototype.addTrack_ = function(track) {
    var index = this.tracks_.length;
    if (!("" + index in this)) {
        Object.defineProperty(this, index, {
            get: function() {
                return this.tracks_[index]
            }
        })
    }
    track.addEventListener("modechange", vjs.bind(this, function() {
        this.trigger("change")
    }));
    this.tracks_.push(track);
    this.trigger({
        type: "addtrack",
        track: track
    })
};
vjs.TextTrackList.prototype.removeTrack_ = function(rtrack) {
    var i = 0,
        l = this.length,
        result = null,
        track;
    for (; i < l; i++) {
        track = this[i];
        if (track === rtrack) {
            this.tracks_.splice(i, 1);
            break
        }
    }
    this.trigger({
        type: "removetrack",
        track: rtrack
    })
};
vjs.TextTrackList.prototype.getTrackById = function(id) {
    var i = 0,
        l = this.length,
        result = null,
        track;
    for (; i < l; i++) {
        track = this[i];
        if (track.id === id) {
            result = track;
            break
        }
    }
    return result
};
vjs.TextTrackCueList = function(cues) {
    var list = this,
        prop;
    if (vjs.IS_IE8) {
        list = document.createElement("custom");
        for (prop in vjs.TextTrackCueList.prototype) {
            list[prop] = vjs.TextTrackCueList.prototype[prop]
        }
    }
    vjs.TextTrackCueList.prototype.setCues_.call(list, cues);
    Object.defineProperty(list, "length", {
        get: function() {
            return this.length_
        }
    });
    if (vjs.IS_IE8) {
        return list
    }
};
vjs.TextTrackCueList.prototype.setCues_ = function(cues) {
    var oldLength = this.length || 0,
        i = 0,
        l = cues.length,
        defineProp;
    this.cues_ = cues;
    this.length_ = cues.length;
    defineProp = function(i) {
        if (!("" + i in this)) {
            Object.defineProperty(this, "" + i, {
                get: function() {
                    return this.cues_[i]
                }
            })
        }
    };
    if (oldLength < l) {
        i = oldLength;
        for (; i < l; i++) {
            defineProp.call(this, i)
        }
    }
};
vjs.TextTrackCueList.prototype.getCueById = function(id) {
    var i = 0,
        l = this.length,
        result = null,
        cue;
    for (; i < l; i++) {
        cue = this[i];
        if (cue.id === id) {
            result = cue;
            break
        }
    }
    return result
};
(function() {
    "use strict";
    vjs.TextTrackDisplay = vjs.Component.extend({
        init: function(player, options, ready) {
            vjs.Component.call(this, player, options, ready);
            player.on("loadstart", vjs.bind(this, this.toggleDisplay));
            player.ready(vjs.bind(this, function() {
                if (player.tech && player.tech["featuresNativeTextTracks"]) {
                    this.hide();
                    return
                }
                var i, tracks, track;
                player.on("fullscreenchange", vjs.bind(this, this.updateDisplay));
                tracks = player.options_["tracks"] || [];
                for (i = 0; i < tracks.length; i++) {
                    track = tracks[i];
                    this.player_.addRemoteTextTrack(track)
                }
            }))
        }
    });
    vjs.TextTrackDisplay.prototype.toggleDisplay = function() {
        if (this.player_.tech && this.player_.tech["featuresNativeTextTracks"]) {
            this.hide()
        } else {
            this.show()
        }
    };
    vjs.TextTrackDisplay.prototype.createEl = function() {
        return vjs.Component.prototype.createEl.call(this, "div", {
            className: "vjs-text-track-display"
        })
    };
    vjs.TextTrackDisplay.prototype.clearDisplay = function() {
        if (typeof window["WebVTT"] === "function") {
            window["WebVTT"]["processCues"](window, [], this.el_)
        }
    };
    var constructColor = function(color, opacity) {
        return "rgba(" + parseInt(color[1] + color[1], 16) + "," + parseInt(color[2] + color[2], 16) + "," + parseInt(color[3] + color[3], 16) + "," + opacity + ")"
    };
    var darkGray = "#222";
    var lightGray = "#ccc";
    var fontMap = {
        monospace: "monospace",
        sansSerif: "sans-serif",
        serif: "serif",
        monospaceSansSerif: '"Andale Mono", "Lucida Console", monospace',
        monospaceSerif: '"Courier New", monospace',
        proportionalSansSerif: "sans-serif",
        proportionalSerif: "serif",
        casual: '"Comic Sans MS", Impact, fantasy',
        script: '"Monotype Corsiva", cursive',
        smallcaps: '"Andale Mono", "Lucida Console", monospace, sans-serif'
    };
    var tryUpdateStyle = function(el, style, rule) {
        try {
            el.style[style] = rule
        } catch (e) {}
    };
    vjs.TextTrackDisplay.prototype.updateDisplay = function() {
        var tracks = this.player_.textTracks(),
            i = 0,
            track;
        this.clearDisplay();
        if (!tracks) {
            return
        }
        for (; i < tracks.length; i++) {
            track = tracks[i];
            if (track["mode"] === "showing") {
                this.updateForTrack(track)
            }
        }
    };
    vjs.TextTrackDisplay.prototype.updateForTrack = function(track) {
        if (typeof window["WebVTT"] !== "function" || !track["activeCues"]) {
            return
        }
        var i = 0,
            property, cueDiv, overrides = this.player_["textTrackSettings"].getValues(),
            fontSize, cues = [];
        for (; i < track["activeCues"].length; i++) {
            cues.push(track["activeCues"][i])
        }
        window["WebVTT"]["processCues"](window, track["activeCues"], this.el_);
        i = cues.length;
        while (i--) {
            cueDiv = cues[i].displayState;
            if (overrides.color) {
                cueDiv.firstChild.style.color = overrides.color
            }
            if (overrides.textOpacity) {
                tryUpdateStyle(cueDiv.firstChild, "color", constructColor(overrides.color || "#fff", overrides.textOpacity))
            }
            if (overrides.backgroundColor) {
                cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor
            }
            if (overrides.backgroundOpacity) {
                tryUpdateStyle(cueDiv.firstChild, "backgroundColor", constructColor(overrides.backgroundColor || "#000", overrides.backgroundOpacity))
            }
            if (overrides.windowColor) {
                if (overrides.windowOpacity) {
                    tryUpdateStyle(cueDiv, "backgroundColor", constructColor(overrides.windowColor, overrides.windowOpacity))
                } else {
                    cueDiv.style.backgroundColor = overrides.windowColor
                }
            }
            if (overrides.edgeStyle) {
                if (overrides.edgeStyle === "dropshadow") {
                    cueDiv.firstChild.style.textShadow = "2px 2px 3px " + darkGray + ", 2px 2px 4px " + darkGray + ", 2px 2px 5px " + darkGray
                } else if (overrides.edgeStyle === "raised") {
                    cueDiv.firstChild.style.textShadow = "1px 1px " + darkGray + ", 2px 2px " + darkGray + ", 3px 3px " + darkGray
                } else if (overrides.edgeStyle === "depressed") {
                    cueDiv.firstChild.style.textShadow = "1px 1px " + lightGray + ", 0 1px " + lightGray + ", -1px -1px " + darkGray + ", 0 -1px " + darkGray
                } else if (overrides.edgeStyle === "uniform") {
                    cueDiv.firstChild.style.textShadow = "0 0 4px " + darkGray + ", 0 0 4px " + darkGray + ", 0 0 4px " + darkGray + ", 0 0 4px " + darkGray
                }
            }
            if (overrides.fontPercent && overrides.fontPercent !== 1) {
                fontSize = window.parseFloat(cueDiv.style.fontSize);
                cueDiv.style.fontSize = fontSize * overrides.fontPercent + "px";
                cueDiv.style.height = "auto";
                cueDiv.style.top = "auto";
                cueDiv.style.bottom = "2px"
            }
            if (overrides.fontFamily && overrides.fontFamily !== "default") {
                if (overrides.fontFamily === "small-caps") {
                    cueDiv.firstChild.style.fontVariant = "small-caps"
                } else {
                    cueDiv.firstChild.style.fontFamily = fontMap[overrides.fontFamily]
                }
            }
        }
    };
    vjs.TextTrackMenuItem = vjs.MenuItem.extend({
        init: function(player, options) {
            var track = this.track = options["track"],
                tracks = player.textTracks(),
                changeHandler, event;
            if (tracks) {
                changeHandler = vjs.bind(this, function() {
                    var selected = this.track["mode"] === "showing",
                        track, i, l;
                    if (this instanceof vjs.OffTextTrackMenuItem) {
                        selected = true;
                        i = 0, l = tracks.length;
                        for (; i < l; i++) {
                            track = tracks[i];
                            if (track["kind"] === this.track["kind"] && track["mode"] === "showing") {
                                selected = false;
                                break
                            }
                        }
                    }
                    this.selected(selected)
                });
                tracks.addEventListener("change", changeHandler);
                player.on("dispose", function() {
                    tracks.removeEventListener("change", changeHandler)
                })
            }
            options["label"] = track["label"] || track["language"] || "Unknown";
            options["selected"] = track["default"] || track["mode"] === "showing";
            vjs.MenuItem.call(this, player, options);
            if (tracks && tracks.onchange === undefined) {
                this.on(["tap", "click"], function() {
                    if (typeof window.Event !== "object") {
                        try {
                            event = new window.Event("change")
                        } catch (err) {}
                    }
                    if (!event) {
                        event = document.createEvent("Event");
                        event.initEvent("change", true, true)
                    }
                    tracks.dispatchEvent(event)
                })
            }
        }
    });
    vjs.TextTrackMenuItem.prototype.onClick = function() {
        var kind = this.track["kind"],
            tracks = this.player_.textTracks(),
            mode, track, i = 0;
        vjs.MenuItem.prototype.onClick.call(this);
        if (!tracks) {
            return
        }
        for (; i < tracks.length; i++) {
            track = tracks[i];
            if (track["kind"] !== kind) {
                continue
            }
            if (track === this.track) {
                track["mode"] = "showing"
            } else {
                track["mode"] = "disabled"
            }
        }
    };
    vjs.OffTextTrackMenuItem = vjs.TextTrackMenuItem.extend({
        init: function(player, options) {
            options["track"] = {
                kind: options["kind"],
                player: player,
                label: options["kind"] + " off",
                default: false,
                mode: "disabled"
            };
            vjs.TextTrackMenuItem.call(this, player, options);
            this.selected(true)
        }
    });
    vjs.CaptionSettingsMenuItem = vjs.TextTrackMenuItem.extend({
        init: function(player, options) {
            options["track"] = {
                kind: options["kind"],
                player: player,
                label: options["kind"] + " settings",
                default: false,
                mode: "disabled"
            };
            vjs.TextTrackMenuItem.call(this, player, options);
            this.addClass("vjs-texttrack-settings")
        }
    });
    vjs.CaptionSettingsMenuItem.prototype.onClick = function() {
        this.player().getChild("textTrackSettings").show()
    };
    vjs.TextTrackButton = vjs.MenuButton.extend({
        init: function(player, options) {
            var tracks, updateHandler;
            vjs.MenuButton.call(this, player, options);
            tracks = this.player_.textTracks();
            if (this.items.length <= 1) {
                this.hide()
            }
            if (!tracks) {
                return
            }
            updateHandler = vjs.bind(this, this.update);
            tracks.addEventListener("removetrack", updateHandler);
            tracks.addEventListener("addtrack", updateHandler);
            this.player_.on("dispose", function() {
                tracks.removeEventListener("removetrack", updateHandler);
                tracks.removeEventListener("addtrack", updateHandler)
            })
        }
    });
    vjs.TextTrackButton.prototype.createItems = function() {
        var items = [],
            track, tracks;
        if (this instanceof vjs.CaptionsButton && !(this.player().tech && this.player().tech["featuresNativeTextTracks"])) {
            items.push(new vjs.CaptionSettingsMenuItem(this.player_, {
                kind: this.kind_
            }))
        }
        items.push(new vjs.OffTextTrackMenuItem(this.player_, {
            kind: this.kind_
        }));
        tracks = this.player_.textTracks();
        if (!tracks) {
            return items
        }
        for (var i = 0; i < tracks.length; i++) {
            track = tracks[i];
            if (track["kind"] === this.kind_) {
                items.push(new vjs.TextTrackMenuItem(this.player_, {
                    track: track
                }))
            }
        }
        return items
    };
    vjs.CaptionsButton = vjs.TextTrackButton.extend({
        init: function(player, options, ready) {
            vjs.TextTrackButton.call(this, player, options, ready);
            this.el_.setAttribute("aria-label", "Captions Menu")
        }
    });
    vjs.CaptionsButton.prototype.kind_ = "captions";
    vjs.CaptionsButton.prototype.buttonText = "Captions";
    vjs.CaptionsButton.prototype.className = "vjs-captions-button";
    vjs.CaptionsButton.prototype.update = function() {
        var threshold = 2;
        vjs.TextTrackButton.prototype.update.call(this);
        if (this.player().tech && this.player().tech["featuresNativeTextTracks"]) {
            threshold = 1
        }
        if (this.items && this.items.length > threshold) {
            this.show()
        } else {
            this.hide()
        }
    };
    vjs.SubtitlesButton = vjs.TextTrackButton.extend({
        init: function(player, options, ready) {
            vjs.TextTrackButton.call(this, player, options, ready);
            this.el_.setAttribute("aria-label", "Subtitles Menu")
        }
    });
    vjs.SubtitlesButton.prototype.kind_ = "subtitles";
    vjs.SubtitlesButton.prototype.buttonText = "Subtitles";
    vjs.SubtitlesButton.prototype.className = "vjs-subtitles-button";
    vjs.ChaptersButton = vjs.TextTrackButton.extend({
        init: function(player, options, ready) {
            vjs.TextTrackButton.call(this, player, options, ready);
            this.el_.setAttribute("aria-label", "Chapters Menu")
        }
    });
    vjs.ChaptersButton.prototype.kind_ = "chapters";
    vjs.ChaptersButton.prototype.buttonText = "Chapters";
    vjs.ChaptersButton.prototype.className = "vjs-chapters-button";
    vjs.ChaptersButton.prototype.createItems = function() {
        var items = [],
            track, tracks;
        tracks = this.player_.textTracks();
        if (!tracks) {
            return items
        }
        for (var i = 0; i < tracks.length; i++) {
            track = tracks[i];
            if (track["kind"] === this.kind_) {
                items.push(new vjs.TextTrackMenuItem(this.player_, {
                    track: track
                }))
            }
        }
        return items
    };
    vjs.ChaptersButton.prototype.createMenu = function() {
        var tracks = this.player_.textTracks() || [],
            i = 0,
            l = tracks.length,
            track, chaptersTrack, items = this.items = [];
        for (; i < l; i++) {
            track = tracks[i];
            if (track["kind"] == this.kind_) {
                if (!track.cues) {
                    track["mode"] = "hidden";
                    window.setTimeout(vjs.bind(this, function() {
                        this.createMenu()
                    }), 100)
                } else {
                    chaptersTrack = track;
                    break
                }
            }
        }
        var menu = this.menu;
        if (menu === undefined) {
            menu = new vjs.Menu(this.player_);
            menu.contentEl().appendChild(vjs.createEl("li", {
                className: "vjs-menu-title",
                innerHTML: vjs.capitalize(this.kind_),
                tabindex: -1
            }))
        }
        if (chaptersTrack) {
            var cues = chaptersTrack["cues"],
                cue, mi;
            i = 0;
            l = cues.length;
            for (; i < l; i++) {
                cue = cues[i];
                mi = new vjs.ChaptersTrackMenuItem(this.player_, {
                    track: chaptersTrack,
                    cue: cue
                });
                items.push(mi);
                menu.addChild(mi)
            }
            this.addChild(menu)
        }
        if (this.items.length > 0) {
            this.show()
        }
        return menu
    };
    vjs.ChaptersTrackMenuItem = vjs.MenuItem.extend({
        init: function(player, options) {
            var track = this.track = options["track"],
                cue = this.cue = options["cue"],
                currentTime = player.currentTime();
            options["label"] = cue.text;
            options["selected"] = cue["startTime"] <= currentTime && currentTime < cue["endTime"];
            vjs.MenuItem.call(this, player, options);
            track.addEventListener("cuechange", vjs.bind(this, this.update))
        }
    });
    vjs.ChaptersTrackMenuItem.prototype.onClick = function() {
        vjs.MenuItem.prototype.onClick.call(this);
        this.player_.currentTime(this.cue.startTime);
        this.update(this.cue.startTime)
    };
    vjs.ChaptersTrackMenuItem.prototype.update = function() {
        var cue = this.cue,
            currentTime = this.player_.currentTime();
        this.selected(cue["startTime"] <= currentTime && currentTime < cue["endTime"])
    }
})();
(function() {
    "use strict";
    vjs.TextTrackSettings = vjs.Component.extend({
        init: function(player, options) {
            vjs.Component.call(this, player, options);
            this.hide();
            vjs.on(this.el().querySelector(".vjs-done-button"), "click", vjs.bind(this, function() {
                this.saveSettings();
                this.hide()
            }));
            vjs.on(this.el().querySelector(".vjs-default-button"), "click", vjs.bind(this, function() {
                this.el().querySelector(".vjs-fg-color > select").selectedIndex = 0;
                this.el().querySelector(".vjs-bg-color > select").selectedIndex = 0;
                this.el().querySelector(".window-color > select").selectedIndex = 0;
                this.el().querySelector(".vjs-text-opacity > select").selectedIndex = 0;
                this.el().querySelector(".vjs-bg-opacity > select").selectedIndex = 0;
                this.el().querySelector(".vjs-window-opacity > select").selectedIndex = 0;
                this.el().querySelector(".vjs-edge-style select").selectedIndex = 0;
                this.el().querySelector(".vjs-font-family select").selectedIndex = 0;
                this.el().querySelector(".vjs-font-percent select").selectedIndex = 2;
                this.updateDisplay()
            }));
            vjs.on(this.el().querySelector(".vjs-fg-color > select"), "change", vjs.bind(this, this.updateDisplay));
            vjs.on(this.el().querySelector(".vjs-bg-color > select"), "change", vjs.bind(this, this.updateDisplay));
            vjs.on(this.el().querySelector(".window-color > select"), "change", vjs.bind(this, this.updateDisplay));
            vjs.on(this.el().querySelector(".vjs-text-opacity > select"), "change", vjs.bind(this, this.updateDisplay));
            vjs.on(this.el().querySelector(".vjs-bg-opacity > select"), "change", vjs.bind(this, this.updateDisplay));
            vjs.on(this.el().querySelector(".vjs-window-opacity > select"), "change", vjs.bind(this, this.updateDisplay));
            vjs.on(this.el().querySelector(".vjs-font-percent select"), "change", vjs.bind(this, this.updateDisplay));
            vjs.on(this.el().querySelector(".vjs-edge-style select"), "change", vjs.bind(this, this.updateDisplay));
            vjs.on(this.el().querySelector(".vjs-font-family select"), "change", vjs.bind(this, this.updateDisplay));
            if (player.options()["persistTextTrackSettings"]) {
                this.restoreSettings()
            }
        }
    });
    vjs.TextTrackSettings.prototype.createEl = function() {
        return vjs.Component.prototype.createEl.call(this, "div", {
            className: "vjs-caption-settings vjs-modal-overlay",
            innerHTML: captionOptionsMenuTemplate()
        })
    };
    vjs.TextTrackSettings.prototype.getValues = function() {
        var el, bgOpacity, textOpacity, windowOpacity, textEdge, fontFamily, fgColor, bgColor, windowColor, result, name, fontPercent;
        el = this.el();
        textEdge = getSelectedOptionValue(el.querySelector(".vjs-edge-style select"));
        fontFamily = getSelectedOptionValue(el.querySelector(".vjs-font-family select"));
        fgColor = getSelectedOptionValue(el.querySelector(".vjs-fg-color > select"));
        textOpacity = getSelectedOptionValue(el.querySelector(".vjs-text-opacity > select"));
        bgColor = getSelectedOptionValue(el.querySelector(".vjs-bg-color > select"));
        bgOpacity = getSelectedOptionValue(el.querySelector(".vjs-bg-opacity > select"));
        windowColor = getSelectedOptionValue(el.querySelector(".window-color > select"));
        windowOpacity = getSelectedOptionValue(el.querySelector(".vjs-window-opacity > select"));
        fontPercent = window["parseFloat"](getSelectedOptionValue(el.querySelector(".vjs-font-percent > select")));
        result = {
            backgroundOpacity: bgOpacity,
            textOpacity: textOpacity,
            windowOpacity: windowOpacity,
            edgeStyle: textEdge,
            fontFamily: fontFamily,
            color: fgColor,
            backgroundColor: bgColor,
            windowColor: windowColor,
            fontPercent: fontPercent
        };
        for (name in result) {
            if (result[name] === "" || result[name] === "none" || name === "fontPercent" && result[name] === 1) {
                delete result[name]
            }
        }
        return result
    };
    vjs.TextTrackSettings.prototype.setValues = function(values) {
        var el = this.el(),
            fontPercent;
        setSelectedOption(el.querySelector(".vjs-edge-style select"), values.edgeStyle);
        setSelectedOption(el.querySelector(".vjs-font-family select"), values.fontFamily);
        setSelectedOption(el.querySelector(".vjs-fg-color > select"), values.color);
        setSelectedOption(el.querySelector(".vjs-text-opacity > select"), values.textOpacity);
        setSelectedOption(el.querySelector(".vjs-bg-color > select"), values.backgroundColor);
        setSelectedOption(el.querySelector(".vjs-bg-opacity > select"), values.backgroundOpacity);
        setSelectedOption(el.querySelector(".window-color > select"), values.windowColor);
        setSelectedOption(el.querySelector(".vjs-window-opacity > select"), values.windowOpacity);
        fontPercent = values.fontPercent;
        if (fontPercent) {
            fontPercent = fontPercent.toFixed(2)
        }
        setSelectedOption(el.querySelector(".vjs-font-percent > select"), fontPercent)
    };
    vjs.TextTrackSettings.prototype.restoreSettings = function() {
        var values;
        try {
            values = JSON.parse(window.localStorage.getItem("vjs-text-track-settings"))
        } catch (e) {}
        if (values) {
            this.setValues(values)
        }
    };
    vjs.TextTrackSettings.prototype.saveSettings = function() {
        var values;
        if (!this.player_.options()["persistTextTrackSettings"]) {
            return
        }
        values = this.getValues();
        try {
            if (!vjs.isEmpty(values)) {
                window.localStorage.setItem("vjs-text-track-settings", JSON.stringify(values))
            } else {
                window.localStorage.removeItem("vjs-text-track-settings")
            }
        } catch (e) {}
    };
    vjs.TextTrackSettings.prototype.updateDisplay = function() {
        var ttDisplay = this.player_.getChild("textTrackDisplay");
        if (ttDisplay) {
            ttDisplay.updateDisplay()
        }
    };

    function getSelectedOptionValue(target) {
        var selectedOption;
        if (target.selectedOptions) {
            selectedOption = target.selectedOptions[0]
        } else if (target.options) {
            selectedOption = target.options[target.options.selectedIndex]
        }
        return selectedOption.value
    }

    function setSelectedOption(target, value) {
        var i, option;
        if (!value) {
            return
        }
        for (i = 0; i < target.options.length; i++) {
            option = target.options[i];
            if (option.value === value) {
                break
            }
        }
        target.selectedIndex = i
    }

    function captionOptionsMenuTemplate() {
        return '<div class="vjs-tracksettings">' + '<div class="vjs-tracksettings-colors">' + '<div class="vjs-fg-color vjs-tracksetting">' + '<label class="vjs-label">Foreground</label>' + "<select>" + '<option value="">---</option>' + '<option value="#FFF">White</option>' + '<option value="#000">Black</option>' + '<option value="#F00">Red</option>' + '<option value="#0F0">Green</option>' + '<option value="#00F">Blue</option>' + '<option value="#FF0">Yellow</option>' + '<option value="#F0F">Magenta</option>' + '<option value="#0FF">Cyan</option>' + "</select>" + '<span class="vjs-text-opacity vjs-opacity">' + "<select>" + '<option value="">---</option>' + '<option value="1">Opaque</option>' + '<option value="0.5">Semi-Opaque</option>' + "</select>" + "</span>" + "</div>" + '<div class="vjs-bg-color vjs-tracksetting">' + '<label class="vjs-label">Background</label>' + "<select>" + '<option value="">---</option>' + '<option value="#FFF">White</option>' + '<option value="#000">Black</option>' + '<option value="#F00">Red</option>' + '<option value="#0F0">Green</option>' + '<option value="#00F">Blue</option>' + '<option value="#FF0">Yellow</option>' + '<option value="#F0F">Magenta</option>' + '<option value="#0FF">Cyan</option>' + "</select>" + '<span class="vjs-bg-opacity vjs-opacity">' + "<select>" + '<option value="">---</option>' + '<option value="1">Opaque</option>' + '<option value="0.5">Semi-Transparent</option>' + '<option value="0">Transparent</option>' + "</select>" + "</span>" + "</div>" + '<div class="window-color vjs-tracksetting">' + '<label class="vjs-label">Window</label>' + "<select>" + '<option value="">---</option>' + '<option value="#FFF">White</option>' + '<option value="#000">Black</option>' + '<option value="#F00">Red</option>' + '<option value="#0F0">Green</option>' + '<option value="#00F">Blue</option>' + '<option value="#FF0">Yellow</option>' + '<option value="#F0F">Magenta</option>' + '<option value="#0FF">Cyan</option>' + "</select>" + '<span class="vjs-window-opacity vjs-opacity">' + "<select>" + '<option value="">---</option>' + '<option value="1">Opaque</option>' + '<option value="0.5">Semi-Transparent</option>' + '<option value="0">Transparent</option>' + "</select>" + "</span>" + "</div>" + "</div>" + '<div class="vjs-tracksettings-font">' + '<div class="vjs-font-percent vjs-tracksetting">' + '<label class="vjs-label">Font Size</label>' + "<select>" + '<option value="0.50">50%</option>' + '<option value="0.75">75%</option>' + '<option value="1.00" selected>100%</option>' + '<option value="1.25">125%</option>' + '<option value="1.50">150%</option>' + '<option value="1.75">175%</option>' + '<option value="2.00">200%</option>' + '<option value="3.00">300%</option>' + '<option value="4.00">400%</option>' + "</select>" + "</div>" + '<div class="vjs-edge-style vjs-tracksetting">' + '<label class="vjs-label">Text Edge Style</label>' + "<select>" + '<option value="none">None</option>' + '<option value="raised">Raised</option>' + '<option value="depressed">Depressed</option>' + '<option value="uniform">Uniform</option>' + '<option value="dropshadow">Dropshadow</option>' + "</select>" + "</div>" + '<div class="vjs-font-family vjs-tracksetting">' + '<label class="vjs-label">Font Family</label>' + "<select>" + '<option value="">Default</option>' + '<option value="monospaceSerif">Monospace Serif</option>' + '<option value="proportionalSerif">Proportional Serif</option>' + '<option value="monospaceSansSerif">Monospace Sans-Serif</option>' + '<option value="proportionalSansSerif">Proportional Sans-Serif</option>' + '<option value="casual">Casual</option>' + '<option value="script">Script</option>' + '<option value="small-caps">Small Caps</option>' + "</select>" + "</div>" + "</div>" + "</div>" + '<div class="vjs-tracksettings-controls">' + '<button class="vjs-default-button">Defaults</button>' + '<button class="vjs-done-button">Done</button>' + "</div>"
    }
})();
vjs.JSON;
if (typeof window.JSON !== "undefined" && typeof window.JSON.parse === "function") {
    vjs.JSON = window.JSON
} else {
    vjs.JSON = {};
    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    vjs.JSON.parse = function(text, reviver) {
        var j;

        function walk(holder, key) {
            var k, v, value = holder[key];
            if (value && typeof value === "object") {
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = walk(value, k);
                        if (v !== undefined) {
                            value[k] = v
                        } else {
                            delete value[k]
                        }
                    }
                }
            }
            return reviver.call(holder, key, value)
        }
        text = String(text);
        cx.lastIndex = 0;
        if (cx.test(text)) {
            text = text.replace(cx, function(a) {
                return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
            })
        }
        if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
            j = eval("(" + text + ")");
            return typeof reviver === "function" ? walk({
                "": j
            }, "") : j
        }
        throw new SyntaxError("JSON.parse(): invalid or malformed JSON data")
    }
}
vjs.autoSetup = function() {
    var options, mediaEl, player, i, e;
    var vids = document.getElementsByTagName("video");
    var audios = document.getElementsByTagName("audio");
    var mediaEls = [];
    if (vids && vids.length > 0) {
        for (i = 0, e = vids.length; i < e; i++) {
            mediaEls.push(vids[i])
        }
    }
    if (audios && audios.length > 0) {
        for (i = 0, e = audios.length; i < e; i++) {
            mediaEls.push(audios[i])
        }
    }
    if (mediaEls && mediaEls.length > 0) {
        for (i = 0, e = mediaEls.length; i < e; i++) {
            mediaEl = mediaEls[i];
            if (mediaEl && mediaEl.getAttribute) {
                if (mediaEl["player"] === undefined) {
                    options = mediaEl.getAttribute("data-setup");
                    if (options !== null) {
                        player = videojs(mediaEl)
                    }
                }
            } else {
                vjs.autoSetupTimeout(1);
                break
            }
        }
    } else if (!vjs.windowLoaded) {
        vjs.autoSetupTimeout(1)
    }
};
vjs.autoSetupTimeout = function(wait) {
    setTimeout(vjs.autoSetup, wait)
};
if (document.readyState === "complete") {
    vjs.windowLoaded = true
} else {
    vjs.one(window, "load", function() {
        vjs.windowLoaded = true
    })
}
vjs.autoSetupTimeout(1);
vjs.plugin = function(name, init) {
    vjs.Player.prototype[name] = init
};