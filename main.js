function updateCalculationType() {
  const calcType = document.getElementById("calc_type").value;
  
  // Hide additional options based on calculation type
  document.getElementById("dft-options").classList.add("d-none");
  document.getElementById("casscf-options").classList.add("d-none");

  // Always update the text area
  updateTextField();
}

function updateCalculationMethod() {
  const calcParam = document.getElementById("calc_param").value;
  
  // Hide all parameter options first
  document.getElementById("dft-options").classList.add("d-none");
  document.getElementById("casscf-options").classList.add("d-none");

  // Show relevant options based on the method chosen
  if (calcParam === "DFT") {
    document.getElementById("dft-options").classList.remove("d-none");
  } else if (calcParam === "CASSCF") {
    document.getElementById("casscf-options").classList.remove("d-none");
  }

  // Always update the text area
  updateTextField();
}

function toggleFileInput() {
  const isChecked = document.getElementById("fileCheckbox").checked;
  if (isChecked) {
    document.getElementById("file-input").classList.remove("d-none");
    document.getElementById("xyz-input").classList.add("d-none");
  } else {
    document.getElementById("file-input").classList.add("d-none");
    document.getElementById("xyz-input").classList.remove("d-none");
  }
}

// Main function to update the right column based on left column inputs
function updateTextField() {
    // Get values from form elements
    const program = document.getElementById('qc_program').value;
    const calcType = document.getElementById('calc_type').value;
    
    // You may need to add more specific inputs based on your actual form
    let formData = {};

    formData.qc_program = program;
    formData.calcType = calcType;
    
    // Get all other form inputs (assuming they exist)
    const formElements = document.getElementById('selectionForm').elements;
    // Collect all form data
    for (let element of formElements) {
        if (element.id) {
            if (element.type === 'checkbox') {
                formData[element.id] = element.checked;
            } else if (element.type === 'select-one' || element.type === 'text' || 
                      element.type === 'textarea' || element.type === 'number') {
                formData[element.id] = element.value;
            }
        }
    }
    
    // Generate the appropriate output for the right column
    let outputText = generateOutput(formData);
    
    // Update the right column text area (assuming there's an element with id 'outputText')
    const outputElement = document.getElementById('outputText');
    if (outputElement) {
        outputElement.value = outputText;
    }
}

// Function to generate output based on form data
function generateOutput(formData) {
    // Customize this function based on your specific needs
    // This is where you'll format the right column text based on the program selected
    
    let output = '';
    
    if (formData.qc_program === 'Orca') {
        output = `! ${formData.calc_type} calculation\n\n`;
        // Add more Orca-specific formatting
    } else if (formData.qc_program === 'Molcas') {
        output = `&GATEWAY\n  ${formData.calc_type}\n`;
        // Add more Molcas-specific formatting
    } else if (formData.qc_program === 'Pyscf') {
        output = `import pyscf\n\n# ${formData.calc_type} calculation\n`;
        // Add more Pyscf-specific formatting
    }
    
    // Add custom geometry section, basis set, etc.
    if (formData.geometry) {k
        output += `\n# Geometry\n${formData.geometry}\n`;
    }
    
    return output;
}

// Function to load basis sets from the text file
async function loadBasisSets() {
  try {
    // Fetch the basis_sets.txt file
    const response = await fetch('./basis_sets.txt');
    const text = await response.text();
    
    // Parse the file
    const lines = text.split('\n');
    
    // Skip the first two comment lines
    const basisSets = [];
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // Extract basis set name (up to column 39) and description (after column 39)
        const name = line.substring(0, 39).trim();
        const description = line.substring(39).trim();
        
        if (name) {
          basisSets.push({ name, description });
        }
      }
    }
    
    // Get the basis_param select element
    const basisSelect = document.getElementById('basis_param');
    
    // Clear existing options
    basisSelect.innerHTML = '';
    
    // Add the parsed basis sets as options
    basisSets.forEach(basisSet => {
      const option = document.createElement('option');
      option.value = basisSet.name.toLowerCase().replace(/\s+/g, ''); // Create a valid value
      option.textContent = basisSet.name;
      option.title = basisSet.description; // Add description as tooltip
      basisSelect.appendChild(option);
    });

    // Select default value
    basisSelect.value = "cc-pvdz";

    
    // Trigger the onchange event to ensure any dependent logic is executed
    if (typeof updateCalculationMethod === 'function') {
      updateCalculationMethod();
    }

  } catch (error) {
    console.error('Error loading basis sets:', error);
  }
}

