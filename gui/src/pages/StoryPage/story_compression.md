# Signal Compression

Wavelet compression allows efficient representation of signals by removing less significant wavelet coefficients. The compression quality is measured by:

- **NRMSE (Normalized Root Mean Square Error)**: Measures the difference between original and compressed signals
- **Compression Ratio**: The ratio of original to compressed data size

Here's an example of a Gaussian signal that has been compressed and reconstructed using the db4 wavelet at three different error levels.

<div class="compression-plot" wavelet_name="db4" num_samples="1024" signal_type="gaussian_noise" nrmses="0.1,0.3,0.6"></div>

If we do quantized Fourier compression, we get a similar compression ratio.

<div class="compression-plot" wavelet_name="fourier" num_samples="1024" signal_type="gaussian_noise" nrmses="0.6" transform="fourier"></div>

Now let's apply this to some real electrophysiology data.

With quantized db4 wavelet compression:

<div class="compression-plot" wavelet_name="db4" num_samples="1024" signal_type="real_ephys_1" nrmses="0.1,0.3,0.6"></div>

And quantized Fourier compression:

<div class="compression-plot" wavelet_name="fourier" num_samples="1024" signal_type="real_ephys_1" nrmses="0.6" transform="fourier"></div>

Now with a Bandpass filter for the db4 wavelet:

<div class="compression-plot" wavelet_name="db4" num_samples="1024" signal_type="real_ephys_1" nrmses="0.6" filt_lowcut="300" filt_highcut="6000"></div>

And for the Fourier transform:

<div class="compression-plot" wavelet_name="fourier" num_samples="1024" signal_type="real_ephys_1" nrmses="0.6" transform="fourier" filt_lowcut="300" filt_highcut="6000"></div>
