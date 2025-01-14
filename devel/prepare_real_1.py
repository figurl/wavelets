import numpy as np
import lindi
from upload_file import upload_file

def load_real_1(*, num_samples: int, num_channels: int, start_channel: int) -> np.ndarray:
    # https://neurosift.app/?p=/nwb&url=https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/&dandisetId=000409&dandisetVersion=draft
    nwb_url = "https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/"
    h5f = lindi.LindiH5pyFile.from_hdf5_file(nwb_url)
    ds = h5f['/acquisition/ElectricalSeriesAp/data']
    assert isinstance(ds, lindi.LindiH5pyDataset)
    ret = ds[:num_samples, start_channel:start_channel + num_channels]
    return ret

num_samples = 100000
start_channel = 101
num_channels = 1
fname = f'real_1_{num_samples}_{start_channel}_{num_channels}.npy'
X = load_real_1(num_samples=num_samples, num_channels=num_channels, start_channel=start_channel)
with open(fname, 'wb') as f:
    np.save(f, X)

url = f'https://lindi.neurosift.org/tmp/ephys-compression/{fname}'
upload_file(url, fname)
print(f'Uploaded {fname} to {url}')
