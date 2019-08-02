/**
 * 给指定网页容器添加弹幕
 *
 * @optional
 * {
 *   position: 'default' // default, top, left, right, bottom
 * }
 * 
 * @author  Yang,junlong at 2019-06-04 02:02:03 build.
 * @version $Id$
 */

//浏览器兼容处理
window.requestAnimationFrame = (function(){
  return window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame || function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

var transitionEvent = whichTransitionEvent();


function Barrager(options) {
  var el = options.el;
  this.el = typeof el === 'string' ? document.getElementById(el) : el;

  

  if(el.style.position !== 'absolute') {
	el.style.position = 'relative';
  }

  var barrage = document.createElement('div');
  barrage.className = 'barrage';

  this.barrage = barrage;

  this.options = Object.assign({}, {
    spacelen: 100,
    position: 'top'
  }, options);


  this.el.append(barrage);
  this.barrageWidth = barrage.offsetWidth;
  this.barrageHeight = barrage.offsetHeight;

  this.tracks = [];

  // 根据弹幕高度设置 弹幕轨道数
  this.tracked = false;
}

/**
 * 发射弹幕
 *
 * @example
 * {
 *   content: '弹幕内容' // 支持HTML
 * }
 *
 * 
 * @param  {[type]} options [description]
 * @return {[type]}        [description]
 */
Barrager.prototype.shoot = function(content, options) {
  Object.assign(this.options, options);

  var item = document.createElement('div');
  item.className = 'barrage-item';
  item.innerHTML = content;

  bindTransitionEvent(item, function() {
  	//this.remove();
  });
  
  this.barrage.append(item);

  var itemWidth = item.offsetWidth;
  item.style.right = -itemWidth + 'px';
  item.style.top = '100px';

  console.log(item.style.top);

  var offsetX = this.barrageWidth + itemWidth;
  
  window.requestAnimationFrame(()=>{
    item.style.transform = 'translateX(-'+offsetX+'px)';
  });
}

function bindTransitionEvent(el, callback) {
  transitionEvent && el.addEventListener(transitionEvent, callback);
}

function whichTransitionEvent(){
  var el = document.createElement('div');
  var transitions = {
    'transition':'transitionend',
    'OTransition':'oTransitionEnd',
    'MozTransition':'transitionend',
    'WebkitTransition':'webkitTransitionEnd',
    'MsTransition':'msTransitionEnd'
  }
 
  for(var t in transitions){
    if( el.style[t] !== undefined ){
      return transitions[t];
    }
  }
}


var barrager = new Barrager({
  el: document.body
});

for (var i = 1; i < 10; i++) {
  barrager.shoot(i + '.这是一条弹幕');
}
