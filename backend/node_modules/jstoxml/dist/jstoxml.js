(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.jstoxml = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.toXML = _exports.default = void 0;

  function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

  function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

  function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

  function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

  function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

  function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

  function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

  var ARRAY = "array";
  var BOOLEAN = "boolean";
  var DATE = "date";
  var NULL = "null";
  var NUMBER = "number";
  var OBJECT = "object";
  var SPECIAL_OBJECT = "special-object";
  var STRING = "string";
  var PRIVATE_VARS = ["_selfCloseTag", "_attrs"];
  var PRIVATE_VARS_REGEXP = new RegExp(PRIVATE_VARS.join("|"), "g");
  /**
   * Determines the indent string based on current tree depth.
   */

  var getIndentStr = function getIndentStr() {
    var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    return indent.repeat(depth);
  };
  /**
   * Sugar function supplementing JS's quirky typeof operator, plus some extra help to detect
   * "special objects" expected by jstoxml.
   * Example:
   * getType(new Date());
   * -> 'date'
   */


  var getType = function getType(val) {
    return Array.isArray(val) && ARRAY || _typeof(val) === OBJECT && val !== null && val._name && SPECIAL_OBJECT || val instanceof Date && DATE || val === null && NULL || _typeof(val);
  };
  /**
   * Replaces matching values in a string with a new value.
   * Example:
   * filterStr('foo&bar', { '&': '&amp;' });
   * -> 'foo&amp;bar'
   */


  var filterStr = function filterStr() {
    var inputStr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    var filter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    // Passthrough/no-op for nonstrings (e.g. number, boolean).
    if (typeof inputStr !== "string") {
      return inputStr;
    }

    var regexp = new RegExp("(".concat(Object.keys(filter).join("|"), ")(?!(\\w|#)*;)"), "g");
    return String(inputStr).replace(regexp, function (str, entity) {
      return filter[entity] || "";
    });
  };
  /**
   * Maps an object or array of arribute keyval pairs to a string.
   * Examples:
   * { foo: 'bar', baz: 'g' } -> 'foo="bar" baz="g"'
   * [ { ⚡: true }, { foo: 'bar' } ] -> '⚡ foo="bar"'
   */


  var getAttributeKeyVals = function getAttributeKeyVals() {
    var attributes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var filter = arguments.length > 1 ? arguments[1] : undefined;
    var keyVals = [];

    if (Array.isArray(attributes)) {
      // Array containing complex objects and potentially duplicate attributes.
      keyVals = attributes.map(function (attr) {
        var key = Object.keys(attr)[0];
        var val = attr[key];
        var filteredVal = filter ? filterStr(val, filter) : val;
        var valStr = filteredVal === true ? "" : "=\"".concat(filteredVal, "\"");
        return "".concat(key).concat(valStr);
      });
    } else {
      var keys = Object.keys(attributes);
      keyVals = keys.map(function (key) {
        // Simple object - keyval pairs.
        // For boolean true, simply output the key.
        var filteredVal = filter ? filterStr(attributes[key], filter) : attributes[key];
        var valStr = attributes[key] === true ? "" : "=\"".concat(filteredVal, "\"");
        return "".concat(key).concat(valStr);
      });
    }

    return keyVals;
  };
  /**
   * Converts an attributes object/array to a string of keyval pairs.
   * Example:
   * formatAttributes({ a: 1, b: 2 })
   * -> 'a="1" b="2"'
   */


  var formatAttributes = function formatAttributes() {
    var attributes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var filter = arguments.length > 1 ? arguments[1] : undefined;
    var keyVals = getAttributeKeyVals(attributes, filter);
    if (keyVals.length === 0) return "";
    var keysValsJoined = keyVals.join(" ");
    return " ".concat(keysValsJoined);
  };
  /**
   * Converts an object to a jstoxml array.
   * Example:
   * objToArray({ foo: 'bar', baz: 2 });
   * ->
   * [
   *   {
   *     _name: 'foo',
   *     _content: 'bar'
   *   },
   *   {
   *     _name: 'baz',
   *     _content: 2
   *   }
   * ]
   */


  var objToArray = function objToArray() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return Object.keys(obj).map(function (key) {
      return {
        _name: key,
        _content: obj[key]
      };
    });
  };
  /**
   * Determines if a value is a primitive JavaScript value (not including Symbol).
   * Example:
   * isPrimitive(4);
   * -> true
   */


  var PRIMITIVE_TYPES = [STRING, NUMBER, BOOLEAN];

  var isPrimitive = function isPrimitive(val) {
    return PRIMITIVE_TYPES.includes(getType(val));
  };
  /**
   * Determines if a value is a simple primitive type that can fit onto one line.  Needed for
   * determining any needed indenting and line breaks.
   * Example:
   * isSimpleType(new Date());
   * -> true
   */


  var SIMPLE_TYPES = [].concat(PRIMITIVE_TYPES, [DATE, SPECIAL_OBJECT]);

  var isSimpleType = function isSimpleType(val) {
    return SIMPLE_TYPES.includes(getType(val));
  };
  /**
   * Determines if an XML string is a simple primitive, or contains nested data.
   * Example:
   * isSimpleXML('<foo />');
   * -> false
   */


  var isSimpleXML = function isSimpleXML(xmlStr) {
    return !xmlStr.match("<");
  };
  /**
   * Assembles an XML header as defined by the config.
   */


  var DEFAULT_XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

  var getHeaderString = function getHeaderString(_ref) {
    var header = _ref.header,
        indent = _ref.indent,
        isOutputStart = _ref.isOutputStart;
    var shouldOutputHeader = header && isOutputStart;
    if (!shouldOutputHeader) return "";
    var shouldUseDefaultHeader = _typeof(header) === BOOLEAN; // return `${shouldUseDefaultHeader ? DEFAULT_XML_HEADER : header}${indent ? "\n" : ""
    //   }`;

    return shouldUseDefaultHeader ? DEFAULT_XML_HEADER : header;
  };
  /**
   * Recursively traverses an object tree and converts the output to an XML string.
   * Example:
   * toXML({ foo: 'bar' });
   * -> <foo>bar</foo>
   */


  var defaultEntityFilter = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;"
  };

  var toXML = function toXML() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _config$depth = config.depth,
        depth = _config$depth === void 0 ? 0 : _config$depth,
        indent = config.indent,
        _isFirstItem = config._isFirstItem,
        _config$_isOutputStar = config._isOutputStart,
        _isOutputStart = _config$_isOutputStar === void 0 ? true : _config$_isOutputStar,
        header = config.header,
        _config$attributesFil = config.attributesFilter,
        rawAttributesFilter = _config$attributesFil === void 0 ? {} : _config$attributesFil,
        _config$filter = config.filter,
        rawFilter = _config$filter === void 0 ? {} : _config$filter;

    var shouldTurnOffAttributesFilter = typeof rawAttributesFilter === 'boolean' && !rawAttributesFilter;
    var attributesFilter = shouldTurnOffAttributesFilter ? {} : _objectSpread(_objectSpread(_objectSpread({}, defaultEntityFilter), {
      '"': "&quot;"
    }), rawAttributesFilter);
    var shouldTurnOffFilter = typeof rawFilter === 'boolean' && !rawFilter;
    var filter = shouldTurnOffFilter ? {} : _objectSpread(_objectSpread({}, defaultEntityFilter), rawFilter); // Determine indent string based on depth.

    var indentStr = getIndentStr(indent, depth); // For branching based on value type.

    var valType = getType(obj);
    var headerStr = getHeaderString({
      header: header,
      indent: indent,
      depth: depth,
      isOutputStart: _isOutputStart
    });
    var isOutputStart = _isOutputStart && !headerStr && _isFirstItem && depth === 0;
    var outputStr = "";

    switch (valType) {
      case "special-object":
        {
          // Processes a specially-formatted object used by jstoxml.
          var _name = obj._name,
              _content = obj._content; // Output text content without a tag wrapper.

          if (_content === null) {
            outputStr = _name;
            break;
          } // Handles arrays of primitive values. (#33)


          var isArrayOfPrimitives = Array.isArray(_content) && _content.every(isPrimitive);

          if (isArrayOfPrimitives) {
            var primitives = _content.map(function (a) {
              return toXML({
                _name: _name,
                _content: a
              }, _objectSpread(_objectSpread({}, config), {}, {
                depth: depth,
                _isOutputStart: false
              }));
            });

            return primitives.join('');
          } // Don't output private vars (such as _attrs).


          if (_name.match(PRIVATE_VARS_REGEXP)) break; // Process the nested new value and create new config.

          var newVal = toXML(_content, _objectSpread(_objectSpread({}, config), {}, {
            depth: depth + 1,
            _isOutputStart: isOutputStart
          }));
          var newValType = getType(newVal);
          var isNewValSimple = isSimpleXML(newVal); // Pre-tag output (indent and line breaks).

          var preIndentStr = indent && !isOutputStart ? "\n" : "";
          var preTag = "".concat(preIndentStr).concat(indentStr); // Special handling for comments, preserving preceding line breaks/indents.

          if (_name === '_comment') {
            outputStr += "".concat(preTag, "<!-- ").concat(_content, " -->");
            break;
          } // Tag output.


          var valIsEmpty = newValType === "undefined" || newVal === "";
          var shouldSelfClose = _typeof(obj._selfCloseTag) === BOOLEAN ? valIsEmpty && obj._selfCloseTag : valIsEmpty;
          var selfCloseStr = shouldSelfClose ? "/" : "";
          var attributesString = formatAttributes(obj._attrs, attributesFilter);
          var tag = "<".concat(_name).concat(attributesString).concat(selfCloseStr, ">"); // Post-tag output (closing tag, indent, line breaks).

          var preTagCloseStr = indent && !isNewValSimple ? "\n".concat(indentStr) : "";
          var postTag = !shouldSelfClose ? "".concat(newVal).concat(preTagCloseStr, "</").concat(_name, ">") : "";
          outputStr += "".concat(preTag).concat(tag).concat(postTag);
          break;
        }

      case "object":
        {
          // Iterates over keyval pairs in an object, converting each item to a special-object.
          var keys = Object.keys(obj);
          var outputArr = keys.map(function (key, index) {
            var newConfig = _objectSpread(_objectSpread({}, config), {}, {
              _isFirstItem: index === 0,
              _isLastItem: index + 1 === keys.length,
              _isOutputStart: isOutputStart
            });

            var outputObj = {
              _name: key
            };

            if (getType(obj[key]) === "object") {
              // Sub-object contains an object.
              // Move private vars up as needed.  Needed to support certain types of objects
              // E.g. { foo: { _attrs: { a: 1 } } } -> <foo a="1"/>
              PRIVATE_VARS.forEach(function (privateVar) {
                var val = obj[key][privateVar];

                if (typeof val !== "undefined") {
                  outputObj[privateVar] = val;
                  delete obj[key][privateVar];
                }
              });
              var hasContent = typeof obj[key]._content !== "undefined";

              if (hasContent) {
                // _content has sibling keys, so pass as an array (edge case).
                // E.g. { foo: 'bar', _content: { baz: 2 } } -> <foo>bar</foo><baz>2</baz>
                if (Object.keys(obj[key]).length > 1) {
                  var newContentObj = Object.assign({}, obj[key]);
                  delete newContentObj._content;
                  outputObj._content = [].concat(_toConsumableArray(objToArray(newContentObj)), [obj[key]._content]);
                }
              }
            } // Fallthrough: just pass the key as the content for the new special-object.


            if (typeof outputObj._content === "undefined") outputObj._content = obj[key];
            var xml = toXML(outputObj, newConfig, key);
            return xml;
          }, config);
          outputStr = outputArr.join('');
          break;
        }

      case "function":
        {
          // Executes a user-defined function and returns output.
          var fnResult = obj(config);
          outputStr = toXML(fnResult, config);
          break;
        }

      case "array":
        {
          // Iterates and converts each value in an array.
          var _outputArr = obj.map(function (singleVal, index) {
            var newConfig = _objectSpread(_objectSpread({}, config), {}, {
              _isFirstItem: index === 0,
              _isLastItem: index + 1 === obj.length,
              _isOutputStart: isOutputStart
            });

            return toXML(singleVal, newConfig);
          });

          outputStr = _outputArr.join('');
          break;
        }
      // number, string, boolean, date, null, etc

      default:
        {
          outputStr = filterStr(obj, filter);
          break;
        }
    }

    return "".concat(headerStr).concat(outputStr);
  };

  _exports.toXML = toXML;
  var _default = {
    toXML: toXML
  };
  _exports.default = _default;
});
