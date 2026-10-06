const { z } = require('zod');

const LOGIN_CODE_PATTERN = /^(\d{4,8}|MMR\d{4}|MMR\d{6}|MMR\d{12})$/;

const loginCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(LOGIN_CODE_PATTERN, 'Invalid login code format'));

const loginSchema = z.object({
  body: z.object({
    loginCode: loginCodeSchema,
    password: z.string().min(1, 'Password is required').max(64)
  })
});

const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(1, 'Refresh token is required').max(2048) })
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(1, 'New password is required').max(64)
  })
});

const resetPasswordSchema = z.object({
  body: z.object({ loginCode: loginCodeSchema })
});

module.exports = { loginSchema, refreshSchema, changePasswordSchema, resetPasswordSchema, loginCodeSchema };
