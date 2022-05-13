module.exports = pipe;

function pipe(pipee, ...funcs) {
  return funcs.reduce((currPipee, nextFunc) => nextFunc(currPipee), pipee);
}
