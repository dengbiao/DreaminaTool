export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];

export type Nullable<T> = T | null;

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;

export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

export type RetryOptions = {
  attempts?: number;
  delay?: number;
  onRetry?: (error: Error, attempt: number) => void;
};

export type Awaited<T> = T extends Promise<infer R> ? R : T;

export type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never; 