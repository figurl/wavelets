## Story (WIP)

Here are three levels of db4 wavelet basis vectors.

<div class="wavelet-basis-plot" wavelet_name="db4" levels="0,1,3" num_samples="1024"></div>

To see more examples and to control the wavelet parameters, open the "Wavelets" menu.

Wavelets can be used for lossy compression of timeseries data. Here's an example of a Gaussian signal that has been compressed and reconstructed using the db4 wavelet at three different error levels.

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