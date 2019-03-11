/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  // 定义_init方法
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // Vue 的uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // 一个标识，避免被观察到
    // a flag to avoid this being observed
    vm._isVue = true
    
    // 😀参数的处理
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      // 合并配置options
      vm.$options = mergeOptions(
        // 解析构造函数配置
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // Vue在开发环境使用了Proxy新API
      initProxy(vm)
    } else {
      // 让vm._renderProxy = this
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm

    // 😀初始化生命周期
    initLifecycle(vm)

    // 😀️初始化事件
    initEvents(vm)

    // 😀初始化Render
    initRender(vm)

    // 😀触发beforeCreate钩子
    callHook(vm, 'beforeCreate')

    // 在data/props之前初始化注入
    // resolve injections before data/props
    initInjections(vm)

    // 😀State初始化，prop/data/computed/method/watch都在这里完成初始化，是Vue实例create的关键
    initState(vm)

    // 在data/props之后初始化provide
    // resolve provide after data/props
    initProvide(vm) 
    
    // 😀触发created钩子
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    // 😀如果Options参数中传入了el，直接在DOM上挂载，如果没传则需要手动挂载
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

// 处理Vue与Vue子类这两种情况的options
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  // 是否是Vue的子类
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super) // 找到超类的Options
    const cachedSuperOptions = Ctor.superOptions // 
    if (superOptions !== cachedSuperOptions) { // 对比父类中的options 有没有发生变化
      // super(Vue)的Options配置若改变，处理新的Options
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  // 返回获merge自己的options与父类的options属性
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
