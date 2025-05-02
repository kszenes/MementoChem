## Description

<p align="center">
  <img width="700" alt="Screenshot 2025-05-02 at 09 56 34" src="https://github.com/user-attachments/assets/d34f471c-ffd2-4f75-93b9-c10100e5fd4f" />
</p>

This repo hosts the website (https://kszenes.github.io/QCMemento/) which allows to generate input files for common quantum chemistry programs.
It has currently limited capabilities (only supports ORCA so far) but will be extended further in the future, see below.

### Roadmap

#### TODO

- [ ] Add CASCI (no orbital rotations)
- [ ] Add resolution of identity / cholesky
- [ ] Add PES scan
- [ ] Add other geometry specification methods besides xyz
- [ ] Add other chemistry programs:
  - [ ] OpenMolcas
  - [ ] Psi4
  - [ ] PySCF
- [~] Add syntax highlighting

#### DONE
- [x] Add MRPT2
- [x] Add stability analysis for unrestricted calculations
- [x] Finish MP2 (add natural orbital option)
- [x] Add roots to CASSCF

## Credit

- List of basis sets are taken from [Basis Set Exchange](https://github.com/MolSSI-BSE/basis_set_exchange)
- List of DFT functionals are adapted from the [ORCA manual](https://www.faccts.de/docs/orca/6.0/manual/contents/detailed/model.html#choice-of-functional)
