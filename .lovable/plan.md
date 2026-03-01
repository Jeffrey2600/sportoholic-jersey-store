

# Add Forgot Password / Password Reset Flow

Currently, the Auth page only has login and signup -- there's no way to recover a forgotten password. This plan adds a complete password reset flow.

## What You'll Get

1. A "Forgot Password?" link on the login form
2. A screen to enter your email and receive a password reset link
3. A dedicated page where you set your new password after clicking the email link

## Technical Details

### 1. Update Auth Page (`src/pages/Auth.tsx`)
- Add a "Forgot Password?" link below the password field (visible only in login mode)
- Add a third view mode (`forgotPassword`) that shows an email input and a "Send Reset Link" button
- Call the password reset API with `redirectTo` pointing to `/reset-password`

### 2. Create Reset Password Page (`src/pages/ResetPassword.tsx`)
- New page at `/reset-password` route
- Detects the recovery token from the URL hash
- Shows a form with "New Password" and "Confirm Password" fields
- Validates passwords match and meet strength requirements
- Calls the API to update the password
- Redirects to home on success

### 3. Add Route (`src/App.tsx`)
- Register `/reset-password` as a new public route pointing to the `ResetPassword` page

