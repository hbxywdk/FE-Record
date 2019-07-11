'use strict';

var utils = require('./../utils');

// 拦截器管理
function InterceptorManager() {
  // 用于储存所有 use 方法传入的拦截器
  this.handlers = [];
}

/**
 * 添加一个新拦截器
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise` // 处理 Promise 的 then 的函数
 * @param {Function} rejected The function to handle `reject` for a `Promise` // 处理 Promise 的 reject 的函数
 *
 * @return {Number} 返回一个 id 用于之后移除拦截器
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * 移除一个拦截器
 *
 * @param {Number} id 该 id 是由 use 方法返回的
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * 迭代所有注册的拦截器
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn fn函数会调用每一个拦截器
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;
