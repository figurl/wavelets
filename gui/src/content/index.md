# Lossy Time Series Compression for Electrophysiology

With the increasing sizes of data for extracellular electrophysiology, it is crucial to develop efficient methods for compressing multi-channel time series data. While lossless methods are desirable for perfectly preserving the original signal, the compression ratios for these methods usually range only from 2-4x. What is needed are ratios on the order of 10-30x, leading us to consider lossy methods.

In this site, we explore and analyze three methods for lossy compression of time series data which we call:

- Quantized Fourier Compression (QFC)
- Quantized Wavelet Compression (QWC)
- Quantized Time Domain Compression (QTC)

All three methods involve the following steps for compression:

- Transform the time series data to a different domain (or keep them in the time domain for QTC)
- Quantize the transformed data in order to lower the information energy (this is where the loss occurs)
- Compress the quantized data using a lossless method such as zlib

Then to reconstruct an approximation of the original signal, the following steps are taken:

- Decompress the quantized data
- Transform the data back to the time domain (or keep them in the time domain for QTC)

For QFC, the transform is the Discrete Fourier Transform (DFT), for QWC it is the Discrete Wavelet Transform (DWT), and for QTC it is the identity transformation. In all cases, quantization involves the choice of a quantization step size, which is a tradeoff between the compression ratio and the error introduced by quantization. The entropy of the system then determines the theoretically achievable compression ratio. The different lossless compression methods (e.g., zlib, ZStandard) will be evaluated to see how close they can get to this theoretical limit.

**Compression of a Gaussian Signal**

We will start by analyzing the compression of a random Gaussian signal with a known noise level. For simplicity, we will start with the Quantized Time Domain Compression (QTC) method.

Let $x_1, x_2, \ldots, x_N$ be the original signal, and $\hat{x}_1, \hat{x}_2, \ldots, \hat{x}_N$ be the quantized approximation of the signal. So we have

$$
\hat{x}_i = \lfloor x_i / q \rceil \cdot q
$$

where $q$ is the quantization step size and $\lfloor \cdot \rceil$ is the rounding operation. The normalized root mean square error (NRMSE) between the original and reconstructed signal is then given by

$$
D(x, \hat{x}) = \frac{1}{\sigma}\sqrt{\frac{1}{N}\sum_{i=1}^{N} (x_i - \hat{x}_i)^2}
$$

where $\sigma$ is the noise level in the original signal. We are interested in the tradeoff between the compression ratio and this error introduced by quantization. As mentioned, the theoretically possible compression ratio is determined by the information entropy. We will assume that the samples are independent and identically distributed (i.i.d.) and that the noise level of the Gaussian signal is $\sigma$. The entropy of a single sample (in bits) is

$$
H_0 = -\sum_{j \in \mathbb{Z}} p(j) \log_2 p(j)
$$

where

$$
p(j) = \frac{1}{\sqrt{2\pi}\sigma} \int_{(j - 0.5)q}^{(j + 0.5)q} e^{-x^2 / 2\sigma^2} dx
$$

$$
=\frac{1}{2}\,\Biggl[
  \mathrm{erf}\!\Bigl(\frac{(j + 0.5)q}{\sqrt{2}\sigma}\Bigr)
  \;-\;
  \mathrm{erf}\!\Bigl(\frac{(j - 0.5)q}{\sqrt{2}\sigma}\Bigr)
\Biggr].
$$

is the probability of the sample having a value at step $j$. The entropy of the signal, or the theoretical required storage size in bits, is then $H = NH_0$ and the theoretical compression ratio is $16 / H_0$, assuming that the original signal is stored as 16-bit integers.

The following plots compare the performance of our three compression methods (QTC, QFC, and QWC) on a Gaussian signal, showing how compression ratio varies with error rate.

```python
# generate-plot
from scripts.compression_ratio_vs_nrmse import show_compression_method_comparison
show_compression_method_comparison("gaussian", use_filter=False, show_theoretical_for_reference=True)
show_compression_method_comparison("gaussian", use_filter=True)
```

<figure>
<figcaption>
<strong>Figure 1:</strong> Compression performance comparison. (A) All methods fall short of the theoretical limit when compressing raw Gaussian signals. (B) Bandpass filtering significantly improves compression performance, particularly for the Fourier (QFC) and wavelet (QWC) methods which are better suited to handle filtered signals.
</figcaption>
</figure>

In this case, the actual compression ratios are significantly lower than the theoretical limit. This is due to that fact that the available lossless methods are suboptimal when the data are random, as they are designed to work with recurring patterns in the data, such as is the case for images and text. The ideal method would be arithmetic coding, which is unfortunately very difficult to implement efficiently in practice.

For an analysis of how these compression methods perform on real electrophysiology data, see our [real data analysis](real_data_analysis).

---

_All calculations for this site are computed live in your browser using [Pyodide](https://pyodide.org/), a Python runtime for the web._
