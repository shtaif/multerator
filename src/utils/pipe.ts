const pipe: PipeFunction = (initVal: unknown, ...funcs: Function[]) => {
  return funcs.reduce((currVal, nextFunc) => nextFunc(currVal), initVal);
};

export default pipe;

interface PipeFunction {
  <INIT_VAL>(initVal: INIT_VAL): INIT_VAL;

  <INIT_VAL, A>(initVal: INIT_VAL, ...funcs: [(arg: INIT_VAL) => A]): A;

  <INIT_VAL, A, B>(
    initVal: INIT_VAL,
    ...funcs: [(arg: INIT_VAL) => A, (arg: A) => B]
  ): B;

  <INIT_VAL, A, B, C>(
    initVal: INIT_VAL,
    ...funcs: [(arg: INIT_VAL) => A, (arg: A) => B, (arg: B) => C]
  ): C;

  <INIT_VAL, A, B, C, D>(
    initVal: INIT_VAL,
    ...funcs: [
      (arg: INIT_VAL) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D
    ]
  ): D;

  <INIT_VAL, A, B, C, D, E>(
    initVal: INIT_VAL,
    ...funcs: [
      (arg: INIT_VAL) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E
    ]
  ): E;

  <INIT_VAL, A, B, C, D, E, F>(
    initVal: INIT_VAL,
    ...funcs: [
      (arg: INIT_VAL) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E,
      (arg: E) => F
    ]
  ): F;

  <INIT_VAL, A, B, C, D, E, F, G>(
    initVal: INIT_VAL,
    ...funcs: [
      (arg: INIT_VAL) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E,
      (arg: E) => F,
      (arg: F) => G
    ]
  ): G;

  <INIT_VAL, A, B, C, D, E, F, G, H>(
    initVal: INIT_VAL,
    ...funcs: [
      (arg: INIT_VAL) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E,
      (arg: E) => F,
      (arg: F) => G,
      (arg: G) => H
    ]
  ): H;

  <INIT_VAL, A, B, C, D, E, F, G, H, I>(
    initVal: INIT_VAL,
    ...funcs: [
      (arg: INIT_VAL) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E,
      (arg: E) => F,
      (arg: F) => G,
      (arg: G) => H,
      (arg: H) => I
    ]
  ): I;

  <INIT_VAL, A, B, C, D, E, F, G, H, I, J>(
    initVal: INIT_VAL,
    ...funcs: [
      (arg: INIT_VAL) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E,
      (arg: E) => F,
      (arg: F) => G,
      (arg: G) => H,
      (arg: H) => I,
      (arg: I) => J
    ]
  ): J;
}

// // https://medium.com/ackee/typescript-function-composition-and-recurrent-types-a9efbc8e7736

// type Lookup<T, K extends keyof any, Else = never> = K extends keyof T
//   ? T[K]
//   : Else;

// type Tail<T extends any[]> = ((...t: T) => void) extends (
//   x: any,
//   ...u: infer U
// ) => void
//   ? U
//   : never;

// type Func1 = (arg: any) => any;

// type ArgType<F, Else = never> = F extends (arg: infer A) => any ? A : Else;

// type AsChain<F extends [Func1, ...Func1[]], G extends Func1[] = Tail<F>> = {
//   [K in keyof F]: (arg: ArgType<F[K]>) => ArgType<Lookup<G, K, any>, any>;
// };

// type LastIndexOf<T extends any[]> = ((...x: T) => void) extends (
//   y: any,
//   ...z: infer U
// ) => void
//   ? U['length']
//   : never;

// interface PipeFunction2 {
//   // <F extends [(arg: any) => any, ...Array<(arg: any) => any>]>(
//   // <F extends [(arg: any) => any, ...((arg: any) => any)[]]>(
//   <F extends [any, ...((arg: any) => any)[]]>(...f: F & AsChain<F>): (
//     arg: ArgType<F[0]>
//   ) => ReturnType<F[LastIndexOf<F>]>;
// }

// const result = pipe(
//   'a'
//   // value => value.length,
//   // value => [value || null],
//   // value => ({ value }),
//   // value => value
// );
