/*! jquery.kinetic - v1.8.2 - 2013-03-23 http://the-taylors.org/jquery.kinetic 
 * Copyright (c) 2013 Dave Taylor; Licensed MIT */
(function(t){"use strict";var e={cursor:"move",decelerate:!0,triggerHardware:!1,y:!0,x:!0,slowdown:.9,maxvelocity:40,throttleFPS:60,movingClass:{up:"kinetic-moving-up",down:"kinetic-moving-down",left:"kinetic-moving-left",right:"kinetic-moving-right"},deceleratingClass:{up:"kinetic-decelerating-up",down:"kinetic-decelerating-down",left:"kinetic-decelerating-left",right:"kinetic-decelerating-right"}},n="kinetic-settings",i="kinetic-active";window.requestAnimationFrame||(window.requestAnimationFrame=function(){return window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(t){window.setTimeout(t,1e3/60)}}()),t.support=t.support||{},t.extend(t.support,{touch:"ontouchend"in document});var o=function(){return!1},c=function(t,e){return 0===Math.floor(Math.abs(t))?0:t*e},l=function(t,e){var n=t;return t>0?t>e&&(n=e):0-e>t&&(n=0-e),n},s=function(t,e){this.removeClass(t.movingClass.up).removeClass(t.movingClass.down).removeClass(t.movingClass.left).removeClass(t.movingClass.right).removeClass(t.deceleratingClass.up).removeClass(t.deceleratingClass.down).removeClass(t.deceleratingClass.left).removeClass(t.deceleratingClass.right),t.velocity>0&&this.addClass(e.right),0>t.velocity&&this.addClass(e.left),t.velocityY>0&&this.addClass(e.down),0>t.velocityY&&this.addClass(e.up)},a=function(t,e){e.velocity=0,e.velocityY=0,e.decelerate=!0,"function"==typeof e.stopped&&e.stopped.call(t,e)},r=function(t,e){var n=t[0];e.x&&n.scrollWidth>0?(n.scrollLeft=e.scrollLeft=n.scrollLeft+e.velocity,Math.abs(e.velocity)>0&&(e.velocity=e.decelerate?c(e.velocity,e.slowdown):e.velocity)):e.velocity=0,e.y&&n.scrollHeight>0?(n.scrollTop=e.scrollTop=n.scrollTop+e.velocityY,Math.abs(e.velocityY)>0&&(e.velocityY=e.decelerate?c(e.velocityY,e.slowdown):e.velocityY)):e.velocityY=0,s.call(t,e,e.deceleratingClass),"function"==typeof e.moved&&e.moved.call(t,e),Math.abs(e.velocity)>0||Math.abs(e.velocityY)>0?window.requestAnimationFrame(function(){r(t,e)}):a(t,e)},u=function(e){var i=t.kinetic.callMethods[e],o=Array.prototype.slice.call(arguments);i&&this.each(function(){var e=o.slice(1),c=t(this).data(n);e.unshift(c),i.apply(this,e)})},v=function(e,n){e[0],t.support.touch?e.bind("touchstart",n.events.touchStart).bind("touchend",n.events.inputEnd).bind("touchmove",n.events.touchMove):e.mousedown(n.events.inputDown).mouseup(n.events.inputEnd).mousemove(n.events.inputMove),e.click(n.events.inputClick).scroll(n.events.scroll).bind("selectstart",o).bind("dragstart",n.events.dragStart)},d=function(e,n){e[0],t.support.touch?e.unbind("touchstart",n.events.touchStart).unbind("touchend",n.events.inputEnd).unbind("touchmove",n.events.touchMove):e.unbind("mousedown",n.events.inputDown).unbind("mouseup",n.events.inputEnd).unbind("mousemove",n.events.inputMove).unbind("scroll",n.events.scroll),e.unbind("click",n.events.inputClick).unbind("selectstart",o),e.unbind("dragstart",n.events.dragStart)},f=function(o){this.addClass(i).each(function(){var i=this,c=t(this);if(!c.data(n)){var a,u,d,f,p=t.extend({},e,o),m=!1,h=!1,g=!1,w=1e3/p.throttleFPS;p.velocity=0,p.velocityY=0;var y=function(){a=!1,u=!1,g=!1};t(document).mouseup(y).click(y);var C=function(){p.velocity=l(m-a,p.maxvelocity),p.velocityY=l(h-u,p.maxvelocity)},b=function(e){return t.isFunction(p.filterTarget)?p.filterTarget.call(i,e)!==!1:!0},k=function(t,e){g=!0,p.velocity=m=0,p.velocityY=h=0,a=t,u=e},Y=function(){a&&m&&p.decelerate===!1&&(p.decelerate=!0,C(),a=m=g=!1,r(c,p))},D=function(e,n){(!d||new Date>new Date(d.getTime()+w))&&(d=new Date,g&&(a||u)&&(f&&(t(f).blur(),f=null,c.focus()),p.decelerate=!1,p.velocity=p.velocityY=0,c[0].scrollLeft=p.scrollLeft=p.x?c[0].scrollLeft-(e-a):c[0].scrollLeft,c[0].scrollTop=p.scrollTop=p.y?c[0].scrollTop-(n-u):c[0].scrollTop,m=a,h=u,a=e,u=n,C(),s.call(c,p,p.movingClass),"function"==typeof p.moved&&p.moved.call(c,p)))};p.events={touchStart:function(t){var e;b(t.target)&&(e=t.originalEvent.touches[0],k(e.clientX,e.clientY),t.stopPropagation())},touchMove:function(t){var e;g&&(e=t.originalEvent.touches[0],D(e.clientX,e.clientY),t.preventDefault&&t.preventDefault())},inputDown:function(t){b(t.target)&&(k(t.clientX,t.clientY),f=t.target,"IMG"===t.target.nodeName&&t.preventDefault(),t.stopPropagation())},inputEnd:function(t){Y(),f=null,t.preventDefault&&t.preventDefault()},inputMove:function(t){g&&(D(t.clientX,t.clientY),t.preventDefault&&t.preventDefault())},scroll:function(t){"function"==typeof p.moved&&p.moved.call(c,p),t.preventDefault&&t.preventDefault()},inputClick:function(t){return Math.abs(p.velocity)>0?(t.preventDefault(),!1):void 0},dragStart:function(){return f?!1:void 0}},v(c,p),c.data(n,p).css("cursor",p.cursor),p.triggerHardware&&c.css({"-webkit-transform":"translate3d(0,0,0)","-webkit-perspective":"1000","-webkit-backface-visibility":"hidden"})}})};t.kinetic={settingsKey:n,callMethods:{start:function(e,n){var i=t(this);e=t.extend(e,n),e&&(e.decelerate=!1,r(i,e))},end:function(e){t(this),e&&(e.decelerate=!0)},stop:function(e){var n=t(this);a(n,e)},detach:function(e){var n=t(this);d(n,e),n.removeClass(i).css("cursor","")},attach:function(e){var n=t(this);v(n,e),n.addClass(i).css("cursor","move")}}},t.fn.kinetic=function(t){return"string"==typeof t?u.apply(this,arguments):f.call(this,t),this}})(window.jQuery||window.Zepto);