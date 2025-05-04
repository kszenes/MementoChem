import BaseProgram from "./base.js"

export default class OrcaProgram extends BaseProgram {
  constructor(document) {
    super(document);
    this.commentStr = "#";
    this.templates = {
      DEFAULT: `! {{CALC_TYPE}} {{CALC_METHOD}} {{BASIS_SET}}{{SOSCF}}{{MIX_GUESS}}
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`,
      HF: `! {{CALC_TYPE}} {{BASIS_SET}}{{SOSCF}}{{MIX_GUESS}}{{SCF_BLOCK}}
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`,
      DFT: `! {{CALC_TYPE}} {{BASIS_SET}} {{DFT_FUNCTIONAL}}{{SOSCF}}{{MIX_GUESS}}{{SCF_BLOCK}}
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`,
      MP2: `! {{CALC_TYPE}} {{CALC_METHOD}} {{BASIS_SET}}{{SOSCF}}{{MIX_GUESS}}{{SCF_BLOCK}}{{NATORB_BLOCK}}
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`,
      CAS: `! {{CALC_TYPE}} {{BASIS_SET}}{{DIRECT_BLOCK}}
{{ORB_ROT}}
%casscf
  nel     {{ACTIVE_ELECTRONS}}
  norb    {{ACTIVE_ORBITALS}}
  mult    {{MULTIPLICITY}}
  nroots  {{ACTIVE_NROOTS}}{{RI_BLOCK}}{{PT_STRING}}
end
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`
    }
  }
  buildCoordsStr() {
    const charge = this.document.getElementById("charge").value;
    const multiplicity = this.document.getElementById("multiplicity").value;
    const useFile = this.document.getElementById("file_toggle").checked;
    const doTightConv = this.document.getElementById("tight_conv").checked;

    if (useFile) {
      const fname = this.document.getElementById("xyz_file_name").value;
      return `* xyzfile ${charge} ${multiplicity} ${fname}`
    } else {
      const coords = this.document.getElementById("xyz_geom").value
      return `* xyz ${charge} ${multiplicity}
${coords}
*`
    }
  }

  buildSCFStr() {
    const scfType = this.document.getElementById("scf_type").value;
    const doDirect = this.document.getElementById("integral_direct_toggle").checked;
    const doStab = this.document.getElementById('stability_toggle').checked;
    const doTightConv = this.document.getElementById("tight_conv").checked;
    const initialGuess = this.document.getElementById("initial_guess").value;

    if (scfType === "Auto" && (!doDirect && !doTightConv && (initialGuess === "Default"))) {
        return "";
    }


    let scfTemplate = `

%scf
{{SCF_TYPE}}{{GUESS}}{{DIRECT_BLOCK}}{{STAB_STRING}}{{TOL}}end`

    scfTemplate = scfTemplate.replace("{{SCF_TYPE}}", (scfType === "Auto") ? "" : `  HFType ${scfType}\n`);
    scfTemplate = scfTemplate.replace("{{GUESS}}", (initialGuess === "Default") ? "" : `  Guess ${initialGuess}\n`);
    scfTemplate = scfTemplate.replace("{{DIRECT_BLOCK}}", doDirect ? "  SCFMode Direct\n" : "");
    scfTemplate = scfTemplate.replace("{{STAB_STRING}}", doStab ? "  STABPerform true\n  STABRestartUHFifUnstable true # restart if unstable\n" : "");

    if (doTightConv) {
      const [etol, gtol] = this.getTightConvCriteria();
      scfTemplate = scfTemplate.replace("{{TOL}}", `  TolE ${etol}   # energy tolerance
  TolG ${gtol}   # orbital gradient tolerance\n`);
    } else {
      scfTemplate = scfTemplate.replace("{{TOL}}", "")
    }

    return scfTemplate;
  }

  getTemplate(calcMethod) {
    let template;
    const doRI = this.document.getElementById('ri_toggle').checked;

    if (calcMethod.includes("CC")) {
      calcMethod = calcMethod.replace("_T", "(T)");
      template = this.templates.DEFAULT.replace("{{CALC_METHOD}}", doRI ? `RI-${calcMethod}` : `${calcMethod}`);
    } else if (calcMethod === "MP2") {
      template = this.templates.MP2;
      const natorb = this.document.getElementById('natorb_toggle').checked;
      template = template.replace("{{CALC_METHOD}}", doRI ? "RI-MP2" : "MP2");
      if (natorb) {
        template = template.replace("{{NATORB_BLOCK}}", `

%mp2
  NatOrbs true
%end`);
      }
      else {
        template = template.replace("{{NATORB_BLOCK}}", "");
      }
    } else if (calcMethod.startsWith("CAS")) {
      template = this.templates.CAS;

      if (calcMethod === "CASSCF") {
        template = template.replace("{{ORB_ROT}}", "");
      } else if (calcMethod === "CASCI") {
        template = template.replace("{{ORB_ROT}}", `
!MORead NoIter
%MoInp "your-orbitals.gbw"`);
      }

      // RI approx
      template = template.replace("{{RI_BLOCK}}", doRI ? "\n\n  TrafoStep RI" : "");

      // Perturbation theory
      const ptMethod = this.document.getElementById('active_pt').value;
      let ptStr = "";

      switch (ptMethod) {
        case "SC_NEVPT2":
          ptStr = "\n\n  # strongly contracted\n  PTMethod SC_NEVPT2";
          break;
        case "FIC_NEVPT2":
          ptStr = "\n\n  # fully internally contracted\n  PTMethod FIC_NEVPT2";
          break;
        case "CASPT2":
          ptStr = "\n\n  # fully internally contracted\n";
          ptStr += "  PTMethod FIC_CASPT2\n"
          ptStr += "  PTSettings\n";
          ptStr += "    CASPT2_ishift    0.0     # imaginary shift\n";
          ptStr += "    CASPT2_rshift    0.0     # real shift\n";
          ptStr += "    CASPT2_IPEAshift 0.0";
          break;
      }
      template = template.replace("{{PT_STRING}}", ptStr);
    } else if (calcMethod === "HF") {
      template = this.templates.HF;
    } else {
      template = this.templates[calcMethod] || this.templates.DEFAULT;
    }

    // Mix Guess
    const isUnrestriced = this.document.getElementById("scf_type").value.startsWith("U");
    const mixGuess = this.document.getElementById('guessmix_toggle').checked;
    if (isUnrestriced && mixGuess) {
      template = template.replace("{{MIX_GUESS}}", " GuessMix");
    } else {
      template = template.replace("{{MIX_GUESS}}", "");
    };

    return template;
  }