// Function to load basis sets from the text file
async function loadDFTXC() {
  try {
    // Fetch the basis_sets.txt file
    const response = await fetch('./dft_functionals.txt');
    const text = await response.text();
    
    // Parse the file
    const lines = text.split('\n');
    
    // Skip the first two comment lines
    const functionalSets = [];
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // Extract basis set name (up to column 39) and description (after column 39)
        const name = line.substring(0, 39).trim();
        const description = line.substring(39).trim();
        
        if (name) {
          functionalSets.push({ name, description });
        }
      }
    }
    
    // Get the basis_param select element
    const functionalSelect = document.getElementById('dft_functional');
    
    // Clear existing options
    functionalSelect.innerHTML = '';
    
    // Add the parsed basis sets as options
    functionalSets.forEach(functionalSet => {
      const option = document.createElement('option');
      option.value = functionalSet.name.toLowerCase().replace(/\s+/g, ''); // Create a valid value
      option.textContent = functionalSet.name;
      option.title = functionalSet.description; // Add description as tooltip
      functionalSelect.appendChild(option);
    });

    // Select default value
    functionalSelect.value = "b3lyp";

    
    // Trigger the onchange event to ensure any dependent logic is executed
    if (typeof updateCalculationMethod === 'function') {
      updateCalculationMethod();
    }

  } catch (error) {
    console.error('Error loading basis sets:', error);
  }
}

// Function to update SCF type options based on calculation method
function updateScfTypeOptions() {
  const calcMethod = document.getElementById('calc_param').value;
  const scfTypeSelect = document.getElementById('scf_type');
  
  // Clear existing options
  scfTypeSelect.innerHTML = '';
  
  // Add appropriate options based on calculation method
  if (calcMethod === 'DFT') {
    // DFT options
    const dftOptions = [
      { value: 'RKS', text: 'RKS' },
      { value: 'UKS', text: 'UKS' },
      { value: 'ROKS', text: 'ROKS' }
    ];
    
    dftOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      scfTypeSelect.appendChild(optionElement);
    });
  } else {
    // HF options (default)
    const hfOptions = [
      { value: 'RHF', text: 'RHF' },
      { value: 'UHF', text: 'UHF' },
      { value: 'ROHF', text: 'ROHF' }
    ];
    
    hfOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      scfTypeSelect.appendChild(optionElement);
    });
  }
}

// Define template for different calculation methods
const inputTemplates = {
  DEFAULT: `! {{CALC_TYPE}} {{BASIS_SET}} {{CALC_METHOD}}

* xyz {{CHARGE}} {{MULTIPLICITY}}
{{MOLECULE_STRUCTURE}}
*`,
  HF: `! {{CALC_TYPE}} {{BASIS_SET}}

%scf
  HFTyp {{SCF_TYPE}}
end

* xyz {{CHARGE}} {{MULTIPLICITY}}
{{MOLECULE_STRUCTURE}}
*`,

  DFT: `! {{CALC_TYPE}} {{BASIS_SET}} {{DFT_FUNCTIONAL}}

%scf
  HFTyp {{SCF_TYPE}}
end

* xyz {{CHARGE}} {{MULTIPLICITY}}
{{MOLECULE_STRUCTURE}}
*`,

  CASSCF: `! {{CALC_TYPE}} {{BASIS_SET}}

%casscf
  nel {{ACTIVE_ELECTRONS}}
  norb {{ACTIVE_ORBITALS}}
  mult {{MULTIPLICITY}}
end

* xyz {{CHARGE}} {{MULTIPLICITY}}
{{MOLECULE_STRUCTURE}}
*`
};

function getTemplate(calcMethod) {
  if (calcMethod.startsWith("CC")) {
    let template = inputTemplates["DEFAULT"];
    template = template.replace("{{CALC_METHOD}}", calcMethod);
    return template;
  } else {
    return inputTemplates[calcMethod];
  }
}

