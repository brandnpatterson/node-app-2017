const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

// loginForm
exports.loginForm = (req, res) => {
  res.render('login', {
    title: 'Login'
  });
};

// registerForm
exports.registerForm = (req, res) => {
  res.render('register', {
    title: 'Register'
  });
};

// validateRegister
exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'Must supply a name for your account').notEmpty();
  req.checkBody('email', 'Must be a valid email').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password must not be blank').notEmpty();
  req.checkBody('password-confirm', 'Confirmed Password must not be blank').notEmpty();
  req.checkBody('password-confirm', 'Your passwords do not match').equals(req.body.password);

  // handle errors locally instead of using middleware
  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    });
    return;
  }
  next();
};

// register
exports.register = async (req, res, next) => {
  const user = new User({
    email: req.body.email,
    name: req.body.name,
    level: 10
  });
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next();
};

// account
exports.account = (req, res) => {
  res.render('account', {
    title: 'Edit Your Account'
  });
};

// updateAccount
exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  };
  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );
  req.flash('success', 'Updated account successfully!');
  res.redirect('/account');
};

// registerKnightForm
exports.registerKnightForm = (req, res) => {
  res.render('registerKnight', {
    title: 'Register Knight'
  });
};

// registerKnight
exports.registerKnight = async (req, res, next) => {
  const user = new User({
    email: req.body.email,
    name: req.body.name,
    level: 20
  });
  console.log(user.level);
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  res.redirect('/');
};
