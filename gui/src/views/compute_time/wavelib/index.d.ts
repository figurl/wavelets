// Generated by dts-bundle-generator v7.2.0

export type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;
export type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;
export type Biorthogonal =
  | "bior1.1"
  | "bior1.3"
  | "bior1.5"
  | "bior2.2"
  | "bior2.4"
  | "bior2.6"
  | "bior2.8"
  | "bior3.1"
  | "bior3.3"
  | "bior3.5"
  | "bior3.7"
  | "bior3.9"
  | "bior4.4"
  | "bior5.5"
  | "bior6.8";
export type Wavelet =
  | "haar"
  | Biorthogonal
  | `r${Biorthogonal}`
  | `db${IntRange<1, 37>}`
  | `coif${IntRange<1, 18>}`
  | `sym${IntRange<2, 21>}`;
export type Mode = "sym" | "per";
export declare function init(wasmUrl?: string): Promise<void>;
export declare function wavedec(
  data: Float64Array,
  wavelet: Wavelet,
  mode?: Mode,
  level?: number | undefined,
): Float64Array[];
export declare function waverec(
  coeffs: Float64Array[],
  wavelet: Wavelet,
  signallength: number,
  mode?: Mode,
): Float64Array;

export {};
