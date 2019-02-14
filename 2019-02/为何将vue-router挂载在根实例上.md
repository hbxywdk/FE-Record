##### (未完成)
在Vue根实例中以参数传入router，Vue会把router添加到this.$options,  
在vue-router的install的函数中，有一个Vue.mixin, 当 beforeCreate 触发的时候,  
如果 this.$options.router 存在, 就会注入一个 this._router 的变量
```
  Vue.mixin({
    beforeCreate: function beforeCreate () {
      if (isDef(this.$options.router)) {
        this._routerRoot = this;
        this._router = this.$options.router;
        this._router.init(this);
        Vue.util.defineReactive(this, '_route', this._router.history.current);
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
      }
      registerInstance(this, this);
    },
    destroyed: function destroyed () {
      registerInstance(this);
    }
  });
```