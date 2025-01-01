# Signal Compression

Wavelet compression allows efficient representation of signals by removing less significant wavelet coefficients. The compression quality is measured by:
- **NRMSE (Normalized Root Mean Square Error)**: Measures the difference between original and compressed signals
- **Compression Ratio**: The ratio of original to compressed data size

The plots below demonstrate signal compression at different NRMSE targets. You can adjust the wavelet type, number of samples to display, and optional frequency filtering. The implementation uses [PyWavelets](https://pywavelets.readthedocs.io/) and [Pyodide](https://pyodide.org/).

<div class="main"></div>
