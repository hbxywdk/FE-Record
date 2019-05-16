const Koa = require('./application.js')
const app = new Koa()

app.use(async (ctx, next) => {
  console.log(1)
  next()
  console.log(11)
})
app.use(async (ctx, next) => {
  console.log(2)
  next()
  console.log(22)
})
app.use(async ctx => {
  console.log(3)
  ctx.body = 'Hello World'
})

app.listen(3333)

/*
var middleware = [() => console.log(1), () => console.log(2), () => console.log(3)] // 中间件
var index = 0 // 起始下标

function run() {
  var fn = middleware[index] // 当前要执行的中间件
  index++
  // 没有中间件了，返回一个没有参数的 Promise.resolve()
  if (!fn) return Promise.resolve()
  return Promise.resolve(run(fn()))
}

run().then(function () {
  console.log('End')
})


// 中间件
var middleware = [
  (ctx, next) => { console.log(1); next() },
  (ctx, next) => { console.log(2); next() },
  (ctx, next) => { console.log(3) }
]
var ctx = {} // 模拟 ctx 这里直接给个空对象
var index = 0 // 起始下标

function run(ctx) {
  return dispatch(0)
  function dispatch(i) {
    index = i
    var fn = middleware[i] // 当前要执行的中间件
    // 没有中间件了，返回一个没有参数的 Promise.resolve()
    if (!fn) return Promise.resolve()
    // dispatch.bind(null, i + 1) = 中间件的 next 参数 = 下一个中间件
    return Promise.resolve( fn(ctx, dispatch.bind(null, i + 1)) )
  }
}

run(ctx)
.then(() => {
  console.log('res.end()')
})
.catch(err => {
  console.error(err)
})
*/