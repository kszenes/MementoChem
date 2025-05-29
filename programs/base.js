import PeriodicTable from "../periodictable.js"

export default class BaseProgram {
  constructor(document) {
    this.document = document;
    this.commentStr = "*";
    this.numElec = this.getNumberElec();
  }

  getHeader() {
    return `${this.commentStr} Input Generated using MementoChem\n`;
  }

  buildCoordsStr() {
    throw new Error("Method 'buildCoordsStr()' must be implemented");
  }
  buildSCFStr() {
    throw new Error("Method 'buildSCFStr()' must be implemented");
  }
  getTemplate(calcMethod) {
    throw new Error("Method 'calcMethod()' must be implemented");
  }
  generateInputFile() {
    throw new Error("Method 'generateInputFile()' must be implemented");
  }
  updateCapabilities() {
    throw new Error("Method 'updateCapabilities()' must be implemented");
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
  _updateSelection(id, opts, def = null) {
    const elem = this.document.getElementById(id);
    elem.innerHTML = ""
    Object.keys(opts).forEach(key => {
      const optionElement = document.createElement('option');
      optionElement.value = opts[key];
      optionElement.textContent = key;
      if (def !== null && opts[key] === def) {
        optionElement.selected = true;
      }
      elem.appendChild(optionElement);
    });
  }
  _disableElem(id) {
    const element = this.document.getElementById(id);
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
  _enableElem(id) {
    const element = this.document.getElementById(id);
    if (element) {
      element.classList.remove('d-none');
    }
  }
  getTightConvCriteria() {
    const energyTol = "1e-9";
    const gradTol = "2e-6";
    return [energyTol, gradTol];
  }
  getNumberElec() {
    // First validate the XYZ input using the existing validateXYZInput function from main.js
    if (typeof window.validateXYZInput === 'function') {
      const isValid = window.validateXYZInput();
      if (!isValid) return null;
    }

    const xyzGeomTextarea = this.document.getElementById('xyz_geom');

    // Get the input text and split into lines, removing empty lines
    const lines = xyzGeomTextarea.value.split('\n').filter(line => line.trim() !== '');

    let totalElectrons = 0;

    // Process each line of the geometry
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);

      // Skip if not in the right format
      if (parts.length < 4) continue;

      // First part should be a valid chemical element symbol
      const elementSymbol = parts[0];

      // Normalize element symbol (capitalize first letter, lowercase rest)
      const normalizedElement = elementSymbol.charAt(0).toUpperCase() + elementSymbol.slice(1).toLowerCase();

      // Add atomic number to total electrons
      if (PeriodicTable[normalizedElement]) {
        totalElectrons += PeriodicTable[normalizedElement];
      }
    }

    // Adjust for charge
    const charge = parseInt(this.document.getElementById('charge').value) || 0;
    totalElectrons -= charge; // Subtract charge (negative charge = add electrons)

    return totalElectrons;
  }
  getDoublyOccupied() {
    this.updateNumElec();
    const activeElectrons = this.document.getElementById('active_electrons')?.value || '6';
    const docc = Math.floor((this.numElec - activeElectrons) / 2);

    if ((this.numElec - activeElectrons) % 1) {
      console.log("Cannot doubly occupy, odd number of electrons");
    }
    return docc
  }
  updateNumElec() {
    this.numElec = this.getNumberElec();
  }
}
