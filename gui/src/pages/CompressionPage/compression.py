from typing import Callable, Union, List
import numpy as np
import pywt


wavelet_extension_mode = 'symmetric'

def test_compression(*,
    wavelet_name: str,
    num_samples: int,  # only applies to synthetic data
    nrmses: List[float],
    filt_lowcut: Union[float, None] = None,
    filt_highcut: Union[float, None] = None,
    lossless_compression_method: str = 'zstd',
    signal_type: str = 'gaussian_noise'
):
    if signal_type == 'gaussian_noise':
        sampling_frequency = 30000
        original = (np.random.randn(num_samples) * 100).astype(np.int16)
    elif signal_type == 'real_ephys_1':
        sampling_frequency = 30000
        fname = 'traces.dat'
        with open(fname, 'rb') as f:
            original = np.frombuffer(f.read(), dtype=np.int16)
    else:
        raise ValueError(f'Unknown signal type: {signal_type}')
    if filt_lowcut is not None and filt_highcut is not None:
        original = bandpass_filter(
            original - np.median(original),
            sampling_frequency=sampling_frequency,
            lowcut=filt_lowcut,
            highcut=filt_highcut,
        ).astype(np.int16)
    elif filt_lowcut is not None:
        original = highpass_filter(
            original - np.median(original),
            sampling_frequency=sampling_frequency,
            lowcut=filt_lowcut,
        ).astype(np.int16)
    elif filt_highcut is not None:
        original = lowpass_filter(
            original,
            sampling_frequency=sampling_frequency,
            highcut=filt_highcut,
        ).astype(np.int16)
    else:
        if wavelet_name == "fourier":
            # important to apply a slight highpass filter to remove DC offset
            original = highpass_filter(
                original - np.median(original),
                sampling_frequency=sampling_frequency,
                lowcut=10,
            ).astype(np.int16)
    original_size = original.nbytes
    if wavelet_name != 'fourier':
        coeffs = pywt.wavedec(original, wavelet_name, mode=wavelet_extension_mode)
    elif wavelet_name == 'fourier':
        original_fft = np.fft.rfft(original.astype(float))
        coeffs = [np.real(original_fft), np.imag(original_fft)]
    else:
        raise ValueError(f'Unknown wavelet name: {wavelet_name}')

    ret = []
    for nrmse in nrmses:
        quant_scale_factor = _monotonic_binary_search(
            lambda x: get_nrmse_for_quant_scale_factor(
                original=original,
                coeffs=coeffs,
                quant_scale_factor=x,
                wavelet_name=wavelet_name,
            ),
            target_value=nrmse,
            max_iterations=100,
            tolerance=1e-3,
            ascending=True,
        )
        coeffs_quantized = [quantize(c / quant_scale_factor) for c in coeffs]
        if wavelet_name != 'fourier':
            compressed = pywt.waverec(coeffs_quantized, wavelet_name, mode=wavelet_extension_mode) * quant_scale_factor
        elif wavelet_name == 'fourier':
            compressed = np.fft.irfft(coeffs_quantized[0] + 1j * coeffs_quantized[1]) * quant_scale_factor
        else:
            raise ValueError(f'Unknown wavelet name: {wavelet_name}')
        if lossless_compression_method == 'zlib':
            compressed_size = len(zlib_compress(np.concatenate(coeffs_quantized).tobytes()))
        elif lossless_compression_method == 'zstd':
            compressed_size = len(zstandard_compress(np.concatenate(coeffs_quantized).tobytes()))
        else:
            raise ValueError(f'Unknown lossless compression method: {lossless_compression_method}')
        compression_ratio = original_size / compressed_size
        nrmse_actual = compute_nrmse(original, compressed)

        number_of_zeros = sum([np.sum(c == 0) for c in coeffs_quantized])
        frac_of_zeros = number_of_zeros / sum([c.size for c in coeffs_quantized])
        print(f'NRMSE: {nrmse:.2f}; Compression Ratio: {compression_ratio:.2f}; Fraction of zeros: {frac_of_zeros:.2f}')

        ret.append({
            'quant_scale_factor': quant_scale_factor,
            'nrmse_target': nrmse,
            'nrmse': nrmse_actual,
            'compressed': compressed.tolist(),
            'compression_ratio': compression_ratio
        })
    return {
        'sampling_frequency': sampling_frequency,
        'original': original.tolist(),
        'compressed': ret,
    }


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


