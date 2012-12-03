define(function() {
  function getDocument() {
    if (typeof(document) == "undefined") {
      // We're being run in node, so make a document using jsdom.
      var jsdom = require("jsdom").jsdom;
      var doc = jsdom('<html></html>', null, {
        features: {
          FetchExternalResources: false,
          ProcessExternalResources: false,
          MutationEvents: false,
          QuerySelector: true
        }
      });
      return doc;
    }
    return document;
  }
  
  return function htmlToI18nBundle(html) {
    var result = {};
    var div = getDocument().createElement('div');

    div.innerHTML = html;
    [].slice.call(div.querySelectorAll('.error-msg')).forEach(function(el) {
      var name = el.className.split(' ').slice(-1)[0];
      result[name] = el.innerHTML;
    });

    return result;
  };
});
