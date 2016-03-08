"use strict";
// This class responsibility is to manage the scope

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Errors = require("./errors");

module.exports = (function () {
	function ScopeManager(options) {
		_classCallCheck(this, ScopeManager);

		this.tags = options.tags;
		this.scopePath = options.scopePath;
		this.usedTags = options.usedTags;
		this.scopeList = options.scopeList;
		this.parser = options.parser;
		this.moduleManager = options.moduleManager;
		this.nullGetter = options.nullGetter;
		this.delimiters = options.delimiters;
		this.moduleManager.scopeManager = this;
	}

	_createClass(ScopeManager, [{
		key: "loopOver",
		value: function loopOver(tag, callback) {
			var inverted = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

			var value = this.getValue(tag);
			return this.loopOverValue(value, callback, inverted);
		}
	}, {
		key: "functorIfInverted",
		value: function functorIfInverted(inverted, functor, value) {
			if (inverted) {
				functor(value);
			}
		}
	}, {
		key: "functorIfNotInverted",
		value: function functorIfNotInverted(inverted, functor, value) {
			if (!inverted) {
				functor(value);
			}
		}
	}, {
		key: "isValueFalsy",
		value: function isValueFalsy(value, type) {
			return !(typeof value !== "undefined" && value != null) || !value || type === "[object Array]" && value.length === 0;
		}
	}, {
		key: "loopOverValue",
		value: function loopOverValue(value, functor) {
			var inverted = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

			var type = Object.prototype.toString.call(value);
			var currentValue = this.scopeList[this.num];
			if (this.isValueFalsy(value, type)) {
				return this.functorIfInverted(inverted, functor, currentValue);
			}
			if (type === "[object Array]") {
				for (var i = 0, scope; i < value.length; i++) {
					scope = value[i];
					this.functorIfNotInverted(inverted, functor, scope);
				}
				return;
			}
			if (type === "[object Object]") {
				return this.functorIfNotInverted(inverted, functor, value);
			}
			if (value === true) {
				return this.functorIfNotInverted(inverted, functor, currentValue);
			}
		}
	}, {
		key: "getValue",
		value: function getValue(tag) {
			var num = arguments.length <= 1 || arguments[1] === undefined ? this.scopeList.length - 1 : arguments[1];

			this.num = num;
			var err;
			var parser;
			var result;
			var scope = this.scopeList[this.num];
			try {
				parser = this.parser(tag);
			} catch (error) {
				err = new Errors.XTScopeParserError("Scope parser compilation failed");
				err.properties = {
					id: "scopeparser_compilation_failed",
					tag: tag,
					explanation: "The scope parser for the tag " + tag + " failed to compile"
				};
				throw err;
			}
			try {
				result = parser.get(scope);
			} catch (error) {
				err = new Errors.XTScopeParserError("Scope parser execution failed");
				err.properties = {
					id: "scopeparser_execution_failed",
					explanation: "The scope parser for the tag " + tag + " failed to execute",
					scope: scope,
					tag: tag
				};
				throw err;
			}
			if (!(typeof result !== "undefined" && result != null) && this.num > 0) {
				return this.getValue(tag, this.num - 1);
			}
			return result;
		}
	}, {
		key: "getValueFromScope",
		value: function getValueFromScope(tag) {
			// search in the scopes (in reverse order) and keep the first defined value
			var result = this.getValue(tag);
			var value;
			if (typeof result !== "undefined" && result != null) {
				if (typeof result === "string") {
					this.useTag(tag, true);
					value = result;
				} else if (typeof result === "number") {
					value = String(result);
				} else {
					value = result;
				}
			} else {
				this.useTag(tag, false);
				return null;
			}
			return value;
		}
		// set the tag as used, so that DocxGen can return the list of all tags

	}, {
		key: "useTag",
		value: function useTag(tag, val) {
			var u;
			if (val) {
				u = this.usedTags.def;
			} else {
				u = this.usedTags.undef;
			}
			var iterable = this.scopePath;
			for (var i = 0, s; i < iterable.length; i++) {
				s = iterable[i];
				if (!(u[s] != null)) {
					u[s] = {};
				}
				u = u[s];
			}
			if (tag !== "") {
				u[tag] = true;
			}
		}
	}]);

	return ScopeManager;
})();