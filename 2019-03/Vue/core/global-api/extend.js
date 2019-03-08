/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'

export function initExtend (Vue: GlobalAPI) {
  /**
   * 每个实例构造函数(包括Vue)都有一个唯一的CID。
   * 这使我们能够为原型继承创建包装的“子构造函数”并缓存它们。
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * 定义一个Sub函数，继承于Vue，然后返回
   * Class inheritance
   */
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}

    // Super 指向 Vue
    const Super = this
    
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }

    // 定义一个Sub函数，继承Vue，然后返回
    const Sub = function VueComponent (options) {
      this._init(options)
    }
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    Sub['super'] = Super
    
    // 对于props与computed属性，我们在扩展时定义代理getter在Vue实例
    // 这样可以避免对创建的每个实例进行Object.DefineProperty调用。
    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.

    // 配置有props，初始化props
    if (Sub.options.props) {
      initProps(Sub)
    }
    // 配置有computed，初始化computed
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // 允许进一步使用 extension/mixin/plugin
    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use


    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })

    // 开启递归自查找
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }

    // 在扩展时保留对超类的配置项引用
    // 在之后的实例化时，我们可以检查超类的配置项是否已更新
    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have been updated.
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // 缓存构造函数
    // cache constructor
    cachedCtors[SuperId] = Sub

    // 返回Sub
    return Sub
  }
}

function initProps (Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
