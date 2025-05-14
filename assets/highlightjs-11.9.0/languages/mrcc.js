/*! `mementoChem` grammar compiled for Highlight.js 11.7.0 */
(() => {
  var e = (() => {
    "use strict";
    return e => {
      return {
        name: "mrcc",
        case_insensitive: true, // language is case-insensitive
        contains: [
          // Comments: Anything after a hash `#`
          {
            className: "comment",
            begin: "\\#",  
            end: "$",     
            relevance: 0
          },
          // Numbers: Matches integers, floats, and scientific notation
          {
            className: "number",
            begin: "\\b\\d+(\\.\\d+)?(e[+-]?\\d+)?\\b",
            relevance: 0
          },
          // Words followed by an equal sign (literals)
          {
            className: "built_in",
            begin: "\\b[a-zA-Z][a-zA-Z0-9_\\-]*(?=\\s*=)",
            relevance: 1
          },
          // Words preceded by an equal sign (args) - including words with dashes
          {
            className: "number",
            begin: "(?<=\\=\\s*)[a-zA-Z0-9_\\-]+(\\([a-zA-Z0-9_\\-]+\\))?",
            relevance: 1
          },
          // Method names with parentheses (for cases not caught by the above rule)
          {
            className: "number",
            begin: "\\b[a-zA-Z0-9_\\-]+(\\([a-zA-Z0-9_\\-]+\\))",
            relevance: 0
          }
        ]
      };
    };
  })();

  // Register the custom 'mementoChem' language with Highlight.js
  hljs.registerLanguage("mrcc", e);
})();

