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
    start_time = time.time()
    # Process each vector in the 2D signal
    _ = pywt.wavedec(signal, wavelet_name)
    end_time = time.time()
    return end_time - start_time

def benchmark_compute_time(*, wavelet_name, num_samples):
    """Main function to run benchmarks and return results"""
    num_trials = 5
    num_vectors = 10

    # Generate test signal
    signal = generate_test_signal(num_samples=num_samples, num_vectors=num_vectors)

    computation_times = []
    for _ in range(num_trials):
        computation_time = benchmark_wavelet_transform(wavelet_name, signal)
        computation_times.append(computation_time / num_vectors)

    # Return results in format suitable for plotting
    return {
        'num_samples': num_samples,
        'computation_time_msec': np.mean(computation_times) * 1000,
        'wavelet_name': wavelet_name
    }

if __name__ == '__main__':
    # Example usage
    result = benchmark_compute_time(
        wavelet_name='db1',
        num_samples=int(1e6)
    )
    print(f"Computation time: {result['computation_time_msec']:.1f} milliseconds")
