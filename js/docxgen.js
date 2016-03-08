"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DocUtils = require("./docUtils");

var DocxGen = (function () {
	function DocxGen(content, options) {
		_classCallCheck(this, DocxGen);

		this.compiled = {};
		this.moduleManager = new DocxGen.ModuleManager();
		this.moduleManager.gen = this;
		this.setOptions({});
		if (typeof content !== "undefined" && content != null) {
			this.load(content, options);
		}
	}

	_createClass(DocxGen, [{
		key: "attachModule",
		value: function attachModule(module) {
			this.moduleManager.attachModule(module);
			return this;
		}
	}, {
		key: "setOptions",
		value: function setOptions() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			var self = this;
			this.options = options;
			Object.keys(DocUtils.defaults).forEach(function (key) {
				var defaultValue = DocUtils.defaults[key];
				self[key] = self.options[key] != null ? self.options[key] : defaultValue;
			});
			if (this.fileType === "docx" || this.fileType === "pptx") {
				this.fileTypeConfig = DocxGen.FileTypeConfig[this.fileType];
			}
			return this;
		}
	}, {
		key: "load",
		value: function load(content, options) {
			this.moduleManager.sendEvent("loading");
			if (content.file != null) {
				this.zip = content;
			} else {
				this.zip = new DocxGen.JSZip(content, options);
			}
			this.moduleManager.sendEvent("loaded");
			this.templatedFiles = this.fileTypeConfig.getTemplatedFiles(this.zip);
			return this;
		}
	}, {
		key: "renderFile",
		value: function renderFile(fileName) {
			this.moduleManager.sendEvent("rendering-file", fileName);
			var currentFile = this.createTemplateClass(fileName);
			this.zip.file(fileName, currentFile.render().content);
			this.compiled[fileName] = currentFile.compiled;
			return this.moduleManager.sendEvent("rendered-file", fileName);
		}
	}, {
		key: "render",
		value: function render() {
			this.moduleManager.sendEvent("rendering");
			// Loop inside all templatedFiles (basically xml files with content). Sometimes they dont't exist (footer.xml for example)
			var iterable = this.templatedFiles;
			for (var i = 0, fileName; i < iterable.length; i++) {
				fileName = iterable[i];
				if (this.zip.files[fileName] != null) {
					this.renderFile(fileName);
				}
			}
			this.moduleManager.sendEvent("rendered");
			return this;
		}
	}, {
		key: "getTags",
		value: function getTags() {
			var usedTags = [];
			var iterable = this.templatedFiles;
			for (var i = 0, fileName; i < iterable.length; i++) {
				fileName = iterable[i];
				if (this.zip.files[fileName] != null) {
					var currentFile = this.createTemplateClass(fileName);
					var usedTemplateV = currentFile.render().usedTags;
					if (DocUtils.sizeOfObject(usedTemplateV)) {
						usedTags.push({ fileName: fileName, vars: usedTemplateV });
					}
				}
			}
			return usedTags;
		}
	}, {
		key: "setData",
		value: function setData(tags) {
			this.tags = tags;
			return this;
		}
		// output all files, if docx has been loaded via javascript, it will be available

	}, {
		key: "getZip",
		value: function getZip() {
			return this.zip;
		}
	}, {
		key: "createTemplateClass",
		value: function createTemplateClass(path) {
			var self = this;
			var usedData = this.zip.files[path].asText();
			var obj = {
				tags: this.tags,
				moduleManager: this.moduleManager
			};
			Object.keys(DocUtils.defaults).forEach(function (key) {
				obj[key] = self[key];
			});
			obj.fileTypeConfig = this.fileTypeConfig;
			return new DocxGen.XmlTemplater(usedData, obj);
		}
	}, {
		key: "getFullText",
		value: function getFullText() {
			var path = arguments.length <= 0 || arguments[0] === undefined ? this.fileTypeConfig.textPath : arguments[0];

			return this.createTemplateClass(path).getFullText();
		}
	}]);

	return DocxGen;
})();

DocxGen.DocUtils = require("./docUtils");
DocxGen.JSZip = require("jszip");
DocxGen.Errors = require("./errors");
DocxGen.ModuleManager = require("./moduleManager");
DocxGen.XmlTemplater = require("./xmlTemplater");
DocxGen.FileTypeConfig = require("./fileTypeConfig");
DocxGen.XmlMatcher = require("./xmlMatcher");
DocxGen.XmlUtil = require("./xmlUtil");
DocxGen.SubContent = require("./subContent");
module.exports = DocxGen;