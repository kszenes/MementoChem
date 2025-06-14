/*! `python` grammar compiled for Highlight.js 11.7.0 */
(() => {
  var e = (() => {
    "use strict"; return e => {
      const n = e.regex, a = /[\p{XID_Start}_]\p{XID_Continue}*/u, i = ["and", "as", "assert", "async", "await", "break", "case", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "match", "nonlocal|10", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield", "M", "HF", "RHF", "UHF", "ROHF", "KS", "RKS", "UKS", "ROKS", "CCSD", "CISD", "FCI", "MP2", "ccsd_t", "CASSCF", "CASCI", "NEVPT", "kernel", "density_fit", "newton", "make_natorbs", "DFRMP2", "DFUMP2", "run", "stability", "make_rdm1", "stable_opt_internal", "make_natural_orbitals", "set_frozen", "state_average", "state_average_", "state_specific_"], s = {
        $pattern: /[A-Za-z]\w+|__\w+__/, keyword: i,
        built_in: ["__import__", "abs", "all", "any", "ascii", "bin", "bool", "breakpoint", "bytearray", "bytes", "callable", "chr", "classmethod", "compile", "complex", "delattr", "dict", "dir", "divmod", "enumerate", "eval", "exec", "filter", "float", "format", "frozenset", "getattr", "globals", "hasattr", "hash", "help", "hex", "id", "input", "int", "isinstance", "issubclass", "iter", "len", "list", "locals", "map", "max", "memoryview", "min", "next", "object", "oct", "open", "ord", "pow", "print", "property", "range", "repr", "reversed", "round", "set", "setattr", "slice", "sorted", "staticmethod", "str", "sum", "super", "tuple", "type", "vars", "atom", "basis", "charge", "spin", "init_guess", "direct", "unit", "nroots", "conv_tol", "conv_tol_grad", "frozen", "xc", "weights"],
        literal: ["__debug__", "Ellipsis", "False", "None", "NotImplemented", "True",],
        type: ["Any", "Callable", "Coroutine", "Dict", "List", "Literal", "Generic", "Optional", "Sequence", "Set", "Tuple", "Type", "Union"]
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
        name: "Python", aliases: ["py", "gyp", "ipython"], unicodeRegex: !0, keywords: s,
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
    ; hljs.registerLanguage("pyscf", e)
})();
