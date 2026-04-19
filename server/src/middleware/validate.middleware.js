function validateBody(rules) {
  return (req, res, next) => {
    const errors = {};

    Object.entries(rules).forEach(([field, validator]) => {
      const result = validator(req.body?.[field], req.body || {});

      if (result) {
        errors[field] = result;
      }
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: "Please check the highlighted fields.",
        fields: errors,
      });
    }

    next();
  };
}

function required(label) {
  return (value) => {
    if (value == null || String(value).trim() === "") {
      return `${label} is required`;
    }

    return null;
  };
}

function email(value) {
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
    return "Enter a valid email address";
  }

  return null;
}

function password(value) {
  const nextValue = String(value || "");

  if (nextValue.length < 6) {
    return "Password must be at least 6 characters";
  }

  if (!/[A-Z]/.test(nextValue)) {
    return "Password must include at least 1 uppercase letter";
  }

  if (!/\d/.test(nextValue)) {
    return "Password must include at least 1 number";
  }

  return null;
}

function oneOf(options, label = "Value") {
  return (value) => {
    if (!options.includes(value)) {
      return `${label} must be one of: ${options.join(", ")}`;
    }

    return null;
  };
}

function optionalNumber(label, { min, max } = {}) {
  return (value) => {
    if (value == null || value === "") {
      return null;
    }

    const nextValue = Number(value);

    if (Number.isNaN(nextValue)) {
      return `${label} must be a number`;
    }

    if (min != null && nextValue < min) {
      return `${label} must be at least ${min}`;
    }

    if (max != null && nextValue > max) {
      return `${label} must be no more than ${max}`;
    }

    return null;
  };
}

module.exports = {
  validateBody,
  required,
  email,
  password,
  oneOf,
  optionalNumber,
};
