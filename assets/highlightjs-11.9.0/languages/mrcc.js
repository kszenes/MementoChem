/*! `mementoChem` grammar compiled for Highlight.js 11.7.0 */
(() => {
  var e = (() => {
    "use strict";
    return e => {
      const n = e.regex,
        a = /[\p{XID_Start}_]\p{XID_Continue}*/u,  // Matches identifiers (e.g., Charge, RAS2)
        s = ["&GATEWAY", "&SEWARD", "&SCF", "&RASSCF", "&CASPT2"],  // Block titles
        literals = ["basis", "unit", "freeze", "scf_type", "charge", "mult", "geom", "calc", "freq", "gopt", "core", "scftol", "qcsf", "guess"],
        args = ["rhf", "uhf", "rohf", "rks", "uks", "roks", "direct", "bohr", "xyz", "scf", "ccsd", "ccsd(t)", "ccsdtq", "ccsdt(q)", "ccsdtqp", "cisd", "cisdt", "cisdtq", "fci", "mp2", "ri", "mp2", "ccsd", "ccsd(t)", "ccsdtq", "ccsdt(q)", "ccsdtqp", "cisd", "cisdt", "cisdtq", "on", "full", "frozen"];

      return {
        name: "mrcc",
        case_insensitive: true, // language is case-insensitive
        contains: [
          // Comments: Anything after a star `#`
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
  hljs.registerLanguage("mrcc", e);
})();

