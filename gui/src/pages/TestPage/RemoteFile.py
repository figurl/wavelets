import time
import pyodide_http
pyodide_http.patch_all()
import urllib.request

default_min_chunk_size = 100 * 1024
default_max_cache_size = int(1e9)
default_chunk_increment_factor = 1.7
_num_request_retries = 8


class RemoteFile:
    def __init__(
        self,
        url: str,
        *,
        size: int,
        verbose: bool = False,
        _min_chunk_size: int = default_min_chunk_size,
        _max_cache_size: int = default_max_cache_size,
        _chunk_increment_factor: float = default_chunk_increment_factor,
        _max_chunk_size: int = 100 * 1024 * 1024
    ):
        """Create a file-like object for reading a remote file. Optimized for reading hdf5 files. The arguments starting with an underscore are for testing and debugging purposes - they may experience breaking changes in the future.

        Args:
            url (str): The url of the remote file
            verbose (bool, optional): Whether to print info for debugging. Defaults to False.
            _min_chunk_size (int, optional): The minimum chunk size. When reading, the chunks will be loaded in multiples of this size.
            _max_cache_size (int, optional): The maximum number of bytes to keep in the cache.
            _chunk_increment_factor (int, optional): The factor by which to increase the number of chunks to load when the system detects that the chunks are being loaded in order.
            _max_chunk_size (int, optional): The maximum chunk size. When reading, the chunks will be loaded in multiples of the minimum chunk size up to this size.
        """
        self._url = url
        self._verbose = verbose
        self._min_chunk_size = _min_chunk_size
        self._max_chunks_in_cache = int(_max_cache_size / _min_chunk_size)
        self._chunk_increment_factor = _chunk_increment_factor
        self._max_chunk_size = _max_chunk_size
        self._chunks = {}
        self._chunk_indices: list[
            int
        ] = (
            []
        )  # list of chunk indices in order of loading for purposes of cleaning up the cache
        self._position = 0
        self._smart_loader_last_chunk_index_accessed = -99
        self._smart_loader_chunk_sequence_length = 1

        self.length = size

    def read(self, size=None):
        """Read bytes from the file.

        Args:
            size (_type_): The number of bytes to read.

        Raises:
            Exception: If the size argument is not provided.

        Returns:
            bytes: The bytes read.
        """
        if size is None:
            raise Exception(
                "The size argument must be provided in remfile"
            )  # pragma: no cover

        chunk_start_index = self._position // self._min_chunk_size
        chunk_end_index = (self._position + size - 1) // self._min_chunk_size
        for chunk_index in range(chunk_start_index, chunk_end_index + 1):
            self._load_chunk(chunk_index)
        if chunk_end_index == chunk_start_index:
            chunk = self._chunks[chunk_start_index]
            chunk_offset = self._position % self._min_chunk_size
            chunk_length = size
            self._position += size
            ret = chunk[chunk_offset: chunk_offset + chunk_length]
            return ret
        else:
            pieces_to_concat = []
            for chunk_index in range(chunk_start_index, chunk_end_index + 1):
                chunk = self._chunks[chunk_index]
                if chunk_index == chunk_start_index:
                    chunk_offset = self._position % self._min_chunk_size
                    chunk_length = self._min_chunk_size - chunk_offset
                elif chunk_index == chunk_end_index:
                    chunk_offset = 0
                    chunk_length = size - sum([len(p) for p in pieces_to_concat])
                else:
                    chunk_offset = 0
                    chunk_length = self._min_chunk_size
                pieces_to_concat.append(
                    chunk[chunk_offset: chunk_offset + chunk_length]
                )
        ret = b"".join(pieces_to_concat)
        self._position += size

        # clean up the cache
        if len(self._chunk_indices) > self._max_chunks_in_cache:
            if self._verbose:
                print("Cleaning up cache")
            for chunk_index in self._chunk_indices[
                : int(self._max_chunks_in_cache * 0.5)
            ]:
                if chunk_index in self._chunks:
                    del self._chunks[chunk_index]
                else:
                    # it is possible that the chunk was already deleted (repeated chunk index in the list)
                    pass
            self._chunk_indices = self._chunk_indices[
                int(self._max_chunks_in_cache * 0.5):
            ]

        return ret

    def _load_chunk(self, chunk_index: int):
        """Load a chunk of the file.

        Args:
            chunk_index (int): The index of the chunk to load.
        """
        if chunk_index in self._chunks:
            self._smart_loader_last_chunk_index_accessed = chunk_index
            return

        if chunk_index == self._smart_loader_last_chunk_index_accessed + 1:
            # round up to the chunk sequence length times 1.7
            self._smart_loader_chunk_sequence_length = round(
                self._smart_loader_chunk_sequence_length * 1.7 + 0.5
            )
            if (
                self._smart_loader_chunk_sequence_length > self._max_chunk_size / self._min_chunk_size
            ):
                self._smart_loader_chunk_sequence_length = int(self._smart_loader_chunk_sequence_length / 1.7 + 0.5)
        data_start = chunk_index * self._min_chunk_size
        data_end = (
            data_start + self._min_chunk_size * self._smart_loader_chunk_sequence_length - 1
        )
        if self._verbose:
            print(
                f"Loading {self._smart_loader_chunk_sequence_length} chunks starting at {chunk_index} ({(data_end - data_start + 1)/1e6} million bytes)"
            )
        if data_end >= self.length:
            data_end = self.length - 1
        x = RemoteFile._get_bytes(
            self._url,
            data_start,
            data_end,
            verbose=self._verbose
        )
        assert x is not None
        if self._smart_loader_chunk_sequence_length == 1:
            self._chunks[chunk_index] = x
            self._chunk_indices.append(chunk_index)
        else:
            for i in range(self._smart_loader_chunk_sequence_length):
                if i * self._min_chunk_size >= len(x):
                    break
                self._chunks[chunk_index + i] = x[
                    i * self._min_chunk_size: (i + 1) * self._min_chunk_size
                ]
                self._chunk_indices.append(chunk_index + i)
        self._smart_loader_last_chunk_index_accessed = (
            chunk_index + self._smart_loader_chunk_sequence_length - 1
        )

    def seek(self, offset: int, whence: int = 0):
        """Seek to a position in the file.

        Args:
            offset (int): The offset to seek to.
            whence (int, optional): The code for the reference point for the offset. Defaults to 0.

        Raises:
            ValueError: If the whence argument is not 0, 1, or 2.
        """
        if whence == 0:
            self._position = offset
        elif whence == 1:
            self._position += offset  # pragma: no cover
        elif whence == 2:
            self._position = self.length + offset
        else:
            raise ValueError(
                "Invalid argument: 'whence' must be 0, 1, or 2."
            )  # pragma: no cover

    def tell(self):
        return self._position

    def close(self):
        pass

    @staticmethod
    def _get_bytes(
        url: str,
        start_byte: int,
        end_byte: int,
        *,
        verbose=False
    ):
        """Get bytes from a remote file.

        Args:
            url (str): The url of the remote file.
            start_byte (int): The first byte to get.
            end_byte (int): The last byte to get.
            verbose (bool, optional): Whether to print info for debugging. Defaults to False.

        Returns:
            _type_: _description_
        """
        def fetch_bytes(range_start: int, range_end: int, num_retries: int, verbose: bool):
            """Fetch a range of bytes from a remote file using the range header

            Args:
                range_start (int): The first byte to get.
                range_end (int): The last byte to get.
                num_retries (int): The number of retries.

            Returns:
                bytes: The bytes fetched.
            """
            for try_num in range(num_retries + 1):
                try:
                    headers = {'Range': f"bytes={range_start}-{range_end}"}
                    req = urllib.request.Request(url, headers=headers)
                    with urllib.request.urlopen(req) as response:
                        if response.status == 206:  # Partial Content status code
                            data = response.read()
                            return data
                        else:
                            raise Exception(f"Unexpected status code: {response.status}")
                except Exception as e:
                    if try_num == num_retries:
                        raise e  # pragma: no cover
                    else:
                        delay = 0.1 * 2**try_num
                        if verbose:
                            print(f"Retrying after exception: {e}")
                            print(f"Waiting {delay} seconds")
                        time.sleep(delay)

        return fetch_bytes(start_byte, end_byte, _num_request_retries, verbose)

if __name__ == "__main__":
    # https://neurosift.app/?p=/nwb&url=https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/&dandisetId=000409&dandisetVersion=draft
    nwb_url = "https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/"
    file_size = 69109827653
    import h5py
    f = RemoteFile(nwb_url, size=file_size, verbose=True)
    h5f = h5py.File(f, "r")
    acquisition = h5f['/acquisition/ElectricalSeriesAp']
    assert isinstance(acquisition, h5py.Group)
    d = acquisition['data']
    assert isinstance(d, h5py.Dataset)
    x = d[:30000, 101:105]
    print(x.shape)
    h5f.close()
