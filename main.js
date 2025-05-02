// DOM Helper Functions
function hideElement(id) {
  const element = document.getElementById(id);
  if (element) element.classList.add('d-none');
}

function showElement(id) {
  const element = document.getElementById(id);
  if (element) element.classList.remove('d-none');
}

function toggleElementVisibility(id, isVisible) {
  const element = document.getElementById(id);
  if (element) {
    element.classList.toggle('d-none', !isVisible);
  }
}

function updateCalculationMethod() {
  const calcMethod = document.getElementById('calc_param').value;
  const scfType = document.getElementById('scf_type').value;

  // Hide all options first
  ['dft-options', 'casscf-options', 'mp2-options', 'unrestricted-options'].forEach(hideElement);

  // Show/hide SCF type based on method
  const scfTypeContainer = document.getElementById('scf-type-container');
  if (calcMethod === 'HF' || calcMethod === 'DFT') {
    scfTypeContainer.classList.remove('d-none');

    // Show stability checkbox only for UHF/UKS
    const showUnrestricted = (calcMethod === 'HF' && scfType === 'UHF') ||
      (calcMethod === 'DFT' && scfType === 'UKS');
    toggleElementVisibility('unrestricted-options', showUnrestricted);
  } else {
    scfTypeContainer.classList.add('d-none');
  }

  // Show relevant options based on method
  switch (calcMethod) {
    case 'DFT':
      showElement('dft-options');
      break;
    case 'CASSCF':
      showElement('casscf-options');
      break;
    case 'MP2':
      showElement('mp2-options');
      break;
  }

  generateInputFile();
}


function toggleFileInput() {
  const isChecked = document.getElementById("file_toggle").checked;
  toggleElementVisibility("xyz_file_field", isChecked);
  toggleElementVisibility("xyz_input_field", !isChecked);
}

// Data Loading Functions
async function loadTextData(url, elementId, defaultValue) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n').slice(2); // Skip first two comment lines

    const data = lines.map(line => {
      const name = line.substring(0, 39).trim();
      const description = line.substring(39).trim();
      return { name, description };
    }).filter(item => item.name);

    const selectElement = document.getElementById(elementId);
    selectElement.innerHTML = '';

    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.name.replace(/\s+/g, '');
      option.textContent = item.name;
      option.title = item.description;
      selectElement.appendChild(option);
    });

    selectElement.value = defaultValue;
    updateCalculationMethod();

  } catch (error) {
    console.error(`Error loading data from ${url}:`, error);
  }
}

// SCF Type Functions
function updateScfTypeOptions() {
  const calcMethod = document.getElementById('calc_param').value;

  if (calcMethod !== 'HF' && calcMethod !== 'DFT') return;

  const scfTypeSelect = document.getElementById('scf_type');
  scfTypeSelect.innerHTML = '';

  const options = calcMethod === 'DFT' ?
    ['RKS', 'UKS', 'ROKS'] :
    ['RHF', 'UHF', 'ROHF'];

  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    scfTypeSelect.appendChild(optionElement);
  });

  // Add change listener to update stability checkbox visibility
  scfTypeSelect.addEventListener('change', function() {
    updateCalculationMethod();
  });
}

function buildCoords() {
  const charge = document.getElementById("charge").value;
  const multiplicity = document.getElementById("multiplicity").value;
  const useFile = document.getElementById("file_toggle").checked;
  if (useFile) {
    const fname = document.getElementById("xyz_file_name").value;
    return `* xyzfile ${charge} ${multiplicity} ${fname}`
  } else {
    const coords = document.getElementById("xyz_geom").value
    return `* xyz ${charge} ${multiplicity}
${coords}
*`
  }
}

