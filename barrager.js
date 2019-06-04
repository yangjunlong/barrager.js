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

function Barrager(container, options) {
  this.container = typeof container === 'string' ? document.getElementById(container) : container;
  this.options = Object.assign({}, {

  }, options);
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
 * @param  {[type]} option [description]
 * @return {[type]}        [description]
 */
Barrager.prototype.shoot = function(option) {
  
}
