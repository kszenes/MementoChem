/*! `python` grammar compiled for Highlight.js 11.7.0 */
(() => {
  var e = (() => {
    "use strict"; return e => {
      const n = e.regex, a = /[\p{XID_Start}_]\p{XID_Continue}*/u, i = ["and", "as", "assert", "async", "await", "break", "case", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "match", "nonlocal|10", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield", "molecule", "set", "print", "print_geom", "frequencies", "frequency", "optimize", "energy", "geometry", "natom"], s = {
        $pattern: /[A-Za-z]\w+|__\w+__/, keyword: i,
        built_in: ["__import__", "abs", "all", "any", "ascii", "bin", "bool", "breakpoint", "bytearray", "bytes", "callable", "chr", "classmethod", "compile", "complex", "delattr", "dict", "dir", "divmod", "enumerate", "eval", "exec", "filter", "float", "format", "frozenset", "getattr", "globals", "hasattr", "hash", "help", "hex", "id", "input", "int", "isinstance", "issubclass", "iter", "len", "list", "locals", "map", "max", "memoryview", "min", "next", "object", "oct", "open", "ord", "pow", "property", "range", "repr", "reversed", "round", "setattr", "slice", "sorted", "staticmethod", "str", "sum", "super", "tuple", "type", "vars", "zip", "basis", "reference", "guess_mix", "stability_analysis", "units", "opt_type", "scf_type", "e_convergence", "d_convergence", "soscf", "guess", "symmetry", "freeze_core", "docc", "restricted_docc", "active", "ras2", "nat_orbs", "num_roots", "corr_wfn"], // Add settings here
        literal: ["__debug__", "Ellipsis", "False", "None", "NotImplemented", "True", "rhf", "uhf", "rohf", "rks", "uks", "roks", "follow", "core", "huckel", "direct", "bohr", "ts", "c1", "df", "dfdirj", "cosx", "pt2", "ccsd", "ccsd_t"], // Add arguments
      }, t = { className: "meta", begin: /^(>>>|\.\.\.) / }, r = {
        className: "subst", begin: /\{/,
        end: /\}/, keywords: s, illegal: /#/
      }, l = { begin: /\{\{/, relevance: 0 }, b = {
        className: "string", contains: [e.BACKSLASH_ESCAPE], variants: [{
          begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/, end: /'''/,
          contains: [e.BACKSLASH_ESCAPE, t], relevance: 10
        }, {
          begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/, end: /"""/,
          contains: [e.BACKSLASH_ESCAPE, t], relevance: 10
        }, {
          begin: /([fF][rR]|[rR][fF]|[fF])'''/, end: /'''/,
          contains: [e.BACKSLASH_ESCAPE, t, l, r]
        }, {
          begin: /([fF][rR]|[rR][fF]|[fF])"""/,
          end: /"""/, contains: [e.BACKSLASH_ESCAPE, t, l, r]
        }, {
          begin: /([uU]|[rR])'/, end: /'/,
          relevance: 10
        }, { begin: /([uU]|[rR])"/, end: /"/, relevance: 10 }, {
          begin: /([bB]|[bB][rR]|[rR][bB])'/, end: /'/
        }, {
          begin: /([bB]|[bB][rR]|[rR][bB])"/,
          end: /"/
        }, {
          begin: /([fF][rR]|[rR][fF]|[fF])'/, end: /'/,
          contains: [e.BACKSLASH_ESCAPE, l, r]
        }, {
          begin: /([fF][rR]|[rR][fF]|[fF])"/, end: /"/,
          contains: [e.BACKSLASH_ESCAPE, l, r]
        }, e.APOS_STRING_MODE, e.QUOTE_STRING_MODE]
      }, o = "[0-9](_?[0-9])*", c = `(\\b(${o}))?\\.(${o})|\\b(${o})\\.`, d = "\\b|" + i.join("|"), g = {
        className: "number", relevance: 0, variants: [{
          begin: `(\\b(${o})|(${c}))[eE][+-]?(${o})[jJ]?(?=${d})`
        }, { begin: `(${c})[jJ]?` }, {
          begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${d})`
        }, {
          begin: `\\b0[bB](_?[01])+[lL]?(?=${d})`
        }, {
          begin: `\\b0[oO](_?[0-7])+[lL]?(?=${d})`
        }, { begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${d})` }, {
          begin: `\\b(${o})[jJ](?=${d})`
        }]
      }, p = {
        className: "comment", begin: n.lookahead(/# type:/), end: /$/, keywords: s,
        contains: [{ begin: /# type:/ }, { begin: /#/, end: /\b\B/, endsWithParent: !0 }]
      }, m = {
        className: "params", variants: [{ className: "", begin: /\(\s*\)/, skip: !0 }, {
          begin: /\(/,
          end: /\)/, excludeBegin: !0, excludeEnd: !0, keywords: s,
          contains: ["self", t, g, b, e.HASH_COMMENT_MODE]
        }]
      }; return r.contains = [b, g, t], {
        case_insensitive: true, // language is case-insensitive
        name: "psi4", aliases: ["py", "gyp", "ipython"], unicodeRegex: !0, keywords: s,
        illegal: /(<\/|->|\?)|=>/, contains: [t, g, { begin: /\bself\b/ }, {
          beginKeywords: "if",
          relevance: 0
        }, b, p, e.HASH_COMMENT_MODE, {
            match: [/\bdef/, /\s+/, a], scope: {
              1: "keyword", 3: "title.function"
            }, contains: [m]
          }, {
            variants: [{
              match: [/\bclass/, /\s+/, a, /\s*/, /\(\s*/, a, /\s*\)/]
            }, { match: [/\bclass/, /\s+/, a] }],
            scope: { 1: "keyword", 3: "title.class", 6: "title.class.inherited" }
          }, {
            className: "meta", begin: /^[\t ]*@/, end: /(?=#)|$/, contains: [g, m, b]
          }]
      }
    }
  })()
    ; hljs.registerLanguage("psi4", e)
})();
