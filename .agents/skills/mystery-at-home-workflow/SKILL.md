---
name: mystery-at-home-workflow
description: Complete repository changes in MysteryAtHome with a commit and push to origin/main. Use when editing this project's code, content, instructions, or skills.
---

# MysteryAtHome workflow

Apply only to the MysteryAtHome repository. Follow its [AGENTS.md](../../../AGENTS.md), including Slovak communication and the existing Site publishing workflow.

- Before starting each new user task, briefly summarize your understanding in Slovak and ask whether it may proceed (for example, "Môže to tak byť?"). Wait for the user's explicit confirmation before implementing that task. If the user corrects the summary, confirm the revised understanding first. Once confirmed, complete the agreed scope, including its required commit, push, and publication, without requesting the same approval again.
- Treat mobile phones as the primary device for both the sales page and gameplay. Design and visually check these experiences on phone-sized screens first: readable text, comfortable touch controls, proportionate media, and a coherent composition of images, text, and actions. A desktop layout or a check for horizontal overflow alone is not enough to establish mobile quality. For example, preserve the opening illustration's visual impact with text over the image on phones instead of separating it into a large dark text block followed by the image.
- Preparation, storyboard, and Game Master are primarily desktop workflows for the parent and developer. Optimize them for computer use; their phone layout has lower priority than the sales page and gameplay. Preserve a good desktop presentation while prioritizing phone quality in the player-facing experience.
- When changing a task, keep its storyboard, printable worksheet, parent instructions and downloadable PDFs synchronized in the same task. Use the shared content in `print-materials.js` and game answers from `game-data.js`; regenerate affected PDFs/previews and the combined bundle, and check that instructions, clues and solutions agree. The parent guide is the first printable page and should remain a readable single A4 covering the introduction and every task.
- Work only on `main`. Do not create feature branches or push changes to another branch.
- After each completed task that changes repository files, commit the task's changes with a descriptive message and push to `origin/main`. The user has explicitly authorized this workflow; do not ask again for routine commits and pushes.
- If the Sites source helper creates commits, reuse them and push them to `origin/main` too. A push to the Sites source repository does not replace the GitHub push.
- Verify the push succeeded before reporting completion. Reconcile remote changes without force-pushing or discarding user work. If a push remains blocked, report the blocker accurately.
- After every completed change, including instructions and skills, include a clickable Markdown link to the permanent deployed Site in the final response. The user wants to click it and open the preview in a new browser tab; use a supported new-tab handoff when available. Browser-tab behavior of chat links depends on the client, so do not promise a forced new tab without tool support. Never substitute localhost or a temporary Codespace URL. Current Site URL: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site. Use the latest returned deployment URL if it changes.
- Read-only actions do not need an empty commit. Do not commit secrets or unrelated work.
