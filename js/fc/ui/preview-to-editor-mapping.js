"use strict";

define(["jquery", "./mark-tracker"], function($, MarkTracker) {
  // Given a descendant of the given root element, returns a CSS
  // selector that uniquely selects only the descendant from the
  // root element.
  function pathTo(root, descendant) {
    var target = $(descendant).get(0);
    var parts = [];
    var node, nodeName, n, selector;

    for (node = target; node && node != root; node = node.parentNode) {
      nodeName = node.nodeName.toLowerCase();
      n = $(node).prevAll(nodeName).length + 1;
      selector = nodeName + ':nth-of-type(' + n + ')';
      parts.push(selector);
    }
    
    parts.reverse();
    return ' > ' + parts.join(' > ');
  }
  
  function nodeToCode(node, docFrag) {
    var parallelNode = getParallelNode(node, docFrag);
    var result = null;
    if (parallelNode) {
      var pi = parallelNode.parseInfo;
      var isVoidElement = !pi.closeTag;
      result = {
        start: pi.openTag.start,
        end: isVoidElement ? pi.openTag.end : pi.closeTag.end,
        contentStart: isVoidElement ? pi.openTag.start : pi.openTag.end
      };
    }
    return result;
  }

  function getParallelNode(node, docFrag) {
    var root, i;
    var htmlNode = docFrag.querySelector("html");
    var origDocFrag = docFrag;
    var parallelNode = null;
    if (htmlNode && docFrag.querySelector("body")) {
      root = node.ownerDocument.documentElement;
    } else {
      if (!htmlNode) {
        docFrag = document.createDocumentFragment();
        htmlNode = document.createElement("html");
        docFrag.appendChild(htmlNode);
        for (i = 0; i < origDocFrag.childNodes.length; i++)
          htmlNode.appendChild(origDocFrag.childNodes[i]);
      }
      root = node.ownerDocument.body;
    }
    var path = "html " + pathTo(root, node);
    parallelNode = docFrag.querySelector(path);
    if (origDocFrag != docFrag) {
      for (i = 0; i < htmlNode.childNodes.length; i++)
        origDocFrag.appendChild(htmlNode.childNodes[i]);
    }
    return parallelNode;
  }

  function intervalForElement(element, docFrag) {
    var tagName = element.tagName.toLowerCase();
    var interval = null;
    if (tagName !== "html" && tagName !== "body")
      return nodeToCode(element, docFrag);
    return null;
  }

  function PreviewToEditorMapping(livePreview) {
    var codeMirror = livePreview.codeMirror;
    var marks = MarkTracker(codeMirror);
    $(".CodeMirror-lines", codeMirror.getWrapperElement())
      .on("mouseup", marks.clear);
    livePreview.on("refresh", function(event) {
      var docFrag = event.documentFragment;
      marks.clear();
      $(event.window).on("mousedown", "*", function(event) {
        var interval = intervalForElement(this, docFrag);
        if (interval) {
          var start = codeMirror.posFromIndex(interval.start);
          var startCoords = codeMirror.charCoords(start, "local");
          codeMirror.scrollTo(startCoords.x, startCoords.y);
          codeMirror.focus();
        }
      });
      $(event.window).on("mouseleave", "html", function(event) {
        marks.clear();
      });
      $(event.window).on("mouseover", function(event) {
        marks.clear();
        var interval = intervalForElement(event.target, docFrag);
        if (interval)
          marks.mark(interval.start, interval.end,
                     "preview-to-editor-highlight");
      });
    });
  }
  
  PreviewToEditorMapping._pathTo = pathTo;
  PreviewToEditorMapping._nodeToCode = nodeToCode;
  PreviewToEditorMapping._getParallelNode = getParallelNode;
  
  return PreviewToEditorMapping;
});
