import numpy as np
import pywt
import time

def generate_test_signal(*, num_samples, num_vectors):
    """Generate a 2D test signal for benchmarking"""
    t = np.linspace(0, 1, num_samples)
    signals = []
    for _ in range(num_vectors):
        # Generate slightly different frequencies for each vector to add variety
        f1 = 10 + np.random.rand()
        f2 = 20 + np.random.rand()
        signal = np.sin(2 * np.pi * f1 * t) + 0.5 * np.sin(2 * np.pi * f2 * t)
        signals.append(signal)
    return np.array(signals)

def benchmark_wavelet_transform(wavelet_name, signal):
    """Benchmark wavelet transform computation time for 2D signal"""
    if wavelet_name != 'fourier':
        # Time decomposition
        dec_start_time = time.time()
        coeffs = pywt.wavedec(signal, wavelet_name)
        dec_end_time = time.time()

        # Time reconstruction
        rec_start_time = time.time()
        _ = pywt.waverec(coeffs, wavelet_name)
        rec_end_time = time.time()

        dec_time = dec_end_time - dec_start_time
        rec_time = rec_end_time - rec_start_time
        return dec_time, rec_time
    else:  # fourier
        # Time decomposition
        dec_start_time = time.time()
        coeffs = np.fft.rfft(signal)
        dec_end_time = time.time()

        # Time reconstruction
        rec_start_time = time.time()
        _ = np.fft.irfft(coeffs)
        rec_end_time = time.time()

        dec_time = dec_end_time - dec_start_time
        rec_time = rec_end_time - rec_start_time

        return dec_time, rec_time

def benchmark_compute_time(*, wavelet_name, num_samples):
    """Main function to run benchmarks and return results"""
    num_trials = 5
    num_vectors = 10

    # Generate test signal
    signal = generate_test_signal(num_samples=num_samples, num_vectors=num_vectors)

    dec_times = []
    rec_times = []
    for _ in range(num_trials):
        dec_time, rec_time = benchmark_wavelet_transform(wavelet_name, signal)
        dec_times.append(dec_time / num_vectors)
        rec_times.append(rec_time / num_vectors)

    # Return results in format suitable for plotting
    return {
        'num_samples': num_samples,
        'dec_computation_time_msec': np.mean(dec_times) * 1000,
        'rec_computation_time_msec': np.mean(rec_times) * 1000,
        'wavelet_name': wavelet_name
    }

if __name__ == '__main__':
    # Example usage
    result = benchmark_compute_time(
        wavelet_name='db1',
        num_samples=int(1e6)
    )
    print(f"Decomposition time: {result['dec_computation_time_msec']:.1f} milliseconds")
    print(f"Reconstruction time: {result['rec_computation_time_msec']:.1f} milliseconds")
