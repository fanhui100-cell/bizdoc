# Payment automation plan

Current production flow:

1. The user chooses Pro or Business.
2. The user pays by scanning the WeChat Pay or Alipay QR code.
3. The user includes the registered email in the payment note.
4. The user contacts support with the payment time, payer name, or screenshot note.
5. The admin verifies the payment and updates the user plan in the admin panel.

Future automatic activation flow:

1. Apply for official WeChat Pay and Alipay merchant accounts.
2. Create backend checkout records with a unique order number and amount.
3. Generate official payment QR codes or payment pages from the merchant APIs.
4. Receive asynchronous payment callbacks on the backend.
5. Verify signatures, amount, order number, and payment status.
6. Update `users_profile.plan`, quota, expiry, and payment records automatically.
7. Keep callback logs and admin/audit logs for refunds and support.

Do not activate paid plans from frontend redirect status alone. Automatic activation must be based on verified backend payment callbacks.
