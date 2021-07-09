module.exports = allocUnsafeSlowFromUtf8;

function allocUnsafeSlowFromUtf8(str) {
  const buf = Buffer.allocUnsafeSlow(str.length);
  buf.utf8Write(str);
  return buf;
}
