"use strict";
// This class responsibility is to parse the XML.

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DocUtils = require("./docUtils");

module.exports = (function () {
	function XmlMatcher(content) {
		_classCallCheck(this, XmlMatcher);

		this.content = content;
	}

	_createClass(XmlMatcher, [{
		key: "parse",
		value: function parse(tagsXmlArray) {
			var _this = this;

			this.tagsXmlArray = tagsXmlArray;
			this.tagsXmlArrayJoined = this.tagsXmlArray.join("|");
			this.matches = DocUtils.pregMatchAll("(<(?:" + this.tagsXmlArrayJoined + ")[^>]*>)([^<>]*)</(?:" + this.tagsXmlArrayJoined + ")>", this.content);
			this.charactersAdded = (function () {
				var result = [];
				var end = _this.matches.length;
				for (var i = 0; i < end; i++) {
					result.push(0);
				}
				return result;
			})();
			this.handleRecursiveCase();
			return this;
		}
	}, {
		key: "handleRecursiveCase",
		value: function handleRecursiveCase() {
			var _this2 = this;

			/*
   Because xmlTemplater is recursive (meaning it can call it self), we need to handle special cases where the XML is not valid:
   For example with this string "I am</w:t></w:r></w:p><w:p><w:r><w:t>sleeping",
   	- we need to match also the string that is inside an implicit <w:t> (that's the role of replacerUnshift) (in this case 'I am')
   	- we need to match the string that is at the right of a <w:t> (that's the role of replacerPush) (in this case 'sleeping')
   the test: describe "scope calculation" it "should compute the scope between 2 <w:t>" makes sure that this part of code works
   It should even work if they is no XML at all, for example if the code is just "I am sleeping", in this case however, they should only be one match
   */

			var replacerUnshift = function replacerUnshift() {
				for (var _len = arguments.length, pn = Array(_len), _key = 0; _key < _len; _key++) {
					pn[_key] = arguments[_key];
				}

				pn.shift();
				var match = pn[0] + pn[1];
				// add match so that pn[0] = whole match, pn[1]= first parenthesis,...
				pn.unshift(match);
				pn.pop();
				var offset = pn.pop();
				pn.offset = offset;
				pn.first = true;
				// add at the beginning
				_this2.matches.unshift(pn);
				return _this2.charactersAdded.unshift(0);
			};

			if (this.content.indexOf("<") === -1 && this.content.indexOf(">") === -1) {
				this.content.replace(/^()([^<>]*)$/, replacerUnshift);
			}

			var regex = "^()([^<]+)</(?:" + this.tagsXmlArrayJoined + ")>";
			var r = new RegExp(regex);
			this.content.replace(r, replacerUnshift);

			var replacerPush = function replacerPush() {
				for (var _len2 = arguments.length, pn = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
					pn[_key2] = arguments[_key2];
				}

				pn.pop();
				var offset = pn.pop();
				pn.offset = offset;
				pn.last = true;
				// add at the end
				_this2.matches.push(pn);
				return _this2.charactersAdded.push(0);
			};

			regex = "(<(?:" + this.tagsXmlArrayJoined + ")[^>]*>)([^>]+)$";
			r = new RegExp(regex);
			this.content.replace(r, replacerPush);
			return this;
		}
	}]);

	return XmlMatcher;
})();