  // Input Generation Functions
  generateInputFile() {
    const calcType = this.document.getElementById('calc_type').value;
    const calcMethod = this.document.getElementById('calc_param').value;
    const includeFreq = this.document.getElementById('freq_toggle').checked;
    let basisSet = this.document.getElementById('basis_param').value;
    let moleculeStructure = this.buildCoordsStr();
    const charge = this.document.getElementById('charge')?.value || '0';
    const multiplicity = this.document.getElementById('multiplicity')?.value || '1';
    const doRI = this.document.getElementById("ri_toggle").checked;
    const useBohr = this.document.getElementById("dist_unit").value === "Bohr";
    const doDirect = this.document.getElementById("integral_direct_toggle").checked;
    const doSOSCF = this.document.getElementById("solver_method").value === "SOSCF";

    if (doRI) {
      basisSet += " " + basisSet + "/C";
    }

    let template = this.getTemplate(calcMethod);

    const scfBlock = this.buildSCFStr();
    template = template.replace("{{SCF_BLOCK}}", scfBlock);

    const isCAS = calcMethod.includes("CAS");
    if (doDirect) {
      if (isCAS) {
        template = template.replace("{{DIRECT_BLOCK}}", `

%scf
  SCFMode Direct
end`);
      }
    } else {
      template = template.replace("{{DIRECT_BLOCK}}", "");
    }

    let calculationType = includeFreq ? `${calcType} FREQ` : calcType;

    // Common replacements
    template = template
      .replace('{{CALC_TYPE}}', calculationType)
      .replace('{{BASIS_SET}}', basisSet)
      .replace('{{CHARGE}}', charge)
      .replaceAll('{{MULTIPLICITY}}', multiplicity)
      .replace('{{MOLECULE_STRUCTURE}}', moleculeStructure)
      .replace('{{UNIT}}', useBohr ? "\n! Bohrs" : "")
      .replace("{{SOSCF}}", doSOSCF ? " SOSCF": "");

    // Method-specific replacements
    if (calcMethod === 'DFT') {
      const dftFunctional = this.document.getElementById('dft_functional').value.toUpperCase();
      template = template.replace('{{DFT_FUNCTIONAL}}', dftFunctional);
    } else if (calcMethod.startsWith("CAS")) {
      const activeElectrons = this.document.getElementById('active_electrons')?.value || '6';
      const activeOrbitals = this.document.getElementById('active_orbitals')?.value || '6';
      const activeNroots = this.document.getElementById('active_nroots')?.value || '1';
      template = template
        .replace('{{ACTIVE_ELECTRONS}}', activeElectrons)
        .replace('{{ACTIVE_ORBITALS}}', activeOrbitals)
        .replace('{{ACTIVE_NROOTS}}', activeNroots);
    }

    // Add header
    template = this.getHeader() + template;

    // Update output
    const outputTextArea = this.document.getElementById('output_text');
    if (outputTextArea) {
      outputTextArea.innerHTML = this.formatCodeWithComments(template, this.commentStr);
    }
  }
  updateCapabilities() {
    // Adapt selection options
    this._updateSelection("calc_param", {
      "HF": "HF",
      "DFT": "DFT",
      "CASSCF (+MRPT)": "CASSCF",
      "CASCI (+MRPT)": "CASCI",
      "MP2": "MP2",
      "CCSD": "CCSD",
      "CCSD(T)": "CCSD_T",
      "CCSDT": "CCSDT",
      "DLPNO-CCSD": "DLPNO-CCSD",
      "DLPNO-CCSD(T)": "DLPNO-CCSD_T",
    });
    this._updateSelection("initial_guess", {
      "SAD (default)": "Default",
      "Core": "HCore",
      "Huckel": "Hueckel",
    })
    this._updateSelection("calc_type", {
      "Energy": "SP",
      "Geometry Opt": "OPT",
      "Transition State Opt": "OPTTS"
    }
    );
    this._updateSelection("active_pt", {
      "": "",
      "SC_NEVPT2": "SC_NEVPT2",
      "FIC_NEVPT2": "FIC_NEVPT2",
      "CASPT2": "CASPT2"
    });

    // Toggle Elements
    this._enableElem("guessmix_full");
    this._enableElem("freq_full");
    this._enableElem("stability_full");
    this._enableElem("mp2_natorb_full");
    this._enableElem("xyz_file_full");
  }
}
