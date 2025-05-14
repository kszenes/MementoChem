import BaseProgram from "./base.js"

export default class OrcaProgram extends BaseProgram {
  constructor(document) {
    super(document);
    this.commentStr = "#";
    this.templates = {
      DEFAULT: `! {{CALC_TYPE}} {{CALC_METHOD}} {{BASIS_SET}}{{FREEZE_CORE}}{{SOSCF}}{{MIX_GUESS}}{{SCF_BLOCK}}
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
      MP2: `! {{CALC_TYPE}} {{CALC_METHOD}} {{BASIS_SET}}{{FREEZE_CORE}}{{SOSCF}}{{MIX_GUESS}}{{SCF_BLOCK}}{{NATORB_BLOCK}}
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`,
      FCI: `! {{CALC_TYPE}} {{BASIS_SET}}{{SOSCF}}{{MIX_GUESS}}{{SCF_BLOCK}}

%casscf
  DoFCI   true{{RI_BLOCK}}
end
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`,
      CAS: `! {{CALC_TYPE}} {{BASIS_SET}}{{FREEZE_CORE}}{{DIRECT_BLOCK}}
{{ORB_ROT}}
%casscf
  nel     {{ACTIVE_ELECTRONS}}
  norb    {{ACTIVE_ORBITALS}}
  mult    {{MULTIPLICITY}}
  nroots  {{ACTIVE_NROOTS}}{{OUTORB}}{{RI_BLOCK}}{{PT_STRING}}
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

    if (useFile) {
      const fname = this.document.getElementById("xyz_file_name").value;
      return `* xyzfile ${charge} ${multiplicity} ${fname}`
    } else {
      const coords = this.document.getElementById("xyz_geom").value
      return `* xyz ${charge} ${multiplicity} # charge & multiplicity
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

    scfTemplate = scfTemplate.replaceAll("{{SCF_TYPE}}", (scfType === "Auto") ? "" : `  HFType ${scfType}\n`);
    scfTemplate = scfTemplate.replaceAll("{{GUESS}}", (initialGuess === "Default") ? "" : `  Guess ${initialGuess}\n`);
    scfTemplate = scfTemplate.replaceAll("{{DIRECT_BLOCK}}", doDirect ? "  SCFMode Direct\n" : "");
    scfTemplate = scfTemplate.replaceAll("{{STAB_STRING}}", doStab ? "  STABPerform true\n  STABRestartUHFifUnstable true # restart if unstable\n" : "");

    if (doTightConv) {
      const [etol, gtol] = this.getTightConvCriteria();
      scfTemplate = scfTemplate.replaceAll("{{TOL}}", `  TolE ${etol}   # energy tolerance
  TolG ${gtol}   # orbital gradient tolerance\n`);
    } else {
      scfTemplate = scfTemplate.replaceAll("{{TOL}}", "")
    }

    return scfTemplate;
  }

  getTemplate(calcMethod) {
    let template;
    const doRI = this.document.getElementById('ri_toggle').checked;

    if (calcMethod === "HF") {
      template = this.templates.HF;
    } else if (calcMethod === "CI") {
      const excRank = this.document.getElementById('ci_excitation').value.replace("_T", "(T)");
      const doFull = excRank === "Full";
      if (doFull) {
        template = this.templates.FCI.replace("{{RI_BLOCK}}", doRI ? "\n  TrafoStep RI" : "");
      } else {
        const quadraticCorrection = this.document.getElementById("quadratic_corr_toggle").checked ? "Q" : "";
        template = this.templates.DEFAULT.replaceAll("{{CALC_METHOD}}", doRI ? `RI-${quadraticCorrection}CI${excRank}` : `${quadraticCorrection}CI${excRank}`);
      }
    } else if (calcMethod.includes("CC")) {
      const excRank = this.document.getElementById('cc_excitation').value.replace("_T", "(T)");
      const locCorrStr = this.document.getElementById('local_corr_toggle').checked ? "DLPNO-" : "";

      template = this.templates.DEFAULT.replaceAll("{{CALC_METHOD}}", doRI ? `RI-${locCorrStr}CC${excRank}` : `${locCorrStr}CC${excRank}`);
    } else if (calcMethod === "MP2") {
      template = this.templates.MP2;
      const natorb = this.document.getElementById('natorb_toggle').checked;
      template = template.replaceAll("{{CALC_METHOD}}", doRI ? "RI-MP2" : "MP2");
      if (natorb) {
        template = template.replaceAll("{{NATORB_BLOCK}}", `

%mp2
  NatOrbs true
end`);
      }
      else {
        template = template.replaceAll("{{NATORB_BLOCK}}", "");
      }
    } else if (calcMethod.startsWith("CAS")) {
      template = this.templates.CAS;
      const doOrbRot = !this.document.getElementById('casci_toggle').checked;
      if (doOrbRot) {
        template = template.replaceAll("{{ORB_ROT}}", "");
      } else {
        template = template.replaceAll("{{ORB_ROT}}", `
! NoIter   # CASCI: no orbital rotation
! MORead   
% MoInp "your-orbitals.gbw"`);
      }

      // Outorb
      const canonicalOrbs = this.document.getElementById("active_outorb").value === "CanonOrbs";
      template = template.replaceAll("{{OUTORB}}", canonicalOrbs ? "\n  ActOrbs CanonOrbs" : "");

      // RI approx
      template = template.replaceAll("{{RI_BLOCK}}", doRI ? "\n\n  TrafoStep RI   # density-fitted integrals" : "");

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
      template = template.replaceAll("{{PT_STRING}}", ptStr);
    } else {
      template = this.templates[calcMethod] || this.templates.DEFAULT;
    }

    // Mix Guess
    const isUnrestriced = this.document.getElementById("scf_type").value.startsWith("U");
    const mixGuess = this.document.getElementById('guessmix_toggle').checked;
    if (isUnrestriced && mixGuess) {
      template = template.replaceAll("{{MIX_GUESS}}", "\n! GuessMix   # break alpha beta spin symmetry");
    } else {
      template = template.replaceAll("{{MIX_GUESS}}", "");
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
    const freezeCore = this.document.getElementById("freeze_core_toggle").checked;

    if (doRI) {
      basisSet += " " + basisSet + "/C";
    }

    let template = this.getTemplate(calcMethod);

    const scfBlock = this.buildSCFStr();
    template = template.replaceAll("{{SCF_BLOCK}}", scfBlock);

    const isCAS = calcMethod.includes("CAS");
    if (doDirect) {
      if (isCAS) {
        template = template.replaceAll("{{DIRECT_BLOCK}}", `

%scf
  SCFMode Direct
end`);
      }
    } else {
      template = template.replaceAll("{{DIRECT_BLOCK}}", "");
    }

    let calculationType = includeFreq ? `${calcType} FREQ` : calcType;

    // Common replacements
    template = template
      .replaceAll('{{CALC_TYPE}}', calculationType)
      .replaceAll('{{BASIS_SET}}', basisSet)
      .replaceAll('{{CHARGE}}', charge)
      .replaceAll('{{MULTIPLICITY}}', multiplicity)
      .replaceAll('{{MOLECULE_STRUCTURE}}', moleculeStructure)
      .replaceAll('{{UNIT}}', useBohr ? "\n! Bohrs" : "")
      .replaceAll("{{SOSCF}}", doSOSCF ? "\n! SOSCF   # second order solver" : "")
      .replaceAll("{{FREEZE_CORE}}", freezeCore ? "" : " nofrozencore");

    // Method-specific replacements
    if (calcMethod === 'DFT') {
      const dftFunctional = this.document.getElementById('dft_functional').value.toUpperCase();
      template = template.replaceAll('{{DFT_FUNCTIONAL}}', dftFunctional);
    } else if (calcMethod.startsWith("CAS")) {
      const activeElectrons = this.document.getElementById('active_electrons')?.value || '6';
      const activeOrbitals = this.document.getElementById('active_orbitals')?.value || '6';
      const activeNroots = this.document.getElementById('active_nroots')?.value || '1';
      template = template
        .replaceAll('{{ACTIVE_ELECTRONS}}', activeElectrons)
        .replaceAll('{{ACTIVE_ORBITALS}}', activeOrbitals)
        .replaceAll('{{ACTIVE_NROOTS}}', activeNroots);
    }

    // Add header
    template = this.getHeader() + template;

    // Update output
    const outputTextArea = this.document.getElementById('output_text');
    if (outputTextArea) {
      const highlightedCode = hljs.highlight(
        `${template}`,
        { language: 'orca' }
      ).value
      outputTextArea.innerHTML = highlightedCode;
    }
  }
  updateCapabilities() {
    // Adapt selection options
    this._updateSelection("calc_param", {
      "HF": "HF",
      "DFT": "DFT",
      "MP2": "MP2",
      "CC": "CC",
      "CI": "CI",
      "CAS (+MRPT)": "CAS",
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
    this._updateSelection("ci_excitation", {
      "SD": "SD",
      "SD(T)": "SD(T)",
      "Full": "Full"
    });
    this._updateSelection("cc_excitation", {
      "D": "D",
      "SD": "SD",
      "SD(T)": "SD_T",
      "SDT": "SDT",
    });
    this._updateSelection("active_outorb", {
      "Natural (Default)": "Default",
      "Canonical": "CanonOrbs",
    });
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
    this._enableElem("dist_unit_full");
    this._enableElem("freeze_core_full");

  }
}
