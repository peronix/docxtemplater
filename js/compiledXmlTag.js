"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CompiledXmlTag = (function () {
	function CompiledXmlTag() {
		var compiled = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

		_classCallCheck(this, CompiledXmlTag);

		this.set(compiled);
	}

	_createClass(CompiledXmlTag, [{
		key: "set",
		value: function set() {
			var compiled = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

			if (this.null) {
				return this;
			}
			this.compiled = [];
			for (var i = 0, text; i < compiled.length; i++) {
				text = compiled[i];
				if (text !== "") {
					this.compiled.push(text);
				}
			}
			return this;
		}
	}, {
		key: "prependText",
		value: function prependText(text) {
			if (this.null) {
				return this;
			}
			if (text !== "") {
				this.compiled.unshift(text);
			}
			return this;
		}
	}, {
		key: "appendText",
		value: function appendText(text) {
			if (this.null) {
				return this;
			}
			if (text !== "") {
				this.compiled.push(text);
			}
			return this;
		}
	}]);

	return CompiledXmlTag;
})();

CompiledXmlTag.null = function () {
	var obj = new CompiledXmlTag();
	obj.null = true;
	return obj;
};

module.exports = CompiledXmlTag;