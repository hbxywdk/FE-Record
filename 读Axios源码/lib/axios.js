'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios'); // Axios
var mergeConfig = require('./core/mergeConfig'); // 合并配置参数
var defaults = require('./defaults'); // 默认配置

/**
 * 创建一个 Axios 实例
 *
 * @param {Object} defaultConfig 默认配置
 * @return {Axios} 返回一个新的 Axios 实例
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  // 其中使用 bind 对 axios 包装了一下，以提供 axios({url: 'xxx', ...}) 这种方式调用的能力
  var instance = bind(Axios.prototype.request, context);

  // 拷贝 axios.prototype 到 instance 上
  utils.extend(instance, Axios.prototype, context);

  // 拷贝 context 到 instance 上
  utils.extend(instance, context);

  return instance;
}

// 创建要导出的默认实例
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
// 暴露 Axios 类以允许类继承
axios.Axios = Axios;

// Factory for creating new instances
// 用于创建新实例的工厂函数
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// 暴露 Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// 暴露 all/spread 方法
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

module.exports = axios;

// 允许在 TypeScript 中使用默认导入语法
module.exports.default = axios;
