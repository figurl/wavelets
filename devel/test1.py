# %%

import pywt
import numpy as np
import matplotlib.pyplot as plt

# Create the Daubechies 4 (db4) wavelet object
wavelet = pywt.Wavelet('db8')

# Get the mother wavelet function and plot it
phi, psi, x = wavelet.wavefun(level=12)  # Level determines the resolution
plt.figure(figsize=(10, 6))

# Plot the scaling function (phi)
plt.subplot(2, 1, 1)
plt.plot(x, phi, label='Scaling Function (φ)')
plt.title("Scaling Function (φ) for db4")
plt.grid()
plt.legend()

# Plot the wavelet function (psi)
plt.subplot(2, 1, 2)
plt.plot(x, psi, label='Wavelet Function (ψ)', color='orange')
plt.title("Wavelet Function (ψ) for db4")
plt.grid()
plt.legend()

plt.tight_layout()
plt.show()

# %%
signals = np.zeros((1024,))
signals[0] = 1
coeffs = pywt.wavedec(signals, wavelet)
for i in range(len(coeffs)):
    print(f"Level {i}: {len(coeffs[i])} coefficients")
    coeffs[i] = np.zeros_like(coeffs[i])
coeffs[3][15] = 1
reconstructed_signal = pywt.waverec(coeffs, wavelet)

plt.figure(figsize=(10, 6))
plt.plot(reconstructed_signal, label='Reconstructed Signal', linestyle='--')
plt.title("Original Signal and Reconstructed Signal")
plt.grid()
plt.legend()
plt.show()

# %%
