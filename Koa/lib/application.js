
'use strict';

// 模块依赖.
const debug = require('debug')('koa:application');
const isGeneratorFunction = require('is-generator-function'); // 检查是否是一个 generator 函数
const convert = require('koa-convert'); // 在 use 方法中转换 generator 函数为 Koa 可以用的形式
const compose = require('koa-compose'); // 对中间件数组进行排版
const isJSON = require('koa-is-json'); // 检查 ctx.body 是否是一个 JSON

const onFinished = require('on-finished');
const statuses = require('statuses');
const Emitter = require('events');
const util = require('util');
const Stream = require('stream');
const http = require('http');
const only = require('only');
const deprecate = require('depd')('koa');
// 引入其他三个文件
const request = require('./request');
const response = require('./response');
const context = require('./context');

/**
 * 暴露 `Application` class.
 * 它继承自 `Emitter.prototype`.
 */
module.exports = class Application extends Emitter {
  /**
   * 初始化一个新的 `Application`.
   *
   * @api public
   */
  constructor() {
    super();
    // 属性定义
    this.proxy = false;
    this.middleware = []; // 存放所有 use 的中间件
    this.subdomainOffset = 2;
    this.env = process.env.NODE_ENV || 'development';
    // 其他三个文件，导出的都是 Object
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
    if (util.inspect.custom) {
      this[util.inspect.custom] = this.inspect;
    }
  }
  /**
   * 简写为: http.createServer(app.callback()).listen(...)
   * @param {Mixed} ...
   * @return {Server}
   * @api public
   * Listen 方法
   */
  listen(...args) {
    debug('listen');
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }
  /**
   * Return JSON representation.
   * We only bother showing settings.
   * @return {Object}
   * @api public
   */
  toJSON() {
    return only(this, [
      'subdomainOffset',
      'proxy',
      'env'
    ]);
  }
  /**
   * Inspect implementation.
   * @return {Object}
   * @api public
   */
  inspect() {
    return this.toJSON();
  }
  /**
   * Use the given middleware `fn`.
   * Old-style middleware will be converted.
   * @param {Function} fn
   * @return {Application} self
   * @api public
   * use方法，老的中间件写法在这里会被转换
   */
  use(fn) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!'); // 中间件必须为函数
    // 检查是否是 generator 函数，如果是则会给出提示：将会在 3.x 版本移除对 generator 函数的支持
    if (isGeneratorFunction(fn)) {
      deprecate('Support for generators will be removed in v3. ' +
                'See the documentation for examples of how to convert old middleware ' +
                'https://github.com/koajs/koa/blob/master/docs/migration.md');
      fn = convert(fn);
    }
    debug('use %s', fn._name || fn.name || '-');
    // 将中间件函数 push 到 this.middleware中
    this.middleware.push(fn);
    return this;
  }
  /**
   * Return a request handler callback for node's native http server.
   * 返回一个node的native http服务的请求callback
   * @return {Function}
   * @api public
   */
  callback() {
    const fn = compose(this.middleware);
    if (!this.listenerCount('error')) this.on('error', this.onerror);
    // 定义handleRequest
    const handleRequest = (req, res) => {
      // ctx
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };
    return handleRequest;
  }
  /**
   * Handle request in callback.
   * 处理回调用的请求
   * @api private
   */
  handleRequest(ctx, fnMiddleware) {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = err => ctx.onerror(err);
    const handleResponse = () => respond(ctx);
    onFinished(res, onerror);
    return fnMiddleware(ctx).then(handleResponse).catch(onerror);
  }
  /**
   * 初始化一个新 context.
   * @api private
   */
  createContext(req, res) {
    const context = Object.create(this.context);
    const request = context.request = Object.create(this.request);
    const response = context.response = Object.create(this.response);
    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.originalUrl = request.originalUrl = req.url;
    context.state = {};
    return context;
  }
  /**
   * 默认的错误处理
   * @param {Error} err
   * @api private
   */
  onerror(err) {
    if (!(err instanceof Error)) throw new TypeError(util.format('non-error thrown: %j', err));

    if (404 == err.status || err.expose) return;
    if (this.silent) return;

    const msg = err.stack || err.toString();
    console.error();
    console.error(msg.replace(/^/gm, '  '));
    console.error();
  }
};

// Response helper.
function respond(ctx) {
  // allow bypassing koa
  if (false === ctx.respond) return;

  if (!ctx.writable) return;

  const res = ctx.res;
  let body = ctx.body;
  const code = ctx.status;

  // ignore body
  if (statuses.empty[code]) {
    // strip headers
    ctx.body = null;
    return res.end();
  }

  if ('HEAD' == ctx.method) {
    if (!res.headersSent && isJSON(body)) {
      ctx.length = Buffer.byteLength(JSON.stringify(body));
    }
    return res.end();
  }

  // status body
  if (null == body) {
    if (ctx.req.httpVersionMajor >= 2) {
      body = String(code);
    } else {
      body = ctx.message || String(code);
    }
    if (!res.headersSent) {
      ctx.type = 'text';
      ctx.length = Buffer.byteLength(body);
    }
    return res.end(body);
  }

  // responses
  if (Buffer.isBuffer(body)) return res.end(body);
  if ('string' == typeof body) return res.end(body);
  if (body instanceof Stream) return body.pipe(res);

  // body: json
  body = JSON.stringify(body);
  if (!res.headersSent) {
    ctx.length = Buffer.byteLength(body);
  }
  res.end(body);
}
