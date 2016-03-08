"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DocUtils = require("./docUtils");
var ScopeManager = require("./scopeManager");
var SubContent = require("./subContent");
var TemplaterState = require("./templaterState");
var XmlMatcher = require("./xmlMatcher");
var ModuleManager = require("./moduleManager");
var CompiledTemplate = require("./compiledTemplate");
var CompiledXmlTag = require("./compiledXmlTag");
var Errors = require("./errors");

var _getFullText = function _getFullText(content, tagsXmlArray) {
	var matcher = new XmlMatcher(content).parse(tagsXmlArray);
	// get only the text
	var output = (function () {
		var result = [];
		for (var i = 0, match; i < matcher.matches.length; i++) {
			match = matcher.matches[i];
			result.push(match[2]);
		}
		return result;
	})();
	// join it
	return DocUtils.wordToUtf8(DocUtils.convertSpaces(output.join("")));
};

// This is an abstract class, DocXTemplater is an example of inherited class
module.exports = (function () {
	function XmlTemplater() {
		var content = arguments.length <= 0 || arguments[0] === undefined ? "" : arguments[0];
		var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

		_classCallCheck(this, XmlTemplater);

		this.fromJson(options);
		this.templaterState = new TemplaterState(this.moduleManager, this.delimiters);
		this.load(content);
	}

	_createClass(XmlTemplater, [{
		key: "load",
		value: function load(content) {
			this.content = content;
			if (typeof this.content !== "string") {
				var err = new Errors.XTInternalError("Content must be a string");
				err.properties.id = "xmltemplater_content_must_be_string";
				throw err;
			}
			var xmlMatcher = new XmlMatcher(this.content).parse(this.fileTypeConfig.tagsXmlArray);
			this.templaterState.matches = xmlMatcher.matches;
			this.templaterState.charactersAdded = xmlMatcher.charactersAdded;
		}
	}, {
		key: "fromJson",
		value: function fromJson() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			var self = this;
			this.tags = options.tags != null ? options.tags : {};
			this.fileTypeConfig = options.fileTypeConfig;
			this.scopePath = options.scopePath != null ? options.scopePath : [];
			this.scopeList = options.scopeList != null ? options.scopeList : [this.tags];
			this.usedTags = options.usedTags != null ? options.usedTags : { def: {}, undef: {} };
			Object.keys(DocUtils.defaults).map(function (key) {
				var defaultValue = DocUtils.defaults[key];
				self[key] = options[key] != null ? options[key] : defaultValue;
			});
			this.moduleManager = options.moduleManager != null ? options.moduleManager : new ModuleManager();
			this.scopeManager = new ScopeManager({ tags: this.tags, scopePath: this.scopePath, usedTags: this.usedTags, scopeList: this.scopeList, parser: this.parser, moduleManager: this.moduleManager, delimiters: this.delimiters });
		}
	}, {
		key: "toJson",
		value: function toJson() {
			var self = this;
			var obj = {
				fileTypeConfig: this.fileTypeConfig,
				tags: DocUtils.clone(this.scopeManager.tags),
				scopePath: DocUtils.clone(this.scopeManager.scopePath),
				scopeList: DocUtils.clone(this.scopeManager.scopeList),
				usedTags: this.scopeManager.usedTags,
				moduleManager: this.moduleManager
			};
			Object.keys(DocUtils.defaults).map(function (key) {
				obj[key] = self[key];
			});
			return obj;
		}
	}, {
		key: "getFullText",
		value: function getFullText() {
			return _getFullText(this.content, this.fileTypeConfig.tagsXmlArray);
		}
	}, {
		key: "updateModuleManager",
		value: function updateModuleManager() {
			this.moduleManager.xmlTemplater = this;
			this.moduleManager.templaterState = this.templaterState;
			this.moduleManager.scopeManager = this.scopeManager;
		}
	}, {
		key: "handleModuleManager",
		value: function handleModuleManager(type, data) {
			this.updateModuleManager();
			return this.moduleManager.handle(type, data);
		}
		/*
  content is the whole content to be tagged
  scope is the current scope
  returns the new content of the tagged content*/

	}, {
		key: "render",
		value: function render() {
			return this.compile();
		}
	}, {
		key: "getTrail",
		value: function getTrail(character) {
			this.templaterState.trail += character;
			var length = !this.templaterState.inTag ? this.delimiters.start.length : this.delimiters.end.length;
			return this.templaterState.trail.substr(-length, length);
		}
	}, {
		key: "handleCharacter",
		value: function handleCharacter(character) {
			if (this.templaterState.trail === this.delimiters.start && (this.templaterState.inTag === false || this.sameTags === false)) {
				this.templaterState.startTag();
			} else if (this.templaterState.trail === this.delimiters.end && (this.templaterState.inTag === true || this.sameTags === false)) {
				this.updateModuleManager();
				this.templaterState.endTag();
				this.loopClose();
			} else if (this.templaterState.inTag === true) {
				this.templaterState.textInsideTag += character;
			}
		}
	}, {
		key: "forEachCharacter",
		value: function forEachCharacter(functor) {
			var matches = this.templaterState.matches;
			for (var numXmlTag = 0, match; numXmlTag < matches.length; numXmlTag++) {
				match = matches[numXmlTag];
				// text inside the <w:t>
				var innerText = match[2];
				this.templaterState.offset[numXmlTag] = 0;
				if (this.templaterState.trail.length === 0 && !this.templaterState.inTag && innerText.indexOf(this.delimiters.start[0]) === -1 && innerText.indexOf(this.delimiters.end[0]) === -1) {
					continue;
				}
				for (var numCharacter = 0, character; numCharacter < innerText.length; numCharacter++) {
					character = innerText[numCharacter];
					this.templaterState.trail = this.getTrail(character);
					this.templaterState.currentStep = { numXmlTag: numXmlTag, numCharacter: numCharacter };
					this.templaterState.trailSteps.push({ numXmlTag: numXmlTag, numCharacter: numCharacter });
					this.templaterState.trailSteps = this.templaterState.trailSteps.splice(-this.delimiters.start.length, this.delimiters.start.length);
					this.templaterState.context += character;
					functor(character, numXmlTag, numCharacter);
				}
			}
		}
	}, {
		key: "compile",
		value: function compile() {
			this.sameTags = this.delimiters.start === this.delimiters.end;
			this.compiled = new CompiledTemplate();
			this.lastStart = 0;
			this.templaterState.initialize();
			this.handleModuleManager("xmlRendering");
			this.forEachCharacter(this.handleCharacter.bind(this));
			this.handleModuleManager("xmlRendered");
			var preContent = this.content.substr(this.lastStart);
			this.compiled.appendText(preContent);
			this.templaterState.finalize();
			return this;
		}
	}, {
		key: "loopClose",
		value: function loopClose() {
			var loopType = this.templaterState.loopType();
			if (loopType === "simple") {
				this.replaceSimpleTag();
			}
			if (loopType === "xml") {
				this.replaceSimpleTagRawXml();
			}
			if (["dash", "for"].indexOf(loopType) !== -1 && this.templaterState.isLoopClosingTag()) {
				this.replaceLoopTag();
				this.templaterState.finishLoop();
			}
			if (["simple", "dash", "for", "xml"].indexOf(loopType) === -1) {
				this.handleModuleManager("replaceTag", loopType);
			}
		}
	}, {
		key: "replaceSimpleTag",
		value: function replaceSimpleTag() {
			var newValue = this.scopeManager.getValueFromScope(this.templaterState.textInsideTag);
			if (!(typeof newValue !== "undefined" && newValue != null)) {
				newValue = this.nullGetter(this.templaterState.textInsideTag, { tag: "simple" });
			}
			this.content = this.replaceTagByValue(DocUtils.utf8ToWord(newValue), this.content);
		}
	}, {
		key: "replaceSimpleTagRawXml",
		value: function replaceSimpleTagRawXml() {
			var outerXml;
			var newText = this.scopeManager.getValueFromScope(this.templaterState.tag);
			if (!(typeof newText !== "undefined" && newText != null)) {
				newText = this.nullGetter(this.templaterState.tag, { tag: "raw" });
			}
			var subContent = new SubContent(this.content);
			subContent.getInnerTag(this.templaterState);
			try {
				outerXml = subContent.getOuterXml(this.fileTypeConfig.tagRawXml);
			} catch (error) {
				if (error instanceof Errors.XTTemplateError) {
					error.properties.id = "raw_tag_outerxml_invalid";
					error.properties.xtag = this.templaterState.textInsideTag;
					error.properties.explanation = "The raw tag " + error.properties.xtag + " is not valid in this context.";
				}
				throw error;
			}
			var fullText = _getFullText(outerXml.text, this.fileTypeConfig.tagsXmlArray);
			if (this.templaterState.fullTextTag !== fullText) {
				var err = new Errors.XTTemplateError("Raw xml tag should be the only text in paragraph");
				err.properties = {
					id: "raw_xml_tag_should_be_only_text_in_paragraph",
					paragraphContent: fullText,
					fullTag: this.templaterState.fullTextTag,
					xtag: this.templaterState.textInsideTag,
					explanation: "The tag : '" + this.templaterState.fullTextTag + "' should be the the only text in the paragraph (it contains '" + fullText + "')"
				};
				throw err;
			}
			var startTag = outerXml.start;
			var preContent = this.content.substr(this.lastStart, startTag - this.lastStart);
			this.compiled.appendText(preContent);
			this.lastStart = startTag;
			this.compiled.appendRaw(this.templaterState.tag);
			return this.replaceXml(outerXml, newText);
		}
	}, {
		key: "replaceXml",
		value: function replaceXml(subContent, newText) {
			newText = newText || '';
			this.templaterState.moveCharacters(this.templaterState.tagStart.numXmlTag, newText.length, subContent.text.length);
			this.content = subContent.replace(newText).fullText;
			return this.content;
		}
	}, {
		key: "deleteTag",
		value: function deleteTag(xml, tag) {
			this.templaterState.tagStart = tag.start;
			this.templaterState.tagEnd = tag.end;
			this.templaterState.textInsideTag = tag.raw;
			return this.replaceTagByValue("", xml);
		}
	}, {
		key: "deleteOuterTags",
		value: function deleteOuterTags(outerXmlText) {
			return this.deleteTag(this.deleteTag(outerXmlText, this.templaterState.loopOpen), this.templaterState.loopClose);
		}
	}, {
		key: "dashLoop",
		value: function dashLoop(elementDashLoop) {
			var sharp = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

			var outerXml;
			var subContent = new SubContent(this.content);
			subContent.getInnerLoop(this.templaterState);
			try {
				outerXml = subContent.getOuterXml(elementDashLoop);
			} catch (error) {
				if (error instanceof Errors.XTTemplateError) {
					error.properties.id = "dashloop_tag_outerxml_invalid";
					error.properties.xtag = this.templaterState.textInsideTag;
					error.properties.explanation = "The dashLoop tag " + error.properties.xtag + " is not valid in this context.";
				}
				throw error;
			}
			this.templaterState.moveCharacters(0, 0, outerXml.start);
			var outerXmlText = outerXml.text;
			var innerXmlText = this.deleteOuterTags(outerXmlText, sharp);
			this.templaterState.moveCharacters(0, outerXml.start, 0);
			this.templaterState.moveCharacters(this.templaterState.tagStart.numXmlTag, outerXmlText.length, innerXmlText.length);
			return this.forLoop(outerXml, innerXmlText);
		}
	}, {
		key: "xmlToBeReplaced",
		value: function xmlToBeReplaced(options) {
			var before = "";
			var after = "";
			if (options.noStartTag) {
				return options.insideValue;
			}
			if (options.spacePreserve && options.tag === "w:t") {
				before = "<" + options.fullTag + " xml:space=\"preserve\">";
			} else {
				before = this.templaterState.matches[options.xmlTagNumber][1];
			}
			if (!options.noEndTag) {
				after = "</" + options.tag + ">";
			}
			this.currentCompiledTag.prependText(before);
			this.currentCompiledTag.appendText(after);
			return before + options.insideValue + after;
		}
		// replace first occurence of search (can be regex) after *from* offset

	}, {
		key: "replaceFirstFrom",
		value: function replaceFirstFrom(string, search, replace, from) {
			var substr = string.substr(from);
			var replaced = substr.replace(search, replace);
			return string.substr(0, from) + replaced;
		}
	}, {
		key: "replaceXmlTag",
		value: function replaceXmlTag(content, options) {
			this.templaterState.offset[options.xmlTagNumber] += options.insideValue.length - this.templaterState.matches[options.xmlTagNumber][2].length;
			options.fullTag = this.templaterState.matches[options.xmlTagNumber][1].replace(/^<([^>]+)>$/, "$1");
			options.tag = options.fullTag.replace(/([^ ]*).*/, "$1");
			options.spacePreserve = options.spacePreserve != null ? options.spacePreserve : true;
			options.spacePreserve = options.spacePreserve && this.templaterState.matches[options.xmlTagNumber][1].indexOf('xml:space="preserve"') === -1;
			options.noStartTag = options.noStartTag != null ? options.noStartTag : false;
			options.noEndTag = options.noEndTag != null ? options.noEndTag : false;
			var replacer = this.xmlToBeReplaced(options);
			// so that the templaterState.matches are still correct
			this.templaterState.matches[options.xmlTagNumber][2] = options.insideValue;
			// where the open tag starts: <w:t>
			var startTag = this.templaterState.calcXmlTagPosition(options.xmlTagNumber);
			// calculate the replacer according to the params
			this.templaterState.moveCharacters(options.xmlTagNumber + 1, replacer.length, this.templaterState.matches[options.xmlTagNumber][0].length);
			if (content.indexOf(this.templaterState.matches[options.xmlTagNumber][0]) === -1) {
				var err = new Errors.XTInternalError("Match not found in content");
				err.properties.id = "xmltemplater_replaced_cant_be_same_as_substring";
				err.properties.expectedMatch = this.templaterState.matches[options.xmlTagNumber][0];
				err.properties.content = content;
				throw err;
			}
			content = this.replaceFirstFrom(content, this.templaterState.matches[options.xmlTagNumber][0], replacer, startTag);
			this.templaterState.matches[options.xmlTagNumber][0] = replacer;
			var preContent = content.substr(this.lastStart, startTag - this.lastStart);
			if (this.templaterState.loopType() === "simple") {
				this.compiled.appendText(preContent);
				this.lastStart = startTag + this.templaterState.matches[options.xmlTagNumber][0].length;
				this.compiled.appendTag(this.currentCompiledTag);
			}
			return content;
		}
	}, {
		key: "replaceTagByValue",
		value: function replaceTagByValue(newValue, content) {
			var location = this.templaterState.getMatchLocation(this.templaterState.tagStart.numXmlTag);
			var options = {
				xmlTagNumber: this.templaterState.tagStart.numXmlTag,
				noStartTag: location === "first",
				noEndTag: location === "last"
			};
			// <w>{aaaaa}</w>
			if (this.templaterState.tagEnd.numXmlTag === this.templaterState.tagStart.numXmlTag) {
				this.currentCompiledTag = new CompiledXmlTag([this.templaterState.getLeftValue(), { type: "tag", tag: this.templaterState.textInsideTag }, this.templaterState.getRightValue()]);
				options.insideValue = this.templaterState.getLeftValue() + newValue + this.templaterState.getRightValue();
				return this.replaceXmlTag(content, options);
			}
			// <w>{aaa</w> ... <w> aaa} </w>
			else if (this.templaterState.tagEnd.numXmlTag > this.templaterState.tagStart.numXmlTag) {
					// 1. for the first (@templaterState.tagStart.numXmlTag): replace **{tag by **tagValue

					// normal case
					if (location === "normal") {
						this.currentCompiledTag = new CompiledXmlTag([this.templaterState.getLeftValue(), { type: "tag", tag: this.templaterState.textInsideTag }]);
						options.insideValue = this.templaterState.getLeftValue() + newValue;
					} else {
						options.insideValue = newValue;
						this.currentCompiledTag = new CompiledXmlTag([{ type: "tag", tag: this.templaterState.textInsideTag }]);
					}

					content = this.replaceXmlTag(content, options);

					// 2. for in between (@templaterState.tagStart.numXmlTag+1...@templaterState.tagEnd.numXmlTag) replace whole by ""

					options = {
						insideValue: "",
						spacePreserve: false
					};

					var start = this.templaterState.tagStart.numXmlTag + 1;
					var end = this.templaterState.tagEnd.numXmlTag;
					for (var k = start; k < end; k++) {
						options.xmlTagNumber = k;
						this.currentCompiledTag = new CompiledXmlTag([]);
						content = this.replaceXmlTag(content, options);
					}

					// 3. for the last (@templaterState.tagEnd.numXmlTag) replace ..}__ by ".." ###
					options = {
						insideValue: this.templaterState.getRightValue(),
						spacePreserve: true,
						xmlTagNumber: this.templaterState.tagEnd.numXmlTag,
						noEndTag: this.templaterState.getMatchLocation(this.templaterState.tagEnd.numXmlTag) === "last"
					};

					this.currentCompiledTag = CompiledXmlTag.null();
					return this.replaceXmlTag(content, options);
				}
		}
	}, {
		key: "replaceLoopTag",
		value: function replaceLoopTag() {
			// You DashLoop= take the outer scope only if you are in a table
			if (this.templaterState.loopType() === "dash") {
				return this.dashLoop(this.templaterState.loopOpen.element);
			}
			if (this.intelligentTagging === true) {
				var dashElement = this.fileTypeConfig.calcIntellegentlyDashElement(this.content, this.templaterState);
				if (dashElement !== false) {
					return this.dashLoop(dashElement, true);
				}
			}
			var outerLoop = new SubContent(this.content).getOuterLoop(this.templaterState);
			var innerTemplate = new SubContent(this.content).getInnerLoop(this.templaterState).text;
			return this.forLoop(outerLoop, innerTemplate);
		}
	}, {
		key: "calcSubXmlTemplater",
		value: function calcSubXmlTemplater(innerTagsContent, argOptions) {
			var options = this.toJson();
			if (typeof argOptions !== "undefined" && argOptions != null) {
				if (argOptions.tags != null) {
					options.tags = argOptions.tags;
					options.scopeList = options.scopeList.concat(argOptions.tags);
					options.scopePath = options.scopePath.concat(this.templaterState.loopOpen.tag);
				}
			}
			var subXml = new XmlTemplater(innerTagsContent, options);
			return subXml.render();
		}
	}, {
		key: "forLoop",
		value: function forLoop(outerTags, subTemplate) {
			var _this = this;

			/*
   	<w:t>{#forTag} blabla</w:t>
   	Blabla1
   	Blabla2
   	<w:t>{/forTag}</w:t>
   		Let subTemplate be what is in between the first closing tag and the second opening tag | blabla....Blabla2<w:t>|
   	Let outerTagsContent what is in between the first opening tag and the last closing tag |{#forTag} blabla....Blabla2<w:t>{/forTag}|
   	We replace outerTagsContent by n*subTemplate, n is equal to the length of the array in scope forTag
   	<w:t>subContent subContent subContent</w:t>
   */
			var startTag = outerTags.start;
			var preContent = this.content.substr(this.lastStart, startTag - this.lastStart);
			this.compiled.appendText(preContent);
			this.lastStart = outerTags.end;

			var tag = this.templaterState.loopOpen.tag;
			var newContent = "";
			var loopFn = function loopFn(subTags) {
				var subfile = _this.calcSubXmlTemplater(subTemplate, { tags: subTags });
				newContent += subfile.content;
				return newContent;
			};

			this.scopeManager.loopOver(tag, loopFn, this.templaterState.loopIsInverted);
			var subfile = this.calcSubXmlTemplater(subTemplate, { tags: {} });
			this.compiled.appendSubTemplate(subfile.compiled.compiled, tag, this.templaterState.loopIsInverted);
			this.lastStart += newContent.length - outerTags.text.length;
			return this.replaceXml(outerTags, newContent);
		}
	}]);

	return XmlTemplater;
})();