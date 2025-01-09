# Real Data Analysis

Let's examine how our compression methods perform on real electrophysiology data from a [publicly available dataset](https://neurosift.app/?p=/nwb&url=https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/&dandisetId=000409&dandisetVersion=draft).

Here's a sample of the signal we're analyzing:

```python
# generate-plot
import numpy as np
import requests
import io

def load_real_1(*, num_samples: int, num_channels: int, start_channel: int) -> np.ndarray:
    url = f'https://lindi.neurosift.org/tmp/ephys-compression/real_1_{num_samples}_{start_channel}_{num_channels}.npy'
    response = requests.get(url)
    response.raise_for_status()
    return np.load(io.BytesIO(response.content))

signal = load_real_1(num_samples=5000, num_channels=1, start_channel=101)

import matplotlib.pyplot as plt
timestamps = np.arange(len(signal)) / 30000
plt.figure(figsize=(10, 5))
plt.plot(timestamps, signal)
plt.xlabel('Time (s)')
plt.ylabel('Amplitude')
plt.title('Sample Ephys Signal')
plt.show()
```

The compression performance on this real data demonstrates interesting characteristics when compared to our theoretical analysis. Let's examine how different compression methods perform:

```python
# generate-plot
from scripts.compression_ratio_vs_nrmse import show_compression_method_comparison
show_compression_method_comparison("real", use_filter=False)
show_compression_method_comparison("real", use_filter=True)
```

---

_All calculations for this site are computed live in your browser using [Pyodide](https://pyodide.org/), a Python runtime for the web._
