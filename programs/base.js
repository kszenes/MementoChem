export default class BaseProgram {
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
