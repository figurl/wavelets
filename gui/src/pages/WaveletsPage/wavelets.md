# Wavelets

Wavelets are the building blocks used to represent signals in wavelet analysis. Unlike sine and cosine functions used in Fourier analysis which only capture frequency information, wavelets can capture both frequency and temporal information. Each wavelet vector represents a specific:
- **Scale (level)**: Controls the width/frequency of the wavelet
- **Position (translation)**: Controls where the wavelet is centered

The below graphs show wavelets at different scales and positions. You can use the selection controls to specify the wavelet type and the number of samples in the signal. These are calculated using the [PyWavelets](https://pywavelets.readthedocs.io/) library and [Pyodide](https://pyodide.org/).

---
