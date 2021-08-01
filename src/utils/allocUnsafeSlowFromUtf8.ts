export default allocUnsafeSlowFromUtf8;

function allocUnsafeSlowFromUtf8(str: string): Buffer {
  const buf = Buffer.allocUnsafeSlow(str.length);
  buf.write(str);
  return buf;
}
