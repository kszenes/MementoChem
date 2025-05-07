import OrcaProgram from "./programs/orca.js";
import PySCFProgram from "./programs/pyscf.js";
import MolcasProgram from "./programs/openmolcas.js";
import Psi4Program from "./programs/psi4.js";

const programs = {
  Orca: new OrcaProgram(document),
  PySCF: new PySCFProgram(document),
  OpenMolcas: new MolcasProgram(document),
  Psi4: new Psi4Program(document)
};

// DOM Helper Functions
function hideElement(id) {
  const element = document.getElementById(id);
  if (element) {
    // Find all child checkboxes within the element
    const checkboxes = element.querySelectorAll('input[type="checkbox"]');

    // Uncheck all child checkboxes
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    // Apply d-none class to hide the entire element
    element.classList.add('d-none');
  }
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

// SCF Type Functions
function updateScfTypeOptions() {
  const calcMethod = document.getElementById('calc_param').value;

  const scfTypeSelect = document.getElementById('scf_type');
  scfTypeSelect.innerHTML = '';

  const program = document.getElementById('qc_program').value;
  let options;
  if (program === "OpenMolcas") {
    options = calcMethod === "DFT" ? ["RKS", "UKS"] : ["RHF", "UHF"];
  } else if (program === "Psi4") {
    // NOTE: no ROKS in Psi4
    options = calcMethod === "DFT" ? ["RKS", "UKS"] : ["RHF", "UHF", "ROHF"];
  } else {
    options = calcMethod === 'DFT' ?
      ['Auto', 'RKS', 'UKS', 'ROKS'] :
      ['Auto', 'RHF', 'UHF', 'ROHF'];
  }


  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    scfTypeSelect.appendChild(optionElement);
  });

  // Add change listener to update stability checkbox visibility
  scfTypeSelect.addEventListener('change', function() {
    updateUI();
  });
}

function updateUI() {
  const calcMethod = document.getElementById('calc_param').value;
  const scfType = document.getElementById('scf_type').value;
  const selectedProgram = document.getElementById('qc_program').value;
  const doRI = document.getElementById('ri_toggle').checked;

  // Hide all options first
  ['dft-options', 'casscf-options', 'mp2-options', 'unrestricted-options', 'scf-type-container', "accordian_advanced_opts"].forEach(hideElement);

  const scfTypeContainer = document.getElementById('scf-type-container');
  // Show/hide SCF type based on method
  if (!calcMethod.includes("CAS")) {
    scfTypeContainer.classList.remove('d-none');
  }
  if (calcMethod === 'HF' || calcMethod === 'DFT') {

    // Show stability checkbox only for UHF/UKS
    const showUnrestricted = (calcMethod === 'HF' && scfType === 'UHF') ||
      (calcMethod === 'DFT' && scfType === 'UKS');
    toggleElementVisibility('unrestricted-options', showUnrestricted);

    if (selectedProgram != "OpenMolcas") {
      showElement("accordian_advanced_opts");
    }
  }

  // Show relevant options based on method
  switch (calcMethod) {
    case 'DFT':
      showElement('dft-options');
      break;
    case 'CASSCF':
      showElement('casscf-options');
      break;
    case 'CASCI':
      showElement('casscf-options');
      break;
    case 'MP2':
      if ((selectedProgram === "PySCF" && !doRI)) {
        // `make_natorbs` in pyscf not implemented for non-DF MP2
        break;
      }
      showElement('mp2-options');
      break;
  }

  getCurrentProgram().generateInputFile();
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
      option.value = item.name.replaceAll(/\s+/g, '');
      option.textContent = item.name;
      option.title = item.description;
      selectElement.appendChild(option);
    });

    selectElement.value = defaultValue;
    updateUI();

  } catch (error) {
    console.error(`Error loading data from ${url}:`, error);
  }
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

// TODO: Reimplement this, currently unused
// JavaScript to dynamically adjust padding-bottom based on footer height
function adjustPadding() {
  const footer = document.querySelector('footer.fixed-footer');
  const container = document.querySelector('.container-fluid');
  const footerHeight = footer.offsetHeight;
  container.style.paddingBottom = `${footerHeight}px`;
  container.style.minHeight = `calc(100vh - ${footerHeight}px)`;
}

function getCurrentProgram() {
  const selectedProgram = document.getElementById('qc_program').value;
  return programs[selectedProgram]; // Returns the active instance
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
    "guessmix_toggle", "file_toggle", "xyz_file_name", "integral_direct_toggle",
    "tight_conv", "solver_method", "initial_guess", "accordian_advanced_opts"
  ];

  // Special case for calc_param
  const qcProgram = document.getElementById('qc_program');
  if (qcProgram) {
    qcProgram.addEventListener('change', () => {
      updateScfTypeOptions();
      getCurrentProgram().updateCapabilities();
      updateUI();
    });
  }

  // Needed to update natorbs when RI is toggled
  document.getElementById('ri_toggle').addEventListener("change", () => {
    updateUI();
  });

  formElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', () => {
        getCurrentProgram().generateInputFile();
      });
      if (element.type === 'text' || element.tagName === 'TEXTAREA' || element.type === 'number') {
        element.addEventListener('input', () => {
          getCurrentProgram().generateInputFile();
        });
      }
    }
  });

  // Special case for calc_param
  const calcParamElement = document.getElementById('calc_param');
  if (calcParamElement) {
    calcParamElement.addEventListener('change', function() {
      updateScfTypeOptions();
      updateUI();
    });
  }

  const fileToggle = document.getElementById("file_toggle");
  if (fileToggle) {
    fileToggle.addEventListener("change", function() {
      toggleFileInput();
    })
  }

  getCurrentProgram().updateCapabilities()

  // Set initial values
  updateScfTypeOptions();
  document.getElementById('xyz_geom').value = "N 0 0 0\nN 0 0 1.098";
  document.getElementById('xyz_file_name').value = "geom.xyz";
  getCurrentProgram().generateInputFile();

  // Set up copy button
  const copyBtn = document.querySelector('.copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyToClipboard);
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeForm);
