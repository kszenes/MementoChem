import OrcaProgram from "./programs/orca.js";
import PySCFProgram from "./programs/pyscf.js";
import MolcasProgram from "./programs/openmolcas.js";
import Psi4Program from "./programs/psi4.js";
import MRCCProgram from "./programs/mrcc.js";
import PeriodicTable from "./periodictable.js"

const programs = {
  Orca: new OrcaProgram(document),
  PySCF: new PySCFProgram(document),
  OpenMolcas: new MolcasProgram(document),
  Psi4: new Psi4Program(document),
  MRCC: new MRCCProgram(document)
};

// DOM Helper Functions
function hideElement(id, uncheck = true) {
  const element = document.getElementById(id);
  if (element) {
    if (uncheck) {
      // Find all child checkboxes within the element
      const checkboxes = element.querySelectorAll('input[type="checkbox"]');

      // Uncheck all child checkboxes
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
    }

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
    options = calcMethod === "DFT" ? ["Auto", "RKS", "UKS"] : ["Auto", "RHF", "UHF", "ROHF"];
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

  // Hide options first
  ["quadratic_corr_full", "local_corr_full"].forEach(hideElement);

  hideElement("accordion_advanced_opts", false);

  if (selectedProgram != "OpenMolcas") {
    showElement("freeze_core_full");
  }
  // Show/hide SCF type based on method
  if (calcMethod === 'HF' || calcMethod === 'DFT') {
    hideElement("freeze_core_full", false);
    // Show stability checkbox only for UHF/UKS
    const showUnrestricted = (calcMethod === 'HF' && scfType === 'UHF') ||
      (calcMethod === 'DFT' && scfType === 'UKS');
    toggleElementVisibility('unrestricted-options', showUnrestricted);
  }

  // Hide element based on calc method type
  if (calcMethod !== "DFT") {
    hideElement("dft-options");
  }
  if (calcMethod !== "MP2") {
    hideElement('mp2-options');
  }
  if (calcMethod !== "CI") {
    hideElement("ci-options");
  }
  if (calcMethod !== "CC") {
    hideElement("cc-options");
  }
  if (!calcMethod.includes("CAS")) {
    hideElement("casscf-options");
    hideElement("active-options");
    if (selectedProgram !== "OpenMolcas") {
      showElement("accordion_advanced_opts");
    }
  }

  // Show relevant options based on method
  if (calcMethod === "DFT") {
    showElement('dft-options');
  } else if (calcMethod === "MP2") {
    if (selectedProgram != "MRCC") {
      // MRCC doesn't have mp2 specific options
      showElement('mp2-options');
    }
    if (selectedProgram === "PySCF" && doRI) {
      hideElement("freeze_core_full");
    }
  } else if (calcMethod.startsWith("CI")) {
    showElement('ci-options');
    const notFullCI = document.getElementById('ci_excitation').value != "Full";
    if (notFullCI) {
      if (["Orca", "Psi4"].includes(selectedProgram)) {
        showElement("quadratic_corr_full");
      }
    } else {
      hideElement("freeze_core_full", false);
    }
  } else if (calcMethod.startsWith("CC")) {
    showElement("cc-options");
  } else if (calcMethod.startsWith("CAS")) {
    showElement("active-options");
    showElement("casscf-options");
    // Hide SCF options
    hideElement('scf-type-container')
    hideElement('unrestricted-options')
  }

  // local correlation logic
  if (["Orca", "MRCC"].includes(selectedProgram)) {
    const notFullCI = document.getElementById('ci_excitation').value != "Full";
    // TODO: Maybe do this for CI as well
    if (["MP2", "CC"].includes(calcMethod)) {
      showElement("local_corr_full");
    }
  }

  getCurrentProgram().generateInputFile();
}

function resetFormToDefaults() {
  // Reset checkboxes to unchecked
  const checkboxesToReset = [
    'ri_toggle', 'integral_direct_toggle', 'natorb_toggle',
    'stability_toggle', 'guessmix_toggle', 'casci_toggle', 'cc_loc_corr_toggle',
    'quadratic_corr_toggle', 'freeze_core_toggle'
  ];

  checkboxesToReset.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.checked = false;
    }
  });

  // Reset selectors to their first option
  const selectorsToReset = ['calc_type', 'active_outorb', 'active_pt'];

  selectorsToReset.forEach(id => {
    const element = document.getElementById(id);
    if (element && element.options.length > 0) {
      element.selectedIndex = 0;
    }
  });
}