// Function to generate input file based on selected parameters
function generateInputFile() {
  // Get selected calculation method
  const calcType = document.getElementById('calc_type').value;

  // Get selected calculation method
  const calcMethod = document.getElementById('calc_param').value;

  // Get frequency calculation checkbox state
  const includeFreq = document.getElementById('freq_checkbox').checked;
  
  // Get selected basis set
  const basisSet = document.getElementById('basis_param').value;

  // Get selected SCF type
  const scfType = document.getElementById('scf_type').value;
  
  // Get molecule structure from the textarea
  const moleculeStructure = document.getElementById('xyz_file').value.trim();
  
  // Get charge and multiplicity (add these fields to your UI if they don't exist)
  const charge = document.getElementById('charge') ? document.getElementById('charge').value : '0';
  const multiplicity = document.getElementById('multiplicity') ? document.getElementById('multiplicity').value : '1';
  
  // Get template for the selected calculation method
  let template = getTemplate(calcMethod);

  // Replace placeholders with actual values
  let calculationType = calcType;
  if (includeFreq) {
    calculationType += " FREQ";
  }
  
  // Replace placeholders with actual values
  template = template.replace('{{CALC_TYPE}}', calculationType);
  template = template.replace('{{BASIS_SET}}', basisSet);
  template = template.replace('{{CHARGE}}', charge);
  template = template.replaceAll('{{MULTIPLICITY}}', multiplicity);
  template = template.replace('{{MOLECULE_STRUCTURE}}', moleculeStructure);
  template = template.replace('{{SCF_TYPE}}', scfType);
  
  // Handle method-specific parameters
  if (calcMethod === 'DFT') {
    const dftFunctional = document.getElementById('dft_functional').value;
    template = template.replace('{{DFT_FUNCTIONAL}}', dftFunctional);
  } else if (calcMethod === 'CASSCF') {
    const activeElectrons = document.getElementById('active_electrons') ? 
                           document.getElementById('active_electrons').value : '3';
    const activeOrbitals = document.getElementById('active_orbitals') ? 
                           document.getElementById('active_orbitals').value : '3';
    template = template.replace('{{ACTIVE_ELECTRONS}}', activeElectrons);
    template = template.replace('{{ACTIVE_ORBITALS}}', activeOrbitals);
  }
  
  // Display the generated input in the right column text box
  const outputTextArea = document.getElementById('output_text');
  outputTextArea.value = template;
}

// Update existing function to generate input file when parameters change
function updateCalculationMethod() {
  const calcMethod = document.getElementById('calc_param').value;
  
  // Show/hide method-specific options
  if (calcMethod === 'DFT') {
    document.getElementById('dft-options').classList.remove('d-none');
    if (document.getElementById('casscf-options')) {
      document.getElementById('casscf-options').classList.add('d-none');
    }
  } else if (calcMethod === 'CASSCF') {
    if (document.getElementById('dft-options')) {
      document.getElementById('dft-options').classList.add('d-none');
    }
    if (document.getElementById('casscf-options')) {
      document.getElementById('casscf-options').classList.remove('d-none');
    }
  } else {
    if (document.getElementById('dft-options')) {
      document.getElementById('dft-options').classList.add('d-none');
    }
    if (document.getElementById('casscf-options')) {
      document.getElementById('casscf-options').classList.add('d-none');
    }
  }
  
  // Generate the input file based on the selected parameters
  generateInputFile();
}

// Add event listeners to form inputs to update the input file when they change
document.addEventListener('DOMContentLoaded', function() {
  // Load basis sets (from the previous solution)
  loadBasisSets();

  // Load dft functionals
  loadDFTXC();
  
  // Add event listeners to all form elements that should trigger an update
  const formElements = [
    'qc_program',
    'calc_type',
    'molecule_structure',
    'charge',
    'multiplicity',
    'dft_functional',
    'active_electrons',
    'active_orbitals',
    'xyz_file',
    'scf_type'
  ];
  
  formElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', generateInputFile);
      element.addEventListener('input', generateInputFile);
    }
  });
  
  // Set initial SCF type options
  updateScfTypeOptions();

  // Initial generation of input file
  generateInputFile();
});
