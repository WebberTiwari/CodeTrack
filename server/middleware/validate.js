const Joi = require("joi");

// ─── Schemas ────────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name must be at most 50 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(4).max(100).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// ─── Middleware Factory ──────────────────────────────────────────────────────

/**
 * validate(schema)
 * Returns an Express middleware that validates req.body against the given Joi schema.
 * On failure → 400 with the first validation error message.
 * On success → calls next().
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = { validate, registerSchema, loginSchema };