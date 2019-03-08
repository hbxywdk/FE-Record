### 全局api挂载 src/core/global-api/index.js
在Vue上挂载Vue的配置文件、工具、属性，初始化各种全局方法 

* Vue.util  各种工具函数 
* Vue.set/delete 
* Vue.nextTick 
* Vue.options
* initUse(Vue)  挂载Vue.use方法
* initMixin(Vue)  挂载Vue.mixin方法
* initExtend(Vue)  挂载方法（使用 Vue 的基础构造函数，创建一个“子类(subclass)”。）
* initAssetRegisters(Vue)

* Vue.extend

（定义一个Sub函数，继承于Vue，然后返回）
> Vue.extend的内部定义一个Sub，Sub继承于Super（指Vue），
> Vue.extend()返回Sub，Sub 是 Vue 的子类，
> 所以 'new Vue({});' 与 'var p = Vue.extend({}); new P();' 实际上是类似的东西。

* 每个实例构造函数(包括Vue)都有一个唯一的CID。
* 这使我们能够为原型继承创建包装的“子构造函数”并缓存它们。

### 直接导出Vue函数 src/core/instance/index.js
