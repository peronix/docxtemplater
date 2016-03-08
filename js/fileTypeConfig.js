"use strict";

var xmlUtil = require("./xmlUtil");
var SubContent = require("./subContent");

var PptXFileTypeConfig = {
	textPath: "ppt/slides/slide1.xml",
	tagsXmlArray: ["a:t", "m:t"],
	tagRawXml: "p: sp",
	getTemplatedFiles: function getTemplatedFiles(zip) {
		var slideTemplates = zip.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d+\.xml/).map(function (file) {
			return file.name;
		});
		return slideTemplates.concat(["ppt/presentation.xml"]);
	},
	calcIntellegentlyDashElement: function calcIntellegentlyDashElement(content, templaterState) {
		var _getOuterLoop = new SubContent(content).getOuterLoop(templaterState);

		var start = _getOuterLoop.start;
		var end = _getOuterLoop.end;

		var scopeContent = xmlUtil.getListXmlElements(content, start, end - start);
		for (var i = 0, t; i < scopeContent.length; i++) {
			t = scopeContent[i];
			if (t.tag === "<a:tc>") {
				return "a:tr";
			}
		}
		return false;
	}
};

var DocXFileTypeConfig = {
	getTemplatedFiles: function getTemplatedFiles(zip) {
		var slideTemplates = zip.file(/word\/(header|footer)\d+\.xml/).map(function (file) {
			return file.name;
		});
		return slideTemplates.concat(["word/document.xml"]);
	},

	textPath: "word/document.xml",
	tagsXmlArray: ["w:t", "m:t"],
	tagRawXml: "w:p",
	calcIntellegentlyDashElement: function calcIntellegentlyDashElement(content, templaterState) {
		var _getOuterLoop2 = new SubContent(content).getOuterLoop(templaterState);

		var start = _getOuterLoop2.start;
		var end = _getOuterLoop2.end;

		var scopeContent = xmlUtil.getListXmlElements(content, start, end - start);
		for (var i = 0, t; i < scopeContent.length; i++) {
			t = scopeContent[i];
			if (t.tag === "<w:tc>") {
				return "w:tr";
			}
		}
		return false;
	}
};

module.exports = {
	docx: DocXFileTypeConfig,
	pptx: PptXFileTypeConfig
};