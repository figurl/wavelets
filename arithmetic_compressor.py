from typing import List, Dict, Union, Any
import numpy as np

NestedDict = Dict[int, Union["NestedDict", int]]

class ArithmeticCompressor:
    def __init__(self, data: Any):
        """Initialize the compressor with training data to build frequency table

        Args:
            data: Training data (numpy array or list) to build frequency model
        """
        # Convert to list if numpy array
        if isinstance(data, np.ndarray):
            data = data.tolist()

        # Calculate frequencies
        self._data_counts: Dict[int, int] = {}
        for v in data:
            if v in self._data_counts:
                self._data_counts[v] += 1
            else:
                self._data_counts[v] = 1
        # Add end marker
        self._data_counts[-1] = 1

        total_counts = sum(self._data_counts.values())
        self._frequencies = {k: v / total_counts for k, v in self._data_counts.items()}

        # Create codec with reasonable range (can be adjusted if needed)
        self._decoder_table, self._encoder_tree = self._create_codec(0, 64000, self._frequencies)

    def encode(self, data: Any):
        """Encode the input data using arithmetic coding

        Args:
            data: Data to encode (numpy array or list)

        Returns:
            List of encoded integers
        """
        if isinstance(data, np.ndarray):
            data = data.tolist()
        return self._encode_signal(data, self._encoder_tree)

    def decode(self, encoded_data):
        """Decode the encoded data back to original form

        Args:
            encoded_data: List of encoded integers

        Returns:
            List of decoded values
        """
        return self._decode_signal(encoded_data, self._decoder_table)

    def _create_codec(self, n1: int, n2: int, frequencies: dict):
        """Create encoder tree and decoder table"""
        decoder_table: Dict[int, List[int]] = {}
        encoder_tree: NestedDict = {}
        stack = []
        keys = list(frequencies.keys())

        for i in range(len(keys)):
            stack.append((n1, n2, [], encoder_tree))

        while stack:
            start, end, prefix, encoder_subtree = stack.pop()
            divider_points = self._get_divider_points(keys, frequencies, start, end)

            for i in range(len(keys)):
                a1 = divider_points[i]["start"]
                a2 = divider_points[i]["end"]
                if len(keys) > a2 - a1 or keys[i] == -1:
                    decoder_table[a1] = prefix + [keys[i]]
                    encoder_subtree[keys[i]] = divider_points[i]["start"]
                else:
                    encoder_subtree[keys[i]] = {}
                    stack.append(
                        (
                            divider_points[i]["start"],
                            divider_points[i]["end"],
                            prefix + [keys[i]],
                            encoder_subtree[keys[i]],
                        )
                    )

        return decoder_table, encoder_tree

    def _get_divider_points(self, keys, frequencies, a1, a2):
        """Calculate divider points for the range"""
        divider_points = {}
        partition = self._get_partition(a2 - a1, [frequencies[k] for k in keys])
        offset = a1

        for i in range(len(keys)):
            divider_points[i] = {
                "start": offset,
                "end": offset + partition[i],
            }
            if i == len(keys) - 1:
                divider_points[i]["end"] = a2
            offset = divider_points[i]["end"]

        return divider_points

    def _get_partition(self, n: int, frequencies: List[float]) -> List[int]:
        """Get integer partition based on frequencies"""
        partition = [int(np.floor(f * n)) for f in frequencies]

        # Ensure positive values
        for i in range(len(partition)):
            if partition[i] == 0:
                partition[i] = 1

        # Adjust to sum to n
        while sum(partition) < n:
            partition[0] += 1
        while sum(partition) > n:
            found = False
            for i in range(len(partition)):
                if partition[i] > 1:
                    found = True
                    partition[i] -= 1
                    break
            if not found:
                raise ValueError("Partitioning failed")

        return partition

    def _encode_signal(self, signal: List[int], encoder_tree: NestedDict):
        """Encode a signal using the encoder tree"""
        encoded_signal: List[int] = []
        tree0: NestedDict = encoder_tree

        for i in signal + [-1]:  # Add end marker
            x = tree0[i]
            if isinstance(x, dict):
                tree0 = x
            else:
                encoded_signal.append(x)
                tree0 = encoder_tree

        if tree0 != encoder_tree:
            raise ValueError("Encoding error: Tree not at root")

        return np.array(encoded_signal, dtype=np.uint16)

    def _decode_signal(self, encoded_signal: List[int], decoder_table: Dict[int, List[int]]):
        """Decode an encoded signal using the decoder table"""
        if len(encoded_signal) == 0:
            raise ValueError("Empty encoded signal")

        signal: List[int] = []
        for i in encoded_signal:
            signal.extend(decoder_table[i])

        # Remove end marker
        assert signal[-1] == -1
        return np.array(signal[:-1]).astype(np.int16)
