### 暴露出Vue src/core/instance/index.js
1. 首先定义了名为Vue的函数
```
function Vue (options) {
  // 使用函数调用Vue()来调用Vue时给出错误警告
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
```
2. 然后初始化&挂载一些功能
```
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)
```
3. 最后将Vue函数导出

### 先看initMixin(Vue) src/core/instance/init.js
initMixin在Vue.prototype上挂载了_init方法，该_init方法会在new Vue({})时首先调用。
```

```
