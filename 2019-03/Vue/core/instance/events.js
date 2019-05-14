/* @flow */

import {
  tip,
  toArray,
  hyphenate,
  formatComponentName,
  invokeWithErrorHandling
} from '../util/index'
import { updateListeners } from '../vdom/helpers/index'

// 初始化事件
export function initEvents (vm: Component) {
  // 创建vm._events，它是一个空对象，用来存放事件，之后会变为这个样子
  // vm._events = {
  //   eventName1: [fna1, fna2],
  //   eventName2: [fnb1, fnb2]
  // }
  vm._events = Object.create(null)
  // 是否存在事件钩子，初始为false
  vm._hasHookEvent = false
  // init parent attached events
  // 这个 listeners 是父组件上添加的事件监听，HTML上的事件不走这里，大概长这样 {'eventName', fn}
  const listeners = vm.$options._parentListeners 
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

let target: any

function add (event, fn) {
  target.$on(event, fn)
}

function remove (event, fn) {
  target.$off(event, fn)
}

function createOnceHandler (event, fn) {
  const _target = target
  return function onceHandler () {
    const res = fn.apply(null, arguments)
    if (res !== null) {
      _target.$off(event, onceHandler)
    }
  }
}

export function updateComponentListeners (
  vm: Component,
  listeners: Object,
  oldListeners: ?Object
) {
  target = vm
  updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
  target = undefined
}

export function eventsMixin (Vue: Class<Component>) {
  const hookRE = /^hook:/
  Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    const vm: Component = this
    // 如果event参数是个数组，则会循环event，为其中每一个元素都调用一次vm.$on()
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn)
      }
    } else {
      // 如果 vm._events 中定义过这个事件，就直接把回调 'fn' push进去
      // 没定义过这个事件就把 vm._events[event] 赋值为 []，在把 'fn' push进去
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }

  // 只触发一次的事件
  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn
    // 该事件只要执行过一次，就会执行 on 回调函数，销毁该事件
    vm.$on(event, on)
    return vm
  }

  Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this
    // all
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    // event参数是个数组，循环，依次调用$off
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    // cbs 就是我们要 off 的事件
    const cbs = vm._events[event]
    if (!cbs) {
      return vm
    }
    // 没有fn传入，则直接销毁对应'全部'event，然后返回vm
    if (!fn) {
      vm._events[event] = null
      return vm
    }
    // 这里处理要销毁指定函数的情况
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }

  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    if (process.env.NODE_ENV !== 'production') {
      const lowerCaseEvent = event.toLowerCase()
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    // 在 vm._events 中寻找有没有对应的事件
    let cbs = vm._events[event]
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      // 截掉第一个event参数，保留其他参数
      const args = toArray(arguments, 1)
      const info = `event handler for "${event}"`
      for (let i = 0, l = cbs.length; i < l; i++) {
        // 带有错误处理的调用
        invokeWithErrorHandling(cbs[i], vm, args, vm, info)
      }
    }
    return vm
  }
}
