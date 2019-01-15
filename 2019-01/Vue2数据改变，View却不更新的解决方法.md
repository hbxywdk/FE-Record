#### 日常使用Vue2开发的时候偶尔会遇到，明明data已经更新，View层却没有刷新的问题。
#### 这种情况一般常见于嵌套层级过于复杂的Object中，data确实已经修改，但是由于Vue底层机制，无法监听到data变动，从而不能正确的修改View。

#### 通常来说解决方案有以下几种：
- 使用 Vue.set 或 this.$Set 
- 使用 JSON.parse 与 JSON.stringify
```
  const obj = JSON.parse(JSON.stringify(this.obj))
  obj.item.img = ''
  this.obj = obj
```
- 使用 Object.assign({}, obj)
```
const obj = Object.assign({}, this.obj)
obj.item.img = ''
this.obj = obj
```
#### 通常来说使用以上几种方式，就可以解决问题，但如果任然无法解决，还有另外一种方式，强行使Vue触发Vue更新：
```
// 在data中定义一个数据
data() {
  return {
    refresh: true
  }
}

// 在template中引用，并将其隐藏
<div style="opacity: 0; height: 0;">{{ refresh }}</div>

// 需要更新复杂数据时，手动修改refresh值，使Vue更新View层
this.obj.xxx = 'xxx' // obj更新
this.refresh = !this.refresh
```