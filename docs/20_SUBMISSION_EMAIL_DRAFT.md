# HR submission email - copy into the existing email thread

Fill the two test-password placeholders directly in your private email composer. Never save real passwords in this file or Git. This draft has not been sent.

Subject: keep the existing thread subject: Re: BookLeaf Technical Assignment Submission - Sana Fatma

Dear Saloni Ma'am and BookLeaf Team,

Thank you for the opportunity to work on the second technical assignment. Please find my Author Royalty Dashboard and Automated Notification System implementation and review materials below.

1. Bubble application (Free-plan development preview)
https://sanathesunshine9693.bubbleapps.io/version-test/login

Test accounts:
- Admin email: bookleaf.admin@example.com
  Password: [ENTER THE NEW ADMIN TEST PASSWORD HERE]
- Author email: bookleaf.author1@example.com
  Password: [ENTER THE NEW AUTHOR 1 TEST PASSWORD HERE]

2. README and implementation documentation
https://github.com/Sunshine9693/bookleaf-assignment-2/blob/main/docs/SUBMISSION_README.md

This covers the database structure and relationships, Bubble/n8n integration and payload approach, AI prompt strategy, privacy rules, error handling, testing and implementation challenges.

3. n8n workflow exports
Main workflow:
https://github.com/Sunshine9693/bookleaf-assignment-2/blob/main/n8n/royalty-summary-hardened-live-export.json
Error-handling workflow:
https://github.com/Sunshine9693/bookleaf-assignment-2/blob/main/n8n/royalty-summary-error-live-export.json

4. Fullscreen walkthrough (approximately 3 minutes 28 seconds)
https://github.com/Sunshine9693/bookleaf-assignment-2/blob/main/deliverables/bookleaf-fullscreen-walkthrough.mp4

This is a silent, captioned, edited actual-browser capture at 5 fps, with idle gaps shortened. It shows the Author/Admin views, a real isolated AI execution and the callback restriction; it is not a demonstration of successful end-to-end callback delivery.

Repository access
The repository is private. A collaborator invitation was sent to musavir@bookleafpub.in, resolved by GitHub to musavir-khurshid. Please accept the invitation to open the repository, documentation, exports and video links. The repository has not been made public.

Implementation status and Free-plan limitation
The app preserves the supplied 10 authors and 18 books. Role-based dashboards, royalty figures, filters and notification history are implemented, and the Admin and Author test passwords have been reset for review. Shared-secret matching and real AI component generation were verified.

During the callback test, Bubble returned an explicit subscription-required Workflow API error. The full callback-to-NotificationLog Success path and successful bulk/replay acceptance therefore remain unverified. The main automation is unpublished and callback disabled after testing, so the live trigger is not currently operational. The actual failure and recovery evidence are documented; no paid plan or real author email was used. n8n Cloud workspace viewer access has not yet been configured; workflow exports and the recorded execution are provided for review.

I have used the Free-plan review approach described in your email, with the app URL, test logins and walkthrough. Please advise how you would prefer the remaining API restriction and workspace-view access requirement to be assessed.

Thank you for reviewing my work.

Best regards,
Sana Fatma
