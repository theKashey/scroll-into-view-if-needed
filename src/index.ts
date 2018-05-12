import compute from './compute'

// Standard, based on CSSOM View spec
export type ScrollBehavior = 'auto' | 'instant' | 'smooth'
export type ScrollLogicalPosition = 'start' | 'center' | 'end' | 'nearest'
// This new option is tracked in this PR, which is the most likely candidate at the time: https://github.com/w3c/csswg-drafts/pull/1805
export type ScrollMode = 'always' | 'if-needed'

export type CustomScrollBoundary = Element | CustomScrollBoundaryCallback
export interface BaseOptions {
  block?: ScrollLogicalPosition
  inline?: ScrollLogicalPosition
  scrollMode?: ScrollMode
  boundary?: CustomScrollBoundary
}

// Custom behavior, not in any spec
export interface CustomScrollBoundaryCallback {
  (parent: Element): boolean
}

export type CustomScrollAction = { el: Element; top: number; left: number }
export interface CustomScrollBehaviorCallback<T> {
  (actions: CustomScrollAction[]): T
}

export interface StandardBehaviorOptions extends BaseOptions {
  behavior?: ScrollBehavior
}
export interface CustomBehaviorOptions<T> extends BaseOptions {
  behavior: CustomScrollBehaviorCallback<T>
}

export interface Options<T = any> extends {
  behavior?: ScrollBehavior | CustomScrollBehaviorCallback<T>
}

// Wait with checking if native smooth-scrolling exists until scrolling is invoked
// This is much more friendly to server side rendering envs, and testing envs like jest
let supportsScrollBehavior

const isFunction = (arg: any): arg is Function => {
  return typeof arg == 'function'
}
const isOptionsObject = <T>(options: any): options is T => {
  return options === Object(options) && Object.keys(options).length !== 0
}

const defaultBehavior = (
  actions: CustomScrollAction[],
  behavior: ScrollBehavior = 'auto'
) => {
  if (supportsScrollBehavior === undefined) {
    supportsScrollBehavior = 'scrollBehavior' in document.documentElement.style
  }

  actions.forEach(({ el, top, left }) => {
    // browser implements the new Element.prototype.scroll API that supports `behavior`
    // and guard window.scroll with supportsScrollBehavior
    if (el.scroll && supportsScrollBehavior) {
      el.scroll({ top, left, behavior })
    } else {
      if (el === document.documentElement) {
        window.scrollTo(left, top)
      } else {
        el.scrollTop = top
        el.scrollLeft = left
      }
    }
  })
}

const getOptions = (options: any = true): StandardBehaviorOptions => {
  // Handle alignToTop for legacy reasons, to be compatible with the spec
  if (options === true || options === null) {
    return { block: 'start', inline: 'nearest' }
  } else if (options === false) {
    return { block: 'end', inline: 'nearest' }
  } else if (isOptionsObject<StandardBehaviorOptions>(options)) {
    return { block: 'center', inline: 'nearest', ...options }
  }

  // if options = {}, based on w3c web platform test
  return { block: 'start', inline: 'nearest' }
}

// Some people might use both "auto" and "ponyfill" modes in the same file, so we also provide a named export so
// that imports in userland code (like if they use native smooth scrolling on some browsers, and the ponyfill for everything else)
// the named export allows this `import {auto as autoScrollIntoView, ponyfill as smoothScrollIntoView} from ...`
function scroll<T>(
  target: Element,
  options: CustomBehaviorOptions<T>
): T
function scroll(target: Element, options?: Options | boolean): void
function scroll<T>(target, options: Options<T> | boolean = true) {
  if (
    isOptionsObject<CustomBehaviorOptions<T>>(options) &&
    isFunction(options.behavior)
  ) {
    return options.behavior(compute(target, options))
  }

  const computeOptions = getOptions(options)
  return defaultBehavior(
    compute(target, computeOptions),
    computeOptions.behavior
  )
}

// re-assign here makes the flowtype generation work
const scrollIntoView = scroll

export default scrollIntoView
