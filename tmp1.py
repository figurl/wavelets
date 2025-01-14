# %%
# generate-plot
import numpy as np
import requests
import io
from scipy.special import erf

def p_function(i, q, sigma):
    return 0.5 * (erf((i + 0.5) * q / (2**0.5 * sigma)) - erf((i - 0.5) * q / (2**0.5 * sigma)))

def entropy_per_sample(q, sigma):
    v = round(sigma / q * 20)
    return -sum(p_function(i, q, sigma) * np.log2(p_function(i, q, sigma)) for i in range(-v, v + 1) if p_function(i, q, sigma) > 0)

def theoretical_compression_ratio(q, sigma):
    return 16 / entropy_per_sample(q, sigma)

def nrmse(*, signal, q, noise_level):
    xhat = np.round(signal / q) * q
    return np.sqrt(np.sum((signal - xhat)**2) / len(signal) / noise_level**2)

def get_compression_ratio(*, signal, q, lossless_method='zlib'):
    quantized_signal_ints = np.round(signal / q).astype(np.int32)
    buf = quantized_signal_ints.tobytes()

    if lossless_method == 'zlib':
        import zlib
        compressed = zlib.compress(buf, level=9)
    elif lossless_method == 'zstandard':
        import zstandard
        cctx = zstandard.ZstdCompressor(level=22)
        compressed = cctx.compress(buf)
    elif lossless_method == 'lzma':
        import lzma
        compressed = lzma.compress(buf, preset=9)
    else:
        raise ValueError('Invalid lossless method')
    return len(signal) * 2 / len(compressed)

def estimate_noise_level(array: np.ndarray, *, sampling_frequency: float) -> float:
    array_filtered = highpass_filter(array, sampling_frequency=sampling_frequency, lowcut=300)
    MAD = float(np.median(np.abs(array_filtered.ravel() - np.median(array_filtered.ravel()))) / 0.6745)
    return MAD

def lowpass_filter(array, *, sampling_frequency, highcut) -> np.ndarray:
    from scipy.signal import butter, lfilter

    nyquist = 0.5 * sampling_frequency
    high = highcut / nyquist
    b, a = butter(5, high, btype="low")
    return lfilter(b, a, array, axis=0)  # type: ignore


def highpass_filter(array, *, sampling_frequency, lowcut) -> np.ndarray:
    from scipy.signal import butter, lfilter

    nyquist = 0.5 * sampling_frequency
    low = lowcut / nyquist
    b, a = butter(5, low, btype="high")
    return lfilter(b, a, array, axis=0)  # type: ignore


def bandpass_filter(array, *, sampling_frequency, lowcut, highcut) -> np.ndarray:
    from scipy.signal import butter, lfilter

    nyquist = 0.5 * sampling_frequency
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(5, [low, high], btype="band")
    return lfilter(b, a, array, axis=0)  # type: ignore

def load_real_1(*, num_samples: int, num_channels: int, start_channel: int) -> np.ndarray:
    url = f'https://lindi.neurosift.org/tmp/ephys-compression/real_1_{num_samples}_{start_channel}_{num_channels}.npy'
    response = requests.get(url)
    response.raise_for_status()
    return np.load(io.BytesIO(response.content))

signal = load_real_1(num_samples=5000, num_channels=1, start_channel=101)

import matplotlib.pyplot as plt
timestamps = np.arange(len(signal)) / 30000
plt.figure(figsize=(10, 5))
plt.plot(timestamps, signal)
plt.xlabel('Time (s)')
plt.ylabel('Amplitude')
plt.title('Sample Ephys Signal')
plt.show()
# %%
