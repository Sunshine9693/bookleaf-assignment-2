# Free-plan follow-up — 15 November 2026 (IST)

The user reaffirmed **Keep Free**, then **Keep packaging; I cannot enter credentials now**. No purchase, credential change, public deployment, invitation or notification request was made in this follow-up.

## Newly observed browser results

- **Admin author-detail logout: PASS.** From Kavita Deshmukh's admin detail, Log out navigated to `/version-test/login`. [Destination capture](admin-detail-logout-followup-live.txt).
- **Wrong-password rejection: PASS.** One deliberately incorrect password was submitted for the existing approved Author 1 test account. The page displayed `Invalid email or password. Please try again.` and stayed on login. The password field was cleared before evidence capture. [Text](wrong-password-followup-live.txt), [screenshot](../wrong-password-followup-live.png).
- **Protected admin route after rejected login: PASS.** Opening `/version-test/admin-dashboard` returned to `/version-test/login`. [Destination capture](wrong-password-protected-route-live.txt). This does not prove successful password login or all protected routes.
- **Production/null rendering: PARTIAL.** The builder read Kavita's admin detail in the browser. BK015 / Raising Roots showed exact `Publication status: In Production - Typesetting`, an In Production badge, three royalty values of 0, copies sold 0 and `No payout recorded`. Its metadata line showed blank Published, `MRP: Rs ` and blank Available on. No fabricated numeric MRP was shown, but these missing values lack explicit unavailable labels. Print partner and per-copy royalty were not observed in that view. This paragraph records the observed fields; the full AX snapshot was not preserved, so it is not independent raw-capture evidence.

The live negative-login workflow executed successfully despite the previously reported Free-plan workflow-limit notice. Therefore that notice must not be described as proof that every app workflow is blocked. A full AI/callback run remains unverified, with working private credentials unavailable and callback exposure OFF. No additional notification was created to probe the restriction.

## Remaining acceptance gates

Successful Admin/Author password login still requires private provisioning of the existing users. A failed login is not a substitute. Browser credential changes require the user to enter and submit them directly.

The real provider component attempt remains failed (`valid=false`); see [sanitized result](../n8n/PROVIDER_COMPONENT_RESULT.md). No valid AI response, authenticated callback, successful bulk generation or replay/security acceptance is claimed. Main n8n stays inactive; Bubble callback stays unexposed; Data API stays off.

`musavir@bookleafpub.in` is documented as the intended Bubble collaborator. That does not establish a GitHub identity, an accepted invitation, repository access or preview login. No invitation was sent. The ZIP remains an available reviewer artifact for user-directed delivery; no submission email was sent.
