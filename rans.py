# %%
# https://kedartatwawadi.github.io/post--ANS/

import numpy as np


low_level = 10  # ??


def C_rANS(s, state, symbol_counts):
    total_counts = np.sum(symbol_counts)  # Represents M
    cumul_counts = np.insert(
        np.cumsum(symbol_counts), 0, 0
    )  # the cumulative frequencies

    s_count = symbol_counts[s]  # current symbol count/frequency
    next_state = (state // s_count) * total_counts + cumul_counts[s] + (state % s_count)
    return next_state


def Streaming_rANS_encoder(s_input, symbol_counts, range_factor):
    total_counts = np.sum(symbol_counts)  # Represents M
    bitstream = []  # initialize stream
    state = low_level * total_counts  # state initialized to lM

    for s in s_input:  # iterate over the input
        # Output bits to the stream to bring the state in the range for the next encoding
        while state >= range_factor * symbol_counts[s]:
            bitstream.append(state % 2)
            state = state / 2

        state = C_rANS(s, state, symbol_counts)  # The rANS encoding step
    return state, bitstream


def D_rANS(state, symbol_counts):
    total_counts = np.sum(symbol_counts)  # Represents M
    cumul_counts = np.insert(
        np.cumsum(symbol_counts), 0, 0
    )  # the cumulative frequencies

    # The Cumulative frequency inverse function
    def cumul_inverse(y):
        for i, _s in enumerate(cumul_counts):
            if y < _s:
                return i - 1

    slot = state % total_counts  # compute the slot
    s = cumul_inverse(slot)  # decode the symbol
    prev_state = (
        (state // total_counts) * symbol_counts[s] + slot - cumul_counts[s]
    )  # update the state
    return s, prev_state


def Streaming_rANS_decoder(state, bitstream, symbol_counts, range_factor):
    total_counts = np.sum(symbol_counts)  # Represents M

    # perform the rANS decoding
    s_decoded, state = D_rANS(state, symbol_counts)

    # remap the state into the acceptable range
    while state < range_factor * total_counts:
        bits = bitstream.pop()
        state = state * 2 + bits

    return s_decoded, state


symbol_counts = [1, 5, 10]
symbol_probs = [p / sum(symbol_counts) for p in symbol_counts]
range_factor = 16
n = 10
s_input = np.random.choice(np.arange(len(symbol_counts)), n, p=symbol_probs).astype(np.uint8)

state, bitstream = Streaming_rANS_encoder(s_input, symbol_counts, range_factor)

decoded = []
for j in range(5):
    s_decoded, state = Streaming_rANS_decoder(state, bitstream, symbol_counts, range_factor)
    decoded.append(s_decoded)

print(s_input)
print(decoded)

assert np.array_equal(s_input, s_decoded)
print("Success")
