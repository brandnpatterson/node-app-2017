const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

// login
exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login',
  successRedirect: '/table-of-contents',
  successFlash: 'You are now logged in!'
});

// logout
exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

// isLoggedIn
exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Try logging in first!');
  res.redirect('/login');
};

// forgot
exports.forgot = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // make sure user exists
    req.flash('error', 'No account with that email exists');
    return res.redirect('/login');
  } else {
    // reset tokens and expiry on user account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // one hour from now
    await user.save();
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    // send the email to reset
    await mail.send({
      user: user,
      subject: 'Password Reset',
      filename: 'password-reset',
      resetURL: resetURL
    });
    req.flash('success', `You have been emailed a password reset link.`);
    res.redirect('/login');
  }
};

// reset
exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or expired');
    return res.redirect('/login');
  }
  res.render('reset', {
    title: 'Reset Your Password'
  });
};

// confirmedPasswords
exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    return next();
  }
  req.flash('error', 'Passwords do not match!');
  res.redirect('back');
};

// update
exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or expired');
    return res.redirect('/login');
  }
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'Your password has been reset! You are now logged in!');
  res.redirect('/');
};
