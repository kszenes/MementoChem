import BaseProgram from "./base.js"

export default class Psi4Program extends BaseProgram {
  constructor(document) {
    super(document);
    this.commentStr = "#";
    this.templates = {
      DEFAULT: `{{MOLECULE_STRUCTURE}}

{{SET_BLOCK}}

{{COMP_BLOCK}}
{{OUT_BLOCK}}`,
      // TODO: Implement CASSCF by adding `symmetry c1` in molecule block
      CAS: `{{MOLECULE_STRUCTURE}}
  {{RI}}`
    }
  }
  buildCoordsStr() {
    const useFile = this.document.getElementById("file_toggle").checked;
    const charge = parseInt(this.document.getElementById("charge").value);
    const multiplicity = parseInt(this.document.getElementById("multiplicity").value);
    const useBohr = this.document.getElementById("dist_unit").value === "Bohr";
    const calcMethod = this.document.getElementById('calc_param').value;
    const mixGuess = this.document.getElementById('guessmix_toggle').checked;

    // TODO: Implement useFile
    if (useFile) {
      // const fname = this.document.getElementById("xyz_file_name").value;
      // return `  Coord = ${fname}\n  Basis = ${basisSet}`;
    } else {
      const coords = this.document.getElementById("xyz_geom").value
        .split('\n')
        .map(line => '  ' + line) // Add 2 spaces to each line
        .join('\n');

      let template = "molecule {\n";
      const non_default = (charge != 0) || (multiplicity != 1);
      template += non_default ? `  ${charge} ${multiplicity} # charge & multiplicity\n` : "";
      template += useBohr ? "  units bohr\n" : "";

      // TODO: For CASSCF, we need to convert #active to #doubly occupied
      // Also use `mcscf` or (`casscf`) for CASSCF and some `detci` for CASCI
      const requiresC1 = calcMethod.includes("CAS") || mixGuess;
      if (requiresC1) {
        template += "  symmetry c1   # options do not support symmetry\n"
      }

      template += `${coords}\n}`;

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
    const doSOSCF = this.document.getElementById("solver_method").value === "SOSCF";
    const initialGuess = this.document.getElementById("initial_guess").value;
    const doTightConv = this.document.getElementById("tight_conv").checked;

    let inner = `basis ${basisSet.toLowerCase()}`;
    inner += scfType != "Auto" ? `\nreference ${scfType.toLowerCase()}` : "";

    if (initialGuess != "default") {
      inner += `\nguess ${initialGuess}   # initial guess`
    }

    inner += doSOSCF ? "\nsoscf true   # second order SCF solver" : "";


    if (isUnrestriced) {
      // TODO: Symmetry needs to be disabled for mixGuess to be valid
      inner += mixGuess ? "\nguess_mix true   # break alpha beta spin symmetry" : "";

      inner += doStab ? "\nstability_analysis follow   # restart if unstable" : "";

    }

    if (doTightConv) {
      const [etol, gtol] = this.getTightConvCriteria();
      inner += `\ne_convergence ${etol}   # energy criteria`;
      inner += `\nd_convergence ${gtol}   # orbital gradient criteria`;
    }

    if (doDirect && doRI) {
      inner += "\nscf_type dfdirj + cosx   # integral direct + RI"
    } else if (doDirect) {
      inner += "\nscf_type direct   # integral direct"
    } else if (doRI) {
      inner += "\nscf_type df   # density fitted integrals"
    }
    inner += simMethod == "OPTTS" ? "\nopt_type ts   # transition state opt" : "";

    inner = inner.split('\n')
      .map(line => '  ' + line) // Add 2 spaces to each line
      .join('\n');

    return `set {
${inner}
}`;
  }

  buildCompStr() {
    const calcMethod = this.document.getElementById('calc_param').value;
    const simMethod = this.document.getElementById('calc_type').value;
    const dftFunctional = this.document.getElementById('dft_functional').value.toUpperCase();
    const includeFreq = this.document.getElementById('freq_toggle').checked;

    let inner = "";
    if (calcMethod === "HF") {
      inner = '"scf"';
    } else if (calcMethod === "DFT") {
      inner = `"${dftFunctional.toLowerCase()}"`;
    } else if (calcMethod === "CC") {
      const doTriples = this.document.getElementById('cc_excitation').value == "SD_T";
      inner = doTriples ? '"ccsd(t)"' : '"ccsd"';
    } else {
      inner = `"${calcMethod.toLowerCase()}"`;
    }

    let compStr = "";

    let prefix = "";

    switch (simMethod) {
      case 'SP':
        compStr = "energy";
        break;
      case 'OPT':
      case 'OPTTS':
        compStr = "optimize";
        break;
    }

    if (simMethod.includes("OPT") || includeFreq) {
      prefix = `E, wfn = `
      inner += ", return_wfn=True"
    } else {
      prefix = `E = `
    }

    let ret = `${prefix}${compStr}(${inner})`;

    ret += includeFreq ? `\n${prefix}frequency(${inner})` : "";
    return ret;
  }

  buildOutStr() {
    const calcMethod = this.document.getElementById('calc_param').value;
    const calcType = this.document.getElementById('calc_type').value;
    const scfType = this.document.getElementById("scf_type").value;
    const dftFunctional = this.document.getElementById('dft_functional').value.toUpperCase();
    const includeFreq = this.document.getElementById('freq_toggle').checked;

    let calcName = "";
    if (calcMethod === "HF" && scfType != "Auto") {
      calcName = scfType;
    } else if (calcMethod === "DFT" && scfType != "Auto") {
      calcName = dftFunctional;
    } else if (calcMethod === "CCSD_T") {
      calcName = "CCSD(T)";
    } else {
      calcName = calcMethod;
    }

    let simSuffix = "";
    if (calcType === "OPT") {
      simSuffix = "_eq";
    } else if (calcType === "OPTTS") {
      simSuffix = "_ts";
    }

    let ret = "\n# --- Output ---\n" + `print("E${simSuffix}(${calcName}) =", E)`
    if (calcType.startsWith("OPT")) {
      ret += '\nprint("Optimized Geometry")\nprint(np.asarray(wfn.molecule().create_psi4_string_from_molecule()))'
    }
    if (includeFreq) {
      ret += '\nprint("Frequencies")\nprint(np.asarray(wfn.frequencies()))';
    }
    return ret;
  }

  getTemplate(calcMethod) {
    let template;

    if (calcMethod.startsWith("CAS")) {
      template = this.templates.CAS;
    } else {
      template = this.templates[calcMethod] || this.templates.DEFAULT;
    }

    return template;
  }
  generateInputFile() {
    const calcMethod = this.document.getElementById('calc_param').value;

    let template = this.getTemplate(calcMethod);

    const doRI = this.document.getElementById("ri_toggle").checked;
    template = template.replaceAll("{{RI}}", doRI ? "RICD * RI Enabled" : "NOCD * RI Disabled");

    const geomBlock = this.buildCoordsStr();
    template = template.replaceAll("{{MOLECULE_STRUCTURE}}", geomBlock);

    const setBlock = this.buildSetStr();
    template = template.replaceAll("{{SET_BLOCK}}", setBlock);

    const compBlock = this.buildCompStr();
    template = template.replaceAll("{{COMP_BLOCK}}", compBlock);

    template = template.replace("{{OUT_BLOCK}}", this.buildOutStr());

    // Add header
    template = this.getHeader() + template;

    // Update output
    const outputTextArea = this.document.getElementById('output_text');
    if (outputTextArea) {
      const highlightedCode = hljs.highlight(
        `${template}`,
        { language: 'psi4' }
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
    });
    // TODO: Add more guesses
    this._updateSelection("initial_guess", {
      "SAD (default)": "default",
      "Core": "core",
      "Huckel": "huckel",
    })
    // TODO: Add convergence settings
    // this._updateSelection("solver_method", {
    //   "DIIS (default)": "diis",
    //   "SOSCF": "soscf",
    // })
    this._updateSelection("calc_type", {
      "Energy": "SP",
      "Geometry Opt": "OPT",
      "Transition State Opt": "OPTTS"
    });
    this._updateSelection("cc_excitation", {
      "SD": "SD",
      "SD(T)": "SD_T",
    });
    this._updateSelection("active_pt", {
      "": "",
      "CASPT2": "CASPT2"
    })

    // TODO: elements also need to be disabled too!
    // The user won't be able to toggle them otherwise
    // Toggle Elements
    this._enableElem("stability_full");
    this._enableElem("guessmix_full");
    this._enableElem("freq_full");
    this._enableElem("dist_unit_full");
    this._disableElem("mp2_natorb_full");
    this._disableElem("xyz_file_full");
    this._disableElem("freeze_core_full");
  }
}
