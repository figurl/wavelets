import numpy as np
from scipy.special import erf

def p_function(i, q, sigma):
    return 0.5 * (erf((i + 0.5) * q / (2**0.5 * sigma)) - erf((i - 0.5) * q / (2**0.5 * sigma)))

def entropy_per_sample(q, sigma):
    v = round(sigma / q * 20)
    return -sum(p_function(i, q, sigma) * np.log2(p_function(i, q, sigma)) for i in range(-v, v + 1) if p_function(i, q, sigma) > 0)

def theoretical_compression_ratio(q, sigma):
    return 16 / entropy_per_sample(q, sigma)

def nrmse(q, sigma):
    x = np.arange(-5 * sigma, 5 * sigma, 0.01)
    p = np.exp(-x**2 / (2 * sigma**2)) / (np.sqrt(2 * np.pi) * sigma)
    p = p / np.sum(p)
    xhat = np.round(x / q) * q
    return np.sqrt(np.sum((x - xhat)**2 * p) / sigma**2)

def simulated_nrmse(q, sigma):
    N = 1000
    signal = np.random.normal(0, sigma, N)
    quantized_signal = np.round(signal / q) * q
    return np.sqrt(np.mean((signal - quantized_signal)**2) / sigma**2)

def simulated_compression_ratio(*, q, sigma, lossless_method='zlib'):
    N = 10000
    signal = np.random.normal(0, sigma, N)
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
    return N * 2 / len(compressed)

def show_plot():
    qs = np.arange(0.1, 4, 0.1)
    theoretical_compression_ratios = [theoretical_compression_ratio(q, 1) for q in qs]
    actual_compression_ratios_zlib = [simulated_compression_ratio(q=q, sigma=1, lossless_method='zlib') for q in qs]
    actual_compression_ratios_zstandard = [simulated_compression_ratio(q=q, sigma=1, lossless_method='zstandard') for q in qs]
    actual_compression_ratios_lzma = [simulated_compression_ratio(q=q, sigma=1, lossless_method='lzma') for q in qs]
    nrmses = [nrmse(q, 1) for q in qs]
    # simulated_nrmses = [simulated_nrmse(q, 1) for q in qs]

    import matplotlib.pyplot as plt
    plt.figure()
    plt.plot(nrmses, theoretical_compression_ratios, label='Theoretical')
    plt.plot(nrmses, actual_compression_ratios_zlib, label='Zlib')
    plt.plot(nrmses, actual_compression_ratios_zstandard, label='Zstandard')
    plt.plot(nrmses, actual_compression_ratios_lzma, label='LZMA')
    plt.xlabel('NRMSE')
    plt.ylabel('Compression Ratio')
    plt.legend()
    plt.semilogy()
    plt.grid(True, which='both', axis='y', linestyle='--')
    plt.title('QTC Compression Ratio vs. NRMSE for Gaussian Signal')
    plt.show()