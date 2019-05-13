import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  // 使用函数调用Vue()来调用Vue时给出错误警告
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue) // 初始化混入
stateMixin(Vue)
eventsMixin(Vue) // 混入 Vue.prototype.$on 、$once、$off、$emit方法
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
