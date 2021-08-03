export default bufferStartsWith;

function bufferStartsWith(buf1: Buffer, buf2: Buffer): boolean {
  const buf1InSizeOfbuf2 = buf1.subarray(0, buf2.length);
  return buf1InSizeOfbuf2.equals(buf2);
}
