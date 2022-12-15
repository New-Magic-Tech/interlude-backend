const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const HttpError = require('../models/http-error');
const User = require('../models/userModel');

const getUserDoc = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.params.uid)
  } catch (err) {
    const error = new HttpError(
      'Fetching users failed, please try again later.',
      500
    );
    return next(error);
  }
  res.json({ userDoc: user.userDoc });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    /*next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );*/
    return res.json({error:errors})
  }

  const { username, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not create user, please try again.',
      500
    );
    return next(error);
  }

  const createdUser = new User({
    username,
    email,
    password: hashedPassword,
    walls: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_PASSWORD,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, 
      email: createdUser.email, 
      token: token,
      walls:[],
      username: createdUser.username,
    });
};

const signin = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check your credentials and try again.',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_PASSWORD,
      //{ expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    username: existingUser.username,
    walls: existingUser.walls,
    token: token
  });
};

const updateField = async (req, res, next) =>{
  const {field, info} = req.body
  const uid = req.params.uid
  let user
  try{
    user= await User.findById(uid)
    user[field] = info
    await user.save()
  }catch{
    const error = new HttpError(
      'failed to update user',
      500
    )
    return next(error);
  }
  if (!user) {
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }


  res.status(201).json({userDoc: user.userDoc})
}

const pushField = async (req, res, next) =>{
  const {field, info} = req.body
  const uid = req.params.uid
  let user
  try{
    user= await User.findById(uid)
    user[field].push(info)
    await user.save()
  }catch{
    const error = new HttpError(
      'failed to push user',
      500
    )
    return next(error);
  }
  if (!wall) {
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }


  res.status(201).json({userDoc: user.userDoc})
}


exports.getUserDoc = getUserDoc;
exports.signup = signup;
exports.signin = signin;
exports.updateField = updateField;
exports.pushField = pushField;