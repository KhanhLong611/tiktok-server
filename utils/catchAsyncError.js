// An async function always returns a promise. The  resolved value of the Promise is what ever the async function return. If there is no return statement, it will return a Promise implicitly with the resolved value = undefined. Then you can chain a catch()block to the returned Promise to catch the rejected value which the await keyword get (aka the Error)
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
      next(err);
    });
  };
};
