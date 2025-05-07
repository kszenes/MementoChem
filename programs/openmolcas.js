import BaseProgram from "./base.js"

export default class MolcasProgram extends BaseProgram {
  constructor(document) {
    super(document);
    this.commentStr = "*";
    this.templates = {
      DEFAULT: `&GATEWAY
{{MOLECULE_STRUCTURE}}
`,
    }
  }
  buildCoordsStr() {
    const useFile = this.document.getElementById("file_toggle").checked;
    const basisSet = this.document.getElementById("basis_param").value;
    const calcMethod = this.document.getElementById('calc_param').value;
    if (useFile) {
      const fname = this.document.getElementById("xyz_file_name").value;
      return `  Coord = ${fname}\n  Basis = ${basisSet}`;
    } else {
      const coords = this.document.getElementById("xyz_geom").value
        .split('\n')
        .map(line => '  ' + line) // Add 2 spaces to each line
        .join('\n');
      const natoms = coords.split("\n").length;
      return `  Coord\n  ${natoms}\n\n${coords}\n\n  Basis = ${basisSet}`;
    }
  }
  buildSewardStr() {
    const doDirect = this.document.getElementById("integral_direct_toggle").checked;

    let template = "&SEWARD   * Integral Computation\n"
    template += doDirect ? "  Direct\n" : "";

    return template;
  }

  buildSCFStr() {
    const scfType = this.document.getElementById("scf_type").value;
    const calcMethod = this.document.getElementById("calc_param").value;
    const charge = this.document.getElementById("charge").value;
    const multiplicity = this.document.getElementById("multiplicity").value;
    const dftFunctional = this.document.getElementById('dft_functional').value.toUpperCase();
    const mixGuess = this.document.getElementById('guessmix_toggle').checked;

    let template = `&SCF{{CHARGE_LINE}}{{MULTIPLICITY}}{{DFT_FUNCTIONAL}}{{UNRESTRICTED}}{{MIX_GUESS}}\n`;

    template = template.replaceAll("{{CHARGE_LINE}}", parseInt(charge) != 0 ? `\n  Charge = ${charge}` : "");
    template = template.replaceAll("{{MULTIPLICITY}}", parseInt(multiplicity) != 1 ? `\n  Spin = ${multiplicity}` : "");

    template = template.replaceAll("{{DFT_FUNCTIONAL}}", (calcMethod === "DFT") ? `\n  KSDFT = ${dftFunctional}` : "");
    template = template.replaceAll("{{UNRESTRICTED}}", scfType.startsWith("U") ? "\n  UHF" : "");
    template = template.replaceAll("{{MIX_GUESS}}", (scfType.startsWith("U") && mixGuess) ? "\n  * Adds noise to orbitals (can be used for sym breaking)\n  Scramble = 0.2   * max noise of arcsin(0.2)" : "");


    return template;
  }

  buildCASStr() {
    const activeElectrons = this.document.getElementById('active_electrons')?.value || '6';
    const activeOrbitals = this.document.getElementById('active_orbitals')?.value || '6';
    const activeNroots = this.document.getElementById('active_nroots')?.value || '1';
    const charge = this.document.getElementById("charge").value;
    const doOrbRot = this.document.getElementById("calc_param").value === "CASSCF";

    const rootStr = `${activeNroots} ${activeNroots} 1`

    let template = `&RASSCF{{ORBROT}}
  Nactel  = {{NELEC}}
  RAS2    = {{RAS}}
  CIRoots = {{ROOTS}}   * State-averaged with equal weight
  Charge = {{CHARGE_LINE}}   * Automatically deduces #inactive{{PT}}
`

    template = template


    template = template
      .replaceAll("{{ORBROT}}", doOrbRot ? "" : "\n  CIOnly   * CASCI: No Orbital Rotation")
      .replaceAll("{{CHARGE_LINE}}", charge)
      .replaceAll('{{NELEC}}', activeElectrons)
      .replaceAll('{{RAS}}', activeOrbitals)
      .replaceAll('{{ROOTS}}', rootStr);

    const ptMethod = this.document.getElementById('active_pt').value;
    let ptStr = ""
    if (ptMethod) {
      ptStr = "\n&CASPT2\n";
      ptStr += "  IPEA  = 0.0\n";
      ptStr += "  Imag  = 0.0   * Imaginary Shift\n"
      ptStr += "  Shift = 0.0   * Real Shift"
    }

    template = template.replaceAll("{{PT}}", ptStr);

    return template;

  }

  buildCompStr() {
    const sewardBlock = this.buildSewardStr();
    const scfBlock = this.buildSCFStr();
    const calcMethod = this.document.getElementById('calc_param').value;

    let template = "";

    template += sewardBlock + scfBlock;

    if (calcMethod === "MP2") {
      template += "&MBPT2\n";
    } else if (calcMethod.startsWith("CAS")) {
      const casBlock = this.buildCASStr();
      template += casBlock;
    }
    return template;
  }

  generateInputFile() {
    const symMethod = this.document.getElementById('calc_type').value;
    const calcMethod = this.document.getElementById('calc_param').value;

    let template = this.templates.DEFAULT;



    const geomBlock = this.buildCoordsStr();
    template = template.replaceAll("{{MOLECULE_STRUCTURE}}", geomBlock);

    const doRI = this.document.getElementById("ri_toggle").checked;
    template += doRI ? "  RICD   * RI Enabled\n" : "  NOCD   * RI Disabled\n";
    if (calcMethod.startsWith("CAS")) {
      template += "  * Point Group Symmetry Disabled for CAS\n  Group = C1\n"
    }

    if (symMethod.startsWith("OPT")) {
      template += "\n>>> DO WHILE\n"
    }

    template += "\n";


    const compBlock = this.buildCompStr();
    template += compBlock;

    if (symMethod.startsWith("OPT")) {
      template += "&SLAPAF"
      if (symMethod === "OPTTS") {
        template += "\n  TS   * Transition State Optimization\n"
      } else {
        template += "   * Geometry Optimization\n"

      }
      template += "\n>>> END DO\n"
    }


    // Add header
    template = this.getHeader() + template;

    // Update output
    const outputTextArea = this.document.getElementById('output_text');
    if (outputTextArea) {
      const highlightedCode = hljs.highlight(
        `${template}`, {language: "molcas"}
      ).value
      outputTextArea.innerHTML = highlightedCode;
    }

  }
  updateCapabilities() {
    this._updateSelection("calc_param", {
      "HF": "HF",
      "DFT": "DFT",
      "CASSCF (+MRPT)": "CASSCF",
      "CASCI (+MRPT)": "CASCI",
      "MP2": "MP2",
    });
    this._updateSelection("calc_type", {
      "Energy": "SP",
      "Geometry Opt": "OPT",
      "Transition State Opt": "OPTTS"
    });
    this._updateSelection("active_pt", {
      "": "",
      "CASPT2": "CASPT2"
    })

    // TODO: These need to be turned off as well
    // Toggle Elements
    this._enableElem("guessmix_full");
    this._disableElem("stability_full");
    this._disableElem("freq_full");
    this._disableElem("mp2_natorb_full");
    this._enableElem("xyz_file_full");
    this._disableElem("dist_unit_full");
  }
}
