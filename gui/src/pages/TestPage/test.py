import numpy as np
import h5py
from RemoteFile import RemoteFile

# Create a temporary file in system's temporary directory
import tempfile
import os
temp_file = tempfile.NamedTemporaryFile(delete=False)
temp_file.close()
temp_file_path = temp_file.name
print('--- created temporary file', temp_file_path)

class WrappedFile:
    def __init__(self, file):
        self.file = file

    def read(self, size):
        return self.file.read(size)

    def seek(self, offset, whence=0):
        return self.file.seek(offset, whence)

    def tell(self):
        return self.file.tell()

# This one succeeds because it is a small file
# # https://neurosift.app/?p=/nwb&url=https://api.dandiarchive.org/api/assets/830ba7f9-1272-4279-ba7c-bd8aab0b89d8/download/&dandisetId=000481&dandisetVersion=0.230417.2148
# nwb_url = "https://api.dandiarchive.org/api/assets/830ba7f9-1272-4279-ba7c-bd8aab0b89d8/download/"
# file_size = 3228940
# f = RemoteFile(nwb_url, size=file_size, verbose=True)
# h5f = h5py.File(f, "r")
# acquisition = h5f['/acquisition/stimuli']
# assert isinstance(acquisition, h5py.Group)
# d = acquisition['data']
# assert isinstance(d, h5py.Dataset)
# x = d[:20]
# print(x.shape)
# h5f.close()


# This one also succeeds
# https://neurosift.app/?p=/nwb&url=https://api.dandiarchive.org/api/assets/309f7aaf-e821-409c-afa5-d2db0b109b06/download/&dandisetId=000473&dandisetVersion=draft
nwb_url = "https://api.dandiarchive.org/api/assets/309f7aaf-e821-409c-afa5-d2db0b109b06/download/"
file_size = 4893423871
f = RemoteFile(nwb_url, size=file_size, verbose=True)
h5f = h5py.File(f, "r")
acquisition = h5f['/processing/ecephys/EMG/ElectricalSeries']
assert isinstance(acquisition, h5py.Group)
d = acquisition['data']
assert isinstance(d, h5py.Dataset)
x = d[:20]
print(x.shape)
h5f.close()

# This one fails because it is a large file (but it succeeds outside the browser)
# # https://neurosift.app/?p=/nwb&url=https://api.dandiarchive.org/api/assets/ab3998c2-3540-4bda-8b03-3f3795fa602d/download/&dandisetId=000409&dandisetVersion=draft
# nwb_url = "https://api.dandiarchive.org/api/assets/ab3998c2-3540-4bda-8b03-3f3795fa602d/download/"
# file_size = 42383741952
# f = RemoteFile(nwb_url, size=file_size, verbose=True)
# h5f = h5py.File(f, "r")
# acquisition = h5f['/acquisition/ElectricalSeriesAp']
# assert isinstance(acquisition, h5py.Group)
# d = acquisition['data']
# assert isinstance(d, h5py.Dataset)
# x = d[:30000, 101:105]
# print(x.shape)
# h5f.close()

# # https://neurosift.app/?p=/nwb&url=https://api.dandiarchive.org/api/assets/7e1de06d-d478-40e2-9b64-9dd04eafaa4c/download/&dandisetId=000876&dandisetVersion=draft
# nwb_url = "https://api.dandiarchive.org/api/assets/7e1de06d-d478-40e2-9b64-9dd04eafaa4c/download/"
# file_size = 18608927811
# f = WrappedFile(RemoteFile(nwb_url, size=file_size, verbose=True))
# h5f = h5py.File(f, "r")
# acquisition = h5f['/acquisition/ElectricalSeriesAP']
# assert isinstance(acquisition, h5py.Group)
# d = acquisition['data']
# assert isinstance(d, h5py.Dataset)
# x = d[:30000, 101:105]
# print(x.shape)
# h5f.close()

# # https://neurosift.app/?p=/nwb&url=https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/&dandisetId=000409&dandisetVersion=draft
# nwb_url = "https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/"
# file_size = 69109827653
# f = RemoteFile(nwb_url, size=file_size, verbose=True)
# h5f = h5py.File(f, "r")
# acquisition = h5f['/acquisition/ElectricalSeriesAp']
# assert isinstance(acquisition, h5py.Group)
# d = acquisition['data']
# assert isinstance(d, h5py.Dataset)
# x = d[:30000, 101:105]
# print(x.shape)
# h5f.close()

'done'