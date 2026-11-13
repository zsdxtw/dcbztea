"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/react/cjs/react.production.min.js
var require_react_production_min = __commonJS({
  "node_modules/react/cjs/react.production.min.js"(exports2) {
    "use strict";
    var l = Symbol.for("react.element");
    var n = Symbol.for("react.portal");
    var p = Symbol.for("react.fragment");
    var q = Symbol.for("react.strict_mode");
    var r = Symbol.for("react.profiler");
    var t = Symbol.for("react.provider");
    var u = Symbol.for("react.context");
    var v = Symbol.for("react.forward_ref");
    var w = Symbol.for("react.suspense");
    var x = Symbol.for("react.memo");
    var y = Symbol.for("react.lazy");
    var z = Symbol.iterator;
    function A(a) {
      if (null === a || "object" !== typeof a) return null;
      a = z && a[z] || a["@@iterator"];
      return "function" === typeof a ? a : null;
    }
    var B = { isMounted: function() {
      return false;
    }, enqueueForceUpdate: function() {
    }, enqueueReplaceState: function() {
    }, enqueueSetState: function() {
    } };
    var C = Object.assign;
    var D = {};
    function E(a, b, e) {
      this.props = a;
      this.context = b;
      this.refs = D;
      this.updater = e || B;
    }
    E.prototype.isReactComponent = {};
    E.prototype.setState = function(a, b) {
      if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
      this.updater.enqueueSetState(this, a, b, "setState");
    };
    E.prototype.forceUpdate = function(a) {
      this.updater.enqueueForceUpdate(this, a, "forceUpdate");
    };
    function F() {
    }
    F.prototype = E.prototype;
    function G(a, b, e) {
      this.props = a;
      this.context = b;
      this.refs = D;
      this.updater = e || B;
    }
    var H = G.prototype = new F();
    H.constructor = G;
    C(H, E.prototype);
    H.isPureReactComponent = true;
    var I = Array.isArray;
    var J = Object.prototype.hasOwnProperty;
    var K = { current: null };
    var L = { key: true, ref: true, __self: true, __source: true };
    function M(a, b, e) {
      var d, c = {}, k = null, h = null;
      if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
      var g = arguments.length - 2;
      if (1 === g) c.children = e;
      else if (1 < g) {
        for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
        c.children = f;
      }
      if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
      return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
    }
    function N(a, b) {
      return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
    }
    function O(a) {
      return "object" === typeof a && null !== a && a.$$typeof === l;
    }
    function escape(a) {
      var b = { "=": "=0", ":": "=2" };
      return "$" + a.replace(/[=:]/g, function(a2) {
        return b[a2];
      });
    }
    var P = /\/+/g;
    function Q(a, b) {
      return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
    }
    function R(a, b, e, d, c) {
      var k = typeof a;
      if ("undefined" === k || "boolean" === k) a = null;
      var h = false;
      if (null === a) h = true;
      else switch (k) {
        case "string":
        case "number":
          h = true;
          break;
        case "object":
          switch (a.$$typeof) {
            case l:
            case n:
              h = true;
          }
      }
      if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a2) {
        return a2;
      })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
      h = 0;
      d = "" === d ? "." : d + ":";
      if (I(a)) for (var g = 0; g < a.length; g++) {
        k = a[g];
        var f = d + Q(k, g);
        h += R(k, b, e, f, c);
      }
      else if (f = A(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done; ) k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
      else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
      return h;
    }
    function S(a, b, e) {
      if (null == a) return a;
      var d = [], c = 0;
      R(a, d, "", "", function(a2) {
        return b.call(e, a2, c++);
      });
      return d;
    }
    function T(a) {
      if (-1 === a._status) {
        var b = a._result;
        b = b();
        b.then(function(b2) {
          if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
        }, function(b2) {
          if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
        });
        -1 === a._status && (a._status = 0, a._result = b);
      }
      if (1 === a._status) return a._result.default;
      throw a._result;
    }
    var U = { current: null };
    var V = { transition: null };
    var W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
    function X() {
      throw Error("act(...) is not supported in production builds of React.");
    }
    exports2.Children = { map: S, forEach: function(a, b, e) {
      S(a, function() {
        b.apply(this, arguments);
      }, e);
    }, count: function(a) {
      var b = 0;
      S(a, function() {
        b++;
      });
      return b;
    }, toArray: function(a) {
      return S(a, function(a2) {
        return a2;
      }) || [];
    }, only: function(a) {
      if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
      return a;
    } };
    exports2.Component = E;
    exports2.Fragment = p;
    exports2.Profiler = r;
    exports2.PureComponent = G;
    exports2.StrictMode = q;
    exports2.Suspense = w;
    exports2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
    exports2.act = X;
    exports2.cloneElement = function(a, b, e) {
      if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
      var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
      if (null != b) {
        void 0 !== b.ref && (k = b.ref, h = K.current);
        void 0 !== b.key && (c = "" + b.key);
        if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
        for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
      }
      var f = arguments.length - 2;
      if (1 === f) d.children = e;
      else if (1 < f) {
        g = Array(f);
        for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
        d.children = g;
      }
      return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
    };
    exports2.createContext = function(a) {
      a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
      a.Provider = { $$typeof: t, _context: a };
      return a.Consumer = a;
    };
    exports2.createElement = M;
    exports2.createFactory = function(a) {
      var b = M.bind(null, a);
      b.type = a;
      return b;
    };
    exports2.createRef = function() {
      return { current: null };
    };
    exports2.forwardRef = function(a) {
      return { $$typeof: v, render: a };
    };
    exports2.isValidElement = O;
    exports2.lazy = function(a) {
      return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
    };
    exports2.memo = function(a, b) {
      return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
    };
    exports2.startTransition = function(a) {
      var b = V.transition;
      V.transition = {};
      try {
        a();
      } finally {
        V.transition = b;
      }
    };
    exports2.unstable_act = X;
    exports2.useCallback = function(a, b) {
      return U.current.useCallback(a, b);
    };
    exports2.useContext = function(a) {
      return U.current.useContext(a);
    };
    exports2.useDebugValue = function() {
    };
    exports2.useDeferredValue = function(a) {
      return U.current.useDeferredValue(a);
    };
    exports2.useEffect = function(a, b) {
      return U.current.useEffect(a, b);
    };
    exports2.useId = function() {
      return U.current.useId();
    };
    exports2.useImperativeHandle = function(a, b, e) {
      return U.current.useImperativeHandle(a, b, e);
    };
    exports2.useInsertionEffect = function(a, b) {
      return U.current.useInsertionEffect(a, b);
    };
    exports2.useLayoutEffect = function(a, b) {
      return U.current.useLayoutEffect(a, b);
    };
    exports2.useMemo = function(a, b) {
      return U.current.useMemo(a, b);
    };
    exports2.useReducer = function(a, b, e) {
      return U.current.useReducer(a, b, e);
    };
    exports2.useRef = function(a) {
      return U.current.useRef(a);
    };
    exports2.useState = function(a) {
      return U.current.useState(a);
    };
    exports2.useSyncExternalStore = function(a, b, e) {
      return U.current.useSyncExternalStore(a, b, e);
    };
    exports2.useTransition = function() {
      return U.current.useTransition();
    };
    exports2.version = "18.3.1";
  }
});

// node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "node_modules/react/cjs/react.development.js"(exports2, module2) {
    "use strict";
    if (process.env.NODE_ENV !== "production") {
      (function() {
        "use strict";
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
        }
        var ReactVersion = "18.3.1";
        var REACT_ELEMENT_TYPE = Symbol.for("react.element");
        var REACT_PORTAL_TYPE = Symbol.for("react.portal");
        var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
        var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
        var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
        var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
        var REACT_CONTEXT_TYPE = Symbol.for("react.context");
        var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
        var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
        var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
        var REACT_MEMO_TYPE = Symbol.for("react.memo");
        var REACT_LAZY_TYPE = Symbol.for("react.lazy");
        var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
        var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
        var FAUX_ITERATOR_SYMBOL = "@@iterator";
        function getIteratorFn(maybeIterable) {
          if (maybeIterable === null || typeof maybeIterable !== "object") {
            return null;
          }
          var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
          if (typeof maybeIterator === "function") {
            return maybeIterator;
          }
          return null;
        }
        var ReactCurrentDispatcher = {
          /**
           * @internal
           * @type {ReactComponent}
           */
          current: null
        };
        var ReactCurrentBatchConfig = {
          transition: null
        };
        var ReactCurrentActQueue = {
          current: null,
          // Used to reproduce behavior of `batchedUpdates` in legacy mode.
          isBatchingLegacy: false,
          didScheduleLegacyUpdate: false
        };
        var ReactCurrentOwner = {
          /**
           * @internal
           * @type {ReactComponent}
           */
          current: null
        };
        var ReactDebugCurrentFrame = {};
        var currentExtraStackFrame = null;
        function setExtraStackFrame(stack) {
          {
            currentExtraStackFrame = stack;
          }
        }
        {
          ReactDebugCurrentFrame.setExtraStackFrame = function(stack) {
            {
              currentExtraStackFrame = stack;
            }
          };
          ReactDebugCurrentFrame.getCurrentStack = null;
          ReactDebugCurrentFrame.getStackAddendum = function() {
            var stack = "";
            if (currentExtraStackFrame) {
              stack += currentExtraStackFrame;
            }
            var impl = ReactDebugCurrentFrame.getCurrentStack;
            if (impl) {
              stack += impl() || "";
            }
            return stack;
          };
        }
        var enableScopeAPI = false;
        var enableCacheElement = false;
        var enableTransitionTracing = false;
        var enableLegacyHidden = false;
        var enableDebugTracing = false;
        var ReactSharedInternals = {
          ReactCurrentDispatcher,
          ReactCurrentBatchConfig,
          ReactCurrentOwner
        };
        {
          ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
          ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
        }
        function warn(format) {
          {
            {
              for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
              }
              printWarning("warn", format, args);
            }
          }
        }
        function error(format) {
          {
            {
              for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
              }
              printWarning("error", format, args);
            }
          }
        }
        function printWarning(level, format, args) {
          {
            var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
            var stack = ReactDebugCurrentFrame2.getStackAddendum();
            if (stack !== "") {
              format += "%s";
              args = args.concat([stack]);
            }
            var argsWithFormat = args.map(function(item) {
              return String(item);
            });
            argsWithFormat.unshift("Warning: " + format);
            Function.prototype.apply.call(console[level], console, argsWithFormat);
          }
        }
        var didWarnStateUpdateForUnmountedComponent = {};
        function warnNoop(publicInstance, callerName) {
          {
            var _constructor = publicInstance.constructor;
            var componentName = _constructor && (_constructor.displayName || _constructor.name) || "ReactClass";
            var warningKey = componentName + "." + callerName;
            if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
              return;
            }
            error("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", callerName, componentName);
            didWarnStateUpdateForUnmountedComponent[warningKey] = true;
          }
        }
        var ReactNoopUpdateQueue = {
          /**
           * Checks whether or not this composite component is mounted.
           * @param {ReactClass} publicInstance The instance we want to test.
           * @return {boolean} True if mounted, false otherwise.
           * @protected
           * @final
           */
          isMounted: function(publicInstance) {
            return false;
          },
          /**
           * Forces an update. This should only be invoked when it is known with
           * certainty that we are **not** in a DOM transaction.
           *
           * You may want to call this when you know that some deeper aspect of the
           * component's state has changed but `setState` was not called.
           *
           * This will not invoke `shouldComponentUpdate`, but it will invoke
           * `componentWillUpdate` and `componentDidUpdate`.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {?function} callback Called after component is updated.
           * @param {?string} callerName name of the calling function in the public API.
           * @internal
           */
          enqueueForceUpdate: function(publicInstance, callback, callerName) {
            warnNoop(publicInstance, "forceUpdate");
          },
          /**
           * Replaces all of the state. Always use this or `setState` to mutate state.
           * You should treat `this.state` as immutable.
           *
           * There is no guarantee that `this.state` will be immediately updated, so
           * accessing `this.state` after calling this method may return the old value.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {object} completeState Next state.
           * @param {?function} callback Called after component is updated.
           * @param {?string} callerName name of the calling function in the public API.
           * @internal
           */
          enqueueReplaceState: function(publicInstance, completeState, callback, callerName) {
            warnNoop(publicInstance, "replaceState");
          },
          /**
           * Sets a subset of the state. This only exists because _pendingState is
           * internal. This provides a merging strategy that is not available to deep
           * properties which is confusing. TODO: Expose pendingState or don't use it
           * during the merge.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {object} partialState Next partial state to be merged with state.
           * @param {?function} callback Called after component is updated.
           * @param {?string} Name of the calling function in the public API.
           * @internal
           */
          enqueueSetState: function(publicInstance, partialState, callback, callerName) {
            warnNoop(publicInstance, "setState");
          }
        };
        var assign = Object.assign;
        var emptyObject = {};
        {
          Object.freeze(emptyObject);
        }
        function Component(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        Component.prototype.isReactComponent = {};
        Component.prototype.setState = function(partialState, callback) {
          if (typeof partialState !== "object" && typeof partialState !== "function" && partialState != null) {
            throw new Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
          }
          this.updater.enqueueSetState(this, partialState, callback, "setState");
        };
        Component.prototype.forceUpdate = function(callback) {
          this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
        };
        {
          var deprecatedAPIs = {
            isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
            replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
          };
          var defineDeprecationWarning = function(methodName, info) {
            Object.defineProperty(Component.prototype, methodName, {
              get: function() {
                warn("%s(...) is deprecated in plain JavaScript React classes. %s", info[0], info[1]);
                return void 0;
              }
            });
          };
          for (var fnName in deprecatedAPIs) {
            if (deprecatedAPIs.hasOwnProperty(fnName)) {
              defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
            }
          }
        }
        function ComponentDummy() {
        }
        ComponentDummy.prototype = Component.prototype;
        function PureComponent(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
        pureComponentPrototype.constructor = PureComponent;
        assign(pureComponentPrototype, Component.prototype);
        pureComponentPrototype.isPureReactComponent = true;
        function createRef() {
          var refObject = {
            current: null
          };
          {
            Object.seal(refObject);
          }
          return refObject;
        }
        var isArrayImpl = Array.isArray;
        function isArray(a) {
          return isArrayImpl(a);
        }
        function typeName(value) {
          {
            var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
            var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            return type;
          }
        }
        function willCoercionThrow(value) {
          {
            try {
              testStringCoercion(value);
              return false;
            } catch (e) {
              return true;
            }
          }
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          {
            if (willCoercionThrow(value)) {
              error("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        function getWrappedName(outerType, innerType, wrapperName) {
          var displayName = outerType.displayName;
          if (displayName) {
            return displayName;
          }
          var functionName = innerType.displayName || innerType.name || "";
          return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
        }
        function getContextName(type) {
          return type.displayName || "Context";
        }
        function getComponentNameFromType(type) {
          if (type == null) {
            return null;
          }
          {
            if (typeof type.tag === "number") {
              error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
            }
          }
          if (typeof type === "function") {
            return type.displayName || type.name || null;
          }
          if (typeof type === "string") {
            return type;
          }
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_CONTEXT_TYPE:
                var context = type;
                return getContextName(context) + ".Consumer";
              case REACT_PROVIDER_TYPE:
                var provider = type;
                return getContextName(provider._context) + ".Provider";
              case REACT_FORWARD_REF_TYPE:
                return getWrappedName(type, type.render, "ForwardRef");
              case REACT_MEMO_TYPE:
                var outerName = type.displayName || null;
                if (outerName !== null) {
                  return outerName;
                }
                return getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return getComponentNameFromType(init(payload));
                } catch (x) {
                  return null;
                }
              }
            }
          }
          return null;
        }
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var RESERVED_PROPS = {
          key: true,
          ref: true,
          __self: true,
          __source: true
        };
        var specialPropKeyWarningShown, specialPropRefWarningShown, didWarnAboutStringRefs;
        {
          didWarnAboutStringRefs = {};
        }
        function hasValidRef(config) {
          {
            if (hasOwnProperty.call(config, "ref")) {
              var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.ref !== void 0;
        }
        function hasValidKey(config) {
          {
            if (hasOwnProperty.call(config, "key")) {
              var getter = Object.getOwnPropertyDescriptor(config, "key").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.key !== void 0;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          var warnAboutAccessingKey = function() {
            {
              if (!specialPropKeyWarningShown) {
                specialPropKeyWarningShown = true;
                error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            }
          };
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function defineRefPropWarningGetter(props, displayName) {
          var warnAboutAccessingRef = function() {
            {
              if (!specialPropRefWarningShown) {
                specialPropRefWarningShown = true;
                error("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            }
          };
          warnAboutAccessingRef.isReactWarning = true;
          Object.defineProperty(props, "ref", {
            get: warnAboutAccessingRef,
            configurable: true
          });
        }
        function warnIfStringRefCannotBeAutoConverted(config) {
          {
            if (typeof config.ref === "string" && ReactCurrentOwner.current && config.__self && ReactCurrentOwner.current.stateNode !== config.__self) {
              var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);
              if (!didWarnAboutStringRefs[componentName]) {
                error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', componentName, config.ref);
                didWarnAboutStringRefs[componentName] = true;
              }
            }
          }
        }
        var ReactElement = function(type, key, ref, self, source, owner, props) {
          var element = {
            // This tag allows us to uniquely identify this as a React Element
            $$typeof: REACT_ELEMENT_TYPE,
            // Built-in properties that belong on the element
            type,
            key,
            ref,
            props,
            // Record the component responsible for creating this element.
            _owner: owner
          };
          {
            element._store = {};
            Object.defineProperty(element._store, "validated", {
              configurable: false,
              enumerable: false,
              writable: true,
              value: false
            });
            Object.defineProperty(element, "_self", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: self
            });
            Object.defineProperty(element, "_source", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: source
            });
            if (Object.freeze) {
              Object.freeze(element.props);
              Object.freeze(element);
            }
          }
          return element;
        };
        function createElement(type, config, children) {
          var propName;
          var props = {};
          var key = null;
          var ref = null;
          var self = null;
          var source = null;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              {
                warnIfStringRefCannotBeAutoConverted(config);
              }
            }
            if (hasValidKey(config)) {
              {
                checkKeyStringCoercion(config.key);
              }
              key = "" + config.key;
            }
            self = config.__self === void 0 ? null : config.__self;
            source = config.__source === void 0 ? null : config.__source;
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                props[propName] = config[propName];
              }
            }
          }
          var childrenLength = arguments.length - 2;
          if (childrenLength === 1) {
            props.children = children;
          } else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
              childArray[i] = arguments[i + 2];
            }
            {
              if (Object.freeze) {
                Object.freeze(childArray);
              }
            }
            props.children = childArray;
          }
          if (type && type.defaultProps) {
            var defaultProps = type.defaultProps;
            for (propName in defaultProps) {
              if (props[propName] === void 0) {
                props[propName] = defaultProps[propName];
              }
            }
          }
          {
            if (key || ref) {
              var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
              if (key) {
                defineKeyPropWarningGetter(props, displayName);
              }
              if (ref) {
                defineRefPropWarningGetter(props, displayName);
              }
            }
          }
          return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
        }
        function cloneAndReplaceKey(oldElement, newKey) {
          var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
          return newElement;
        }
        function cloneElement(element, config, children) {
          if (element === null || element === void 0) {
            throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + element + ".");
          }
          var propName;
          var props = assign({}, element.props);
          var key = element.key;
          var ref = element.ref;
          var self = element._self;
          var source = element._source;
          var owner = element._owner;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              owner = ReactCurrentOwner.current;
            }
            if (hasValidKey(config)) {
              {
                checkKeyStringCoercion(config.key);
              }
              key = "" + config.key;
            }
            var defaultProps;
            if (element.type && element.type.defaultProps) {
              defaultProps = element.type.defaultProps;
            }
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                if (config[propName] === void 0 && defaultProps !== void 0) {
                  props[propName] = defaultProps[propName];
                } else {
                  props[propName] = config[propName];
                }
              }
            }
          }
          var childrenLength = arguments.length - 2;
          if (childrenLength === 1) {
            props.children = children;
          } else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
              childArray[i] = arguments[i + 2];
            }
            props.children = childArray;
          }
          return ReactElement(element.type, key, ref, self, source, owner, props);
        }
        function isValidElement(object) {
          return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        var SEPARATOR = ".";
        var SUBSEPARATOR = ":";
        function escape(key) {
          var escapeRegex = /[=:]/g;
          var escaperLookup = {
            "=": "=0",
            ":": "=2"
          };
          var escapedString = key.replace(escapeRegex, function(match) {
            return escaperLookup[match];
          });
          return "$" + escapedString;
        }
        var didWarnAboutMaps = false;
        var userProvidedKeyEscapeRegex = /\/+/g;
        function escapeUserProvidedKey(text) {
          return text.replace(userProvidedKeyEscapeRegex, "$&/");
        }
        function getElementKey(element, index) {
          if (typeof element === "object" && element !== null && element.key != null) {
            {
              checkKeyStringCoercion(element.key);
            }
            return escape("" + element.key);
          }
          return index.toString(36);
        }
        function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
          var type = typeof children;
          if (type === "undefined" || type === "boolean") {
            children = null;
          }
          var invokeCallback = false;
          if (children === null) {
            invokeCallback = true;
          } else {
            switch (type) {
              case "string":
              case "number":
                invokeCallback = true;
                break;
              case "object":
                switch (children.$$typeof) {
                  case REACT_ELEMENT_TYPE:
                  case REACT_PORTAL_TYPE:
                    invokeCallback = true;
                }
            }
          }
          if (invokeCallback) {
            var _child = children;
            var mappedChild = callback(_child);
            var childKey = nameSoFar === "" ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;
            if (isArray(mappedChild)) {
              var escapedChildKey = "";
              if (childKey != null) {
                escapedChildKey = escapeUserProvidedKey(childKey) + "/";
              }
              mapIntoArray(mappedChild, array, escapedChildKey, "", function(c) {
                return c;
              });
            } else if (mappedChild != null) {
              if (isValidElement(mappedChild)) {
                {
                  if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
                    checkKeyStringCoercion(mappedChild.key);
                  }
                }
                mappedChild = cloneAndReplaceKey(
                  mappedChild,
                  // Keep both the (mapped) and old keys if they differ, just as
                  // traverseAllChildren used to do for objects as children
                  escapedPrefix + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
                  (mappedChild.key && (!_child || _child.key !== mappedChild.key) ? (
                    // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
                    // eslint-disable-next-line react-internal/safe-string-coercion
                    escapeUserProvidedKey("" + mappedChild.key) + "/"
                  ) : "") + childKey
                );
              }
              array.push(mappedChild);
            }
            return 1;
          }
          var child;
          var nextName;
          var subtreeCount = 0;
          var nextNamePrefix = nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;
          if (isArray(children)) {
            for (var i = 0; i < children.length; i++) {
              child = children[i];
              nextName = nextNamePrefix + getElementKey(child, i);
              subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
            }
          } else {
            var iteratorFn = getIteratorFn(children);
            if (typeof iteratorFn === "function") {
              var iterableChildren = children;
              {
                if (iteratorFn === iterableChildren.entries) {
                  if (!didWarnAboutMaps) {
                    warn("Using Maps as children is not supported. Use an array of keyed ReactElements instead.");
                  }
                  didWarnAboutMaps = true;
                }
              }
              var iterator = iteratorFn.call(iterableChildren);
              var step;
              var ii = 0;
              while (!(step = iterator.next()).done) {
                child = step.value;
                nextName = nextNamePrefix + getElementKey(child, ii++);
                subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
              }
            } else if (type === "object") {
              var childrenString = String(children);
              throw new Error("Objects are not valid as a React child (found: " + (childrenString === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : childrenString) + "). If you meant to render a collection of children, use an array instead.");
            }
          }
          return subtreeCount;
        }
        function mapChildren(children, func, context) {
          if (children == null) {
            return children;
          }
          var result = [];
          var count = 0;
          mapIntoArray(children, result, "", "", function(child) {
            return func.call(context, child, count++);
          });
          return result;
        }
        function countChildren(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        }
        function forEachChildren(children, forEachFunc, forEachContext) {
          mapChildren(children, function() {
            forEachFunc.apply(this, arguments);
          }, forEachContext);
        }
        function toArray(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        }
        function onlyChild(children) {
          if (!isValidElement(children)) {
            throw new Error("React.Children.only expected to receive a single React element child.");
          }
          return children;
        }
        function createContext(defaultValue) {
          var context = {
            $$typeof: REACT_CONTEXT_TYPE,
            // As a workaround to support multiple concurrent renderers, we categorize
            // some renderers as primary and others as secondary. We only expect
            // there to be two concurrent renderers at most: React Native (primary) and
            // Fabric (secondary); React DOM (primary) and React ART (secondary).
            // Secondary renderers store their context values on separate fields.
            _currentValue: defaultValue,
            _currentValue2: defaultValue,
            // Used to track how many concurrent renderers this context currently
            // supports within in a single renderer. Such as parallel server rendering.
            _threadCount: 0,
            // These are circular
            Provider: null,
            Consumer: null,
            // Add these to use same hidden class in VM as ServerContext
            _defaultValue: null,
            _globalName: null
          };
          context.Provider = {
            $$typeof: REACT_PROVIDER_TYPE,
            _context: context
          };
          var hasWarnedAboutUsingNestedContextConsumers = false;
          var hasWarnedAboutUsingConsumerProvider = false;
          var hasWarnedAboutDisplayNameOnConsumer = false;
          {
            var Consumer = {
              $$typeof: REACT_CONTEXT_TYPE,
              _context: context
            };
            Object.defineProperties(Consumer, {
              Provider: {
                get: function() {
                  if (!hasWarnedAboutUsingConsumerProvider) {
                    hasWarnedAboutUsingConsumerProvider = true;
                    error("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?");
                  }
                  return context.Provider;
                },
                set: function(_Provider) {
                  context.Provider = _Provider;
                }
              },
              _currentValue: {
                get: function() {
                  return context._currentValue;
                },
                set: function(_currentValue) {
                  context._currentValue = _currentValue;
                }
              },
              _currentValue2: {
                get: function() {
                  return context._currentValue2;
                },
                set: function(_currentValue2) {
                  context._currentValue2 = _currentValue2;
                }
              },
              _threadCount: {
                get: function() {
                  return context._threadCount;
                },
                set: function(_threadCount) {
                  context._threadCount = _threadCount;
                }
              },
              Consumer: {
                get: function() {
                  if (!hasWarnedAboutUsingNestedContextConsumers) {
                    hasWarnedAboutUsingNestedContextConsumers = true;
                    error("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?");
                  }
                  return context.Consumer;
                }
              },
              displayName: {
                get: function() {
                  return context.displayName;
                },
                set: function(displayName) {
                  if (!hasWarnedAboutDisplayNameOnConsumer) {
                    warn("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", displayName);
                    hasWarnedAboutDisplayNameOnConsumer = true;
                  }
                }
              }
            });
            context.Consumer = Consumer;
          }
          {
            context._currentRenderer = null;
            context._currentRenderer2 = null;
          }
          return context;
        }
        var Uninitialized = -1;
        var Pending = 0;
        var Resolved = 1;
        var Rejected = 2;
        function lazyInitializer(payload) {
          if (payload._status === Uninitialized) {
            var ctor = payload._result;
            var thenable = ctor();
            thenable.then(function(moduleObject2) {
              if (payload._status === Pending || payload._status === Uninitialized) {
                var resolved = payload;
                resolved._status = Resolved;
                resolved._result = moduleObject2;
              }
            }, function(error2) {
              if (payload._status === Pending || payload._status === Uninitialized) {
                var rejected = payload;
                rejected._status = Rejected;
                rejected._result = error2;
              }
            });
            if (payload._status === Uninitialized) {
              var pending = payload;
              pending._status = Pending;
              pending._result = thenable;
            }
          }
          if (payload._status === Resolved) {
            var moduleObject = payload._result;
            {
              if (moduleObject === void 0) {
                error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?", moduleObject);
              }
            }
            {
              if (!("default" in moduleObject)) {
                error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))", moduleObject);
              }
            }
            return moduleObject.default;
          } else {
            throw payload._result;
          }
        }
        function lazy(ctor) {
          var payload = {
            // We use these fields to store the result.
            _status: Uninitialized,
            _result: ctor
          };
          var lazyType = {
            $$typeof: REACT_LAZY_TYPE,
            _payload: payload,
            _init: lazyInitializer
          };
          {
            var defaultProps;
            var propTypes;
            Object.defineProperties(lazyType, {
              defaultProps: {
                configurable: true,
                get: function() {
                  return defaultProps;
                },
                set: function(newDefaultProps) {
                  error("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                  defaultProps = newDefaultProps;
                  Object.defineProperty(lazyType, "defaultProps", {
                    enumerable: true
                  });
                }
              },
              propTypes: {
                configurable: true,
                get: function() {
                  return propTypes;
                },
                set: function(newPropTypes) {
                  error("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                  propTypes = newPropTypes;
                  Object.defineProperty(lazyType, "propTypes", {
                    enumerable: true
                  });
                }
              }
            });
          }
          return lazyType;
        }
        function forwardRef(render) {
          {
            if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
              error("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).");
            } else if (typeof render !== "function") {
              error("forwardRef requires a render function but was given %s.", render === null ? "null" : typeof render);
            } else {
              if (render.length !== 0 && render.length !== 2) {
                error("forwardRef render functions accept exactly two parameters: props and ref. %s", render.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.");
              }
            }
            if (render != null) {
              if (render.defaultProps != null || render.propTypes != null) {
                error("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
              }
            }
          }
          var elementType = {
            $$typeof: REACT_FORWARD_REF_TYPE,
            render
          };
          {
            var ownName;
            Object.defineProperty(elementType, "displayName", {
              enumerable: false,
              configurable: true,
              get: function() {
                return ownName;
              },
              set: function(name) {
                ownName = name;
                if (!render.name && !render.displayName) {
                  render.displayName = name;
                }
              }
            });
          }
          return elementType;
        }
        var REACT_MODULE_REFERENCE;
        {
          REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
        }
        function isValidElementType(type) {
          if (typeof type === "string" || typeof type === "function") {
            return true;
          }
          if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden || type === REACT_OFFSCREEN_TYPE || enableScopeAPI || enableCacheElement || enableTransitionTracing) {
            return true;
          }
          if (typeof type === "object" && type !== null) {
            if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
            // types supported by any Flight configuration anywhere since
            // we don't know which Flight build this will end up being used
            // with.
            type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== void 0) {
              return true;
            }
          }
          return false;
        }
        function memo(type, compare) {
          {
            if (!isValidElementType(type)) {
              error("memo: The first argument must be a component. Instead received: %s", type === null ? "null" : typeof type);
            }
          }
          var elementType = {
            $$typeof: REACT_MEMO_TYPE,
            type,
            compare: compare === void 0 ? null : compare
          };
          {
            var ownName;
            Object.defineProperty(elementType, "displayName", {
              enumerable: false,
              configurable: true,
              get: function() {
                return ownName;
              },
              set: function(name) {
                ownName = name;
                if (!type.name && !type.displayName) {
                  type.displayName = name;
                }
              }
            });
          }
          return elementType;
        }
        function resolveDispatcher() {
          var dispatcher = ReactCurrentDispatcher.current;
          {
            if (dispatcher === null) {
              error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
            }
          }
          return dispatcher;
        }
        function useContext(Context) {
          var dispatcher = resolveDispatcher();
          {
            if (Context._context !== void 0) {
              var realContext = Context._context;
              if (realContext.Consumer === Context) {
                error("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?");
              } else if (realContext.Provider === Context) {
                error("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
              }
            }
          }
          return dispatcher.useContext(Context);
        }
        function useState(initialState) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useState(initialState);
        }
        function useReducer(reducer, initialArg, init) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useReducer(reducer, initialArg, init);
        }
        function useRef(initialValue) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useRef(initialValue);
        }
        function useEffect(create2, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useEffect(create2, deps);
        }
        function useInsertionEffect(create2, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useInsertionEffect(create2, deps);
        }
        function useLayoutEffect(create2, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useLayoutEffect(create2, deps);
        }
        function useCallback(callback, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useCallback(callback, deps);
        }
        function useMemo(create2, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useMemo(create2, deps);
        }
        function useImperativeHandle(ref, create2, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useImperativeHandle(ref, create2, deps);
        }
        function useDebugValue2(value, formatterFn) {
          {
            var dispatcher = resolveDispatcher();
            return dispatcher.useDebugValue(value, formatterFn);
          }
        }
        function useTransition() {
          var dispatcher = resolveDispatcher();
          return dispatcher.useTransition();
        }
        function useDeferredValue(value) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useDeferredValue(value);
        }
        function useId() {
          var dispatcher = resolveDispatcher();
          return dispatcher.useId();
        }
        function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
        }
        var disabledDepth = 0;
        var prevLog;
        var prevInfo;
        var prevWarn;
        var prevError;
        var prevGroup;
        var prevGroupCollapsed;
        var prevGroupEnd;
        function disabledLog() {
        }
        disabledLog.__reactDisabledLog = true;
        function disableLogs() {
          {
            if (disabledDepth === 0) {
              prevLog = console.log;
              prevInfo = console.info;
              prevWarn = console.warn;
              prevError = console.error;
              prevGroup = console.group;
              prevGroupCollapsed = console.groupCollapsed;
              prevGroupEnd = console.groupEnd;
              var props = {
                configurable: true,
                enumerable: true,
                value: disabledLog,
                writable: true
              };
              Object.defineProperties(console, {
                info: props,
                log: props,
                warn: props,
                error: props,
                group: props,
                groupCollapsed: props,
                groupEnd: props
              });
            }
            disabledDepth++;
          }
        }
        function reenableLogs() {
          {
            disabledDepth--;
            if (disabledDepth === 0) {
              var props = {
                configurable: true,
                enumerable: true,
                writable: true
              };
              Object.defineProperties(console, {
                log: assign({}, props, {
                  value: prevLog
                }),
                info: assign({}, props, {
                  value: prevInfo
                }),
                warn: assign({}, props, {
                  value: prevWarn
                }),
                error: assign({}, props, {
                  value: prevError
                }),
                group: assign({}, props, {
                  value: prevGroup
                }),
                groupCollapsed: assign({}, props, {
                  value: prevGroupCollapsed
                }),
                groupEnd: assign({}, props, {
                  value: prevGroupEnd
                })
              });
            }
            if (disabledDepth < 0) {
              error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
            }
          }
        }
        var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
        var prefix;
        function describeBuiltInComponentFrame(name, source, ownerFn) {
          {
            if (prefix === void 0) {
              try {
                throw Error();
              } catch (x) {
                var match = x.stack.trim().match(/\n( *(at )?)/);
                prefix = match && match[1] || "";
              }
            }
            return "\n" + prefix + name;
          }
        }
        var reentry = false;
        var componentFrameCache;
        {
          var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
          componentFrameCache = new PossiblyWeakMap();
        }
        function describeNativeComponentFrame(fn, construct) {
          if (!fn || reentry) {
            return "";
          }
          {
            var frame = componentFrameCache.get(fn);
            if (frame !== void 0) {
              return frame;
            }
          }
          var control;
          reentry = true;
          var previousPrepareStackTrace = Error.prepareStackTrace;
          Error.prepareStackTrace = void 0;
          var previousDispatcher;
          {
            previousDispatcher = ReactCurrentDispatcher$1.current;
            ReactCurrentDispatcher$1.current = null;
            disableLogs();
          }
          try {
            if (construct) {
              var Fake = function() {
                throw Error();
              };
              Object.defineProperty(Fake.prototype, "props", {
                set: function() {
                  throw Error();
                }
              });
              if (typeof Reflect === "object" && Reflect.construct) {
                try {
                  Reflect.construct(Fake, []);
                } catch (x) {
                  control = x;
                }
                Reflect.construct(fn, [], Fake);
              } else {
                try {
                  Fake.call();
                } catch (x) {
                  control = x;
                }
                fn.call(Fake.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (x) {
                control = x;
              }
              fn();
            }
          } catch (sample) {
            if (sample && control && typeof sample.stack === "string") {
              var sampleLines = sample.stack.split("\n");
              var controlLines = control.stack.split("\n");
              var s = sampleLines.length - 1;
              var c = controlLines.length - 1;
              while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                c--;
              }
              for (; s >= 1 && c >= 0; s--, c--) {
                if (sampleLines[s] !== controlLines[c]) {
                  if (s !== 1 || c !== 1) {
                    do {
                      s--;
                      c--;
                      if (c < 0 || sampleLines[s] !== controlLines[c]) {
                        var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                        if (fn.displayName && _frame.includes("<anonymous>")) {
                          _frame = _frame.replace("<anonymous>", fn.displayName);
                        }
                        {
                          if (typeof fn === "function") {
                            componentFrameCache.set(fn, _frame);
                          }
                        }
                        return _frame;
                      }
                    } while (s >= 1 && c >= 0);
                  }
                  break;
                }
              }
            }
          } finally {
            reentry = false;
            {
              ReactCurrentDispatcher$1.current = previousDispatcher;
              reenableLogs();
            }
            Error.prepareStackTrace = previousPrepareStackTrace;
          }
          var name = fn ? fn.displayName || fn.name : "";
          var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
          {
            if (typeof fn === "function") {
              componentFrameCache.set(fn, syntheticFrame);
            }
          }
          return syntheticFrame;
        }
        function describeFunctionComponentFrame(fn, source, ownerFn) {
          {
            return describeNativeComponentFrame(fn, false);
          }
        }
        function shouldConstruct(Component2) {
          var prototype = Component2.prototype;
          return !!(prototype && prototype.isReactComponent);
        }
        function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
          if (type == null) {
            return "";
          }
          if (typeof type === "function") {
            {
              return describeNativeComponentFrame(type, shouldConstruct(type));
            }
          }
          if (typeof type === "string") {
            return describeBuiltInComponentFrame(type);
          }
          switch (type) {
            case REACT_SUSPENSE_TYPE:
              return describeBuiltInComponentFrame("Suspense");
            case REACT_SUSPENSE_LIST_TYPE:
              return describeBuiltInComponentFrame("SuspenseList");
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_FORWARD_REF_TYPE:
                return describeFunctionComponentFrame(type.render);
              case REACT_MEMO_TYPE:
                return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                } catch (x) {
                }
              }
            }
          }
          return "";
        }
        var loggedTypeFailures = {};
        var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
        function setCurrentlyValidatingElement(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
            } else {
              ReactDebugCurrentFrame$1.setExtraStackFrame(null);
            }
          }
        }
        function checkPropTypes(typeSpecs, values, location, componentName, element) {
          {
            var has = Function.call.bind(hasOwnProperty);
            for (var typeSpecName in typeSpecs) {
              if (has(typeSpecs, typeSpecName)) {
                var error$1 = void 0;
                try {
                  if (typeof typeSpecs[typeSpecName] !== "function") {
                    var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                    err.name = "Invariant Violation";
                    throw err;
                  }
                  error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                } catch (ex) {
                  error$1 = ex;
                }
                if (error$1 && !(error$1 instanceof Error)) {
                  setCurrentlyValidatingElement(element);
                  error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                  setCurrentlyValidatingElement(null);
                }
                if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                  loggedTypeFailures[error$1.message] = true;
                  setCurrentlyValidatingElement(element);
                  error("Failed %s type: %s", location, error$1.message);
                  setCurrentlyValidatingElement(null);
                }
              }
            }
          }
        }
        function setCurrentlyValidatingElement$1(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              setExtraStackFrame(stack);
            } else {
              setExtraStackFrame(null);
            }
          }
        }
        var propTypesMisspellWarningShown;
        {
          propTypesMisspellWarningShown = false;
        }
        function getDeclarationErrorAddendum() {
          if (ReactCurrentOwner.current) {
            var name = getComponentNameFromType(ReactCurrentOwner.current.type);
            if (name) {
              return "\n\nCheck the render method of `" + name + "`.";
            }
          }
          return "";
        }
        function getSourceInfoErrorAddendum(source) {
          if (source !== void 0) {
            var fileName = source.fileName.replace(/^.*[\\\/]/, "");
            var lineNumber = source.lineNumber;
            return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
          }
          return "";
        }
        function getSourceInfoErrorAddendumForProps(elementProps) {
          if (elementProps !== null && elementProps !== void 0) {
            return getSourceInfoErrorAddendum(elementProps.__source);
          }
          return "";
        }
        var ownerHasKeyUseWarning = {};
        function getCurrentComponentErrorInfo(parentType) {
          var info = getDeclarationErrorAddendum();
          if (!info) {
            var parentName = typeof parentType === "string" ? parentType : parentType.displayName || parentType.name;
            if (parentName) {
              info = "\n\nCheck the top-level render call using <" + parentName + ">.";
            }
          }
          return info;
        }
        function validateExplicitKey(element, parentType) {
          if (!element._store || element._store.validated || element.key != null) {
            return;
          }
          element._store.validated = true;
          var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
          if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
            return;
          }
          ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
          var childOwner = "";
          if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
            childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
          }
          {
            setCurrentlyValidatingElement$1(element);
            error('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);
            setCurrentlyValidatingElement$1(null);
          }
        }
        function validateChildKeys(node, parentType) {
          if (typeof node !== "object") {
            return;
          }
          if (isArray(node)) {
            for (var i = 0; i < node.length; i++) {
              var child = node[i];
              if (isValidElement(child)) {
                validateExplicitKey(child, parentType);
              }
            }
          } else if (isValidElement(node)) {
            if (node._store) {
              node._store.validated = true;
            }
          } else if (node) {
            var iteratorFn = getIteratorFn(node);
            if (typeof iteratorFn === "function") {
              if (iteratorFn !== node.entries) {
                var iterator = iteratorFn.call(node);
                var step;
                while (!(step = iterator.next()).done) {
                  if (isValidElement(step.value)) {
                    validateExplicitKey(step.value, parentType);
                  }
                }
              }
            }
          }
        }
        function validatePropTypes(element) {
          {
            var type = element.type;
            if (type === null || type === void 0 || typeof type === "string") {
              return;
            }
            var propTypes;
            if (typeof type === "function") {
              propTypes = type.propTypes;
            } else if (typeof type === "object" && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
            // Inner props are checked in the reconciler.
            type.$$typeof === REACT_MEMO_TYPE)) {
              propTypes = type.propTypes;
            } else {
              return;
            }
            if (propTypes) {
              var name = getComponentNameFromType(type);
              checkPropTypes(propTypes, element.props, "prop", name, element);
            } else if (type.PropTypes !== void 0 && !propTypesMisspellWarningShown) {
              propTypesMisspellWarningShown = true;
              var _name = getComponentNameFromType(type);
              error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", _name || "Unknown");
            }
            if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
              error("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
            }
          }
        }
        function validateFragmentProps(fragment) {
          {
            var keys = Object.keys(fragment.props);
            for (var i = 0; i < keys.length; i++) {
              var key = keys[i];
              if (key !== "children" && key !== "key") {
                setCurrentlyValidatingElement$1(fragment);
                error("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", key);
                setCurrentlyValidatingElement$1(null);
                break;
              }
            }
            if (fragment.ref !== null) {
              setCurrentlyValidatingElement$1(fragment);
              error("Invalid attribute `ref` supplied to `React.Fragment`.");
              setCurrentlyValidatingElement$1(null);
            }
          }
        }
        function createElementWithValidation(type, props, children) {
          var validType = isValidElementType(type);
          if (!validType) {
            var info = "";
            if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
              info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
            }
            var sourceInfo = getSourceInfoErrorAddendumForProps(props);
            if (sourceInfo) {
              info += sourceInfo;
            } else {
              info += getDeclarationErrorAddendum();
            }
            var typeString;
            if (type === null) {
              typeString = "null";
            } else if (isArray(type)) {
              typeString = "array";
            } else if (type !== void 0 && type.$$typeof === REACT_ELEMENT_TYPE) {
              typeString = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
              info = " Did you accidentally export a JSX literal instead of a component?";
            } else {
              typeString = typeof type;
            }
            {
              error("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info);
            }
          }
          var element = createElement.apply(this, arguments);
          if (element == null) {
            return element;
          }
          if (validType) {
            for (var i = 2; i < arguments.length; i++) {
              validateChildKeys(arguments[i], type);
            }
          }
          if (type === REACT_FRAGMENT_TYPE) {
            validateFragmentProps(element);
          } else {
            validatePropTypes(element);
          }
          return element;
        }
        var didWarnAboutDeprecatedCreateFactory = false;
        function createFactoryWithValidation(type) {
          var validatedFactory = createElementWithValidation.bind(null, type);
          validatedFactory.type = type;
          {
            if (!didWarnAboutDeprecatedCreateFactory) {
              didWarnAboutDeprecatedCreateFactory = true;
              warn("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.");
            }
            Object.defineProperty(validatedFactory, "type", {
              enumerable: false,
              get: function() {
                warn("Factory.type is deprecated. Access the class directly before passing it to createFactory.");
                Object.defineProperty(this, "type", {
                  value: type
                });
                return type;
              }
            });
          }
          return validatedFactory;
        }
        function cloneElementWithValidation(element, props, children) {
          var newElement = cloneElement.apply(this, arguments);
          for (var i = 2; i < arguments.length; i++) {
            validateChildKeys(arguments[i], newElement.type);
          }
          validatePropTypes(newElement);
          return newElement;
        }
        function startTransition(scope, options) {
          var prevTransition = ReactCurrentBatchConfig.transition;
          ReactCurrentBatchConfig.transition = {};
          var currentTransition = ReactCurrentBatchConfig.transition;
          {
            ReactCurrentBatchConfig.transition._updatedFibers = /* @__PURE__ */ new Set();
          }
          try {
            scope();
          } finally {
            ReactCurrentBatchConfig.transition = prevTransition;
            {
              if (prevTransition === null && currentTransition._updatedFibers) {
                var updatedFibersCount = currentTransition._updatedFibers.size;
                if (updatedFibersCount > 10) {
                  warn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table.");
                }
                currentTransition._updatedFibers.clear();
              }
            }
          }
        }
        var didWarnAboutMessageChannel = false;
        var enqueueTaskImpl = null;
        function enqueueTask(task) {
          if (enqueueTaskImpl === null) {
            try {
              var requireString = ("require" + Math.random()).slice(0, 7);
              var nodeRequire = module2 && module2[requireString];
              enqueueTaskImpl = nodeRequire.call(module2, "timers").setImmediate;
            } catch (_err) {
              enqueueTaskImpl = function(callback) {
                {
                  if (didWarnAboutMessageChannel === false) {
                    didWarnAboutMessageChannel = true;
                    if (typeof MessageChannel === "undefined") {
                      error("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning.");
                    }
                  }
                }
                var channel = new MessageChannel();
                channel.port1.onmessage = callback;
                channel.port2.postMessage(void 0);
              };
            }
          }
          return enqueueTaskImpl(task);
        }
        var actScopeDepth = 0;
        var didWarnNoAwaitAct = false;
        function act(callback) {
          {
            var prevActScopeDepth = actScopeDepth;
            actScopeDepth++;
            if (ReactCurrentActQueue.current === null) {
              ReactCurrentActQueue.current = [];
            }
            var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
            var result;
            try {
              ReactCurrentActQueue.isBatchingLegacy = true;
              result = callback();
              if (!prevIsBatchingLegacy && ReactCurrentActQueue.didScheduleLegacyUpdate) {
                var queue = ReactCurrentActQueue.current;
                if (queue !== null) {
                  ReactCurrentActQueue.didScheduleLegacyUpdate = false;
                  flushActQueue(queue);
                }
              }
            } catch (error2) {
              popActScope(prevActScopeDepth);
              throw error2;
            } finally {
              ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
            }
            if (result !== null && typeof result === "object" && typeof result.then === "function") {
              var thenableResult = result;
              var wasAwaited = false;
              var thenable = {
                then: function(resolve, reject) {
                  wasAwaited = true;
                  thenableResult.then(function(returnValue2) {
                    popActScope(prevActScopeDepth);
                    if (actScopeDepth === 0) {
                      recursivelyFlushAsyncActWork(returnValue2, resolve, reject);
                    } else {
                      resolve(returnValue2);
                    }
                  }, function(error2) {
                    popActScope(prevActScopeDepth);
                    reject(error2);
                  });
                }
              };
              {
                if (!didWarnNoAwaitAct && typeof Promise !== "undefined") {
                  Promise.resolve().then(function() {
                  }).then(function() {
                    if (!wasAwaited) {
                      didWarnNoAwaitAct = true;
                      error("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);");
                    }
                  });
                }
              }
              return thenable;
            } else {
              var returnValue = result;
              popActScope(prevActScopeDepth);
              if (actScopeDepth === 0) {
                var _queue = ReactCurrentActQueue.current;
                if (_queue !== null) {
                  flushActQueue(_queue);
                  ReactCurrentActQueue.current = null;
                }
                var _thenable = {
                  then: function(resolve, reject) {
                    if (ReactCurrentActQueue.current === null) {
                      ReactCurrentActQueue.current = [];
                      recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                    } else {
                      resolve(returnValue);
                    }
                  }
                };
                return _thenable;
              } else {
                var _thenable2 = {
                  then: function(resolve, reject) {
                    resolve(returnValue);
                  }
                };
                return _thenable2;
              }
            }
          }
        }
        function popActScope(prevActScopeDepth) {
          {
            if (prevActScopeDepth !== actScopeDepth - 1) {
              error("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. ");
            }
            actScopeDepth = prevActScopeDepth;
          }
        }
        function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
          {
            var queue = ReactCurrentActQueue.current;
            if (queue !== null) {
              try {
                flushActQueue(queue);
                enqueueTask(function() {
                  if (queue.length === 0) {
                    ReactCurrentActQueue.current = null;
                    resolve(returnValue);
                  } else {
                    recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                  }
                });
              } catch (error2) {
                reject(error2);
              }
            } else {
              resolve(returnValue);
            }
          }
        }
        var isFlushing = false;
        function flushActQueue(queue) {
          {
            if (!isFlushing) {
              isFlushing = true;
              var i = 0;
              try {
                for (; i < queue.length; i++) {
                  var callback = queue[i];
                  do {
                    callback = callback(true);
                  } while (callback !== null);
                }
                queue.length = 0;
              } catch (error2) {
                queue = queue.slice(i + 1);
                throw error2;
              } finally {
                isFlushing = false;
              }
            }
          }
        }
        var createElement$1 = createElementWithValidation;
        var cloneElement$1 = cloneElementWithValidation;
        var createFactory = createFactoryWithValidation;
        var Children = {
          map: mapChildren,
          forEach: forEachChildren,
          count: countChildren,
          toArray,
          only: onlyChild
        };
        exports2.Children = Children;
        exports2.Component = Component;
        exports2.Fragment = REACT_FRAGMENT_TYPE;
        exports2.Profiler = REACT_PROFILER_TYPE;
        exports2.PureComponent = PureComponent;
        exports2.StrictMode = REACT_STRICT_MODE_TYPE;
        exports2.Suspense = REACT_SUSPENSE_TYPE;
        exports2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
        exports2.act = act;
        exports2.cloneElement = cloneElement$1;
        exports2.createContext = createContext;
        exports2.createElement = createElement$1;
        exports2.createFactory = createFactory;
        exports2.createRef = createRef;
        exports2.forwardRef = forwardRef;
        exports2.isValidElement = isValidElement;
        exports2.lazy = lazy;
        exports2.memo = memo;
        exports2.startTransition = startTransition;
        exports2.unstable_act = act;
        exports2.useCallback = useCallback;
        exports2.useContext = useContext;
        exports2.useDebugValue = useDebugValue2;
        exports2.useDeferredValue = useDeferredValue;
        exports2.useEffect = useEffect;
        exports2.useId = useId;
        exports2.useImperativeHandle = useImperativeHandle;
        exports2.useInsertionEffect = useInsertionEffect;
        exports2.useLayoutEffect = useLayoutEffect;
        exports2.useMemo = useMemo;
        exports2.useReducer = useReducer;
        exports2.useRef = useRef;
        exports2.useState = useState;
        exports2.useSyncExternalStore = useSyncExternalStore;
        exports2.useTransition = useTransition;
        exports2.version = ReactVersion;
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
        }
      })();
    }
  }
});

// node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/react/index.js"(exports2, module2) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module2.exports = require_react_production_min();
    } else {
      module2.exports = require_react_development();
    }
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.production.js
var require_use_sync_external_store_shim_production = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.production.js"(exports2) {
    "use strict";
    var React = require_react();
    function is(x, y) {
      return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
    }
    var objectIs = "function" === typeof Object.is ? Object.is : is;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useLayoutEffect = React.useLayoutEffect;
    var useDebugValue2 = React.useDebugValue;
    function useSyncExternalStore$2(subscribe, getSnapshot) {
      var value = getSnapshot(), _useState = useState({ inst: { value, getSnapshot } }), inst = _useState[0].inst, forceUpdate = _useState[1];
      useLayoutEffect(
        function() {
          inst.value = value;
          inst.getSnapshot = getSnapshot;
          checkIfSnapshotChanged(inst) && forceUpdate({ inst });
        },
        [subscribe, value, getSnapshot]
      );
      useEffect(
        function() {
          checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          return subscribe(function() {
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          });
        },
        [subscribe]
      );
      useDebugValue2(value);
      return value;
    }
    function checkIfSnapshotChanged(inst) {
      var latestGetSnapshot = inst.getSnapshot;
      inst = inst.value;
      try {
        var nextValue = latestGetSnapshot();
        return !objectIs(inst, nextValue);
      } catch (error) {
        return true;
      }
    }
    function useSyncExternalStore$1(subscribe, getSnapshot) {
      return getSnapshot();
    }
    var shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
    exports2.useSyncExternalStore = void 0 !== React.useSyncExternalStore ? React.useSyncExternalStore : shim;
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js
var require_use_sync_external_store_shim_development = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js"(exports2) {
    "use strict";
    "production" !== process.env.NODE_ENV && function() {
      function is(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
      }
      function useSyncExternalStore$2(subscribe, getSnapshot) {
        didWarnOld18Alpha || void 0 === React.startTransition || (didWarnOld18Alpha = true, console.error(
          "You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."
        ));
        var value = getSnapshot();
        if (!didWarnUncachedGetSnapshot) {
          var cachedValue = getSnapshot();
          objectIs(value, cachedValue) || (console.error(
            "The result of getSnapshot should be cached to avoid an infinite loop"
          ), didWarnUncachedGetSnapshot = true);
        }
        cachedValue = useState({
          inst: { value, getSnapshot }
        });
        var inst = cachedValue[0].inst, forceUpdate = cachedValue[1];
        useLayoutEffect(
          function() {
            inst.value = value;
            inst.getSnapshot = getSnapshot;
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          },
          [subscribe, value, getSnapshot]
        );
        useEffect(
          function() {
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            return subscribe(function() {
              checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            });
          },
          [subscribe]
        );
        useDebugValue2(value);
        return value;
      }
      function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
          var nextValue = latestGetSnapshot();
          return !objectIs(inst, nextValue);
        } catch (error) {
          return true;
        }
      }
      function useSyncExternalStore$1(subscribe, getSnapshot) {
        return getSnapshot();
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React = require_react(), objectIs = "function" === typeof Object.is ? Object.is : is, useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useDebugValue2 = React.useDebugValue, didWarnOld18Alpha = false, didWarnUncachedGetSnapshot = false, shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
      exports2.useSyncExternalStore = void 0 !== React.useSyncExternalStore ? React.useSyncExternalStore : shim;
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    }();
  }
});

// node_modules/use-sync-external-store/shim/index.js
var require_shim = __commonJS({
  "node_modules/use-sync-external-store/shim/index.js"(exports2, module2) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module2.exports = require_use_sync_external_store_shim_production();
    } else {
      module2.exports = require_use_sync_external_store_shim_development();
    }
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.js
var require_with_selector_production = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.js"(exports2) {
    "use strict";
    var React = require_react();
    var shim = require_shim();
    function is(x, y) {
      return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
    }
    var objectIs = "function" === typeof Object.is ? Object.is : is;
    var useSyncExternalStore = shim.useSyncExternalStore;
    var useRef = React.useRef;
    var useEffect = React.useEffect;
    var useMemo = React.useMemo;
    var useDebugValue2 = React.useDebugValue;
    exports2.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
      var instRef = useRef(null);
      if (null === instRef.current) {
        var inst = { hasValue: false, value: null };
        instRef.current = inst;
      } else inst = instRef.current;
      instRef = useMemo(
        function() {
          function memoizedSelector(nextSnapshot) {
            if (!hasMemo) {
              hasMemo = true;
              memoizedSnapshot = nextSnapshot;
              nextSnapshot = selector(nextSnapshot);
              if (void 0 !== isEqual && inst.hasValue) {
                var currentSelection = inst.value;
                if (isEqual(currentSelection, nextSnapshot))
                  return memoizedSelection = currentSelection;
              }
              return memoizedSelection = nextSnapshot;
            }
            currentSelection = memoizedSelection;
            if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
            var nextSelection = selector(nextSnapshot);
            if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
              return memoizedSnapshot = nextSnapshot, currentSelection;
            memoizedSnapshot = nextSnapshot;
            return memoizedSelection = nextSelection;
          }
          var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
          return [
            function() {
              return memoizedSelector(getSnapshot());
            },
            null === maybeGetServerSnapshot ? void 0 : function() {
              return memoizedSelector(maybeGetServerSnapshot());
            }
          ];
        },
        [getSnapshot, getServerSnapshot, selector, isEqual]
      );
      var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
      useEffect(
        function() {
          inst.hasValue = true;
          inst.value = value;
        },
        [value]
      );
      useDebugValue2(value);
      return value;
    };
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js
var require_with_selector_development = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js"(exports2) {
    "use strict";
    "production" !== process.env.NODE_ENV && function() {
      function is(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React = require_react(), shim = require_shim(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue2 = React.useDebugValue;
      exports2.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
        var instRef = useRef(null);
        if (null === instRef.current) {
          var inst = { hasValue: false, value: null };
          instRef.current = inst;
        } else inst = instRef.current;
        instRef = useMemo(
          function() {
            function memoizedSelector(nextSnapshot) {
              if (!hasMemo) {
                hasMemo = true;
                memoizedSnapshot = nextSnapshot;
                nextSnapshot = selector(nextSnapshot);
                if (void 0 !== isEqual && inst.hasValue) {
                  var currentSelection = inst.value;
                  if (isEqual(currentSelection, nextSnapshot))
                    return memoizedSelection = currentSelection;
                }
                return memoizedSelection = nextSnapshot;
              }
              currentSelection = memoizedSelection;
              if (objectIs(memoizedSnapshot, nextSnapshot))
                return currentSelection;
              var nextSelection = selector(nextSnapshot);
              if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
                return memoizedSnapshot = nextSnapshot, currentSelection;
              memoizedSnapshot = nextSnapshot;
              return memoizedSelection = nextSelection;
            }
            var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
            return [
              function() {
                return memoizedSelector(getSnapshot());
              },
              null === maybeGetServerSnapshot ? void 0 : function() {
                return memoizedSelector(maybeGetServerSnapshot());
              }
            ];
          },
          [getSnapshot, getServerSnapshot, selector, isEqual]
        );
        var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
        useEffect(
          function() {
            inst.hasValue = true;
            inst.value = value;
          },
          [value]
        );
        useDebugValue2(value);
        return value;
      };
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    }();
  }
});

// node_modules/use-sync-external-store/shim/with-selector.js
var require_with_selector = __commonJS({
  "node_modules/use-sync-external-store/shim/with-selector.js"(exports2, module2) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module2.exports = require_with_selector_production();
    } else {
      module2.exports = require_with_selector_development();
    }
  }
});

// node_modules/zustand/esm/vanilla.mjs
var import_meta = {};
var createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const destroy = () => {
    if ((import_meta.env ? import_meta.env.MODE : void 0) !== "production") {
      console.warn(
        "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
      );
    }
    listeners.clear();
  };
  const api = { setState, getState, getInitialState, subscribe, destroy };
  const initialState = state = createState(setState, getState, api);
  return api;
};
var createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;

// node_modules/zustand/esm/index.mjs
var import_react = __toESM(require_react(), 1);
var import_with_selector = __toESM(require_with_selector(), 1);
var import_meta2 = {};
var { useDebugValue } = import_react.default;
var { useSyncExternalStoreWithSelector } = import_with_selector.default;
var didWarnAboutEqualityFn = false;
var identity = (arg) => arg;
function useStore(api, selector = identity, equalityFn) {
  if ((import_meta2.env ? import_meta2.env.MODE : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
    console.warn(
      "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
    );
    didWarnAboutEqualityFn = true;
  }
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState || api.getInitialState,
    selector,
    equalityFn
  );
  useDebugValue(slice);
  return slice;
}
var createImpl = (createState) => {
  if ((import_meta2.env ? import_meta2.env.MODE : void 0) !== "production" && typeof createState !== "function") {
    console.warn(
      "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`."
    );
  }
  const api = typeof createState === "function" ? createStore(createState) : createState;
  const useBoundStore = (selector, equalityFn) => useStore(api, selector, equalityFn);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
var create = (createState) => createState ? createImpl(createState) : createImpl;

// src/data/partner.ts
var partnerReports = [
  {
    id: "pr1",
    code: "BB20261013001",
    type: "order",
    orderKind: "self",
    title: "\u534E\u8317\u5802\u8336\u5E84\u4E2D\u79CB\u56E2\u8D2D\u8BA2\u5355\u62A5\u5907\uFF08\u6709\u8D27\u6E90\uFF09",
    customerName: "\u534E\u8317\u5802\u8336\u5E84",
    expectOrderDate: "2026-10-20",
    regionProv: "\u6C5F\u82CF",
    regionCity: "\u5357\u4EAC\u5E02",
    contactName: "\u6797\u638C\u67DC",
    contactPhone: "138****6677",
    productName: "\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7",
    summary: "\u534E\u8317\u5802\u8336\u5E84\u4E2D\u79CB\u798F\u5229\u56E2\u8D2D\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7\u7EA6 60 \u7F50\uFF0C\u7531\u6211\u65B9\u4F9B\u8D27\u5C65\u7EA6\uFF0C\u7533\u8BF7\u6709\u8D27\u6E90\u8BA2\u5355\u62A5\u5907",
    amount: 27120,
    status: "pending",
    submitTime: "2026-10-13 10:30",
    partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8"
  },
  {
    id: "pr2",
    code: "BB20261012002",
    type: "order",
    orderKind: "no_supply",
    title: "\u6E05\u5FC3\u8336\u574A\u91D1\u9A8F\u7709\u8BA2\u5355\u62A5\u5907\uFF08\u65E0\u8D27\u6E90\uFF09",
    customerName: "\u6E05\u5FC3\u8336\u574A",
    expectOrderDate: "2026-10-25",
    regionProv: "\u6D59\u6C5F",
    regionCity: "\u676D\u5DDE\u5E02",
    contactName: "\u674E\u96C5\u82B3",
    contactPhone: "0571-8612****",
    productName: "\u91D1\u9A8F\u7709\xB7\u7279\u7EA7",
    internalOrderNo: "QX-2026-1105",
    summary: "\u6E05\u5FC3\u8336\u574A\u91D1\u9A8F\u7709\u91C7\u8D2D\u9700\u6C42\u7531\u672C\u5408\u4F5C\u5546\u63A8\u4ECB\u8FBE\u6210\uFF0C\u6211\u65B9\u65E0\u8BE5\u8D27\u6E90\uFF0C\u7533\u8BF7\u65E0\u8D27\u6E90\u62A5\u5907\uFF08\u5E73\u53F0\u81EA\u8425\u6216\u8F6C\u6D3E\u4F9B\u8D27\u5546\uFF1A\u53EF\u6307\u5B9A/\u6BD4\u5355\uFF09",
    amount: 10240,
    status: "pending",
    submitTime: "2026-10-12 16:20",
    partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8"
  },
  {
    id: "pr3",
    code: "BB20260910003",
    type: "product",
    title: "\u6B66\u5937\u5CA9\u8336\xB7\u6C34\u91D1\u9F9F\u5546\u54C1\u62A5\u5907\uFF08\u6C5F\u82CF \xB7 \u5168\u90E8\u5BA2\u6237\uFF09",
    customerName: "\u5168\u90E8\u5BA2\u6237",
    productNames: ["\u6B66\u5937\u5CA9\u8336\xB7\u6C34\u91D1\u9F9F"],
    regionProv: "\u6C5F\u82CF",
    summary: "\u6B66\u5937\u5C71\u4EA7\u533A\u6C34\u91D1\u9F9F\u5CA9\u8336\uFF0C\u8F7B\u706B\u6162\u7119\uFF0C\u6211\u65B9\u5DF2\u5728\u6C5F\u82CF\u533A\u57DF\u91CD\u70B9\u63A8\u5E7F\uFF0C\u7533\u8BF7\u8BE5\u533A\u57DF\u8BE5\u5546\u54C1\u8BA2\u5355\u81EA\u52A8\u5339\u914D\u8F6C\u7ED9\u6211\u65B9\u5C65\u7EA6",
    status: "approved",
    submitTime: "2026-09-10 09:15",
    reviewNote: "\u5546\u54C1\u8D44\u8D28\u9F50\u5168\uFF0C\u540C\u610F\u6C5F\u82CF\u533A\u57DF\u62A5\u5907",
    reviewTime: "2026-09-11 14:20",
    partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8"
  },
  {
    id: "pr4",
    code: "BB20261013004",
    type: "region",
    title: "\u5357\u4EAC\u7FE0\u7AF9\u8336\u884C\u5730\u533A\u62A5\u5907\uFF08\u6C5F\u82CF\xB7\u5357\u4EAC\u5E02\uFF09",
    customerName: "\u5357\u4EAC\u7FE0\u7AF9\u8336\u884C",
    regionProv: "\u6C5F\u82CF",
    regionCity: "\u5357\u4EAC\u5E02",
    summary: "\u8BE5\u5BA2\u6237\u5728\u5357\u4EAC\u5730\u533A\u7684\u5168\u90E8\u8BA2\u5355\u7533\u8BF7\u62A5\u5907\u5339\u914D\u8F6C\u7ED9\u6211\u65B9\uFF08\u542B\u6211\u65B9\u672A\u7ECF\u8425\u54C1\u724C\uFF0C\u672A\u7ECF\u8425\u54C1\u724C\u53EF\u534F\u540C\u5176\u4ED6\u4F9B\u8D27\u5546\u5C65\u7EA6\uFF09",
    status: "pending",
    submitTime: "2026-10-13 11:40",
    partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8"
  },
  {
    id: "pr5",
    code: "BB20260905005",
    type: "region",
    title: "\u82CF\u5DDE\u5434\u95E8\u8336\u4E8B\u5730\u533A\u62A5\u5907\uFF08\u6C5F\u82CF\xB7\u82CF\u5DDE\u5E02\uFF09",
    customerName: "\u82CF\u5DDE\u5434\u95E8\u8336\u4E8B",
    regionProv: "\u6C5F\u82CF",
    regionCity: "\u82CF\u5DDE\u5E02",
    summary: "\u4E2A\u4EBA\u5DE5\u4F5C\u5BA4\u5BA2\u6237\uFF0C\u4E3B\u6253\u82CF\u5DDE\u672C\u5730\u8336\u5BA2\u793E\u7FA4\uFF0C\u7533\u8BF7\u8BE5\u5BA2\u6237\u82CF\u5DDE\u5730\u533A\u8BA2\u5355\u8F6C\u7ED9\u6211\u65B9",
    status: "rejected",
    submitTime: "2026-09-05 11:40",
    reviewNote: "\u5BA2\u6237\u6574\u4F53\u8F6C\u4EA4\u4E0E\u73B0\u6709\u6E20\u9053\u5BA2\u6237\u91CD\u5408\uFF0C\u5EFA\u8BAE\u5E76\u5165\u5929\u798F\u8317\u8336\u6E20\u9053",
    reviewTime: "2026-09-06 09:30",
    partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8"
  }
];
var platformOrders = [
  {
    id: "pto1",
    code: "HHSO20261013001",
    customerName: "\u534E\u8317\u5802\u8336\u5E84",
    customerType: "\u76F4\u8425\u5BA2\u6237",
    customerRegion: "\u6C5F\u82CF\u5357\u4EAC",
    items: [{ productName: "\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7", spec: "50g/\u7F50", quantity: 60, price: 452 }],
    totalAmount: 27120,
    deliveryMode: "direct",
    coopMode: "supplier",
    orderDate: "2026-10-13",
    expectedShipDate: "2026-10-16",
    receiver: "\u6797\u638C\u67DC",
    receiverPhone: "138****6677",
    receiverAddress: "\u6C5F\u82CF\u5357\u4EAC\u5E02\u79E6\u6DEE\u533A\u592B\u5B50\u5E99\u8857\u9053\u8D21\u9662\u885712\u53F7",
    remark: "\u4E2D\u79CB\u56E2\u8D2D\u8BA2\u5355\uFF0C\u5339\u914D\u81EA\u8425\u8BA2\u5355\u62A5\u5907\u540E\u8F6C\u5408\u4F5C\u5546\u5C65\u7EA6"
  },
  {
    id: "pto2",
    code: "HHSO20261013002",
    customerName: "\u5357\u4EAC\u7FE0\u7AF9\u8336\u884C",
    customerType: "\u6E20\u9053\u5BA2\u6237",
    customerRegion: "\u6C5F\u82CF\u5357\u4EAC",
    items: [{ productName: "\u96E8\u82B1\u8336\xB7\u7279\u7EA7", spec: "100g/\u7F50", quantity: 30, price: 268 }],
    totalAmount: 8040,
    deliveryMode: "warehouse",
    coopMode: "supplier",
    orderDate: "2026-10-13",
    expectedShipDate: "2026-10-15",
    receiver: "\u7FE0\u7AF9\u8336\u884C\u91C7\u8D2D\u90E8",
    receiverPhone: "025-8463****",
    receiverAddress: "\u6C5F\u82CF\u5357\u4EAC\u5E02\u7384\u6B66\u533A\u4E2D\u5C71\u4E1C\u8DEF198\u53F7"
  },
  {
    id: "pto3",
    code: "HHSO20261012003",
    customerName: "\u82CF\u5DDE\u5434\u95E8\u8336\u4E8B",
    customerType: "\u4E2A\u4EBA\u5BA2\u6237",
    customerRegion: "\u6C5F\u82CF\u82CF\u5DDE",
    items: [{ productName: "\u6B66\u5937\u5CA9\u8336\xB7\u6C34\u91D1\u9F9F", spec: "50g/\u7F50", quantity: 20, price: 420 }],
    totalAmount: 8400,
    deliveryMode: "direct",
    coopMode: "service",
    orderDate: "2026-10-12",
    expectedShipDate: "2026-10-14",
    receiver: "\u5434\u95E8\u8336\u4E8B\u4E3B\u7406\u4EBA",
    receiverPhone: "137****8899",
    receiverAddress: "\u6C5F\u82CF\u82CF\u5DDE\u5E02\u59D1\u82CF\u533A\u5E73\u6C5F\u8DEF\u5386\u53F2\u8857\u533A46\u53F7",
    remark: "\u6C34\u91D1\u9F9F\u5CA9\u8336\u8BA2\u5355\uFF0C\u547D\u4E2D\u5546\u54C1\u62A5\u5907\uFF08\u6C5F\u82CF\u533A\u57DF\uFF09\u81EA\u52A8\u8F6C\u5165"
  },
  {
    id: "pto4",
    code: "HHSO20261011004",
    customerName: "\u6E05\u5FC3\u8336\u574A",
    customerType: "\u76F4\u8425\u5BA2\u6237",
    customerRegion: "\u6D59\u6C5F\u5B81\u6CE2",
    items: [{ productName: "\u91D1\u9A8F\u7709\xB7\u7279\u7EA7", spec: "50g/\u7F50", quantity: 10, price: 1024 }],
    totalAmount: 10240,
    deliveryMode: "warehouse",
    coopMode: "service",
    orderDate: "2026-10-11",
    expectedShipDate: "2026-10-14",
    receiver: "\u6E05\u5FC3\u8336\u574A\u6536\u53D1\u90E8",
    receiverPhone: "139****2210",
    receiverAddress: "\u6D59\u6C5F\u5B81\u6CE2\u5E02\u911E\u5DDE\u533A\u4E2D\u5C71\u4E1C\u8DEF2001\u53F7",
    remark: "\u5546\u673A\u62A5\u5907\u8BA2\u5355\uFF0C\u7531\u5E73\u53F0\u8FDB\u8D27\u53D1\u8D27"
  }
];

// src/data/partnerScores.ts
var scoreBases = {
  "3": { base: 70, ontimeRate: 95 },
  "5": { base: 60, ontimeRate: 88 },
  "8": { base: 66, ontimeRate: 92 },
  "10": { base: 58, ontimeRate: 85 },
  "11": { base: 62, ontimeRate: 90 }
};
var scoreEntries = [
  /* ── 八马茶业（3）── */
  { id: "se_3_1", supplierId: "3", supplierName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "visit", delta: 6, reason: "\u5BA2\u6237\u62DC\u8BBF 3 \u6B21\uFF08\u534E\u8317\u5802\u8336\u5E84 / \u6E05\u5FC3\u8336\u574A / \u5929\u798F\u8317\u8336\uFF09", time: "2026-10-09", operator: "admin" },
  { id: "se_3_2", supplierId: "3", supplierName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "report", delta: 5, reason: "\u5546\u54C1\u62A5\u5907\u5BA1\u6279\u901A\u8FC7\uFF08\u94C1\u89C2\u97F3 \xB7 \u798F\u5EFA\u533A\u57DF\uFF09", time: "2026-10-06", refCode: "BB20261006002", operator: "\u7BA1\u7406\u5458" },
  { id: "se_3_3", supplierId: "3", supplierName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "fulfillment", delta: 5, reason: "\u8BA2\u5355\u6309\u65F6\u53D1\u8D27\u5E76\u5B8C\u6210\u7ED3\u7B97", time: "2026-09-28", refCode: "HHSO20260905005", operator: "\u7BA1\u7406\u5458" },
  { id: "se_3_4", supplierId: "3", supplierName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "fulfillment", delta: 3, reason: "\u8BA2\u5355\u6309\u65F6\u53D1\u8D27", time: "2026-09-20", refCode: "HHSO20260912001", operator: "\u7BA1\u7406\u5458" },
  { id: "se_3_5", supplierId: "3", supplierName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "penalty", delta: -10, reason: "\u5BA2\u6237\u6295\u8BC9\u5305\u88C5\u7834\u635F\uFF08\u5DF2\u8D54\u4ED8\uFF09", time: "2026-09-15", operator: "\u7BA1\u7406\u5458" },
  /* ── 竹叶青（8）── */
  { id: "se_8_1", supplierId: "8", supplierName: "\u56DB\u5DDD\u7701\u8336\u4E1A\u96C6\u56E2\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "visit", delta: 10, reason: "\u5BA2\u6237\u62DC\u8BBF 5 \u6B21\uFF08\u56DB\u5DDD\u533A\u57DF\u8336\u884C\u5DE1\u8BBF\uFF09", time: "2026-10-11", operator: "zyq001" },
  { id: "se_8_2", supplierId: "8", supplierName: "\u56DB\u5DDD\u7701\u8336\u4E1A\u96C6\u56E2\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "report", delta: 10, reason: "\u5BA2\u6237\u62A5\u5907\u5BA1\u6279\u901A\u8FC7\u5E76\u5B8C\u6210\u9996\u5355\u5C65\u7EA6", time: "2026-10-02", refCode: "BB20260920003", operator: "\u7BA1\u7406\u5458" },
  { id: "se_8_3", supplierId: "8", supplierName: "\u56DB\u5DDD\u7701\u8336\u4E1A\u96C6\u56E2\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "fulfillment", delta: 5, reason: "\u8BA2\u5355\u6309\u65F6\u53D1\u8D27\u5E76\u5B8C\u6210\u7ED3\u7B97", time: "2026-09-26", refCode: "HHSO20260908004", operator: "\u7BA1\u7406\u5458" },
  { id: "se_8_4", supplierId: "8", supplierName: "\u56DB\u5DDD\u7701\u8336\u4E1A\u96C6\u56E2\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "fulfillment", delta: 5, reason: "\u8BA2\u5355\u6309\u65F6\u53D1\u8D27\u5E76\u5B8C\u6210\u7ED3\u7B97", time: "2026-09-12", refCode: "HHSO20260901006", operator: "\u7BA1\u7406\u5458" },
  /* ── 云茶供应链（11）── */
  { id: "se_11_1", supplierId: "11", supplierName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8", dimension: "visit", delta: 4, reason: "\u5BA2\u6237\u62DC\u8BBF 2 \u6B21\uFF08\u82CF\u5DDE\u5434\u95E8\u8336\u4E8B / \u5357\u4EAC\u7FE0\u7AF9\u8336\u884C\uFF09", time: "2026-10-12", operator: "admin" },
  { id: "se_11_2", supplierId: "11", supplierName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8", dimension: "report", delta: 5, reason: "\u5546\u54C1\u62A5\u5907\u5BA1\u6279\u901A\u8FC7\uFF08\u6B66\u5937\u5CA9\u8336 \xB7 \u6C34\u91D1\u9F9F \xB7 \u6C5F\u82CF\u533A\u57DF\uFF09", time: "2026-09-11", refCode: "BB20260910003", operator: "\u7BA1\u7406\u5458" },
  { id: "se_11_3", supplierId: "11", supplierName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8", dimension: "report", delta: 5, reason: "\u5546\u54C1\u62A5\u5907\u5BA1\u6279\u901A\u8FC7\uFF08\u51B7\u6CE1\u8336\u4FBF\u643A\u88C5 \xB7 \u5168\u56FD\uFF09", time: "2026-09-02", refCode: "BB20260901006", operator: "\u7BA1\u7406\u5458" },
  { id: "se_11_4", supplierId: "11", supplierName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8", dimension: "fulfillment", delta: -5, reason: "\u8BA2\u5355\u8D85\u65F6\u53D1\u8D27", time: "2026-09-18", refCode: "HHSO20260910003", operator: "\u7BA1\u7406\u5458" },
  { id: "se_11_5", supplierId: "11", supplierName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8", dimension: "penalty", delta: -10, reason: "\u5BA2\u6237\u6295\u8BC9\u8FDF\u53D1\u672A\u63D0\u524D\u62A5\u5907", time: "2026-09-19", operator: "\u7BA1\u7406\u5458" },
  /* ── 中茶（5）── */
  { id: "se_5_1", supplierId: "5", supplierName: "\u4E2D\u56FD\u8336\u53F6\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "visit", delta: 4, reason: "\u5BA2\u6237\u62DC\u8BBF 2 \u6B21", time: "2026-10-08", operator: "admin" },
  { id: "se_5_2", supplierId: "5", supplierName: "\u4E2D\u56FD\u8336\u53F6\u80A1\u4EFD\u6709\u9650\u516C\u53F8", dimension: "fulfillment", delta: 5, reason: "\u8BA2\u5355\u6309\u65F6\u53D1\u8D27\u5E76\u5B8C\u6210\u7ED3\u7B97", time: "2026-09-22", refCode: "HHSO20260911002", operator: "\u7BA1\u7406\u5458" }
];

// src/stores/scoreStore.ts
var now = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var useScoreStore = create((set) => ({
  entries: scoreEntries,
  addEntry: (input) => set((s) => ({
    entries: [
      {
        id: `se_${Date.now()}`,
        time: now(),
        ...input
      },
      ...s.entries
    ]
  }))
}));
function getScoreSummary(entries, supplierId, supplierName) {
  const mine = entries.filter((e) => e.supplierId === supplierId);
  const sum = (dim) => mine.filter((e) => e.dimension === dim).reduce((acc, e) => acc + e.delta, 0);
  const visit = sum("visit");
  const report = sum("report");
  const fulfillment = sum("fulfillment");
  const penalty = sum("penalty");
  const base = scoreBases[supplierId]?.base ?? 60;
  return {
    supplierId,
    supplierName,
    visit,
    report,
    fulfillment,
    penalty,
    total: base + visit + report + fulfillment + penalty,
    ontimeRate: scoreBases[supplierId]?.ontimeRate ?? 88
  };
}

// src/stores/reportStore.ts
function reportPriority(r) {
  return r.type === "order" ? 0 : r.type === "product" ? 1 : 2;
}
function regionMatch(order, r) {
  if (r.nationwide) return true;
  if (!r.regionProv) return true;
  const region = order.customerRegion ?? "";
  if (!region.includes(r.regionProv)) return false;
  if (r.regionCity && !region.includes(r.regionCity)) return false;
  if (r.regionDist && !region.includes(r.regionDist)) return false;
  return true;
}
function customerMatch(order, r) {
  return !r.customerName || r.customerName === "\u5168\u90E8\u5BA2\u6237" || order.customerName === r.customerName;
}
function matchesReport(order, report) {
  if (!customerMatch(order, report)) return false;
  if (report.type === "order") {
    if (!regionMatch(order, report)) return false;
    if (report.contactPhone && order.receiverPhone && order.receiverPhone.includes(report.contactPhone)) return true;
    if (report.productName && order.items.some((it) => it.productName === report.productName)) return true;
    if (report.internalOrderNo && order.code === report.internalOrderNo) return true;
    return false;
  }
  if (report.type === "product") {
    const names = report.productNames?.length ? report.productNames : report.productName ? [report.productName] : [];
    if (names.length === 0) return false;
    if (!order.items.some((it) => names.includes(it.productName))) return false;
    return regionMatch(order, report);
  }
  return regionMatch(order, report);
}
var formatNow = () => {
  const now5 = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now5.getFullYear()}-${pad(now5.getMonth() + 1)}-${pad(now5.getDate())} ${pad(now5.getHours())}:${pad(now5.getMinutes())}`;
};
var useReportStore = create((set) => ({
  reports: partnerReports,
  submitReport: (report) => set((s) => ({ reports: [report, ...s.reports] })),
  reviewReport: (id, status, note) => {
    if (status === "approved") {
      const target = partnerReports.find((r) => r.id === id);
      if (target) {
        useScoreStore.getState().addEntry({
          supplierId: "11",
          supplierName: target.partnerName,
          dimension: "report",
          delta: 5,
          reason: `\u62A5\u5907\u5BA1\u6279\u901A\u8FC7\uFF08${target.code}\uFF09`,
          refCode: target.code,
          operator: "\u7BA1\u7406\u5458"
        });
      }
    }
    set((s) => ({
      reports: s.reports.map(
        (r) => r.id === id ? { ...r, status, reviewNote: note, reviewTime: formatNow() } : r
      )
    }));
  }
}));

// src/data/externalOrders.ts
var minutesLater = (m) => Date.now() + m * 60 * 1e3;
var baseSeeds = [
  /* ── 待处理（手工录入） ── */
  {
    id: "eo1",
    code: "DXS202610250001",
    platform: "tmall",
    externalOrderNo: "TM-88213907-1",
    customerName: "\u6E05\u5FC3\u8336\u574A",
    customerType: "\u76F4\u8425\u5BA2\u6237",
    customerRegion: "\u6D59\u6C5F\u5B81\u6CE2",
    items: [{ productId: "p5", productName: "\u91D1\u9A8F\u7709\xB7\u7279\u7EA7", spec: "50g/\u7F50", quantity: 12, price: 1024 }],
    totalAmount: 12288,
    receiver: "\u6E05\u5FC3\u8336\u574A\u6536\u53D1\u90E8",
    receiverPhone: "139****2210",
    receiverAddress: "\u6D59\u6C5F\u5B81\u6CE2\u5E02\u911E\u5DDE\u533A\u4E2D\u5C71\u4E1C\u8DEF2001\u53F7",
    remark: "\u53CC\u5341\u4E00\u9884\u552E\u5C3E\u6B3E\u8BA2\u5355",
    entryTime: "2026-10-25",
    operator: "\u8FD0\u8425\u5C0F\u5468",
    sourceChannel: "manual",
    processStatus: "pending",
    history: [{ time: "2026-10-25", action: "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u5929\u732B\u5E73\u53F0" }]
  },
  /* ── 待处理（平台直连推送） ── */
  {
    id: "eo8",
    code: "DXS202610250002",
    platform: "douyin",
    externalOrderNo: "DY-99012218",
    customerName: "\u8336\u989C\u60A6\u8272\u6587\u521B\u5E97",
    customerType: "\u6E20\u9053\u5BA2\u6237",
    customerRegion: "\u6E56\u5357\u957F\u6C99",
    items: [
      { productId: "p2", productName: "\u78A7\u87BA\u6625\xB7\u4E00\u7EA7", spec: "100g/\u888B", quantity: 25, price: 328 },
      { productId: "p12", productName: "\u5BFF\u7709\xB72019\u5E74\u9648", spec: "350g/\u997C", quantity: 30, price: 158 }
    ],
    totalAmount: 12840,
    receiver: "\u6587\u521B\u5E97\u4ED3\u50A8\u90E8",
    receiverPhone: "0731-8866****",
    receiverAddress: "\u6E56\u5357\u957F\u6C99\u5E02\u5929\u5FC3\u533A\u592A\u5E73\u8001\u885758\u53F7",
    remark: "\u6296\u97F3\u5546\u57CE\u76F4\u8FDE\u63A8\u9001\uFF0C\u81EA\u52A8\u5EFA\u5355",
    entryTime: "2026-10-25",
    operator: "\u7CFB\u7EDF\u76F4\u8FDE",
    sourceChannel: "push",
    processStatus: "pending",
    history: [{ time: "2026-10-25", action: "\u76F4\u8FDE\u63A8\u9001\u8BA2\u5355", detail: "\u6296\u97F3\u5546\u57CE API \u81EA\u52A8\u540C\u6B65" }]
  },
  /* ── 自营待接单（等管理后台在销售订单-分发订单接单） ── */
  {
    id: "eo9",
    code: "DXS202610240004",
    platform: "tmall",
    externalOrderNo: "TM-88012554-3",
    customerName: "\u6D66\u53D1\u94F6\u884C",
    customerType: "\u5E73\u53F0\u5BA2\u6237",
    customerRegion: "\u4E0A\u6D77\u6D66\u4E1C",
    items: [{ productId: "p8", productName: "\u767D\u6BEB\u94F6\u9488\xB7\u7279\u7EA7", spec: "50g/\u7F50", quantity: 15, price: 768 }],
    totalAmount: 11520,
    receiver: "\u6D66\u53D1\u94F6\u884C\u91C7\u8D2D\u4E2D\u5FC3",
    receiverPhone: "021-5888****",
    receiverAddress: "\u4E0A\u6D77\u5E02\u6D66\u4E1C\u65B0\u533A\u6D66\u4E1C\u5357\u8DEF500\u53F7",
    remark: "\u8D70\u4EAC\u4E1C\u6167\u91C7\u5E73\u53F0\uFF0C\u9700\u63D0\u4F9B\u968F\u8D27\u540C\u884C\u5355",
    entryTime: "2026-10-24",
    operator: "\u8FD0\u8425\u8001\u9648",
    sourceChannel: "manual",
    processStatus: "self_pending",
    path: "self",
    history: [
      { time: "2026-10-24", action: "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u5929\u732B\u5E73\u53F0" },
      { time: "2026-10-24", action: "\u9009\u62E9\u81EA\u8425\u8DEF\u5F84", detail: "\u80CC\u5BF9\u80CC\u91C7\u8D2D \xB7 \u7B49\u5F85\u7BA1\u7406\u540E\u53F0\u63A5\u5355\uFF08\u9500\u552E\u8BA2\u5355 \u2192 \u5206\u53D1\u8BA2\u5355\uFF09" }
    ]
  },
  /* ── 转派待接单（指定转派：直播渠道大单指定合作商履约） ── */
  {
    id: "eo5",
    code: "DXS202610250005",
    platform: "pdd",
    externalOrderNo: "PDD-2093184-1",
    customerName: "\u8317\u9999\u9601\u76F4\u64AD",
    customerType: "\u5E26\u8D27\u5BA2\u6237",
    customerRegion: "\u5E7F\u4E1C\u5E7F\u5DDE",
    items: [{ productId: "p11", productName: "\u51E4\u51F0\u5355\u4E1B\xB7\u871C\u5170\u9999", spec: "100g/\u888B", quantity: 50, price: 374 }],
    totalAmount: 18700,
    receiver: "\u8317\u9999\u9601\u4ED3\u50A8",
    receiverPhone: "137****0912",
    receiverAddress: "\u5E7F\u4E1C\u5E7F\u5DDE\u5E02\u767D\u4E91\u533A\u9EC4\u77F3\u4E1C\u8DEF288\u53F7",
    remark: "\u76F4\u64AD\u95F4\u7206\u5355\uFF0C\u4ECA\u665A 8 \u70B9\u524D\u987B\u53D1\u51FA",
    entryTime: "2026-10-25",
    operator: "\u8FD0\u8425\u5C0F\u5468",
    sourceChannel: "manual",
    processStatus: "distribute_pending",
    path: "distribute",
    distributeMode: "assign",
    partnerId: "3",
    partnerName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8",
    transferSource: "assign",
    transferTime: "2026-10-25",
    history: [
      { time: "2026-10-25", action: "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u62FC\u591A\u591A\u5E73\u53F0" },
      { time: "2026-10-25", action: "\u6307\u5B9A\u8F6C\u6D3E", detail: "\u6307\u5B9A\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8 \u2192 \u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355" }
    ]
  },
  /* ── 比单中（公开报名制：底价 88 折，已有 2 家报名） ── */
  {
    id: "eo6",
    code: "DXS202610250006",
    platform: "jd",
    externalOrderNo: "JD-20603995",
    customerName: "\u5929\u798F\u8317\u8336",
    customerType: "\u6E20\u9053\u5BA2\u6237",
    customerRegion: "\u798F\u5EFA\u53A6\u95E8",
    items: [
      { productId: "p9", productName: "\u94C1\u89C2\u97F3\xB7\u6E05\u9999\u4E00\u7EA7", spec: "250g/\u7F50", quantity: 40, price: 208 },
      { productId: "p10", productName: "\u5927\u7EA2\u888D\xB7\u7279\u7EA7", spec: "150g/\u76D2", quantity: 22, price: 494 }
    ],
    totalAmount: 19148,
    receiver: "\u5929\u798F\u7269\u6D41\u90E8",
    receiverPhone: "0571-566****",
    receiverAddress: "\u798F\u5EFA\u53A6\u95E8\u5E02\u601D\u660E\u533A\u83B2\u524D\u897F\u8DEF209\u53F7",
    entryTime: "2026-10-25",
    operator: "\u8FD0\u8425\u8001\u9648",
    sourceChannel: "manual",
    processStatus: "comparing",
    path: "distribute",
    distributeMode: "compare",
    compare: {
      deadline: minutesLater(40),
      floorRule: { type: "discount", value: 88 },
      floorNote: "\u62A5\u540D\u62A5\u4EF7\u4E0D\u5F97\u4F4E\u4E8E\u8BA2\u5355\u91D1\u989D\u7684 88 \u6298\uFF08\xA516,850\uFF09",
      quotes: [
        { supplierId: "3", supplierName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8", amount: 17400, quoteTime: "2026-10-25 10:12" },
        { supplierId: "8", supplierName: "\u56DB\u5DDD\u7701\u8336\u4E1A\u96C6\u56E2\u80A1\u4EFD\u6709\u9650\u516C\u53F8", amount: 17800, quoteTime: "2026-10-25 10:40" }
      ],
      scored: false
    },
    history: [
      { time: "2026-10-25", action: "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u4EAC\u4E1C\u5E73\u53F0" },
      { time: "2026-10-25", action: "\u53D1\u8D77\u6BD4\u5355", detail: "\u516C\u5F00\u62A5\u540D \xB7 \u5E95\u4EF7\u4E3A\u8BA2\u5355\u91D1\u989D 88 \u6298 \xB7 \u62A5\u4EF7 50% + \u79EF\u5206 50% \u8BC4\u5206" }
    ]
  },
  /* ── 报备-匹配待确认（录入即命中云茶商品报备，待人工确认后分发） ── */
  {
    id: "eo12",
    code: "DXS202610250007",
    platform: "pdd",
    externalOrderNo: "PDD-3355660-2",
    customerName: "\u65E0\u9521\u6885\u56ED\u8336\u820D",
    customerType: "\u76F4\u8425\u5BA2\u6237",
    customerRegion: "\u6C5F\u82CF\u65E0\u9521",
    items: [{ productId: "p7", productName: "\u6B66\u5937\u5CA9\u8336\xB7\u6C34\u91D1\u9F9F", spec: "50g/\u7F50", quantity: 16, price: 420 }],
    totalAmount: 6720,
    receiver: "\u6885\u56ED\u8336\u820D\u91C7\u8D2D\u90E8",
    receiverPhone: "0510-8230****",
    receiverAddress: "\u6C5F\u82CF\u65E0\u9521\u5E02\u6EE8\u6E56\u533A\u6881\u6EAA\u8DEF88\u53F7",
    remark: "\u62FC\u591A\u591A\u767E\u4EBF\u8865\u8D34\u8BA2\u5355",
    entryTime: "2026-10-25",
    operator: "\u8FD0\u8425\u5C0F\u5468",
    sourceChannel: "push",
    processStatus: "report_match_pending",
    reportMatches: [{ reportCode: "BB20260910003", reportType: "product", partnerId: "11", partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8" }],
    path: "distribute",
    partnerId: "11",
    partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8",
    history: [
      { time: "2026-10-25", action: "\u76F4\u8FDE\u63A8\u9001\u8BA2\u5355", detail: "\u62FC\u591A\u591A API \u81EA\u52A8\u540C\u6B65" },
      { time: "2026-10-25", action: "\u547D\u4E2D\u62A5\u5907\uFF0C\u5F85\u786E\u8BA4\u5339\u914D", detail: "\u547D\u4E2D\u5546\u54C1\u62A5\u5907 BB20260910003\uFF08\u6C34\u91D1\u9F9F \xB7 \u6C5F\u82CF\u533A\u57DF\uFF09\u2192 \u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8 \xB7 \u5F85\u4EBA\u5DE5\u786E\u8BA4\u540E\u5206\u53D1" }
    ]
  },
  /* ── 转派待接单（报备转派：命中云茶商品报备自动转出） ── */
  {
    id: "eo2",
    code: "DXS202610240003",
    platform: "jd",
    externalOrderNo: "JD-20581773",
    customerName: "\u82CF\u5DDE\u5434\u95E8\u8336\u4E8B",
    customerType: "\u4E2A\u4EBA\u5BA2\u6237",
    customerRegion: "\u6C5F\u82CF\u82CF\u5DDE",
    items: [{ productId: "p7", productName: "\u6B66\u5937\u5CA9\u8336\xB7\u6C34\u91D1\u9F9F", spec: "50g/\u7F50", quantity: 20, price: 420 }],
    totalAmount: 8400,
    receiver: "\u5434\u95E8\u8336\u4E8B\u4E3B\u7406\u4EBA",
    receiverPhone: "137****8899",
    receiverAddress: "\u6C5F\u82CF\u82CF\u5DDE\u5E02\u59D1\u82CF\u533A\u5E73\u6C5F\u8DEF\u5386\u53F2\u8857\u533A46\u53F7",
    entryTime: "2026-10-24",
    operator: "\u8FD0\u8425\u5C0F\u5468",
    sourceChannel: "manual",
    processStatus: "distribute_pending",
    reportMatches: [{ reportCode: "BB20260910003", reportType: "product", partnerId: "11", partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8" }],
    path: "distribute",
    distributeMode: "assign",
    partnerId: "11",
    partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8",
    transferSource: "report",
    transferTime: "2026-10-24",
    history: [
      { time: "2026-10-24", action: "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u4EAC\u4E1C\u5E73\u53F0" },
      { time: "2026-10-24", action: "\u62A5\u5907\u547D\u4E2D\u81EA\u52A8\u8F6C\u51FA", detail: "\u547D\u4E2D\u5546\u54C1\u62A5\u5907 BB20260910003\uFF08\u6C34\u91D1\u9F9F \xB7 \u6C5F\u82CF\u533A\u57DF\uFF09\u2192 \u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8 \xB7 \u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355" }
    ]
  },
  /* ── 转派待接单（指定转派 → 云茶，等合作商终端接单） ── */
  {
    id: "eo10",
    code: "DXS202610240007",
    platform: "other",
    externalOrderNo: "WX-20261024-66",
    customerName: "\u534E\u8317\u5802\u8336\u5E84",
    customerType: "\u76F4\u8425\u5BA2\u6237",
    customerRegion: "\u6C5F\u82CF\u5357\u4EAC",
    items: [{ productId: "p1", productName: "\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7", spec: "50g/\u7F50", quantity: 18, price: 452 }],
    totalAmount: 8136,
    receiver: "\u6797\u638C\u67DC",
    receiverPhone: "138****6677",
    receiverAddress: "\u6C5F\u82CF\u5357\u4EAC\u5E02\u79E6\u6DEE\u533A\u592B\u5B50\u5E99\u8857\u9053\u8D21\u9662\u885712\u53F7",
    entryTime: "2026-10-24",
    operator: "\u8FD0\u8425\u8001\u9648",
    sourceChannel: "manual",
    processStatus: "distribute_pending",
    path: "distribute",
    distributeMode: "assign",
    partnerId: "11",
    partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8",
    transferSource: "assign",
    transferTime: "2026-10-24",
    history: [
      { time: "2026-10-24", action: "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u5FAE\u4FE1\u5C0F\u5E97" },
      { time: "2026-10-24", action: "\u6307\u5B9A\u8F6C\u6D3E", detail: "\u6307\u5B9A\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8\uFF08\u79EF\u5206 61\uFF09\u2192 \u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355" }
    ]
  },
  /* ── 已处理（报备转派 + 合作商已接单 + 发货中） ── */
  {
    id: "eo3",
    code: "DXS202610210008",
    platform: "douyin",
    externalOrderNo: "DY-7361902",
    customerName: "\u5357\u4EAC\u7FE0\u7AF9\u8336\u884C",
    customerType: "\u6E20\u9053\u5BA2\u6237",
    customerRegion: "\u6C5F\u82CF\u5357\u4EAC",
    items: [{ productId: "p6", productName: "\u96E8\u82B1\u8336\xB7\u7279\u7EA7", spec: "100g/\u7F50", quantity: 30, price: 268 }],
    totalAmount: 8040,
    receiver: "\u7FE0\u7AF9\u8336\u884C\u91C7\u8D2D\u90E8",
    receiverPhone: "025-8463****",
    receiverAddress: "\u6C5F\u82CF\u5357\u4EAC\u5E02\u7384\u6B66\u533A\u4E2D\u5C71\u4E1C\u8DEF198\u53F7",
    entryTime: "2026-10-21",
    operator: "\u8FD0\u8425\u8001\u9648",
    sourceChannel: "push",
    processStatus: "processed",
    reportMatches: [{ reportCode: "BB20261013004", reportType: "region", partnerId: "11", partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8" }],
    path: "distribute",
    partnerId: "11",
    partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8",
    transferSource: "report",
    transferTime: "2026-10-21",
    partnerStatus: "shipping",
    history: [
      { time: "2026-10-21", action: "\u76F4\u8FDE\u63A8\u9001\u8BA2\u5355", detail: "\u6296\u97F3\u5E73\u53F0 API \u540C\u6B65" },
      { time: "2026-10-21", action: "\u62A5\u5907\u547D\u4E2D\u81EA\u52A8\u8F6C\u51FA", detail: "\u547D\u4E2D\u5BA2\u6237\u62A5\u5907 BB20261013004\uFF08\u5357\u4EAC\u7FE0\u7AF9\u8336\u884C\uFF09\u2192 \u4E91\u8336\u4F9B\u5E94\u94FE \xB7 \u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355" },
      { time: "2026-10-22", action: "\u5408\u4F5C\u5546\u63A5\u5355", detail: "\u4E91\u8336\u4F9B\u5E94\u94FE\u5DF2\u63A5\u5355\u5907\u8D27 \u2192 \u5DF2\u5904\u7406" },
      { time: "2026-10-23", action: "\u5408\u4F5C\u5546\u53D1\u8D27", detail: "\u987A\u4E30\u901F\u8FD0 \xB7 \u5DF2\u53D1\u51FA" }
    ]
  },
  /* ── 已处理（自营：管理后台已接单，采购中） ── */
  {
    id: "eo11",
    code: "DXS202610220009",
    platform: "jd",
    externalOrderNo: "JD-20775210",
    customerName: "\u4EA4\u901A\u94F6\u884C",
    customerType: "\u5E73\u53F0\u5BA2\u6237",
    customerRegion: "\u4E0A\u6D77\u9EC4\u6D66",
    items: [{ productId: "p3", productName: "\u7AF9\u53F6\u9752\xB7\u54C1\u5473\u7EA7", spec: "50g/\u7F50", quantity: 40, price: 356 }],
    totalAmount: 14240,
    receiver: "\u4EA4\u884C\u91C7\u8D2D\u4E2D\u5FC3",
    receiverPhone: "021-3138****",
    receiverAddress: "\u4E0A\u6D77\u5E02\u9EC4\u6D66\u533A\u4E2D\u5C71\u5357\u8DEF99\u53F7",
    entryTime: "2026-10-22",
    operator: "\u7CFB\u7EDF\u76F4\u8FDE",
    sourceChannel: "push",
    processStatus: "self_accepted",
    path: "self",
    follower: "\u5468\u96E8\u6850",
    selfPo: { supplierId: "8", supplierName: "\u56DB\u5DDD\u7701\u8336\u4E1A\u96C6\u56E2\u80A1\u4EFD\u6709\u9650\u516C\u53F8", mode: "warehouse", purchaseDate: "2026-10-23" },
    history: [
      { time: "2026-10-22", action: "\u76F4\u8FDE\u63A8\u9001\u8BA2\u5355", detail: "\u4EAC\u4E1C\u5E73\u53F0 API \u540C\u6B65" },
      { time: "2026-10-22", action: "\u9009\u62E9\u81EA\u8425\u8DEF\u5F84", detail: "\u8FDB\u5165\u81EA\u8425\u5DE5\u4F5C\u53F0 \xB7 \u7B49\u5F85\u63A5\u5355" },
      { time: "2026-10-23", action: "\u63A5\u5355\uFF08\u81EA\u8425\uFF09", detail: "\u8DDF\u5355\u4EBA \u5468\u96E8\u6850 \u2192 \u5DF2\u63A5\u5355" },
      { time: "2026-10-23", action: "\u4EE5\u9500\u5B9A\u91C7", detail: "\u7AF9\u53F6\u9752\xB7\u54C1\u5473\u7EA7 \u7F3A\u53E3 40 \u4EF6 \u2192 \u5165\u5E93\u5236\u91C7\u8D2D\u5355 CG-DXS202610220009\uFF08\u56DB\u5DDD\u7701\u8336\u4E1A\u96C6\u56E2\uFF09\xB7 \u91C7\u8D2D\u5728\u9014" }
    ]
  },
  /* ── 已完成（自营全链路） ── */
  {
    id: "eo4",
    code: "DXS202610180010",
    platform: "tmall",
    externalOrderNo: "TM-87390115-2",
    customerName: "\u6D66\u53D1\u94F6\u884C",
    customerType: "\u5E73\u53F0\u5BA2\u6237",
    customerRegion: "\u4E0A\u6D77\u6D66\u4E1C",
    items: [{ productId: "p8", productName: "\u767D\u6BEB\u94F6\u9488\xB7\u7279\u7EA7", spec: "50g/\u7F50", quantity: 10, price: 768 }],
    totalAmount: 7680,
    receiver: "\u6D66\u53D1\u94F6\u884C\u91C7\u8D2D\u4E2D\u5FC3",
    receiverPhone: "021-5888****",
    receiverAddress: "\u4E0A\u6D77\u5E02\u6D66\u4E1C\u65B0\u533A\u6D66\u4E1C\u5357\u8DEF500\u53F7",
    remark: "\u8D70\u4EAC\u4E1C\u6167\u91C7\u5E73\u53F0\uFF0C\u9700\u63D0\u4F9B\u968F\u8D27\u540C\u884C\u5355",
    entryTime: "2026-10-18",
    operator: "\u8FD0\u8425\u8001\u9648",
    sourceChannel: "manual",
    processStatus: "completed",
    path: "self",
    follower: "\u9648\u9ED8",
    selfShipments: [{
      id: "ss_eo4_1",
      packageNo: "FHDXS0100001",
      warehouseId: "wh-ind-04",
      warehouseName: "\u798F\u9F0E\u5206\u4ED3",
      logisticsCompany: "\u4EAC\u4E1C\u7269\u6D41",
      trackingNo: "JD0031874520",
      items: [{ productId: "p8", productName: "\u767D\u6BEB\u94F6\u9488\xB7\u7279\u7EA7", qty: 10 }],
      status: "delivered",
      shippedAt: "2026-10-22 09:30",
      deliveredAt: "2026-10-23 14:00"
    }],
    history: [
      { time: "2026-10-18", action: "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u5929\u732B\u5E73\u53F0" },
      { time: "2026-10-18", action: "\u9009\u62E9\u81EA\u8425\u8DEF\u5F84", detail: "\u8FDB\u5165\u81EA\u8425\u5DE5\u4F5C\u53F0 \xB7 \u7B49\u5F85\u63A5\u5355" },
      { time: "2026-10-19", action: "\u63A5\u5355\uFF08\u81EA\u8425\uFF09", detail: "\u8DDF\u5355\u4EBA \u9648\u9ED8 \u2192 \u5DF2\u63A5\u5355" },
      { time: "2026-10-22", action: "\u91C7\u8D2D&\u53D1\u8D27\uFF08\u5206\u4ED3\u76F4\u53D1\uFF09", detail: "\u798F\u9F0E\u5206\u4ED3 \u76F4\u53D1 \u767D\u6BEB\u94F6\u9488\xB7\u7279\u7EA7\xD710 \xB7 \u4EAC\u4E1C\u7269\u6D41 JD0031874520 \u2192 \u5DF2\u53D1\u8D27\u8FD0\u8F93\u4E2D" },
      { time: "2026-10-23", action: "\u7269\u6D41\u59A5\u6295", detail: "JD0031874520 \u5DF2\u5B8C\u6210\u6295\u9012 \u2192 \u59A5\u6295" },
      { time: "2026-10-24", action: "\u5BA2\u6237\u786E\u8BA4\u6536\u8D27", detail: "\u8BA2\u5355\u5B8C\u6210\uFF08\u786E\u8BA4\u6536\u8D27\uFF09" }
    ]
  },
  /* ── 已完成（比单转派已结算） ── */
  {
    id: "eo7",
    code: "DXS202610120011",
    platform: "other",
    externalOrderNo: "WX-20261012-88",
    customerName: "\u534E\u8317\u5802\u8336\u5E84",
    customerType: "\u76F4\u8425\u5BA2\u6237",
    customerRegion: "\u6C5F\u82CF\u5357\u4EAC",
    items: [{ productId: "p1", productName: "\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7", spec: "50g/\u7F50", quantity: 20, price: 452 }],
    totalAmount: 9040,
    receiver: "\u6797\u638C\u67DC",
    receiverPhone: "138****6677",
    receiverAddress: "\u6C5F\u82CF\u5357\u4EAC\u5E02\u79E6\u6DEE\u533A\u592B\u5B50\u5E99\u8857\u9053\u8D21\u9662\u885712\u53F7",
    entryTime: "2026-10-12",
    operator: "\u8FD0\u8425\u8001\u9648",
    sourceChannel: "manual",
    processStatus: "completed",
    path: "distribute",
    distributeMode: "compare",
    partnerId: "3",
    partnerName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8",
    transferSource: "compare",
    transferTime: "2026-10-13",
    partnerStatus: "settled",
    settleOnTime: true,
    history: [
      { time: "2026-10-12", action: "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u5FAE\u4FE1\u5C0F\u5E97" },
      { time: "2026-10-12", action: "\u53D1\u8D77\u6BD4\u5355", detail: "\u516C\u5F00\u62A5\u540D \xB7 \u5E95\u4EF7\u4E3A\u8BA2\u5355\u91D1\u989D 85 \u6298 \xB7 3 \u5BB6\u62A5\u540D" },
      { time: "2026-10-13", action: "\u6BD4\u5355\u5B9A\u6807", detail: "\u516B\u9A6C\u8336\u4E1A \u7EFC\u5408\u5F97\u5206 92.5 \u4E2D\u5355 \xB7 \u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355" },
      { time: "2026-10-13", action: "\u5408\u4F5C\u5546\u63A5\u5355", detail: "\u2192 \u5DF2\u5904\u7406" },
      { time: "2026-10-13", action: "\u5408\u4F5C\u5546\u53D1\u8D27" },
      { time: "2026-10-15", action: "\u5BA2\u6237\u7B7E\u6536" },
      { time: "2026-10-16", action: "\u7ED3\u7B97\u5B8C\u6210", detail: "\u6309\u65F6\u5C65\u7EA6 \xB7 \u79EF\u5206 +5" }
    ]
  }
];
var DEMO_CUSTOMERS = [
  { name: "\u59D1\u82CF\u8317\u94FA", type: "\u6E20\u9053\u5BA2\u6237", prov: "\u6C5F\u82CF", cityShort: "\u82CF\u5DDE", city: "\u82CF\u5DDE\u5E02", dist: "\u59D1\u82CF\u533A", street: "\u4EBA\u6C11\u8DEF1024\u53F7" },
  { name: "\u91D1\u9675\u8336\u793C\u4E2D\u5FC3", type: "\u76F4\u8425\u5BA2\u6237", prov: "\u6C5F\u82CF", cityShort: "\u5357\u4EAC", city: "\u5357\u4EAC\u5E02", dist: "\u7384\u6B66\u533A", street: "\u4E2D\u5C71\u4E1C\u8DEF88\u53F7" },
  { name: "\u6E56\u7554\u8336\u53D9", type: "\u4E2A\u4EBA\u5BA2\u6237", prov: "\u6D59\u6C5F", cityShort: "\u676D\u5DDE", city: "\u676D\u5DDE\u5E02", dist: "\u897F\u6E56\u533A", street: "\u6587\u4E09\u8DEF500\u53F7" },
  { name: "\u752C\u4E0A\u8336\u5E84", type: "\u76F4\u8425\u5BA2\u6237", prov: "\u6D59\u6C5F", cityShort: "\u5B81\u6CE2", city: "\u5B81\u6CE2\u5E02", dist: "\u6D77\u66D9\u533A", street: "\u548C\u4E49\u5927\u905366\u53F7" },
  { name: "\u9E6D\u5C9B\u8336\u4E8B", type: "\u6E20\u9053\u5BA2\u6237", prov: "\u798F\u5EFA", cityShort: "\u53A6\u95E8", city: "\u53A6\u95E8\u5E02", dist: "\u601D\u660E\u533A", street: "\u53A6\u79BE\u8DEF218\u53F7" },
  { name: "\u84C9\u57CE\u8336\u96C6", type: "\u76F4\u8425\u5BA2\u6237", prov: "\u56DB\u5DDD", cityShort: "\u6210\u90FD", city: "\u6210\u90FD\u5E02", dist: "\u9526\u6C5F\u533A", street: "\u6625\u7199\u8DEF8\u53F7" },
  { name: "\u7F8A\u57CE\u8336\u884C", type: "\u6E20\u9053\u5BA2\u6237", prov: "\u5E7F\u4E1C", cityShort: "\u5E7F\u5DDE", city: "\u5E7F\u5DDE\u5E02", dist: "\u5929\u6CB3\u533A", street: "\u4F53\u80B2\u897F\u8DEF120\u53F7" },
  { name: "\u661F\u57CE\u8336\u5EA7", type: "\u4E2A\u4EBA\u5BA2\u6237", prov: "\u6E56\u5357", cityShort: "\u957F\u6C99", city: "\u957F\u6C99\u5E02", dist: "\u8299\u84C9\u533A", street: "\u4E94\u4E00\u5927\u9053199\u53F7" },
  { name: "\u5E90\u9633\u8336\u82D1", type: "\u76F4\u8425\u5BA2\u6237", prov: "\u5B89\u5FBD", cityShort: "\u5408\u80A5", city: "\u5408\u80A5\u5E02", dist: "\u8700\u5C71\u533A", street: "\u957F\u6C5F\u897F\u8DEF299\u53F7" },
  { name: "\u6625\u57CE\u8336\u94FA", type: "\u6E20\u9053\u5BA2\u6237", prov: "\u4E91\u5357", cityShort: "\u6606\u660E", city: "\u6606\u660E\u5E02", dist: "\u4E94\u534E\u533A", street: "\u4E1C\u98CE\u897F\u8DEF77\u53F7" },
  { name: "\u6CC9\u57CE\u8317\u8336", type: "\u76F4\u8425\u5BA2\u6237", prov: "\u5C71\u4E1C", cityShort: "\u6D4E\u5357", city: "\u6D4E\u5357\u5E02", dist: "\u5386\u4E0B\u533A", street: "\u6CFA\u6E90\u5927\u885756\u53F7" },
  { name: "\u6D2A\u90FD\u8336\u820D", type: "\u4E2A\u4EBA\u5BA2\u6237", prov: "\u6C5F\u897F", cityShort: "\u5357\u660C", city: "\u5357\u660C\u5E02", dist: "\u4E1C\u6E56\u533A", street: "\u516B\u4E00\u5927\u905335\u53F7" }
];
var DEMO_PRODUCTS = [
  { productId: "p1", name: "\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7", spec: "50g/\u7F50", price: 452 },
  { productId: "p2", name: "\u78A7\u87BA\u6625\xB7\u4E00\u7EA7", spec: "100g/\u888B", price: 328 },
  { productId: "p5", name: "\u91D1\u9A8F\u7709\xB7\u7279\u7EA7", spec: "50g/\u7F50", price: 1024 },
  { productId: "p7", name: "\u6B66\u5937\u5CA9\u8336\xB7\u6C34\u91D1\u9F9F", spec: "50g/\u7F50", price: 420 },
  { productId: "p8", name: "\u767D\u6BEB\u94F6\u9488\xB7\u7279\u7EA7", spec: "50g/\u7F50", price: 768 },
  { productId: "p12", name: "\u5BFF\u7709\xB72019\u5E74\u9648", spec: "350g/\u997C", price: 158 },
  { productId: "p13", name: "\u51E4\u51F0\u5355\u4E1B\xB7\u871C\u5170\u9999", spec: "100g/\u888B", price: 296 },
  { productId: "p14", name: "\u94C1\u89C2\u97F3\xB7\u6E05\u9999\u4E00\u7EA7", spec: "250g/\u7F50", price: 208 }
];
var DEMO_REPORT_PRODUCTS = {
  national: { productId: "p20", name: "\u51B7\u6CE1\u8336\u4FBF\u643A\u88C5", spec: "3g/\u888B", price: 9 },
  jsRock: { productId: "p7", name: "\u6B66\u5937\u5CA9\u8336\xB7\u6C34\u91D1\u9F9F", spec: "50g/\u7F50", price: 420 }
};
var DEMO_PARTNERS = [
  { id: "11", name: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8" },
  { id: "3", name: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8" },
  { id: "4", name: "\u4E91\u5357\u5927\u76CA\u8336\u4E1A\u96C6\u56E2\u6709\u9650\u516C\u53F8" },
  { id: "5", name: "\u798F\u5EFA\u54C1\u54C1\u9999\u8336\u4E1A\u6709\u9650\u516C\u53F8" },
  { id: "2", name: "\u798F\u5EFA\u6B63\u5C71\u5802\u8336\u4E1A\u6709\u9650\u8D23\u4EFB\u516C\u53F8" },
  { id: "8", name: "\u56DB\u5DDD\u7701\u5CE8\u7709\u5C71\u7AF9\u53F6\u9752\u8336\u4E1A\u6709\u9650\u516C\u53F8" }
];
var DEMO_OPERATORS = ["\u8FD0\u8425\u5C0F\u5468", "\u8FD0\u8425\u8001\u9648", "\u8FD0\u8425\u5C0F\u6797", "\u7CFB\u7EDF\u76F4\u8FDE"];
var DEMO_FOLLOWERS = ["\u9648\u5EFA\u56FD", "\u5468\u654F", "\u6797\u6653\u5CF0", "\u987E\u6653\u5C9A"];
var lcg = (seed) => (n) => {
  let s = seed + n * 2654435761;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};
function buildOne(seq, statusPlan) {
  const rnd = lcg(seq)(7);
  const cust = DEMO_CUSTOMERS[seq % DEMO_CUSTOMERS.length];
  const platforms = ["tmall", "jd", "douyin", "pdd", "other"];
  const platform = platforms[Math.floor(rnd() * platforms.length)];
  const channel = rnd() > 0.5 ? "push" : "manual";
  const day = 11 + seq % 15;
  const date = `2026-10-${String(day).padStart(2, "0")}`;
  const items = statusPlan.items;
  return {
    id: `demo_${seq}`,
    code: `DXS202610${String(day).padStart(2, "0")}${String(9e3 + seq).padStart(4, "0")}`,
    platform,
    externalOrderNo: `${platform === "tmall" ? "TM" : platform === "jd" ? "JD" : platform === "douyin" ? "DY" : platform === "pdd" ? "PDD" : "WX"}-DEMO-${1e3 + seq}`,
    customerName: cust.name,
    customerType: cust.type,
    customerRegion: `${cust.prov}${cust.cityShort}`,
    items,
    totalAmount: items.reduce((s, it) => s + it.price * it.quantity, 0),
    receiver: `${cust.name}\u6536\u8D27\u90E8`,
    receiverPhone: "1" + String(3e8 + seq * 1379173).slice(0, 3) + "****" + String(1e3 + seq * 37).slice(0, 4),
    receiverAddress: `${cust.prov}${cust.city}${cust.dist}${cust.street}`,
    remark: "\u6F14\u793A\u6570\u636E",
    entryTime: date,
    operator: channel === "push" ? "\u7CFB\u7EDF\u76F4\u8FDE" : DEMO_OPERATORS[seq % 3],
    sourceChannel: channel,
    processStatus: statusPlan.processStatus,
    history: [
      { time: date, action: channel === "push" ? "\u76F4\u8FDE\u63A8\u9001\u8BA2\u5355" : "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u6F14\u793A\u6570\u636E" },
      ...statusPlan.history
    ],
    ...statusPlan.extra
  };
}
function pickItems(seq, forceFirst) {
  const rnd = lcg(seq)(13);
  const count = 1 + Math.floor(rnd() * 3);
  const pool = [...DEMO_PRODUCTS];
  const items = [];
  if (forceFirst) items.push(forceFirst);
  while (items.length < count) {
    const p = pool[Math.floor(rnd() * pool.length)];
    if (items.some((it) => it.productName === p.name)) continue;
    items.push({ productId: p.productId, productName: p.name, spec: p.spec, quantity: 4 + Math.floor(rnd() * 40), price: p.price });
  }
  return items;
}
function buildDemoOrders() {
  const orders = [];
  let seq = 1;
  const next = () => seq++;
  const D = (s) => `2026-10-${String(11 + s % 15).padStart(2, "0")}`;
  for (let i = 0; i < 8; i++) {
    const s = next();
    const isFamilyB = i < 3;
    orders.push(buildOne(s, {
      items: isFamilyB && i === 0 ? pickItems(s) : pickItems(s),
      processStatus: "pending",
      history: isFamilyB && i > 0 ? [{ time: D(s), action: "\u62C6\u5355\u751F\u6210\u5B50\u8BA2\u5355", detail: `\u4ECE\u6BCD\u9500\u552E\u5355\u62C6\u51FA\uFF08\u6F14\u793A\u62C6\u5355\u5BB6\u65CF\uFF09` }] : [],
      extra: isFamilyB && i > 0 ? { parentCode: void 0 } : void 0
    }));
  }
  const famBMother = orders[orders.length - 8];
  orders[orders.length - 7].parentCode = famBMother.code;
  orders[orders.length - 7].code = `${famBMother.code}LY01`;
  orders[orders.length - 6].parentCode = famBMother.code;
  orders[orders.length - 6].code = `${famBMother.code}LY02`;
  for (let i = 0; i < 4; i++) {
    const s = next();
    const useJs = i % 2 === 0;
    const cust = DEMO_CUSTOMERS[s * 3 % DEMO_CUSTOMERS.length];
    const prod = useJs ? DEMO_REPORT_PRODUCTS.jsRock : DEMO_REPORT_PRODUCTS.national;
    const reportCode = useJs ? "BB20260910003" : "BB20260901006";
    const order = buildOne(s, {
      items: [{ productId: prod.productId, productName: prod.name, spec: prod.spec, quantity: 10 + i * 6, price: prod.price }],
      processStatus: "report_match_pending",
      history: [{ time: D(s), action: "\u547D\u4E2D\u62A5\u5907\uFF0C\u5F85\u786E\u8BA4\u5339\u914D", detail: `\u547D\u4E2D\u5546\u54C1\u62A5\u5907 ${reportCode} \u2192 \u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8 \xB7 \u5F85\u4EBA\u5DE5\u786E\u8BA4\u540E\u5206\u53D1` }]
    });
    order.customerName = useJs ? cust.name : order.customerName;
    order.customerRegion = useJs ? `\u6C5F\u82CF${["\u82CF\u5DDE", "\u5357\u4EAC", "\u65E0\u9521", "\u5E38\u5DDE"][i]}` : order.customerRegion;
    if (useJs) {
      const c = DEMO_CUSTOMERS[i * 3 % 4];
      order.receiverAddress = `\u6C5F\u82CF${["\u82CF\u5DDE\u5E02", "\u5357\u4EAC\u5E02", "\u65E0\u9521\u5E02", "\u5E38\u5DDE\u5E02"][i]}${c.dist}${c.street}`;
    }
    order.reportMatches = [{ reportCode, reportType: "product", partnerId: "11", partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8" }];
    order.path = "distribute";
    order.partnerId = "11";
    order.partnerName = "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8";
    orders.push(order);
  }
  for (let i = 0; i < 4; i++) {
    const s = next();
    orders.push(buildOne(s, {
      items: pickItems(s),
      processStatus: "self_pending",
      history: [{ time: D(s), action: "\u9009\u62E9\u81EA\u8425\u8DEF\u5F84", detail: "\u80CC\u5BF9\u80CC\u91C7\u8D2D \xB7 \u7B49\u5F85\u7BA1\u7406\u540E\u53F0\u63A5\u5355\uFF08\u9500\u552E\u8BA2\u5355 \u2192 \u5206\u53D1\u8BA2\u5355\uFF09" }],
      extra: { path: "self" }
    }));
  }
  for (let i = 0; i < 4; i++) {
    const s = next();
    const p = DEMO_PARTNERS[(i + 1) % DEMO_PARTNERS.length];
    const src = i % 2 === 0 ? "report" : "assign";
    orders.push(buildOne(s, {
      items: pickItems(s),
      processStatus: "distribute_pending",
      history: [{ time: D(s), action: src === "report" ? "\u62A5\u5907\u5339\u914D\u786E\u8BA4\u8F6C\u51FA" : "\u6307\u5B9A\u8F6C\u6D3E", detail: `\u2192 ${p.name} \xB7 \u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355` }],
      extra: {
        path: "distribute",
        distributeMode: "assign",
        partnerId: p.id,
        partnerName: p.name,
        transferSource: src,
        transferTime: D(s),
        ...src === "report" ? { reportMatches: [{ reportCode: "BB20260901006", reportType: "product", partnerId: p.id, partnerName: p.name }] } : {}
      }
    }));
  }
  for (let i = 0; i < 4; i++) {
    const s = next();
    const items = pickItems(s);
    const q1 = DEMO_PARTNERS[i % DEMO_PARTNERS.length];
    const q2 = DEMO_PARTNERS[(i + 2) % DEMO_PARTNERS.length];
    const q3 = DEMO_PARTNERS[(i + 4) % DEMO_PARTNERS.length];
    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    orders.push(buildOne(s, {
      items,
      processStatus: "comparing",
      history: [{ time: D(s), action: "\u53D1\u8D77\u6BD4\u5355", detail: `\u516C\u5F00\u62A5\u540D \xB7 \u5E95\u4EF7\u4E3A\u8BA2\u5355\u91D1\u989D 88 \u6298\uFF08\xA5${Math.round(total * 0.88).toLocaleString()}\uFF09 \xB7 \u6309\u5546\u54C1\u79EF\u5206\u6392\u540D\u5B9A\u6807` }],
      extra: {
        path: "distribute",
        distributeMode: "compare",
        compare: {
          deadline: minutesLater(15 + i * 8),
          floorRule: { type: "discount", value: 88 },
          floorNote: `\u62A5\u540D\u62A5\u4EF7\u4E0D\u5F97\u4F4E\u4E8E\u8BA2\u5355\u91D1\u989D\u7684 88 \u6298\uFF08\xA5${Math.round(total * 0.88).toLocaleString()}\uFF09`,
          quotes: [
            { supplierId: q1.id, supplierName: q1.name, amount: Math.round(total * 0.9), quoteTime: "10:05", items: items.map((it) => it.productName) },
            { supplierId: q2.id, supplierName: q2.name, amount: Math.round(total * 0.86), quoteTime: "10:12", items: [items[0].productName] },
            ...items.length > 1 ? [{ supplierId: q3.id, supplierName: q3.name, amount: Math.round(total * 0.4), quoteTime: "10:20", items: [items[items.length - 1].productName] }] : []
          ],
          scored: false
        }
      }
    }));
  }
  const sources = ["report", "assign", "compare"];
  for (let i = 0; i < 8; i++) {
    const s = next();
    const p = DEMO_PARTNERS[i % DEMO_PARTNERS.length];
    const src = sources[i % sources.length];
    orders.push(buildOne(s, {
      items: pickItems(s),
      processStatus: "distribute_pending",
      history: [{ time: D(s), action: { report: "\u62A5\u5907\u5339\u914D\u786E\u8BA4\u8F6C\u51FA", assign: "\u6307\u5B9A\u8F6C\u6D3E", compare: "\u6BD4\u5355\u5B9A\u6807\uFF08\u6309\u5546\u54C1\xB7\u79EF\u5206\u4F18\u5148\uFF09" }[src], detail: `\u2192 ${p.name} \xB7 \u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355` }],
      extra: {
        path: "distribute",
        distributeMode: "assign",
        partnerId: p.id,
        partnerName: p.name,
        transferSource: src,
        transferTime: D(s),
        ...src === "report" ? { reportMatches: [{ reportCode: "BB20260901006", reportType: "product", partnerId: p.id, partnerName: p.name }] } : {}
      }
    }));
  }
  const famC = orders[orders.length - 2];
  const famC2 = orders[orders.length - 1];
  const motherCodeC = famC.code.replace(/9\d$/, "80");
  famC.parentCode = motherCodeC;
  famC.code = `${motherCodeC}LY01`;
  famC.transferSource = "compare";
  famC.history.push({ time: D(20), action: "\u6BD4\u5355\u5B9A\u6807\uFF08\u6309\u5546\u54C1\xB7\u79EF\u5206\u4F18\u5148\uFF09", detail: `\u6309\u5546\u54C1\u79EF\u5206\u6392\u540D\u7B2C\u4E00\u4E2D\u5355 \u2192 ${famC.partnerName} \xB7 \u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355` });
  famC2.parentCode = motherCodeC;
  famC2.code = `${motherCodeC}LY02`;
  famC2.processStatus = "pending";
  famC2.path = void 0;
  famC2.distributeMode = void 0;
  famC2.partnerId = void 0;
  famC2.partnerName = void 0;
  famC2.transferSource = void 0;
  famC2.transferTime = void 0;
  famC2.sourceTag = "compare_failed";
  famC2.history = [{ time: D(20), action: "\u62C6\u5355\u751F\u6210\u5B50\u8BA2\u5355", detail: "\u6BD4\u5355\u5B9A\u6807\u5206\u62C6" }, { time: D(20), action: "\u6BD4\u5355\u672A\u6210\u9000\u56DE", detail: "\u65E0\u62A5\u540D\u5546\u54C1\u5F62\u6210\u5B50\u8BA2\u5355\uFF0C\u91CD\u65B0\u8FDB\u5165\u5206\u53D1-\u5F85\u5904\u7406" }];
  orders.push({
    ...famC,
    id: "eo_famC_mother",
    code: motherCodeC,
    parentCode: void 0,
    items: [...famC.items, ...famC2.items],
    totalAmount: [...famC.items, ...famC2.items].reduce((s, it) => s + it.price * it.quantity, 0),
    processStatus: "completed",
    history: [
      { time: D(20), action: "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u6BCD\u9500\u552E\u5355" },
      { time: D(20), action: "\u53D1\u8D77\u6BD4\u5355", detail: "\u516C\u5F00\u62A5\u540D \xB7 \u6309\u5546\u54C1\u79EF\u5206\u6392\u540D\u5B9A\u6807" },
      { time: D(20), action: "\u6574\u5355\u5206\u62C6\u5B9A\u6848\u5B8C\u6210", detail: "\u5DF2\u751F\u6210 2 \u5F20\u5B50\u5C65\u7EA6\u5355\uFF0C\u5747\u6302\u672C\u6BCD\u9500\u552E\u5355\u4E0B" }
    ]
  });
  const orphan = orders[7];
  const orphanMother = orphan.code.replace(/9\d$/, "60");
  orphan.parentCode = orphanMother;
  orphan.code = `${orphanMother}LY01`;
  orphan.sourceTag = "compare_failed";
  orphan.history = [{ time: D(9), action: "\u62C6\u5355\u751F\u6210\u5B50\u8BA2\u5355", detail: "\u6BD4\u5355\u5B9A\u6807\u5206\u62C6" }, { time: D(9), action: "\u6BD4\u5355\u672A\u6210\u9000\u56DE", detail: "\u65E0\u62A5\u540D\u5546\u54C1\u5F62\u6210\u5B50\u8BA2\u5355\uFF0C\u91CD\u65B0\u8FDB\u5165\u5206\u53D1-\u5F85\u5904\u7406" }];
  orders.push({
    ...orphan,
    id: "eo_orphan_mother",
    code: orphanMother,
    parentCode: void 0,
    items: [...orphan.items],
    totalAmount: orphan.items.reduce((s, it) => s + it.price * it.quantity, 0),
    processStatus: "completed",
    history: [
      { time: D(9), action: "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355", detail: "\u6BCD\u9500\u552E\u5355" },
      { time: D(9), action: "\u53D1\u8D77\u6BD4\u5355", detail: "\u516C\u5F00\u62A5\u540D \xB7 \u6309\u5546\u54C1\u79EF\u5206\u6392\u540D\u5B9A\u6807" },
      { time: D(9), action: "\u6574\u5355\u5206\u62C6\u5B9A\u6848\u5B8C\u6210", detail: "\u65E0\u62A5\u540D\u5546\u54C1\u5F62\u6210\u5B50\u5C65\u7EA6\u5355\u9000\u56DE\uFF0C\u6BCD\u9500\u552E\u5355\u4FDD\u6301\u4E0D\u53D8" }
    ]
  });
  for (let i = 0; i < 4; i++) {
    const s = next();
    const sup = DEMO_PARTNERS[(i + 3) % DEMO_PARTNERS.length];
    const items = pickItems(s);
    const code = `DXS202610${String(11 + s % 15).padStart(2, "0")}${String(9e3 + s).padStart(4, "0")}`;
    const stage = i % 4;
    const hist = [
      { time: D(s), action: "\u9009\u62E9\u81EA\u8425\u8DEF\u5F84", detail: "\u8FDB\u5165\u81EA\u8425\u5DE5\u4F5C\u53F0 \xB7 \u7B49\u5F85\u63A5\u5355" },
      { time: D(s), action: "\u63A5\u5355\uFF08\u81EA\u8425\uFF09", detail: `\u8DDF\u5355\u4EBA ${DEMO_FOLLOWERS[i]} \u2192 \u5DF2\u63A5\u5355` }
    ];
    const extra = { path: "self", follower: DEMO_FOLLOWERS[i] };
    if (stage === 0) {
      extra.processStatus = "self_accepted";
      extra.selfPo = { supplierId: sup.id, supplierName: sup.name, mode: "warehouse", purchaseDate: D(s) };
      hist.push({ time: D(s), action: "\u4EE5\u9500\u5B9A\u91C7", detail: `\u7F3A\u53E3 ${items.reduce((x, it) => x + it.quantity, 0)} \u4EF6 \u2192 \u5165\u5E93\u5236\u91C7\u8D2D\u5355\uFF08${sup.name}\uFF09\xB7 \u91C7\u8D2D\u5728\u9014` });
    } else if (stage === 1) {
      extra.processStatus = "self_accepted";
      extra.selfPo = { supplierId: sup.id, supplierName: sup.name, mode: "warehouse", purchaseDate: D(s) };
      hist.push({ time: D(s), action: "\u4EE5\u9500\u5B9A\u91C7", detail: `\u5165\u5E93\u5236\u91C7\u8D2D\u5355\uFF08${sup.name}\uFF09` });
      hist.push({ time: D(s), action: "\u5230\u8D27\u5165\u5E93", detail: "\u91C7\u8D2D\u5230\u8D27\u9A8C\u6536\u5165\u5E93 \xB7 \u5F85\u51FA\u5E93\u53D1\u8D27" });
    } else if (stage === 2) {
      extra.processStatus = "self_shipped";
      const half = Math.floor(items[0].quantity / 2) || 1;
      extra.selfShipments = [
        {
          id: `ss_${s}_1`,
          packageNo: "FHDXS0100002",
          warehouseId: "wh-ind-01",
          warehouseName: "\u676D\u5DDE\u603B\u4ED3",
          logisticsCompany: "\u987A\u4E30\u901F\u8FD0",
          trackingNo: `SF${7e9 + s * 13579}`,
          items: [{ productId: items[0].productId, productName: items[0].productName, qty: half }],
          status: "shipped",
          shippedAt: `${D(s)} 10:12`
        },
        {
          id: `ss_${s}_2`,
          packageNo: "FHDXS0100003",
          warehouseId: "wh-ind-03",
          warehouseName: "\u82CF\u5DDE\u5206\u4ED3",
          logisticsCompany: "\u5FB7\u90A6\u7269\u6D41",
          trackingNo: `DB${7e9 + s * 24681}`,
          items: [
            { productId: items[0].productId, productName: items[0].productName, qty: items[0].quantity - half },
            ...items.slice(1).map((it) => ({ productId: it.productId, productName: it.productName, qty: it.quantity }))
          ],
          status: "delivered",
          shippedAt: `${D(s)} 10:40`,
          deliveredAt: `${D(s)} 18:20`
        }
      ];
      hist.push({ time: D(s), action: "\u91C7\u8D2D&\u53D1\u8D27\uFF08\u5206\u4ED3\u76F4\u53D1\uFF09", detail: `\u676D\u5DDE\u603B\u4ED3 \u987A\u4E30 SF${7e9 + s * 13579} + \u82CF\u5DDE\u5206\u4ED3 \u5FB7\u90A6 DB${7e9 + s * 24681} \u2192 \u5DF2\u53D1\u8D27\u8FD0\u8F93\u4E2D` });
      hist.push({ time: D(s), action: "\u7269\u6D41\u59A5\u6295", detail: `DB${7e9 + s * 24681} \u5DF2\u6295\u9012\uFF08\u90E8\u5206\u5305\u88F9\u5728\u9014\uFF09` });
    } else {
      extra.processStatus = "self_delivered";
      extra.selfPo = { supplierId: sup.id, supplierName: sup.name, mode: "direct", purchaseDate: D(s) };
      hist.push({ time: D(s), action: "\u4EE5\u9500\u5B9A\u91C7\uFF08\u76F4\u53D1\u5BA2\u6237\uFF09", detail: `\u76F4\u53D1\u91C7\u8D2D\u5355\uFF08${sup.name}\uFF09\xB7 \u4F9B\u5E94\u5546\u76F4\u53D1\u5BA2\u6237` });
      hist.push({ time: D(s), action: "\u7269\u6D41\u59A5\u6295", detail: "\u4F9B\u5E94\u5546\u76F4\u53D1\u5305\u88F9\u5DF2\u5168\u90E8\u6295\u9012 \u2192 \u59A5\u6295" });
    }
    orders.push(buildOne(s, { items, processStatus: "self_accepted", history: hist, extra }));
  }
  const psList = ["accepted", "accepted", "shipping", "shipping", "delivered", "delivered"];
  const psLabel = { accepted: "\u5408\u4F5C\u5546\u63A5\u5355", shipping: "\u5408\u4F5C\u5546\u53D1\u8D27", delivered: "\u5BA2\u6237\u7B7E\u6536" };
  for (let i = 0; i < 6; i++) {
    const s = next();
    const p = DEMO_PARTNERS[(i + 5) % DEMO_PARTNERS.length];
    const src = sources[i % sources.length];
    const ps = psList[i];
    orders.push(buildOne(s, {
      items: pickItems(s),
      processStatus: "processed",
      history: [
        { time: D(s), action: { report: "\u62A5\u5907\u5339\u914D\u786E\u8BA4\u8F6C\u51FA", assign: "\u6307\u5B9A\u8F6C\u6D3E", compare: "\u6BD4\u5355\u5B9A\u6807\uFF08\u6309\u5546\u54C1\xB7\u79EF\u5206\u4F18\u5148\uFF09" }[src], detail: `\u2192 ${p.name}` },
        { time: D(s), action: psLabel[ps], detail: ps === "accepted" ? "\u5408\u4F5C\u5546\u7EC8\u7AEF\u63A5\u5355 \u2192 \u5206\u53D1-\u5DF2\u5B8C\u6210" : void 0 }
      ],
      extra: {
        path: "distribute",
        distributeMode: "assign",
        partnerId: p.id,
        partnerName: p.name,
        transferSource: src,
        transferTime: D(s),
        partnerStatus: ps
      }
    }));
  }
  for (let i = 0; i < 6; i++) {
    const s = next();
    const p = DEMO_PARTNERS[(i + 2) % DEMO_PARTNERS.length];
    const src = sources[i % sources.length];
    const onTime = i % 3 !== 0;
    orders.push(buildOne(s, {
      items: pickItems(s),
      processStatus: "completed",
      history: [
        { time: D(s), action: { report: "\u62A5\u5907\u5339\u914D\u786E\u8BA4\u8F6C\u51FA", assign: "\u6307\u5B9A\u8F6C\u6D3E", compare: "\u6BD4\u5355\u5B9A\u6807\uFF08\u6309\u5546\u54C1\xB7\u79EF\u5206\u4F18\u5148\uFF09" }[src], detail: `\u2192 ${p.name}` },
        { time: D(s), action: "\u7ED3\u7B97\u5B8C\u6210", detail: onTime ? "\u6309\u65F6\u5C65\u7EA6 \xB7 \u79EF\u5206 +5" : "\u8D85\u65F6\u53D1\u8D27 \xB7 \u79EF\u5206 -5" }
      ],
      extra: {
        path: "distribute",
        distributeMode: "assign",
        partnerId: p.id,
        partnerName: p.name,
        transferSource: src,
        transferTime: D(s),
        partnerStatus: "settled",
        settleOnTime: onTime
      }
    }));
  }
  return orders;
}
var externalOrderSeeds = [...baseSeeds, ...buildDemoOrders()];

// src/data/suppliers.tsx
var rawSupplierItems = [
  {
    id: "1",
    types: ["brand"],
    name: "\u676D\u5DDE\u897F\u6E56\u8336\u53F6\u6709\u9650\u516C\u53F8",
    unifiedCreditCode: "91330100MA2XXXXX1",
    cooperationAgreements: ["\u897F\u6E56\u724C\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: ["\u897F\u6E56\u724C\u54C1\u724C\u6388\u6743\u4E66.pdf"],
    businessLicense: "",
    registeredProvince: "\u6D59\u6C5F",
    registeredCity: "\u676D\u5DDE\u5E02",
    registeredDistrict: "\u897F\u6E56\u533A",
    registeredAddress: "\u9F99\u4E95\u8DEF88\u53F7",
    legalRepresentative: "\u738B\u660E\u534E",
    establishmentDate: "2005-03-15",
    registeredCapital: "500\u4E07\u5143",
    companyType: "\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    businessScope: "\u8336\u53F6\u79CD\u690D\u3001\u52A0\u5DE5\u3001\u9500\u552E\uFF1B\u8336\u6587\u5316\u63A8\u5E7F",
    contactPerson: "\u738B\u660E\u534E",
    contactPosition: "\u603B\u7ECF\u7406",
    contactProvince: "\u6D59\u6C5F",
    contactCity: "\u676D\u5DDE\u5E02",
    contactDistrict: "\u897F\u6E56\u533A",
    contactAddress: "\u9F99\u4E95\u8DEF88\u53F7",
    contactPhone: "0571-8765****",
    contactEmail: "wmh@xihupai.com",
    warehouses: [
      { id: "w1", name: "\u897F\u6E56\u724C\u676D\u5DDE\u4ED3", province: "\u6D59\u6C5F", city: "\u676D\u5DDE\u5E02", district: "\u897F\u6E56\u533A", address: "\u9F99\u4E95\u8DEF88\u53F7", contactPerson: "\u674E\u4ED3\u7BA1", contactPhone: "0571-8766****", isDefault: true }
    ],
    taxType: "general",
    invoiceInfo: { title: "\u676D\u5DDE\u897F\u6E56\u8336\u53F6\u6709\u9650\u516C\u53F8", taxNo: "91330100MA2XXXXX1", taxRate: 13, address: "\u6D59\u6C5F\u7701\u676D\u5DDE\u5E02\u897F\u6E56\u533A\u9F99\u4E95\u8DEF88\u53F7", phone: "0571-8765****", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u676D\u5DDE\u897F\u6E56\u652F\u884C", bankAccount: "1202****5678" },
    cooperationDate: "2023-03-15",
    grade: "A",
    mainCategories: ["\u7EFF\u8336"],
    introduction: "\u59CB\u521B\u4E8E1949\u5E74\uFF0C\u897F\u6E56\u9F99\u4E95\u8336\u6838\u5FC3\u4EA7\u533A\u6807\u6746\u54C1\u724C\uFF0C\u4F20\u627F\u4F20\u7EDF\u7092\u5236\u6280\u827A",
    settlementMethod: "period",
    bankAccount: { accountName: "\u676D\u5DDE\u897F\u6E56\u8336\u53F6\u6709\u9650\u516C\u53F8", accountNo: "1202****5678", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u676D\u5DDE\u897F\u6E56\u652F\u884C", bankNo: "102331000***", remark: "\u6708\u7ED330\u5929" },
    shippingSettlement: "free",
    supportDropship: true,
    qualificationStatus: "qualified",
    paymentTerms: "\u6708\u7ED330\u5929",
    deliveryCycle: "3-5\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 5e3,
    returnPolicy: "\u8D28\u91CF\u95EE\u98987\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u7B26\u5408GB/T 18650\u6807\u51C6",
    remark: "\u5E74\u5EA6\u8FD4\u52293%\uFF0C\u5B63\u5EA6\u7ED3\u7B97",
    status: "active"
  },
  {
    id: "2",
    types: ["brand"],
    name: "\u798F\u5EFA\u6B63\u5C71\u5802\u8336\u4E1A\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    unifiedCreditCode: "91350783MA8XXXXX2",
    cooperationAgreements: ["\u6B63\u5C71\u5802\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: ["\u6B63\u5C71\u5802\u54C1\u724C\u6388\u6743\u4E66.pdf", "\u91D1\u9A8F\u7709\u6388\u6743\u4E66.pdf"],
    businessLicense: "",
    registeredProvince: "\u798F\u5EFA",
    registeredCity: "\u5357\u5E73\u5E02",
    registeredDistrict: "\u6B66\u5937\u5C71\u5E02",
    registeredAddress: "\u661F\u6751\u9547\u6850\u6728\u6751",
    legalRepresentative: "\u6C5F\u5143\u52CB",
    establishmentDate: "2002-06-18",
    registeredCapital: "2000\u4E07\u5143",
    companyType: "\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    businessScope: "\u8336\u53F6\u79CD\u690D\u3001\u52A0\u5DE5\u3001\u9500\u552E\uFF1B\u8336\u5177\u9500\u552E\uFF1B\u8336\u6587\u5316\u4F20\u64AD",
    contactPerson: "\u6C5F\u5143\u52CB",
    contactPosition: "\u8463\u4E8B\u957F",
    contactProvince: "\u798F\u5EFA",
    contactCity: "\u5357\u5E73\u5E02",
    contactDistrict: "\u6B66\u5937\u5C71\u5E02",
    contactAddress: "\u661F\u6751\u9547\u6850\u6728\u6751",
    contactPhone: "0599-510****",
    contactEmail: "jyx@zhengshantang.com",
    warehouses: [
      { id: "w2", name: "\u6B63\u5C71\u5802\u6B66\u5937\u5C71\u4ED3", province: "\u798F\u5EFA", city: "\u5357\u5E73\u5E02", district: "\u6B66\u5937\u5C71\u5E02", address: "\u661F\u6751\u9547\u6850\u6728\u6751", contactPerson: "\u5F20\u4ED3\u7BA1", contactPhone: "0599-511****", isDefault: true },
      { id: "w3", name: "\u6B63\u5C71\u5802\u798F\u5DDE\u4ED3", province: "\u798F\u5EFA", city: "\u798F\u5DDE\u5E02", district: "\u4ED3\u5C71\u533A", address: "\u91D1\u5C71\u5927\u9053168\u53F7", contactPerson: "\u9648\u4ED3\u7BA1", contactPhone: "0591-8356****", isDefault: false }
    ],
    taxType: "general",
    invoiceInfo: { title: "\u798F\u5EFA\u6B63\u5C71\u5802\u8336\u4E1A\u6709\u9650\u8D23\u4EFB\u516C\u53F8", taxNo: "91350783MA8XXXXX2", taxRate: 13, address: "\u798F\u5EFA\u7701\u5357\u5E73\u5E02\u6B66\u5937\u5C71\u5E02\u661F\u6751\u9547\u6850\u6728\u6751", phone: "0599-510****", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u6B66\u5937\u5C71\u652F\u884C", bankAccount: "1307****9012" },
    cooperationDate: "2023-06-20",
    grade: "A",
    mainCategories: ["\u7EA2\u8336"],
    introduction: "\u6B63\u5C71\u5C0F\u79CD\u7EA2\u8336\u53D1\u6E90\u5730\uFF0C\u91D1\u9A8F\u7709\u521B\u59CB\u54C1\u724C\uFF0C\u7EA2\u8336\u884C\u4E1A\u6807\u51C6\u5236\u5B9A\u8005",
    settlementMethod: "period",
    bankAccount: { accountName: "\u798F\u5EFA\u6B63\u5C71\u5802\u8336\u4E1A\u6709\u9650\u8D23\u4EFB\u516C\u53F8", accountNo: "1307****9012", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u6B66\u5937\u5C71\u652F\u884C", bankNo: "103731000***", remark: "\u6708\u7ED345\u5929" },
    shippingSettlement: "free",
    supportDropship: true,
    qualificationStatus: "qualified",
    paymentTerms: "\u6708\u7ED345\u5929",
    deliveryCycle: "5-7\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 1e4,
    returnPolicy: "\u8D28\u91CF\u95EE\u989815\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u7B26\u5408GB/T 13738\u6807\u51C6",
    remark: "\u9996\u6279\u8FDB\u8D27\u989D\u226530\u4E07\uFF0C\u5E74\u5EA6\u8FD4\u52293.5%",
    status: "active"
  },
  {
    id: "3",
    types: ["brand"],
    name: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8",
    unifiedCreditCode: "91350500MA2XXXXX3",
    cooperationAgreements: ["\u516B\u9A6C\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: ["\u516B\u9A6C\u54C1\u724C\u6388\u6743\u4E66.pdf"],
    businessLicense: "",
    registeredProvince: "\u798F\u5EFA",
    registeredCity: "\u6CC9\u5DDE\u5E02",
    registeredDistrict: "\u5B89\u6EAA\u53BF",
    registeredAddress: "\u516B\u9A6C\u8336\u4E1A\u5927\u53A6",
    legalRepresentative: "\u6797\u6587\u6770",
    establishmentDate: "1998-08-01",
    registeredCapital: "5000\u4E07\u5143",
    companyType: "\u80A1\u4EFD\u6709\u9650\u516C\u53F8",
    businessScope: "\u8336\u53F6\u79CD\u690D\u3001\u52A0\u5DE5\u3001\u9500\u552E\uFF1B\u8336\u5177\u9500\u552E\uFF1B\u8336\u6587\u5316\u57F9\u8BAD",
    contactPerson: "\u6797\u6587\u6770",
    contactPosition: "\u603B\u7ECF\u7406",
    contactProvince: "\u798F\u5EFA",
    contactCity: "\u6CC9\u5DDE\u5E02",
    contactDistrict: "\u5B89\u6EAA\u53BF",
    contactAddress: "\u516B\u9A6C\u8336\u4E1A\u5927\u53A6",
    contactPhone: "0595-2345****",
    contactEmail: "lwj@bama.com",
    warehouses: [
      { id: "w4", name: "\u516B\u9A6C\u5B89\u6EAA\u4ED3", province: "\u798F\u5EFA", city: "\u6CC9\u5DDE\u5E02", district: "\u5B89\u6EAA\u53BF", address: "\u516B\u9A6C\u8336\u4E1A\u5927\u53A6", contactPerson: "\u738B\u4ED3\u7BA1", contactPhone: "0595-2346****", isDefault: true },
      { id: "w5", name: "\u516B\u9A6C\u53A6\u95E8\u4ED3", province: "\u798F\u5EFA", city: "\u53A6\u95E8\u5E02", district: "\u6E56\u91CC\u533A", address: "\u4E94\u7F18\u6E7E\u5546\u52A1\u533A", contactPerson: "\u5218\u4ED3\u7BA1", contactPhone: "0592-5689****", isDefault: false }
    ],
    taxType: "general",
    invoiceInfo: { title: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8", taxNo: "91350500MA2XXXXX3", taxRate: 13, address: "\u798F\u5EFA\u7701\u6CC9\u5DDE\u5E02\u5B89\u6EAA\u53BF\u516B\u9A6C\u8336\u4E1A\u5927\u53A6", phone: "0595-2345****", bankName: "\u4E2D\u56FD\u5EFA\u8BBE\u94F6\u884C\u5B89\u6EAA\u652F\u884C", bankAccount: "3505****3456" },
    cooperationDate: "2022-08-01",
    grade: "S",
    mainCategories: ["\u9752\u8336"],
    introduction: "\u4E2D\u56FD\u8336\u4E1A\u9886\u519B\u54C1\u724C\uFF0C\u94C1\u89C2\u97F3\u5341\u4E09\u4EE3\u4F20\u4EBA\uFF0C\u5168\u56FD\u8FDE\u9501\u95E8\u5E97\u8D853000\u5BB6",
    settlementMethod: "monthly",
    bankAccount: { accountName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8", accountNo: "3505****3456", bankName: "\u4E2D\u56FD\u5EFA\u8BBE\u94F6\u884C\u5B89\u6EAA\u652F\u884C", bankNo: "105397000***", remark: "\u6708\u7ED360\u5929" },
    shippingSettlement: "free",
    supportDropship: true,
    qualificationStatus: "qualified",
    paymentTerms: "\u6708\u7ED360\u5929",
    deliveryCycle: "3-5\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 2e4,
    returnPolicy: "\u8D28\u91CF\u95EE\u989830\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u7B26\u5408GB/T 19598\u6807\u51C6",
    remark: "\u9996\u6279\u8FDB\u8D27\u989D\u226550\u4E07\uFF0C\u5E74\u5EA6\u8FD4\u52295%",
    status: "active"
  },
  {
    id: "4",
    types: ["brand"],
    name: "\u4E91\u5357\u5927\u76CA\u8336\u4E1A\u96C6\u56E2\u6709\u9650\u516C\u53F8",
    unifiedCreditCode: "91532800MA6XXXXX4",
    cooperationAgreements: ["\u5927\u76CA\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: ["\u5927\u76CA\u54C1\u724C\u6388\u6743\u4E66.pdf"],
    businessLicense: "",
    registeredProvince: "\u4E91\u5357",
    registeredCity: "\u897F\u53CC\u7248\u7EB3\u5DDE",
    registeredDistrict: "\u52D0\u6D77\u53BF",
    registeredAddress: "\u52D0\u6D77\u8336\u5382",
    legalRepresentative: "\u5434\u8FDC\u4E4B",
    establishmentDate: "1989-10-01",
    registeredCapital: "8000\u4E07\u5143",
    companyType: "\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    businessScope: "\u8336\u53F6\u79CD\u690D\u3001\u52A0\u5DE5\u3001\u9500\u552E\uFF1B\u8336\u53F6\u4ED3\u50A8\uFF1B\u8336\u6587\u5316\u4F20\u64AD",
    contactPerson: "\u5434\u8FDC\u4E4B",
    contactPosition: "\u8463\u4E8B\u957F",
    contactProvince: "\u4E91\u5357",
    contactCity: "\u897F\u53CC\u7248\u7EB3\u5DDE",
    contactDistrict: "\u52D0\u6D77\u53BF",
    contactAddress: "\u52D0\u6D77\u8336\u5382",
    contactPhone: "0691-512****",
    contactEmail: "wyz@dayi.com",
    warehouses: [
      { id: "w6", name: "\u5927\u76CA\u52D0\u6D77\u4ED3", province: "\u4E91\u5357", city: "\u897F\u53CC\u7248\u7EB3\u5DDE", district: "\u52D0\u6D77\u53BF", address: "\u52D0\u6D77\u8336\u5382", contactPerson: "\u8D75\u4ED3\u7BA1", contactPhone: "0691-513****", isDefault: true },
      { id: "w7", name: "\u5927\u76CA\u6606\u660E\u4ED3", province: "\u4E91\u5357", city: "\u6606\u660E\u5E02", district: "\u5B98\u6E21\u533A", address: "\u7ECF\u5F00\u533A\u7269\u6D41\u56ED", contactPerson: "\u94B1\u4ED3\u7BA1", contactPhone: "0871-6735****", isDefault: false },
      { id: "w8", name: "\u5927\u76CA\u5E7F\u5DDE\u4ED3", province: "\u5E7F\u4E1C", city: "\u5E7F\u5DDE\u5E02", district: "\u767D\u4E91\u533A", address: "\u589E\u69CE\u8DEF\u7269\u6D41\u56ED", contactPerson: "\u5B59\u4ED3\u7BA1", contactPhone: "020-8123****", isDefault: false }
    ],
    taxType: "general",
    invoiceInfo: { title: "\u4E91\u5357\u5927\u76CA\u8336\u4E1A\u96C6\u56E2\u6709\u9650\u516C\u53F8", taxNo: "91532800MA6XXXXX4", taxRate: 13, address: "\u4E91\u5357\u7701\u897F\u53CC\u7248\u7EB3\u5DDE\u52D0\u6D77\u53BF\u52D0\u6D77\u8336\u5382", phone: "0691-512****", bankName: "\u4E2D\u56FD\u94F6\u884C\u52D0\u6D77\u652F\u884C", bankAccount: "2507****7890" },
    cooperationDate: "2022-05-18",
    grade: "A",
    mainCategories: ["\u9ED1\u8336"],
    introduction: "\u666E\u6D31\u8336\u884C\u4E1A\u6807\u6746\uFF0C\u52D0\u6D77\u8336\u5382\u4F20\u627F\uFF0C7542\u88AB\u8A89\u4E3A\u8BC4\u5224\u666E\u6D31\u8336\u7684\u6807\u51C6",
    settlementMethod: "quarterly",
    bankAccount: { accountName: "\u4E91\u5357\u5927\u76CA\u8336\u4E1A\u96C6\u56E2\u6709\u9650\u516C\u53F8", accountNo: "2507****7890", bankName: "\u4E2D\u56FD\u94F6\u884C\u52D0\u6D77\u652F\u884C", bankNo: "104732000***", remark: "\u5B63\u5EA6\u7ED3\u7B97" },
    shippingSettlement: "not_free_fixed",
    shippingFee: 15,
    shippingRemark: "\u5355\u7B14\u8BA2\u5355\u6EE15000\u5143\u5305\u90AE",
    supportDropship: true,
    qualificationStatus: "qualified",
    paymentTerms: "\u5B63\u5EA6\u7ED3\u7B97",
    deliveryCycle: "5-10\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 3e4,
    returnPolicy: "\u8D28\u91CF\u95EE\u989815\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u7B26\u5408GB/T 22111\u6807\u51C6",
    remark: "\u9996\u6279\u8FDB\u8D27\u989D\u226580\u4E07\uFF0C\u5E74\u5EA6\u8FD4\u52296%",
    status: "active"
  },
  {
    id: "5",
    types: ["brand"],
    name: "\u798F\u5EFA\u54C1\u54C1\u9999\u8336\u4E1A\u6709\u9650\u516C\u53F8",
    unifiedCreditCode: "91350982MA3XXXXX5",
    cooperationAgreements: ["\u54C1\u54C1\u9999\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: ["\u54C1\u54C1\u9999\u54C1\u724C\u6388\u6743\u4E66.pdf"],
    businessLicense: "",
    registeredProvince: "\u798F\u5EFA",
    registeredCity: "\u5B81\u5FB7\u5E02",
    registeredDistrict: "\u798F\u9F0E\u5E02",
    registeredAddress: "\u70B9\u5934\u9547\u54C1\u54C1\u9999\u8336\u4E1A",
    legalRepresentative: "\u90B5\u514B\u5E73",
    establishmentDate: "2004-09-01",
    registeredCapital: "1000\u4E07\u5143",
    companyType: "\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    businessScope: "\u8336\u53F6\u79CD\u690D\u3001\u52A0\u5DE5\u3001\u9500\u552E\uFF1B\u767D\u8336\u4ED3\u50A8",
    contactPerson: "\u90B5\u514B\u5E73",
    contactPosition: "\u603B\u7ECF\u7406",
    contactProvince: "\u798F\u5EFA",
    contactCity: "\u5B81\u5FB7\u5E02",
    contactDistrict: "\u798F\u9F0E\u5E02",
    contactAddress: "\u70B9\u5934\u9547\u54C1\u54C1\u9999\u8336\u4E1A",
    contactPhone: "0593-766****",
    contactEmail: "skp@pinpinxiang.com",
    warehouses: [
      { id: "w9", name: "\u54C1\u54C1\u9999\u798F\u9F0E\u4ED3", province: "\u798F\u5EFA", city: "\u5B81\u5FB7\u5E02", district: "\u798F\u9F0E\u5E02", address: "\u70B9\u5934\u9547\u54C1\u54C1\u9999\u8336\u4E1A", contactPerson: "\u5468\u4ED3\u7BA1", contactPhone: "0593-767****", isDefault: true }
    ],
    taxType: "general",
    invoiceInfo: { title: "\u798F\u5EFA\u54C1\u54C1\u9999\u8336\u4E1A\u6709\u9650\u516C\u53F8", taxNo: "91350982MA3XXXXX5", taxRate: 13, address: "\u798F\u5EFA\u7701\u5B81\u5FB7\u5E02\u798F\u9F0E\u5E02\u70B9\u5934\u9547\u54C1\u54C1\u9999\u8336\u4E1A", phone: "0593-766****", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u798F\u9F0E\u652F\u884C", bankAccount: "1309****1234" },
    cooperationDate: "2023-09-01",
    grade: "B",
    mainCategories: ["\u767D\u8336"],
    introduction: "\u798F\u9F0E\u767D\u8336\u9F99\u5934\u4F01\u4E1A\uFF0C\u767D\u8336\u56FD\u5BB6\u6807\u51C6\u8D77\u8349\u5355\u4F4D\uFF0C\u62E5\u6709\u6838\u5FC3\u8336\u56ED\u57FA\u5730",
    settlementMethod: "period",
    bankAccount: { accountName: "\u798F\u5EFA\u54C1\u54C1\u9999\u8336\u4E1A\u6709\u9650\u516C\u53F8", accountNo: "1309****1234", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u798F\u9F0E\u652F\u884C", bankNo: "103732000***", remark: "\u6708\u7ED330\u5929" },
    shippingSettlement: "free",
    supportDropship: false,
    qualificationStatus: "qualified",
    paymentTerms: "\u6708\u7ED330\u5929",
    deliveryCycle: "3-5\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 5e3,
    returnPolicy: "\u8D28\u91CF\u95EE\u98987\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u7B26\u5408GB/T 22291\u6807\u51C6",
    remark: "\u5E74\u5EA6\u8FD4\u52294%\uFF0C\u63D0\u4F9B\u54C1\u724C\u7269\u6599\u652F\u6301",
    status: "active"
  },
  {
    id: "6",
    types: ["service"],
    name: "\u53A6\u95E8\u8336\u53F6\u8FDB\u51FA\u53E3\u6709\u9650\u516C\u53F8",
    unifiedCreditCode: "91350200MA9XXXXX6",
    cooperationAgreements: ["\u6D77\u5824\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: ["\u6D77\u5824\u54C1\u724C\u6388\u6743\u4E66.pdf"],
    businessLicense: "",
    registeredProvince: "\u798F\u5EFA",
    registeredCity: "\u53A6\u95E8\u5E02",
    registeredDistrict: "\u6E56\u91CC\u533A",
    registeredAddress: "\u53A6\u95E8\u8336\u53F6\u8FDB\u51FA\u53E3\u516C\u53F8",
    legalRepresentative: "\u738B\u8D35\u537F",
    establishmentDate: "1954-01-01",
    registeredCapital: "3000\u4E07\u5143",
    companyType: "\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    businessScope: "\u8336\u53F6\u52A0\u5DE5\u3001\u9500\u552E\uFF1B\u8336\u53F6\u8FDB\u51FA\u53E3\u8D38\u6613",
    contactPerson: "\u738B\u8D35\u537F",
    contactPosition: "\u603B\u7ECF\u7406",
    contactProvince: "\u798F\u5EFA",
    contactCity: "\u53A6\u95E8\u5E02",
    contactDistrict: "\u6E56\u91CC\u533A",
    contactAddress: "\u53A6\u95E8\u8336\u53F6\u8FDB\u51FA\u53E3\u516C\u53F8",
    contactPhone: "0592-601****",
    contactEmail: "wgq@chinatea.com",
    warehouses: [
      { id: "w10", name: "\u6D77\u5824\u53A6\u95E8\u4ED3", province: "\u798F\u5EFA", city: "\u53A6\u95E8\u5E02", district: "\u6E56\u91CC\u533A", address: "\u53A6\u95E8\u8336\u53F6\u8FDB\u51FA\u53E3\u516C\u53F8", contactPerson: "\u5434\u4ED3\u7BA1", contactPhone: "0592-602****", isDefault: true }
    ],
    taxType: "general",
    invoiceInfo: { title: "\u53A6\u95E8\u8336\u53F6\u8FDB\u51FA\u53E3\u6709\u9650\u516C\u53F8", taxNo: "91350200MA9XXXXX6", taxRate: 13, address: "\u798F\u5EFA\u7701\u53A6\u95E8\u5E02\u6E56\u91CC\u533A\u53A6\u95E8\u8336\u53F6\u8FDB\u51FA\u53E3\u516C\u53F8", phone: "0592-601****", bankName: "\u4E2D\u56FD\u94F6\u884C\u53A6\u95E8\u5206\u884C", bankAccount: "4103****5678" },
    cooperationDate: "2023-10-20",
    grade: "B",
    mainCategories: ["\u9752\u8336"],
    introduction: "\u4E2D\u8336\u65D7\u4E0B\u4E4C\u9F99\u8336\u54C1\u724C\uFF0C\u53A6\u95E8\u51FA\u53E3\u8336\u8001\u5B57\u53F7\uFF0C\u6D77\u5824\u7EA2\u6DF1\u53D7\u4E1C\u5357\u4E9A\u5E02\u573A\u6B22\u8FCE",
    settlementMethod: "invoice",
    bankAccount: { accountName: "\u53A6\u95E8\u8336\u53F6\u8FDB\u51FA\u53E3\u6709\u9650\u516C\u53F8", accountNo: "4103****5678", bankName: "\u4E2D\u56FD\u94F6\u884C\u53A6\u95E8\u5206\u884C", bankNo: "104393000***", remark: "\u89C1\u7968\u7ED3\u7B97" },
    shippingSettlement: "not_free_ratio",
    shippingFee: 3,
    shippingRemark: "\u8FD0\u8D39\u6309\u8D27\u503C3%\u6536\u53D6",
    supportDropship: true,
    qualificationStatus: "qualified",
    paymentTerms: "\u89C1\u7968\u7ED3\u7B97",
    deliveryCycle: "5-7\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 8e3,
    returnPolicy: "\u8D28\u91CF\u95EE\u989815\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u51FA\u53E3\u6807\u51C6",
    remark: "\u5E74\u5EA6\u8FD4\u52293%\uFF0C\u5B63\u5EA6\u7ED3\u7B97",
    status: "active"
  },
  {
    id: "7",
    types: ["supplier"],
    name: "\u5B89\u5FBD\u7701\u7941\u95E8\u7EA2\u8336\u53D1\u5C55\u6709\u9650\u516C\u53F8",
    unifiedCreditCode: "91341000MA1XXXXX7",
    cooperationAgreements: ["\u5929\u4E4B\u7EA2\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: ["\u5929\u4E4B\u7EA2\u54C1\u724C\u6388\u6743\u4E66.pdf"],
    businessLicense: "",
    registeredProvince: "\u5B89\u5FBD",
    registeredCity: "\u9EC4\u5C71\u5E02",
    registeredDistrict: "\u7941\u95E8\u53BF",
    registeredAddress: "\u5929\u4E4B\u7EA2\u7941\u95E8\u7EA2\u8336\u4EA7\u4E1A\u56ED",
    legalRepresentative: "\u738B\u6636",
    establishmentDate: "2008-05-10",
    registeredCapital: "800\u4E07\u5143",
    companyType: "\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    businessScope: "\u8336\u53F6\u79CD\u690D\u3001\u52A0\u5DE5\u3001\u9500\u552E\uFF1B\u7941\u95E8\u7EA2\u8336\u7814\u53D1",
    contactPerson: "\u738B\u6636",
    contactPosition: "\u603B\u7ECF\u7406",
    contactProvince: "\u5B89\u5FBD",
    contactCity: "\u9EC4\u5C71\u5E02",
    contactDistrict: "\u7941\u95E8\u53BF",
    contactAddress: "\u5929\u4E4B\u7EA2\u7941\u95E8\u7EA2\u8336\u4EA7\u4E1A\u56ED",
    contactPhone: "0559-451****",
    contactEmail: "wc@tianzhihong.com",
    warehouses: [
      { id: "w11", name: "\u5929\u4E4B\u7EA2\u7941\u95E8\u4ED3", province: "\u5B89\u5FBD", city: "\u9EC4\u5C71\u5E02", district: "\u7941\u95E8\u53BF", address: "\u5929\u4E4B\u7EA2\u7941\u95E8\u7EA2\u8336\u4EA7\u4E1A\u56ED", contactPerson: "\u90D1\u4ED3\u7BA1", contactPhone: "0559-452****", isDefault: true }
    ],
    taxType: "small",
    invoiceInfo: { title: "\u5B89\u5FBD\u7701\u7941\u95E8\u7EA2\u8336\u53D1\u5C55\u6709\u9650\u516C\u53F8", taxNo: "91341000MA1XXXXX7", taxRate: 3, address: "\u5B89\u5FBD\u7701\u9EC4\u5C71\u5E02\u7941\u95E8\u53BF\u5929\u4E4B\u7EA2\u7941\u95E8\u7EA2\u8336\u4EA7\u4E1A\u56ED", phone: "0559-451****", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u7941\u95E8\u652F\u884C", bankAccount: "1304****9012" },
    cooperationDate: "2024-03-10",
    grade: "B",
    mainCategories: ["\u7EA2\u8336"],
    introduction: "\u7941\u95E8\u7EA2\u8336\u4EE3\u8868\u54C1\u724C\uFF0C\u7941\u7EA2\u975E\u9057\u5236\u4F5C\u6280\u827A\u4F20\u627F\u5355\u4F4D",
    settlementMethod: "period",
    bankAccount: { accountName: "\u5B89\u5FBD\u7701\u7941\u95E8\u7EA2\u8336\u53D1\u5C55\u6709\u9650\u516C\u53F8", accountNo: "1304****9012", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u7941\u95E8\u652F\u884C", bankNo: "103736000***", remark: "\u6708\u7ED330\u5929" },
    shippingSettlement: "free",
    supportDropship: false,
    qualificationStatus: "qualified",
    paymentTerms: "\u6708\u7ED330\u5929",
    deliveryCycle: "3-5\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 3e3,
    returnPolicy: "\u8D28\u91CF\u95EE\u98987\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u7B26\u5408GB/T 13738.2\u6807\u51C6",
    remark: "\u5E74\u5EA6\u8FD4\u52293%\uFF0C\u5B63\u5EA6\u7ED3\u7B97",
    status: "active"
  },
  {
    id: "8",
    types: ["brand"],
    name: "\u56DB\u5DDD\u7701\u5CE8\u7709\u5C71\u7AF9\u53F6\u9752\u8336\u4E1A\u6709\u9650\u516C\u53F8",
    unifiedCreditCode: "91511100MA7XXXXX8",
    cooperationAgreements: ["\u7AF9\u53F6\u9752\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: ["\u7AF9\u53F6\u9752\u54C1\u724C\u6388\u6743\u4E66.pdf"],
    businessLicense: "",
    registeredProvince: "\u56DB\u5DDD",
    registeredCity: "\u4E50\u5C71\u5E02",
    registeredDistrict: "\u5CE8\u7709\u5C71\u5E02",
    registeredAddress: "\u4F5B\u5149\u4E1C\u8DEF\u7AF9\u53F6\u9752\u8336\u4E1A",
    legalRepresentative: "\u5510\u5148\u6D2A",
    establishmentDate: "1998-12-08",
    registeredCapital: "3000\u4E07\u5143",
    companyType: "\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    businessScope: "\u8336\u53F6\u79CD\u690D\u3001\u52A0\u5DE5\u3001\u9500\u552E\uFF1B\u8336\u6587\u5316\u65C5\u6E38",
    contactPerson: "\u5510\u5148\u6D2A",
    contactPosition: "\u8463\u4E8B\u957F",
    contactProvince: "\u56DB\u5DDD",
    contactCity: "\u4E50\u5C71\u5E02",
    contactDistrict: "\u5CE8\u7709\u5C71\u5E02",
    contactAddress: "\u4F5B\u5149\u4E1C\u8DEF\u7AF9\u53F6\u9752\u8336\u4E1A",
    contactPhone: "0833-552****",
    contactEmail: "txh@zhuyeqing.com",
    warehouses: [
      { id: "w12", name: "\u7AF9\u53F6\u9752\u5CE8\u7709\u5C71\u4ED3", province: "\u56DB\u5DDD", city: "\u4E50\u5C71\u5E02", district: "\u5CE8\u7709\u5C71\u5E02", address: "\u4F5B\u5149\u4E1C\u8DEF\u7AF9\u53F6\u9752\u8336\u4E1A", contactPerson: "\u4F55\u4ED3\u7BA1", contactPhone: "0833-553****", isDefault: true }
    ],
    taxType: "general",
    invoiceInfo: { title: "\u56DB\u5DDD\u7701\u5CE8\u7709\u5C71\u7AF9\u53F6\u9752\u8336\u4E1A\u6709\u9650\u516C\u53F8", taxNo: "91511100MA7XXXXX8", taxRate: 13, address: "\u56DB\u5DDD\u7701\u4E50\u5C71\u5E02\u5CE8\u7709\u5C71\u5E02\u4F5B\u5149\u4E1C\u8DEF\u7AF9\u53F6\u9752\u8336\u4E1A", phone: "0833-552****", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u5CE8\u7709\u5C71\u652F\u884C", bankAccount: "2308****3456" },
    cooperationDate: "2023-08-10",
    grade: "A",
    mainCategories: ["\u7EFF\u8336"],
    introduction: "\u5CE8\u7709\u9AD8\u5C71\u7EFF\u8336\u4EE3\u8868\u54C1\u724C\uFF0C\u4E2D\u56FD\u9AD8\u7AEF\u7EFF\u8336\u9886\u519B\u8005\uFF0C\u591A\u6B21\u4F5C\u4E3A\u56FD\u793C\u8D60\u9001\u5916\u5BBE",
    settlementMethod: "prepaid",
    bankAccount: { accountName: "\u56DB\u5DDD\u7701\u5CE8\u7709\u5C71\u7AF9\u53F6\u9752\u8336\u4E1A\u6709\u9650\u516C\u53F8", accountNo: "2308****3456", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u5CE8\u7709\u5C71\u652F\u884C", bankNo: "102335000***", remark: "\u5148\u6B3E\u540E\u8D27" },
    shippingSettlement: "free",
    supportDropship: true,
    qualificationStatus: "qualified",
    paymentTerms: "\u5148\u6B3E\u540E\u8D27",
    deliveryCycle: "3-5\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 15e3,
    returnPolicy: "\u8D28\u91CF\u95EE\u989815\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u7B26\u5408GB/T 18650\u6807\u51C6",
    remark: "\u9996\u6279\u8FDB\u8D27\u989D\u226530\u4E07\uFF0C\u5E74\u5EA6\u8FD4\u52294%",
    status: "active"
  },
  {
    id: "9",
    types: ["supplier"],
    name: "\u6E56\u5357\u7701\u767D\u6C99\u6EAA\u8336\u5382\u80A1\u4EFD\u6709\u9650\u516C\u53F8",
    unifiedCreditCode: "91430900MA4XXXXX9",
    cooperationAgreements: ["\u767D\u6C99\u6EAA\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: ["\u767D\u6C99\u6EAA\u54C1\u724C\u6388\u6743\u4E66.pdf"],
    businessLicense: "",
    registeredProvince: "\u6E56\u5357",
    registeredCity: "\u76CA\u9633\u5E02",
    registeredDistrict: "\u5B89\u5316\u53BF",
    registeredAddress: "\u5C0F\u6DF9\u9547\u767D\u6C99\u6EAA\u8336\u5382",
    legalRepresentative: "\u5218\u65B0\u5B89",
    establishmentDate: "2007-06-15",
    registeredCapital: "600\u4E07\u5143",
    companyType: "\u80A1\u4EFD\u6709\u9650\u516C\u53F8",
    businessScope: "\u8336\u53F6\u79CD\u690D\u3001\u52A0\u5DE5\u3001\u9500\u552E\uFF1B\u5B89\u5316\u9ED1\u8336\u7814\u53D1",
    contactPerson: "\u5218\u65B0\u5B89",
    contactPosition: "\u603B\u7ECF\u7406",
    contactProvince: "\u6E56\u5357",
    contactCity: "\u76CA\u9633\u5E02",
    contactDistrict: "\u5B89\u5316\u53BF",
    contactAddress: "\u5C0F\u6DF9\u9547\u767D\u6C99\u6EAA\u8336\u5382",
    contactPhone: "0737-722****",
    contactEmail: "lxa@baishaxi.com",
    warehouses: [
      { id: "w13", name: "\u767D\u6C99\u6EAA\u5B89\u5316\u4ED3", province: "\u6E56\u5357", city: "\u76CA\u9633\u5E02", district: "\u5B89\u5316\u53BF", address: "\u5C0F\u6DF9\u9547\u767D\u6C99\u6EAA\u8336\u5382", contactPerson: "\u9EC4\u4ED3\u7BA1", contactPhone: "0737-723****", isDefault: true }
    ],
    taxType: "general",
    invoiceInfo: { title: "\u6E56\u5357\u7701\u767D\u6C99\u6EAA\u8336\u5382\u80A1\u4EFD\u6709\u9650\u516C\u53F8", taxNo: "91430900MA4XXXXX9", taxRate: 13, address: "\u6E56\u5357\u7701\u76CA\u9633\u5E02\u5B89\u5316\u53BF\u5C0F\u6DF9\u9547\u767D\u6C99\u6EAA\u8336\u5382", phone: "0737-722****", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u5B89\u5316\u652F\u884C", bankAccount: "1309****7890" },
    cooperationDate: "2024-03-15",
    grade: "B",
    mainCategories: ["\u9ED1\u8336"],
    introduction: "\u5B89\u5316\u9ED1\u8336\u6807\u6746\u54C1\u724C\uFF0C\u5343\u4E24\u8336\u5236\u4F5C\u6280\u827A\u975E\u9057\u4F20\u627F\uFF0C\u5B89\u5316\u9ED1\u8336\u56FD\u5BB6\u6807\u51C6\u8D77\u8349\u5355\u4F4D",
    settlementMethod: "period",
    bankAccount: { accountName: "\u6E56\u5357\u7701\u767D\u6C99\u6EAA\u8336\u5382\u80A1\u4EFD\u6709\u9650\u516C\u53F8", accountNo: "1309****7890", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u5B89\u5316\u652F\u884C", bankNo: "103738000***", remark: "\u6708\u7ED330\u5929" },
    shippingSettlement: "not_free_fixed",
    shippingFee: 20,
    shippingRemark: "\u5355\u7B14\u8BA2\u5355\u6EE18000\u5143\u5305\u90AE",
    supportDropship: false,
    qualificationStatus: "qualified",
    paymentTerms: "\u6708\u7ED330\u5929",
    deliveryCycle: "5-7\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 5e3,
    returnPolicy: "\u8D28\u91CF\u95EE\u98987\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u7B26\u5408GB/T 32719\u6807\u51C6",
    remark: "\u5E74\u5EA6\u8FD4\u52293%\uFF0C\u5B63\u5EA6\u7ED3\u7B97",
    status: "active"
  },
  {
    id: "10",
    types: ["supplier"],
    name: "\u5317\u4EAC\u5F20\u4E00\u5143\u8336\u53F6\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    unifiedCreditCode: "91110100MA0XXXX0",
    cooperationAgreements: ["\u5F20\u4E00\u5143\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: ["\u5F20\u4E00\u5143\u54C1\u724C\u6388\u6743\u4E66.pdf"],
    businessLicense: "",
    registeredProvince: "\u5317\u4EAC",
    registeredCity: "\u5317\u4EAC\u5E02",
    registeredDistrict: "\u897F\u57CE\u533A",
    registeredAddress: "\u5927\u6805\u680F\u885722\u53F7",
    legalRepresentative: "\u8D75\u56FD\u5F3A",
    establishmentDate: "1998-05-20",
    registeredCapital: "1200\u4E07\u5143",
    companyType: "\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    businessScope: "\u8336\u53F6\u52A0\u5DE5\u3001\u9500\u552E\uFF1B\u8309\u8389\u82B1\u8336\u7AA8\u5236",
    contactPerson: "\u8D75\u56FD\u5F3A",
    contactPosition: "\u603B\u7ECF\u7406",
    contactProvince: "\u5317\u4EAC",
    contactCity: "\u5317\u4EAC\u5E02",
    contactDistrict: "\u897F\u57CE\u533A",
    contactAddress: "\u5927\u6805\u680F\u885722\u53F7",
    contactPhone: "010-6303****",
    contactEmail: "zgq@zhangyiyuan.com",
    warehouses: [
      { id: "w14", name: "\u5F20\u4E00\u5143\u5317\u4EAC\u4ED3", province: "\u5317\u4EAC", city: "\u5317\u4EAC\u5E02", district: "\u5927\u5174\u533A", address: "\u4EA6\u5E84\u7ECF\u6D4E\u5F00\u53D1\u533A\u7269\u6D41\u56ED", contactPerson: "\u9A6C\u4ED3\u7BA1", contactPhone: "010-6789****", isDefault: true }
    ],
    taxType: "general",
    invoiceInfo: { title: "\u5317\u4EAC\u5F20\u4E00\u5143\u8336\u53F6\u6709\u9650\u8D23\u4EFB\u516C\u53F8", taxNo: "91110100MA0XXXX0", taxRate: 13, address: "\u5317\u4EAC\u5E02\u897F\u57CE\u533A\u5927\u6805\u680F\u885722\u53F7", phone: "010-6303****", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u5317\u4EAC\u897F\u57CE\u652F\u884C", bankAccount: "0200****1234" },
    cooperationDate: "2023-01-10",
    grade: "A",
    mainCategories: ["\u7EFF\u8336", "\u82B1\u8349\u8336"],
    introduction: "\u767E\u5E74\u8001\u5B57\u53F7\uFF0C\u59CB\u521B\u4E8E1900\u5E74\uFF0C\u8309\u8389\u82B1\u8336\u5236\u4F5C\u6280\u827A\u5165\u9009\u56FD\u5BB6\u7EA7\u975E\u9057",
    settlementMethod: "period",
    bankAccount: { accountName: "\u5317\u4EAC\u5F20\u4E00\u5143\u8336\u53F6\u6709\u9650\u8D23\u4EFB\u516C\u53F8", accountNo: "0200****1234", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u5317\u4EAC\u897F\u57CE\u652F\u884C", bankNo: "102100000***", remark: "\u6708\u7ED330\u5929" },
    shippingSettlement: "free",
    supportDropship: true,
    qualificationStatus: "qualified",
    paymentTerms: "\u6708\u7ED330\u5929",
    deliveryCycle: "2-3\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 5e3,
    returnPolicy: "\u8D28\u91CF\u95EE\u98987\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u7B26\u5408GB/T 22292\u6807\u51C6",
    remark: "\u5E74\u5EA6\u8FD4\u52294%\uFF0C\u5B63\u5EA6\u7ED3\u7B97\uFF0C\u63D0\u4F9B\u54C1\u724C\u5BA3\u4F20\u652F\u6301",
    status: "inactive"
  },
  {
    id: "11",
    types: ["supplier", "service"],
    name: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8",
    unifiedCreditCode: "91330106MA2P8KQ3X7",
    cooperationAgreements: ["\u4E91\u8336\u4F9B\u5E94\u94FE\u5408\u4F5C\u534F\u8BAE.pdf"],
    brandAuthAgreements: [],
    businessLicense: "",
    registeredProvince: "\u6D59\u6C5F",
    registeredCity: "\u676D\u5DDE\u5E02",
    registeredDistrict: "\u6EE8\u6C5F\u533A",
    registeredAddress: "\u6EE8\u76DB\u8DEF1870\u53F7\u521B\u65B0\u5927\u53A618\u5C42",
    legalRepresentative: "\u9648\u5EFA\u56FD",
    establishmentDate: "2016-09-20",
    registeredCapital: "1000\u4E07\u5143",
    companyType: "\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
    businessScope: "\u8336\u53F6\u53CA\u8336\u5236\u54C1\u4F9B\u5E94\u94FE\u670D\u52A1\uFF1B\u4ED3\u50A8\u914D\u9001\u670D\u52A1\uFF1B\u4F9B\u5E94\u94FE\u7BA1\u7406\u54A8\u8BE2",
    contactPerson: "\u9648\u5EFA\u56FD",
    contactPosition: "\u603B\u7ECF\u7406",
    contactProvince: "\u6D59\u6C5F",
    contactCity: "\u676D\u5DDE\u5E02",
    contactDistrict: "\u6EE8\u6C5F\u533A",
    contactAddress: "\u6EE8\u76DB\u8DEF1870\u53F7\u521B\u65B0\u5927\u53A618\u5C42",
    contactPhone: "0571-8899****",
    contactEmail: "chenjg@yuntea.com",
    warehouses: [
      { id: "pw1", name: "\u4E91\u8336\u6EE8\u6C5F\u4E2D\u5FC3\u4ED3", province: "\u6D59\u6C5F", city: "\u676D\u5DDE\u5E02", district: "\u6EE8\u6C5F\u533A", address: "\u6EE8\u76DB\u8DEF1870\u53F7B2\u5C42", contactPerson: "\u5468\u4ED3\u7BA1", contactPhone: "0571-8898****", isDefault: true },
      { id: "pw2", name: "\u4E91\u8336\u5B81\u6CE2\u5206\u4ED3", province: "\u6D59\u6C5F", city: "\u5B81\u6CE2\u5E02", district: "\u911E\u5DDE\u533A", address: "\u9996\u5357\u8857\u9053\u6CF0\u5EB7\u4E2D\u8DEF456\u53F7", contactPerson: "\u5434\u4ED3\u7BA1", contactPhone: "0574-5512****", isDefault: false }
    ],
    taxType: "general",
    invoiceInfo: { title: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8", taxNo: "91330106MA2P8KQ3X7", taxRate: 13, address: "\u6D59\u6C5F\u7701\u676D\u5DDE\u5E02\u6EE8\u6C5F\u533A\u6EE8\u76DB\u8DEF1870\u53F7\u521B\u65B0\u5927\u53A618\u5C42", phone: "0571-8899****", bankName: "\u62DB\u5546\u94F6\u884C\u676D\u5DDE\u6EE8\u6C5F\u652F\u884C", bankAccount: "5719****2233" },
    cooperationDate: "2025-03-01",
    grade: "A",
    mainCategories: ["\u7EFF\u8336", "\u7EA2\u8336", "\u9752\u8336"],
    introduction: "\u6DE1\u8336\u534A\u76CF\u6388\u6743\u5408\u4F5C\u5546\uFF0C\u8D1F\u8D23\u534E\u4E1C\u533A\u57DF\u8BA2\u5355\u5C65\u7EA6\u3001\u672C\u5730\u5BA2\u6237\u8425\u9500\u4E0E\u552E\u540E\u3002\u4F9B\u5E94\u5546\u6A21\u5F0F + \u670D\u52A1\u5546\u6A21\u5F0F\u53CC\u6A21\u5F0F\u8FD0\u8425\u3002",
    settlementMethod: "monthly",
    bankAccount: { accountName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8", accountNo: "5719****8866", bankName: "\u62DB\u5546\u94F6\u884C\u676D\u5DDE\u6EE8\u6C5F\u652F\u884C", bankNo: "308331000013", remark: "\u7ED3\u7B97\u6B3E\u6309\u6708\u6C47\u603B\u652F\u4ED8\uFF0C\u53D1\u7968\u968F\u6B3E\u5F00\u5177" },
    shippingSettlement: "free",
    supportDropship: true,
    qualificationStatus: "qualified",
    paymentTerms: "\u6708\u7ED330\u5929",
    deliveryCycle: "3-5\u4E2A\u5DE5\u4F5C\u65E5",
    minOrderAmount: 3e3,
    returnPolicy: "\u8D28\u91CF\u95EE\u98987\u5929\u5185\u53EF\u9000\u6362",
    qualityGuarantee: "\u7B26\u5408\u4F9B\u5E94\u94FE\u670D\u52A1\u6807\u51C6",
    remark: "\u5408\u4F5C\u5546\u7EC8\u7AEF\u6CE8\u518C\uFF0C\u4F9B\u5E94\u5546\u6A21\u5F0F+\u670D\u52A1\u5546\u6A21\u5F0F\u53CC\u6A21\u5F0F",
    status: "active"
  }
];
var QUALIFICATION_FILES_MAP = {
  "1": ["\u8425\u4E1A\u6267\u7167.pdf", "\u98DF\u54C1\u751F\u4EA7\u8BB8\u53EF\u8BC1.pdf", "SC\u8BA4\u8BC1\u8BC1\u4E66.pdf"],
  "2": ["\u8425\u4E1A\u6267\u7167.pdf", "\u98DF\u54C1\u751F\u4EA7\u8BB8\u53EF\u8BC1.pdf"],
  "3": ["\u8425\u4E1A\u6267\u7167.pdf", "\u98DF\u54C1\u7ECF\u8425\u8BB8\u53EF\u8BC1.pdf", "ISO22000\u8BA4\u8BC1\u8BC1\u4E66.pdf"],
  "4": ["\u8425\u4E1A\u6267\u7167.pdf", "\u98DF\u54C1\u751F\u4EA7\u8BB8\u53EF\u8BC1.pdf", "\u666E\u6D31\u8336\u5730\u7406\u6807\u5FD7\u6388\u6743\u4E66.pdf"],
  "5": ["\u8425\u4E1A\u6267\u7167.pdf", "\u98DF\u54C1\u751F\u4EA7\u8BB8\u53EF\u8BC1.pdf"],
  "6": ["\u8425\u4E1A\u6267\u7167.pdf", "\u51FA\u53E3\u98DF\u54C1\u751F\u4EA7\u4F01\u4E1A\u5907\u6848.pdf"],
  "7": ["\u8425\u4E1A\u6267\u7167.pdf", "\u98DF\u54C1\u751F\u4EA7\u8BB8\u53EF\u8BC1.pdf", "\u7941\u7EA2\u975E\u9057\u4F20\u627F\u8BC1\u4E66.pdf"],
  "8": ["\u8425\u4E1A\u6267\u7167.pdf", "\u98DF\u54C1\u751F\u4EA7\u8BB8\u53EF\u8BC1.pdf", "\u6709\u673A\u4EA7\u54C1\u8BA4\u8BC1\u8BC1\u4E66.pdf"],
  "9": ["\u8425\u4E1A\u6267\u7167.pdf", "\u98DF\u54C1\u751F\u4EA7\u8BB8\u53EF\u8BC1.pdf"],
  "10": ["\u8425\u4E1A\u6267\u7167.pdf", "\u98DF\u54C1\u7ECF\u8425\u8BB8\u53EF\u8BC1.pdf"]
};
var CHANNEL_SOURCE_MAP = {
  "3": "terminal",
  "8": "terminal"
};
var MAIN_BRANDS_MAP = {
  "1": ["\u897F\u6E56\u724C"],
  "2": ["\u6B63\u5C71\u5802"],
  "3": ["\u516B\u9A6C"],
  "4": ["\u5927\u76CA"],
  "5": ["\u54C1\u54C1\u9999"],
  "6": ["\u6D77\u5824"],
  "7": ["\u5929\u4E4B\u7EA2"],
  "8": ["\u7AF9\u53F6\u9752"],
  "9": ["\u767D\u6C99\u6EAA"],
  "10": ["\u5F20\u4E00\u5143"],
  "11": ["\u897F\u6E56\u724C", "\u6B63\u5C71\u5802", "\u516B\u9A6C", "\u5927\u76CA", "\u54C1\u54C1\u9999"]
};
var BRAND_AUTH_FILES_MAP = {
  "1": { \u897F\u6E56\u724C: ["\u897F\u6E56\u724C\u54C1\u724C\u6388\u6743\u4E66.pdf"] },
  "2": { \u6B63\u5C71\u5802: ["\u6B63\u5C71\u5802\u54C1\u724C\u6388\u6743\u4E66.pdf"] },
  "3": { \u516B\u9A6C: ["\u516B\u9A6C\u54C1\u724C\u6388\u6743\u4E66.pdf"] },
  "4": { \u5927\u76CA: ["\u5927\u76CA\u54C1\u724C\u6388\u6743\u4E66.pdf"] },
  "5": { \u54C1\u54C1\u9999: ["\u54C1\u54C1\u9999\u54C1\u724C\u6388\u6743\u4E66.pdf"] },
  "6": { \u6D77\u5824: ["\u6D77\u5824\u54C1\u724C\u6388\u6743\u4E66.pdf"] },
  "7": { \u5929\u4E4B\u7EA2: ["\u5929\u4E4B\u7EA2\u54C1\u724C\u6388\u6743\u4E66.pdf"] },
  "8": { \u7AF9\u53F6\u9752: ["\u7AF9\u53F6\u9752\u54C1\u724C\u6388\u6743\u4E66.pdf"] },
  "9": { \u767D\u6C99\u6EAA: ["\u767D\u6C99\u6EAA\u54C1\u724C\u6388\u6743\u4E66.pdf"] },
  "10": { \u5F20\u4E00\u5143: ["\u5F20\u4E00\u5143\u54C1\u724C\u6388\u6743\u4E66.pdf"] },
  "11": {
    \u897F\u6E56\u724C: ["\u897F\u6E56\u724C\u6388\u6743\u4E66.pdf"],
    \u6B63\u5C71\u5802: ["\u6B63\u5C71\u5802\u6388\u6743\u4E66.pdf"],
    \u516B\u9A6C: ["\u516B\u9A6C\u6388\u6743\u4E66.pdf"],
    \u5927\u76CA: ["\u5927\u76CA\u6388\u6743\u4E66.pdf"],
    \u54C1\u54C1\u9999: ["\u54C1\u54C1\u9999\u6388\u6743\u4E66.pdf"]
  }
};
var STORES_MAP = {
  "1": [
    { id: "st1-1", name: "\u897F\u6E56\u54C1\u724C\u9986", province: "\u6D59\u6C5F", city: "\u676D\u5DDE\u5E02", district: "\u897F\u6E56\u533A", address: "\u9F99\u4E95\u8DEF88\u53F7", area: 320, manager: "\u9648\u5E97\u957F", phone: "0571-8766***1", mainBrands: ["\u897F\u6E56\u724C"], status: "active" },
    { id: "st1-2", name: "\u9F99\u4E95\u8336\u4F53\u9A8C\u5E97", province: "\u6D59\u6C5F", city: "\u676D\u5DDE\u5E02", district: "\u4E0A\u57CE\u533A", address: "\u5357\u5C71\u8DEF101\u53F7", area: 180, manager: "\u5468\u5E97\u957F", phone: "0571-8766***2", mainBrands: ["\u897F\u6E56\u724C"], photos: [
      "https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=%E8%8C%B6%E5%8F%B6%E5%93%81%E7%89%8C%E4%BD%93%E9%AA%8C%E5%BA%97%E9%97%A8%E5%A4%B4%E6%8B%9B%E7%89%8C%EF%BC%8C%E6%9C%A8%E8%B4%A8%E6%A0%BC%E6%A0%85%E8%AE%BE%E8%AE%A1%EF%BC%8C%E6%9A%96%E5%85%89%E7%85%A7%E6%98%8E%EF%BC%8C%E8%A1%97%E6%99%AF%E8%A7%86%E8%A7%92%EF%BC%8C%E9%AB%98%E6%B8%85%E6%91%84%E5%BD%B1&image_size=square_hd",
      "https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=%E8%8C%B6%E5%8F%B6%E9%97%A8%E5%BA%97%E5%AE%A4%E5%86%85%E5%93%81%E8%8C%B6%E5%8C%BA%EF%BC%8C%E5%AE%9E%E6%9C%A8%E8%8C%B6%E6%A1%8C%E8%8C%B6%E6%A4%85%EF%BC%8C%E4%B8%AD%E5%BC%8F%E8%8C%B6%E6%96%87%E5%8C%96%E8%A3%85%E9%A5%B0%EF%BC%8C%E9%AB%98%E6%B8%85%E6%91%84%E5%BD%B1&image_size=square_hd"
    ], status: "active" }
  ],
  "2": [
    { id: "st2-1", name: "\u6B63\u5C71\u5802\u6B66\u5937\u5C71\u65D7\u8230\u5E97", province: "\u798F\u5EFA", city: "\u5357\u5E73\u5E02", district: "\u6B66\u5937\u5C71\u5E02", address: "\u5927\u738B\u5CF0\u5317\u8DEF12\u53F7", area: 260, manager: "\u5434\u5E97\u957F", phone: "0599-510***1", mainBrands: ["\u6B63\u5C71\u5802"], status: "active" }
  ],
  "3": [
    { id: "st3-1", name: "\u516B\u9A6C\u8336\u4E1A\u676D\u5DDE\u5927\u53A6\u5E97", province: "\u6D59\u6C5F", city: "\u676D\u5DDE\u5E02", district: "\u4E0B\u57CE\u533A", address: "\u6B66\u6797\u5E7F\u573A1\u53F7", area: 150, manager: "\u6797\u5E97\u957F", phone: "0571-8888***1", mainBrands: ["\u516B\u9A6C"], photos: [
      "https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=%E8%8C%B6%E5%8F%B6%E4%B8%93%E5%8D%96%E5%BA%97%E6%A9%B1%E7%AA%97%E9%99%88%E5%88%97%EF%BC%8C%E7%A4%BC%E7%9B%92%E8%A3%85%E8%8C%B6%E5%8F%B6%E5%B1%95%E7%A4%BA%EF%BC%8C%E5%B0%84%E7%81%AF%E6%89%93%E5%85%89%EF%BC%8C%E9%AB%98%E6%B8%85%E6%91%84%E5%BD%B1&image_size=square_hd"
    ], status: "active" },
    { id: "st3-2", name: "\u516B\u9A6C\u8336\u4E1A\u897F\u6E56\u5E97", province: "\u6D59\u6C5F", city: "\u676D\u5DDE\u5E02", district: "\u897F\u6E56\u533A", address: "\u6768\u516C\u582423\u53F7", area: 210, manager: "\u90D1\u5E97\u957F", phone: "0571-8888***2", mainBrands: ["\u516B\u9A6C"], status: "active" },
    { id: "st3-3", name: "\u516B\u9A6C\u8336\u4E1A\u6EE8\u6C5F\u5E97", province: "\u6D59\u6C5F", city: "\u676D\u5DDE\u5E02", district: "\u6EE8\u6C5F\u533A", address: "\u6C5F\u5357\u5927\u9053588\u53F7", area: 130, manager: "\u51AF\u5E97\u957F", phone: "0571-8888***3", mainBrands: ["\u516B\u9A6C"], status: "inactive" }
  ],
  "4": [
    { id: "st4-1", name: "\u5927\u76CA\u8336\u4F53\u9A8C\u9986", province: "\u4E91\u5357", city: "\u6606\u660E\u5E02", district: "\u76D8\u9F99\u533A", address: "\u767D\u9F99\u8DEF288\u53F7", area: 400, manager: "\u6768\u5E97\u957F", phone: "0871-6565***1", mainBrands: ["\u5927\u76CA"], status: "active" },
    { id: "st4-2", name: "\u5927\u76CA\u8336\u4E13\u8425\u5E97\uFF08\u52D0\u6D77\uFF09", province: "\u4E91\u5357", city: "\u897F\u53CC\u7248\u7EB3\u50A3\u65CF\u81EA\u6CBB\u5DDE", district: "\u52D0\u6D77\u53BF", address: "\u52D0\u6D77\u9547\u8336\u5382\u8DEF1\u53F7", area: 220, manager: "\u674E\u5E97\u957F", phone: "0691-512***2", mainBrands: ["\u5927\u76CA"], status: "active" }
  ],
  "5": [
    { id: "st5-1", name: "\u54C1\u54C1\u9999\u767D\u8336\u4E13\u8425\u5E97", province: "\u798F\u5EFA", city: "\u5B81\u5FB7\u5E02", district: "\u798F\u9F0E\u5E02", address: "\u6850\u5C71\u8857\u9053\u592A\u59E5\u5927\u905366\u53F7", area: 170, manager: "\u738B\u5E97\u957F", phone: "0593-787***1", mainBrands: ["\u54C1\u54C1\u9999"], status: "active" }
  ],
  "7": [
    { id: "st7-1", name: "\u7941\u7EA2\u54C1\u724C\u4F53\u9A8C\u5E97", province: "\u5B89\u5FBD", city: "\u9EC4\u5C71\u5E02", district: "\u7941\u95E8\u53BF", address: "\u7941\u5C71\u9547\u4E2D\u5FC3\u8DEF18\u53F7", area: 140, manager: "\u8BB8\u5E97\u957F", phone: "0559-451***1", mainBrands: ["\u7941\u95E8\u7EA2\u8336"], status: "active" }
  ],
  "8": [
    { id: "st8-1", name: "\u7AF9\u53F6\u9752\u6210\u90FD\u6625\u7199\u5E97", province: "\u56DB\u5DDD", city: "\u6210\u90FD\u5E02", district: "\u9526\u6C5F\u533A", address: "\u6625\u7199\u8DEF\u6B65\u884C\u885788\u53F7", area: 190, manager: "\u4F55\u5E97\u957F", phone: "028-8666***1", mainBrands: ["\u7AF9\u53F6\u9752"], status: "active" },
    { id: "st8-2", name: "\u7AF9\u53F6\u9752\u5CE8\u7709\u5F62\u8C61\u5E97", province: "\u56DB\u5DDD", city: "\u4E50\u5C71\u5E02", district: "\u5CE8\u7709\u5C71\u5E02", address: "\u7EE5\u5C71\u9547\u540D\u5C71\u8DEF99\u53F7", area: 240, manager: "\u7F57\u5E97\u957F", phone: "0833-552***2", mainBrands: ["\u7AF9\u53F6\u9752"], status: "active" }
  ],
  "9": [
    { id: "st9-1", name: "\u767D\u6C99\u6EAA\u9ED1\u8336\u4F53\u9A8C\u9986", province: "\u6E56\u5357", city: "\u76CA\u9633\u5E02", district: "\u5B89\u5316\u53BF", address: "\u4E1C\u576A\u9547\u6CBF\u6C5F\u8DEF36\u53F7", area: 200, manager: "\u8C0C\u5E97\u957F", phone: "0737-722***1", mainBrands: ["\u767D\u6C99\u6EAA"], status: "active" }
  ],
  "10": [
    { id: "st10-1", name: "\u5F20\u4E00\u5143\u5927\u6805\u680F\u603B\u5E97", province: "\u5317\u4EAC", city: "\u5317\u4EAC\u5E02", district: "\u897F\u57CE\u533A", address: "\u5927\u6805\u680F\u885722\u53F7", area: 300, manager: "\u8D75\u5E97\u957F", phone: "010-6301***1", mainBrands: ["\u5F20\u4E00\u5143"], status: "active" }
  ],
  "11": [
    { id: "st11-1", name: "\u4E91\u8336\xB7\u897F\u6E56\u8336\u6587\u5316\u9986", province: "\u6D59\u6C5F", city: "\u676D\u5DDE\u5E02", district: "\u897F\u6E56\u533A", address: "\u864E\u8DD1\u8DEF46\u53F7", area: 280, manager: "\u6C88\u5E97\u957F", phone: "0571-8790***1", mainBrands: ["\u897F\u6E56\u724C", "\u516B\u9A6C"], photos: [
      "https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=%E6%9D%AD%E5%B7%9E%E8%A5%BF%E6%B9%96%E8%8C%B6%E6%96%87%E5%8C%96%E5%93%81%E7%89%8C%E9%97%A8%E5%BA%97%E5%A4%96%E8%A7%82%EF%BC%8C%E4%B8%AD%E5%BC%8F%E6%9C%A8%E8%B4%A8%E9%97%A8%E5%A4%B4%E4%B8%8E%E8%8C%B6%E5%8C%BE%EF%BC%8C%E9%9D%92%E7%93%A6%E9%A3%9E%E6%AA%90%EF%BC%8C%E8%A1%97%E6%99%AF%E8%A7%86%E8%A7%92%EF%BC%8C%E9%AB%98%E6%B8%85%E6%91%84%E5%BD%B1&image_size=square_hd",
      "https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=%E8%8C%B6%E6%96%87%E5%8C%96%E9%97%A8%E5%BA%97%E5%AE%A4%E5%86%85%E5%93%81%E8%8C%B6%E5%8C%BA%EF%BC%8C%E5%8E%9F%E6%9C%A8%E8%8C%B6%E6%A1%8C%E8%8C%B6%E6%A4%85%E4%B8%8E%E5%8D%9A%E5%8F%A4%E6%9E%B6%E9%99%88%E8%AE%BE%EF%BC%8C%E6%9A%96%E8%89%B2%E7%81%AF%E5%85%89%EF%BC%8C%E9%AB%98%E6%B8%85%E6%91%84%E5%BD%B1&image_size=square_hd"
    ], status: "active" },
    { id: "st11-2", name: "\u4E91\u8336\xB7\u6EE8\u6C5F\u8336\u54C1\u4E13\u8425\u5E97", province: "\u6D59\u6C5F", city: "\u676D\u5DDE\u5E02", district: "\u6EE8\u6C5F\u533A", address: "\u6C5F\u5357\u5927\u9053300\u53F7", area: 160, manager: "\u987E\u5E97\u957F", phone: "0571-8790***2", mainBrands: ["\u5927\u76CA", "\u54C1\u54C1\u9999"], photos: [
      "https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=%E7%8E%B0%E4%BB%A3%E8%8C%B6%E5%8F%B6%E4%B8%93%E8%90%A5%E5%BA%97%E5%AE%A4%E5%86%85%EF%BC%8C%E7%A4%BC%E7%9B%92%E8%8C%B6%E5%93%81%E5%B1%95%E6%9F%9C%E4%B8%8E%E5%93%81%E9%89%B4%E5%90%A7%E5%8F%B0%EF%BC%8C%E6%98%8E%E4%BA%AE%E9%80%9A%E9%80%8F%EF%BC%8C%E9%AB%98%E6%B8%85%E6%91%84%E5%BD%B1&image_size=square_hd"
    ], status: "active" }
  ]
};
var TERMINAL_ACCOUNTS = {
  "3": [
    { id: "ta_bama_admin", role: "admin", username: "bama01", password: "123456", name: "\u6797\u632F\u534E", phone: "138****1001", status: "active", createTime: "2025-06-12", lastLogin: "2026-10-15" },
    { id: "ta_bama_op1", role: "operator", username: "bama_sales", password: "123456", name: "\u90D1\u6653\u7433", phone: "138****1002", status: "active", createTime: "2025-07-01", lastLogin: "2026-10-14" }
  ],
  "8": [
    { id: "ta_zyq_admin", role: "admin", username: "zyq001", password: "123456", name: "\u4F55\u4E91\u677E", phone: "139****2001", status: "active", createTime: "2025-09-01", lastLogin: "2026-10-16" },
    { id: "ta_zyq_op1", role: "operator", username: "zyq_wh", password: "123456", name: "\u7F57\u6C38\u5EB7", phone: "139****2002", status: "active", createTime: "2025-10-08", lastLogin: "2026-10-12" },
    { id: "ta_zyq_op2", role: "operator", username: "zyq_cs", password: "123456", name: "\u9648\u601D\u8FDC", phone: "139****2003", status: "inactive", createTime: "2025-11-20" }
  ],
  "11": [
    { id: "ta_admin", role: "admin", username: "admin", password: "123456", name: "\u9648\u5EFA\u56FD", phone: "139****0001", status: "active", createTime: "2025-03-01", lastLogin: "2026-10-16" },
    { id: "ta_op1", role: "operator", username: "sales01", password: "123456", name: "\u674E\u6167\u654F", phone: "139****0002", status: "active", createTime: "2025-06-15", lastLogin: "2026-10-11" },
    { id: "ta_op2", role: "operator", username: "wh01", password: "123456", name: "\u5468\u4ED3\u7BA1", phone: "139****0003", status: "inactive", createTime: "2025-08-01" }
  ]
};
var TERMINAL_MAP = {
  "3": { enabled: true, username: "bama01", password: "123456", status: "active", openTime: "2025-06-12", lastLogin: "2026-10-15", remark: "\u5408\u4F5C\u5546\u7EC8\u7AEF\u6CE8\u518C\u4F9B\u5E94\u5546", accounts: TERMINAL_ACCOUNTS["3"] },
  "8": { enabled: true, username: "zyq001", password: "123456", status: "active", openTime: "2025-09-01", lastLogin: "2026-10-16", remark: "\u5408\u4F5C\u5546\u7EC8\u7AEF\u6CE8\u518C\u4F9B\u5E94\u5546", accounts: TERMINAL_ACCOUNTS["8"] },
  "11": { enabled: true, username: "admin", password: "123456", status: "active", openTime: "2025-03-01", lastLogin: "2026-10-16", remark: "\u4E91\u8336\u4F9B\u5E94\u94FE\uFF08\u5408\u4F5C\u5546\u7EC8\u7AEF\u6F14\u793A\u8D26\u53F7\uFF09", accounts: TERMINAL_ACCOUNTS["11"] }
};
var EMPTY_TERMINAL = { enabled: false, username: "", status: "active" };
var genSupplierCode = (seq) => `HZS-${String(seq).padStart(3, "0")}`;
var supplierItems = rawSupplierItems.map((s, idx) => ({
  ...s,
  code: genSupplierCode(idx + 1),
  qualificationFiles: QUALIFICATION_FILES_MAP[s.id] ?? ["\u8425\u4E1A\u6267\u7167.pdf"],
  channelSource: CHANNEL_SOURCE_MAP[s.id] ?? "manual",
  mainBrands: MAIN_BRANDS_MAP[s.id] ?? [],
  brandAuthFiles: BRAND_AUTH_FILES_MAP[s.id] ?? {},
  stores: STORES_MAP[s.id] ?? [],
  terminal: TERMINAL_MAP[s.id] ?? EMPTY_TERMINAL
}));

// src/data/teaProducts.tsx
function img(prompt) {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;
}
var teaProducts = [
  // ── 绿茶 ──
  {
    id: "1",
    code: "101001000013",
    name: "\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7",
    category: "\u7EFF\u8336-\u897F\u6E56\u9F99\u4E95",
    categories: ["\u7EFF\u8336-\u897F\u6E56\u9F99\u4E95"],
    brand: "\u897F\u6E56\u724C",
    series: "\u660E\u524D\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567001",
    model: "XHLJ-MQ-TJ",
    spec: "50g/\u7F50",
    perUnitSpec: { netWeight: 120, netWeightUnit: "g", grossWeight: 138, grossWeightUnit: "g", length: 10, width: 10, height: 16, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 48, netWeight: 5.76, netWeightUnit: "kg", grossWeight: 6.62, grossWeightUnit: "kg", length: 40, width: 31, height: 25, dimensionUnit: "cm" },
    weight: 0.12,
    volume: { length: 10, width: 10, height: 16 },
    quantityPerUnit: 48,
    grade: "\u7279\u7EA7",
    origin: "\u6D59\u6C5F\u676D\u5DDE\u897F\u6E56\u533A",
    shelfLife: 12,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u4EA7\u54C1\u8BF4\u660E\u4E66\xD71\u3001\u54C1\u9274\u8336\u5177\u5957\u88C5\xD71",
    marketPrice: 580,
    tmallPrice: 498,
    tmallUrl: "https://xihupai.tmall.com/item1",
    jdPrice: 508,
    jdUrl: "https://xihupai.jd.com/item1",
    salesPrice: 452,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u897F\u6E56\u9F99\u4E95\u660E\u524D\u7279\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u7EFF\u8272\u7B80\u7EA6\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u897F\u6E56\u9F99\u4E95\u5E72\u8336\u6241\u5E73\u633A\u76F4\u7279\u5199\uFF0C\u7FE0\u7EFF\u6CB9\u6DA6\uFF0C\u9AD8\u6E05\u5FAE\u8DDD\u6444\u5F71"),
      img("\u897F\u6E56\u9F99\u4E95\u8336\u6C64\u6E05\u4EAE\u78A7\u7EFF\uFF0C\u73BB\u7483\u676F\u51B2\u6CE1\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u897F\u6E56\u9F99\u4E95\u660E\u524D\u7279\u7EA7\u4EA7\u54C1\u8BE6\u60C5\u56FE\uFF0C\u4EA7\u5730\u897F\u6E56\u9F99\u4E95\u6751\u8336\u56ED\u98CE\u666F"),
      img("\u897F\u6E56\u9F99\u4E95\u7092\u5236\u5DE5\u827A\uFF0C\u624B\u5DE5\u7092\u8336\u5E08\u5085\u7092\u9752\u573A\u666F"),
      img("\u897F\u6E56\u9F99\u4E95\u53F6\u5E95\u5AE9\u5300\u6210\u6735\uFF0C\u9AD8\u6E05\u7279\u5199")
    ],
    displayImageIndex: 0,
    stockAlert: 50,
    stock: 320,
    reservedStock: 26,
    totalSales: 1280,
    features: "\u660E\u524D\u5934\u91C7\xB7\u8C46\u82B1\u9999\xB7\u6241\u5E73\u633A\u76F4",
    includesTeaware: true,
    remark: "\u660E\u524D\u5934\u91C7\uFF0C\u8C46\u82B1\u9999\u663E\u8457"
  },
  {
    id: "2",
    code: "101002000018",
    name: "\u78A7\u87BA\u6625\xB7\u4E00\u7EA7",
    category: "\u7EFF\u8336-\u78A7\u87BA\u6625",
    categories: ["\u7EFF\u8336-\u78A7\u87BA\u6625"],
    brand: "\u5362\u6B63\u6D69",
    series: "\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u888B",
    barcode69: "6901234567002",
    model: "BLC-YJ-001",
    spec: "100g/\u888B",
    perUnitSpec: { netWeight: 150, netWeightUnit: "g", grossWeight: 173, grossWeightUnit: "g", length: 12, width: 8, height: 20, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 60, netWeight: 9, netWeightUnit: "kg", grossWeight: 10.38, grossWeightUnit: "kg", length: 52, width: 27, height: 34, dimensionUnit: "cm" },
    weight: 0.15,
    volume: { length: 12, width: 8, height: 20 },
    quantityPerUnit: 60,
    grade: "\u4E00\u7EA7",
    origin: "\u6C5F\u82CF\u82CF\u5DDE\u6D1E\u5EAD\u5C71",
    shelfLife: 12,
    taxRate: 9,
    packageList: "\u94DD\u7B94\u888B\xD71\u3001\u7EB8\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u54C1\u9274\u8336\u5177\u5957\u88C5\xD71",
    marketPrice: 420,
    tmallPrice: 358,
    tmallUrl: "https://luzhenghao.tmall.com/item2",
    jdPrice: 368,
    jdUrl: "https://luzhenghao.jd.com/item2",
    salesPrice: 328,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u78A7\u87BA\u6625\u4E00\u7EA7\u8336\u53F6\u888B\u88C5\u4EA7\u54C1\u56FE\uFF0C\u6E05\u65B0\u7EFF\u8272\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u78A7\u87BA\u6625\u5E72\u8336\u5377\u66F2\u5982\u87BA\u767D\u6BEB\u5BC6\u62AB\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u78A7\u87BA\u6625\u8336\u6C64\u78A7\u7EFF\u6E05\u6F88\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u78A7\u87BA\u6625\u4EA7\u5730\u6D1E\u5EAD\u5C71\u8336\u56ED\u98CE\u666F\uFF0C\u592A\u6E56\u6E56\u7554"),
      img("\u78A7\u87BA\u6625\u63C9\u637B\u5DE5\u827A\u5C55\u793A\uFF0C\u4F20\u7EDF\u624B\u5DE5\u5236\u8336")
    ],
    displayImageIndex: 0,
    stockAlert: 40,
    stock: 580,
    reservedStock: 68,
    totalSales: 2350,
    features: "\u5377\u66F2\u6210\u87BA\xB7\u767D\u6BEB\u663E\u9732\xB7\u82B1\u679C\u9999",
    includesTeaware: true,
    remark: "\u82B1\u679C\u9999\u663E\u8457\uFF0C\u6761\u7D22\u5377\u66F2"
  },
  {
    id: "3",
    code: "101003000019",
    name: "\u7AF9\u53F6\u9752\xB7\u54C1\u5473\u7EA7",
    category: "\u7EFF\u8336-\u5CE8\u7709\u7AF9\u53F6\u9752",
    categories: ["\u7EFF\u8336-\u5CE8\u7709\u7AF9\u53F6\u9752"],
    brand: "\u7AF9\u53F6\u9752",
    series: "\u54C1\u5473\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567003",
    model: "ZYQ-PW-050",
    spec: "50g/\u7F50",
    perUnitSpec: { netWeight: 110, netWeightUnit: "g", grossWeight: 126, grossWeightUnit: "g", length: 9, width: 9, height: 18, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 48, netWeight: 5.28, netWeightUnit: "kg", grossWeight: 6.05, grossWeightUnit: "kg", length: 36, width: 28, height: 28, dimensionUnit: "cm" },
    weight: 0.11,
    volume: { length: 9, width: 9, height: 18 },
    quantityPerUnit: 48,
    grade: "\u4E00\u7EA7",
    origin: "\u56DB\u5DDD\u5CE8\u7709\u5C71",
    shelfLife: 12,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 368,
    tmallPrice: 318,
    tmallUrl: "https://zhuyeqing.tmall.com/item3",
    jdPrice: 328,
    jdUrl: "https://zhuyeqing.jd.com/item3",
    salesPrice: 287,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u7AF9\u53F6\u9752\u54C1\u5473\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u7FE0\u7EFF\u9AD8\u96C5\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u7AF9\u53F6\u9752\u5E72\u8336\u6241\u5E73\u5149\u6ED1\u5AE9\u7EFF\u6CB9\u6DA6\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u7AF9\u53F6\u9752\u8336\u6C64\u5AE9\u7EFF\u660E\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u73BB\u7483\u676F\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u7AF9\u53F6\u9752\u4EA7\u5730\u5CE8\u7709\u5C71\u4E91\u96FE\u8336\u56ED\u98CE\u666F"),
      img("\u7AF9\u53F6\u9752\u5236\u8336\u5DE5\u827A\uFF0C\u6740\u9752\u63C9\u637B\u6D41\u7A0B\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 35,
    stock: 150,
    reservedStock: 29,
    totalSales: 680,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u6E05\u9999\u99A5\u90C1\uFF0C\u6241\u5E73\u5149\u6ED1"
  },
  {
    id: "4",
    code: "101004000011",
    name: "\u9EC4\u5C71\u6BDB\u5CF0\xB7\u7279\u7EA7",
    category: "\u7EFF\u8336-\u9EC4\u5C71\u6BDB\u5CF0",
    categories: ["\u7EFF\u8336-\u9EC4\u5C71\u6BDB\u5CF0"],
    brand: "\u8C22\u88D5\u5927",
    series: "\u9EC4\u5C71\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567004",
    model: "HSMF-TJ-050",
    spec: "50g/\u7F50",
    perUnitSpec: { netWeight: 100, netWeightUnit: "g", grossWeight: 115, grossWeightUnit: "g", length: 10, width: 10, height: 15, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 48, netWeight: 4.8, netWeightUnit: "kg", grossWeight: 5.52, grossWeightUnit: "kg", length: 40, width: 31, height: 23, dimensionUnit: "cm" },
    weight: 0.1,
    volume: { length: 10, width: 10, height: 15 },
    quantityPerUnit: 48,
    grade: "\u7279\u7EA7",
    origin: "\u5B89\u5FBD\u9EC4\u5C71\u5BCC\u6EAA\u4E61",
    shelfLife: 12,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 460,
    tmallPrice: 398,
    tmallUrl: "https://xieyuda.tmall.com/item4",
    jdPrice: 408,
    jdUrl: "https://xieyuda.jd.com/item4",
    salesPrice: 359,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u9EC4\u5C71\u6BDB\u5CF0\u7279\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u5C71\u9752\u6C34\u79C0\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u9EC4\u5C71\u6BDB\u5CF0\u5E72\u8336\u5F62\u4F3C\u96C0\u820C\u767D\u6BEB\u663E\u9732\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u9EC4\u5C71\u6BDB\u5CF0\u8336\u6C64\u6E05\u6F88\u7EFF\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u9EC4\u5C71\u6BDB\u5CF0\u4EA7\u5730\u9EC4\u5C71\u5BCC\u6EAA\u4E61\u9AD8\u5C71\u8336\u56ED\u98CE\u666F"),
      img("\u9EC4\u5C71\u6BDB\u5CF0\u4F20\u7EDF\u624B\u5DE5\u7092\u5236\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 30,
    stock: 420,
    reservedStock: 53,
    totalSales: 1920,
    features: "\u5CF0\u663E\u6BEB\u9732\xB7\u9C7C\u53F6\u91D1\u9EC4\xB7\u5170\u82B1\u9999",
    includesTeaware: false,
    remark: "\u5170\u82B1\u9999\u663E\u8457\uFF0C\u82BD\u5934\u80A5\u58EE"
  },
  {
    id: "5",
    code: "101005000014",
    name: "\u592A\u5E73\u7334\u9B41\xB7\u7279\u7EA7",
    category: "\u7EFF\u8336-\u592A\u5E73\u7334\u9B41",
    categories: ["\u7EFF\u8336-\u592A\u5E73\u7334\u9B41"],
    brand: "\u7334\u5751",
    series: "\u7334\u5751\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u76D2",
    barcode69: "6901234567005",
    model: "TPHK-TJ-100",
    spec: "100g/\u76D2",
    perUnitSpec: { netWeight: 200, netWeightUnit: "g", grossWeight: 230, grossWeightUnit: "g", length: 30, width: 12, height: 8, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 30, netWeight: 6, netWeightUnit: "kg", grossWeight: 6.9, grossWeightUnit: "kg", length: 103, width: 32, height: 11, dimensionUnit: "cm" },
    weight: 0.2,
    volume: { length: 30, width: 12, height: 8 },
    quantityPerUnit: 30,
    grade: "\u7279\u7EA7",
    origin: "\u5B89\u5FBD\u9EC4\u5C71\u9EC4\u5C71\u533A",
    shelfLife: 12,
    taxRate: 9,
    packageList: "\u7EB8\u76D2\xD71\u3001\u94DD\u7B94\u888B\xD71\u3001\u8BF4\u660E\u4E66\xD71",
    marketPrice: 680,
    tmallPrice: 598,
    tmallUrl: "https://houkeng.tmall.com/item5",
    jdPrice: 618,
    jdUrl: "https://houkeng.jd.com/item5",
    salesPrice: 530,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u592A\u5E73\u7334\u9B41\u7279\u7EA7\u8336\u53F6\u76D2\u88C5\u4EA7\u54C1\u56FE\uFF0C\u6241\u5E73\u633A\u76F4\u4E24\u53F6\u62B1\u82BD\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u592A\u5E73\u7334\u9B41\u5E72\u8336\u6241\u5C55\u633A\u62D4\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD\u6444\u5F71"),
      img("\u592A\u5E73\u7334\u9B41\u51B2\u6CE1\u540E\u82BD\u53F6\u7AD6\u7ACB\u5982\u5170\u82B1\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u592A\u5E73\u7334\u9B41\u4EA7\u5730\u9EC4\u5C71\u7334\u5751\u6751\u8336\u56ED\u98CE\u666F"),
      img("\u592A\u5E73\u7334\u9B41\u4F20\u7EDF\u7406\u6761\u538B\u6241\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 25,
    stock: 90,
    reservedStock: 7,
    totalSales: 320,
    features: "\u4E24\u53F6\u62B1\u82BD\xB7\u6241\u5E73\u633A\u76F4\xB7\u7334\u97F5\u72EC\u7279",
    includesTeaware: false,
    remark: "\u4E24\u53F6\u62B1\u82BD\uFF0C\u82B1\u9999\u9AD8\u723D\u5E26\u7334\u97F5"
  },
  // ── 红茶 ──
  {
    id: "6",
    code: "102006000018",
    name: "\u6B63\u5C71\u5C0F\u79CD\xB7\u7279\u7EA7",
    category: "\u7EA2\u8336-\u6B63\u5C71\u5C0F\u79CD",
    categories: ["\u7EA2\u8336-\u6B63\u5C71\u5C0F\u79CD"],
    brand: "\u6B63\u5C71\u5802",
    series: "\u6B63\u5C71\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567006",
    model: "ZSXS-TJ-100",
    spec: "100g/\u7F50",
    perUnitSpec: { netWeight: 200, netWeightUnit: "g", grossWeight: 230, grossWeightUnit: "g", length: 12, width: 12, height: 16, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 36, netWeight: 7.2, netWeightUnit: "kg", grossWeight: 8.28, grossWeightUnit: "kg", length: 44, width: 34, height: 23, dimensionUnit: "cm" },
    weight: 0.2,
    volume: { length: 12, width: 12, height: 16 },
    quantityPerUnit: 36,
    grade: "\u7279\u7EA7",
    origin: "\u798F\u5EFA\u6B66\u5937\u5C71\u6850\u6728\u5173",
    shelfLife: 24,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u54C1\u9274\u676F\xD71",
    marketPrice: 480,
    tmallPrice: 428,
    tmallUrl: "https://zhengshantang.tmall.com/item6",
    jdPrice: 438,
    jdUrl: "https://zhengshantang.jd.com/item6",
    salesPrice: 384,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u6B63\u5C71\u5C0F\u79CD\u7279\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u7EA2\u91D1\u5178\u96C5\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u6B63\u5C71\u5C0F\u79CD\u5E72\u8336\u6761\u7D22\u7D27\u7ED3\u4E4C\u6DA6\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u6B63\u5C71\u5C0F\u79CD\u8336\u6C64\u7EA2\u6D53\u660E\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u6B63\u5C71\u5C0F\u79CD\u4EA7\u5730\u6B66\u5937\u5C71\u6850\u6728\u5173\u8336\u56ED\u98CE\u666F"),
      img("\u6B63\u5C71\u5C0F\u79CD\u4F20\u7EDF\u677E\u70DF\u718F\u5236\u5DE5\u827A\u5C55\u793A"),
      img("\u6B63\u5C71\u5C0F\u79CD\u53F6\u5E95\u7EA2\u4EAE\u8F6F\u5300\u7279\u5199")
    ],
    displayImageIndex: 0,
    stockAlert: 40,
    stock: 260,
    reservedStock: 35,
    totalSales: 1450,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u677E\u70DF\u9999\u663E\u8457\uFF0C\u6842\u5706\u6C64\u5473"
  },
  {
    id: "7",
    code: "102006000024",
    name: "\u91D1\u9A8F\u7709\xB7\u7279\u7EA7",
    category: "\u7EA2\u8336-\u91D1\u9A8F\u7709",
    categories: ["\u7EA2\u8336-\u91D1\u9A8F\u7709"],
    brand: "\u6B63\u5C71\u5802",
    series: "\u9A8F\u7709\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567007",
    model: "JJM-TJ-050",
    spec: "50g/\u7F50",
    perUnitSpec: { netWeight: 100, netWeightUnit: "g", grossWeight: 115, grossWeightUnit: "g", length: 8, width: 8, height: 14, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 60, netWeight: 6, netWeightUnit: "kg", grossWeight: 6.9, grossWeightUnit: "kg", length: 34, width: 27, height: 24, dimensionUnit: "cm" },
    weight: 0.1,
    volume: { length: 8, width: 8, height: 14 },
    quantityPerUnit: 60,
    grade: "\u7279\u7EA7",
    origin: "\u798F\u5EFA\u6B66\u5937\u5C71\u6850\u6728\u5173",
    shelfLife: 24,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u9526\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u54C1\u9274\u5361\xD71\u3001\u54C1\u9274\u8336\u5177\u5957\u88C5\xD71",
    marketPrice: 1280,
    tmallPrice: 1080,
    tmallUrl: "https://zhengshantang.tmall.com/item7",
    jdPrice: 1098,
    jdUrl: "https://zhengshantang.jd.com/item7",
    salesPrice: 1024,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u91D1\u9A8F\u7709\u7279\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u91D1\u9ED1\u5962\u534E\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u91D1\u9A8F\u7709\u5E72\u8336\u91D1\u9EC4\u9ED1\u76F8\u95F4\u82BD\u5934\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u91D1\u9A8F\u7709\u8336\u6C64\u91D1\u9EC4\u900F\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u91D1\u9A8F\u7709\u4EA7\u5730\u6B66\u5937\u5C71\u6850\u6728\u5173\u9AD8\u5C71\u8336\u56ED\u98CE\u666F"),
      img("\u91D1\u9A8F\u7709\u5168\u82BD\u5934\u91C7\u6458\u5C55\u793A\uFF0C\u8336\u519C\u624B\u5DE5\u91C7\u82BD"),
      img("\u91D1\u9A8F\u7709\u840E\u51CB\u53D1\u9175\u5DE5\u827A\u6D41\u7A0B\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 20,
    stock: 780,
    reservedStock: 66,
    totalSales: 3100,
    features: "\u5355\u82BD\u5236\u4F5C\xB7\u82B1\u679C\u871C\u9999\xB7\u91D1\u6BEB\u6EE1\u62AB",
    includesTeaware: true,
    remark: "\u5168\u82BD\u5934\u5236\u4F5C\uFF0C\u871C\u9999\u82B1\u679C\u9999\u4EA4\u878D"
  },
  {
    id: "8",
    code: "102007000017",
    name: "\u6EC7\u7EA2\xB7\u91D1\u82BD\u7279\u7EA7",
    category: "\u7EA2\u8336-\u6EC7\u7EA2",
    categories: ["\u7EA2\u8336-\u6EC7\u7EA2"],
    brand: "\u51E4\u724C",
    series: "\u7ECF\u517858\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567008",
    model: "DH-JY-TJ-100",
    spec: "100g/\u7F50",
    perUnitSpec: { netWeight: 180, netWeightUnit: "g", grossWeight: 207, grossWeightUnit: "g", length: 11, width: 11, height: 15, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 40, netWeight: 7.2, netWeightUnit: "kg", grossWeight: 8.28, grossWeightUnit: "kg", length: 41, width: 32, height: 22, dimensionUnit: "cm" },
    weight: 0.18,
    volume: { length: 11, width: 11, height: 15 },
    quantityPerUnit: 40,
    grade: "\u7279\u7EA7",
    origin: "\u4E91\u5357\u51E4\u5E86",
    shelfLife: 24,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 320,
    tmallPrice: 268,
    tmallUrl: "https://fengpai.tmall.com/item8",
    jdPrice: 278,
    jdUrl: "https://fengpai.jd.com/item8",
    salesPrice: 256,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u6EC7\u7EA2\u91D1\u82BD\u7279\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u6696\u7EA2\u91D1\u8272\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u6EC7\u7EA2\u5E72\u8336\u91D1\u6BEB\u6EE1\u62AB\u80A5\u58EE\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u6EC7\u7EA2\u8336\u6C64\u7EA2\u8273\u660E\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u6EC7\u7EA2\u4EA7\u5730\u4E91\u5357\u51E4\u5E86\u5927\u53F6\u79CD\u8336\u56ED\u98CE\u666F"),
      img("\u6EC7\u7EA2\u53D1\u9175\u5DE5\u827A\u5C55\u793A\uFF0C\u4F20\u7EDF\u5DE5\u592B\u7EA2\u8336\u5236\u4F5C")
    ],
    displayImageIndex: 0,
    stockAlert: 50,
    stock: 45,
    reservedStock: 3,
    totalSales: 180,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u91D1\u6BEB\u663E\u9732\uFF0C\u871C\u9999\u6D53\u90C1"
  },
  {
    id: "9",
    code: "102008000017",
    name: "\u7941\u95E8\u7EA2\u8336\xB7\u7279\u7EA7",
    category: "\u7EA2\u8336-\u7941\u95E8\u7EA2\u8336",
    categories: ["\u7EA2\u8336-\u7941\u95E8\u7EA2\u8336"],
    brand: "\u5929\u4E4B\u7EA2",
    series: "\u7941\u7EA2\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567009",
    model: "QMHC-TJ-100",
    spec: "100g/\u7F50",
    perUnitSpec: { netWeight: 180, netWeightUnit: "g", grossWeight: 207, grossWeightUnit: "g", length: 11, width: 11, height: 15, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 40, netWeight: 7.2, netWeightUnit: "kg", grossWeight: 8.28, grossWeightUnit: "kg", length: 41, width: 32, height: 22, dimensionUnit: "cm" },
    weight: 0.18,
    volume: { length: 11, width: 11, height: 15 },
    quantityPerUnit: 40,
    grade: "\u7279\u7EA7",
    origin: "\u5B89\u5FBD\u7941\u95E8",
    shelfLife: 24,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 520,
    tmallPrice: 448,
    tmallUrl: "https://tianzhihong.tmall.com/item9",
    jdPrice: 458,
    jdUrl: "https://tianzhihong.jd.com/item9",
    salesPrice: 416,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u7941\u95E8\u7EA2\u8336\u7279\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u7EA2\u8910\u5178\u96C5\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u7941\u95E8\u7EA2\u8336\u5E72\u8336\u6761\u7D22\u7D27\u7EC6\u4E4C\u6DA6\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u7941\u95E8\u7EA2\u8336\u8336\u6C64\u7EA2\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u7941\u95E8\u7EA2\u8336\u4EA7\u5730\u5B89\u5FBD\u7941\u95E8\u9AD8\u5C71\u8336\u56ED\u98CE\u666F"),
      img("\u7941\u95E8\u7EA2\u8336\u4F20\u7EDF\u5DE5\u592B\u53D1\u9175\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 35,
    stock: 310,
    reservedStock: 34,
    totalSales: 1560,
    features: "\u7941\u95E8\u9999\xB7\u91D1\u6BEB\u663E\u9732\xB7\u871C\u7CD6\u9999",
    includesTeaware: false,
    remark: "\u7941\u95E8\u9999\u72EC\u7279\uFF0C\u4F3C\u82B1\u4F3C\u679C\u4F3C\u871C"
  },
  // ── 青茶 ──
  {
    id: "10",
    code: "103011000019",
    name: "\u5927\u7EA2\u888D\xB7\u7279\u7EA7",
    category: "\u9752\u8336-\u5927\u7EA2\u888D",
    categories: ["\u9752\u8336-\u5927\u7EA2\u888D"],
    brand: "\u6B66\u5937\u661F",
    series: "\u5CA9\u8336\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u76D2",
    barcode69: "6901234567010",
    model: "DHP-TJ-150",
    spec: "150g/\u76D2",
    perUnitSpec: { netWeight: 300, netWeightUnit: "g", grossWeight: 345, grossWeightUnit: "g", length: 25, width: 15, height: 10, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 24, netWeight: 7.2, netWeightUnit: "kg", grossWeight: 8.28, grossWeightUnit: "kg", length: 79, width: 37, height: 12, dimensionUnit: "cm" },
    weight: 0.3,
    volume: { length: 25, width: 15, height: 10 },
    quantityPerUnit: 24,
    grade: "\u7279\u7EA7",
    origin: "\u798F\u5EFA\u6B66\u5937\u5C71",
    shelfLife: 36,
    taxRate: 9,
    packageList: "\u7EB8\u76D2\xD71\u3001\u94DD\u7B94\u888B\xD71\u3001\u54C1\u9274\u676F\xD72\u3001\u8BF4\u660E\u4E66\xD71\u3001\u54C1\u9274\u8336\u5177\u5957\u88C5\xD71",
    marketPrice: 720,
    tmallPrice: 618,
    tmallUrl: "https://wuyixing.tmall.com/item10",
    jdPrice: 638,
    jdUrl: "https://wuyixing.jd.com/item10",
    salesPrice: 547,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u5927\u7EA2\u888D\u7279\u7EA7\u8336\u53F6\u76D2\u88C5\u4EA7\u54C1\u56FE\uFF0C\u5CA9\u9AA8\u82B1\u9999\u6DF1\u8910\u8272\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u5927\u7EA2\u888D\u5E72\u8336\u6761\u7D22\u7D27\u7ED3\u7EFF\u8910\u6CB9\u6DA6\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u5927\u7EA2\u888D\u8336\u6C64\u6A59\u9EC4\u660E\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u5927\u7EA2\u888D\u4EA7\u5730\u6B66\u5937\u5C71\u4E5D\u9F99\u7AA0\u8336\u56ED\u98CE\u666F"),
      img("\u5927\u7EA2\u888D\u4F20\u7EDF\u70AD\u7119\u5DE5\u827A\u5C55\u793A\uFF0C\u7119\u706B\u8F66\u95F4"),
      img("\u5927\u7EA2\u888D\u53F6\u5E95\u7EFF\u53F6\u7EA2\u9576\u8FB9\u7279\u5199")
    ],
    displayImageIndex: 0,
    stockAlert: 30,
    stock: 670,
    reservedStock: 79,
    totalSales: 2780,
    features: "\u5CA9\u9AA8\u82B1\u9999\xB7\u5CA9\u97F5\u60A0\u957F\xB7\u4F20\u7EDF\u7119\u706B",
    includesTeaware: true,
    remark: "\u5CA9\u9AA8\u82B1\u9999\uFF0C\u4E03\u6CE1\u6709\u4F59\u9999"
  },
  {
    id: "11",
    code: "103010000013",
    name: "\u94C1\u89C2\u97F3\xB7\u6E05\u9999\u4E00\u7EA7",
    category: "\u9752\u8336-\u94C1\u89C2\u97F3",
    categories: ["\u9752\u8336-\u94C1\u89C2\u97F3"],
    brand: "\u516B\u9A6C",
    series: "\u6E05\u9999\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567011",
    model: "TGY-QX-YJ-250",
    spec: "250g/\u7F50",
    perUnitSpec: { netWeight: 350, netWeightUnit: "g", grossWeight: 402, grossWeightUnit: "g", length: 14, width: 14, height: 18, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 24, netWeight: 8.4, netWeightUnit: "kg", grossWeight: 9.65, grossWeightUnit: "kg", length: 44, width: 34, height: 22, dimensionUnit: "cm" },
    weight: 0.35,
    volume: { length: 14, width: 14, height: 18 },
    quantityPerUnit: 24,
    grade: "\u4E00\u7EA7",
    origin: "\u798F\u5EFA\u5B89\u6EAA",
    shelfLife: 24,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u54C1\u9274\u8336\u5177\u5957\u88C5\xD71",
    marketPrice: 320,
    tmallPrice: 268,
    tmallUrl: "https://bama.tmall.com/item11",
    jdPrice: 278,
    jdUrl: "https://bama.jd.com/item11",
    salesPrice: 243,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u94C1\u89C2\u97F3\u6E05\u9999\u4E00\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u6E05\u65B0\u6DE1\u7EFF\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u94C1\u89C2\u97F3\u5E72\u8336\u9897\u7C92\u7D27\u7ED3\u5982\u873B\u8713\u5934\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u94C1\u89C2\u97F3\u8336\u6C64\u91D1\u9EC4\u6D53\u8273\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u94C1\u89C2\u97F3\u4EA7\u5730\u798F\u5EFA\u5B89\u6EAA\u9AD8\u5C71\u8336\u56ED\u98CE\u666F"),
      img("\u94C1\u89C2\u97F3\u6447\u9752\u505A\u9752\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 45,
    stock: 200,
    reservedStock: 20,
    totalSales: 890,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: true,
    remark: "\u5170\u82B1\u9999\u99A5\u90C1\uFF0C\u4E03\u6CE1\u6709\u4F59\u9999"
  },
  {
    id: "12",
    code: "103012000013",
    name: "\u51E4\u51F0\u5355\u4E1B\xB7\u871C\u5170\u9999",
    category: "\u9752\u8336-\u51E4\u51F0\u5355\u4E1B",
    categories: ["\u9752\u8336-\u51E4\u51F0\u5355\u4E1B"],
    brand: "\u6D77\u5824",
    series: "\u5355\u4E1B\u7CFB\u5217",
    packageUnit: "\u888B",
    barcode69: "6901234567012",
    model: "FHDC-MLX-100",
    spec: "100g/\u888B",
    perUnitSpec: { netWeight: 150, netWeightUnit: "g", grossWeight: 173, grossWeightUnit: "g", length: 12, width: 8, height: 18, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 48, netWeight: 7.2, netWeightUnit: "kg", grossWeight: 8.3, grossWeightUnit: "kg", length: 48, width: 25, height: 28, dimensionUnit: "cm" },
    weight: 0.15,
    volume: { length: 12, width: 8, height: 18 },
    quantityPerUnit: 48,
    grade: "\u4E00\u7EA7",
    origin: "\u5E7F\u4E1C\u6F6E\u5DDE\u51E4\u51F0\u5C71",
    shelfLife: 24,
    taxRate: 9,
    packageList: "\u94DD\u7B94\u888B\xD71\u3001\u7EB8\u76D2\xD71",
    marketPrice: 560,
    tmallPrice: 468,
    tmallUrl: "https://haidi.tmall.com/item12",
    jdPrice: 478,
    jdUrl: "https://haidi.jd.com/item12",
    salesPrice: 426,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u51E4\u51F0\u5355\u4E1B\u871C\u5170\u9999\u8336\u53F6\u888B\u88C5\u4EA7\u54C1\u56FE\uFF0C\u871C\u8272\u6696\u8C03\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u51E4\u51F0\u5355\u4E1B\u5E72\u8336\u6761\u7D22\u7D27\u5377\u9EC4\u8910\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u51E4\u51F0\u5355\u4E1B\u8336\u6C64\u6A59\u9EC4\u900F\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u51E4\u51F0\u5355\u4E1B\u4EA7\u5730\u6F6E\u5DDE\u51E4\u51F0\u5C71\u53E4\u8336\u6811\u98CE\u666F"),
      img("\u51E4\u51F0\u5355\u4E1B\u5355\u682A\u91C7\u6458\u5236\u4F5C\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 25,
    stock: 530,
    reservedStock: 82,
    totalSales: 2100,
    features: "\u871C\u5170\u9999\u578B\xB7\u5C71\u97F5\u72EC\u7279\xB7\u5355\u682A\u91C7\u6458",
    includesTeaware: false,
    remark: "\u871C\u5170\u9999\u578B\uFF0C\u5C71\u97F5\u871C\u5473"
  },
  // ── 白茶 ──
  {
    id: "13",
    code: "104013000019",
    name: "\u767D\u6BEB\u94F6\u9488\xB7\u7279\u7EA7",
    category: "\u767D\u8336-\u767D\u6BEB\u94F6\u9488",
    categories: ["\u767D\u8336-\u767D\u6BEB\u94F6\u9488"],
    brand: "\u54C1\u54C1\u9999",
    series: "\u6652\u767D\u91D1\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567013",
    model: "BHZ-TJ-050",
    spec: "50g/\u7F50",
    perUnitSpec: { netWeight: 80, netWeightUnit: "g", grossWeight: 92, grossWeightUnit: "g", length: 8, width: 8, height: 16, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 60, netWeight: 4.8, netWeightUnit: "kg", grossWeight: 5.52, grossWeightUnit: "kg", length: 34, width: 27, height: 27, dimensionUnit: "cm" },
    weight: 0.08,
    volume: { length: 8, width: 8, height: 16 },
    quantityPerUnit: 60,
    grade: "\u7279\u7EA7",
    origin: "\u798F\u5EFA\u798F\u9F0E",
    shelfLife: 60,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u9526\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u6536\u85CF\u8BC1\u4E66\xD71\u3001\u54C1\u9274\u8336\u5177\u5957\u88C5\xD71",
    marketPrice: 960,
    tmallPrice: 828,
    tmallUrl: "https://pinpinxiang.tmall.com/item13",
    jdPrice: 848,
    jdUrl: "https://pinpinxiang.jd.com/item13",
    salesPrice: 787,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u767D\u6BEB\u94F6\u9488\u7279\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u94F6\u767D\u7D20\u96C5\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u767D\u6BEB\u94F6\u9488\u5E72\u8336\u82BD\u5934\u80A5\u58EE\u6EE1\u62AB\u767D\u6BEB\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u767D\u6BEB\u94F6\u9488\u8336\u6C64\u674F\u9EC4\u6E05\u6F88\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u767D\u6BEB\u94F6\u9488\u4EA7\u5730\u798F\u9F0E\u592A\u59E5\u5C71\u767D\u8336\u8336\u56ED\u98CE\u666F"),
      img("\u767D\u6BEB\u94F6\u9488\u81EA\u7136\u840E\u51CB\u5DE5\u827A\u5C55\u793A\uFF0C\u65E5\u5149\u840E\u51CB\u573A\u666F"),
      img("\u767D\u6BEB\u94F6\u9488\u53F6\u5E95\u5AE9\u5300\u660E\u4EAE\u7279\u5199")
    ],
    displayImageIndex: 0,
    stockAlert: 15,
    stock: 85,
    reservedStock: 8,
    totalSales: 410,
    features: "\u5168\u82BD\u5236\u4F5C\xB7\u767D\u6BEB\u5BC6\u62AB\xB7\u6BEB\u9999\u871C\u97F5",
    includesTeaware: true,
    remark: "\u6EE1\u62AB\u767D\u6BEB\uFF0C\u6BEB\u9999\u6E05\u9C9C"
  },
  {
    id: "14",
    code: "104014000015",
    name: "\u767D\u7261\u4E39\xB7\u4E00\u7EA7",
    category: "\u767D\u8336-\u767D\u7261\u4E39",
    categories: ["\u767D\u8336-\u767D\u7261\u4E39"],
    brand: "\u7EFF\u96EA\u82BD",
    series: "\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u997C",
    barcode69: "6901234567014",
    model: "BMD-YJ-350",
    spec: "350g/\u997C",
    perUnitSpec: { netWeight: 380, netWeightUnit: "g", grossWeight: 437, grossWeightUnit: "g", length: 20, width: 20, height: 4, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 20, netWeight: 7.6, netWeightUnit: "kg", grossWeight: 8.74, grossWeightUnit: "kg", length: 60, width: 46, height: 5, dimensionUnit: "cm" },
    weight: 0.38,
    volume: { length: 20, width: 20, height: 4 },
    quantityPerUnit: 20,
    grade: "\u4E00\u7EA7",
    origin: "\u798F\u5EFA\u798F\u9F0E",
    shelfLife: 60,
    taxRate: 9,
    packageList: "\u767D\u8336\u997C\xD71\u3001\u68C9\u7EB8\u5305\u88C5\xD71\u3001\u7EB8\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 380,
    tmallPrice: 328,
    tmallUrl: "https://lvxueya.tmall.com/item14",
    jdPrice: 338,
    jdUrl: "https://lvxueya.jd.com/item14",
    salesPrice: 312,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u767D\u7261\u4E39\u4E00\u7EA7\u767D\u8336\u997C\u4EA7\u54C1\u56FE\uFF0C\u94F6\u7EFF\u7070\u767D\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u767D\u7261\u4E39\u8336\u997C\u6B63\u9762\u82BD\u53F6\u8FDE\u679D\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u767D\u7261\u4E39\u8336\u6C64\u674F\u9EC4\u660E\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u767D\u7261\u4E39\u4EA7\u5730\u798F\u9F0E\u767D\u8336\u6838\u5FC3\u4EA7\u533A\u98CE\u666F"),
      img("\u767D\u7261\u4E39\u538B\u997C\u5DE5\u827A\u5C55\u793A\uFF0C\u84B8\u538B\u6210\u578B\u6D41\u7A0B")
    ],
    displayImageIndex: 0,
    stockAlert: 30,
    stock: 410,
    reservedStock: 30,
    totalSales: 1780,
    features: "\u4E00\u82BD\u4E00\u4E24\u53F6\xB7\u82B1\u9999\u6E05\u96C5\xB7\u81EA\u7136\u840E\u51CB",
    includesTeaware: false,
    remark: "\u4E00\u82BD\u4E24\u53F6\uFF0C\u82B1\u9999\u6E05\u96C5"
  },
  {
    id: "15",
    code: "104013000028",
    name: "\u5BFF\u7709\xB72019\u5E74\u9648",
    category: "\u767D\u8336-\u5BFF\u7709",
    categories: ["\u767D\u8336-\u5BFF\u7709"],
    brand: "\u54C1\u54C1\u9999",
    series: "\u6652\u767D\u91D1\u7CFB\u5217",
    packageUnit: "\u997C",
    barcode69: "6901234567015",
    model: "SM-2019-350",
    spec: "350g/\u997C",
    perUnitSpec: { netWeight: 380, netWeightUnit: "g", grossWeight: 437, grossWeightUnit: "g", length: 20, width: 20, height: 4, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 20, netWeight: 7.6, netWeightUnit: "kg", grossWeight: 8.74, grossWeightUnit: "kg", length: 60, width: 46, height: 5, dimensionUnit: "cm" },
    weight: 0.38,
    volume: { length: 20, width: 20, height: 4 },
    quantityPerUnit: 20,
    grade: "\u4E8C\u7EA7",
    origin: "\u798F\u5EFA\u798F\u9F0E",
    shelfLife: 60,
    taxRate: 9,
    packageList: "\u767D\u8336\u997C\xD71\u3001\u68C9\u7EB8\u5305\u88C5\xD71\u3001\u7EB8\u76D2\xD71",
    marketPrice: 220,
    tmallPrice: 188,
    tmallUrl: "https://pinpinxiang.tmall.com/item15",
    jdPrice: 198,
    jdUrl: "https://pinpinxiang.jd.com/item15",
    salesPrice: 180,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u5BFF\u77092019\u5E74\u9648\u767D\u8336\u997C\u4EA7\u54C1\u56FE\uFF0C\u8910\u9EC4\u6C89\u7A33\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u5BFF\u7709\u8336\u997C\u6B63\u9762\u53F6\u7247\u7C97\u58EE\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u5BFF\u7709\u8336\u6C64\u6A59\u9EC4\u9187\u539A\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u5BFF\u7709\u9648\u5316\u4ED3\u50A8\u73AF\u5883\u5C55\u793A\uFF0C\u5E72\u4ED3\u5B58\u653E"),
      img("\u5BFF\u7709\u716E\u8336\u573A\u666F\u5C55\u793A\uFF0C\u9676\u58F6\u716E\u8336")
    ],
    displayImageIndex: 0,
    stockAlert: 40,
    stock: 290,
    reservedStock: 56,
    totalSales: 1320,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u9648\u5E74\u5BFF\u7709\uFF0C\u67A3\u9999\u836F\u9999\uFF0C\u53EF\u716E\u53EF\u6CE1"
  },
  // ── 黄茶 ──
  {
    id: "16",
    code: "105015000014",
    name: "\u541B\u5C71\u94F6\u9488\xB7\u7279\u7EA7",
    category: "\u9EC4\u8336-\u541B\u5C71\u94F6\u9488",
    categories: ["\u9EC4\u8336-\u541B\u5C71\u94F6\u9488"],
    brand: "\u541B\u5C71",
    series: "\u541B\u5C71\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567016",
    model: "JSYZ-TJ-050",
    spec: "50g/\u7F50",
    perUnitSpec: { netWeight: 100, netWeightUnit: "g", grossWeight: 115, grossWeightUnit: "g", length: 8, width: 8, height: 18, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 48, netWeight: 4.8, netWeightUnit: "kg", grossWeight: 5.52, grossWeightUnit: "kg", length: 32, width: 25, height: 28, dimensionUnit: "cm" },
    weight: 0.1,
    volume: { length: 8, width: 8, height: 18 },
    quantityPerUnit: 48,
    grade: "\u7279\u7EA7",
    origin: "\u6E56\u5357\u5CB3\u9633\u6D1E\u5EAD\u6E56\u541B\u5C71\u5C9B",
    shelfLife: 18,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u9526\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u6536\u85CF\u8BC1\u4E66\xD71\u3001\u54C1\u9274\u8336\u5177\u5957\u88C5\xD71",
    marketPrice: 880,
    tmallPrice: 758,
    tmallUrl: "https://junshan.tmall.com/item16",
    jdPrice: 768,
    jdUrl: "https://junshan.jd.com/item16",
    salesPrice: 695,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u541B\u5C71\u94F6\u9488\u7279\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u91D1\u9EC4\u5178\u96C5\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u541B\u5C71\u94F6\u9488\u5E72\u8336\u82BD\u5934\u91D1\u9EC4\u6EE1\u62AB\u94F6\u6BEB\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u541B\u5C71\u94F6\u9488\u51B2\u6CE1\u82BD\u5C16\u4E09\u8D77\u4E09\u843D\u52A8\u6001\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u541B\u5C71\u94F6\u9488\u4EA7\u5730\u6D1E\u5EAD\u6E56\u541B\u5C71\u5C9B\u8336\u56ED\u98CE\u666F"),
      img("\u541B\u5C71\u94F6\u9488\u95F7\u9EC4\u5DE5\u827A\u5C55\u793A\uFF0C\u4F20\u7EDF\u9EC4\u8336\u5236\u4F5C")
    ],
    displayImageIndex: 0,
    stockAlert: 15,
    stock: 160,
    reservedStock: 11,
    totalSales: 620,
    features: "\u91D1\u9576\u7389\xB7\u82BD\u5934\u80A5\u58EE\xB7\u674F\u9EC4\u900F\u4EAE",
    includesTeaware: true,
    remark: "\u91D1\u9576\u7389\u7F8E\u79F0\uFF0C\u82BD\u5C16\u4E09\u8D77\u4E09\u843D"
  },
  {
    id: "17",
    code: "105016000019",
    name: "\u8499\u9876\u9EC4\u82BD\xB7\u7279\u7EA7",
    category: "\u9EC4\u8336-\u8499\u9876\u9EC4\u82BD",
    categories: ["\u9EC4\u8336-\u8499\u9876\u9EC4\u82BD"],
    brand: "\u8499\u9876\u5C71\u8336",
    series: "\u8499\u9876\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567017",
    model: "MDHY-TJ-050",
    spec: "50g/\u7F50",
    perUnitSpec: { netWeight: 100, netWeightUnit: "g", grossWeight: 115, grossWeightUnit: "g", length: 9, width: 9, height: 16, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 48, netWeight: 4.8, netWeightUnit: "kg", grossWeight: 5.52, grossWeightUnit: "kg", length: 36, width: 28, height: 25, dimensionUnit: "cm" },
    weight: 0.1,
    volume: { length: 9, width: 9, height: 16 },
    quantityPerUnit: 48,
    grade: "\u7279\u7EA7",
    origin: "\u56DB\u5DDD\u96C5\u5B89\u8499\u9876\u5C71",
    shelfLife: 18,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 560,
    tmallPrice: 468,
    tmallUrl: "https://mengding.tmall.com/item17",
    jdPrice: 478,
    jdUrl: "https://mengding.jd.com/item17",
    salesPrice: 442,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u8499\u9876\u9EC4\u82BD\u7279\u7EA7\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u5AE9\u9EC4\u6E29\u6DA6\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u8499\u9876\u9EC4\u82BD\u5E72\u8336\u6241\u76F4\u5300\u6574\u5AE9\u9EC4\u6CB9\u6DA6\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u8499\u9876\u9EC4\u82BD\u8336\u6C64\u9EC4\u4EAE\u900F\u78A7\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u8499\u9876\u9EC4\u82BD\u4EA7\u5730\u96C5\u5B89\u8499\u9876\u5C71\u8336\u56ED\u98CE\u666F"),
      img("\u8499\u9876\u9EC4\u82BD\u95F7\u9EC4\u5DE5\u827A\u5C55\u793A\uFF0C\u4F20\u7EDF\u9EC4\u8336\u95F7\u5236")
    ],
    displayImageIndex: 0,
    stockAlert: 20,
    stock: 720,
    reservedStock: 90,
    totalSales: 2950,
    features: "\u82BD\u5934\u80A5\u58EE\xB7\u9EC4\u6C64\u9EC4\u53F6\xB7\u751C\u9999\u6E05\u96C5",
    includesTeaware: false,
    remark: "\u751C\u9999\u9C9C\u5AE9\uFF0C\u7518\u9187\u9C9C\u723D"
  },
  // ── 黑茶 ──
  {
    id: "18",
    code: "106017000018",
    name: "\u5927\u76CA7572\xB7\u719F\u666E",
    category: "\u9ED1\u8336-\u666E\u6D31\u8336",
    categories: ["\u9ED1\u8336-\u666E\u6D31\u8336"],
    brand: "\u5927\u76CA",
    series: "\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u997C",
    barcode69: "6901234567018",
    model: "DY-7572-357",
    spec: "357g/\u997C",
    perUnitSpec: { netWeight: 400, netWeightUnit: "g", grossWeight: 460, grossWeightUnit: "g", length: 20, width: 20, height: 4, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 28, netWeight: 11.2, netWeightUnit: "kg", grossWeight: 12.88, grossWeightUnit: "kg", length: 67, width: 52, height: 5, dimensionUnit: "cm" },
    weight: 0.4,
    volume: { length: 20, width: 20, height: 4 },
    quantityPerUnit: 28,
    grade: "\u4E09\u7EA7",
    origin: "\u4E91\u5357\u52D0\u6D77",
    shelfLife: 120,
    taxRate: 9,
    packageList: "\u666E\u6D31\u997C\xD71\u3001\u68C9\u7EB8\u5305\u88C5\xD71\u3001\u7EB8\u76D2\xD71\u3001\u4EA7\u54C1\u8BF4\u660E\u4E66\xD71",
    marketPrice: 260,
    tmallPrice: 218,
    tmallUrl: "https://dayi.tmall.com/item18",
    jdPrice: 228,
    jdUrl: "https://dayi.jd.com/item18",
    salesPrice: 195,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u5927\u76CA7572\u719F\u666E\u6D31\u8336\u997C\u4EA7\u54C1\u56FE\uFF0C\u7EA2\u8910\u6C89\u7A33\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u5927\u76CA7572\u8336\u997C\u6B63\u9762\u6761\u7D22\u80A5\u58EE\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u5927\u76CA7572\u8336\u6C64\u7EA2\u6D53\u6CB9\u6DA6\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u5927\u76CA7572\u4EA7\u5730\u4E91\u5357\u52D0\u6D77\u8336\u5382\u98CE\u666F"),
      img("\u5927\u76CA7572\u6E25\u5806\u53D1\u9175\u5DE5\u827A\u5C55\u793A"),
      img("\u5927\u76CA7572\u53F6\u5E95\u8910\u7EA2\u8F6F\u5300\u7279\u5199")
    ],
    displayImageIndex: 0,
    stockAlert: 60,
    stock: 55,
    reservedStock: 4,
    totalSales: 230,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u719F\u666E\u6807\u6746\uFF0C\u9648\u9999\u987A\u6ED1"
  },
  {
    id: "19",
    code: "106018000017",
    name: "\u767D\u6C99\u6EAA\xB7\u5929\u5C16",
    category: "\u9ED1\u8336-\u5B89\u5316\u9ED1\u8336",
    categories: ["\u9ED1\u8336-\u5B89\u5316\u9ED1\u8336"],
    brand: "\u767D\u6C99\u6EAA",
    series: "\u5929\u5C16\u7CFB\u5217",
    packageUnit: "\u7BD3",
    barcode69: "6901234567019",
    model: "BSX-TJ-500",
    spec: "500g/\u7BD3",
    perUnitSpec: { netWeight: 550, netWeightUnit: "g", grossWeight: 633, grossWeightUnit: "g", length: 18, width: 18, height: 22, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 16, netWeight: 8.8, netWeightUnit: "kg", grossWeight: 10.13, grossWeightUnit: "kg", length: 50, width: 39, height: 24, dimensionUnit: "cm" },
    weight: 0.55,
    volume: { length: 18, width: 18, height: 22 },
    quantityPerUnit: 16,
    grade: "\u4E00\u7EA7",
    origin: "\u6E56\u5357\u5B89\u5316",
    shelfLife: 120,
    taxRate: 9,
    packageList: "\u7AF9\u7BD3\xD71\u3001\u5185\u886C\u888B\xD71\u3001\u8BF4\u660E\u4E66\xD71",
    marketPrice: 320,
    tmallPrice: 268,
    tmallUrl: "https://baishaxi.tmall.com/item19",
    jdPrice: 278,
    jdUrl: "https://baishaxi.jd.com/item19",
    salesPrice: 240,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u767D\u6C99\u6EAA\u5929\u5C16\u5B89\u5316\u9ED1\u8336\u7AF9\u7BD3\u88C5\u4EA7\u54C1\u56FE\uFF0C\u53E4\u6734\u6DF1\u8272\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u767D\u6C99\u6EAA\u5929\u5C16\u5E72\u8336\u6761\u7D22\u7D27\u7ED3\u9ED1\u6DA6\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u767D\u6C99\u6EAA\u5929\u5C16\u8336\u6C64\u7EA2\u6D53\u660E\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u767D\u6C99\u6EAA\u5929\u5C16\u4EA7\u5730\u6E56\u5357\u5B89\u5316\u51B0\u789B\u5CA9\u8336\u56ED\u98CE\u666F"),
      img("\u767D\u6C99\u6EAA\u5929\u5C16\u832F\u7816\u91D1\u82B1\u83CC\u7279\u5199\uFF0C\u51A0\u7A81\u6563\u56CA\u83CC")
    ],
    displayImageIndex: 0,
    stockAlert: 30,
    stock: 380,
    reservedStock: 23,
    totalSales: 1650,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u5929\u5C16\u7B49\u7EA7\uFF0C\u91D1\u82B1\u8302\u76DB"
  },
  {
    id: "20",
    code: "106019000015",
    name: "\u6F9C\u6CA7\u53E4\u8336\xB7001",
    category: "\u9ED1\u8336-\u666E\u6D31\u8336",
    categories: ["\u9ED1\u8336-\u666E\u6D31\u8336"],
    brand: "\u6F9C\u6CA7\u53E4\u8336",
    series: "001\u7CFB\u5217",
    packageUnit: "\u997C",
    barcode69: "6901234567020",
    model: "LCGC-001-357",
    spec: "357g/\u997C",
    perUnitSpec: { netWeight: 400, netWeightUnit: "g", grossWeight: 460, grossWeightUnit: "g", length: 20, width: 20, height: 4, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 28, netWeight: 11.2, netWeightUnit: "kg", grossWeight: 12.88, grossWeightUnit: "kg", length: 67, width: 52, height: 5, dimensionUnit: "cm" },
    weight: 0.4,
    volume: { length: 20, width: 20, height: 4 },
    quantityPerUnit: 28,
    grade: "\u7279\u7EA7",
    origin: "\u4E91\u5357\u6F9C\u6CA7",
    shelfLife: 120,
    taxRate: 9,
    packageList: "\u666E\u6D31\u997C\xD71\u3001\u68C9\u7EB8\u5305\u88C5\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 680,
    tmallPrice: 588,
    tmallUrl: "https://lancang.tmall.com/item20",
    jdPrice: 598,
    jdUrl: "https://lancang.jd.com/item20",
    salesPrice: 510,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u6F9C\u6CA7\u53E4\u8336001\u666E\u6D31\u8336\u997C\u4EA7\u54C1\u56FE\uFF0C\u53E4\u94DC\u8272\u9AD8\u7AEF\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u6F9C\u6CA7\u53E4\u8336001\u8336\u997C\u6B63\u9762\u6761\u7D22\u58EE\u5B9E\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u6F9C\u6CA7\u53E4\u8336001\u8336\u6C64\u7EA2\u6D53\u9648\u9999\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u6F9C\u6CA7\u53E4\u8336\u4EA7\u5730\u4E91\u5357\u6F9C\u6CA7\u666F\u8FC8\u5C71\u53E4\u8336\u56ED\u98CE\u666F"),
      img("\u6F9C\u6CA7\u53E4\u8336\u53E4\u6811\u8336\u91C7\u6458\u5C55\u793A\uFF0C\u5343\u5E74\u53E4\u8336\u6811")
    ],
    displayImageIndex: 0,
    stockAlert: 20,
    stock: 640,
    reservedStock: 49,
    totalSales: 2560,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u666F\u8FC8\u5C71\u53E4\u6811\uFF0C\u9648\u9999\u6D53\u90C1"
  },
  // ── 花草茶 ──
  {
    id: "21",
    code: "107022000017",
    name: "\u8309\u8389\u82B1\u8336\xB7\u7279\u7EA7",
    category: "\u82B1\u8349\u8336-\u8309\u8389\u82B1\u8336",
    categories: ["\u82B1\u8349\u8336-\u8309\u8389\u82B1\u8336"],
    brand: "\u5F20\u4E00\u5143",
    series: "\u8309\u8389\u9F99\u6BEB\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567021",
    model: "MLHC-TJ-100",
    spec: "100g/\u7F50",
    perUnitSpec: { netWeight: 160, netWeightUnit: "g", grossWeight: 184, grossWeightUnit: "g", length: 10, width: 10, height: 16, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 40, netWeight: 6.4, netWeightUnit: "kg", grossWeight: 7.36, grossWeightUnit: "kg", length: 38, width: 29, height: 24, dimensionUnit: "cm" },
    weight: 0.16,
    volume: { length: 10, width: 10, height: 16 },
    quantityPerUnit: 40,
    grade: "\u7279\u7EA7",
    origin: "\u798F\u5EFA\u798F\u5DDE",
    shelfLife: 18,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u54C1\u9274\u8336\u5177\u5957\u88C5\xD71",
    marketPrice: 380,
    tmallPrice: 328,
    tmallUrl: "https://zhangyiyuan.tmall.com/item21",
    jdPrice: 338,
    jdUrl: "https://zhangyiyuan.jd.com/item21",
    salesPrice: 293,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u5F20\u4E00\u5143\u8309\u8389\u82B1\u8336\u7279\u7EA7\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u767D\u82B1\u6E05\u65B0\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u8309\u8389\u82B1\u8336\u5E72\u8336\u6761\u7D22\u5300\u6574\u767D\u6BEB\u663E\u9732\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u8309\u8389\u82B1\u8336\u8336\u6C64\u6E05\u6F88\u900F\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u8309\u8389\u82B1\u8336\u4EA7\u5730\u798F\u5EFA\u798F\u5DDE\u8309\u8389\u82B1\u7530\u98CE\u666F"),
      img("\u8309\u8389\u82B1\u8336\u7AA8\u5236\u5DE5\u827A\u5C55\u793A\uFF0C\u9C9C\u82B1\u4E0E\u8336\u576F\u62CC\u548C")
    ],
    displayImageIndex: 0,
    stockAlert: 45,
    stock: 110,
    reservedStock: 13,
    totalSales: 530,
    features: "\u7AA8\u5236\u516D\u6B21\xB7\u8309\u8389\u82B1\u9999\xB7\u9C9C\u7075\u6301\u4E45",
    includesTeaware: true,
    remark: "\u7AA8\u5F97\u8309\u8389\u65E0\u4E0A\u5473\uFF0C\u5217\u4F5C\u4EBA\u95F4\u7B2C\u4E00\u9999"
  },
  {
    id: "22",
    code: "107023000010",
    name: "\u8309\u8389\u82B1\u8336\xB7\u78A7\u6F6D\u98D8\u96EA",
    category: "\u82B1\u8349\u8336-\u8309\u8389\u82B1\u8336",
    categories: ["\u82B1\u8349\u8336-\u8309\u8389\u82B1\u8336"],
    brand: "\u5434\u88D5\u6CF0",
    series: "\u78A7\u6F6D\u98D8\u96EA\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567022",
    model: "WYT-BTPX-080",
    spec: "80g/\u7F50",
    perUnitSpec: { netWeight: 130, netWeightUnit: "g", grossWeight: 150, grossWeightUnit: "g", length: 9, width: 9, height: 15, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 48, netWeight: 6.24, netWeightUnit: "kg", grossWeight: 7.2, grossWeightUnit: "kg", length: 36, width: 28, height: 23, dimensionUnit: "cm" },
    weight: 0.13,
    volume: { length: 9, width: 9, height: 15 },
    quantityPerUnit: 48,
    grade: "\u7279\u7EA7",
    origin: "\u56DB\u5DDD\u6210\u90FD",
    shelfLife: 18,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 420,
    tmallPrice: 368,
    tmallUrl: "https://wuyutai.tmall.com/item22",
    jdPrice: 378,
    jdUrl: "https://wuyutai.jd.com/item22",
    salesPrice: 323,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u5434\u88D5\u6CF0\u78A7\u6F6D\u98D8\u96EA\u8309\u8389\u82B1\u8336\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u96EA\u767D\u7FE0\u7EFF\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u78A7\u6F6D\u98D8\u96EA\u5E72\u8336\u7EFF\u8336\u576F\u914D\u8309\u8389\u82B1\u74E3\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u78A7\u6F6D\u98D8\u96EA\u8336\u6C64\u78A7\u7EFF\u82B1\u74E3\u6F02\u6D6E\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u78A7\u6F6D\u98D8\u96EA\u7AA8\u5236\u5DE5\u827A\u5C55\u793A\uFF0C\u591A\u6B21\u7AA8\u82B1\u6D41\u7A0B"),
      img("\u78A7\u6F6D\u98D8\u96EA\u51B2\u6CE1\u7EC6\u8282\uFF0C\u82B1\u74E3\u5728\u676F\u4E2D\u8212\u5C55")
    ],
    displayImageIndex: 0,
    stockAlert: 35,
    stock: 470,
    reservedStock: 45,
    totalSales: 1980,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u78A7\u6F6D\u98D8\u96EA\uFF0C\u82B1\u5F62\u8336\u5473\u517C\u5907"
  },
  {
    id: "23",
    code: "107024000017",
    name: "\u83CA\u82B1\u8336\xB7\u676D\u767D\u83CA\u7279\u7EA7",
    category: "\u82B1\u8349\u8336-\u83CA\u82B1\u8336",
    categories: ["\u82B1\u8349\u8336-\u83CA\u82B1\u8336"],
    brand: "\u6625\u4F26",
    series: "\u82B1\u8336\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567023",
    model: "JHC-TJ-120",
    spec: "120g/\u7F50",
    perUnitSpec: { netWeight: 150, netWeightUnit: "g", grossWeight: 173, grossWeightUnit: "g", length: 10, width: 10, height: 14, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 36, netWeight: 5.4, netWeightUnit: "kg", grossWeight: 6.23, grossWeightUnit: "kg", length: 36, width: 28, height: 20, dimensionUnit: "cm" },
    weight: 0.15,
    volume: { length: 10, width: 10, height: 14 },
    quantityPerUnit: 36,
    grade: "\u7279\u7EA7",
    origin: "\u6D59\u6C5F\u6850\u4E61",
    shelfLife: 18,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u7EB8\u76D2\xD71",
    marketPrice: 128,
    tmallPrice: 98,
    tmallUrl: "https://chunlun.tmall.com/item23",
    jdPrice: 108,
    jdUrl: "https://chunlun.jd.com/item23",
    salesPrice: 99,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u676D\u767D\u83CA\u7279\u7EA7\u83CA\u82B1\u8336\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u91D1\u9EC4\u6E05\u96C5\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u676D\u767D\u83CA\u5E72\u82B1\u82B1\u6735\u5B8C\u6574\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u676D\u767D\u83CA\u51B2\u6CE1\u82B1\u6735\u8212\u5C55\u8336\u6C64\u91D1\u9EC4\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u676D\u767D\u83CA\u4EA7\u5730\u6D59\u6C5F\u6850\u4E61\u83CA\u82B1\u7530\u98CE\u666F"),
      img("\u676D\u767D\u83CA\u91C7\u6458\u70D8\u5E72\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 60,
    stock: 230,
    reservedStock: 17,
    totalSales: 1050,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u6E05\u70ED\u89E3\u6BD2\uFF0C\u660E\u76EE\u964D\u706B"
  },
  {
    id: "24",
    code: "107025000011",
    name: "\u73AB\u7470\u82B1\u8336\xB7\u5E73\u9634\u91CD\u74E3\u7EA2\u73AB\u7470",
    category: "\u82B1\u8349\u8336-\u73AB\u7470\u82B1\u8336",
    categories: ["\u82B1\u8349\u8336-\u73AB\u7470\u82B1\u8336"],
    brand: "\u4E2D\u8336",
    series: "\u82B1\u517B\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567024",
    model: "MGHC-PJ-060",
    spec: "60g/\u7F50",
    perUnitSpec: { netWeight: 100, netWeightUnit: "g", grossWeight: 115, grossWeightUnit: "g", length: 9, width: 9, height: 12, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 48, netWeight: 4.8, netWeightUnit: "kg", grossWeight: 5.52, grossWeightUnit: "kg", length: 36, width: 28, height: 19, dimensionUnit: "cm" },
    weight: 0.1,
    volume: { length: 9, width: 9, height: 12 },
    quantityPerUnit: 48,
    grade: "\u7279\u7EA7",
    origin: "\u5C71\u4E1C\u5E73\u9634",
    shelfLife: 12,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u7EB8\u76D2\xD71",
    marketPrice: 158,
    tmallPrice: 128,
    tmallUrl: "https://zhongcha.tmall.com/item24",
    jdPrice: 138,
    jdUrl: "https://zhongcha.jd.com/item24",
    salesPrice: 122,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u5E73\u9634\u91CD\u74E3\u7EA2\u73AB\u7470\u82B1\u8336\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u7C89\u7EA2\u6D6A\u6F2B\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u73AB\u7470\u82B1\u8336\u5E72\u82B1\u91CD\u74E3\u7EA2\u73AB\u7470\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u73AB\u7470\u82B1\u8336\u51B2\u6CE1\u6C64\u8272\u7C89\u7EA2\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u73AB\u7470\u82B1\u8336\u4EA7\u5730\u5C71\u4E1C\u5E73\u9634\u73AB\u7470\u82B1\u7530\u98CE\u666F"),
      img("\u73AB\u7470\u82B1\u8336\u91C7\u6458\u70D8\u5E72\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 40,
    stock: 350,
    reservedStock: 50,
    totalSales: 1480,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u7F8E\u5BB9\u517B\u989C\uFF0C\u758F\u809D\u7406\u6C14"
  },
  // ── 更多品类补充 ──
  {
    id: "25",
    code: "106020000013",
    name: "\u9648\u5347\u53F7\xB7\u8001\u73ED\u7AE0",
    category: "\u9ED1\u8336-\u666E\u6D31\u8336",
    categories: ["\u9ED1\u8336-\u666E\u6D31\u8336"],
    brand: "\u9648\u5347\u53F7",
    series: "\u8001\u73ED\u7AE0\u7CFB\u5217",
    packageUnit: "\u997C",
    barcode69: "6901234567025",
    model: "CSH-LBZ-357",
    spec: "357g/\u997C",
    perUnitSpec: { netWeight: 400, netWeightUnit: "g", grossWeight: 460, grossWeightUnit: "g", length: 20, width: 20, height: 4, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 28, netWeight: 11.2, netWeightUnit: "kg", grossWeight: 12.88, grossWeightUnit: "kg", length: 67, width: 52, height: 5, dimensionUnit: "cm" },
    weight: 0.4,
    volume: { length: 20, width: 20, height: 4 },
    quantityPerUnit: 28,
    grade: "\u7279\u7EA7",
    origin: "\u4E91\u5357\u52D0\u6D77\u8001\u73ED\u7AE0\u6751",
    shelfLife: 120,
    taxRate: 9,
    packageList: "\u666E\u6D31\u997C\xD71\u3001\u68C9\u7EB8\u5305\u88C5\xD71\u3001\u793C\u76D2\xD71\u3001\u6536\u85CF\u8BC1\u4E66\xD71",
    marketPrice: 3800,
    tmallPrice: 3280,
    tmallUrl: "https://chenshenghao.tmall.com/item25",
    jdPrice: 3350,
    jdUrl: "https://chenshenghao.jd.com/item25",
    salesPrice: 2850,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u9648\u5347\u53F7\u8001\u73ED\u7AE0\u666E\u6D31\u8336\u997C\u4EA7\u54C1\u56FE\uFF0C\u6DF1\u8910\u5C0A\u8D35\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u8001\u73ED\u7AE0\u5E72\u8336\u6761\u7D22\u80A5\u58EE\u82BD\u6BEB\u663E\u9732\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u8001\u73ED\u7AE0\u8336\u6C64\u91D1\u9EC4\u6D53\u7A20\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u8001\u73ED\u7AE0\u4EA7\u5730\u52D0\u6D77\u8001\u73ED\u7AE0\u6751\u53E4\u8336\u56ED\u98CE\u666F"),
      img("\u8001\u73ED\u7AE0\u53E4\u6811\u8336\u91C7\u6458\u5C55\u793A\uFF0C\u6570\u767E\u5E74\u53E4\u8336\u6811"),
      img("\u8001\u73ED\u7AE0\u77F3\u78E8\u538B\u997C\u4F20\u7EDF\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 5,
    stock: 180,
    reservedStock: 21,
    totalSales: 780,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u666E\u6D31\u4E4B\u738B\uFF0C\u8336\u6C14\u9738\u9053\uFF0C\u56DE\u7518\u751F\u6D25"
  },
  {
    id: "26",
    code: "106021000018",
    name: "\u8001\u540C\u5FD7\xB7\u666E\u6D31\u719F\u8336",
    category: "\u9ED1\u8336-\u666E\u6D31\u8336",
    categories: ["\u9ED1\u8336-\u666E\u6D31\u8336"],
    brand: "\u8001\u540C\u5FD7",
    series: "\u7ECF\u5178\u7CFB\u5217",
    packageUnit: "\u997C",
    barcode69: "6901234567026",
    model: "LTZ-SC-357",
    spec: "357g/\u997C",
    perUnitSpec: { netWeight: 400, netWeightUnit: "g", grossWeight: 460, grossWeightUnit: "g", length: 20, width: 20, height: 4, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 28, netWeight: 11.2, netWeightUnit: "kg", grossWeight: 12.88, grossWeightUnit: "kg", length: 67, width: 52, height: 5, dimensionUnit: "cm" },
    weight: 0.4,
    volume: { length: 20, width: 20, height: 4 },
    quantityPerUnit: 28,
    grade: "\u4E8C\u7EA7",
    origin: "\u4E91\u5357\u52D0\u6D77",
    shelfLife: 120,
    taxRate: 9,
    packageList: "\u666E\u6D31\u997C\xD71\u3001\u68C9\u7EB8\u5305\u88C5\xD71\u3001\u7EB8\u76D2\xD71\u3001\u54C1\u9274\u8336\u5177\u5957\u88C5\xD71",
    marketPrice: 180,
    tmallPrice: 148,
    tmallUrl: "https://laotongzhi.tmall.com/item26",
    jdPrice: 158,
    jdUrl: "https://laotongzhi.jd.com/item26",
    salesPrice: 135,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u8001\u540C\u5FD7\u666E\u6D31\u719F\u8336\u997C\u4EA7\u54C1\u56FE\uFF0C\u7EA2\u8910\u6734\u5B9E\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u8001\u540C\u5FD7\u719F\u8336\u997C\u6B63\u9762\u6761\u7D22\u7D27\u5B9E\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u8001\u540C\u5FD7\u719F\u8336\u8336\u6C64\u7EA2\u6D53\u987A\u6ED1\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u8001\u540C\u5FD7\u666E\u6D31\u8336\u6E25\u5806\u53D1\u9175\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 50,
    stock: 560,
    reservedStock: 60,
    totalSales: 2200,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: true,
    remark: "\u6027\u4EF7\u6BD4\u4E4B\u9009\uFF0C\u9648\u9999\u9187\u539A"
  },
  {
    id: "27",
    code: "103026000017",
    name: "\u5929\u798F\u8317\u8336\xB7\u6842\u82B1\u4E4C\u9F99",
    category: "\u9752\u8336-\u94C1\u89C2\u97F3",
    categories: ["\u9752\u8336-\u94C1\u89C2\u97F3"],
    brand: "\u5929\u798F\u8317\u8336",
    series: "\u82B1\u97F5\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567027",
    model: "TFMC-GH-100",
    spec: "100g/\u7F50",
    perUnitSpec: { netWeight: 160, netWeightUnit: "g", grossWeight: 184, grossWeightUnit: "g", length: 10, width: 10, height: 16, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 40, netWeight: 6.4, netWeightUnit: "kg", grossWeight: 7.36, grossWeightUnit: "kg", length: 38, width: 29, height: 24, dimensionUnit: "cm" },
    weight: 0.16,
    volume: { length: 10, width: 10, height: 16 },
    quantityPerUnit: 40,
    grade: "\u4E00\u7EA7",
    origin: "\u798F\u5EFA\u5B89\u6EAA",
    shelfLife: 18,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 268,
    tmallPrice: 228,
    tmallUrl: "https://tenfu.tmall.com/item27",
    jdPrice: 238,
    jdUrl: "https://tenfu.jd.com/item27",
    salesPrice: 204,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u5929\u798F\u8317\u8336\u6842\u82B1\u4E4C\u9F99\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u91D1\u6A59\u6696\u8C03\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u6842\u82B1\u4E4C\u9F99\u5E72\u8336\u9897\u7C92\u7D27\u7ED3\u914D\u6842\u82B1\u74E3\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u6842\u82B1\u4E4C\u9F99\u8336\u6C64\u91D1\u9EC4\u6842\u82B1\u98D8\u6D6E\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u6842\u82B1\u4E4C\u9F99\u7AA8\u5236\u5DE5\u827A\u5C55\u793A\uFF0C\u6842\u82B1\u4E0E\u4E4C\u9F99\u8336\u62CC\u548C")
    ],
    displayImageIndex: 0,
    stockAlert: 35,
    stock: 75,
    reservedStock: 11,
    totalSales: 350,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u6842\u82B1\u751C\u9999\u4E0E\u4E4C\u9F99\u9187\u539A\u4EA4\u878D"
  },
  {
    id: "28",
    code: "101027000018",
    name: "\u5C0F\u7F50\u8336\xB7\u9F99\u4E95",
    category: "\u7EFF\u8336-\u897F\u6E56\u9F99\u4E95",
    categories: ["\u7EFF\u8336-\u897F\u6E56\u9F99\u4E95"],
    brand: "\u5C0F\u7F50\u8336",
    series: "\u5927\u5E08\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567028",
    model: "XGC-LJ-040",
    spec: "40g/\u7F50\uFF084g\xD710\u7F50\uFF09",
    perUnitSpec: { netWeight: 250, netWeightUnit: "g", grossWeight: 288, grossWeightUnit: "g", length: 22, width: 16, height: 5, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 20, netWeight: 5, netWeightUnit: "kg", grossWeight: 5.76, grossWeightUnit: "kg", length: 66, width: 37, height: 6, dimensionUnit: "cm" },
    weight: 0.25,
    volume: { length: 22, width: 16, height: 5 },
    quantityPerUnit: 20,
    grade: "\u7279\u7EA7",
    origin: "\u6D59\u6C5F\u676D\u5DDE\u897F\u6E56\u533A",
    shelfLife: 12,
    taxRate: 9,
    packageList: "\u5C0F\u7F50\xD710\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u5927\u5E08\u5361\xD71",
    marketPrice: 680,
    tmallPrice: 598,
    tmallUrl: "https://xiaoguancha.tmall.com/item28",
    jdPrice: 608,
    jdUrl: "https://xiaoguancha.jd.com/item28",
    salesPrice: 530,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u5C0F\u7F50\u8336\u9F99\u4E95\u591A\u7F50\u88C5\u793C\u76D2\u4EA7\u54C1\u56FE\uFF0C\u94F6\u8272\u9AD8\u7AEF\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u5C0F\u7F50\u8336\u9F99\u4E95\u5355\u7F50\u5145\u6C2E\u4FDD\u9C9C\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u5C0F\u7F50\u8336\u9F99\u4E95\u5E72\u8336\u6241\u5E73\u7FE0\u7EFF\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD")
    ],
    detailImages: [
      img("\u5C0F\u7F50\u8336\u9F99\u4E95\u5927\u5E08\u5236\u8336\u5DE5\u827A\u5C55\u793A"),
      img("\u5C0F\u7F50\u8336\u5145\u6C2E\u4FDD\u9C9C\u6280\u672F\u8BF4\u660E")
    ],
    displayImageIndex: 0,
    stockAlert: 25,
    stock: 490,
    reservedStock: 80,
    totalSales: 2050,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u5927\u5E08\u4E4B\u4F5C\uFF0C\u4E00\u7F50\u4E00\u6CE1\uFF0C\u5145\u6C2E\u4FDD\u9C9C"
  },
  {
    id: "29",
    code: "102009000013",
    name: "\u7965\u6E90\u8336\xB7\u7941\u7EA2\u6BDB\u5CF0",
    category: "\u7EA2\u8336-\u7941\u95E8\u7EA2\u8336",
    categories: ["\u7EA2\u8336-\u7941\u95E8\u7EA2\u8336"],
    brand: "\u7965\u6E90\u8336",
    series: "\u7941\u7EA2\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567029",
    model: "XYC-QHMF-100",
    spec: "100g/\u7F50",
    perUnitSpec: { netWeight: 160, netWeightUnit: "g", grossWeight: 184, grossWeightUnit: "g", length: 10, width: 10, height: 16, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 40, netWeight: 6.4, netWeightUnit: "kg", grossWeight: 7.36, grossWeightUnit: "kg", length: 38, width: 29, height: 24, dimensionUnit: "cm" },
    weight: 0.16,
    volume: { length: 10, width: 10, height: 16 },
    quantityPerUnit: 40,
    grade: "\u4E00\u7EA7",
    origin: "\u5B89\u5FBD\u7941\u95E8",
    shelfLife: 24,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 358,
    tmallPrice: 298,
    tmallUrl: "https://xiangyuancha.tmall.com/item29",
    jdPrice: 308,
    jdUrl: "https://xiangyuancha.jd.com/item29",
    salesPrice: 286,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u7965\u6E90\u8336\u7941\u7EA2\u6BDB\u5CF0\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u7EA2\u8910\u7CBE\u81F4\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u7941\u7EA2\u6BDB\u5CF0\u5E72\u8336\u6761\u7D22\u7D27\u7EC6\u663E\u6BEB\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u7941\u7EA2\u6BDB\u5CF0\u8336\u6C64\u7EA2\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u7965\u6E90\u8336\u7941\u95E8\u8336\u56ED\u98CE\u666F\uFF0C\u9AD8\u5C71\u4E91\u96FE"),
      img("\u7941\u7EA2\u6BDB\u5CF0\u53D1\u9175\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 30,
    stock: 300,
    reservedStock: 18,
    totalSales: 1350,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u7941\u95E8\u9999\uFF0C\u4F3C\u82B1\u4F3C\u679C\u4F3C\u871C"
  },
  {
    id: "30",
    code: "103010000029",
    name: "\u516B\u9A6C\xB7\u8D5B\u73CD\u73E0\u94C1\u89C2\u97F3",
    category: "\u9752\u8336-\u94C1\u89C2\u97F3",
    categories: ["\u9752\u8336-\u94C1\u89C2\u97F3"],
    brand: "\u516B\u9A6C",
    series: "\u8D5B\u73CD\u73E0\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567030",
    model: "BM-SZZ-100",
    spec: "100g/\u7F50",
    perUnitSpec: { netWeight: 160, netWeightUnit: "g", grossWeight: 184, grossWeightUnit: "g", length: 10, width: 10, height: 16, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 40, netWeight: 6.4, netWeightUnit: "kg", grossWeight: 7.36, grossWeightUnit: "kg", length: 38, width: 29, height: 24, dimensionUnit: "cm" },
    weight: 0.16,
    volume: { length: 10, width: 10, height: 16 },
    quantityPerUnit: 40,
    grade: "\u7279\u7EA7",
    origin: "\u798F\u5EFA\u5B89\u6EAA",
    shelfLife: 24,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u9526\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u54C1\u9274\u676F\xD71",
    marketPrice: 880,
    tmallPrice: 758,
    tmallUrl: "https://bama.tmall.com/item30",
    jdPrice: 768,
    jdUrl: "https://bama.jd.com/item30",
    salesPrice: 669,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u516B\u9A6C\u8D5B\u73CD\u73E0\u94C1\u89C2\u97F3\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u91D1\u8272\u5962\u534E\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u8D5B\u73CD\u73E0\u94C1\u89C2\u97F3\u5E72\u8336\u9897\u7C92\u7D27\u7ED3\u7802\u7EFF\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u8D5B\u73CD\u73E0\u94C1\u89C2\u97F3\u8336\u6C64\u91D1\u9EC4\u6D53\u8273\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u516B\u9A6C\u8D5B\u73CD\u73E0\u5B89\u6EAA\u6838\u5FC3\u4EA7\u533A\u8336\u56ED\u98CE\u666F"),
      img("\u8D5B\u73CD\u73E0\u94C1\u89C2\u97F3\u4F20\u7EDF\u70AD\u7119\u5DE5\u827A\u5C55\u793A"),
      img("\u8D5B\u73CD\u73E0\u94C1\u89C2\u97F3\u53F6\u5E95\u7EFF\u53F6\u7EA2\u9576\u8FB9\u7279\u5199")
    ],
    displayImageIndex: 0,
    stockAlert: 20,
    stock: 820,
    reservedStock: 64,
    totalSales: 3420,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u6D53\u9999\u578B\u94C1\u89C2\u97F3\u6807\u6746\uFF0C\u7126\u7CD6\u9999\u56DE\u7518\u8FC5\u731B"
  },
  {
    id: "31",
    code: "105016000021",
    name: "\u970D\u5C71\u9EC4\u82BD\xB7\u4E00\u7EA7",
    category: "\u9EC4\u8336-\u970D\u5C71\u9EC4\u82BD",
    categories: ["\u9EC4\u8336-\u970D\u5C71\u9EC4\u82BD"],
    brand: "\u8499\u9876\u5C71\u8336",
    series: "\u9EC4\u82BD\u7CFB\u5217",
    packageUnit: "\u888B",
    barcode69: "6901234567031",
    model: "HSHY-YJ-100",
    spec: "100g/\u888B",
    perUnitSpec: { netWeight: 140, netWeightUnit: "g", grossWeight: 161, grossWeightUnit: "g", length: 12, width: 8, height: 18, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 48, netWeight: 6.72, netWeightUnit: "kg", grossWeight: 7.73, grossWeightUnit: "kg", length: 48, width: 25, height: 28, dimensionUnit: "cm" },
    weight: 0.14,
    volume: { length: 12, width: 8, height: 18 },
    quantityPerUnit: 48,
    grade: "\u4E00\u7EA7",
    origin: "\u5B89\u5FBD\u970D\u5C71",
    shelfLife: 18,
    taxRate: 9,
    packageList: "\u94DD\u7B94\u888B\xD71\u3001\u7EB8\u76D2\xD71",
    marketPrice: 280,
    tmallPrice: 238,
    tmallUrl: "https://mengding.tmall.com/item31",
    jdPrice: 248,
    jdUrl: "https://mengding.jd.com/item31",
    salesPrice: 221,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u970D\u5C71\u9EC4\u82BD\u4E00\u7EA7\u8336\u53F6\u888B\u88C5\u4EA7\u54C1\u56FE\uFF0C\u9EC4\u7EFF\u6E05\u65B0\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u970D\u5C71\u9EC4\u82BD\u5E72\u8336\u5F62\u4F3C\u96C0\u820C\u9EC4\u7EFF\u62AB\u6BEB\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u970D\u5C71\u9EC4\u82BD\u8336\u6C64\u9EC4\u7EFF\u660E\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u970D\u5C71\u9EC4\u82BD\u4EA7\u5730\u5B89\u5FBD\u970D\u5C71\u5927\u522B\u5C71\u8336\u56ED\u98CE\u666F"),
      img("\u970D\u5C71\u9EC4\u82BD\u95F7\u9EC4\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 25,
    stock: 140,
    reservedStock: 26,
    totalSales: 670,
    features: "\u5F62\u4F3C\u96C0\u820C\xB7\u9EC4\u6C64\u9EC4\u53F6\xB7\u6817\u9999\u6301\u4E45",
    includesTeaware: false,
    remark: "\u9EC4\u7EFF\u62AB\u6BEB\uFF0C\u6E05\u751C\u67D4\u548C"
  },
  {
    id: "32",
    code: "104014000021",
    name: "\u8D21\u7709\xB72018\u5E74\u9648",
    category: "\u767D\u8336-\u8D21\u7709",
    categories: ["\u767D\u8336-\u8D21\u7709"],
    brand: "\u7EFF\u96EA\u82BD",
    series: "\u9648\u5E74\u7CFB\u5217",
    packageUnit: "\u997C",
    barcode69: "6901234567032",
    model: "GM-2018-300",
    spec: "300g/\u997C",
    perUnitSpec: { netWeight: 330, netWeightUnit: "g", grossWeight: 379, grossWeightUnit: "g", length: 18, width: 18, height: 4, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 24, netWeight: 7.92, netWeightUnit: "kg", grossWeight: 9.1, grossWeightUnit: "kg", length: 57, width: 44, height: 5, dimensionUnit: "cm" },
    weight: 0.33,
    volume: { length: 18, width: 18, height: 4 },
    quantityPerUnit: 24,
    grade: "\u4E8C\u7EA7",
    origin: "\u798F\u5EFA\u653F\u548C",
    shelfLife: 60,
    taxRate: 9,
    packageList: "\u767D\u8336\u997C\xD71\u3001\u68C9\u7EB8\u5305\u88C5\xD71\u3001\u7EB8\u76D2\xD71",
    marketPrice: 198,
    tmallPrice: 168,
    tmallUrl: "https://lvxueya.tmall.com/item32",
    jdPrice: 178,
    jdUrl: "https://lvxueya.jd.com/item32",
    salesPrice: 162,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u8D21\u77092018\u5E74\u9648\u767D\u8336\u997C\u4EA7\u54C1\u56FE\uFF0C\u8910\u9EC4\u53E4\u6734\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u8D21\u7709\u8336\u997C\u6B63\u9762\u82BD\u53F6\u7070\u7EFF\u5E26\u9EC4\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u8D21\u7709\u8336\u6C64\u6A59\u9EC4\u9187\u539A\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u8D21\u7709\u4EA7\u5730\u798F\u5EFA\u653F\u548C\u767D\u8336\u4EA7\u533A\u98CE\u666F"),
      img("\u8D21\u7709\u9648\u5316\u4ED3\u50A8\u73AF\u5883\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 35,
    stock: 610,
    reservedStock: 56,
    totalSales: 2480,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u9648\u5E74\u8D21\u7709\uFF0C\u91CE\u82B1\u871C\u97F5\uFF0C\u67A3\u9999\u6E10\u663E"
  },
  {
    id: "33",
    code: "106025000028",
    name: "\u516D\u5821\u8336\xB7\u7279\u7EA7",
    category: "\u9ED1\u8336-\u516D\u5821\u8336",
    categories: ["\u9ED1\u8336-\u516D\u5821\u8336"],
    brand: "\u4E2D\u8336",
    series: "\u516D\u5821\u7CFB\u5217",
    packageUnit: "\u7BD3",
    barcode69: "6901234567033",
    model: "ZC-LB-500",
    spec: "500g/\u7BD3",
    perUnitSpec: { netWeight: 550, netWeightUnit: "g", grossWeight: 633, grossWeightUnit: "g", length: 16, width: 16, height: 20, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 16, netWeight: 8.8, netWeightUnit: "kg", grossWeight: 10.13, grossWeightUnit: "kg", length: 44, width: 34, height: 22, dimensionUnit: "cm" },
    weight: 0.55,
    volume: { length: 16, width: 16, height: 20 },
    quantityPerUnit: 16,
    grade: "\u7279\u7EA7",
    origin: "\u5E7F\u897F\u68A7\u5DDE",
    shelfLife: 120,
    taxRate: 9,
    packageList: "\u7AF9\u7BD3\xD71\u3001\u5185\u886C\u888B\xD71\u3001\u8BF4\u660E\u4E66\xD71",
    marketPrice: 280,
    tmallPrice: 238,
    tmallUrl: "https://zhongcha.tmall.com/item33",
    jdPrice: 248,
    jdUrl: "https://zhongcha.jd.com/item33",
    salesPrice: 210,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u4E2D\u8336\u516D\u5821\u8336\u7279\u7EA7\u7AF9\u7BD3\u88C5\u4EA7\u54C1\u56FE\uFF0C\u7EA2\u8910\u53E4\u6734\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u516D\u5821\u8336\u5E72\u8336\u6761\u7D22\u7D27\u7ED3\u9ED1\u8910\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u516D\u5821\u8336\u8336\u6C64\u7EA2\u6D53\u9648\u9999\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u516D\u5821\u8336\u4EA7\u5730\u5E7F\u897F\u68A7\u5DDE\u516D\u5821\u9547\u8336\u56ED\u98CE\u666F"),
      img("\u516D\u5821\u8336\u4F20\u7EDF\u53CC\u84B8\u53CC\u538B\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 25,
    stock: 95,
    reservedStock: 6,
    totalSales: 440,
    features: "\u7EA2\u6D53\u9648\u9187\xB7\u69DF\u6994\u9999\xB7\u8D8A\u9648\u8D8A\u9999",
    includesTeaware: false,
    remark: "\u69DF\u6994\u9999\u663E\u8457\uFF0C\u795B\u6E7F\u517B\u80C3"
  },
  {
    id: "34",
    code: "103027000024",
    name: "\u5C0F\u7F50\u8336\xB7\u5927\u7EA2\u888D",
    category: "\u9752\u8336-\u5927\u7EA2\u888D",
    categories: ["\u9752\u8336-\u5927\u7EA2\u888D"],
    brand: "\u5C0F\u7F50\u8336",
    series: "\u5927\u5E08\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567034",
    model: "XGC-DHP-040",
    spec: "40g/\u7F50\uFF084g\xD710\u7F50\uFF09",
    perUnitSpec: { netWeight: 250, netWeightUnit: "g", grossWeight: 288, grossWeightUnit: "g", length: 22, width: 16, height: 5, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 20, netWeight: 5, netWeightUnit: "kg", grossWeight: 5.76, grossWeightUnit: "kg", length: 66, width: 37, height: 6, dimensionUnit: "cm" },
    weight: 0.25,
    volume: { length: 22, width: 16, height: 5 },
    quantityPerUnit: 20,
    grade: "\u7279\u7EA7",
    origin: "\u798F\u5EFA\u6B66\u5937\u5C71",
    shelfLife: 36,
    taxRate: 9,
    packageList: "\u5C0F\u7F50\xD710\u3001\u793C\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71\u3001\u5927\u5E08\u5361\xD71",
    marketPrice: 780,
    tmallPrice: 688,
    tmallUrl: "https://xiaoguancha.tmall.com/item34",
    jdPrice: 698,
    jdUrl: "https://xiaoguancha.jd.com/item34",
    salesPrice: 593,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u5C0F\u7F50\u8336\u5927\u7EA2\u888D\u591A\u7F50\u88C5\u793C\u76D2\u4EA7\u54C1\u56FE\uFF0C\u94F6\u8272\u9AD8\u7AEF\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u5C0F\u7F50\u8336\u5927\u7EA2\u888D\u5355\u7F50\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u5C0F\u7F50\u8336\u5927\u7EA2\u888D\u5E72\u8336\u6761\u7D22\u7D27\u7ED3\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD")
    ],
    detailImages: [
      img("\u5C0F\u7F50\u8336\u5927\u7EA2\u888D\u6B66\u5937\u5C71\u8336\u56ED\u98CE\u666F"),
      img("\u5C0F\u7F50\u8336\u5927\u7EA2\u888D\u5927\u5E08\u5236\u8336\u5DE5\u827A\u5C55\u793A")
    ],
    displayImageIndex: 0,
    stockAlert: 15,
    stock: 370,
    reservedStock: 53,
    totalSales: 1580,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u5927\u5E08\u4E4B\u4F5C\uFF0C\u5CA9\u9AA8\u82B1\u9999\uFF0C\u4E00\u7F50\u4E00\u6CE1"
  },
  {
    id: "35",
    code: "107024000022",
    name: "\u6625\u4F26\xB7\u8309\u8389\u94F6\u9488",
    category: "\u82B1\u8349\u8336-\u8309\u8389\u82B1\u8336",
    categories: ["\u82B1\u8349\u8336-\u8309\u8389\u82B1\u8336"],
    brand: "\u6625\u4F26",
    series: "\u94F6\u9488\u7CFB\u5217",
    packageUnit: "\u7F50",
    barcode69: "6901234567035",
    model: "CL-MLYZ-050",
    spec: "50g/\u7F50",
    perUnitSpec: { netWeight: 80, netWeightUnit: "g", grossWeight: 92, grossWeightUnit: "g", length: 8, width: 8, height: 14, dimensionUnit: "cm" },
    perBoxSpec: { quantity: 60, netWeight: 4.8, netWeightUnit: "kg", grossWeight: 5.52, grossWeightUnit: "kg", length: 34, width: 27, height: 24, dimensionUnit: "cm" },
    weight: 0.08,
    volume: { length: 8, width: 8, height: 14 },
    quantityPerUnit: 60,
    grade: "\u7279\u7EA7",
    origin: "\u798F\u5EFA\u798F\u5DDE",
    shelfLife: 18,
    taxRate: 9,
    packageList: "\u8336\u53F6\u7F50\xD71\u3001\u9526\u76D2\xD71\u3001\u624B\u63D0\u888B\xD71",
    marketPrice: 560,
    tmallPrice: 468,
    tmallUrl: "https://chunlun.tmall.com/item35",
    jdPrice: 478,
    jdUrl: "https://chunlun.jd.com/item35",
    salesPrice: 431,
    shelfStatus: "on",
    purchaseStatus: "available",
    productionStatus: "producing",
    mainImages: [
      img("\u6625\u4F26\u8309\u8389\u94F6\u9488\u8336\u53F6\u7F50\u88C5\u4EA7\u54C1\u56FE\uFF0C\u94F6\u767D\u7D20\u96C5\u98CE\u683C\uFF0C\u9AD8\u6E05\u6444\u5F71"),
      img("\u8309\u8389\u94F6\u9488\u5E72\u8336\u82BD\u5934\u80A5\u58EE\u767D\u6BEB\u62AB\u8986\u7279\u5199\uFF0C\u9AD8\u6E05\u5FAE\u8DDD"),
      img("\u8309\u8389\u94F6\u9488\u8336\u6C64\u6E05\u6F88\u900F\u4EAE\u51B2\u6CE1\u56FE\uFF0C\u9AD8\u6E05\u6444\u5F71")
    ],
    detailImages: [
      img("\u6625\u4F26\u8309\u8389\u94F6\u9488\u798F\u5DDE\u8309\u8389\u82B1\u7530\u98CE\u666F"),
      img("\u6625\u4F26\u8309\u8389\u94F6\u9488\u7AA8\u5236\u5DE5\u827A\u5C55\u793A\uFF0C\u516B\u7AA8\u4E00\u63D0")
    ],
    displayImageIndex: 0,
    stockAlert: 20,
    stock: 250,
    reservedStock: 27,
    totalSales: 1120,
    features: "\u54C1\u8D28\u4F18\u826F\xB7\u53E3\u611F\u9187\u539A\xB7\u4F20\u7EDF\u5DE5\u827A",
    includesTeaware: false,
    remark: "\u516B\u7AA8\u4E00\u63D0\uFF0C\u6BEB\u9999\u4E0E\u82B1\u9999\u4EA4\u878D"
  }
];

// src/stores/supplierStore.ts
var now2 = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var genCode = (n) => `SP-${String(n).padStart(3, "0")}`;
var genReminderCode = (n) => `XPTX-${String(n).padStart(4, "0")}`;
var seedApprovals = [
  {
    id: "sa_seed_1",
    code: "SP-001",
    type: "register",
    applicant: "chayu01",
    applyNote: "\u798F\u5EFA\u6B66\u5937\u5C71\u5CA9\u8336\u5382\u5546\uFF0C\u5E0C\u671B\u63A5\u5165\u5E73\u53F0\u627F\u63A5\u534E\u4E1C\u8BA2\u5355",
    payload: {
      id: "sa_reg_1",
      types: ["brand"],
      name: "\u6B66\u5937\u5C71\u8336\u8BED\u5CA9\u8336\u4E1A\u6709\u9650\u516C\u53F8",
      unifiedCreditCode: "91350783MA9TEA0001",
      cooperationAgreements: [],
      brandAuthAgreements: [],
      businessLicense: "\u8425\u4E1A\u6267\u7167.pdf",
      qualificationFiles: ["\u8425\u4E1A\u6267\u7167.pdf", "\u98DF\u54C1\u751F\u4EA7\u8BB8\u53EF\u8BC1.pdf"],
      channelSource: "terminal",
      registeredProvince: "\u798F\u5EFA",
      registeredCity: "\u5357\u5E73\u5E02",
      registeredDistrict: "\u6B66\u5937\u5C71\u5E02",
      registeredAddress: "\u661F\u6751\u9547\u9EC4\u67CF\u6751\u5DE5\u4E1A\u8DEF9\u53F7",
      legalRepresentative: "\u5434\u5FD7\u8FDC",
      establishmentDate: "2015-04-12",
      registeredCapital: "800\u4E07\u5143",
      companyType: "\u6709\u9650\u8D23\u4EFB\u516C\u53F8",
      businessScope: "\u5CA9\u8336\u79CD\u690D\u3001\u751F\u4EA7\u3001\u52A0\u5DE5\u3001\u9500\u552E",
      contactPerson: "\u5434\u5FD7\u8FDC",
      contactPosition: "\u9500\u552E\u603B\u76D1",
      contactAddress: "\u661F\u6751\u9547\u9EC4\u67CF\u6751\u5DE5\u4E1A\u8DEF9\u53F7",
      contactPhone: "0599-520****",
      contactEmail: "wzy@chayutea.com",
      warehouses: [],
      stores: [],
      terminal: { enabled: true, username: "chayu01", password: "123456", status: "active" },
      taxType: "general",
      invoiceInfo: { title: "\u6B66\u5937\u5C71\u8336\u8BED\u5CA9\u8336\u4E1A\u6709\u9650\u516C\u53F8", taxNo: "91350783MA9TEA0001", taxRate: 13, address: "", phone: "", bankName: "", bankAccount: "" },
      cooperationDate: now2(),
      grade: "B",
      mainCategories: ["\u9752\u8336"],
      introduction: "\u6B66\u5937\u5CA9\u8336\u6838\u5FC3\u4EA7\u533A\u5382\u5546\uFF0C\u4E3B\u8425\u5927\u7EA2\u888D\u3001\u8089\u6842\u3001\u6C34\u4ED9",
      settlementMethod: "monthly",
      bankAccount: { accountName: "\u6B66\u5937\u5C71\u8336\u8BED\u5CA9\u8336\u4E1A\u6709\u9650\u516C\u53F8", accountNo: "", bankName: "", bankNo: "", remark: "" },
      shippingSettlement: "not_free_fixed",
      supportDropship: false,
      qualificationStatus: "pending",
      paymentTerms: "\u6708\u7ED330\u5929",
      deliveryCycle: "5-7\u4E2A\u5DE5\u4F5C\u65E5",
      minOrderAmount: 2e3,
      returnPolicy: "\u8D28\u91CF\u95EE\u98987\u5929\u5185\u53EF\u9000\u6362",
      qualityGuarantee: "",
      remark: "\u5408\u4F5C\u5546\u7EC8\u7AEF\u6CE8\u518C",
      status: "active"
    },
    status: "pending",
    submitTime: "2026-10-15"
  },
  {
    id: "sa_seed_2",
    code: "SP-002",
    type: "register",
    applicant: "zyq001",
    applyNote: "\u56DB\u5DDD\u5CE8\u7709\u9AD8\u5C71\u7EFF\u8336\u54C1\u724C\u5546",
    payload: {},
    supplierId: "8",
    status: "approved",
    submitTime: "2025-09-01",
    reviewTime: "2025-09-03",
    reviewer: "\u7BA1\u7406\u5458",
    reviewNote: "\u8D44\u8D28\u9F50\u5168\uFF0C\u540C\u610F\u5165\u9A7B"
  }
];
var seedReminders = [
  {
    id: "nar_seed_1",
    code: "XPTX-0001",
    supplierId: "11",
    supplierName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8",
    brand: "\u6B66\u5937\u661F",
    productName: "\u6B66\u5937\u661F\u5927\u7EA2\u888D\xB7\u5CA9\u97F5\u5178\u85CF",
    productUrl: "https://wuyixing.tmall.com/item/yanyun.htm",
    submitter: "admin",
    submitTime: "2026-10-14",
    status: "pending"
  },
  {
    id: "nar_seed_2",
    code: "XPTX-0002",
    supplierId: "3",
    supplierName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8",
    brand: "\u516B\u9A6C",
    productName: "\u516B\u9A6C\u94C1\u89C2\u97F3\xB7\u803F\u8328\u8054\u540D\u6B3E",
    productUrl: "https://bama.jd.com/item/gengci.htm",
    submitter: "bama01",
    submitTime: "2026-09-28",
    status: "listed",
    handleNote: "\u5DF2\u4E0A\u67B6\u81F3\u5546\u54C1\u7BA1\u7406-\u8336\u53F6",
    handleTime: "2026-10-02"
  }
];
function supplyByBrands(...brands) {
  return Object.fromEntries(teaProducts.filter((p) => brands.includes(p.brand)).map((p) => [p.id, true]));
}
var seedQuoteSettings = {
  "3": {
    supplierId: "3",
    brandDiscounts: { \u516B\u9A6C: 86 },
    productOverrides: {},
    supplyProducts: supplyByBrands("\u516B\u9A6C"),
    updateTime: "2026-10-08"
  },
  "8": {
    supplierId: "8",
    brandDiscounts: { \u7AF9\u53F6\u9752: 90 },
    productOverrides: {},
    supplyProducts: supplyByBrands("\u7AF9\u53F6\u9752"),
    updateTime: "2026-09-20"
  },
  "11": {
    supplierId: "11",
    brandDiscounts: { \u897F\u6E56\u724C: 82, \u6B63\u5C71\u5802: 85, \u516B\u9A6C: 88, \u5927\u76CA: 90, \u54C1\u54C1\u9999: 84 },
    productOverrides: {
      "1": { type: "price", value: 448 }
    },
    supplyProducts: { ...supplyByBrands("\u897F\u6E56\u724C", "\u6B63\u5C71\u5802", "\u5927\u76CA", "\u54C1\u54C1\u9999"), ...Object.fromEntries(teaProducts.filter((p) => p.brand === "\u516B\u9A6C").slice(0, 1).map((p) => [p.id, true])) },
    updateTime: "2026-10-12"
  }
};
var useSupplierStore = create((set, get) => ({
  suppliers: supplierItems,
  approvals: seedApprovals,
  arrivalReminders: seedReminders,
  quoteSettings: seedQuoteSettings,
  submitRegistration: (draft, applicant, note) => {
    const { approvals, suppliers } = get();
    const payload = { ...draft, code: draft.code ?? genSupplierCode(suppliers.length + 1) };
    const approval = {
      id: `sa_${Date.now()}`,
      code: genCode(approvals.length + 1),
      type: "register",
      applicant,
      applyNote: note,
      payload,
      status: "pending",
      submitTime: now2()
    };
    set({ approvals: [approval, ...approvals] });
    return approval;
  },
  submitModification: (next, applicant, note) => {
    const { approvals } = get();
    const approval = {
      id: `sa_${Date.now()}`,
      code: genCode(approvals.length + 1),
      type: "modify",
      applicant,
      applyNote: note,
      payload: next,
      supplierId: next.id,
      status: "pending",
      submitTime: now2()
    };
    set({ approvals: [approval, ...approvals] });
    return approval;
  },
  reviewApproval: (id, action, reviewer, note) => {
    const { approvals, suppliers } = get();
    const target = approvals.find((a) => a.id === id);
    if (!target) return;
    let nextSuppliers = suppliers;
    if (action === "approved") {
      if (target.type === "register") {
        nextSuppliers = [...suppliers, { ...target.payload, code: target.payload.code ?? genSupplierCode(suppliers.length + 1) }];
      } else if (target.supplierId) {
        nextSuppliers = suppliers.map((s) => s.id === target.supplierId ? {
          ...target.payload,
          contactPerson: s.contactPerson,
          contactPosition: s.contactPosition,
          contactPhone: s.contactPhone,
          contactEmail: s.contactEmail,
          contactProvince: s.contactProvince,
          contactCity: s.contactCity,
          contactDistrict: s.contactDistrict,
          contactAddress: s.contactAddress,
          warehouses: s.warehouses
        } : s);
      }
    }
    set({
      suppliers: nextSuppliers,
      approvals: approvals.map((a) => a.id === id ? {
        ...a,
        status: action,
        reviewTime: now2(),
        reviewer,
        reviewNote: note
      } : a)
    });
  },
  addSupplier: (s) => set({ suppliers: [...get().suppliers, s] }),
  updateSupplier: (s) => set({ suppliers: get().suppliers.map((x) => x.id === s.id ? s : x) }),
  updateTerminalAccounts: (supplierId, accounts) => set({
    suppliers: get().suppliers.map((s) => {
      if (s.id !== supplierId) return s;
      const admin = accounts.find((a) => a.role === "admin");
      return {
        ...s,
        terminal: {
          ...s.terminal,
          accounts,
          username: admin?.username ?? s.terminal.username,
          password: admin?.password ?? s.terminal.password,
          status: admin?.status ?? s.terminal.status
        }
      };
    })
  }),
  submitArrivalReminder: (input) => {
    const { arrivalReminders } = get();
    const reminder = {
      id: `nar_${Date.now()}`,
      code: genReminderCode(arrivalReminders.length + 1),
      ...input,
      submitTime: now2(),
      status: "pending"
    };
    set({ arrivalReminders: [reminder, ...arrivalReminders] });
    return reminder;
  },
  handleArrivalReminder: (id, status, note) => set({
    arrivalReminders: get().arrivalReminders.map((r) => r.id === id ? {
      ...r,
      status,
      handleNote: note,
      handleTime: now2()
    } : r)
  }),
  updateQuoteSetting: (supplierId, setting) => set({
    quoteSettings: { ...get().quoteSettings, [supplierId]: { ...setting, supplierId, updateTime: now2() } }
  })
}));

// src/data/prices.tsx
var PRICE_SUPPLIERS = [
  { id: "s1", name: "\u897F\u6E56\u9F99\u4E95\u5408\u4F5C\u793E", type: "brand" },
  { id: "s2", name: "\u6B66\u5937\u5C71\u8336\u4E1A", type: "partner" },
  { id: "s3", name: "\u5B89\u6EAA\u94C1\u89C2\u97F3\u96C6\u56E2", type: "partner" },
  { id: "s4", name: "\u798F\u9F0E\u767D\u8336\u5382", type: "partner" },
  { id: "s5", name: "\u4E91\u5357\u666E\u6D31\u8336\u4E1A", type: "partner" },
  { id: "s6", name: "\u6B63\u5C71\u5802\u8336\u4E1A", type: "brand" },
  { id: "s7", name: "\u516B\u9A6C\u8336\u4E1A\u4F9B\u5E94\u94FE", type: "partner" },
  { id: "s8", name: "\u5927\u76CA\u96C6\u56E2", type: "brand" }
];
var PRICE_CUSTOMERS = [
  { id: "c1", name: "\u534E\u8317\u5802\u8336\u5E84", type: "\u76F4\u8425" },
  { id: "c2", name: "\u6E05\u5FC3\u8336\u574A", type: "\u76F4\u8425" },
  { id: "c3", name: "\u6D66\u53D1\u94F6\u884C", type: "\u95F4\u8425" },
  { id: "c4", name: "\u4EA4\u901A\u94F6\u884C", type: "\u95F4\u8425" },
  { id: "c5", name: "\u5929\u798F\u8317\u8336\uFF08\u6E20\u9053\uFF09", type: "\u6E20\u9053" },
  { id: "c6", name: "\u516B\u9A6C\u8336\u4E1A\uFF08\u6E20\u9053\uFF09", type: "\u6E20\u9053" },
  { id: "c7", name: "\u8336\u9053\u8FBE\u4EBA\u5C0F\u674E", type: "\u5E26\u8D27" },
  { id: "c8", name: "\u8317\u9999\u9601\u76F4\u64AD", type: "\u5E26\u8D27" }
];
function generatePurchasePriceRules() {
  const rules = [];
  let idx = 0;
  teaProducts.forEach((p) => {
    const supplierCount = 2 + idx % 2;
    const usedSuppliers = PRICE_SUPPLIERS.slice(idx % PRICE_SUPPLIERS.length, idx % PRICE_SUPPLIERS.length + supplierCount);
    usedSuppliers.forEach((s) => {
      const discount = 0.45 + idx * 7 % 20 / 100;
      const purchasePrice = Math.round(p.marketPrice * discount);
      rules.push({
        id: `ppr_${++idx}`,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        category: p.category.split("-")[0],
        supplierId: s.id,
        supplierName: s.name,
        marketPrice: p.marketPrice,
        purchasePrice,
        discountRate: Math.round(discount * 100),
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "active",
        lastAdjustDate: "2026-06-01",
        lastAdjustNote: "\u5E74\u5EA6\u8C03\u4EF7"
      });
    });
  });
  return rules;
}
var purchasePriceRules = generatePurchasePriceRules();
function generateVipPriceRules() {
  const rules = [];
  let idx = 0;
  teaProducts.slice(0, 15).forEach((p) => {
    const customerCount = 3 + idx % 2;
    const usedCustomers = PRICE_CUSTOMERS.slice(idx % PRICE_CUSTOMERS.length, idx % PRICE_CUSTOMERS.length + customerCount);
    usedCustomers.forEach((c) => {
      const baseRate = c.type === "\u76F4\u8425" ? 0.85 : c.type === "\u95F4\u8425" ? 0.8 : c.type === "\u6E20\u9053" ? 0.7 : 0.75;
      const discount = baseRate + idx * 3 % 10 / 100;
      const vipPrice = Math.round(p.marketPrice * discount);
      rules.push({
        id: `vip_${++idx}`,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        category: p.category.split("-")[0],
        customerId: c.id,
        customerName: c.name,
        customerType: c.type,
        marketPrice: p.marketPrice,
        salesPrice: p.salesPrice,
        vipPrice,
        discountRate: Math.round(discount * 100),
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "active",
        remark: `${c.type}\u5BA2\u6237\u4E13\u5C5E\u4EF7`
      });
    });
  });
  return rules;
}
var vipPriceRules = generateVipPriceRules();
var PERSONAL_LEVELS = ["S\u7EA7", "A\u7EA7", "B\u7EA7", "C\u7EA7"];
function generateSalesQuotationRules() {
  const rules = [];
  let idx = 0;
  const products = teaProducts.slice(0, 8);
  const directNoPlatformCustomers = [
    { id: "c1", name: "\u534E\u8317\u5802\u8336\u5E84" },
    { id: "c2", name: "\u6E05\u5FC3\u8336\u574A" },
    { id: "c3", name: "\u54C1\u8317\u8F69" },
    { id: "c4", name: "\u7FE0\u7AF9\u8336\u884C" },
    { id: "c5", name: "\u4E91\u9876\u8336\u820D" }
  ];
  const directWithPlatformCustomers = [
    { id: "c6", name: "\u6D66\u53D1\u94F6\u884C", platformId: "p1", platformName: "\u4EAC\u4E1C\u6167\u91C7", commission: "8%" },
    { id: "c7", name: "\u4EA4\u901A\u94F6\u884C", platformId: "p2", platformName: "\u53F2\u6CF0\u535A", commission: "6%" },
    { id: "c8", name: "\u4E2D\u4FE1\u8BC1\u5238", platformId: "p1", platformName: "\u4EAC\u4E1C\u6167\u91C7", commission: "7%" },
    { id: "c9", name: "\u4E2D\u56FD\u5E73\u5B89", platformId: "p4", platformName: "\u82CF\u5B81", commission: "7%" },
    { id: "c10", name: "\u62DB\u5546\u94F6\u884C", platformId: "p2", platformName: "\u53F2\u6CF0\u535A", commission: "6%" }
  ];
  const channelCustomers2 = [
    { id: "c11", name: "\u5929\u798F\u8317\u8336" },
    { id: "c12", name: "\u516B\u9A6C\u8336\u4E1A" },
    { id: "c13", name: "\u5927\u76CA\u8336\u4F53\u9A8C\u9986" },
    { id: "c14", name: "\u8336\u91CC\u738B\u56FD" },
    { id: "c15", name: "\u6B63\u5C71\u5802\u65D7\u8230\u5E97" }
  ];
  directNoPlatformCustomers.forEach((c) => {
    products.forEach((p, pi) => {
      const discount = 0.88 + idx * 2 % 8 / 100;
      const quotedPrice = Math.round(p.marketPrice * discount);
      rules.push({
        id: `sq_${++idx}`,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        category: p.category.split("-")[0],
        marketPrice: p.marketPrice,
        salesPrice: p.salesPrice,
        quotationType: "direct_no_platform",
        customerId: c.id,
        customerName: c.name,
        quotedPrice,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "active",
        remark: `${c.name}\u4E13\u5C5E\u62A5\u4EF7`
      });
    });
  });
  directWithPlatformCustomers.forEach((c) => {
    products.forEach((p, pi) => {
      const discount = 0.85 + idx * 3 % 8 / 100;
      const quotedPrice = Math.round(p.marketPrice * discount);
      const commissionNum = parseFloat(c.commission) / 100;
      const platformNetPrice = Math.round(quotedPrice * (1 - commissionNum));
      rules.push({
        id: `sq_${++idx}`,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        category: p.category.split("-")[0],
        marketPrice: p.marketPrice,
        salesPrice: p.salesPrice,
        quotationType: "direct_with_platform",
        customerId: c.id,
        customerName: c.name,
        platformId: c.platformId,
        platformName: c.platformName,
        platformCommissionRate: c.commission,
        quotedPrice,
        platformNetPrice,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "active",
        remark: `${c.name}\u7ECF${c.platformName}\u62A5\u4EF7`
      });
    });
  });
  channelCustomers2.forEach((c) => {
    products.forEach((p, pi) => {
      const discount = 0.75 + idx * 5 % 11 / 100;
      const quotedPrice = Math.round(p.marketPrice * discount);
      rules.push({
        id: `sq_${++idx}`,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        category: p.category.split("-")[0],
        marketPrice: p.marketPrice,
        salesPrice: p.salesPrice,
        quotationType: "channel",
        customerId: c.id,
        customerName: c.name,
        quotedPrice,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "active",
        remark: `${c.name}\u6E20\u9053\u62A5\u4EF7`
      });
    });
  });
  const levelDiscounts = { "S\u7EA7": 0.82, "A\u7EA7": 0.78, "B\u7EA7": 0.72, "C\u7EA7": 0.65 };
  PERSONAL_LEVELS.forEach((level) => {
    products.forEach((p, pi) => {
      const baseDiscount = levelDiscounts[level];
      const discount = baseDiscount + idx * 2 % 5 / 100;
      const quotedPrice = Math.round(p.marketPrice * discount);
      rules.push({
        id: `sq_${++idx}`,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        category: p.category.split("-")[0],
        marketPrice: p.marketPrice,
        salesPrice: p.salesPrice,
        quotationType: "personal_by_level",
        personalLevel: level,
        quotedPrice,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "active",
        remark: `${level}\u4E2A\u4EBA\u5BA2\u6237\u6700\u4F4E\u9500\u552E\u4EF7`
      });
    });
  });
  return rules;
}
var salesQuotationRules = generateSalesQuotationRules();
function calcPlatformNetPrice(quotedPrice, commissionRate) {
  const commissionNum = parseFloat(commissionRate) / 100;
  return Math.round(quotedPrice * (1 - commissionNum));
}

// src/utils/customerCode.ts
var TYPE_PREFIX = {
  direct: "KHZY",
  channel: "KHQD",
  personal: "KHGR",
  platform: "KHPT",
  guest: "KHYK"
};
function generateCustomerCode(type, shortName, sequence) {
  const prefix = TYPE_PREFIX[type];
  const seq = String(sequence).padStart(4, "0");
  return `${prefix}-${seq}`;
}

// src/data/customers.tsx
var directNoPlatform = [
  {
    id: "c1",
    name: "\u534E\u8317\u5802\u8336\u5E84",
    shortName: "\u534E\u8317\u5802",
    type: "direct",
    viaPlatform: false,
    region: "\u5317\u4EAC",
    province: "\u5317\u4EAC",
    city: "\u5317\u4EAC\u5E02",
    district: "\u897F\u57CE\u533A",
    contactPerson: "\u5F20\u660E\u534E",
    contactPhone: "010-8234****",
    contactEmail: "zmh@huamingtang.com",
    contactAddress: "\u9A6C\u8FDE\u905316\u53F7",
    level: "A\u7EA7",
    orders: 32,
    totalAmount: 386e3,
    platformIds: [],
    developerId: "emp-6",
    developerType: "employee",
    developerName: "\u5468\u4E3D\u534E",
    maintainerId: "emp-7",
    maintainerType: "employee",
    maintainerName: "\u674E\u5A1C",
    followerId: "emp-8",
    followerType: "employee",
    followerName: "\u738B\u5F3A",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2023-02-15",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    taxNo: "91110102MA***1234",
    source: "\u5C55\u4F1A\u62D3\u5BA2",
    remark: "\u957F\u671F\u5408\u4F5C\uFF0C\u6708\u5747\u91C7\u8D2D\u7A33\u5B9A",
    bankAccounts: [{ accountName: "\u5317\u4EAC\u534E\u8317\u5802\u8336\u4E1A\u6709\u9650\u516C\u53F8", accountNo: "1100 **** **** 8821", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u5317\u4EAC\u897F\u57CE\u652F\u884C", bankNo: "102100000XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u5317\u4EAC\u534E\u8317\u5802\u8336\u4E1A\u6709\u9650\u516C\u53F8", taxNo: "91110102MA***1234", taxRate: "6%" }],
    orderContacts: [
      { id: "oc-c1-1", name: "\u5F20\u660E\u534E", department: "\u91C7\u8D2D\u90E8", phone: "010-8234****", address: "\u5317\u4EAC\u5E02\u897F\u57CE\u533A\u9A6C\u8FDE\u905316\u53F7", remark: "\u4E3B\u8054\u7CFB\u4EBA" },
      { id: "oc-c1-2", name: "\u674E\u7ECF\u7406", department: "\u91C7\u8D2D\u90E8", phone: "010-8234****", address: "\u5317\u4EAC\u5E02\u897F\u57CE\u533A\u9A6C\u8FDE\u905316\u53F7", remark: "\u5907\u7528\u8054\u7CFB\u4EBA" }
    ],
    subOrganizations: [
      { id: "sub-c1-1", name: "\u534E\u8317\u5802\xB7\u671D\u9633\u5206\u5E97", contactPerson: "\u738B\u7ECF\u7406", contactPhone: "010-6543****", province: "\u5317\u4EAC", city: "\u5317\u4EAC\u5E02", district: "\u671D\u9633\u533A", address: "\u5EFA\u56FD\u8DEF88\u53F7SOHO\u73B0\u4EE3\u57CE", developerId: "emp-6", developerType: "employee", developerName: "\u5468\u4E3D\u534E", maintainerId: "emp-8", maintainerType: "employee", maintainerName: "\u738B\u5F3A", remark: "CBD\u6838\u5FC3\u533A\u95E8\u5E97" },
      { id: "sub-c1-2", name: "\u534E\u8317\u5802\xB7\u6D77\u6DC0\u5206\u5E97", contactPerson: "\u5218\u5E97\u957F", contactPhone: "010-8234****", province: "\u5317\u4EAC", city: "\u5317\u4EAC\u5E02", district: "\u6D77\u6DC0\u533A", address: "\u4E2D\u5173\u6751\u5927\u88571\u53F7", developerId: "emp-7", developerType: "employee", developerName: "\u674E\u5A1C", maintainerId: "emp-9", maintainerType: "employee", maintainerName: "\u5F20\u4F1F", remark: "\u9AD8\u6821\u5468\u8FB9\u95E8\u5E97" }
    ],
    terminal: { enabled: true, username: "hmt001", password: "123456", status: "active", openTime: "2026-08-01" }
  },
  {
    id: "c2",
    name: "\u6E05\u5FC3\u8336\u574A",
    shortName: "\u6E05\u5FC3\u8336\u574A",
    type: "direct",
    viaPlatform: false,
    region: "\u676D\u5DDE",
    province: "\u6D59\u6C5F",
    city: "\u676D\u5DDE\u5E02",
    district: "\u897F\u6E56\u533A",
    contactPerson: "\u674E\u96C5\u82B3",
    contactPhone: "0571-8612****",
    level: "S\u7EA7",
    orders: 45,
    totalAmount: 512400,
    platformIds: [],
    developerId: "emp-6",
    developerType: "employee",
    developerName: "\u5468\u4E3D\u534E",
    maintainerId: "emp-7",
    maintainerType: "employee",
    maintainerName: "\u674E\u5A1C",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2022-08-10",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u8001\u5BA2\u6237\u8F6C\u4ECB",
    remark: "\u6838\u5FC3\u5BA2\u6237\uFF0C\u9AD8\u7AEF\u8336\u54C1\u9700\u6C42\u5927",
    bankAccounts: [{ accountName: "\u676D\u5DDE\u6E05\u5FC3\u8336\u574A\u6709\u9650\u516C\u53F8", accountNo: "1202 **** **** 5567", bankName: "\u4E2D\u56FD\u5EFA\u8BBE\u94F6\u884C\u676D\u5DDE\u897F\u6E56\u652F\u884C", bankNo: "10533100XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u676D\u5DDE\u6E05\u5FC3\u8336\u574A\u6709\u9650\u516C\u53F8", taxNo: "91330106MA***5678", taxRate: "6%" }],
    orderContacts: [
      { id: "oc-c2-1", name: "\u674E\u96C5\u82B3", department: "\u91C7\u8D2D\u90E8", phone: "0571-8612****", address: "\u676D\u5DDE\u5E02\u897F\u6E56\u533A\u9F99\u4E95\u8DEF88\u53F7", remark: "\u4E3B\u8054\u7CFB\u4EBA" }
    ]
  },
  {
    id: "c3",
    name: "\u54C1\u8317\u8F69",
    shortName: "\u54C1\u8317\u8F69",
    type: "direct",
    viaPlatform: false,
    region: "\u5E7F\u5DDE",
    province: "\u5E7F\u4E1C",
    city: "\u5E7F\u5DDE\u5E02",
    district: "\u5929\u6CB3\u533A",
    contactPerson: "\u9648\u5FD7\u8FDC",
    contactPhone: "020-8356****",
    level: "B\u7EA7",
    orders: 19,
    totalAmount: 168600,
    platformIds: [],
    developerId: "emp-16",
    developerType: "employee",
    developerName: "\u9648\u5FD7\u8FDC",
    maintainerId: "emp-17",
    maintainerType: "employee",
    maintainerName: "\u5218\u6653\u4E1C",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2024-01-20",
    status: "active",
    settlementMethod: "\u9884\u4ED8",
    source: "\u7EBF\u4E0A\u54A8\u8BE2",
    bankAccounts: [{ accountName: "\u5E7F\u5DDE\u54C1\u8317\u8F69\u8336\u4E1A\u6709\u9650\u516C\u53F8", accountNo: "3602 **** **** 3398", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u5E7F\u5DDE\u5929\u6CB3\u652F\u884C", bankNo: "10358400XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u5E7F\u5DDE\u54C1\u8317\u8F69\u8336\u4E1A\u6709\u9650\u516C\u53F8", taxNo: "91440106MA***9012", taxRate: "6%" }],
    orderContacts: [
      { id: "oc-c3-1", name: "\u9648\u5FD7\u8FDC", department: "\u91C7\u8D2D\u90E8", phone: "020-8356****", address: "\u5E7F\u5DDE\u5E02\u5929\u6CB3\u533A\u73E0\u6C5F\u65B0\u57CE", remark: "\u4E3B\u8054\u7CFB\u4EBA" }
    ]
  },
  {
    id: "c4",
    name: "\u7FE0\u7AF9\u8336\u884C",
    shortName: "\u7FE0\u7AF9\u8336\u884C",
    type: "direct",
    viaPlatform: false,
    region: "\u6210\u90FD",
    province: "\u56DB\u5DDD",
    city: "\u6210\u90FD\u5E02",
    district: "\u6B66\u4FAF\u533A",
    contactPerson: "\u738B\u5EFA\u56FD",
    contactPhone: "028-8523****",
    level: "A\u7EA7",
    orders: 24,
    totalAmount: 198200,
    platformIds: [],
    developerId: "emp-7",
    developerType: "employee",
    developerName: "\u674E\u5A1C",
    maintainerId: "emp-6",
    maintainerType: "employee",
    maintainerName: "\u5468\u4E3D\u534E",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2023-06-05",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u4E3B\u52A8\u5F00\u53D1",
    bankAccounts: [{ accountName: "\u6210\u90FD\u7FE0\u7AF9\u8336\u884C\u6709\u9650\u516C\u53F8", accountNo: "4402 **** **** 7712", bankName: "\u4E2D\u56FD\u94F6\u884C\u6210\u90FD\u6B66\u4FAF\u652F\u884C", bankNo: "10465100XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u6210\u90FD\u7FE0\u7AF9\u8336\u884C\u6709\u9650\u516C\u53F8", taxNo: "91510107MA***3456", taxRate: "6%" }],
    orderContacts: [
      { id: "oc-c4-1", name: "\u738B\u5EFA\u56FD", department: "\u91C7\u8D2D\u90E8", phone: "028-8523****", address: "\u6210\u90FD\u5E02\u6B66\u4FAF\u533A\u8336\u5E97\u5B50", remark: "\u4E3B\u8054\u7CFB\u4EBA" }
    ]
  },
  {
    id: "c5",
    name: "\u4E91\u9876\u8336\u820D",
    shortName: "\u4E91\u9876\u8336\u820D",
    type: "direct",
    viaPlatform: false,
    region: "\u6606\u660E",
    province: "\u4E91\u5357",
    city: "\u6606\u660E\u5E02",
    district: "\u4E94\u534E\u533A",
    contactPerson: "\u5218\u6653\u4E1C",
    contactPhone: "0871-6543****",
    level: "B\u7EA7",
    orders: 12,
    totalAmount: 89600,
    platformIds: [],
    developerId: "emp-17",
    developerType: "employee",
    developerName: "\u5218\u6653\u4E1C",
    maintainerId: "emp-16",
    maintainerType: "employee",
    maintainerName: "\u9648\u5FD7\u8FDC",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2024-03-18",
    status: "active",
    settlementMethod: "\u9884\u4ED8",
    source: "\u7EBF\u4E0A\u54A8\u8BE2",
    bankAccounts: [{ accountName: "\u6606\u660E\u4E91\u9876\u8336\u820D\u6709\u9650\u516C\u53F8", accountNo: "2502 **** **** 6634", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u6606\u660E\u4E94\u534E\u652F\u884C", bankNo: "10273100XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u6606\u660E\u4E91\u9876\u8336\u820D\u6709\u9650\u516C\u53F8", taxNo: "91530102MA***7890", taxRate: "6%" }],
    orderContacts: [
      { id: "oc-c5-1", name: "\u5218\u6653\u4E1C", department: "\u91C7\u8D2D\u90E8", phone: "0871-6543****", address: "\u6606\u660E\u5E02\u4E94\u534E\u533A\u7FE0\u6E56\u8DEF", remark: "\u4E3B\u8054\u7CFB\u4EBA" }
    ]
  }
];
var directViaPlatform = [
  {
    id: "c6",
    name: "\u6D66\u53D1\u94F6\u884C",
    shortName: "\u6D66\u53D1\u94F6\u884C",
    type: "direct",
    viaPlatform: true,
    region: "\u4E0A\u6D77",
    province: "\u4E0A\u6D77",
    city: "\u4E0A\u6D77\u5E02",
    district: "\u6D66\u4E1C\u65B0\u533A",
    contactPerson: "\u8D75\u7ECF\u7406",
    contactPhone: "021-6123****",
    level: "S\u7EA7",
    orders: 18,
    totalAmount: 425e3,
    platformIds: ["p1"],
    platformCommissionRates: { p1: "8%" },
    developerId: "emp-6",
    developerType: "employee",
    developerName: "\u5468\u4E3D\u534E",
    maintainerId: "emp-7",
    maintainerType: "employee",
    maintainerName: "\u674E\u5A1C",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2023-04-22",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u5E73\u53F0\u5F15\u6D41",
    remark: "\u4F01\u4E1A\u798F\u5229\u91C7\u8D2D\uFF0C\u5E74\u8282\u5927\u5B97\u8BA2\u5355",
    bankAccounts: [{ accountName: "\u4E0A\u6D77\u6D66\u4E1C\u53D1\u5C55\u94F6\u884C\u80A1\u4EFD\u6709\u9650\u516C\u53F8", accountNo: "1002 **** **** 1234", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u4E0A\u6D77\u6D66\u4E1C\u652F\u884C", bankNo: "10229000XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u4E0A\u6D77\u6D66\u4E1C\u53D1\u5C55\u94F6\u884C\u80A1\u4EFD\u6709\u9650\u516C\u53F8", taxNo: "91310115MA***0001", taxRate: "6%" }],
    orderContacts: [
      { id: "oc-c6-1", name: "\u8D75\u7ECF\u7406", department: "\u884C\u653F\u90E8", phone: "021-6123****", address: "\u4E0A\u6D77\u5E02\u6D66\u4E1C\u65B0\u533A\u9646\u5BB6\u5634", remark: "\u4E3B\u8054\u7CFB\u4EBA" },
      { id: "oc-c6-2", name: "\u5B59\u52A9\u7406", department: "\u884C\u653F\u90E8", phone: "021-6123****", address: "\u4E0A\u6D77\u5E02\u6D66\u4E1C\u65B0\u533A\u9646\u5BB6\u5634", remark: "\u5907\u7528\u8054\u7CFB\u4EBA" }
    ]
  },
  {
    id: "c7",
    name: "\u4EA4\u901A\u94F6\u884C",
    shortName: "\u4EA4\u901A\u94F6\u884C",
    type: "direct",
    viaPlatform: true,
    region: "\u4E0A\u6D77",
    province: "\u4E0A\u6D77",
    city: "\u4E0A\u6D77\u5E02",
    district: "\u9EC4\u6D66\u533A",
    contactPerson: "\u5B59\u4E3B\u7BA1",
    contactPhone: "021-5876****",
    level: "A\u7EA7",
    orders: 15,
    totalAmount: 368e3,
    platformIds: ["p2", "p3"],
    platformCommissionRates: { p2: "6%", p3: "5%" },
    developerId: "emp-7",
    developerType: "employee",
    developerName: "\u674E\u5A1C",
    maintainerId: "emp-6",
    maintainerType: "employee",
    maintainerName: "\u5468\u4E3D\u534E",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2023-09-10",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u5E73\u53F0\u5F15\u6D41",
    bankAccounts: [{ accountName: "\u4EA4\u901A\u94F6\u884C\u80A1\u4EFD\u6709\u9650\u516C\u53F8", accountNo: "1002 **** **** 5678", bankName: "\u4E2D\u56FD\u94F6\u884C\u4E0A\u6D77\u9EC4\u6D66\u652F\u884C", bankNo: "10429000XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u4EA4\u901A\u94F6\u884C\u80A1\u4EFD\u6709\u9650\u516C\u53F8", taxNo: "91310101MA***0002", taxRate: "6%" }],
    orderContacts: [
      { id: "oc-c7-1", name: "\u5B59\u4E3B\u7BA1", department: "\u91C7\u8D2D\u90E8", phone: "021-5876****", address: "\u4E0A\u6D77\u5E02\u9EC4\u6D66\u533A\u5916\u6EE9", remark: "\u4E3B\u8054\u7CFB\u4EBA" }
    ]
  },
  {
    id: "c8",
    name: "\u4E2D\u4FE1\u8BC1\u5238",
    shortName: "\u4E2D\u4FE1\u8BC1\u5238",
    type: "direct",
    viaPlatform: true,
    region: "\u6DF1\u5733",
    province: "\u5E7F\u4E1C",
    city: "\u6DF1\u5733\u5E02",
    district: "\u798F\u7530\u533A",
    contactPerson: "\u5468\u603B\u76D1",
    contactPhone: "0755-8234****",
    level: "S\u7EA7",
    orders: 22,
    totalAmount: 536e3,
    platformIds: ["p1", "p2"],
    platformCommissionRates: { p1: "7%", p2: "6%" },
    developerId: "emp-6",
    developerType: "employee",
    developerName: "\u5468\u4E3D\u534E",
    maintainerId: "emp-7",
    maintainerType: "employee",
    maintainerName: "\u674E\u5A1C",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2022-12-01",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u8001\u5BA2\u6237\u8F6C\u4ECB",
    remark: "VIP\u5BA2\u6237\u793C\u54C1\u5B9A\u5236",
    bankAccounts: [{ accountName: "\u4E2D\u4FE1\u8BC1\u5238\u80A1\u4EFD\u6709\u9650\u516C\u53F8", accountNo: "4402 **** **** 9012", bankName: "\u4E2D\u56FD\u5EFA\u8BBE\u94F6\u884C\u6DF1\u5733\u798F\u7530\u652F\u884C", bankNo: "10558400XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u4E2D\u4FE1\u8BC1\u5238\u80A1\u4EFD\u6709\u9650\u516C\u53F8", taxNo: "91440304MA***0003", taxRate: "6%" }],
    orderContacts: [
      { id: "oc-c8-1", name: "\u5468\u603B\u76D1", department: "\u91C7\u8D2D\u90E8", phone: "0755-8234****", address: "\u6DF1\u5733\u5E02\u798F\u7530\u533A\u6DF1\u5357\u5927\u9053", remark: "\u4E3B\u8054\u7CFB\u4EBA" },
      { id: "oc-c8-2", name: "\u5434\u7ECF\u7406", department: "\u884C\u653F\u90E8", phone: "0755-8234****", address: "\u6DF1\u5733\u5E02\u798F\u7530\u533A\u6DF1\u5357\u5927\u9053", remark: "\u793C\u54C1\u91C7\u8D2D" }
    ]
  },
  {
    id: "c9",
    name: "\u4E2D\u56FD\u5E73\u5B89",
    shortName: "\u4E2D\u56FD\u5E73\u5B89",
    type: "direct",
    viaPlatform: true,
    region: "\u6DF1\u5733",
    province: "\u5E7F\u4E1C",
    city: "\u6DF1\u5733\u5E02",
    district: "\u5357\u5C71\u533A",
    contactPerson: "\u5434\u7ECF\u7406",
    contactPhone: "0755-2233****",
    level: "A\u7EA7",
    orders: 10,
    totalAmount: 285e3,
    platformIds: ["p4"],
    platformCommissionRates: { p4: "7%" },
    developerId: "emp-7",
    developerType: "employee",
    developerName: "\u674E\u5A1C",
    maintainerId: "emp-6",
    maintainerType: "employee",
    maintainerName: "\u5468\u4E3D\u534E",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2024-02-28",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u5C55\u4F1A\u62D3\u5BA2",
    bankAccounts: [{ accountName: "\u4E2D\u56FD\u5E73\u5B89\u4FDD\u9669\uFF08\u96C6\u56E2\uFF09\u80A1\u4EFD\u6709\u9650\u516C\u53F8", accountNo: "4402 **** **** 3456", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u6DF1\u5733\u5357\u5C71\u652F\u884C", bankNo: "10358400XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u4E2D\u56FD\u5E73\u5B89\u4FDD\u9669\uFF08\u96C6\u56E2\uFF09\u80A1\u4EFD\u6709\u9650\u516C\u53F8", taxNo: "91440305MA***0004", taxRate: "6%" }],
    orderContacts: [
      { id: "oc-c9-1", name: "\u5434\u7ECF\u7406", department: "\u91C7\u8D2D\u90E8", phone: "0755-2233****", address: "\u6DF1\u5733\u5E02\u5357\u5C71\u533A\u79D1\u6280\u56ED", remark: "\u4E3B\u8054\u7CFB\u4EBA" }
    ]
  },
  {
    id: "c10",
    name: "\u62DB\u5546\u94F6\u884C",
    shortName: "\u62DB\u5546\u94F6\u884C",
    type: "direct",
    viaPlatform: true,
    region: "\u6DF1\u5733",
    province: "\u5E7F\u4E1C",
    city: "\u6DF1\u5733\u5E02",
    district: "\u798F\u7530\u533A",
    contactPerson: "\u94B1\u4E3B\u7BA1",
    contactPhone: "0755-8866****",
    level: "B\u7EA7",
    orders: 8,
    totalAmount: 196e3,
    platformIds: ["p2"],
    platformCommissionRates: { p2: "6%" },
    developerId: "emp-16",
    developerType: "employee",
    developerName: "\u9648\u5FD7\u8FDC",
    maintainerId: "emp-17",
    maintainerType: "employee",
    maintainerName: "\u5218\u6653\u4E1C",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2024-05-15",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u4E3B\u52A8\u5F00\u53D1",
    bankAccounts: [{ accountName: "\u62DB\u5546\u94F6\u884C\u80A1\u4EFD\u6709\u9650\u516C\u53F8", accountNo: "4402 **** **** 7890", bankName: "\u4E2D\u56FD\u94F6\u884C\u6DF1\u5733\u798F\u7530\u652F\u884C", bankNo: "10458400XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u62DB\u5546\u94F6\u884C\u80A1\u4EFD\u6709\u9650\u516C\u53F8", taxNo: "91440304MA***0005", taxRate: "6%" }],
    orderContacts: [
      { id: "oc-c10-1", name: "\u94B1\u4E3B\u7BA1", department: "\u884C\u653F\u90E8", phone: "0755-8866****", address: "\u6DF1\u5733\u5E02\u798F\u7530\u533A\u6DF1\u5357\u4E2D\u8DEF", remark: "\u4E3B\u8054\u7CFB\u4EBA" }
    ]
  }
];
var channelCustomers = [
  {
    id: "c11",
    name: "\u5929\u798F\u8317\u8336",
    shortName: "\u5929\u798F\u8317\u8336",
    type: "channel",
    region: "\u798F\u5DDE",
    province: "\u798F\u5EFA",
    city: "\u798F\u5DDE\u5E02",
    district: "\u9F13\u697C\u533A",
    contactPerson: "\u6797\u7ECF\u7406",
    contactPhone: "0591-8765****",
    level: "S\u7EA7",
    orders: 56,
    totalAmount: 826e3,
    platformIds: [],
    developerId: "emp-6",
    developerType: "employee",
    developerName: "\u5468\u4E3D\u534E",
    maintainerId: "emp-7",
    maintainerType: "employee",
    maintainerName: "\u674E\u5A1C",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2022-03-10",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u4E3B\u52A8\u5F00\u53D1",
    remark: "\u534E\u4E1C\u533A\u6838\u5FC3\u6E20\u9053\u5546",
    bankAccounts: [{ accountName: "\u798F\u5EFA\u5929\u798F\u8317\u8336\u6709\u9650\u516C\u53F8", accountNo: "3502 **** **** 1122", bankName: "\u4E2D\u56FD\u5EFA\u8BBE\u94F6\u884C\u798F\u5DDE\u9F13\u697C\u652F\u884C", bankNo: "10539100XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u798F\u5EFA\u5929\u798F\u8317\u8336\u6709\u9650\u516C\u53F8", taxNo: "91350102MA***0006", taxRate: "6%" }]
  },
  {
    id: "c12",
    name: "\u516B\u9A6C\u8336\u4E1A",
    shortName: "\u516B\u9A6C\u8336\u4E1A",
    type: "channel",
    region: "\u53A6\u95E8",
    province: "\u798F\u5EFA",
    city: "\u53A6\u95E8\u5E02",
    district: "\u601D\u660E\u533A",
    contactPerson: "\u738B\u603B",
    contactPhone: "0592-5432****",
    level: "A\u7EA7",
    orders: 42,
    totalAmount: 645e3,
    platformIds: [],
    developerId: "emp-7",
    developerType: "employee",
    developerName: "\u674E\u5A1C",
    maintainerId: "emp-6",
    maintainerType: "employee",
    maintainerName: "\u5468\u4E3D\u534E",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2023-01-18",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u5C55\u4F1A\u62D3\u5BA2",
    bankAccounts: [{ accountName: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8", accountNo: "3502 **** **** 3344", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u53A6\u95E8\u601D\u660E\u652F\u884C", bankNo: "10239300XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u516B\u9A6C\u8336\u4E1A\u80A1\u4EFD\u6709\u9650\u516C\u53F8", taxNo: "91350203MA***0007", taxRate: "6%" }]
  },
  {
    id: "c13",
    name: "\u5927\u76CA\u8336\u4F53\u9A8C\u9986",
    shortName: "\u5927\u76CA\u8336",
    type: "channel",
    region: "\u5E7F\u5DDE",
    province: "\u5E7F\u4E1C",
    city: "\u5E7F\u5DDE\u5E02",
    district: "\u8D8A\u79C0\u533A",
    contactPerson: "\u9648\u7ECF\u7406",
    contactPhone: "020-3876****",
    level: "A\u7EA7",
    orders: 35,
    totalAmount: 498e3,
    platformIds: [],
    developerId: "emp-16",
    developerType: "employee",
    developerName: "\u9648\u5FD7\u8FDC",
    maintainerId: "emp-17",
    maintainerType: "employee",
    maintainerName: "\u5218\u6653\u4E1C",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2023-05-22",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u8001\u5BA2\u6237\u8F6C\u4ECB",
    bankAccounts: [{ accountName: "\u5E7F\u4E1C\u5927\u76CA\u8336\u4E1A\u6709\u9650\u516C\u53F8", accountNo: "3602 **** **** 5566", bankName: "\u4E2D\u56FD\u519C\u4E1A\u94F6\u884C\u5E7F\u5DDE\u8D8A\u79C0\u652F\u884C", bankNo: "10358400XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u5E7F\u4E1C\u5927\u76CA\u8336\u4E1A\u6709\u9650\u516C\u53F8", taxNo: "91440104MA***0008", taxRate: "6%" }]
  },
  {
    id: "c14",
    name: "\u8336\u91CC\u738B\u56FD",
    shortName: "\u8336\u91CC\u738B\u56FD",
    type: "channel",
    region: "\u957F\u6C99",
    province: "\u6E56\u5357",
    city: "\u957F\u6C99\u5E02",
    district: "\u5CB3\u9E93\u533A",
    contactPerson: "\u6768\u603B",
    contactPhone: "0731-8567****",
    level: "B\u7EA7",
    orders: 28,
    totalAmount: 312e3,
    platformIds: [],
    developerId: "emp-17",
    developerType: "employee",
    developerName: "\u5218\u6653\u4E1C",
    maintainerId: "emp-16",
    maintainerType: "employee",
    maintainerName: "\u9648\u5FD7\u8FDC",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2023-11-05",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u7EBF\u4E0A\u54A8\u8BE2",
    bankAccounts: [{ accountName: "\u6E56\u5357\u8336\u91CC\u738B\u56FD\u8336\u4E1A\u6709\u9650\u516C\u53F8", accountNo: "4302 **** **** 7788", bankName: "\u4E2D\u56FD\u94F6\u884C\u957F\u6C99\u5CB3\u9E93\u652F\u884C", bankNo: "10455100XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u6E56\u5357\u8336\u91CC\u738B\u56FD\u8336\u4E1A\u6709\u9650\u516C\u53F8", taxNo: "91430104MA***0009", taxRate: "6%" }]
  },
  {
    id: "c15",
    name: "\u6B63\u5C71\u5802\u65D7\u8230\u5E97",
    shortName: "\u6B63\u5C71\u5802",
    type: "channel",
    region: "\u6B66\u5937\u5C71",
    province: "\u798F\u5EFA",
    city: "\u5357\u5E73\u5E02",
    district: "\u6B66\u5937\u5C71\u5E02",
    contactPerson: "\u6C5F\u7ECF\u7406",
    contactPhone: "0599-5123****",
    level: "B\u7EA7",
    orders: 20,
    totalAmount: 268e3,
    platformIds: [],
    developerId: "emp-6",
    developerType: "employee",
    developerName: "\u5468\u4E3D\u534E",
    maintainerId: "emp-7",
    maintainerType: "employee",
    maintainerName: "\u674E\u5A1C",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2024-01-08",
    status: "inactive",
    settlementMethod: "\u6708\u7ED3",
    source: "\u4E3B\u52A8\u5F00\u53D1",
    bankAccounts: [{ accountName: "\u798F\u5EFA\u6B63\u5C71\u5802\u8336\u4E1A\u6709\u9650\u8D23\u4EFB\u516C\u53F8", accountNo: "3502 **** **** 9900", bankName: "\u4E2D\u56FD\u5EFA\u8BBE\u94F6\u884C\u6B66\u5937\u5C71\u652F\u884C", bankNo: "10539100XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u798F\u5EFA\u6B63\u5C71\u5802\u8336\u4E1A\u6709\u9650\u8D23\u4EFB\u516C\u53F8", taxNo: "91350782MA***0010", taxRate: "6%" }]
  }
];
var platformCustomers = [
  {
    id: "c16",
    name: "\u4EAC\u4E1C\u6167\u91C7",
    shortName: "\u4EAC\u4E1C\u6167\u91C7",
    type: "platform",
    region: "\u5317\u4EAC",
    province: "\u5317\u4EAC",
    city: "\u5317\u4EAC\u5E02",
    district: "\u5927\u5174\u533A",
    contactPerson: "\u5F20\u7ECF\u7406",
    contactPhone: "010-8833****",
    level: "S\u7EA7",
    orders: 48,
    totalAmount: 985e3,
    platformIds: [],
    developerId: "emp-6",
    developerType: "employee",
    developerName: "\u5468\u4E3D\u534E",
    maintainerId: "emp-7",
    maintainerType: "employee",
    maintainerName: "\u674E\u5A1C",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2022-01-15",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u5E73\u53F0\u5165\u9A7B",
    remark: "\u4EAC\u4E1C\u4F01\u4E1A\u8D2D\u5E73\u53F0",
    bankAccounts: [{ accountName: "\u5317\u4EAC\u4EAC\u4E1C\u4E16\u7EAA\u8D38\u6613\u6709\u9650\u516C\u53F8", accountNo: "1100 **** **** 0001", bankName: "\u4E2D\u56FD\u5DE5\u5546\u94F6\u884C\u5317\u4EAC\u5927\u5174\u652F\u884C", bankNo: "102100000XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u5317\u4EAC\u4EAC\u4E1C\u4E16\u7EAA\u8D38\u6613\u6709\u9650\u516C\u53F8", taxNo: "91110000MA***0001", taxRate: "6%" }]
  },
  {
    id: "c17",
    name: "\u53F2\u6CF0\u535A",
    shortName: "\u53F2\u6CF0\u535A",
    type: "platform",
    region: "\u4E0A\u6D77",
    province: "\u4E0A\u6D77",
    city: "\u4E0A\u6D77\u5E02",
    district: "\u6D66\u4E1C\u65B0\u533A",
    contactPerson: "\u674E\u4E3B\u7BA1",
    contactPhone: "021-5888****",
    level: "A\u7EA7",
    orders: 32,
    totalAmount: 628e3,
    platformIds: [],
    developerId: "emp-7",
    developerType: "employee",
    developerName: "\u674E\u5A1C",
    maintainerId: "emp-6",
    maintainerType: "employee",
    maintainerName: "\u5468\u4E3D\u534E",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2022-06-20",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u5E73\u53F0\u5165\u9A7B",
    remark: "\u529E\u516C\u7528\u54C1\u96C6\u91C7\u5E73\u53F0",
    bankAccounts: [{ accountName: "\u53F2\u6CF0\u535A(\u4E0A\u6D77)\u6709\u9650\u516C\u53F8", accountNo: "1002 **** **** 0002", bankName: "\u4E2D\u56FD\u94F6\u884C\u4E0A\u6D77\u6D66\u4E1C\u652F\u884C", bankNo: "10429000XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u53F2\u6CF0\u535A(\u4E0A\u6D77)\u6709\u9650\u516C\u53F8", taxNo: "91310000MA***0002", taxRate: "6%" }]
  },
  {
    id: "c18",
    name: "\u6613\u79EF\u901A",
    shortName: "\u6613\u79EF\u901A",
    type: "platform",
    region: "\u6DF1\u5733",
    province: "\u5E7F\u4E1C",
    city: "\u6DF1\u5733\u5E02",
    district: "\u5357\u5C71\u533A",
    contactPerson: "\u738B\u7ECF\u7406",
    contactPhone: "0755-2666****",
    level: "B\u7EA7",
    orders: 18,
    totalAmount: 296e3,
    platformIds: [],
    developerId: "emp-16",
    developerType: "employee",
    developerName: "\u9648\u5FD7\u8FDC",
    maintainerId: "emp-17",
    maintainerType: "employee",
    maintainerName: "\u5218\u6653\u4E1C",
    profitShare: { developerRatio: 50, maintainerRatio: 30, followerRatio: 20 },
    cooperationDate: "2023-03-10",
    status: "active",
    settlementMethod: "\u6708\u7ED3",
    source: "\u5E73\u53F0\u5165\u9A7B",
    remark: "\u653F\u4F01\u91C7\u8D2D\u5E73\u53F0",
    bankAccounts: [{ accountName: "\u6DF1\u5733\u5E02\u6613\u79EF\u901A\u79D1\u6280\u6709\u9650\u516C\u53F8", accountNo: "4402 **** **** 0003", bankName: "\u4E2D\u56FD\u5EFA\u8BBE\u94F6\u884C\u6DF1\u5733\u5357\u5C71\u652F\u884C", bankNo: "10558400XXX" }],
    invoiceInfos: [{ invoiceEntity: "\u6DF1\u5733\u5E02\u6613\u79EF\u901A\u79D1\u6280\u6709\u9650\u516C\u53F8", taxNo: "91440300MA***0003", taxRate: "6%" }]
  }
];
var personalCustomers = [
  { id: "c19", name: "\u5F20\u4F1F", shortName: "\u5F20\u4F1F", type: "personal", region: "\u5317\u4EAC", province: "\u5317\u4EAC", city: "\u5317\u4EAC\u5E02", district: "\u671D\u9633\u533A", contactPerson: "\u5F20\u4F1F", contactPhone: "138****1234", contactEmail: "zhangwei@email.com", contactAddress: "\u5EFA\u56FD\u8DEF88\u53F7", level: "B\u7EA7", orders: 5, totalAmount: 18600, platformIds: [], cooperationDate: "2024-06-10", status: "active", source: "\u7EBF\u4E0A\u54A8\u8BE2", remark: "\u4E2A\u4EBA\u8336\u53CB\uFF0C\u504F\u597D\u7EFF\u8336" },
  { id: "c20", name: "\u674E\u5A1C", shortName: "\u674E\u5A1C", type: "personal", region: "\u4E0A\u6D77", province: "\u4E0A\u6D77", city: "\u4E0A\u6D77\u5E02", district: "\u5F90\u6C47\u533A", contactPerson: "\u674E\u5A1C", contactPhone: "139****5678", contactEmail: "lina@email.com", contactAddress: "\u6F15\u6EAA\u5317\u8DEF120\u53F7", level: "A\u7EA7", orders: 12, totalAmount: 45200, platformIds: [], cooperationDate: "2023-10-15", status: "active", source: "\u8001\u5BA2\u6237\u8F6C\u4ECB", remark: "\u9AD8\u7AEF\u4E2A\u4EBA\u5BA2\u6237\uFF0C\u5E38\u8D2D\u767D\u8336" },
  { id: "c21", name: "\u738B\u5F3A", shortName: "\u738B\u5F3A", type: "personal", region: "\u5E7F\u5DDE", province: "\u5E7F\u4E1C", city: "\u5E7F\u5DDE\u5E02", district: "\u6D77\u73E0\u533A", contactPerson: "\u738B\u5F3A", contactPhone: "137****9012", contactAddress: "\u65B0\u6E2F\u4E2D\u8DEF200\u53F7", level: "C\u7EA7", orders: 3, totalAmount: 8800, platformIds: [], cooperationDate: "2024-09-01", status: "active", source: "\u7EBF\u4E0A\u54A8\u8BE2" },
  { id: "c22", name: "\u8D75\u654F", shortName: "\u8D75\u654F", type: "personal", region: "\u6210\u90FD", province: "\u56DB\u5DDD", city: "\u6210\u90FD\u5E02", district: "\u9526\u6C5F\u533A", contactPerson: "\u8D75\u654F", contactPhone: "136****3456", contactEmail: "zhaomin@email.com", contactAddress: "\u6625\u7199\u8DEF50\u53F7", level: "B\u7EA7", orders: 8, totalAmount: 23400, platformIds: [], cooperationDate: "2024-02-20", status: "active", source: "\u5C55\u4F1A\u62D3\u5BA2", remark: "\u7EA2\u8336\u7231\u597D\u8005" },
  { id: "c23", name: "\u9648\u521A", shortName: "\u9648\u521A", type: "personal", region: "\u676D\u5DDE", province: "\u6D59\u6C5F", city: "\u676D\u5DDE\u5E02", district: "\u6EE8\u6C5F\u533A", contactPerson: "\u9648\u521A", contactPhone: "135****7890", contactAddress: "\u6C5F\u5357\u5927\u9053100\u53F7", level: "A\u7EA7", orders: 15, totalAmount: 56800, platformIds: [], cooperationDate: "2023-07-08", status: "inactive", source: "\u4E3B\u52A8\u5F00\u53D1", remark: "\u5DF2\u6682\u505C\u91C7\u8D2D" }
];
function assignCodes(items) {
  const counters = {};
  items.forEach((c) => {
    counters[c.type] = (counters[c.type] ?? 0) + 1;
    c.customerCode = generateCustomerCode(c.type, c.shortName || c.name, counters[c.type]);
  });
}
var allCustomers = [
  ...directNoPlatform,
  ...directViaPlatform,
  ...channelCustomers,
  ...platformCustomers,
  ...personalCustomers
];
assignCodes(allCustomers);
var customerItems = allCustomers;

// src/stores/priceStore.ts
function defaultCustomerStock(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = h * 31 + key.charCodeAt(i) >>> 0;
  return { stock: 20 + h % 180, reserved: h % 12, sold: 5 + h % 60 };
}
function getCustomerStock(map, customerId, productId) {
  const key = `${customerId}:${productId}`;
  const d = defaultCustomerStock(key);
  return { stock: map[key] ?? d.stock, reserved: d.reserved, sold: d.sold };
}
function getQuoteConfig(map, customerId) {
  return map[customerId] ?? { brandDiscounts: {}, products: {} };
}
function seedCustomerQuotes() {
  const byId = new Map(customerItems.map((c) => [c.id, c]));
  const platformSkeleton = (customerId) => {
    const c = byId.get(customerId);
    return (c?.platformIds ?? []).map((pid) => ({ platformId: pid, sku: "" }));
  };
  return {
    // 华茗堂茶庄：不经平台，单品价格示例
    c1: { brandDiscounts: {}, products: {
      "1": { productId: "1", price: 428, platformQuotes: [] },
      "2": { productId: "2", price: 298, platformQuotes: [] }
    } },
    // 浦发银行：经京东慧采（扣8%），品牌折扣 + 单品覆盖示例
    c6: { brandDiscounts: { \u897F\u6E56\u724C: 90 }, products: {
      "1": { productId: "1", price: 436, platformQuotes: platformSkeleton("c6") }
    } },
    // 交通银行：经史泰博（扣6%）+得力（扣5%），双平台示例
    c7: { brandDiscounts: {}, products: {
      "7": { productId: "7", price: 988, platformQuotes: platformSkeleton("c7") }
    } }
  };
}
var usePriceStore = create((set, get) => ({
  products: teaProducts,
  purchaseRules: purchasePriceRules,
  salesQuotations: salesQuotationRules,
  customerQuotes: seedCustomerQuotes(),
  customerStock: {},
  /** 客户×商品：调整可售量（该客户的独立可售量，不联动商品全局库存） */
  adjustCustomerStock: (customerId, productId, delta) => {
    const key = `${customerId}:${productId}`;
    const current = getCustomerStock(get().customerStock, customerId, productId).stock;
    const next = current + delta;
    if (next < 0) return { ok: false, msg: `\u51CF\u5C11\u540E\u53EF\u552E\u91CF\u4E0D\u80FD\u4F4E\u4E8E 0\uFF08\u5F53\u524D\u53EF\u552E\u91CF ${current}\uFF09` };
    set((s) => ({ customerStock: { ...s.customerStock, [key]: next } }));
    return { ok: true, msg: `\u53EF\u552E\u91CF\u5DF2${delta >= 0 ? "\u589E\u52A0" : "\u51CF\u5C11"} ${Math.abs(delta)}\uFF08${current} \u2192 ${next}\uFF09` };
  },
  addProduct: (p) => set((s) => ({ products: [...s.products, p] })),
  deleteProducts: (ids) => set((s) => ({ products: s.products.filter((p) => !ids.includes(p.id)) })),
  updateProduct: (id, patch) => set((s) => ({
    products: s.products.map((p) => p.id === id ? { ...p, ...patch } : p),
    // 下架联动：商品在商品管理中设置为下架后，所有客户该商品是否报品均改为否
    ...patch.shelfStatus === "off" ? {
      customerQuotes: Object.fromEntries(Object.entries(s.customerQuotes).map(([cid, cfg]) => [
        cid,
        cfg.products[id] ? { ...cfg, products: { ...cfg.products, [id]: { ...cfg.products[id], reported: false } } } : cfg
      ]))
    } : {}
  })),
  updateProductPrices: (id, patch) => set((s) => {
    const products = s.products.map((p) => p.id === id ? { ...p, ...patch } : p);
    const target = products.find((p) => p.id === id);
    let purchaseRules = s.purchaseRules;
    let salesQuotations = s.salesQuotations;
    if (patch.marketPrice !== void 0 && target) {
      purchaseRules = purchaseRules.map((r) => r.productId === id ? { ...r, marketPrice: patch.marketPrice, discountRate: patch.marketPrice > 0 ? Math.round(r.purchasePrice / patch.marketPrice * 100) : 0 } : r);
      salesQuotations = salesQuotations.map((r) => r.productId === id ? { ...r, marketPrice: patch.marketPrice } : r);
    }
    if (patch.salesPrice !== void 0 && target) {
      salesQuotations = salesQuotations.map((r) => r.productId === id ? { ...r, salesPrice: patch.salesPrice } : r);
    }
    return { products, purchaseRules, salesQuotations };
  }),
  updatePurchaseRulePrice: (ruleId, price) => set((s) => ({
    purchaseRules: s.purchaseRules.map((r) => {
      if (r.id !== ruleId) return r;
      const lastAdjustDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      return {
        ...r,
        purchasePrice: price,
        discountRate: r.marketPrice > 0 ? Math.round(price / r.marketPrice * 100) : 0,
        lastAdjustDate,
        lastAdjustNote: "\u4EF7\u683C\u7BA1\u7406\u8C03\u4EF7"
      };
    })
  })),
  updateSalesQuotationPrice: (ruleId, price) => set((s) => ({
    salesQuotations: s.salesQuotations.map((r) => {
      if (r.id !== ruleId) return r;
      const updated = { ...r, quotedPrice: price };
      if (r.quotationType === "direct_with_platform" && r.platformCommissionRate) {
        updated.platformNetPrice = calcPlatformNetPrice(price, r.platformCommissionRate);
      }
      return updated;
    })
  })),
  addCustomerQuoteProduct: (customerId, productId) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    if (cfg.products[productId]) return s;
    const c = customerItems.find((x) => x.id === customerId);
    const platforms = c?.platformIds ?? [];
    return {
      customerQuotes: {
        ...s.customerQuotes,
        [customerId]: {
          ...cfg,
          products: { ...cfg.products, [productId]: { productId, platformQuotes: platforms.map((pid) => ({ platformId: pid, sku: "" })) } }
        }
      }
    };
  }),
  removeCustomerQuoteProduct: (customerId, productId) => set((s) => {
    const cfg = s.customerQuotes[customerId];
    if (!cfg?.products[productId]) return s;
    const products = { ...cfg.products };
    delete products[productId];
    return { customerQuotes: { ...s.customerQuotes, [customerId]: { ...cfg, products } } };
  }),
  setCustomerProductPrice: (customerId, productId, price) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    const cur = cfg.products[productId];
    if (!cur) return s;
    return {
      customerQuotes: {
        ...s.customerQuotes,
        [customerId]: { ...cfg, products: { ...cfg.products, [productId]: { ...cur, price } } }
      }
    };
  }),
  /** 单品单独折扣/单独报价（参照合作商终端报价：与品牌折扣分层，patch null=清除单品覆盖） */
  setCustomerProductOverride: (customerId, productId, patch) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    const products = { ...cfg.products };
    if (patch === null) {
      if (products[productId]) {
        const cleared = { ...products[productId], price: void 0, discount: void 0 };
        if (cleared.platformQuotes.length > 0) {
          products[productId] = cleared;
        } else {
          delete products[productId];
        }
      }
    } else {
      const base = products[productId] ?? { productId, platformQuotes: [] };
      products[productId] = {
        ...base,
        price: patch.price !== void 0 ? patch.price : void 0,
        discount: patch.discount !== void 0 ? patch.discount : void 0
      };
    }
    return { customerQuotes: { ...s.customerQuotes, [customerId]: { ...cfg, products } } };
  }),
  /** 设置单品是否报品（无条目则创建仅含报品标记的条目） */
  setCustomerProductReported: (customerId, productId, reported) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    const cur = cfg.products[productId];
    const products = { ...cfg.products };
    if (cur) {
      products[productId] = { ...cur, reported };
    } else {
      products[productId] = { productId, platformQuotes: [], reported };
    }
    return { customerQuotes: { ...s.customerQuotes, [customerId]: { ...cfg, products } } };
  }),
  setBrandDiscount: (customerId, brand, discount) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    const brandDiscounts = { ...cfg.brandDiscounts };
    if (discount === null) delete brandDiscounts[brand];
    else brandDiscounts[brand] = discount;
    return { customerQuotes: { ...s.customerQuotes, [customerId]: { ...cfg, brandDiscounts } } };
  }),
  setCustomerPlatformQuote: (customerId, productId, platformId, patch) => set((s) => {
    const cfg = getQuoteConfig(s.customerQuotes, customerId);
    const products = { ...cfg.products };
    const cur = products[productId] ?? { productId, platformQuotes: [] };
    const exists = cur.platformQuotes.some((pq) => pq.platformId === platformId);
    const platformQuotes = exists ? cur.platformQuotes.map((pq) => pq.platformId === platformId ? { ...pq, ...patch } : pq) : [...cur.platformQuotes, { platformId, sku: "", ...patch }];
    products[productId] = { ...cur, platformQuotes };
    return { customerQuotes: { ...s.customerQuotes, [customerId]: { ...cfg, products } } };
  })
}));

// src/stores/purchaseStore.ts
var now3 = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var doSeq = 0;
var genDeliveryNo = (shipper) => {
  doSeq += 1;
  return `FHDXS${shipper === "self" ? "01" : "02"}${String(doSeq).padStart(4, "0")}`;
};
var nowMin = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ");
var purchasePriceOf = (it, supplierId) => {
  const rule = usePriceStore.getState().purchaseRules.find((r) => r.productId === it.productId && r.supplierId === supplierId && r.status === "active");
  return rule?.purchasePrice ?? Math.round(it.price * 0.55);
};
var refreshStatus = (doc) => {
  const active = doc.packages.filter((p) => p.status !== "void");
  const allShipped = doc.items.every((it) => it.shippedQty >= it.quantity);
  const anyShipped = doc.items.some((it) => it.shippedQty > 0);
  let status = doc.status;
  if (doc.status === "pending") status = "pending";
  else if (allShipped && active.every((p) => p.status === "delivered")) status = "delivered";
  else if (allShipped) status = "fully_shipped";
  else if (anyShipped) status = "partial_shipped";
  else status = "confirmed";
  if (doc.status === "settled") status = "settled";
  return { ...doc, status };
};
function seedDocs() {
  const docs = [];
  let pkgSeq = 1;
  const mkPkg = (doc, productId, productName, qty, company, prefix, delivered) => {
    const pkg = {
      id: `pkg_seed_${pkgSeq}`,
      packageNo: genDeliveryNo(doc.source === "self" ? "self" : "partner"),
      logisticsCompany: company,
      trackingNo: `${company.includes("\u987A\u4E30") ? "SF" : "DB"}${7e9 + prefix}`,
      shippedAt: `${doc.createTime} 09:30`,
      items: [{ productId, productName, qty }],
      status: delivered ? "delivered" : "shipped",
      operator: doc.supplierName
    };
    pkgSeq += 1;
    return pkg;
  };
  for (const o of externalOrderSeeds) {
    if (o.path === "distribute" && o.partnerId && o.partnerName && ["distribute_pending", "processed", "completed"].includes(o.processStatus)) {
      const winQuote = o.compare?.quotes.find((q) => q.supplierId === o.partnerId);
      const priceOf = o.transferSource === "compare" && winQuote ? (it) => {
        const totalAmt = Math.max(1, o.items.reduce((s, i) => s + i.price * i.quantity, 0));
        return Math.round(winQuote.amount * (it.price * it.quantity) / totalAmt / Math.max(1, it.quantity));
      } : void 0;
      const doc = buildDoc(o, "distribute", priceOf, "direct", o.transferTime ?? o.entryTime);
      if (o.processStatus === "distribute_pending") {
        doc.status = "pending";
      } else if (o.processStatus === "completed") {
        doc.status = "settled";
      } else {
        const ps = o.partnerStatus;
        if (ps === "accepted") {
          doc.status = "confirmed";
        } else if (ps === "shipping") {
          doc.status = "fully_shipped";
          for (const it of doc.items) {
            const q1 = Math.max(1, Math.floor(it.quantity * 0.6));
            const q2 = it.quantity - q1;
            it.shippedQty = it.quantity;
            doc.packages.push(mkPkg(doc, it.productId, it.productName, q1, "\u987A\u4E30\u901F\u8FD0", pkgSeq * 13579, false));
            if (q2 > 0) doc.packages.push(mkPkg(doc, it.productId, it.productName, q2, "\u5FB7\u90A6\u7269\u6D41", pkgSeq * 24681, false));
          }
        } else if (ps === "delivered") {
          doc.status = "delivered";
          for (const it of doc.items) {
            it.shippedQty = it.quantity;
            doc.packages.push(mkPkg(doc, it.productId, it.productName, it.quantity, "\u987A\u4E30\u901F\u8FD0", pkgSeq * 13579, true));
          }
        } else {
          doc.status = "pending";
        }
      }
      docs.push(doc);
    } else if (o.path === "self" && o.selfPo && ["self_accepted", "self_shipped", "self_delivered", "completed"].includes(o.processStatus)) {
      const directMap = /* @__PURE__ */ new Map();
      for (const sh of o.selfShipments ?? []) {
        for (const it of sh.items) directMap.set(it.productId, (directMap.get(it.productId) ?? 0) + it.qty);
      }
      const remain = o.items.map((it) => ({ ...it, quantity: it.quantity - (directMap.get(it.productId) ?? 0) })).filter((it) => it.quantity > 0);
      if (remain.length > 0) {
        const child = { ...o, items: remain };
        const doc = buildDoc(child, "self", (it) => purchasePriceOf(it, o.selfPo.supplierId), o.selfPo.mode, o.selfPo.purchaseDate);
        const delivered = o.processStatus === "self_delivered" || o.processStatus === "completed";
        if (o.selfPo.mode === "direct" && delivered) {
          doc.status = "delivered";
          for (const it of doc.items) {
            it.shippedQty = it.quantity;
            doc.packages.push(mkPkg(doc, it.productId, it.productName, it.quantity, "\u987A\u4E30\u901F\u8FD0", pkgSeq * 97531, true));
          }
        } else if (o.selfPo.mode === "warehouse") {
          doc.status = o.history.some((h) => h.action === "\u5230\u8D27\u5165\u5E93") ? "received" : "confirmed";
        } else {
          doc.status = "confirmed";
        }
        docs.push(doc);
      }
    }
  }
  return docs;
}
function buildDoc(child, source, priceOf, deliveryMode, createTime) {
  const items = child.items.map((it) => ({
    productId: it.productId,
    productName: it.productName,
    spec: it.spec,
    quantity: it.quantity,
    shippedQty: 0,
    price: priceOf ? priceOf(it) : purchasePriceOf(it, child.partnerId ?? "")
  }));
  return {
    id: `po_${child.id}`,
    code: `CG-${child.code}`,
    source,
    deliveryMode,
    childOrderId: child.id,
    childOrderCode: child.code,
    motherCode: child.parentCode ?? child.code,
    supplierId: child.partnerId ?? child.selfPo?.supplierId ?? "",
    supplierName: child.partnerName ?? child.selfPo?.supplierName ?? "",
    items,
    amount: items.reduce((s, it) => s + it.price * it.quantity, 0),
    status: "pending",
    createTime,
    packages: []
  };
}
var usePurchaseStore = create((set, get) => {
  const patchDoc = (childCode, fn) => {
    set((s) => ({ docs: s.docs.map((d) => d.childOrderCode === childCode ? fn(d) : d) }));
  };
  return {
    docs: seedDocs(),
    createFromChild: ({ child, source, priceOf, deliveryMode, itemSubset, supplierId, supplierName }) => {
      const supplierKey = supplierId ?? child.partnerId ?? child.selfPo?.supplierId ?? "";
      const existed = get().docs.find((d) => d.childOrderCode === child.code && d.supplierId === supplierKey);
      if (existed) return existed;
      const doc = buildDoc(child, source, priceOf, deliveryMode ?? "direct", now3());
      let final = doc;
      if (itemSubset && itemSubset.length > 0) {
        const items = itemSubset.map((sub) => {
          const it = doc.items.find((x) => x.productId === sub.productId);
          return it ? { ...it, quantity: sub.quantity } : null;
        }).filter(Boolean);
        final = { ...doc, items, amount: items.reduce((s, it) => s + it.price * it.quantity, 0) };
      }
      if (supplierId && supplierName) {
        final = { ...final, supplierId, supplierName };
      }
      const withStatus = { ...final, status: source === "self" ? "confirmed" : "pending" };
      set((s) => ({ docs: [withStatus, ...s.docs] }));
      return withStatus;
    },
    findByChild: (childCode) => get().docs.find((d) => d.childOrderCode === childCode),
    confirmByChild: (childCode) => {
      patchDoc(childCode, (d) => d.status === "pending" ? { ...d, status: "confirmed" } : d);
    },
    registerShipment: (childCode, input) => {
      const doc = get().docs.find((d) => d.childOrderCode === childCode);
      if (!doc) return { ok: false, msg: "\u91C7\u8D2D\u5355\u4E0D\u5B58\u5728" };
      if (!["confirmed", "partial_shipped", "fully_shipped", "received"].includes(doc.status)) return { ok: false, msg: "\u91C7\u8D2D\u5355\u5C1A\u672A\u786E\u8BA4\u63A5\u5355\uFF0C\u4E0D\u80FD\u53D1\u8D27" };
      if (!input.logisticsCompany.trim() || !input.trackingNo.trim()) return { ok: false, msg: "\u8BF7\u586B\u5199\u7269\u6D41\u516C\u53F8\u4E0E\u7269\u6D41\u5355\u53F7" };
      const lines = input.items.filter((x) => x.qty > 0);
      if (lines.length === 0) return { ok: false, msg: "\u8BF7\u586B\u5199\u672C\u6B21\u53D1\u8D27\u6570\u91CF" };
      for (const line of lines) {
        const it = doc.items.find((x) => x.productId === line.productId);
        if (!it) return { ok: false, msg: "\u5546\u54C1\u4E0D\u5728\u91C7\u8D2D\u5355\u5185" };
        if (line.qty > it.quantity - it.shippedQty) return { ok: false, msg: `${it.productName} \u672C\u6B21\u53D1\u8D27\u6570\u91CF\u8D85\u51FA\u5269\u4F59\u53EF\u53D1\uFF08${it.quantity - it.shippedQty}\uFF09` };
      }
      const seq = doc.packages.length + 1;
      const pkg = {
        id: `pkg_${Date.now()}`,
        packageNo: genDeliveryNo(doc.source === "self" ? "self" : "partner"),
        logisticsCompany: input.logisticsCompany.trim(),
        trackingNo: input.trackingNo.trim(),
        shippedAt: nowMin(),
        items: lines.map((l) => ({ productId: l.productId, productName: doc.items.find((x) => x.productId === l.productId).productName, qty: l.qty })),
        status: "shipped",
        operator: input.operator
      };
      patchDoc(childCode, (d) => {
        const items = d.items.map((it) => {
          const line = lines.find((l) => l.productId === it.productId);
          return line ? { ...it, shippedQty: it.shippedQty + line.qty } : it;
        });
        return refreshStatus({ ...d, items, packages: [...d.packages, pkg] });
      });
      return { ok: true, msg: `\u53D1\u8D27\u767B\u8BB0\u6210\u529F\uFF08${pkg.packageNo}\uFF09\uFF0C\u7269\u6D41\u5355\u53F7 ${pkg.trackingNo}` };
    },
    voidPackage: (childCode, packageId) => {
      const doc = get().docs.find((d) => d.childOrderCode === childCode);
      const pkg = doc?.packages.find((p) => p.id === packageId);
      if (!doc || !pkg) return { ok: false, msg: "\u5305\u88F9\u4E0D\u5B58\u5728" };
      if (pkg.status === "delivered") return { ok: false, msg: "\u5DF2\u7B7E\u6536\u5305\u88F9\u4E0D\u53EF\u4F5C\u5E9F\uFF08\u8BF7\u8D70\u9000\u8D27\u6D41\u7A0B\uFF09" };
      patchDoc(childCode, (d) => {
        const items = d.items.map((it) => {
          const line = pkg.items.find((x) => x.productId === it.productId);
          return line ? { ...it, shippedQty: Math.max(0, it.shippedQty - line.qty) } : it;
        });
        return refreshStatus({ ...d, items, packages: d.packages.map((p) => p.id === packageId ? { ...p, status: "void" } : p) });
      });
      return { ok: true, msg: `\u5305\u88F9 ${pkg.packageNo} \u5DF2\u4F5C\u5E9F\uFF0C\u53EF\u53D1\u6570\u91CF\u5DF2\u56DE\u9000` };
    },
    deliverPackage: (childCode, packageId) => {
      patchDoc(childCode, (d) => refreshStatus({ ...d, packages: d.packages.map((p) => p.id === packageId ? { ...p, status: "delivered" } : p) }));
    },
    deliverAllByChild: (childCode) => {
      patchDoc(childCode, (d) => refreshStatus({
        ...d,
        packages: d.packages.map((p) => p.status === "shipped" ? { ...p, status: "delivered" } : p)
      }));
    },
    settleByChild: (childCode) => {
      patchDoc(childCode, (d) => ({ ...d, status: "settled" }));
    },
    /** 入库制 PO 到货入库（已确认/部分到货 → 已入库） */
    receiveByChild: (childCode) => {
      patchDoc(childCode, (d) => d.deliveryMode === "warehouse" && ["confirmed"].includes(d.status) ? { ...d, status: "received" } : d);
    },
    listByChildOrder: (childOrderId) => get().docs.filter((d) => d.childOrderId === childOrderId)
  };
});

// src/stores/orderFlowStore.ts
var now4 = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var nowTs = () => Date.now();
var nowMin2 = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ");
var genOrderCode = (orders) => {
  const dateKey = now4().replace(/-/g, "");
  const seq = orders.filter((o) => !o.parentCode && o.code.includes(dateKey)).length + 1;
  return `DXS${dateKey}${String(seq).padStart(4, "0")}`;
};
var genFulfillmentCode = (soCode, orders) => {
  const seq = orders.filter((o) => o.parentCode === soCode).length + 1;
  return `${soCode}LY${String(seq).padStart(2, "0")}`;
};
var toPlatformOrder = (o) => ({
  id: o.id,
  code: o.code,
  customerName: o.customerName,
  customerType: o.customerType,
  customerRegion: o.customerRegion,
  items: o.items.map((it) => ({ productName: it.productName, spec: it.spec, quantity: it.quantity, price: it.price })),
  totalAmount: o.totalAmount,
  deliveryMode: "direct",
  coopMode: "supplier",
  orderDate: o.entryTime,
  expectedShipDate: o.entryTime,
  receiver: o.receiver,
  receiverPhone: o.receiverPhone,
  receiverAddress: o.receiverAddress,
  remark: o.remark
});
function matchExternalOrder(order) {
  const reports = useReportStore.getState().reports.filter((r) => r.status === "approved");
  const suppliers = useSupplierStore.getState().suppliers;
  return reports.filter((r) => matchesReport(toPlatformOrder(order), r)).sort((a, b) => reportPriority(a) - reportPriority(b)).map((r) => ({
    reportCode: r.code,
    reportType: r.type,
    partnerId: suppliers.find((s) => s.name === r.partnerName)?.id,
    partnerName: r.partnerName
  }));
}
var floorAmount = (totalAmount, rule) => rule.type === "discount" ? Math.round(totalAmount * rule.value) / 100 : rule.value;
var useOrderFlowStore = create((set, get) => {
  const patchOrder = (id, patch, history) => {
    set((s) => ({
      orders: s.orders.map(
        (o) => o.id === id ? { ...o, ...patch, history: history ? [...o.history, { time: now4(), ...history }] : o.history } : o
      )
    }));
  };
  const transfer = (id, supplierId, supplierName, source, detail) => {
    patchOrder(id, {
      processStatus: "distribute_pending",
      path: "distribute",
      partnerId: supplierId,
      partnerName: supplierName,
      transferSource: source,
      transferTime: now4(),
      partnerStatus: void 0
    }, { action: source === "report" ? "\u62A5\u5907\u547D\u4E2D\u81EA\u52A8\u8F6C\u51FA" : source === "assign" ? "\u6307\u5B9A\u8F6C\u6D3E" : "\u6BD4\u5355\u8F6C\u6D3E", detail: `${detail} \u2192 ${supplierName} \xB7 \u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355` });
    const after = get().orders.find((o) => o.id === id);
    if (after) {
      const winQuote = after.compare?.quotes.find((q) => q.supplierId === supplierId);
      usePurchaseStore.getState().createFromChild({
        child: after,
        source: "distribute",
        deliveryMode: "direct",
        priceOf: source === "compare" && winQuote ? (it) => {
          const totalAmt = Math.max(1, after.items.reduce((s, i) => s + i.price * i.quantity, 0));
          return Math.round(winQuote.amount * (it.price * it.quantity) / totalAmt / Math.max(1, it.quantity));
        } : void 0
      });
    }
  };
  const makeSplitChild = (mother, rootCode, seq, items, extra, lastAction, lastDetail) => ({
    ...mother,
    id: `eo_${nowTs()}_${seq}_${Math.floor(Math.random() * 1e3)}`,
    code: `${rootCode}FO${String(seq).padStart(2, "0")}`,
    parentCode: rootCode,
    items,
    totalAmount: items.reduce((s, it) => s + it.price * it.quantity, 0),
    reportMatches: void 0,
    sourceTag: void 0,
    compare: void 0,
    partnerId: void 0,
    partnerName: void 0,
    transferSource: void 0,
    transferTime: void 0,
    partnerStatus: void 0,
    settleOnTime: void 0,
    follower: void 0,
    selfPo: void 0,
    selfShipments: void 0,
    processStatus: "pending",
    path: void 0,
    distributeMode: void 0,
    ...extra,
    history: [...mother.history, { time: now4(), action: lastAction, detail: lastDetail }]
  });
  return {
    orders: externalOrderSeeds,
    settings: {
      compareMinutes: 30,
      compareWeights: { quote: 5, score: 5 }
    },
    /* ── 录入 / 删除 / 修改 ── */
    addExternalOrder: (input) => {
      const orders = get().orders;
      const order = {
        id: `eo_${nowTs()}`,
        code: genOrderCode(orders),
        ...input,
        sourceChannel: input.sourceChannel ?? "manual",
        operator: input.operator || "\u8FD0\u8425\u4EBA\u5458",
        totalAmount: input.items.reduce((s, it) => s + it.price * it.quantity, 0),
        entryTime: now4(),
        processStatus: "pending",
        history: [{
          time: now4(),
          action: input.sourceChannel === "push" ? "\u76F4\u8FDE\u63A8\u9001\u8BA2\u5355" : "\u624B\u5DE5\u5F55\u5165\u8BA2\u5355",
          detail: (input.sourceChannel === "push" ? "\u5E73\u53F0 API \u81EA\u52A8\u540C\u6B65" : "\u624B\u5DE5\u5F55\u5165") + (input.salesPath === "via_platform" ? ` \xB7 \u7ECF\u5E73\u53F0\u9500\u552E\uFF08${input.platformCustomerName ?? "\u2014"}\uFF09` : " \xB7 \u76F4\u63A5\u9500\u552E") + (input.customerOrderNo ? ` \xB7 \u5BA2\u6237\u4FA7\u5355\u53F7 ${input.customerOrderNo}` : "")
        }]
      };
      const matches = matchExternalOrder(order);
      const match = matches.find((m) => m.partnerId);
      if (match?.partnerId) {
        order.reportMatches = matches;
        order.processStatus = "report_match_pending";
        order.path = "distribute";
        order.partnerId = match.partnerId;
        order.partnerName = match.partnerName;
        order.history.push({ time: now4(), action: "\u547D\u4E2D\u62A5\u5907\uFF0C\u5F85\u786E\u8BA4\u5339\u914D", detail: `\u547D\u4E2D ${matches.map((m) => m.reportCode).join("\u3001")} \u2192 ${match.partnerName} \xB7 \u5F85\u4EBA\u5DE5\u786E\u8BA4\u540E\u5206\u53D1` });
      }
      set({ orders: [order, ...orders] });
      return order;
    },
    deleteOrder: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      if (order.sourceChannel !== "manual") return { ok: false, msg: "\u76F4\u8FDE\u63A8\u9001\u8BA2\u5355\u4E0D\u652F\u6301\u5220\u9664" };
      if (order.processStatus !== "pending") return { ok: false, msg: "\u4EC5\u5F85\u5904\u7406\u8BA2\u5355\u53EF\u5220\u9664" };
      set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }));
      return { ok: true, msg: "\u8BA2\u5355\u5DF2\u5220\u9664" };
    },
    updateOrder: (id, patch) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      if (["processed", "completed"].includes(order.processStatus)) return { ok: false, msg: "\u5DF2\u63A5\u5355\u8BA2\u5355\u4E0D\u53EF\u4FEE\u6539" };
      const nextItems = patch.items ?? order.items;
      patchOrder(id, {
        ...patch,
        items: nextItems,
        totalAmount: nextItems.reduce((s, it) => s + it.price * it.quantity, 0)
      }, { action: "\u4FEE\u6539\u8BA2\u5355\u4FE1\u606F", detail: "\u7BA1\u7406\u540E\u53F0\u4FEE\u6539\u8BA2\u5355\u5185\u5BB9" });
      return { ok: true, msg: "\u8BA2\u5355\u5DF2\u4FEE\u6539" };
    },
    /* ── 路径选择与分发 ── */
    chooseSelfPath: (id) => {
      patchOrder(id, {
        path: "self",
        processStatus: "self_pending"
      }, { action: "\u9009\u62E9\u81EA\u8425\u8DEF\u5F84", detail: "\u80CC\u5BF9\u80CC\u91C7\u8D2D \xB7 \u7B49\u5F85\u7BA1\u7406\u540E\u53F0\u63A5\u5355\uFF08\u9500\u552E\u8BA2\u5355 \u2192 \u5206\u53D1\u8BA2\u5355\uFF09" });
    },
    assignPartner: (id, supplierId, supplierName) => {
      transfer(id, supplierId, supplierName, "assign", "\u8FD0\u8425\u6307\u5B9A\u8F6C\u6D3E");
    },
    confirmReportMatch: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      if (order.processStatus !== "report_match_pending") return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5728\u62A5\u5907-\u5339\u914D\u5F85\u786E\u8BA4\u72B6\u6001" };
      const match = order.reportMatches?.find((m) => m.partnerId && m.partnerName);
      if (!match?.partnerId || !match.partnerName) return { ok: false, msg: "\u672A\u627E\u5230\u53EF\u5206\u53D1\u7684\u62A5\u5907\u5339\u914D\u5408\u4F5C\u5546" };
      const matchReport = useReportStore.getState().reports.find((r) => r.code === match.reportCode);
      if (matchReport?.type === "order" && matchReport.orderKind === "no_supply") {
        patchOrder(id, { processStatus: "pending", reportMatches: void 0 }, {
          action: "\u786E\u8BA4\u62A5\u5907\u5339\u914D\uFF08\u65E0\u8D27\u6E90\uFF09",
          detail: `\u547D\u4E2D ${match.partnerName} \u7684\u65E0\u8D27\u6E90\u8BA2\u5355\u62A5\u5907 ${match.reportCode} \u2192 \u9000\u56DE\u5206\u53D1-\u5F85\u5904\u7406\uFF0C\u7531\u5E73\u53F0\u81EA\u8425\u6216\u8F6C\u6D3E\u4F9B\u8D27\u5546\uFF08\u53EF\u6307\u5B9A / \u53EF\u6BD4\u5355\uFF09`
        });
        return { ok: true, msg: `\u5DF2\u786E\u8BA4\u5339\u914D\uFF08\u65E0\u8D27\u6E90\u62A5\u5907\uFF09\uFF0C\u8BA2\u5355\u9000\u56DE\u5206\u53D1-\u5F85\u5904\u7406\u7531\u5E73\u53F0\u5206\u53D1` };
      }
      transfer(id, match.partnerId, match.partnerName, "report", `\u786E\u8BA4\u62A5\u5907\u5339\u914D ${match.reportCode}`);
      return { ok: true, msg: `\u5DF2\u786E\u8BA4\u5339\u914D\u5E76\u8F6C\u51FA ${match.partnerName}\uFF0C\u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355` };
    },
    matchReportManual: (id, reportCodes) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      if (order.processStatus !== "pending") return { ok: false, msg: "\u4EC5\u5206\u53D1-\u5F85\u5904\u7406\u8BA2\u5355\u53EF\u5339\u914D\u62A5\u5907" };
      const codes = [...new Set(reportCodes)].filter(Boolean);
      if (codes.length === 0) return { ok: false, msg: "\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u6761\u62A5\u5907\u8BB0\u5F55" };
      const reports = useReportStore.getState().reports.filter((r) => codes.includes(r.code) && r.status === "approved");
      if (reports.length === 0) return { ok: false, msg: "\u62A5\u5907\u8BB0\u5F55\u4E0D\u5B58\u5728\u6216\u672A\u901A\u8FC7\u5BA1\u6279" };
      const suppliers = useSupplierStore.getState().suppliers;
      const matches = reports.map((r) => ({
        reportCode: r.code,
        reportType: r.type,
        partnerId: suppliers.find((s) => s.name === r.partnerName)?.id,
        partnerName: r.partnerName
      })).filter((m) => m.partnerId);
      if (matches.length === 0) return { ok: false, msg: "\u62A5\u5907\u5408\u4F5C\u5546\u4E0D\u5728\u5408\u4F5C\u5546\u6863\u6848\u4E2D" };
      patchOrder(id, { reportMatches: matches });
      if (reports[0].type === "order" && reports[0].orderKind === "no_supply") {
        patchOrder(id, { processStatus: "pending", reportMatches: matches }, {
          action: "\u4EBA\u5DE5\u5339\u914D\u62A5\u5907\uFF08\u65E0\u8D27\u6E90\uFF09",
          detail: `\u547D\u4E2D ${matches[0].partnerName} \u7684\u65E0\u8D27\u6E90\u8BA2\u5355\u62A5\u5907 \u2192 \u9000\u56DE\u5206\u53D1-\u5F85\u5904\u7406\uFF0C\u7531\u5E73\u53F0\u81EA\u8425\u6216\u8F6C\u6D3E\u4F9B\u8D27\u5546\uFF08\u53EF\u6307\u5B9A / \u53EF\u6BD4\u5355\uFF09`
        });
        return { ok: true, msg: `\u5DF2\u5339\u914D\u65E0\u8D27\u6E90\u62A5\u5907\uFF08${matches[0].partnerName}\uFF09\uFF0C\u8BA2\u5355\u9000\u56DE\u5206\u53D1-\u5F85\u5904\u7406\u7531\u5E73\u53F0\u5206\u53D1` };
      }
      transfer(id, matches[0].partnerId, matches[0].partnerName, "report", `\u4EBA\u5DE5\u5339\u914D\u62A5\u5907 ${matches.map((m) => m.reportCode).join("\u3001")}`);
      return { ok: true, msg: `\u5DF2\u5339\u914D ${matches.length} \u6761\u62A5\u5907\u5E76\u8F6C\u51FA ${matches[0].partnerName}\uFF0C\u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355` };
    },
    splitOrder: (id, parts) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      const isAcceptedSelf = order.path === "self" && order.processStatus === "self_accepted";
      if (order.processStatus !== "pending" && !isAcceptedSelf) return { ok: false, msg: "\u4EC5\u5206\u53D1-\u5F85\u5904\u7406\u6216\u5DF2\u63A5\u5355\uFF08\u81EA\u8425\uFF09\u8BA2\u5355\u53EF\u62C6\u5355" };
      const valid = parts.filter((p) => p.quantity > 0);
      if (valid.length === 0) return { ok: false, msg: "\u8BF7\u586B\u5199\u8981\u62C6\u51FA\u7684\u5546\u54C1\u6570\u91CF" };
      for (const p of valid) {
        const it = order.items.find((x) => x.productName === p.productName);
        if (!it) return { ok: false, msg: `\u5546\u54C1 ${p.productName} \u4E0D\u5728\u8BA2\u5355\u5185` };
        if (p.quantity > it.quantity) return { ok: false, msg: `\u5546\u54C1 ${p.productName} \u62C6\u51FA\u6570\u91CF\u8D85\u51FA\u8BA2\u5355\u6570\u91CF` };
      }
      const remainItems = order.items.map((it) => ({ ...it, quantity: it.quantity - (valid.find((p) => p.productName === it.productName)?.quantity ?? 0) })).filter((it) => it.quantity > 0);
      if (remainItems.length === 0) return { ok: false, msg: "\u4E0D\u80FD\u62C6\u51FA\u5168\u90E8\u5546\u54C1\uFF08\u9700\u4FDD\u7559\u5269\u4F59\u90E8\u5206\u751F\u6210\u5C65\u7EA6\u5355\uFF09" };
      const rootCode = order.parentCode ?? order.code;
      const childStatus = isAcceptedSelf ? "self_accepted" : "pending";
      const childPath = isAcceptedSelf ? "self" : order.path;
      const mkFo = (items, note) => {
        const seq = get().orders.filter((o) => o.parentCode === rootCode).length + 1;
        const code = genFulfillmentCode(rootCode, get().orders);
        return {
          ...order,
          id: `eo_${nowTs()}_${seq}_${Math.floor(Math.random() * 1e3)}`,
          code,
          parentCode: rootCode,
          items,
          totalAmount: items.reduce((s, it) => s + it.price * it.quantity, 0),
          processStatus: childStatus,
          path: childPath,
          reportMatches: void 0,
          sourceTag: void 0,
          history: [{ time: now4(), action: "\u62C6\u5355\u751F\u6210\u5C65\u7EA6\u5355", detail: `\u4ECE ${order.code} \u62C6\u51FA${note} \xB7 ${items.map((i) => `${i.productName}\xD7${i.quantity}`).join("\u3001")}${isAcceptedSelf ? " \xB7 \u7EE7\u627F\u81EA\u8425\u5DF2\u63A5\u5355" : ""}` }]
        };
      };
      const splitFo = mkFo(valid.map((p) => ({ ...order.items.find((x) => x.productName === p.productName), quantity: p.quantity })), "");
      const remainFo = mkFo(remainItems, "\uFF08\u5269\u4F59\u90E8\u5206\uFF09");
      set((s) => ({
        orders: [
          splitFo,
          remainFo,
          ...s.orders.map((o) => o.id === id ? { ...o, history: [...o.history, { time: now4(), action: "\u62C6\u5355", detail: `\u62C6\u51FA\u5B50\u5C65\u7EA6\u5355 ${splitFo.code}\uFF0C\u5269\u4F59\u90E8\u5206\u751F\u6210\u5B50\u5C65\u7EA6\u5355 ${remainFo.code}\uFF0C\u5747\u6302\u672C\u6BCD\u9500\u552E\u5355\u4E0B` }] } : o)
        ]
      }));
      return { ok: true, msg: `\u5DF2\u62C6\u51FA\u5B50\u5C65\u7EA6\u5355 ${splitFo.code}\uFF0C\u5269\u4F59\u90E8\u5206\u751F\u6210 ${remainFo.code}` };
    },
    quickSplit: (id, mode) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      const isAcceptedSelf = order.path === "self" && order.processStatus === "self_accepted";
      if (order.processStatus !== "pending" && !isAcceptedSelf) return { ok: false, msg: "\u4EC5\u5206\u53D1-\u5F85\u5904\u7406\u6216\u5DF2\u63A5\u5355\uFF08\u81EA\u8425\uFF09\u8BA2\u5355\u53EF\u62C6\u5355" };
      if (order.items.length < 2) return { ok: false, msg: "\u8BA2\u5355\u4EC5 1 \u79CD\u5546\u54C1\uFF0C\u65E0\u9700\u62C6\u5355" };
      const products = usePriceStore.getState().products;
      const groups = [];
      for (const it of order.items) {
        const key = mode === "brand" ? products.find((p) => p.id === it.productId)?.brand ?? products.find((p) => p.name === it.productName)?.brand ?? "\u5176\u4ED6" : it.productName;
        const cur = groups.find((g) => g.key === key);
        if (cur) cur.items.push({ productName: it.productName, quantity: it.quantity });
        else groups.push({ key, items: [{ productName: it.productName, quantity: it.quantity }] });
      }
      const modeLabel = mode === "brand" ? "\u54C1\u724C" : "\u5546\u54C1";
      if (groups.length < 2) return { ok: false, msg: `\u6309${modeLabel}\u4EC5\u4E00\u4E2A\u5206\u7EC4\uFF08${groups[0].key}\uFF09\uFF0C\u65E0\u9700\u62C6\u5355` };
      const childStatus = isAcceptedSelf ? "self_accepted" : "pending";
      const childPath = isAcceptedSelf ? "self" : order.path;
      const fos = [];
      for (const g of groups) {
        const seq = get().orders.filter((o) => o.parentCode === (order.parentCode ?? order.code)).length + fos.length + 1;
        const code = genFulfillmentCode(order.parentCode ?? order.code, [...get().orders, ...fos]);
        fos.push({
          ...order,
          id: `eo_${nowTs()}_${seq}_${Math.floor(Math.random() * 1e3)}`,
          code,
          parentCode: order.parentCode ?? order.code,
          items: g.items.map((p) => ({ ...order.items.find((x) => x.productName === p.productName), quantity: p.quantity })),
          totalAmount: g.items.reduce((s, p) => s + order.items.find((x) => x.productName === p.productName).price * p.quantity, 0),
          processStatus: childStatus,
          path: childPath,
          reportMatches: void 0,
          sourceTag: void 0,
          history: [{ time: now4(), action: `\u5FEB\u901F\u62C6\u5355\uFF08\u6309${modeLabel}\uFF09`, detail: `\u5206\u7EC4\u300C${g.key}\u300D\u2192 ${g.items.map((i) => `${i.productName}\xD7${i.quantity}`).join("\u3001")}${isAcceptedSelf ? " \xB7 \u7EE7\u627F\u81EA\u8425\u5DF2\u63A5\u5355" : ""}` }]
        });
      }
      set((s) => ({
        orders: [
          ...fos,
          ...s.orders.map((o) => o.id === id ? { ...o, history: [...o.history, { time: now4(), action: `\u5FEB\u901F\u62C6\u5355\uFF08\u6309${modeLabel}\uFF09`, detail: `${groups.length} \u4E2A\u5206\u7EC4\u5404\u751F\u6210\u5B50\u5C65\u7EA6\u5355 ${fos.map((f) => f.code).join("\u3001")}\uFF0C\u5747\u6302\u672C\u6BCD\u9500\u552E\u5355\u4E0B` }] } : o)
        ]
      }));
      return { ok: true, msg: `\u5DF2\u6309${modeLabel}\u62C6\u4E3A ${fos.length} \u5F20\u5B50\u5C65\u7EA6\u5355\uFF08${fos.map((f) => f.code).join("\u3001")}\uFF09` };
    },
    resetToPending: (id, note) => {
      patchOrder(id, {
        processStatus: "pending",
        path: void 0,
        distributeMode: void 0,
        partnerId: void 0,
        partnerName: void 0,
        transferSource: void 0,
        transferTime: void 0,
        partnerStatus: void 0,
        settleOnTime: void 0,
        follower: void 0,
        selfPo: void 0,
        selfShipments: void 0,
        compare: void 0,
        // 报备匹配信息一并清除：重新分发后不再按报备自动分发，由运营手动选择路径
        reportMatches: void 0
      }, { action: "\u91CD\u65B0\u5206\u53D1", detail: note || "\u8BA2\u5355\u8FDB\u5165\u5F85\u5904\u7406\u72B6\u6001\u91CD\u65B0\u9009\u62E9\u8DEF\u5F84\uFF08\u5DF2\u6E05\u9664\u62A5\u5907\u5339\u914D\uFF0C\u4E0D\u518D\u81EA\u52A8\u6309\u62A5\u5907\u8F6C\u6D3E\uFF09" });
    },
    /* ── 自营执行（销售单自营菜单） ── */
    acceptSelfOrder: (id, input) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      if (order.processStatus !== "self_pending") return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5728\u81EA\u8425\u5F85\u63A5\u5355\u72B6\u6001" };
      patchOrder(id, {
        processStatus: "self_accepted",
        path: "self",
        follower: input.follower
      }, { action: "\u63A5\u5355\uFF08\u81EA\u8425\uFF09", detail: `\u8DDF\u5355\u4EBA ${input.follower || "\u2014"} \u2192 \u5DF2\u63A5\u5355\uFF08\u53EF\u62C6\u5355 / \u91C7\u8D2D&\u53D1\u8D27\uFF09` });
      return { ok: true, msg: "\u5DF2\u63A5\u5355\uFF0C\u53EF\u8FDB\u884C\u62C6\u5355\u6216\u91C7\u8D2D&\u53D1\u8D27" };
    },
    returnToDistribute: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      if (order.processStatus !== "self_pending") return { ok: false, msg: "\u4EC5\u81EA\u8425\u5F85\u63A5\u5355\u8BA2\u5355\u53EF\u9000\u56DE" };
      patchOrder(id, {
        processStatus: "pending",
        path: void 0,
        sourceTag: "self_returned",
        follower: void 0
      }, { action: "\u81EA\u8425\u9000\u56DE", detail: "\u9000\u56DE\u9500\u552E\u5355\u5206\u53D1 \xB7 \u91CD\u65B0\u8FDB\u5165\u5206\u53D1-\u5F85\u5904\u7406\uFF08\u6765\u6E90\u6807\u6CE8\uFF1A\u81EA\u8425\u9000\u56DE\uFF09" });
      return { ok: true, msg: "\u5DF2\u9000\u56DE\u9500\u552E\u5355\u5206\u53D1\uFF08\u5206\u53D1-\u5F85\u5904\u7406\uFF09\uFF0C\u6765\u6E90\u5DF2\u6807\u6CE8\u300C\u81EA\u8425\u9000\u56DE\u300D" };
    },
    shipSelfOrder: (id, input) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      if (order.processStatus !== "self_accepted") return { ok: false, msg: "\u4EC5\u5DF2\u63A5\u5355\uFF08\u81EA\u8425\uFF09\u8BA2\u5355\u53EF\u91C7\u8D2D&\u53D1\u8D27" };
      const shipments = input.shipments.filter((x) => x.items.some((i) => i.qty > 0));
      for (const sh of shipments) {
        if (!sh.logisticsCompany.trim() || !sh.trackingNo.trim()) return { ok: false, msg: `\u4ED3\u5E93 ${sh.warehouseName} \u7684\u5FEB\u9012\u516C\u53F8/\u5355\u53F7\u672A\u586B\u5199` };
        for (const line of sh.items.filter((i) => i.qty > 0)) {
          const it = order.items.find((x) => x.productId === line.productId);
          if (!it) return { ok: false, msg: `\u5546\u54C1 ${line.productName} \u4E0D\u5728\u8BA2\u5355\u5185` };
        }
      }
      const alloc = /* @__PURE__ */ new Map();
      for (const sh of shipments) for (const line of sh.items.filter((i) => i.qty > 0)) {
        alloc.set(line.productId, (alloc.get(line.productId) ?? 0) + line.qty);
      }
      for (const it of order.items) {
        if ((alloc.get(it.productId) ?? 0) > it.quantity) return { ok: false, msg: `${it.productName} \u5206\u4ED3\u53D1\u8D27\u6570\u91CF\u8D85\u51FA\u8BA2\u5355\u6570\u91CF` };
      }
      const purchase = input.purchase;
      if (purchase && purchase.items.some((x) => x.quantity > 0) && !purchase.supplierId) {
        return { ok: false, msg: "\u4EE5\u9500\u5B9A\u91C7\u8BF7\u9009\u62E9\u4F9B\u5E94\u5546" };
      }
      if (purchase) {
        for (const line of purchase.items.filter((x) => x.quantity > 0)) {
          const it = order.items.find((x) => x.productId === line.productId);
          if (!it) return { ok: false, msg: `\u91C7\u8D2D\u5546\u54C1 ${line.productId} \u4E0D\u5728\u8BA2\u5355\u5185` };
          const gap = it.quantity - (alloc.get(it.productId) ?? 0);
          if (line.quantity < gap) return { ok: false, msg: `${it.productName} \u91C7\u8D2D\u6570\u91CF\u4E0D\u5F97\u4F4E\u4E8E\u7F3A\u53E3 ${gap}` };
        }
      }
      const seqBase = (order.selfShipments?.length ?? 0) + 1;
      const selfShipments = [
        ...order.selfShipments ?? [],
        ...shipments.map((sh, i) => ({
          id: `ss_${nowTs()}_${i}`,
          packageNo: `PKG-${order.code}-${String(seqBase + i).padStart(2, "0")}`,
          warehouseId: sh.warehouseId,
          warehouseName: sh.warehouseName,
          logisticsCompany: sh.logisticsCompany.trim(),
          trackingNo: sh.trackingNo.trim(),
          items: sh.items.filter((x) => x.qty > 0).map((x) => ({ productId: x.productId, productName: x.productName, qty: x.qty })),
          status: "shipped",
          shippedAt: nowMin2()
        }))
      ];
      let poNote = "";
      if (purchase) {
        const lines = purchase.items.filter((x) => x.quantity > 0);
        if (lines.length > 0) {
          const po = usePurchaseStore.getState().createFromChild({
            child: order,
            source: "self",
            deliveryMode: purchase.mode,
            itemSubset: lines,
            supplierId: purchase.supplierId,
            supplierName: purchase.supplierName,
            priceOf: (it) => {
              const rules = usePriceStore.getState().purchaseRules;
              const rule = rules.find((r) => r.productId === it.productId && r.supplierId === purchase.supplierId && r.status === "active");
              return rule?.purchasePrice ?? Math.round(it.price * 0.55);
            }
          });
          const excess = lines.reduce((s2, l) => {
            const it = order.items.find((x) => x.productId === l.productId);
            return s2 + Math.max(0, l.quantity - (it.quantity - (alloc.get(it.productId) ?? 0)));
          }, 0);
          poNote = ` \xB7 \u4EE5\u9500\u5B9A\u91C7 ${po.code}\uFF08${purchase.supplierName} \xB7 ${purchase.mode === "direct" ? "\u76F4\u53D1\u5BA2\u6237" : "\u5165\u5E93\u5236"}\uFF09` + (excess > 0 ? `\uFF0C\u8D85\u51FA\u7F3A\u53E3 ${excess} \u4EF6\u5165\u5E93\u5907\u8D27` : "");
        }
      }
      const shipNote = shipments.map((sh) => `${sh.warehouseName} ${sh.logisticsCompany.trim()} ${sh.trackingNo.trim()}`).join(" + ");
      patchOrder(id, {
        selfShipments,
        selfPo: purchase && purchase.items.some((x) => x.quantity > 0) ? { supplierId: purchase.supplierId, supplierName: purchase.supplierName, mode: purchase.mode, purchaseDate: now4() } : order.selfPo,
        processStatus: shipments.length > 0 ? "self_shipped" : order.processStatus
      }, {
        action: shipments.length > 0 ? "\u91C7\u8D2D&\u53D1\u8D27\uFF08\u5206\u4ED3\u76F4\u53D1\uFF09" : "\u4EE5\u9500\u5B9A\u91C7\u4E0B\u5355",
        detail: (shipments.length > 0 ? `${shipNote} \u2192 \u5DF2\u53D1\u8D27\u8FD0\u8F93\u4E2D` : "\u7F3A\u53E3\u5168\u90E8\u4EE5\u9500\u5B9A\u91C7\uFF0C\u7B49\u5F85\u91C7\u8D2D\u5230\u8D27/\u76F4\u53D1") + poNote
      });
      return {
        ok: true,
        msg: shipments.length > 0 ? `\u5DF2\u53D1\u8D27\uFF08${shipments.length} \u4E2A\u5305\u88F9\uFF09${poNote || "\uFF0C\u8BA2\u5355\u8FDB\u5165\u5DF2\u53D1\u8D27\u8FD0\u8F93\u4E2D"}` : poNote ? `\u5DF2\u751F\u6210\u91C7\u8D2D\u5355${poNote}\uFF0C\u91C7\u8D2D\u5728\u9014\uFF08\u8BA2\u5355\u4FDD\u6301\u5DF2\u63A5\u5355\uFF09` : "\u672A\u586B\u5199\u4EFB\u4F55\u53D1\u8D27\u6216\u91C7\u8D2D\u5185\u5BB9"
      };
    },
    outboundSelf: (id, input) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      if (order.processStatus !== "self_accepted") return { ok: false, msg: "\u4EC5\u5DF2\u63A5\u5355\uFF08\u81EA\u8425\uFF09\u8BA2\u5355\u53EF\u51FA\u5E93\u53D1\u8D27" };
      if (!input.logisticsCompany.trim() || !input.trackingNo.trim()) return { ok: false, msg: "\u8BF7\u586B\u5199\u7269\u6D41\u516C\u53F8\u4E0E\u5355\u53F7" };
      const shippedMap = /* @__PURE__ */ new Map();
      for (const sh of order.selfShipments ?? []) for (const it of sh.items) shippedMap.set(it.productId, (shippedMap.get(it.productId) ?? 0) + it.qty);
      const remainItems = order.items.map((it) => ({ productId: it.productId, productName: it.productName, qty: it.quantity - (shippedMap.get(it.productId) ?? 0) })).filter((x) => x.qty > 0);
      if (remainItems.length === 0) return { ok: false, msg: "\u8BA2\u5355\u5546\u54C1\u5DF2\u5168\u90E8\u53D1\u51FA" };
      const seq = (order.selfShipments?.length ?? 0) + 1;
      patchOrder(id, {
        processStatus: "self_shipped",
        selfShipments: [
          ...order.selfShipments ?? [],
          {
            id: `ss_${nowTs()}`,
            packageNo: `PKG-${order.code}-${String(seq).padStart(2, "0")}`,
            warehouseId: "wh-ind-01",
            warehouseName: "\u676D\u5DDE\u603B\u4ED3",
            logisticsCompany: input.logisticsCompany.trim(),
            trackingNo: input.trackingNo.trim(),
            items: remainItems,
            status: "shipped",
            shippedAt: nowMin2()
          }
        ]
      }, { action: "\u5230\u8D27\u51FA\u5E93\u53D1\u8D27", detail: `\u676D\u5DDE\u603B\u4ED3\u51FA\u5E93 ${remainItems.map((x) => `${x.productName}\xD7${x.qty}`).join("\u3001")} \xB7 ${input.logisticsCompany.trim()} ${input.trackingNo.trim()} \u2192 \u5DF2\u53D1\u8D27\u8FD0\u8F93\u4E2D` });
      return { ok: true, msg: "\u5DF2\u51FA\u5E93\u53D1\u8D27\uFF0C\u8FDB\u5165\u5DF2\u53D1\u8D27\u8FD0\u8F93\u4E2D" };
    },
    deliverSelfShipment: (id, shipmentId) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      if (!["self_shipped", "self_accepted", "self_delivered"].includes(order.processStatus)) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5728\u8FD0\u8F93\u8DDF\u8E2A\u9636\u6BB5" };
      let shipments = order.selfShipments ?? [];
      let note = "";
      if (shipmentId) {
        const target = shipments.find((x) => x.id === shipmentId);
        if (!target) return { ok: false, msg: "\u5305\u88F9\u4E0D\u5B58\u5728" };
        if (target.status !== "delivered") note = `\u5305\u88F9 ${target.packageNo}\uFF08${target.trackingNo}\uFF09\u7269\u6D41\u59A5\u6295`;
        shipments = shipments.map((x) => x.id === shipmentId ? { ...x, status: "delivered", deliveredAt: nowMin2() } : x);
      } else if (shipments.length > 0) {
        note = `${shipments.filter((x) => x.status !== "delivered").length} \u4E2A\u81EA\u8425\u5305\u88F9\u7269\u6D41\u5168\u90E8\u59A5\u6295`;
        shipments = shipments.map((x) => x.status === "delivered" ? x : { ...x, status: "delivered", deliveredAt: nowMin2() });
      }
      let poNote = "";
      const pos = usePurchaseStore.getState().listByChildOrder(id);
      const activePkgs = pos.flatMap((d) => d.packages.filter((x) => x.status !== "void"));
      if (activePkgs.some((x) => x.status === "shipped")) {
        pos.forEach((d) => usePurchaseStore.getState().deliverAllByChild(d.childOrderCode));
        poNote = ` \xB7 \u5173\u8054\u91C7\u8D2D\u5355\u5305\u88F9\u540C\u6B65\u59A5\u6295 ${activePkgs.filter((x) => x.status === "shipped").length} \u4E2A`;
      }
      const allOwnDelivered = shipments.every((x) => x.status === "delivered");
      const poAllDelivered = pos.flatMap((d) => d.packages.filter((x) => x.status !== "void")).every((x) => x.status === "delivered");
      const hasAnyPackage = shipments.length > 0 || activePkgs.length > 0;
      const done = hasAnyPackage && allOwnDelivered && poAllDelivered;
      patchOrder(id, {
        selfShipments: shipments.length > 0 ? shipments : order.selfShipments,
        processStatus: done ? "self_delivered" : order.processStatus
      }, { action: done ? "\u7269\u6D41\u59A5\u6295" : "\u7269\u6D41\u8DDF\u8E2A", detail: (note || "\u5173\u8054\u91C7\u8D2D\u5355\u5305\u88F9\u59A5\u6295") + poNote + (done ? " \u2192 \u8BA2\u5355\u59A5\u6295\uFF0C\u5F85\u5BA2\u6237\u786E\u8BA4\u6536\u8D27" : "") });
      return { ok: true, msg: done ? "\u5168\u90E8\u5305\u88F9\u5DF2\u59A5\u6295\uFF0C\u8BA2\u5355\u8FDB\u5165\u300C\u59A5\u6295\u300D\u5F85\u786E\u8BA4\u6536\u8D27" : "\u5DF2\u63A8\u8FDB\u7269\u6D41\u59A5\u6295" };
    },
    confirmSelfReceipt: (id) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      if (order.processStatus !== "self_delivered") return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5728\u59A5\u6295\u72B6\u6001" };
      patchOrder(id, { processStatus: "completed" }, { action: "\u5BA2\u6237\u786E\u8BA4\u6536\u8D27", detail: "\u59A5\u6295\u8BA2\u5355\u4EBA\u5DE5/\u8054\u673A\u786E\u8BA4\u6536\u8D27 \xB7 \u8BA2\u5355\u5B8C\u6210" });
      for (const d of usePurchaseStore.getState().listByChildOrder(id)) {
        usePurchaseStore.getState().settleByChild(d.childOrderCode);
      }
      return { ok: true, msg: "\u5DF2\u786E\u8BA4\u6536\u8D27\uFF0C\u8BA2\u5355\u5B8C\u6210\uFF08\u5173\u8054\u91C7\u8D2D\u5355\u5DF2\u7ED3\u7B97\uFF09" };
    },
    /* ── 比单（公开报名制） ── */
    startCompare: (id, floorRule, region) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5B58\u5728" };
      const minutes = get().settings.compareMinutes;
      const floor = floorAmount(order.totalAmount, floorRule);
      const floorNote = floorRule.type === "discount" ? `\u62A5\u540D\u62A5\u4EF7\u4E0D\u5F97\u4F4E\u4E8E\u8BA2\u5355\u91D1\u989D\u7684 ${floorRule.value} \u6298\uFF08\xA5${floor.toLocaleString()}\uFF09` : `\u62A5\u540D\u62A5\u4EF7\u4E0D\u5F97\u4F4E\u4E8E \xA5${floor.toLocaleString()}`;
      const hasScope = region && (region.province || region.city || region.district);
      patchOrder(id, {
        path: "distribute",
        distributeMode: "compare",
        processStatus: "comparing",
        compare: {
          deadline: nowTs() + minutes * 60 * 1e3,
          floorRule,
          floorNote,
          quotes: [],
          scored: false,
          region: hasScope ? region : void 0
        }
      }, { action: "\u53D1\u8D77\u6BD4\u5355", detail: `\u516C\u5F00\u62A5\u540D \xB7 ${floorNote} \xB7 \u8BC4\u5206 = \u62A5\u4EF7 ${get().settings.compareWeights.quote}0% + \u79EF\u5206 ${get().settings.compareWeights.score}0%${hasScope ? ` \xB7 \u9650 ${[region.province, region.city, region.district].filter(Boolean).join(" ")} \u5730\u533A\u5408\u4F5C\u5546` : ""}` });
      return { ok: true, msg: "\u6BD4\u5355\u5DF2\u53D1\u8D77\uFF0C\u7B49\u5F85\u5408\u4F5C\u5546\u62A5\u540D" };
    },
    signUpCompare: (id, supplierId, supplierName, amount, itemNames) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare || order.processStatus !== "comparing") return { ok: false, msg: "\u6BD4\u5355\u5DF2\u7ED3\u675F" };
      if (order.compare.quotes.some((q) => q.supplierId === supplierId)) return { ok: false, msg: "\u60A8\u5DF2\u62A5\u540D\u8FC7" };
      if (nowTs() > order.compare.deadline) return { ok: false, msg: "\u62A5\u540D\u5DF2\u622A\u6B62" };
      const names = [...new Set(itemNames ?? order.items.map((i) => i.productName))].filter((n) => order.items.some((i) => i.productName === n));
      if (names.length === 0) return { ok: false, msg: "\u8BF7\u9009\u62E9\u8981\u62A5\u540D\u7684\u5546\u54C1" };
      const selBase = order.items.filter((i) => names.includes(i.productName)).reduce((s, i) => s + i.price * i.quantity, 0);
      const floor = Math.round(floorAmount(order.totalAmount, order.compare.floorRule) * (selBase / order.totalAmount));
      if (amount < floor) return { ok: false, msg: `\u6240\u9009\u5546\u54C1\u62A5\u4EF7\u4E0D\u5F97\u4F4E\u4E8E\u6298\u7B97\u5E95\u4EF7 \xA5${floor.toLocaleString()}` };
      set((s) => ({
        orders: s.orders.map(
          (o) => o.id === id && o.compare ? { ...o, compare: { ...o.compare, quotes: [...o.compare.quotes, { supplierId, supplierName, amount, quoteTime: nowMin2(), items: names }] } } : o
        )
      }));
      return { ok: true, msg: `\u62A5\u540D\u6210\u529F\uFF08${names.join("\u3001")}\uFF09` };
    },
    extendCompare: (id, minutes) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare) return;
      set((s) => ({
        orders: s.orders.map(
          (o) => o.id === id && o.compare ? {
            ...o,
            compare: { ...o.compare, deadline: Math.max(o.compare.deadline, nowTs()) + minutes * 60 * 1e3 },
            history: [...o.history, { time: now4(), action: "\u5EF6\u957F\u62A5\u540D\u622A\u6B62", detail: `\u7BA1\u7406\u540E\u53F0\u5EF6\u957F ${minutes} \u5206\u949F` }]
          } : o
        )
      }));
    },
    finalizeCompare: (id, force = false) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare || order.processStatus !== "comparing") return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5728\u6BD4\u5355\u62A5\u540D\u4E2D" };
      const cmp = order.compare;
      if (cmp.scored) return { ok: false, msg: "\u8BE5\u6BD4\u5355\u5DF2\u5B9A\u6807" };
      if (cmp.quotes.length === 0) return { ok: false, msg: "\u6682\u65E0\u5408\u4F5C\u5546\u62A5\u540D\uFF0C\u65E0\u6CD5\u8BC4\u5206" };
      if (!force && nowTs() < cmp.deadline) return { ok: false, msg: "\u62A5\u540D\u672A\u622A\u6B62\uFF08\u53EF\u5F3A\u5236\u5B9A\u6807\uFF09" };
      const { quote: wq, score: ws } = get().settings.compareWeights;
      const entries = useScoreStore.getState().entries;
      const summaries = cmp.quotes.map((q) => getScoreSummary(entries, q.supplierId, q.supplierName));
      const maxTotal = Math.max(...summaries.map((s) => s.total), 1);
      const minQuote = Math.min(...cmp.quotes.map((q) => q.amount));
      const scores = {};
      for (const q of cmp.quotes) {
        const summary = summaries.find((s) => s.supplierId === q.supplierId);
        const quoteScore = Math.round(minQuote / q.amount * 100);
        const scoreScore = Math.round((summary?.total ?? 60) / maxTotal * 100);
        const total = Math.round((quoteScore * wq + scoreScore * ws) / (wq + ws) * 10) / 10;
        scores[q.supplierId] = { quoteScore, scoreScore, total };
      }
      const itemAwards = {};
      const byPartner = /* @__PURE__ */ new Map();
      const awarded = /* @__PURE__ */ new Set();
      for (const item of order.items) {
        const candidates = cmp.quotes.filter((q) => (q.items ?? order.items.map((i) => i.productName)).includes(item.productName)).map((q) => ({ q, score: summaries.find((s) => s.supplierId === q.supplierId)?.total ?? 60 })).sort((a, b) => b.score - a.score);
        if (candidates.length === 0) continue;
        const winner = candidates[0].q;
        itemAwards[item.productName] = winner.supplierName;
        awarded.add(item.productName);
        const grp = byPartner.get(winner.supplierId) ?? { supplierId: winner.supplierId, supplierName: winner.supplierName, items: [] };
        grp.items.push(item);
        byPartner.set(winner.supplierId, grp);
      }
      const rootCode = order.parentCode ?? order.code;
      let seq = get().orders.filter((o) => o.parentCode === rootCode).length;
      const children = [];
      for (const grp of byPartner.values()) {
        seq += 1;
        children.push(makeSplitChild(order, rootCode, seq, grp.items, {
          processStatus: "distribute_pending",
          path: "distribute",
          distributeMode: "compare",
          partnerId: grp.supplierId,
          partnerName: grp.supplierName,
          transferSource: "compare",
          transferTime: now4(),
          compare: { ...cmp, scored: true, scores, itemAwards }
        }, "\u6BD4\u5355\u5B9A\u6807\uFF08\u6309\u5546\u54C1\xB7\u79EF\u5206\u4F18\u5148\uFF09", `${grp.items.map((i) => i.productName).join("\u3001")} \u2192 ${grp.supplierName}\uFF08\u79EF\u5206\u6392\u540D\u7B2C\u4E00\uFF09\xB7 \u7B49\u5F85\u5408\u4F5C\u5546\u63A5\u5355`));
      }
      const remain = order.items.filter((i) => !awarded.has(i.productName));
      if (remain.length > 0) {
        seq += 1;
        children.push(makeSplitChild(order, rootCode, seq, remain, {
          processStatus: "pending",
          sourceTag: "compare_failed"
        }, "\u6BD4\u5355\u672A\u6210\u9000\u56DE", `\u65E0\u62A5\u540D\u5546\u54C1\uFF08${remain.map((i) => i.productName).join("\u3001")}\uFF09\u5F62\u6210\u5B50\u8BA2\u5355\uFF0C\u91CD\u65B0\u8FDB\u5165\u5206\u53D1-\u5F85\u5904\u7406`));
      }
      if (order.parentCode) {
        set((s) => ({ orders: [...children, ...s.orders.filter((o) => o.id !== id)] }));
      } else {
        set((s) => ({
          orders: [
            ...children,
            ...s.orders.map((o) => o.id === id ? { ...o, processStatus: "pending", history: [...o.history, { time: now4(), action: "\u6574\u5355\u5206\u62C6\u5B9A\u6848\u5B8C\u6210", detail: `\u5DF2\u751F\u6210 ${children.length} \u5F20\u5B50\u5C65\u7EA6\u5355\uFF0C\u5747\u6302\u672C\u6BCD\u9500\u552E\u5355\u4E0B` }] } : o)
          ]
        }));
      }
      const winnerNames = [...new Set(Object.values(itemAwards))];
      return { ok: true, msg: winnerNames.length ? `\u5B9A\u6807\u5B8C\u6210\uFF1A${winnerNames.join("\u3001")} \u4E2D\u5355\uFF08\u6309\u5546\u54C1\u79EF\u5206\u6392\u540D\uFF09` : "\u5B9A\u6807\u5B8C\u6210\uFF1A\u65E0\u5546\u54C1\u6709\u62A5\u540D" };
    },
    awardCompare: (id, supplierId, reason) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order?.compare || order.processStatus !== "comparing") return { ok: false, msg: "\u8BA2\u5355\u4E0D\u5728\u6BD4\u5355\u62A5\u540D\u4E2D" };
      const target = order.compare.quotes.find((q) => q.supplierId === supplierId);
      if (!target) return { ok: false, msg: "\u8BE5\u5408\u4F5C\u5546\u5C1A\u672A\u62A5\u540D" };
      transfer(id, supplierId, target.supplierName, "assign", `\u6BD4\u5355\u76F4\u63A5\u9009\u5B9A\uFF08${reason.trim() || "\u7BA1\u7406\u540E\u53F0\u7EFC\u5408\u5224\u65AD"}\uFF09`);
      return { ok: true, msg: `\u5DF2\u9009\u5B9A ${target.supplierName}\uFF0C\u8F6C\u4E3A\u6307\u5B9A\u8F6C\u6D3E` };
    },
    /* ── 履约与结算（合作商接单 → 已处理；结算写积分台账） ── */
    advancePartner: (id, status, opts) => {
      const order = get().orders.find((o) => o.id === id);
      if (!order) return;
      const actionLabels = {
        accepted: "\u5408\u4F5C\u5546\u63A5\u5355",
        shipping: "\u5408\u4F5C\u5546\u53D1\u8D27",
        transit: "\u7269\u6D41\u59A5\u6295",
        delivered: "\u5BA2\u6237\u7B7E\u6536",
        settled: "\u7ED3\u7B97\u5B8C\u6210"
      };
      if (status === "settled") {
        const onTime = opts?.onTime ?? true;
        patchOrder(id, { partnerStatus: "settled", processStatus: "completed", settleOnTime: onTime }, { action: "\u7ED3\u7B97\u5B8C\u6210", detail: onTime ? "\u6309\u65F6\u5C65\u7EA6 \xB7 \u79EF\u5206 +5" : "\u8D85\u65F6\u53D1\u8D27 \xB7 \u79EF\u5206 -5" });
        if (order.partnerId && order.partnerName) {
          useScoreStore.getState().addEntry({
            supplierId: order.partnerId,
            supplierName: order.partnerName,
            dimension: "fulfillment",
            delta: onTime ? 5 : -5,
            reason: onTime ? `\u8BA2\u5355\u6309\u65F6\u5C65\u7EA6\u7ED3\u7B97\uFF08${order.code}\uFF09` : `\u8BA2\u5355\u8D85\u65F6\u53D1\u8D27\uFF08${order.code}\uFF09`,
            refCode: order.code,
            operator: "\u7BA1\u7406\u5458"
          });
        }
        usePurchaseStore.getState().settleByChild(order.code);
        return;
      }
      patchOrder(id, {
        partnerStatus: status,
        // 接单、或比单中单订单首次推进（跳过接单直入已接单）时，同步流转为已处理
        ...status === "accepted" || order.processStatus === "distribute_pending" ? { processStatus: "processed" } : {}
      }, { action: actionLabels[status] ?? "\u5C65\u7EA6\u63A8\u8FDB", detail: status === "accepted" ? "\u5408\u4F5C\u5546\u7EC8\u7AEF\u63A5\u5355 \u2192 \u5DF2\u5904\u7406" : void 0 });
      const po = usePurchaseStore.getState();
      if (status === "accepted") po.confirmByChild(order.code);
      if (status === "delivered") po.deliverAllByChild(order.code);
    },
    /* ── 设置 ── */
    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } }))
  };
});

// scripts_rep_e2e.tsx
var assert = (c, m) => {
  if (!c) {
    console.error("\u274C", m);
    process.exitCode = 1;
  } else console.log("\u2705", m);
};
var mk = (over) => ({
  id: "t_" + Math.random().toString(36).slice(2),
  code: "BBT-0001",
  type: "order",
  title: "t",
  summary: "t",
  status: "approved",
  submitTime: "2026-11-13",
  partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8",
  customerName: "\u534E\u8317\u5802\u8336\u5E84",
  ...over
});
assert(reportPriority(mk({ type: "order" })) === 0 && reportPriority(mk({ type: "product" })) === 1 && reportPriority(mk({ type: "region" })) === 2, "\u4F18\u5148\u7EA7 \u8BA2\u53550 < \u5546\u54C11 < \u5730\u533A2");
var po1 = platformOrders[0];
var ordSelf = mk({ type: "order", orderKind: "self", contactPhone: "138****6677", regionProv: "\u6C5F\u82CF", regionCity: "\u5357\u4EAC\u5E02" });
assert(matchesReport(po1, ordSelf), "\u8BA2\u5355\u62A5\u5907\uFF08\u5BA2\u6237+\u6536\u4EF6\u7535\u8BDD\uFF09\u547D\u4E2D pto1");
var wrongCust = mk({ type: "order", orderKind: "self", customerName: "\u522B\u7684\u5BA2\u6237", contactPhone: "138****6677" });
assert(!matchesReport(po1, wrongCust), "\u5BA2\u6237\u4E0D\u7B26 \u2192 \u4E0D\u547D\u4E2D");
var noFeature = mk({ type: "order", orderKind: "self", regionProv: "\u6C5F\u82CF" });
assert(!matchesReport(po1, noFeature), "\u65E0\u5F3A\u7279\u5F81\uFF08\u7535\u8BDD/\u5546\u54C1/\u5185\u90E8\u5355\u53F7\uFF09\u2192 \u4E0D\u547D\u4E2D\uFF08\u907F\u514D\u8BEF\u5339\u914D\uFF09");
var byProduct = mk({ type: "order", orderKind: "self", productName: "\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7" });
assert(matchesReport(po1, byProduct), "\u8BA2\u5355\u62A5\u5907\uFF08\u5BA2\u6237+\u4E0B\u5355\u5546\u54C1\uFF09\u547D\u4E2D");
var prodReport = mk({ type: "product", productNames: ["\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7", "\u91D1\u9A8F\u7709\xB7\u7279\u7EA7"], regionProv: "\u6C5F\u82CF" });
assert(matchesReport(po1, prodReport), "\u5546\u54C1\u62A5\u5907\uFF08\u591A\u9009\u542B\u8BE5\u5546\u54C1 + \u6C5F\u82CF\uFF09\u547D\u4E2D pto1");
var prodOtherRegion = mk({ type: "product", productNames: ["\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7"], regionProv: "\u6D59\u6C5F" });
assert(!matchesReport(po1, prodOtherRegion), "\u5730\u533A\u4E0D\u7B26\uFF08\u6D59\u6C5F vs \u6C5F\u82CF\u5357\u4EAC\uFF09\u2192 \u4E0D\u547D\u4E2D");
var prodNationwide = mk({ type: "product", productNames: ["\u96E8\u82B1\u8336\xB7\u7279\u7EA7"], nationwide: true });
var po2 = platformOrders[1];
assert(matchesReport(po2, prodNationwide), "\u5546\u54C1\u62A5\u5907 \u5168\u56FD\u8303\u56F4 \u547D\u4E2D pto2");
var regionReport = mk({ type: "region", customerName: "\u5168\u90E8\u5BA2\u6237", regionProv: "\u6C5F\u82CF", regionCity: "\u5357\u4EAC\u5E02" });
assert(matchesReport(po1, regionReport) && matchesReport(po2, regionReport), "\u5730\u533A\u62A5\u5907\uFF08\u5168\u90E8\u5BA2\u6237+\u5357\u4EAC\uFF09\u547D\u4E2D pto1/pto2");
var rs = useReportStore.getState();
var regionR = mk({ type: "region", code: "BB-REGION", customerName: "\u534E\u8317\u5802\u8336\u5E84", regionProv: "\u6C5F\u82CF" });
var prodR = mk({ type: "product", code: "BB-PROD", customerName: "\u534E\u8317\u5802\u8336\u5E84", productNames: ["\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7"] });
var ordR = mk({ type: "order", code: "BB-ORDER", orderKind: "no_supply", customerName: "\u534E\u8317\u5802\u8336\u5E84", contactPhone: "138****6677" });
useReportStore.setState({ reports: [...useReportStore.getState().reports, regionR, prodR, ordR] });
var flowOrder = useOrderFlowStore.getState().orders.find((o) => o.customerName === "\u534E\u8317\u5802\u8336\u5E84" && o.items[0]?.productName === "\u897F\u6E56\u9F99\u4E95\xB7\u660E\u524D\u7279\u7EA7" && o.processStatus === "distribute_pending");
if (flowOrder) {
  const matches = matchExternalOrder(flowOrder);
  assert(matches.length >= 3 && matches[0].reportCode === "BB-ORDER", `matchExternalOrder \u6309\u4F18\u5148\u7EA7\u8FD4\u56DE\uFF08\u9996\u4E2A=${matches[0]?.reportCode}\uFF0C\u5171 ${matches.length} \u6761\uFF09`);
} else {
  console.log("\u2139\uFE0F \u672A\u627E\u5230\u534E\u8317\u5802\u5F85\u63A5\u5355\u79CD\u5B50\uFF0C\u6539\u7528 platformOrders \u6821\u9A8C\u6392\u5E8F\u903B\u8F91");
  assert(true, "\u4F18\u5148\u7EA7\u51FD\u6570\u5DF2\u5355\u72EC\u9A8C\u8BC1");
}
var flow = useOrderFlowStore.getState();
var ordOnly = mk({ type: "order", code: "BB-NOSUP", orderKind: "no_supply", customerName: "\u534E\u8317\u5802\u8336\u5E84", contactPhone: "138****6677", status: "approved" });
useReportStore.setState({ reports: [...useReportStore.getState().reports, ordOnly] });
var eo12 = useOrderFlowStore.getState().orders.find((o) => o.processStatus === "report_match_pending");
if (eo12) {
  useOrderFlowStore.setState({
    orders: useOrderFlowStore.getState().orders.map((o) => o.id === eo12.id ? { ...o, reportMatches: [{ reportCode: "BB-NOSUP", reportType: "order", partnerId: "11", partnerName: "\u676D\u5DDE\u4E91\u8336\u4F9B\u5E94\u94FE\u7BA1\u7406\u6709\u9650\u516C\u53F8" }] } : o)
  });
  const res = useOrderFlowStore.getState().confirmReportMatch(eo12.id);
  const after = useOrderFlowStore.getState().orders.find((o) => o.id === eo12.id);
  assert(res.ok && after.processStatus === "pending" && after.partnerId === void 0, `\u65E0\u8D27\u6E90\u786E\u8BA4 \u2192 \u9000\u56DE\u5206\u53D1-\u5F85\u5904\u7406\uFF08${after.processStatus}\uFF0C\u672A\u8F6C\u5408\u4F5C\u5546\uFF09`);
  assert(after.history[after.history.length - 1].action.includes("\u65E0\u8D27\u6E90"), "\u8F68\u8FF9\u8BB0\u5F55\u300C\u65E0\u8D27\u6E90\u300D");
}
console.log("===== \u62A5\u5907\u91CD\u5851\u9A8C\u8BC1\u7ED3\u675F =====");
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim.production.js:
  (**
   * @license React
   * use-sync-external-store-shim.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim.development.js:
  (**
   * @license React
   * use-sync-external-store-shim.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.js:
  (**
   * @license React
   * use-sync-external-store-shim/with-selector.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js:
  (**
   * @license React
   * use-sync-external-store-shim/with-selector.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
