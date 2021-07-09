module.exports = cBufferEqualsSequence;

function cBufferEqualsSequence(cbuff, value) {
  for (let i = 0; i < cbuff.size; ++i) {
    if (cbuff.get(i) !== value[i]) {
      return false;
    }
  }
  return true;
}
