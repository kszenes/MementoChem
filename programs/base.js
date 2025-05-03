export default class BaseProgram {
  constructor(document) {
    this.document = document;
    this.commentStr = "*";
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
  _updateSelection(id, opts) {
    const elem = this.document.getElementById(id);
    elem.innerHTML = ""
    Object.keys(opts).forEach(key => {
      const optionElement = document.createElement('option');
      optionElement.value = opts[key];
      optionElement.textContent = key;
      elem.appendChild(optionElement);
    });
  }
  _disableElem(id) {
    const element = this.document.getElementById(id);
    if (element) {
      element.classList.add('d-none');
    }
  }
  _enableElem(id) {
    const element = this.document.getElementById(id);
    if (element) {
      element.classList.remove('d-none');
    }
  }
}
