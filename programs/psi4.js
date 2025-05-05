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
      CAS: `{{MOLECULE_STRUCTURE}}
  {{RI}}

{{SCF_BLOCK}}`
    }
  }
  buildCoordsStr() {
    const useFile = this.document.getElementById("file_toggle").checked;
    const charge = parseInt(this.document.getElementById("charge").value);
    const multiplicity = parseInt(this.document.getElementById("multiplicity").value);
    const useBohr = this.document.getElementById("dist_unit").value === "Bohr";
    // TODO: Implement useFile
    if (useFile) {
      // const fname = this.document.getElementById("xyz_file_name").value;
      // return `  Coord = ${fname}\n  Basis = ${basisSet}`;
    } else {
      const coords = this.document.getElementById("xyz_geom").value
        .split('\n')
        .map(line => '  ' + line) // Add 2 spaces to each line
        .join('\n');
      const non_default = (charge != 0) || (multiplicity != 1);
      const charge_spin = non_default ? `\n  ${charge} ${multiplicity}` : "";
      const units = useBohr ? "\n  units bohr" : "";

      return `molecule {${charge_spin}${units}
${coords}
}`;
    }
  }

  buildSCFStr() {
    let template = `set reference {{scf_type}}`;
    return template;
  }

  buildSetStr() {
    const simMethod = this.document.getElementById('calc_type').value;
    const scfType = this.document.getElementById("scf_type").value;
    const basisSet = this.document.getElementById("basis_param").value;
    const mixGuess = this.document.getElementById('guessmix_toggle').checked;
    const doDirect = this.document.getElementById("integral_direct_toggle").checked;
    const isUnrestriced = this.document.getElementById("scf_type").value.startsWith("U");
    const doStab = this.document.getElementById('stability_toggle').checked;
    const doSOSCF = this.document.getElementById("solver_method").value === "SOSCF";
    const initialGuess = this.document.getElementById("initial_guess").value;
    const doTightConv = this.document.getElementById("tight_conv").checked;

    let inner = `basis ${basisSet.toLowerCase()}\nreference ${scfType.toLowerCase()}`

    if (initialGuess != "default") {
      inner += `\nguess ${initialGuess}   # initial guess`
    }

    inner += doSOSCF ? "\nsoscf true   # second order SCF solver" : "";


    if (isUnrestriced) {
      inner += mixGuess ? "\nguess_mix true   # break alpha beta spin symmetry" : "";
      inner += doStab ? "\nstability_analysis follow   # restart if unstable" : "";

    }

    if (doTightConv) {
      const [etol, gtol] = this.getTightConvCriteria();
      inner += `\ne_convergence ${etol}   # energy criteria`;
      inner += `\nd_convergence ${gtol}   # orbital gradient criteria`;
    }

    inner += doDirect ? "\nscf_type direct   # integral direct method" : "";
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
    switch (calcMethod) {
      case 'HF':
        inner = "scf";
        break;
      case 'DFT':
        inner = `${dftFunctional.toLowerCase()}`;
        break;
      case "CCSD_T":
        inner = "ccsd(t)";
        break;
      default:
        inner = `${calcMethod.toLowerCase()}`;
    }

    let compStr = "";

    switch (simMethod) {
      case 'SP':
        compStr = "energy";
        break;
      case 'OPT':
      case 'OPTTS':
        compStr = "optimize";
        break;
    }

    let ret = `e = ${compStr}("${inner}")`;

    ret += includeFreq ? `\nfrequency("${inner}")` : "";
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
    const calcType = this.document.getElementById('calc_type').value;
    const calcMethod = this.document.getElementById('calc_param').value;

    let template = this.getTemplate(calcMethod);

    const doRI = this.document.getElementById("ri_toggle").checked;
    template = template.replaceAll("{{RI}}", doRI ? "RICD * RI Enabled" : "NOCD * RI Disabled");

    const geomBlock = this.buildCoordsStr();
    template = template.replaceAll("{{MOLECULE_STRUCTURE}}", geomBlock);

    const setBlock = this.buildSetStr();
    template = template.replaceAll("{{SET_BLOCK}}", setBlock);

    const scfBlock = this.buildSCFStr();
    template = template.replaceAll("{{SCF_BLOCK}}", scfBlock);

    const compBlock = this.buildCompStr();
    template = template.replaceAll("{{COMP_BLOCK}}", compBlock);

    let simSuffix = "";
    const calcName = calcMethod === "CCSD_T" ? "CCSD(T)" : calcMethod;
    if (calcType === "OPT") {
      simSuffix = "_eq";
    } else if (calcType === "OPTTS") {
      simSuffix = "_ts";
    }
    template = template.replace("{{OUT_BLOCK}}", `print("E${simSuffix}(${calcName}) =", e) `);

    // Add header
    template = this.getHeader() + template;

    // Update output
    const outputTextArea = this.document.getElementById('output_text');
    if (outputTextArea) {
      outputTextArea.innerHTML = this.formatCodeWithComments(template, this.commentStr);
    }

  }
  updateCapabilities() {
    this._updateSelection("calc_param", {
      "HF": "HF",
      "DFT": "DFT",
      "MP2": "MP2",
      "CCSD": "CCSD",
      "CCSD(T)": "CCSD_T",
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
    this._disableElem("mp2_natorb_full");
    this._disableElem("xyz_file_full");
    this._enableElem("dist_unit_full");
  }
}
