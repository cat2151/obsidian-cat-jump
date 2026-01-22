# obsidian-cat-jump

A community plugin for Obsidian that allows you to quickly jump the cursor to any location in your note.

## Usage
### Installation
- Install the BRAT (Beta Reviewers Auto-update Tester) community plugin in Obsidian.
- Open the command palette, type `brat add`, and confirm that the URL input dialog appears.
- Enter the URL of this GitHub repository.
- Select "Latest Version" and press the "Add" button.
- Register the `Cat Jump : Jump` command to a hotkey.
- Press the hotkey and confirm that labels are displayed.
- For updates, using `brat check` in the command palette is convenient. If changes are not reflected, restarting Obsidian may resolve the issue.

### How to Use
- Press the hotkey to display labels.
- Press the key corresponding to a label to jump the cursor to that label's location.

## Features
- Low learning curve. Labels are arranged in a-z order and color-coded, making it easy to predict their location.
- Simple. Labels are only displayed at the beginning of lines within the visible range of the note, making its behavior easy to understand.
- Considers folded content. Only unfurled locations are labeled, allowing for intuitive operation.
- Suitable for long notes. Ideal for quickly jumping to daily notes, lengthy documents, shallow or deep header levels, or within bullet lists.
- No modifier keys. For frequent jumping, it uses only a-z keys without SHIFT or CTRL, reducing strain on your fingers.

## Known Bugs
- Cannot jump to label "jj". As a workaround, jump to either the label above or below it. This will be fixed in a future update.

Note: This README is currently under construction. Its contents may be updated in the future.