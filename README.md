# credit-card-number-alert-zimlet
A zimlet that warns the user if content has credit/debit card numbers while composing an email using Zimbra Web Client.

### Features:
+ Supports enabling/disabling through Zimlet panel preference dialog.
+ Support for in app view as well as composing using a new window.
+ Support for Visa, MasterCard, Amex Card & Discover Card.
+ Ignore's the content for old emails in the conversation while replying or forwarding.

### How to deploy:
Deploy: (zimlet files to be zipped directly at root level)
```
zmzimletctl deploy com_zimbra_cardnumberalert.zip
```

**User needs to enable the zimlet using zimlet panel dialog. (it is disabled by default).**
