from typing import List
import numpy as np
import pywt


wavelet_extension_mode = 'symmetric'

def get_coeff_sizes(*, n: int, wavelet: str):
    x = np.random.randn(n)
    coeffs = pywt.wavedec(x, wavelet, mode=wavelet_extension_mode)
    coeff_sizes = [len(x) for x in coeffs]
    return coeff_sizes


def get_basis_wavelets(*, coeff_sizes: List[int], level: int, wavelet: str):
    basis_wavelets = []
    for offset in range(coeff_sizes[level]):
        coeffs = []
        for i in range(len(coeff_sizes)):
            coeffs.append(np.zeros(coeff_sizes[i]))
        coeffs[level][offset] = 1
        y = pywt.waverec(coeffs, wavelet, mode=wavelet_extension_mode)
        basis_wavelets.append(y.tolist())
    return basis_wavelets


if __name__ == '__main__':
    n = 512
    wavelet = 'db4'
    coeff_sizes = get_coeff_sizes(n=n, wavelet=wavelet)
    X = get_basis_wavelets(
        coeff_sizes=coeff_sizes,
        level=0,
        wavelet=wavelet
    )
    print([len(a) for a in X])
