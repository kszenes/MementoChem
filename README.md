<p align="center">
  <img width="300px" alt="MementoChem Logo" src="https://github.com/user-attachments/assets/ce24bd6a-131c-4c8e-b575-71b4ec75cd9d" />
</p>

## Demo

<p align="center">
  <img width="700px" alt="MementoChem Demo" src="https://github.com/user-attachments/assets/8e689366-127e-4e6d-8501-0b60e5ae25c6" />
</p>


## Description

This repository hosts the source for the website www.mementochem.com, which provides an interface for conveniently and **quickly generating input files for common quantum chemistry programs**.
`MementoChem` is not meant to contain an exhaustive set of options but serves more as a template generator for common calculations.
These can subsequently be adapted by the use their liking.

## Features

`MementoChem` can generate inputs for **single point**, **structure** or **transition state optimization** and **harmonic frequency** calculations.

It supports most of the common electronic structure methods such as **single-reference schemes** (e.g., MP2 and CC) as well as **multi-reference routines** (e.g., CASSCF, CASPT2 and NEVPT2).

It also provides toggles for common options for configuring calculations such as **density-fitting** and **integral-direct** schemes.

In addition, certain calculation types come with **advanced configuration** options that allow the user to modify the solver (by using e.g., a second-order solvers) or tighten the convergence thresholds --- keywords that I always seem to forget.

Finally, `MementoChem` supports common **workflows** such as **generating MP2 natural orbitals** or **checking the stability of an unrestricted solution**.

Currently, it supports a subset of the features from the following programs
- Orca
- PySCF
- OpenMolcas
- Psi4

## Roadmap

The functionality of `MementoChem` is being actively developed, see below.

### TODO

- [ ] Add frozen core
- [ ] Add explicit correlation
- [ ] Add counterpoise correction
- [ ] Add PES scan
- [ ] Add other geometry specification methods besides xyz
- [ ] Frequency calculation for PySCF and OpenMolcas
- [ ] Add input validation (e.g., multiplicity is consistent)
- [ ] Add fcisolver to CAS calculations
- [ ] Add dark mode
- [ ] Add PySCF MCSCF natural orbitals
- [ ] Make sure to print spin contamination for unrestricted methods
- [ ] Add outorb for CASSCF

### DONE

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

## Acknowledgments

- List of basis sets have been taken from [Basis Set Exchange](https://github.com/MolSSI-BSE/basis_set_exchange)
- List of DFT functionals have been adapted from the [ORCA manual](https://www.faccts.de/docs/orca/6.0/manual/contents/detailed/model.html#choice-of-functional)
