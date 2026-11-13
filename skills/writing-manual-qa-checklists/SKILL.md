---
name: writing-manual-qa-checklists
description: Use when someone asks for a manual QA checklist, QA script, test plan, smoke test or click-through that a person will run by hand in a browser, for a pull request, a feature, a bug fix or a release, usually on a staging or preview site.
---

# Writing manual QA checklists

## Overview

A manual QA checklist is only worth running if every step can be done exactly as written and every expected result matches what the screen shows. **Copy, don't recall:** every label and expected string comes from the deployed screen or the deployed code, checked right before you write, and everything the tester types is ready to paste.

**Match the effort to the change.** For one PR, read the code behind each step and write a short page with one reviewer pass. For a release, give each feature area its own reader and use two reviewers. Don't build render harnesses or string-matching scripts: reading the code, looking at the screen and the review are the checks.

## What you hand over

One HTML page, rendered from a JSON spec with `scripts/render-checklist.mjs` (format and commands in `checklist-spec.md`), served locally, with ticks, notes and **Copy results** saved in the browser. It contains, in this order:

1. **Before you start.** The environment URL, the accounts and which window each is used in, the window width, how to paste (click Copy, click in the box, Cmd/Ctrl+A, Cmd/Ctrl+V), where controls sit when they scroll out of view, browser prompts that may appear, and what to ignore.
2. **Starting values.** The exact current value of everything the QA changes, read from the data, and where each one shows on each surface. The tester never has to write them down.
3. **Known behaviours.** What looks wrong but isn't a failure, so the tester doesn't stop on it.
4. **Steps.** Each has a number, a short title, numbered actions and one Expect.
   - Actions use the labels exactly as the screen shows them, capitals included.
   - Every in-between dialog is named in order: "**Save changes** opens **Save 2 answers?**; click **Save 2 answers**."
   - Anything typed is a paste block with a Copy button: a full replacement value, labelled by round and tab.
   - The Expect quotes the exact strings, says how long a passing state lasts, and gives the fallback if it times out.
5. **Clean-up steps** that put every starting value back.
6. A last step: **tell Claude "QA done"**.

## Method

1. **Pin what's deployed.** Check that the change is merged, which commit the target environment runs (deploy record or CI run), and whether anything later touched the same code. Check again just before you write the setup. If it isn't deployed where the tester will QA, say so. Add a local-server tab only when asked.
2. **Pick test subjects** from the current data, read only.
   - Prefer empty fields and throwaway values on test records that nobody else is using.
   - Never use real customer data.
   - When the feature needs existing state (a history to restore, a held value, a clash), the first steps create it with throwaway values. Don't borrow a record because it already has that state: that record changes for good.
   - Record the starting values.
3. **Read the code** for every string and state change: what each click does, what is per tab, what refreshes and what goes stale, polling and timeouts, list order.
4. **Look at every surface the steps point at, read only**, and copy the labels as displayed. Opening an editor without saving is fine; never click anything that writes. Without a browser, mark those Expects "from code, not seen on screen".
5. **Write the spec, render and serve it.** Order the steps so each starts from the state the one before leaves. Give tests that would collide their own fields.
6. **Review independently.** Reviewers get the page and the code paths. The checks:
   - every quoted string;
   - the steps walked as a state machine: versions, tabs, timers and clean-up.

   For one PR, one reviewer does both. For a release, use two reviewers, one per check, plus one comparing coverage with the feature list. Verify each finding in the code yourself before you change the page. Without subagents, do the passes yourself, one after the other.
7. **Check the page**: both themes, a narrow window, and every Copy value byte for byte.
8. **After "QA done"**, check read-only that:
   - the data is back to the starting values;
   - copies or syncs elsewhere match;
   - nothing is left over, such as drafts, locks or holds.

   Then read the history for anything unexpected, such as an extra save, and report it. Write these checks while you build the page, so they're ready.

## Common mistakes

| Mistake | Instead |
|---|---|
| Expected values from one query, or from memory | Copy them from the screen and the code, checked today |
| Expecting a status before the action that creates it | Expect only what that tab can show at that moment |
| A local-server tab when the change is already deployed | Check the deploy state just before writing |
| "Edit X" with no text to type | A paste block with the full value |
| Skipping the dialog that opens first | Name every dialog in order |
| A word the UI uses for something else | Use the UI's terms and say where each value shows |
| Assuming a page refreshes by itself | Check the code; add the reload and say what's stale |
| Real records changed, no way back | Throwaway values, a starting-values card, clean-up steps |
| Borrowing a record because it already has the state you need | Create that state with throwaway values in the first steps |
| Side-by-side windows | Full width: narrow windows switch to the mobile layout |
| Provenance tables and appendices on the page | Keep sources for the reviewers; the page is for the tester |