const programTemplates = {
  Orca: {
    DEFAULT: `! {{CALC_TYPE}} {{CALC_METHOD}} {{BASIS_SET}}{{DIRECT_BLOCK}}
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`,
    HF: `! {{CALC_TYPE}} {{BASIS_SET}}{{MIX_GUESS}}

%scf
  HFTyp {{SCF_TYPE}}{{DIRECT_BLOCK}}{{STAB_STRING}}
end
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`,
    DFT: `! {{CALC_TYPE}} {{BASIS_SET}} {{DFT_FUNCTIONAL}}{{MIX_GUESS}}

%scf
  HFTyp {{SCF_TYPE}}{{DIRECT_BLOCK}}{{STAB_STRING}}
end
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`,
    MP2: `! {{CALC_TYPE}} {{CALC_METHOD}} {{BASIS_SET}}{{DIRECT_BLOCK}}{{NATORB_BLOCK}}
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`,
    CASSCF: `! {{CALC_TYPE}} {{BASIS_SET}}{{DIRECT_BLOCK}}

%casscf
  nel     {{ACTIVE_ELECTRONS}}
  norb    {{ACTIVE_ORBITALS}}
  mult    {{MULTIPLICITY}}
  nroots  {{ACTIVE_NROOTS}}{{RI_BLOCK}}{{PT_STRING}}
end
{{UNIT}}
{{MOLECULE_STRUCTURE}}
`
  },
  PySCF: {
    DEFAULT: `! {{CALC_TYPE}} {{BASIS_SET}} {{CALC_METHOD}}

* xyz {{CHARGE}} {{MULTIPLICITY}}
{{MOLECULE_STRUCTURE}}
*`,
    // TODO: multiplicity needs to be changed
    HF: `from pyscf import gto, scf
geom="""
{{MOLECULE_STRUCTURE}}
"""
mol = gto.M(atom=geom, basis="{{BASIS_SET}}", charge={{CHARGE}}, spin={{MULTIPLICITY}})
mf = scf.{{SCF_TYPE}}(mol).run()
`,
    // TODO: Add exchange correlation functional
    DFT: `from pyscf import gto, scf
geom="""
{{MOLECULE_STRUCTURE}}
"""
mol = gto.M(atom=geom, basis="{{BASIS_SET}}", charge={{CHARGE}}, spin={{MULTIPLICITY}})
mf = scf.{{SCF_TYPE}}(mol).run()
`,
    // TODO: Add natural obrbitals
    MP2: `from pyscf import gto, scf
geom="""
{{MOLECULE_STRUCTURE}}
"""
mol = gto.M(atom=geom, basis="{{BASIS_SET}}", charge={{CHARGE}}, spin={{MULTIPLICITY}})
mf = scf.{{SCF_TYPE}}(mol).run()
mf.MP2().run()
`,
    CASSCF: `from pyscf import gto, scf, mcscf
geom="""
{{MOLECULE_STRUCTURE}}
"""
mol = gto.M(atom=geom, basis="{{BASIS_SET}}", charge={{CHARGE}}, spin={{MULTIPLICITY}})
mf = scf.{{SCF_TYPE}}(mol).run()
mc = mcscf.CASSCF(mf, {{ACTIVE_ORBITALS}}, {{ACTIVE_ELECTRONS}}).run()
`,
  }
}

function getTemplate(calcMethod) {
  let template;
  const program = document.getElementById('qc_program').value;
  const programTemplate = programTemplates[program];
  const doRI = document.getElementById('ri_toggle').checked;

  if (calcMethod.startsWith("CC")) {
    template = programTemplate.DEFAULT.replace("{{CALC_METHOD}}", doRI ? `RI-${calcMethod}` : `${calcMethod}`);
  } else if (calcMethod === "MP2") {
    template = programTemplate.MP2;
    const natorb = document.getElementById('natorb_toggle').checked;
    template = template.replace("{{CALC_METHOD}}", doRI ? "RI-MP2" : "MP2");
    if (natorb) {
      template = template.replace("{{NATORB_BLOCK}}", `

%mp2
  NatOrb true
%end`);
    }
    else {
      template = template.replace("{{NATORB_BLOCK}}", "");
    }
  } else if (calcMethod === "CASSCF") {
    template = programTemplate.CASSCF;
    template = template.replace("{{RI_BLOCK}}", doRI ? "\n\n  TrafoStep RI" : "");
    const ptMethod = document.getElementById('active_pt').value;
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
    template = programTemplate.HF;
  } else {
    template = programTemplate[calcMethod] || programTemplate.DEFAULT;
  }
  // Stability check
  const doStab = document.getElementById('stability_toggle').checked;
  const isUnrestriced = document.getElementById("scf_type").value.startsWith("U");

  if (isUnrestriced && doStab) {
    template = template.replace("{{STAB_STRING}}", "\n  STABPerform true\n  STABRestartUHFifUnstable true # restart if unstable");
  } else {
    template = template.replace("{{STAB_STRING}}", "");
  }

  // Mix Guess
  const mixGuess = document.getElementById('guessmix_toggle').checked;
  if (isUnrestriced && mixGuess) {
    template = template.replace("{{MIX_GUESS}}", " GUESSMIX");
  } else {
    template = template.replace("{{MIX_GUESS}}", "");
  };

  return template;
}

