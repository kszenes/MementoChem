# Description

<p align="center">
  <img width="800" alt="Screenshot 2025-05-01 at 23 14 33" src="https://github.com/user-attachments/assets/e832a342-9ac4-45ab-ae29-061259f46624" />
</p>

This repo hosts the website (https://kszenes.github.io/QCMemento/) which allows to generate input files for common quantum chemistry programs.
It has currently limited capabilities (only supports ORCA so far) but will be extended further in the future, see below.

## Roadmap

### TODO

- [ ] Add CASCI (no orbital rotations)
- [ ] Add resolution of identity / cholesky
- [ ] Add PES scan
- [ ] Add other geometry specification methods besides xyz
- [ ] Add other chemistry programs:
  - [ ] OpenMolcas
  - [ ] Psi4
  - [ ] PySCF

### DONE
- [x] Add MRPT2
- [x] Add stability analysis for unrestricted calculations
- [x] Finish MP2 (add natural orbital option)
- [x] Add roots to CASSCF