def get_nrmse_for_quant_scale_factor(*,
    original: np.ndarray,
    coeffs: list,
    quant_scale_factor: float,
    wavelet_name: str,
):
    coeffs_quantized = [quantize(c / quant_scale_factor) for c in coeffs]
    if wavelet_name != 'fourier':
        compressed = pywt.waverec(coeffs_quantized, wavelet_name, mode=wavelet_extension_mode) * quant_scale_factor
    elif wavelet_name == 'fourier':
        compressed = np.fft.irfft(coeffs_quantized[0] + 1j * coeffs_quantized[1]) * quant_scale_factor
    else:
        raise ValueError(f'Unknown wavelet name: {wavelet_name}')
    nrmse = compute_nrmse(original, compressed)
    return nrmse


def compute_nrmse(original: np.ndarray, compressed: np.ndarray) -> float:
    x = original.astype(float)
    y = compressed.astype(float)
    return np.sqrt(np.mean((x - y) ** 2)) / np.sqrt(np.var(x))


def _monotonic_binary_search(
    func: Callable[[float], float],
    target_value: float,
    max_iterations: int,
    tolerance: float,
    ascending: bool,
):
    """
    Performs a binary search to find the value that minimizes the difference
    between the output of a function and a target value

    Parameters
    ----------
    func : callable
        The function to minimize
        assumed to be a monotonically increasing function
    target_value : float
        The target value
    max_iterations : int
        The maximum number of iterations
    tolerance : float
        The tolerance for the difference between the output of the function
        and the target value
    ascending : bool
        Whether the function is monotonically increasing or decreasing

    Returns
    -------
    float
        The value that minimizes the difference between the output of the
        function and the target value
    """
    effective_target_value = target_value
    if not ascending:
        effective_target_value = -target_value
    num_iterations = 0
    # first find an upper bound
    upper_bound = 1
    last_val = None
    while True:
        new_val = func(upper_bound)
        if not ascending:
            new_val = -new_val
        if new_val > effective_target_value:
            break
        upper_bound *= 2
        num_iterations += 1
        if num_iterations > max_iterations:
            return upper_bound
        if last_val is not None:
            if new_val < last_val:
                # fails to be monotonically increasing
                break
        last_val = new_val
    # then do a binary search
    lower_bound = 0
    while upper_bound - lower_bound > tolerance:
        candidate = (upper_bound + lower_bound) / 2
        candidate_value = func(candidate)
        if not ascending:
            candidate_value = -candidate_value
        if candidate_value < effective_target_value:
            lower_bound = candidate
        else:
            upper_bound = candidate
        num_iterations += 1
        if num_iterations > max_iterations:
            break
    return (upper_bound + lower_bound) / 2


def quantize(data: np.ndarray) -> np.ndarray:
    data_rounded = np.round(data)
    # check that it is within the range of int16
    if np.min(data_rounded) < np.iinfo(np.int16).min or np.max(data_rounded) > np.iinfo(np.int16).max:
        # this happens for real data and Fourier method
        print('Warning: data is out of range of int16. Using int32 instead.')
        return np.round(data).astype(np.int32)
    return np.round(data).astype(np.int16)


def zlib_compress(data: bytes) -> bytes:
    import zlib
    return zlib.compress(data, level=6)


def zstandard_compress(data: bytes) -> bytes:
    import zstandard as zstd
    cctx = zstd.ZstdCompressor(level=12)
    return cctx.compress(data)


if __name__ == '__main__':
    import matplotlib.pyplot as plt
    x = test_compression(
        wavelet_name='db4',
        num_samples=5000,
        nrmses=[0.1, 0.2],
        filt_lowcut=300,
        filt_highcut=3000,
    )
    original = x['original']
    num = len(x['compressed'])
    timestamps = np.arange(len(original)) / x['sampling_frequency']
    # one subplot for each compression level
    fig, axs = plt.subplots(num, 1, figsize=(8, 3 * num))
    for i in range(num):
        ax = axs[i]
        ax.plot(timestamps, original, label='Original')
        ax.plot(timestamps, x['compressed'][i]['compressed'], label='Compressed')
        ax.set_title(f'NRMSE: {x["compressed"][i]["nrmse"]:.2f}; Compression Ratio: {x["compressed"][i]["compression_ratio"]:.2f}')
        ax.legend()
    plt.tight_layout()
    plt.show()
