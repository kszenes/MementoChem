<p align="center">
  <img width="800" alt="Screenshot 2025-05-07 at 10 14 48" src="https://github.com/user-attachments/assets/31277548-6dfd-4ba6-ad5f-1951f6aee83c" />
</p>



## Description

This repo hosts the source for the website www.mementochem.com, which provides an interface for generating input files for common quantum chemistry programs.
`MementoChem` is not meant to contain an exhaustive set of options but serves more as a template generator for common calculations, which can subsequently be adapted by the user.
It has currently support (with varying degrees) for
- Orca
- PySCF
- OpenMolcas
- Psi4

 The functionality of `MementoChem` is being actively developed, see Roadmap below.

### Roadmap

#### TODO

- [ ] Add frozen core
- [ ] Add explicit correlation
- [ ] Add counterpoise correction
- [ ] Add PES scan
- [ ] Add other geometry specification methods besides xyz
- [-] Add other chemistry programs:
  - [-] PySCF: Missing frequency calculation
  - [-] OpenMolcas: Missing frequency calculation
- [ ] Add input validation (e.g., multiplicity makes sense)
- [ ] Add fcisolver to CAS calculations
- [ ] Add dark mode

#### DONE

- [x] Psi4
- [x] Add syntax highlighting
- [x] Add CASCI (no orbital rotations)
- [x] Add UHF guess mix
- [x] Add units for xyz
- [x] Support loading from structure from a file
- [x] Add support for integral direct methods
- [x] Add resolution of identity / cholesky
- [x] Add roots to CASSCF
- [x] Finish MP2 (add natural orbital option)
- [x] Add stability analysis for unrestricted calculations
- [x] Add MRPT2
- [x] Add support for second-order solvers
- [x] Add advanced settings for SCF (e.g., initial guess, energy convergence criteria)

## Credit

- List of basis sets are taken from [Basis Set Exchange](https://github.com/MolSSI-BSE/basis_set_exchange)
- List of DFT functionals are adapted from the [ORCA manual](https://www.faccts.de/docs/orca/6.0/manual/contents/detailed/model.html#choice-of-functional)
