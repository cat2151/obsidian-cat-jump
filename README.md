# obsidian-cat-jump

An Obsidian community plugin that allows you to quickly jump your cursor to any location in your note.

## How to Use
### Installation
- Install the BRAT (Beta Reviewers Auto-update Tester) community plugin in Obsidian.
- Open the command palette, type `brat add`, and confirm that the URL input dialog appears.
- Enter the URL of this GitHub repository.
- Select `Latest Version` and click the `Add` button.
- Register the `Cat Jump : Jump` command to a hotkey.
- Press the hotkey and confirm that labels are displayed.
- For updates, `brat check` in the command palette is convenient. If changes are not reflected, restarting Obsidian may resolve the issue.

### Usage
- When you press the hotkey, labels will appear.
- Pressing a label's key will jump your cursor to that labeled location.

## Features
- Low learning curve. Labels are arranged alphabetically (a-z) and color-coded, making it easy to predict their location.
- Simple. Labels are displayed only at the beginning of lines within the visible area of the note, making the behavior easy to anticipate.
- Fold-aware. Only unfurled locations are labeled, allowing for intuitive operation.
- Designed for long documents. Ideal for quickly jumping to specific points in daily notes, lengthy notes, shallow or deep header levels, or within bullet lists.
- No modifier keys. For frequent jumping, it focuses solely on a-z keys without using SHIFT or CTRL, reducing strain on your fingers.

## Known Bugs
- Cannot jump to label "jj". As a temporary workaround, please jump to either the label above or below it. This will be fixed in a future update.

*The English README was translated from Japanese using Gemini via GitHub Actions.*