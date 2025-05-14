import BaseProgram from "./base.js"

export default class MRCCrogram extends BaseProgram {
  constructor(document) {
    super(document);
    this.commentStr = "#";
    this.templates = {
      DEFAULT: `{{COMP_BLOCK}}
{{SET_BLOCK}}
{{MOLECULE_STRUCTURE}}
`,
    }
    this.defaultRI = ["MP2", "CC2", "CIS", "CIS(T)"];
  }
  buildMolStr() {
    const useFile = this.document.getElementById("file_toggle").checked;
    const basisSet = this.document.getElementById("basis_param").value;
    const useBohr = this.document.getElementById("dist_unit").value === "Bohr";
    const charge = this.document.getElementById("charge").value;
    const multiplicity = this.document.getElementById("multiplicity").value;
    if (useFile) {
      // TODO: Can you really not specify a file
      exit(1);
      const fname = this.document.getElementById("xyz_file_name").value;
      return `  Coord = ${fname}\n  Basis = ${basisSet}`;
    } else {
      const coords = this.document.getElementById("xyz_geom").value;
      const natoms = coords.split("\n").length;
      let template = `basis=${basisSet.toLowerCase()}\n`;
      template += charge != 0 ? `charge=${charge}\n` : "";
      template += multiplicity != 1 ? `mult=${multiplicity}\n` : "";
      template += useBohr ? "unit=bohr\n" : "";
      template += `geom=xyz\n${natoms}\n\n${coords}`;
      return template;
    }
  }

  buildSetStr() {
    const simMethod = this.document.getElementById('calc_type').value;
    const scfType = this.document.getElementById("scf_type").value;
    const basisSet = this.document.getElementById("basis_param").value;
    const mixGuess = this.document.getElementById('guessmix_toggle').checked;
    const doDirect = this.document.getElementById("integral_direct_toggle").checked;
    const doRI = this.document.getElementById("ri_toggle").checked;
    const isUnrestriced = this.document.getElementById("scf_type").value.startsWith("U");
    const doStab = this.document.getElementById('stability_toggle').checked;
    const doSOSCF = this.document.getElementById("solver_method").value === "soscf";
    const initialGuess = this.document.getElementById("initial_guess").value;
    const doTightConv = this.document.getElementById("tight_conv").checked;
    const freezeCore = this.document.getElementById("freeze_core_toggle").checked;
    const calcMethod = this.document.getElementById('calc_param').value;
    const doLocCorr = this.document.getElementById('local_corr_toggle').checked;

    let inner = "";

    inner += scfType != "Auto" ? `\nscf_type=${scfType.toLowerCase()}` : "";

    if (initialGuess != "default") {
      inner += `\nscfiguess=${initialGuess}   # initial guess`
    }

    inner += doSOSCF ? "\nqscf=on   # quadratic SCF solver" : "";

    inner += (!["HF", "DFT"].includes(calcMethod) && !freezeCore) ? "\ncore=corr   # disable frozen core approx" : "";

    // RI approximation
    if (this.defaultRI.includes(this.getFullMethodName()) && !doRI) {
      inner += "\n# RI approx assumed for method, disable explicitly";
      inner += "\ndfbasis_scf=none\ndfbasis_cor=none";
    }

    // Local correlation
    inner += doLocCorr ? "\nlocalcc=on   # linear scaling local correlation method" : "";

    if (doTightConv) {
      const [etol, gtol] = this.getTightConvCriteria();
      inner += `\nscftol=${etol}   # energy criteria`;
      // TODO: Is there really no orbital gradient
      // inner += `\nd_convergence ${gtol}   # orbital gradient criteria`;
    }

    return inner === "" ? "" : inner + "\n";
  }

