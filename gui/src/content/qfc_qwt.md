# Quantized Fourier Compression (QFC) and Quantized Wavelet Compression (QWC)

Quantized Fourier Compression goes like this:

- Compute the Discrete Fourier Transform (DFT) of the time series data in the time domain.
- Quantize the Fourier coefficients to achieve a target entropy (the entropy determines the theoretically achievable compression ratio). This is done by multiplying by a normalization factor and then rounding to the nearest integer.
- Compress the reduced-entropy quantized Fourier coefficients using a lossy method such as zlib.

To decompress:

- Decompress the quantized Fourier coefficients.
- Divide by the normalization factor.
- Compute the Inverse Discrete Fourier Transform (IDFT) to obtain the reconstructed time series data.

Quantized Wavelet Compression is very similar:

- Compute the Discrete Wavelet Transform (DWT) of the time series data in the time domain.
- Quantize the wavelet coefficients to achieve a target entropy.
- Compress the reduced-entropy quantized wavelet coefficients using a lossy method such as zlib.

To decompress:

- Decompress the quantized wavelet coefficients.
- Divide by the normalization factor.
- Compute the Inverse Discrete Wavelet Transform (IDWT) to obtain the reconstructed time series data.

There is another method, which we don't use in practice but is good for comparison: Quantized Time Domain Compression (QTC). QTC is similar to QFC, but instead of transforming the time series data to the frequency domain, it quantizes the time series data directly.

With both QFC and QWC (QTC), there is a tradeoff between the compression ratio and the error introduced by quantization. The higher the target entropy, the higher the compression ratio but the higher the error.

The error can be quantified using the normalized root mean square error (NRMSE) between the original and reconstructed time series data:

$$
E(x, \hat{x}) = \frac{\sqrt{\sum_{i=1}^{N} (x_i - \hat{x}_i)^2}}{\sigma}
$$

where $x_i$ is the original signal, $\hat{x}_i$ is the reconstructed signal, and $\sigma$ is an estimate of the noise level in the original signal.

Let's analyze this for a random Gaussian signal with a known noise level. For simplicity, we will start with the QTFC method.

```python
# generate-plot
import numpy as np
import zlib
import matplotlib.pyplot as plt

# Generate a random Gaussian signal
np.random.seed(0)
N = 10000
sigma = 1
x = np.random.normal(0, sigma, N)
quantization_factors = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 4, 8, 16]

results = []
for qf in quantization_factors:
    # Quantize the signal
    x_q = np.round(x * qf).astype(np.int32)

    z_q_compressed = zlib.compress(x_q.tobytes())

    compression_factor = len(x) * 2 / len(z_q_compressed)
    nrmse = np.sqrt(np.mean((x - x_q / qf) ** 2)) / sigma

    results.append({
        'quantization_factor': qf,
        'compression_factor': compression_factor,
        'nrmse': nrmse
    })

nrmses = [r['nrmse'] for r in results]
compression_factors = [r['compression_factor'] for r in results]

plt.figure()
plt.plot(nrmses, compression_factors, 'o-')
plt.xlabel('NRMSE')
plt.ylabel('Compression Factor')
plt.loglog()
plt.title('QTC: NRMSE vs Compression Factor')
plt.show()
```
