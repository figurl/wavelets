# Lossy Time Series Compression for Electrophysiology

With the increasing sizes of data for extracellular electrophysiology, it is crucial to develop efficient methods for compressing multi-channel time series data. While lossless methods are desirable for perfectly preserving the original signal, the compression ratios for these methods usually range only from 2-4x. What is needed are ratios on the order of 10-30x, leading us to consider lossy methods.

In this site, we explore and analyze three methods for lossy compression of time series data which we call:

- Quantized Fourier Compression (QFC)
- Quantized Wavelet Compression (QWC)
- Quantized Time Domain Compression (QTC)

All three methods involve the following steps for compression:

- Transform the time series data to a different domain (or keep it in the time domain for QTC)
- Quantize the transformed data to lower the information energy (this is where the loss occurs)
- Compress the quantized data using a lossy method such as zlib

The to reconstruct an approximation of the original signal, the following steps are taken:

- Decompress the quantized data
- Transform the data back to the time domain (or keep it in the time domain for QTC)

For QFC, the transform is the Discrete Fourier Transform (DFT), for QWC it is the Discrete Wavelet Transform (DWT), and for QTC it is the identity transformation. In all cases, quantization involves the choice of a quantization step size, which is a tradeoff between the compression ratio and the error introduced by quantization. The entropy of the system then determines the theoretically achievable compression ratio. The different lossless compression methods (e.g., zlib, ZStandard) will be evaluated to see how close they can get to this theoretical limit.

**Compression of a Gaussian Signal**

We will start by analyzing the compression of a random Gaussian signal with a known noise level. For simplicity, we will start with the Quantized Time Domain Compression (QTC) method.

Let $x_1, x_2, \ldots, x_N$ be the original signal, and $\hat{x}_1, \hat{x}_2, \ldots, \hat{x}_N$ be the quantized approximation of the signal. So we have

$$
\hat{x}_i = \lfloor x_i / q \rceil \cdot q
$$

where $q$ is the quantization step size and $\lfloor \cdot \rceil$ is the rounding operation. The normalized root mean square error (NRMSE) between the original and reconstructed signal is then given by

$$
D(x, \hat{x}) = \frac{\sqrt{\sum_{i=1}^{N} (x_i - \hat{x}_i)^2}}{\sigma}
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

is the probability of the sample having a value at step $i$. The entropy of the signal is then $H = NH_0$.

WIP WIP WIP WIP

In Python this is:

```python
import numpy as np
from scipy.special import erf

def p_function(i, q, sigma):
    return 0.5 * (erf((i + 0.5) * q / (2**0.5 * sigma)) - erf((i - 0.5) * q / (2**0.5 * sigma)))

def entropy(q, sigma, N):
    v = round(sigma / q * 20)
    return -N * sum(p_function(i, q, sigma) * np.log2(p_function(i, q, sigma)) for i in range(-v, v + 1) if p_function(i, q, sigma) > 0)

def nrmse(q, sigma):
    x = np.arange(-5 * sigma, 5 * sigma, 0.01)
    p = np.exp(-x**2 / (2 * sigma**2)) / (np.sqrt(2 * np.pi) * sigma)
    p = p / np.sum(p)
    xhat = np.round(x / q) * q
    return np.sqrt(np.sum((x - xhat)**2 * p) / sigma**2)

def simulated_compression_ratio(q, sigma):
    N = 10000
    signal = np.random.normal(0, sigma, N)
    quantized_signal_ints = np.round(signal / q).astype(np.int32)
    buf = quantized_signal_ints.tobytes()
    import zlib
    compressed = zlib.compress(buf, level=9)
    return N * 2 / len(compressed)

qs = np.arange(0.01, 2, 0.01)
entropies = [entropy(q, 1, 1) for q in qs]
compression_ratios = 16 / np.array(entropies)
simulated_compression_ratios = [simulated_compression_ratio(q, 1) for q in qs]
nrmses = [nrmse(q, 1) for q in qs]
simulated_nrmses = [simulated_nrmse(q, 1) for q in qs]

import matplotlib.pyplot as plt
plt.plot(nrmses, compression_ratios, label='Theoretical')
plt.plot(nrmses, simulated_compression_ratios, label='Simulated')
plt.xlabel('NRMSE')
plt.ylabel('Compression Ratio')
plt.show()
```

---

_All calculations for this site are computed live in your browser using [Pyodide](https://pyodide.org/), a Python runtime for the web._
