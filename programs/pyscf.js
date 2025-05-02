class PySCFProgram {
  constructor(document) {
    this.document = document;
    this.commentStr = "#";
    this.templates = {
      DEFAULT: `! {{CALC_TYPE}} {{BASIS_SET}} {{CALC_METHOD}}

* xyz {{CHARGE}} {{MULTIPLICITY}}
{{MOLECULE_STRUCTURE}}
*`,
      // TODO: multiplicity needs to be changed
      HF: `from pyscf import gto, scf
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
`,
      // TODO: Add exchange correlation functional
      DFT: `from pyscf import gto, scf
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
`,
      // TODO: Add natural obrbitals
      MP2: `from pyscf import gto, scf, mp
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
mf.MP2().run()
`,
      CAS: `from pyscf import gto, scf, mcscf
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
mc = mcscf.CASSCF(mf, {{ACTIVE_ORBITALS}}, {{ACTIVE_ELECTRONS}}).run()
`,

    }
  }
  formatCodeWithComments(codeText, commentChar = '#') {
    // Split by newlines and process each line
    return codeText.split('\n').map(line => {
      const commentIndex = line.indexOf(commentChar);

      // If comment character exists
      if (commentIndex !== -1) {
        const codePart = line.slice(0, commentIndex);  // The code before the comment
        const commentPart = line.slice(commentIndex);  // The comment part

        // Retain leading whitespace before the code
        return `${codePart}<span class="comment">${commentPart}</span>`;
      }

      // If no comment character, return the line as it is
      return line;
    }).join('\n');
  }

  buildCoordsStr() {
    const basisSet = this.document.getElementById('basis_param').value;
    const units = this.document.getElementById('dist_unit').value;
    const charge = this.document.getElementById("charge").value;
    const multiplicity = this.document.getElementById("multiplicity").value;
    const useFile = this.document.getElementById("file_toggle").checked;
    if (useFile) {
      const fname = this.document.getElementById("xyz_file_name").value;
      return `\nmol = gto.M(atom="${fname}", basis=${basisSet}, charge="${charge}, spin=${multiplicity}, units="${units.toLowerCase()}")\n`;
    } else {
      const coords = this.document.getElementById("xyz_geom").value
      return `
geom = """
${coords}
"""
mol = gto.M(atom=geom, basis=${basisSet}, charge=${charge}, spin=${multiplicity}, units="${units.toLowerCase()}")
`;
    }
  }

  buildSCFStr() {
    const scfType = this.document.getElementById("scf_type").value;
    const calcMethod = this.document.getElementById("calc_param").value;

    let scfTemplate = `mf = scf.{{SCF_TYPE}}(mol).run()`;


    if (scfType === "Auto") {
      if (calcMethod === "HF") {
        scfTemplate = scfTemplate.replace("{{SCF_TYPE}}", "HF");
      } else if (calcMethod === "DFT") {
        scfTemplate = scfTemplate.replace("{{SCF_TYPE}}", "KS");
      }
    } else {
      scfTemplate = scfTemplate.replace("{{SCF_TYPE}}", scfType);
    }

    // TODO:
    const doDirect = this.document.getElementById("integral_direct_toggle").checked;
    const doStab = this.document.getElementById('stability_toggle').checked;

    return scfTemplate;
  }

  getTemplate(calcMethod) {
    let template;
    const doRI = this.document.getElementById('ri_toggle').checked;

    if (calcMethod.startsWith("CC")) {
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
      template = template.replace("{{MIX_GUESS}}", " GUESSMIX");
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

    if (doRI) {
      basisSet += " " + basisSet + "/C";
    }

    let template = this.getTemplate(calcMethod);

    const isSCF = (calcMethod === "HF") || (calcMethod === "DFT");
    if (isSCF) {
      const scfBlock = this.buildSCFStr();
      template = template.replace("{{SCF_BLOCK}}", scfBlock);
    }

    if (doDirect) {
      if (!isSCF) {
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
      .replace('{{UNIT}}', useBohr ? "\n! Bohrs" : "");

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

    // Update output
    const outputTextArea = this.document.getElementById('output_text');
    if (outputTextArea) outputTextArea.innerHTML = this.formatCodeWithComments(template, this.commentStr);
  }
}

export default PySCFProgram;
