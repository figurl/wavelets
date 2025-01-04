# Signal Compression

Quantized Wavelet Compression (QWC) and Quantized Fourier Compression (QFC) compress time series data while preserving key features. Blue shows original signals, orange shows compressed versions. Quality metrics:

- **NRMSE (Normalized Root Mean Square Error)**: Measures the difference between original and compressed signals, normalized by the estimated noise level
- **Compression Ratio**: The ratio of original to compressed data size

[Explore compression](./explore/compression.md)

First, a Gaussian signal compressed with db4 wavelets at different error levels:

<div class="compression-plot" wavelet_name="db4" num_samples="1024" signal_type="gaussian_noise" nrmses="0.1,0.3,0.6"></div>

The same signal with Fourier compression:

<div class="compression-plot" wavelet_name="fourier" num_samples="1024" signal_type="gaussian_noise" nrmses="0.6" transform="fourier"></div>

Applied to real electrophysiology data:

With quantized db4 wavelet compression:

<div class="compression-plot" wavelet_name="db4" num_samples="1024" signal_type="real_ephys_1" nrmses="0.1,0.3,0.6"></div>

And quantized Fourier compression:

<div class="compression-plot" wavelet_name="fourier" num_samples="1024" signal_type="real_ephys_1" nrmses="0.6" transform="fourier"></div>

With bandpass filtering (300-6000 Hz) to focus on relevant frequencies:

<div class="compression-plot" wavelet_name="db4" num_samples="1024" signal_type="real_ephys_1" nrmses="0.6" filt_lowcut="300" filt_highcut="6000"></div>

And with Fourier transform after filtering:

<div class="compression-plot" wavelet_name="fourier" num_samples="1024" signal_type="real_ephys_1" nrmses="0.6" transform="fourier" filt_lowcut="300" filt_highcut="6000"></div>

Both methods achieve good compression, with wavelets typically handling sharp features better. Filtering can improve results by removing noise.
