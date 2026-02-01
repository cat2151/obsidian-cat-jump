# obsidian-cat-jump

<p align="left">
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵-Japanese-red.svg" alt="Japanese"></a>
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸-English-blue.svg" alt="English"></a>
  <a href="https://deepwiki.com/cat2151/obsidian-cat-jump"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

An Obsidian community plugin that allows you to quickly jump your cursor to any location within a note.

## Installation
- Install the BRAT (Beta Reviewers Auto-update Tester) community plugin in Obsidian.
- Open the command palette, type `brat add`, and ensure the URL input dialog appears.
- Enter the URL of this GitHub repository.
- Select "Latest Version" and click the "Add" button.
- Assign a hotkey to the `Cat Jump : Jump` command.
- Press the hotkey and confirm that the labels appear.
- For updates, using `brat check` in the command palette is convenient. If changes don't reflect, restarting Obsidian may resolve the issue.

## Usage
- When you press the hotkey, labels will appear.
- Pressing the key corresponding to a label will jump your cursor to that labeled location.

## Features
- Low learning curve. Labels are arranged alphabetically (a-z) and color-coded, making it easy to predict their location.
- Simple. Labels only appear at the beginning of lines within the visible area of your note, making its behavior easy to understand.
- Collapse-aware. Only non-collapsed sections are labeled, allowing for intuitive operation.
- Ideal for long documents. Suited for quickly jumping to specific points in daily notes, lengthy documents, shallow or deep header levels, or within bullet lists.
- No modifier keys. For frequent jumping, it uses only a-z keys without requiring SHIFT or CTRL, reducing strain on your fingers.

*The English README was translated from Japanese using Gemini via GitHub Actions.