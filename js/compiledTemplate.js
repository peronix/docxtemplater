"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Errors = require("./errors");

var CompiledTemplate = (function () {
	function CompiledTemplate() {
		_classCallCheck(this, CompiledTemplate);

		this.compiled = [];
	}

	_createClass(CompiledTemplate, [{
		key: "prependText",
		value: function prependText(text) {
			this.compiled.unshift(text);
			return this;
		}
	}, {
		key: "appendTag",
		value: function appendTag(compiledTag) {
			if (!compiledTag) {
				var err = new Errors.XTInternalError("Compiled tag empty");
				err.properties.id = "tag_appended_empty";
				throw err;
			}
			this.compiled = this.compiled.concat(compiledTag.compiled);
			return this;
		}
	}, {
		key: "appendRaw",
		value: function appendRaw(tag) {
			this.compiled.push({ type: "raw", tag: tag });
			return this;
		}
	}, {
		key: "appendText",
		value: function appendText(text) {
			if (text !== "") {
				this.compiled.push(text);
			}
			return this;
		}
	}, {
		key: "appendSubTemplate",
		value: function appendSubTemplate(subTemplate, tag, inverted) {
			if (!subTemplate) {
				var err = new Errors.XTInternalError("Subtemplate empty");
				err.properties.id = "subtemplate_appended_empty";
				throw err;
			}
			return this.compiled.push({ type: "loop", tag: tag, inverted: inverted, template: subTemplate });
		}
	}]);

	return CompiledTemplate;
})();

module.exports = CompiledTemplate;