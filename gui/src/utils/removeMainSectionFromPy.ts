export const removeMainSectionFromPy = (code: string) => {
  return removeEverythingAfter(code, "if __name__ == '__main__':");
};

const removeEverythingAfter = (s: string, substr: string) => {
  const i = s.indexOf(substr);
  if (i === -1) {
    return s;
  }
  return s.slice(0, i);
};
