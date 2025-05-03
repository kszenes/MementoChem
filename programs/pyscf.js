class PySCFProgram {
  constructor(document) {
    this.document = document;
    this.commentStr = "#";
    this.templates = {
      HF: `from pyscf import gto, scf
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
`,
      // TODO: Add exchange correlation functional
      DFT: `from pyscf import gto, scf
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
`,
      MP2: `from pyscf import gto, scf, mp
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
my_mp = {{MP2_LINE}}
e = my_mp.kernel(){{NATORB_BLOCK}}
`,
      CAS: `from pyscf import gto, scf, mcscf
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
mc = mcscf.{{ORB_ROT}}(mf, {{ACTIVE_ORBITALS}}, {{ACTIVE_ELECTRONS}}){{DENSITY_FIT}}
mc.fcisolver.nroots = {{ACTIVE_NROOTS}}
mc.kernel(){{PT_STRING}}
`,
      CCSD: `from pyscf import gto, scf, cc
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
mycc = cc.CCSD(mf).run(){{DIRECT_BLOCK}}
e_tot = mycc.e_tot`,

      CCSD_T: `from pyscf import gto, scf, cc
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
mycc = cc.CCSD(mf).run(){{DIRECT_BLOCK}}
e_triples = mycc.ccsd_t()
e_tot = mycc.e_tot + e_triples
`
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

    let args_string = ""

    const spin = parseInt(multiplicity) - 1;

    if (parseInt(spin) != 0) {
      args_string += `, spin=${spin}`;
    }

    if (parseInt(charge) != 0) {
      args_string += `, charge=${charge}`;
    }

    if (units.toLowerCase() === "bohr") {
      args_string += `, units="bohr"`;
    }


    if (useFile) {
      const fname = this.document.getElementById("xyz_file_name").value;
      return `\nmol = gto.M(atom="${fname}", basis="${basisSet}"${args_string})\n`;
    } else {
      const coords = this.document.getElementById("xyz_geom").value
      return `
geom = """
${coords}
"""
mol = gto.M(atom=geom, basis="${basisSet}"${args_string})
`;
    }
  }

  buildSCFStr() {
    const scfType = this.document.getElementById("scf_type").value;
    const calcMethod = this.document.getElementById("calc_param").value;

    let scfTemplate = "{{STAB_FUNC}}mf = scf.{{SCF_TYPE}}(mol){{DENSITY_FIT}}.run(){{STAB_RUN}}";

    if (scfType === "Auto") {
      if (calcMethod === "HF") {
        scfTemplate = scfTemplate.replace("{{SCF_TYPE}}", "HF");
      } else if (calcMethod === "DFT") {
        scfTemplate = scfTemplate.replace("{{SCF_TYPE}}", "KS");
      }
    } else {
      scfTemplate = scfTemplate.replace("{{SCF_TYPE}}", scfType);
    }

    if (calcMethod != "HF" || calcMethod != "DFT") {
      scfTemplate = scfTemplate.replace("{{SCF_TYPE}}", "HF");
    }

    const isUnrestriced = this.document.getElementById("scf_type").value.startsWith("U");
    const mixGuess = this.document.getElementById('guessmix_toggle').checked;
    const doStab = this.document.getElementById('stability_toggle').checked;
    if (isUnrestriced) {
      // TODO: Mix Guess
      if (mixGuess) {
        scfTemplate = scfTemplate.replace("{{MIX_GUESS}}", " GUESSMIX");

      } else {
        scfTemplate = scfTemplate.replace("{{MIX_GUESS}}", "");
      }

      // Stability analysis
      if (doStab) {
        scfTemplate = scfTemplate.replace("{{STAB_FUNC}}", `def stable_opt_internal(mf):
    mo1, _, stable, _ = mf.stability(return_status=True)
    cyc = 0
    while (not stable and cyc < 10):
        dm1 = mf.make_rdm1(mo1, mf.mo_occ)
        mf = mf{{DENSITY_FIT}}.run(dm1)
        mo1, _, stable, _ = mf.stability(return_status=True)
        cyc += 1
    return mf\n\n`);
        scfTemplate = scfTemplate.replace("{{STAB_RUN}}", "\nstable_opt_internal(mf)");
      } else {
        scfTemplate = scfTemplate.replace("{{STAB_FUNC}}", "").replace("{{STAB_RUN}}", "");
      }
    } else {
      scfTemplate = scfTemplate.replace("{{STAB_FUNC}}", "").replace("{{STAB_RUN}}", "");
    }

    // TODO:
    const doDirect = this.document.getElementById("integral_direct_toggle").checked;

    return scfTemplate;
  }

  getTemplate(calcMethod) {
    let template;
    const doRI = this.document.getElementById('ri_toggle').checked;

    if (calcMethod === "MP2") {
      template = this.templates.MP2;
      const natorb = this.document.getElementById('natorb_toggle').checked;
      if (doRI) {
        template = template.replace("{{MP2_LINE}}", "mp.dfmp2_native.DFRMP2(mol)")
      } else {
        template = template.replace("{{MP2_LINE}}", "mp.MP2(mol)")
      }

      // Natural Orbitals
      template = template.replace("{{NATORB_BLOCK}}", natorb ? "\nnatocc, natorb = my_mp.make_natorbs()" : "");
    } else if (calcMethod.startsWith("CAS")) {
      template = this.templates.CAS;

      template = template.replace("{{ORB_ROT}}", calcMethod);

      // Perturbation theory
      const ptMethod = this.document.getElementById('active_pt').value;
      let ptStr = ptMethod ? "\nmrpt.NEVPT(mc).kernel()" : "";
      template = template.replace("{{PT_STRING}}", ptStr);
    } else if (calcMethod === "HF") {
      template = this.templates.HF;
    } else {
      template = this.templates[calcMethod] || this.templates.DEFAULT;
    }


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

    let template = this.getTemplate(calcMethod);

    const isSCF = (calcMethod === "HF") || (calcMethod === "DFT");
    const scfBlock = this.buildSCFStr();
    template = template.replace("{{SCF_BLOCK}}", scfBlock);

    //     if (doDirect) {
    //       if (!isSCF) {
    //         template = template.replace("{{DIRECT_BLOCK}}", `
    //
    // %scf
    //   SCFMode Direct
    // end`);
    //       }
    //     } else {
    //       template = template.replace("{{DIRECT_BLOCK}}", "");
    //     }

    let calculationType = includeFreq ? `${calcType} FREQ` : calcType;

    // Common replacements
    template = template
      .replace('{{CALC_TYPE}}', calculationType)
      .replace('{{BASIS_SET}}', basisSet)
      .replace('{{CHARGE}}', charge)
      .replaceAll('{{MULTIPLICITY}}', multiplicity)
      .replace('{{MOLECULE_STRUCTURE}}', moleculeStructure)
      .replace('{{UNIT}}', useBohr ? "\n! Bohrs" : "")
      .replaceAll("{{DENSITY_FIT}}", doRI ? ".density_fit()" : "");

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
    } else if (calcMethod.startsWith("CC")) {
      template = template.replace("{{DIRECT_BLOCK}}", doDirect ? `
mycc.direct = true` : "");
    }

    // Update output
    const outputTextArea = this.document.getElementById('output_text');
    if (outputTextArea) outputTextArea.innerHTML = this.formatCodeWithComments(template, this.commentStr);
  }
}

export default PySCFProgram;