  getFullMethodName() {
    const calcMethod = this.document.getElementById('calc_param').value;
    const dftFunctional = this.document.getElementById('dft_functional').value.toUpperCase();
    let methodName = "";
    if (calcMethod === "HF") {
      methodName = "SCF";
    } else if (calcMethod === "DFT") {
      methodName = `${dftFunctional.toUpperCase()}`;
    } else if (calcMethod === "CC") {
      const rank = this.document.getElementById('cc_excitation').value;
      methodName = calcMethod + rank.replace(/_(.)/g, "($1)").toUpperCase()
    } else if (calcMethod === "CI") {
      const rank = this.document.getElementById('ci_excitation').value;
      methodName = rank === "Full" ? "FCI" : calcMethod + rank.replace(/_(.)/g, "($1)").toUpperCase();
    } else {
      methodName = `${calcMethod.toUpperCase()}`;
    }

    const doRI = this.document.getElementById("ri_toggle").checked;
    methodName = doRI ? `RI-${methodName}   # density-fitting enabled` : methodName;
    return methodName;
  }

  buildCompStr() {
    const simMethod = this.document.getElementById('calc_type').value;
    const includeFreq = this.document.getElementById('freq_toggle').checked;

    const methodName = this.getFullMethodName();

    let str = simMethod === "OPT" ? "gopt=full   # geometry optimization\n" : "";
    str += includeFreq ? "freq=on\n" : "";
    str += `calc=${methodName}`;
    return str;
  }

  getTemplate(calcMethod) {
    return this.templates.DEFAULT;
  }

  generateInputFile() {
    const calcMethod = this.document.getElementById('calc_param').value;

    let template = this.getTemplate(calcMethod);

    const geomBlock = this.buildMolStr();
    template = template.replaceAll("{{MOLECULE_STRUCTURE}}", geomBlock);

    const setBlock = this.buildSetStr();
    template = template.replaceAll("{{SET_BLOCK}}", setBlock);

    const compBlock = this.buildCompStr();
    template = template.replaceAll("{{COMP_BLOCK}}", compBlock);

    // Add header
    template = this.getHeader() + template;

    // Update output
    const outputTextArea = this.document.getElementById('output_text');
    if (outputTextArea) {
      const highlightedCode = hljs.highlight(
        `${template}`,
        { language: 'mrcc' }
      ).value
      outputTextArea.innerHTML = highlightedCode;
    }
  }
  updateCapabilities() {
    this._updateSelection("calc_param", {
      "HF": "HF",
      "DFT": "DFT",
      "MP2": "MP2",
      "CC": "CC",
      "CI": "CI"
    });
    // TODO: Add more guesses
    this._updateSelection("initial_guess", {
      "SAD (default)": "default",
      "Core": "core",
    })
    // TODO: Add convergence settings
    this._updateSelection("solver_method", {
      "DIIS (default)": "diis",
      "SOSCF": "soscf",
    })
    this._updateSelection("calc_type", {
      "Energy": "SP",
      // WARN: OPT not available for perturbative methods
      "Geometry Opt": "OPT",
    });
    this._updateSelection("ci_excitation", {
      "S": "S",
      "S(D)": "S_D",
      "SD": "SD",
      "SDT": "SDT",
      "SDTQ": "SDTQ",
      "Full": "Full"
    });
    this._updateSelection("cc_excitation", {
      "2": "2",
      "SD": "SD",
      "SD(T)": "SD_T",
      "SDT": "SDT",
      "SDT(Q)": "SDT_Q",
      "SDTQ": "SDTQ",
      "SDTQP": "SDTQP",
    });
    this._updateSelection("active_pt", {
      "": "",
      "CASPT2": "CASPT2"
    })

    // TODO: elements also need to be disabled too!
    // The user won't be able to toggle them otherwise
    // Toggle Elements
    this._disableElem("stability_full");
    this._disableElem("guessmix_full");
    this._enableElem("freq_full");
    this._enableElem("dist_unit_full");
    this._disableElem("mp2_natorb_full");
    this._disableElem("xyz_file_full");
    this._disableElem("freeze_core_full");
  }
}
