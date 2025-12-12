export const validationMessages = {
  login: {
    usernameRequired: 'Epic sadface: Username is required',
    passwordRequired: 'Epic sadface: Password is required',
    invalidCredentials: 'Epic sadface: Username and password do not match any user in this service',
    lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  },
  checkout: {
    firstNameRequired: 'Error: First Name is required',
    lastNameRequired: 'Error: Last Name is required',
    postalCodeRequired: 'Error: Postal Code is required',
  },
};

export type LoginValidationKey = keyof typeof validationMessages.login;
export type CheckoutValidationKey = keyof typeof validationMessages.checkout;
