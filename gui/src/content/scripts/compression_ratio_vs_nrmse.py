from typing import List, Tuple, Callable, Literal
import io
import requests
from scipy.special import erf
import numpy as np
import matplotlib.pyplot as plt


def p_function_gaussian(i, q, sigma):
    return 0.5 * (
        erf((i + 0.5) * q / (2**0.5 * sigma)) - erf((i - 0.5) * q / (2**0.5 * sigma))
    )


def entropy_per_sample_gaussian(q, sigma):
    v = round(sigma / q * 20)
    return -sum(
        p_function_gaussian(i, q, sigma) * np.log2(p_function_gaussian(i, q, sigma))
        for i in range(-v, v + 1)
        if p_function_gaussian(i, q, sigma) > 0
    )


def theoretical_compression_ratio_gaussian(q, sigma):
    return 16 / entropy_per_sample_gaussian(q, sigma)


def nrmse_gaussian(q, sigma):
    x = np.arange(-5 * sigma, 5 * sigma, 0.01)
    p = np.exp(-(x**2) / (2 * sigma**2)) / (np.sqrt(2 * np.pi) * sigma)
    p = p / np.sum(p)
    xhat = np.round(x / q) * q
    return np.sqrt(np.sum((x - xhat) ** 2 * p) / sigma**2)


def simulated_nrmse(q, sigma):
    N = 1000
    signal = np.random.normal(0, sigma, N)
    quantized_signal = np.round(signal / q) * q
    return np.sqrt(np.mean((signal - quantized_signal) ** 2) / sigma**2)


def compress_buffer(buf, lossless_method: Literal["zlib", "zstandard", "lzma"]):
    if lossless_method == "zlib":
        import zlib

        return zlib.compress(buf, level=9)
    elif lossless_method == "zstandard":
        import zstandard

        cctx = zstandard.ZstdCompressor(level=22)
        return cctx.compress(buf)
    elif lossless_method == "lzma":
        import lzma

        return lzma.compress(buf, preset=9)
    else:
        raise ValueError("Invalid lossless method")


def get_compression_ratio(
    *, signal, q, lossless_method: Literal["zlib", "zstandard", "lzma"]
):
    quantized_signal_ints = np.round(signal / q).astype(np.int32)
    buf = quantized_signal_ints.tobytes()
    compressed = compress_buffer(buf, lossless_method)
    return len(signal) * 2 / len(compressed)


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


def estimate_noise_level(array: np.ndarray, *, sampling_frequency: float) -> float:
    array_filtered = highpass_filter(
        array, sampling_frequency=sampling_frequency, lowcut=300
    )
    MAD = float(
        np.median(np.abs(array_filtered.ravel() - np.median(array_filtered.ravel())))
        / 0.6745
    )
    return MAD


def compute_nrmse(*, signal, q, noise_level):
    xhat = np.round(signal / q) * q
    return np.sqrt(np.sum((signal - xhat) ** 2) / len(signal) / noise_level**2)


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


def show_compression_ratio_vs_nrmse(
    *, nrmses: List[np.ndarray], plot_series: List[Tuple], title: str
):
    plt.figure()
    for i, plot_seres in enumerate(plot_series):
        label, compression_ratios = plot_seres
        plt.plot(nrmses[i], compression_ratios, label=label)
    plt.xlabel("NRMSE")
    plt.ylabel("Compression Ratio")
    plt.legend()
    plt.semilogy()
    plt.grid(True, which="both", axis="y", linestyle="--")
    plt.title(title)
    plt.show()


def load_real_1(
    *, num_samples: int, num_channels: int, start_channel: int
) -> np.ndarray:
    url = f"https://lindi.neurosift.org/tmp/ephys-compression/real_1_{num_samples}_{start_channel}_{num_channels}.npy"
    response = requests.get(url)
    response.raise_for_status()
    return np.load(io.BytesIO(response.content))


def get_signal(
    signal_type: Literal["gaussian", "real"], *, use_filter: bool = False
) -> np.ndarray:
    """Helper function to get signal and noise level based on type"""
    if signal_type == "gaussian":
        N = 100000
        sigma = 1
        signal = np.random.normal(0, sigma, N)
    else:  # real
        signal = load_real_1(num_samples=100000, num_channels=1, start_channel=101)
        signal = (signal.ravel() - np.median(signal.ravel())).astype(np.int16)

    if use_filter:
        signal = bandpass_filter(
            signal, sampling_frequency=30000, lowcut=300, highcut=6000
        )

    return signal


def quantize(data: np.ndarray) -> np.ndarray:
    data_rounded = np.round(data)
    if (
        np.min(data_rounded) < np.iinfo(np.int16).min
        or np.max(data_rounded) > np.iinfo(np.int16).max
    ):
        print("Warning: data is out of range of int16. Using int32 instead.")
        return np.round(data).astype(np.int32)
    return np.round(data).astype(np.int16)


