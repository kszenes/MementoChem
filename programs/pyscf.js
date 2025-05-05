import BaseProgram from "./base.js"

export default class PySCFProgram extends BaseProgram {
  constructor(document) {
    super(document);
    this.commentStr = "#";
    this.templates = {
      HF: `from pyscf import gto, scf{{OPT_IMPORTS}}
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}{{OPT_BLOCK}}
`,
      // TODO: Add exchange correlation functional
      DFT: `from pyscf import gto, scf
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}{{OPT_BLOCK}}
`,
      MP2: `from pyscf import gto, scf, mp{{DF_IMPORT}}{{OPT_IMPORTS}}
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
mymp = {{MP2_LINE}}
e = mymp.kernel(){{NATORB_BLOCK}}{{OPT_BLOCK}}
`,
      CAS: `from pyscf import gto, scf, mcscf{{PT_IMPORT}}{{OPT_IMPORTS}}
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
mc = mcscf.{{ORB_ROT}}(mf, {{ACTIVE_ORBITALS}}, {{ACTIVE_ELECTRONS}}){{DENSITY_FIT}}
mc.fcisolver.nroots = {{ACTIVE_NROOTS}}
mc.kernel(){{PT_STRING}}{{OPT_BLOCK}}
`,
      CCSD: `from pyscf import gto, scf, cc{{OPT_IMPORTS}}
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
mycc = cc.CCSD(mf){{DIRECT_BLOCK}}
mycc.kernel()
e_tot = mycc.e_tot{{OPT_BLOCK}}`,

      CCSD_T: `from pyscf import gto, scf, cc{{OPT_IMPORTS}}
{{MOLECULE_STRUCTURE}}
{{SCF_BLOCK}}
mycc = cc.CCSD(mf){{DIRECT_BLOCK}}
mycc.kernel()
e_triples = mycc.ccsd_t()
e_tot = mycc.e_tot + e_triples{{OBT_BLOCK}}`,
    }
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
    const initialGuess = this.document.getElementById("initial_guess").value;
    const doTightConv = this.document.getElementById("tight_conv").checked;

    let scfTemplate = "{{STAB_FUNC}}mf = scf.{{SCF_TYPE}}(mol){{SOSCF}}{{DENSITY_FIT}}\n{{GUESS}}{{TOL}}mf.kernel(){{STAB_RUN}}";

    if (scfType === "Auto") {
      if (calcMethod === "HF") {
        scfTemplate = scfTemplate.replaceAll("{{SCF_TYPE}}", "HF");
      } else if (calcMethod === "DFT") {
        scfTemplate = scfTemplate.replaceAll("{{SCF_TYPE}}", "KS");
      }
    } else {
      scfTemplate = scfTemplate.replaceAll("{{SCF_TYPE}}", scfType);
    }

    if (calcMethod != "HF" || calcMethod != "DFT") {
      scfTemplate = scfTemplate.replaceAll("{{SCF_TYPE}}", "HF");
    }

    // Initial guess
    scfTemplate = scfTemplate.replaceAll("{{GUESS}}", (initialGuess != "default") ? `mf.init_guess = "${initialGuess}"\n` : "");
    
    // Tight conv
    if (doTightConv) {
      const [etol, gtol] = this.getTightConvCriteria();
      scfTemplate = scfTemplate.replaceAll("{{TOL}}", `mf.conv_tol = ${etol}        # energy tolerance
mf.conv_tol_grad = ${gtol}   # gradient tolerance\n`, "");
    } else {
      scfTemplate = scfTemplate.replaceAll("{{TOL}}", "");
    }

    const isUnrestriced = this.document.getElementById("scf_type").value.startsWith("U");
    const mixGuess = this.document.getElementById('guessmix_toggle').checked;
    const doStab = this.document.getElementById('stability_toggle').checked;
    if (isUnrestriced) {
      // TODO: Mix Guess
      if (mixGuess) {
        scfTemplate = scfTemplate.replaceAll("{{MIX_GUESS}}", " GUESSMIX");

      } else {
        scfTemplate = scfTemplate.replaceAll("{{MIX_GUESS}}", "");
      }

      // Stability analysis
      if (doStab) {
        scfTemplate = scfTemplate.replaceAll("{{STAB_FUNC}}", `def stable_opt_internal(mf):
    mo1, _, stable, _ = mf.stability(return_status=True)
    cyc = 0
    while (not stable and cyc < 10):
        dm1 = mf.make_rdm1(mo1, mf.mo_occ)
        mf = mf{{DENSITY_FIT}}{{SOSCF}}.run(dm1)
        mo1, _, stable, _ = mf.stability(return_status=True)
        cyc += 1
    return mf\n\n`);
        scfTemplate = scfTemplate.replaceAll("{{STAB_RUN}}", "\nstable_opt_internal(mf)");
      } else {
        scfTemplate = scfTemplate.replaceAll("{{STAB_FUNC}}", "").replaceAll("{{STAB_RUN}}", "");
      }
    } else {
      scfTemplate = scfTemplate.replaceAll("{{STAB_FUNC}}", "").replaceAll("{{STAB_RUN}}", "");
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
      const isSinglet = this.document.getElementById('multiplicity').value === "1";
      const scfType = this.document.getElementById("scf_type").value;
      if (doRI) {
        if ((!isSinglet && scfType === "Auto") || scfType === "UHF") {
          template = template.replaceAll("{{DF_IMPORT}}", "\nfrom pyscf.mp import dfump2_native")
          template = template.replaceAll("{{MP2_LINE}}", "dfump2_native.DFUMP2(mf)")
        } else {
          template = template.replaceAll("{{DF_IMPORT}}", "\nfrom pyscf.mp import dfmp2_native")
          template = template.replaceAll("{{MP2_LINE}}", "dfmp2_native.DFRMP2(mf)")
        }
      } else {
        template = template.replaceAll("{{DF_IMPORT}}", "");
        template = template.replaceAll("{{MP2_LINE}}", "mp.MP2(mf)")
      }

      // Natural Orbitals
      template = template.replaceAll("{{NATORB_BLOCK}}", natorb ? "\nnatocc, natorb = mymp.make_natorbs()" : "");
    } else if (calcMethod.startsWith("CAS")) {
      template = this.templates.CAS;

      template = template.replaceAll("{{ORB_ROT}}", calcMethod);

      // Perturbation theory
      const ptMethod = this.document.getElementById('active_pt').value;
      let ptStr = ptMethod ? "\n\nmrpt.NEVPT(mc).kernel()" : "";
      let ptImport = ptMethod ? ", mrpt" : "";

      template = template.replaceAll("{{PT_STRING}}", ptStr).replaceAll("{{PT_IMPORT}}", ptImport);
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
    const doSOSCF = this.document.getElementById("solver_method").value === "SOSCF";

    let template = this.getTemplate(calcMethod);

    const scfBlock = this.buildSCFStr();
    template = template.replaceAll("{{SCF_BLOCK}}", scfBlock);

    // TODO
    //     if (doDirect) {
    //       const isSCF = (calcMethod === "HF") || (calcMethod === "DFT");
    //       if (!isSCF) {
    //         template = template.replaceAll("{{DIRECT_BLOCK}}", `
    //
    // %scf
    //   SCFMode Direct
    // end`);
    //       }
    //     } else {
    //       template = template.replaceAll("{{DIRECT_BLOCK}}", "");
    //     }

    // TODO:
    let calculationType = includeFreq ? `${calcType} FREQ` : calcType;

    // Common replacements
    template = template
      .replaceAll('{{CALC_TYPE}}', calculationType)
      .replaceAll('{{BASIS_SET}}', basisSet)
      .replaceAll('{{CHARGE}}', charge)
      .replaceAll('{{MULTIPLICITY}}', multiplicity)
      .replaceAll('{{MOLECULE_STRUCTURE}}', moleculeStructure)
      .replaceAll('{{UNIT}}', useBohr ? "\n! Bohrs" : "")
      .replaceAll("{{DENSITY_FIT}}", doRI ? ".density_fit()" : "")
      .replaceAll("{{SOSCF}}", doSOSCF ? ".newton()": "");

    // Method-specific replacements
    if (calcMethod === 'DFT') {
      // TODO: Add support for functional
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
    } else if (calcMethod.startsWith("CC")) {
      template = template.replaceAll("{{DIRECT_BLOCK}}", doDirect ? `
mycc.direct = true` : "");
    }

    if (calcType === "OPT" || calcType === "OPTTS") {
      template = template.replaceAll("{{OPT_IMPORTS}}", "\n# Requires external library `geomeTRIC`, install using `pip`\nfrom pyscf.geomopt.geometric_solver import optimize");
      const suffix = calcType === "OPT" ? "eq" : "ts";
      let methodName = "";
      if (calcMethod === "HF" || calcMethod === "DFT") {
        methodName = "mf";
      } else if (calcMethod === "MP2") {
        methodName = "mymp";
      } else if (calcMethod.includes("CC")) {
        methodName = "mycc";
      } else if (calcMethod.includes("CAS")) {
        methodName = "mc";
      }
      let optTemplate =  `\nmol_${suffix} = ${methodName}.Gradients().optimizer(solver='geomeTRIC').kernel()\nprint(mol_${suffix}.tostring())`;
      if (calcType === "OPTTS") {
        optTemplate = "\nparams = {'transition': True}" + optTemplate;
        optTemplate = optTemplate.replace("kernel()", "kernel(params)");
      }
      template = template.replaceAll("{{OPT_BLOCK}}", optTemplate);
    } else {
      template = template.replaceAll("{{OPT_IMPORTS}}", "");
      template = template.replaceAll("{{OPT_BLOCK}}", "");
    }

    template = this.getHeader() + template;

    // Update output
    const outputTextArea = this.document.getElementById('output_text');
    if (outputTextArea) {
      const highlightedCode = hljs.highlight(
        `${template}`,
        { language: 'python' }
      ).value
      outputTextArea.innerHTML = highlightedCode;
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
      "CCSD(T)": "CCSD_T"
    });
    this._updateSelection("initial_guess", {
      "SAD (default)": "default",
      "Core": "1e",
      "Huckel": "huckel",
    })
    // this._updateSelection("solver_method", {
    //   "DIIS (default)": "DIIS",
    //   "SOSCF": "SOSCF",
    // })
    this._updateSelection("calc_type", {
      "Energy": "SP",
      "Geometry Opt": "OPT",
      "Transition State Opt": "OPTTS"
    }
    );
    this._updateSelection("active_pt", {
      "": "",
      "SC_NEVPT2": "SC_NECPT2"
    })

    // Toggle Elements
    this._disableElem("guessmix_full");
    this._disableElem("freq_full");
    this._enableElem("stability_full");
    this._enableElem("mp2_natorb_full");
    this._enableElem("xyz_file_full");
    this._enableElem("dist_unit_full");
  }
}
