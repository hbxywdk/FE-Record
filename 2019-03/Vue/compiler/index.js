/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 生成AST树
  const ast = parse(template.trim(), options)
  // 优化AST
  if (options.optimize !== false) {
    optimize(ast, options)
  }
  // generate函数会返回render与staticRenderFns
  const code = generate(ast, options)
  // 最后将 ast、render、staticRenderFns全部返回
  return {
    // AST
    ast,
    /*
      这个是render函数
      如果有这样一段代码
      var v = new Vue({
        el:'.arrow', data:{a:1}, template: '<div>{{ a }}</div>'
      })
      console.log(v.$options.render)
      会得到：
      ƒ anonymous() { with(this){return _c('div',[_v(_s(a))])} }
      _c其实就是createElement函数的内部用法
      Vue最终编译template的结果和我们直接用createElement手写render函数没两样。
    */
    render: code.render,
    // staticRenderFns 存放纯静态 render函数（就是没有使用data中的数据），比如这一段：
    // var v = new Vue({
    //   el: '.arrow', data: { a: 1 }, template: '<div>hello</div>'
    // })
    // console.log(v.$options.staticRenderFns) // 这里输出就会看到里面的东西
    staticRenderFns: code.staticRenderFns
  }
})
