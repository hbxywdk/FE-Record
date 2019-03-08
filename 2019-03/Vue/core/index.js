// 这个就是Vue
import Vue from './instance/index'
// 初始化全局API
import { initGlobalAPI } from './global-api/index'
// 环境判断，用于判断是否是服务端
import { isServerRendering } from 'core/util/env'
// 功能渲染上下文
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'

// 执行初始化全局API
initGlobalAPI(Vue)

/**
 * vm.$isServer
 * 在Vue.prototype上定义$isServer，用于判断当前 Vue 实例是否运行于服务器
 */
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

/**
 * vm.$ssrContext
 * 在Vue.prototype设置$ssrContext属性
 * 可以通过 this.$ssrContext 来直接访问组件中的服务器端渲染上下文(SSR context)。
 */
Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

// FunctionalRenderContext方法，用于SSR运行时helper安装，
// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})

// Vue版本
Vue.version = '__VERSION__'

export default Vue

/**
 * hasOwn: 检查对象是否有某个属性
 * 
 */