def get_compression_ratio_qfc_or_qwc(
    *,
    signal: np.ndarray,
    target_nrmse: float,
    lossless_method: Literal["zlib", "zstandard", "lzma"],
    wavelet_name: Literal["fourier", "time-domain", "db4"],
) -> Tuple[float, float, float]:
    import pywt

    wavelet_extension_mode = "sym"
    if wavelet_name == "fourier":
        signal_fft = np.fft.rfft(signal.astype(float))
        coeffs = [np.real(signal_fft), np.imag(signal_fft)]
    elif wavelet_name == "time-domain":
        coeffs = [signal]
    else:
        coeffs = pywt.wavedec(signal, wavelet_name, mode=wavelet_extension_mode)

    estimated_noise_level = estimate_noise_level(signal, sampling_frequency=30000)

    def get_nrmse_for_quantization_step(*, quant_step):
        coeffs_quantized = [quantize(c / quant_step) for c in coeffs]
        if wavelet_name == "fourier":
            reconstructed_signal = (
                np.fft.irfft(coeffs_quantized[0] + 1j * coeffs_quantized[1])
                * quant_step
            )
        elif wavelet_name == "time-domain":
            reconstructed_signal = coeffs_quantized[0] * quant_step
        else:
            reconstructed_signal = (
                pywt.waverec(
                    coeffs_quantized, wavelet_name, mode=wavelet_extension_mode
                )
                * quant_step
            )

        nrmse = np.sqrt(
            np.sum((signal - reconstructed_signal) ** 2)
            / len(signal)
            / estimated_noise_level**2
        )
        return nrmse

    quantization_step = _monotonic_binary_search(
        lambda x: get_nrmse_for_quantization_step(quant_step=x),
        target_value=target_nrmse,
        max_iterations=100,
        tolerance=1e-3,
        ascending=True,
    )

    coeffs_quantized = [quantize(c / quantization_step) for c in coeffs]
    if wavelet_name == "fourier":
        reconstructed_signal = (
            np.fft.irfft(coeffs_quantized[0] + 1j * coeffs_quantized[1])
            * quantization_step
        )
    elif wavelet_name == "time-domain":
        reconstructed_signal = coeffs_quantized[0] * quantization_step
    else:
        reconstructed_signal = (
            pywt.waverec(coeffs_quantized, wavelet_name, mode=wavelet_extension_mode)
            * quantization_step
        )

    nrmse = np.sqrt(
        np.sum((signal - reconstructed_signal) ** 2)
        / len(signal)
        / estimated_noise_level**2
    )
    compressed_size = len(
        compress_buffer(np.concatenate(coeffs_quantized).tobytes(), lossless_method)
    )
    compression_ratio = len(signal) * 2 / compressed_size
    theoretical_bits_per_sample = compute_theoretical_bits_per_sample(coeffs_quantized)
    theoretical_compression_ratio = float(16 / theoretical_bits_per_sample)
    return nrmse, compression_ratio, theoretical_compression_ratio


def compute_theoretical_bits_per_sample(coeffs_quantized):
    _, val_counts = np.unique(np.concatenate(coeffs_quantized), return_counts=True)
    val_probs = val_counts / len(np.concatenate(coeffs_quantized))
    return -np.sum(val_probs * np.log2(val_probs))


def get_compression_results(
    signal: np.ndarray,
    method: Literal["qfc", "qwc", "qtc"],
    lossless_method: Literal["zlib", "zstandard", "lzma"] = "zstandard",
) -> Tuple[List[float], List[float], List[float]]:
    """Helper function to get compression results for different methods"""
    target_nrmses = np.arange(0.05, 0.95, 0.05)
    nrmses = []
    compression_ratios = []
    theoretical_compression_ratios = []
    wavelet_name = {"qfc": "fourier", "qwc": "db4", "qtc": "time-domain"}[method]
    for target_nrmse in target_nrmses:
        nrmse, compression_ratio, theoretical_compression_ratio = (
            get_compression_ratio_qfc_or_qwc(
                signal=signal,
                target_nrmse=target_nrmse,
                lossless_method=lossless_method,
                wavelet_name=wavelet_name,  # type: ignore
            )
        )
        nrmses.append(nrmse)
        compression_ratios.append(compression_ratio)
        theoretical_compression_ratios.append(theoretical_compression_ratio)

    return nrmses, compression_ratios, theoretical_compression_ratios


def show_compression_method_comparison(
    signal_type: Literal["gaussian", "real"], use_filter: bool = False,
    show_theoretical_for_reference: bool = False
):
    """Unified function to show compression method comparison for different signal types and filtering"""
    signal = get_signal(signal_type, use_filter=use_filter)

    # Get results for each method
    methods: List[Literal["qfc", "qwc", "qtc"]] = ["qtc", "qfc", "qwc"]
    all_nrmses = []
    plot_series = []

    for method in methods:
        nrmses, compression_ratios, theoretical_compression_ratios = (
            get_compression_results(signal, method)
        )

        if show_theoretical_for_reference and method == "qtc":
            all_nrmses.append(nrmses)
            plot_series.append(("Theoretical", theoretical_compression_ratios))

        method_label = method.upper()
        filter_label = " with bandpass" if use_filter else " raw"

        all_nrmses.append(nrmses)
        plot_series.append((f"{method_label}{filter_label}", compression_ratios))

    signal_label = "Gaussian" if signal_type == "gaussian" else "Real Ephys"
    filter_label = "Filtered" if use_filter else "Raw"
    title = (
        f"{filter_label} Signal Compression Method Comparison for {signal_label} Signal"
    )

    show_compression_ratio_vs_nrmse(
        nrmses=all_nrmses, plot_series=plot_series, title=title
    )


if __name__ == "__main__":
    show_compression_method_comparison("gaussian", use_filter=False, show_theoretical_for_reference=True)
    show_compression_method_comparison("gaussian", use_filter=True)
    show_compression_method_comparison("real", use_filter=False)
    show_compression_method_comparison("real", use_filter=True)
