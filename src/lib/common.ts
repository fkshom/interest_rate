const zip = (...arrays) => {
  const length = Math.min(...(arrays.map(arr => arr.length)))
  return new Array(length).fill().map((_, i) => arrays.map(arr => arr[i]))
}

export { zip }
