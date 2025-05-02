export default class ProgramManager {
  constructor(document) {
    this.document = document;
    this.currentProgram = null;
    this.programs = {}; // Stores registered programs (e.g., 'orca', 'gaussian')
    this.forms = [
      'qc_program', 'calc_param', 'basis_param', 'scf_type',
      'calc_type', 'freq_toggle', 'charge',
      'multiplicity', 'xyz_geom', 'dft_functional',
      'active_electrons', 'active_orbitals', 'active_nroots',
      'active_pt', 'natorb_toggle', 'stability_toggle', "ri_toggle", "dist_unit",
      "guessmix_toggle", "file_toggle", "xyz_file_name", "integral_direct_toggle"
    ];
  }

  // Register a new program type
  registerProgram(name, ProgramClass) {
    this.programs[name] = ProgramClass;
  }

  // Switch programs at runtime
  setProgram(name) {
    // Teardown old event listeners
    if (this.currentProgram) {
      this._removeEventListeners();
    }

    // Initialize new program
    const ProgramClass = this.programs[name];
    this.currentProgram = new ProgramClass(this.document);
    this._setupEventListeners();

    // Trigger UI update
    this.currentProgram.generateInputFile();
  }

  // Private: Set up event listeners for the current program
  _setupEventListeners() {

    this.forms.forEach(id => {
      const element = this.document.getElementById(id);
      if (element) {
        element.addEventListener(
          'change',
          this.currentProgram.generateInputFile.bind(this.currentProgram) // Preserve `this`
        );
        if (element.type === 'text' || element.tagName === 'TEXTAREA' || element.type === 'number') {
          element.addEventListener('input', this.currentProgram.generateInputFile.bind(this.currentProgram));
        }
      }
    });
  }

  // Private: Clean up old event listeners
  _removeEventListeners() {

    this.forms.forEach(id => {
      const element = this.document.getElementById(id);
      if (element) {
        element.replaceWith(element.cloneNode(true)); // Quick way to remove all listeners
      }
    });
  }
}
