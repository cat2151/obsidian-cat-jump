# obsidian-cat-jump

This is an Obsidian community plugin that allows you to quickly jump the cursor to any location in your note.

## Status
- WIP. It should be installable via BRAT, but this is currently under investigation.

## Usage
### Installation
- Install the BRAT (Beta Reviewers Auto-update Tester) community plugin into Obsidian.
- Launch BRAT from the command palette or similar.
- Enter this GitHub repository's URL.
- Register a command to a hotkey.
- Press the hotkey and confirm that labels are displayed.
- For updates, using `brat check` or similar commands from the command palette is convenient. If changes are not reflected, restarting Obsidian may resolve the issue.

### How to Use
- When you press the hotkey, labels will appear.
- Pressing a label's key will jump the cursor to that label's location.

## Features
- Low learning curve. Labels are arranged in a-z order, making their locations easy to predict.
- Simple. Labels are displayed only at the beginning of lines within the visible area of the note, making its behavior easy to infer.
- Considers folded sections. Only unfurled (unfolded) sections are labeled, allowing for intuitive operation.
- Suited for long documents. It is suitable for navigating between locations without header structures, such as daily notes or long-form notes.
- No modifier keys. For frequent jumping, it avoids using SHIFT or CTRL keys, limiting input to only a-z keys, to reduce strain on your fingers.

※ This README is currently under construction. The content may be updated in the future.