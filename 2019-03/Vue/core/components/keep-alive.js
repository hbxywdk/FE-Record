/* @flow */

import { isRegExp, remove } from 'shared/util'
import { getFirstComponentChild } from 'core/vdom/helpers/index'

type VNodeCache = { [key: string]: ?VNode };

// 获取组件名称或tag标签
function getComponentName (opts: ?VNodeComponentOptions): ?string {
  return opts && (opts.Ctor.options.name || opts.tag)
}

// 匹配 pattern 中是否有 name，有返回 true，无返回 false
function matches (pattern: string | RegExp | Array<string>, name: string): boolean {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

/**
 * 
 * @param {any} keepAliveInstance keep-alive实例
 * @param {Function} filter 返回是否匹配上的函数
 */
function pruneCache (keepAliveInstance: any, filter: Function) {
  // cache（create中创建的一个空对象）
  // keys（create中创建的一个空数组）
  // _vnode（keep-alive组件的_vnode属性）
  const { cache, keys, _vnode } = keepAliveInstance

  // 遍历 cache
  for (const key in cache) {
    const cachedNode: ?VNode = cache[key]
    if (cachedNode) {
      const name: ?string = getComponentName(cachedNode.componentOptions)
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }

}

// 销毁实例，并从 cache 中移除
function pruneCacheEntry (
  cache: VNodeCache,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const cached = cache[key]
  if (cached && (!current || cached.tag !== current.tag)) {
    cached.componentInstance.$destroy()
  }
  cache[key] = null
  remove(keys, key)
}

const patternTypes: Array<Function> = [String, RegExp, Array]

// keep-alive组件 周期：created -> render -> mounted
export default {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes, // 字符串或正则表达式。只有名称匹配的组件会被缓存。
    exclude: patternTypes, // 字符串或正则表达式。任何名称匹配的组件都不会被缓存。
    max: [String, Number] // 数字。最多可以缓存多少组件实例。
  },
  
  // created
  created () {
    this.cache = Object.create(null)
    this.keys = []
  },

  // mounted
  mounted () {
    // 监听 include，变化后执行 pruneCache
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    // 监听 exclude，变化后执行 pruneCache
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  // destroyed 时销毁虽有组件
  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  render () {
    const slot = this.$slots.default // 获取 slot
    // 获取 slot 中第一个有效 component
    const vnode: VNode = getFirstComponentChild(slot) 
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions // vnode 的配置项
    if (componentOptions) {
      // check pattern
       // 组件名，没有组件名就返回 tag 名
      const name: ?string = getComponentName(componentOptions)
      const { include, exclude } = this
      // 不在 included 或者说 在 excluded 中，则是不缓存的组件，直接返回 vnode。
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      const { cache, keys } = this
      // vnode 有 key 则赋值为 key，没 key 则赋一个 key，这个 key 用于缓存组件
      const key: ?string = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key

      // 已缓存过，直接取缓存中的 componentInstance 给 vnode
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance
        // make current key freshest
        remove(keys, key)
        keys.push(key)
      // 未缓存过，添加缓存
      } else {
        cache[key] = vnode
        keys.push(key)
        // prune oldest entry
        // 最大缓存组件
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
      }
      // keepAlive 标记
      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
