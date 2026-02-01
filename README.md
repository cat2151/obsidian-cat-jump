# obsidian-cat-jump

<p align="left">
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵-Japanese-red.svg" alt="Japanese"></a>
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸-English-blue.svg" alt="English"></a>
  <a href="https://deepwiki.com/cat2151/obsidian-cat-jump"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

An Obsidian community plugin that allows you to quickly jump your cursor to any location in a note.

## Installation
- Install the BRAT (Beta Reviewers Auto-update Tester) community plugin in Obsidian.
- Open the command palette, type `brat add`, and confirm that the URL input dialog appears.
- Enter the URL of this GitHub repository.
- Select `Latest Version` and click the `add` button.
- Register the `Cat Jump : Jump` command to a hotkey.
- Press the hotkey and confirm that the labels appear.
- For updates, `brat check` in the command palette is convenient. If changes are not reflected, restarting Obsidian may resolve the issue.

## Usage
- Press the hotkey to display labels.
- Press the key corresponding to a label to jump the cursor to that labeled location.

## Features
- Low learning curve. Labels are ordered from a-z and color-coded, making it easy to predict their location.
- Simple. Labels only appear at the beginning of lines within the visible area of the note, making its behavior easy to understand.
- Fold-aware. Only unfolded locations are labeled, allowing for intuitive operation.
- Suitable for long documents. Ideal for quickly jumping to specific points in daily notes, lengthy documents, shallow or deep header levels, or within bullet lists.
- No modifier keys. Designed for frequent jumps, it uses only a-z keys, without SHIFT or CTRL, to reduce finger strain.

Note: The English README was translated from Japanese using Gemini via GitHub Actions.