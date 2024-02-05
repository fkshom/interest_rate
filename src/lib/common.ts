// const zip = (...arrays) => {
//   const length = Math.min(...(arrays.map(arr => arr.length)))
//   return new Array(length).fill(undefined).map((_, i) => arrays.map(arr => arr[i]))
// }

const zip = <T extends (readonly unknown[])[]>(
  ...args: [...T]
): { [K in keyof T]: T[K][number] }[] => {
  if (!args.length) return [];
  const minLen = args.reduce((a, c) => (a.length < c.length ? a : c)).length;
  let result = [];
  for (let i = 0; i < minLen; i++) {
    result.push(args.map((arg) => arg[i]));
  }
  return result as any[];
};

export { zip }
