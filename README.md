<p align="center">
  <img width="800" alt="Screenshot 2025-05-02 at 13 44 08" src="https://github.com/user-attachments/assets/c1f39fee-4f4f-4a41-a0d1-b4f322ea2d5f" />
</p>

## Description

This repo hosts the source for the website https://kszenes.github.io/MementoQC/ which provides an interface for generating input files for common quantum chemistry programs.
It has currently limited capabilities (only supports ORCA so far) but will be extended in the future, see Roadmap below.

### Roadmap

#### TODO

- [ ] Add CASCI (no orbital rotations)
- [ ] Add counterpoise correction
- [ ] Add support for second-order solvers
- [ ] Add advanced settings for SCF (e.g., initial guess, energy convergence criteria)
- [ ] Add support for integral direct methods
- [ ] Add PES scan
- [ ] Add other geometry specification methods besides xyz
- [ ] Add other chemistry programs:
  - [ ] OpenMolcas
  - [ ] Psi4
  - [ ] PySCF
- [ ] Add syntax highlighting
- [ ] Add input validation (e.g., multiplicity makes sense)

#### DONE
- [x] Add MRPT2
- [x] Add stability analysis for unrestricted calculations
- [x] Finish MP2 (add natural orbital option)
- [x] Add roots to CASSCF
- [x] Add resolution of identity / cholesky
- [x] Add UHF guess mix
- [x] Add units for xyz

## Credit

- List of basis sets are taken from [Basis Set Exchange](https://github.com/MolSSI-BSE/basis_set_exchange)
- List of DFT functionals are adapted from the [ORCA manual](https://www.faccts.de/docs/orca/6.0/manual/contents/detailed/model.html#choice-of-functional)
