# Security Specification - DemoForce

## Data Invariants
1. A user can only access their own profile.
2. A task must have a `userId` matching the creator's ID.
3. A chat message must have a `userId` matching the sender's ID.
4. Users can only read/write documents where `userId` matches their authentication ID.

## The "Dirty Dozen" Payloads

1. **Profile Spoofing**: Attempt to create a user document with a different ID than the authenticated user.
2. **Task Hijacking**: Attempt to read tasks belonging to another user.
3. **Shadow Task Field**: Attempt to inject a field like `systemAdmin: true` into a task.
4. **Invalid Task ID**: Attempt to use a 2MB string as a taskId.
5. **Unauthorized Task Deletion**: Attempt to delete another user's task.
6. **Chat Log Scraping**: Attempt to list all chat messages without a userId filter.
7. **Bypassing Verification**: Attempt to write if `email_verified` is false (if enforced).
8. **Impersonation**: Attempt to set `userId` in a task to someone else's ID.
9. **Tampering with Timestamps**: Attempt to set `createdAt` to a future date instead of `request.time`.
10. **Orphaned Task**: Attempt to create a task for a project that doesn't exist (if projects are enforced).
11. **Malicious Enum**: Attempt to set chat role to "admin" instead of "user" or "model".
12. **PII Leak**: Attempt to read the entire `users` collection.

## Test Runner (Logic Check)
The `firestore.rules` must deny all the above.