function calcModifiedAction() {
  updateScfTypeOptions();
  const selectedProgram = document.getElementById('qc_program').value;
  const calcType = document.getElementById("calc_param").value;
  const ciRank = document.getElementById('ci_excitation').value;
  const ccRank = document.getElementById('cc_excitation').value;

  if (["Orca", "MRCC"].includes(selectedProgram) && ciRank != "Full") {
    document.getElementById("freeze_core_toggle").checked = true;
  }

  if (calcType === "MP2" || (calcType === "CI" && ciRank === "S") || (calcType === "CC" && ccRank === "2")) {
    // Enable density fitting by default for MP2
    document.getElementById("ri_toggle").checked = true;
  }
  updateUI();
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

function buildFilename() {
  const useGeomFile = document.getElementById("file_toggle").checked;
  let molecule = "";

  if (!useGeomFile) {
    // Attempt to extract molecule name
    const geomStr = document.getElementById("xyz_geom").value;

    // Create molecule formula from geometry string
    if (geomStr.trim()) {
      // Split by lines and filter out empty lines
      const lines = geomStr.split('\n').filter(line => line.trim());

      // Extract element types (first word in each line)
      const elements = lines.map(line => line.trim().split(/\s+/)[0])
        .filter(el => el && !el.match(/^\d+$/)); // Filter out any numeric lines (like atom count)

      // Count occurrences of each element
      const elementCounts = elements.reduce((counts, element) => {
        // Use uppercase element symbols for consistency
        const normalizedElement = element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
        counts[normalizedElement] = (counts[normalizedElement] || 0) + 1;
        return counts;
      }, {});

      // Convert counts to a formula string
      molecule = Object.entries(elementCounts)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort elements alphabetically
        .map(([element, count]) => element + (count > 1 ? count : ''))
        .join('');
    }
  } else {
    const xyzFilename = document.getElementById("xyz_file_name").value;
    molecule = xyzFilename.split(".")[0];
  }


  const calcMethod = document.getElementById('calc_param').value;
  const basisSet = document.getElementById('basis_param').value;
  const scfType = document.getElementById("scf_type").value;

  let methodName = "";
  if (calcMethod === "HF") {
    methodName = scfType === "Auto" ? "hf" : `${scfType}`;
  } else if (calcMethod === "DFT") {
    const dftFunctional = document.getElementById('dft_functional').value;
    methodName = `${dftFunctional}`;
    methodName += scfType != "Auto" ? `_${scfType}` : "";
  } else if (calcMethod === "CC") {
    const rank = document.getElementById('cc_excitation').value;
    methodName = calcMethod + rank.replace(/_(.)/g, "($1)").toUpperCase()
  } else if (calcMethod === "CI") {
    const rank = document.getElementById('ci_excitation').value;
    methodName = rank === "Full" ? "FCI" : calcMethod + rank.replace(/_(.)/g, "($1)").toUpperCase();
  } else if (calcMethod.startsWith("CAS")) {
    const doOrbRot = !document.getElementById('casci_toggle').checked;
    const ptMethod = document.getElementById('active_pt').value;
    if (ptMethod) {
      methodName = ptMethod.split('_')[1] + "_";
    } else {
      methodName = doOrbRot ? "casscf_" : "casci_";
    }
    const activeElectrons = document.getElementById('active_electrons')?.value || '6';
    const activeOrbitals = document.getElementById('active_orbitals')?.value || '6';
    methodName += `${activeElectrons}_${activeOrbitals}`;
  } else {
    methodName = calcMethod;
  }

  const filename = `${molecule}_${methodName}_${basisSet}`.toLowerCase();
  return filename;
}

// Download function
function downloadInput() {
  const outputText = document.getElementById('output_text');
  if (!outputText) return;

  const content = outputText.textContent;
  if (!content) return;

  // Determine the file extension based on the program
  const selectedProgram = document.getElementById('qc_program').value;
  let fileExtension = '.inp';

  if (selectedProgram === 'PySCF') {
    fileExtension = '.py';
  }

  // root name
  const root = buildFilename();

  // Create a blob from the text content
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  // Create a temporary link to trigger the download
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `${root}${fileExtension}`;

  // Append to the document, trigger click, and clean up
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // Release the object URL
  URL.revokeObjectURL(url);

  // Visual feedback
  const downloadBtn = document.querySelector('.download-btn');
  if (downloadBtn) {
    downloadBtn.textContent = 'Downloaded!';
    setTimeout(() => {
      downloadBtn.textContent = 'Download';
    }, 2000);
  }
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
    "tight_conv", "solver_method", "initial_guess", "accordion_advanced_opts",
    "ci_excitation", "cc_excitation", "cc_loc_corr_toggle", "casci_toggle",
    "quadratic_corr_toggle", "freeze_core_toggle", "active_outorb", "local_corr_toggle"
  ];

  // Special case for calc_param
  const qcProgram = document.getElementById('qc_program');
  if (qcProgram) {
    qcProgram.addEventListener('change', () => {
      updateScfTypeOptions();
      getCurrentProgram().updateCapabilities();
      calcModifiedAction();
      resetFormToDefaults();
    });
  }

  // Needed to update natorbs when RI is toggled
  document.getElementById('ri_toggle').addEventListener("change", () => {
    updateUI();
  });

  document.getElementById("ci_excitation").addEventListener("change", () => {
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
      calcModifiedAction();
    });
  }

  // Add listeners for CI and CC excitation dropdowns
  const ciExcitationElement = document.getElementById('ci_excitation');
  if (ciExcitationElement) {
    ciExcitationElement.addEventListener('change', function() {
      calcModifiedAction();
    });
  }

  const ccExcitationElement = document.getElementById('cc_excitation');
  if (ccExcitationElement) {
    ccExcitationElement.addEventListener('change', function() {
      calcModifiedAction();
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
  
  // Add validation to XYZ geometry input
  const xyzGeomTextarea = document.getElementById('xyz_geom');
  xyzGeomTextarea.addEventListener('blur', validateXYZInput);
  
  getCurrentProgram().generateInputFile();

  // Set up copy and download buttons
  const copyBtn = document.querySelector('.copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyToClipboard);
  }

  const downloadBtn = document.querySelector('.download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadInput);
  }
}


// Start the application
document.addEventListener('DOMContentLoaded', initializeForm);

// Function to validate XYZ geometry input
function validateXYZInput() {
  const xyzGeomTextarea = document.getElementById('xyz_geom');
  const errorDiv = document.getElementById('xyz_error');
  
  // Get the input text and split into lines, removing empty lines
  const lines = xyzGeomTextarea.value.split('\n').filter(line => line.trim() !== '');
  
  let isValid = true;
  
  // Default error message
  let errMsg = "";
  // Check each line for proper format: element x y z
  let lineNum = 1;
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    
    // Each line should have 4 parts: element and 3 coordinates
    if (parts.length !== 4) {
      isValid = false;
      errMsg = `Line ${lineNum}: Each line should have an element symbol followed by 3 coordinates.`
      break;
    }
    
    // First part should be a valid chemical element symbol
    const elementSymbol = parts[0];
    
    // Normalize element symbol (capitalize first letter, lowercase rest)
    const normalizedElement = elementSymbol.charAt(0).toUpperCase() + elementSymbol.slice(1).toLowerCase();
    
    // Check if it's a valid element in the periodic table
    if (!PeriodicTable[normalizedElement]) {
      errMsg = `Line ${lineNum}: Unkown element type '${normalizedElement}'.` 
      isValid = false;
      break;
    }
    
    // Last 3 parts should be numbers
    for (let i = 1; i < 4; i++) {
      if (isNaN(parseFloat(parts[i]))) {
        errMsg = `Line ${lineNum}: Invalid coordinate '${parts[i]}'.` 
        isValid = false;
        break;
      }
    }
    
    if (!isValid) break;
    lineNum += 1;
  }
  
  // Apply appropriate styling based on validation result
  if (!isValid) {
    xyzGeomTextarea.classList.add('is-invalid');
    errorDiv.style.display = 'block';
    errorDiv.innerHTML = errMsg;
  } else {
    xyzGeomTextarea.classList.remove('is-invalid');
    errorDiv.style.display = 'none';
  }
  
  return isValid;
}

// Toggle light dark mode based on system preference
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeText = document.getElementById("theme-text");

  // Function to apply the system theme preference
  const applySystemTheme = () => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (prefersDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      themeIcon.classList.replace("bi-moon-fill", "bi-sun-fill");
      themeText.textContent = "Light Mode";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      themeIcon.classList.replace("bi-sun-fill", "bi-moon-fill");
      themeText.textContent = "Dark Mode";
    }
  };

  // Apply the system theme on page load
  applySystemTheme();

  // Listen for changes to the system's color scheme preference
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applySystemTheme);

  // Optional: Remove theme toggle button functionality if you only want the system preference
  themeToggle.addEventListener("click", () => {
    // Toggle theme
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "light");
      themeIcon.classList.replace("bi-sun-fill", "bi-moon-fill");
      themeText.textContent = "Dark Mode";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      themeIcon.classList.replace("bi-moon-fill", "bi-sun-fill");
      themeText.textContent = "Light Mode";
    }
  });
});