function formatCodeWithComments(codeText, commentChar = '#') {
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

// Input Generation Functions
function generateInputFile() {
  const calcType = document.getElementById('calc_type').value;
  const calcMethod = document.getElementById('calc_param').value;
  const includeFreq = document.getElementById('freq_toggle').checked;
  let basisSet = document.getElementById('basis_param').value;
  const scfType = document.getElementById('scf_type').value;
  let moleculeStructure = buildCoords();
  const charge = document.getElementById('charge')?.value || '0';
  const multiplicity = document.getElementById('multiplicity')?.value || '1';
  const doRI = document.getElementById("ri_toggle").checked;
  const useBohr = document.getElementById("dist_unit").value === "Bohr";
  const doDirect = document.getElementById("integral_direct_toggle").checked;

  if (doRI) {
    basisSet += " " + basisSet + "/C";
  }

  let template = getTemplate(calcMethod);

  if (doDirect) {
    const isSCF = (calcMethod === "HF") || (calcMethod === "DFT");
    if (isSCF) {
      template = template.replace("{{DIRECT_BLOCK}}", "\n  SCFMode Direct");
    } else {
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
    .replace('{{SCF_TYPE}}', scfType)
    .replace('{{UNIT}}', useBohr ? "\n! Bohrs" : "");

  // Method-specific replacements
  if (calcMethod === 'DFT') {
    const dftFunctional = document.getElementById('dft_functional').value.toUpperCase();
    template = template.replace('{{DFT_FUNCTIONAL}}', dftFunctional);
  } else if (calcMethod === 'CASSCF') {
    const activeElectrons = document.getElementById('active_electrons')?.value || '6';
    const activeOrbitals = document.getElementById('active_orbitals')?.value || '6';
    const activeNroots = document.getElementById('active_nroots')?.value || '1';
    template = template
      .replace('{{ACTIVE_ELECTRONS}}', activeElectrons)
      .replace('{{ACTIVE_ORBITALS}}', activeOrbitals)
      .replace('{{ACTIVE_NROOTS}}', activeNroots);
  }

  // Update output
  const outputTextArea = document.getElementById('output_text');
  if (outputTextArea) outputTextArea.innerHTML = formatCodeWithComments(template);
}

// Clipboard function
function copyToClipboard() {
  const outputText = document.getElementById('output_text');
  if (!outputText) return;

  // Create range and select the text
  const range = document.createRange();
  range.selectNode(outputText);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  try {
    // Execute copy command
    const successful = document.execCommand('copy');
    const copyBtn = document.querySelector('.copy-btn');

    if (successful && copyBtn) {
      // Visual feedback
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }

  // Clean up
  window.getSelection().removeAllRanges();
}

// JavaScript to dynamically adjust padding-bottom based on footer height
function adjustPadding() {
  const footer = document.querySelector('footer.fixed-footer');
  const container = document.querySelector('.container-fluid');
  const footerHeight = footer.offsetHeight;
  container.style.paddingBottom = `${footerHeight}px`;
  container.style.minHeight = `calc(100vh - ${footerHeight}px)`;
}


// In the initializeForm() function, update the formElements array and event listeners:
function initializeForm() {
  // Load data
  // NOTE: CASE SENSITIVE
  loadTextData('./basis_sets.txt', 'basis_param', 'cc-pVDZ');
  loadTextData('./dft_functionals.txt', 'dft_functional', 'B3LYP');

  // Set up event listeners
  const formElements = [
    'qc_program', 'calc_param', 'basis_param', 'scf_type',
    'calc_type', 'freq_toggle', 'charge',
    'multiplicity', 'xyz_geom', 'dft_functional',
    'active_electrons', 'active_orbitals', 'active_nroots',
    'active_pt', 'natorb_toggle', 'stability_toggle', "ri_toggle", "dist_unit",
    "guessmix_toggle", "file_toggle", "xyz_file_name", "integral_direct_toggle"
  ];

  formElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', generateInputFile);
      if (element.type === 'text' || element.tagName === 'TEXTAREA' || element.type === 'number') {
        element.addEventListener('input', generateInputFile);
      }
    }
  });

  // Special case for calc_param
  const calcParamElement = document.getElementById('calc_param');
  if (calcParamElement) {
    calcParamElement.addEventListener('change', function() {
      updateScfTypeOptions();
      updateCalculationMethod();
    });
  }

  const fileToggle = document.getElementById("file_toggle");
  if (fileToggle) {
    fileToggle.addEventListener("change", function() {
      toggleFileInput();
    })
  }

  // Set initial values
  updateScfTypeOptions();
  document.getElementById('xyz_geom').value = "N 0 0 0\nN 0 0 1.098";
  document.getElementById('xyz_file_name').value = "geom.xyz";
  generateInputFile();

  // Set up copy button
  const copyBtn = document.querySelector('.copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyToClipboard);
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeForm);
