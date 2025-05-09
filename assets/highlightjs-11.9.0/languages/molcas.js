/*! `mementoChem` grammar compiled for Highlight.js 11.7.0 */
(() => {
  var e = (() => {
    "use strict";
    return e => {
      const n = e.regex,
            a = /[\p{XID_Start}_]\p{XID_Continue}*/u,  // Matches identifiers (e.g., Charge, RAS2)
            s = ["&GATEWAY", "&SEWARD", "&SCF", "&RASSCF", "&CASPT2"],  // Block titles
            literals = ["Basis", "Group", "Nactel", "RAS2", "CIRoots", "Charge", "Spin", "IPEA", "Imag", "Shift", "KSDFT", "Scramble", "Coord", "OutOrb"],
            args = ["RICD", "NOCD", "UHF", "Direct", "CIOnly", "TS", "Canonical", "C1"];

      return {
        name: "molcas",
        case_insensitive: true, // language is case-insensitive
        contains: [
          // Block titles: matches &GATEWAY, &SEWARD, &SCF, etc.
          {
            className: "keyword",
            begin: "&[A-Za-z0-9]+",  // Matches any block title (e.g., &GATEWAY)
            relevance: 10
          },
          // Comments: Anything after a star `*`
          {
            className: "comment",
            begin: "\\*",  // Matches star as the beginning of a comment
            end: "$",      // Matches till the end of the line
            relevance: 0
          },
          // Numbers: Matches integers, floats, and scientific notation (like Python)
          {
            className: "number",
            begin: "\\b\\d+(\\.\\d+)?(e[+-]?\\d+)?\\b",  // Matches numbers
            relevance: 0
          },
          // Variable-like identifiers (e.g., Nactel, Charge)
          // {
          //   className: "variable",
          //   begin: "\\b[A-Za-z_][A-Za-z0-9_]*\\b",
          //   relevance: 0
          // }
        ],
        // Define keywords (block titles)
        keywords: {
          keyword: s.join(" "),  // Join block titles into a single string
          built_in: literals.join(" "),
          number: args.join(" ")
        }
      };
    };
  })();

  // Register the custom 'mementoChem' language with Highlight.js
  hljs.registerLanguage("molcas", e);
})();

