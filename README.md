# Power Poshmark README

## Sign Up and Payment Process
The homepage main CTA will perform as follows:
  - By default, it will direct the user to the Google authentication site.
  - After signing up with Google (or if the user is already in the DB), the user will be redirected to `/?registered=true` and EJS will provide the email address as the value of `#email-input`.
  - On `/?registered=true`, JavaScript will check if this query exists and the email value is present and if so it will open the Stripe payment modal.
