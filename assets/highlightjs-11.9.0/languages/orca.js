/*! `mementoChem` grammar compiled for Highlight.js 11.7.0 */
(() => {
  var e = (() => {
    "use strict";
    return e => {
      const n = e.regex,
        a = /[\p{XID_Start}_]\p{XID_Continue}*/u,  // Matches identifiers (e.g., Charge, RAS2)
        s = ["&scf", "end", "%mp2"];  // Block titles

      return {
        name: "orca",
        case_insensitive: true, // language is case-insensitive
        contains: [
          // Block titles: matches &GATEWAY, &SEWARD, &SCF, etc.
          {
            className: "keyword",
            begin: "%[A-Za-z0-9]+",  // Matches any block title (e.g., &GATEWAY)
            relevance: 10
          },
          // Comments: Anything after a star `*`
          {
            className: "comment",
            begin: "\\#",  // Matches star as the beginning of a comment
            end: "$",      // Matches till the end of the line
            relevance: 0
          },
          // Numbers: Matches integers, floats, and scientific notation (like Python)
          {
            className: "number",
            begin: "\\b\\d+(\\.\\d+)?(e[+-]?\\d+)?\\b",  // Matches numbers
            relevance: 0
          },
          // Numbers: Matches integers, floats, and scientific notation (like Python)
          {
            className: "string",
            begin: "\"",  // Matches numbers
            end: "\"",
            relevance: 0
          },
          // Variable-like identifiers (e.g., Nactel, Charge)
          {
            className: "link",
            begin: "\\!",  // Matches the exclamation mark at the beginning
            end: "(?=#|\"|$)",  // Matches just before the first "#" or "\"" or the end of the line
            relevance: 0
          },
          {
            className: "link",
            begin: "% MoInp",  // Matches star as the beginning of a comment
            end: "$",      // Matches till the end of the line
            relevance: 0
          },
        ],
        // Define keywords (block titles)
        keywords: {
          keyword: s.join(" "),  // Join block titles into a single string
        }
      };
    };
  })();

  // Register the custom 'mementoChem' language with Highlight.js
  hljs.registerLanguage("orca", e);
})();

