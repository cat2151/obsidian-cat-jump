# obsidian-cat-jump

An Obsidian community plugin that allows you to quickly jump your cursor to any location in a note.

## How to Use
### Installation
- Install the BRAT (Beta Reviewers Auto-update Tester) community plugin in Obsidian.
- Open the command palette, type `brat add`, and confirm that the URL input dialog appears.
- Enter this GitHub repository's URL.
- Select `Latest Version` and click the `add` button.
- Register the `Cat Jump : Jump` command to a hotkey.
- Press the hotkey and confirm that the labels appear.
- For updates, it's easy to use `brat check` in the command palette. If the changes are not reflected, restarting Obsidian may resolve the issue.

### Usage
- When you press the hotkey, labels will appear.
- Pressing a label's key will jump your cursor to that label's location.

## Features
- Low learning curve. Labels are arranged in a-z order, making it easy to predict their location.
- Simple. Labels are only displayed at the beginning of lines within the visible range of the note, making the behavior easy to infer.
- Fold-aware. Only unfurled/unfolded sections are labeled, allowing for intuitive operation.
- Suitable for long documents. Ideal for navigating daily notes, long notes, or other areas without a header structure.
- No modifier keys. For frequent jumping, it uses only a-z keys, without SHIFT or CTRL, to reduce strain on your fingers.

## Known Bugs
- Cannot jump to label "jj". As a workaround, please jump to either the label above or below it.

※ This README is currently under construction. Its content may be updated in the future.