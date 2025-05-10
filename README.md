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
These can subsequently be adapted by the user their liking.

## Features

`MementoChem` can generate inputs for **single point**, **structure** or **transition state optimization** and **harmonic frequency** calculations.

It supports most of the common electronic structure methods such as **single-** (e.g., MP2 and CC) and **multi-reference schemes** (e.g., CASSCF, CASPT2 and NEVPT2).

It also provides buttons to toggle common options for configuring calculations such as enabling **density-fitting** and **integral-direct** schemes.

In addition, SCF calculations come with **advanced configuration** options that allow the user to modify the solver (by using e.g., a second-order solvers) or tighten the convergence thresholds --- keywords that I always seem to forget.

Finally, `MementoChem` supports common **workflows** such as **generating MP2/CASSCF natural orbitals** or **checking the stability of an unrestricted solution**.

Currently, it supports a subset of the features from the following programs (these are the programs that I am most familiar with)
- Orca
- PySCF
- OpenMolcas
- Psi4

## Alternative Utilities

While I haven't extensively used it myself, the [ccinput](https://github.com/cyllab/ccinput) project seems to provide a neat CLI utility for generating input scripts for quantum chemistry programs.
However, it lacks support for multi-configurational calculations, which is my main focus.

## Acknowledgments

- List of basis sets have been taken from [Basis Set Exchange](https://github.com/MolSSI-BSE/basis_set_exchange)
- List of DFT functionals have been adapted from the [ORCA manual](https://www.faccts.de/docs/orca/6.0/manual/contents/detailed/model.html#choice-of-functional)
- Logo was adapted from ChatGPT and benzene molecular orbital was generated using VMD with the help of Evangelista's [vmd_cube](https://github.com/fevangelista/vmd_cube) script.
