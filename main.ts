import { Editor, MarkdownView, Plugin } from 'obsidian';

/**
 * ジャンプ先の情報を保持するインターフェース
 */
interface JumpTarget {
    line: number;
    char: string;       // 実際の判定文字 (例: "a")
    label: string;      // 表示用ラベル (例: "a", "ja")
    prefix: string | null; // プレフィックス ("j", "k"... or null)
    top: number;
    left: number;
    element?: HTMLElement;
}

/**
 * キー割り当て計算結果用インターフェース
 */
interface KeyScheme {
    baseKeys: string[];      // 1ページ目のキー配列
    activePrefixes: string[]; // 使用するプレフィックス配列
}

// Monokai Palette Definition
const MONOKAI = {
    yellow: '#E6DB74',
    green:  '#A6E22E',
    orange: '#FD971F',
    purple: '#AE81FF',
    blue:   '#66D9EF',
    red:    '#F92672',
    bg:     '#272822',
    fg:     '#F8F8F2'
};

export default class JumpPlugin extends Plugin {
    private overlayContainer: HTMLElement | null = null;
    private keyHandler: ((e: KeyboardEvent) => void) | null = null;

    // 全アルファベット
    private readonly fullAlphabet = "abcdefghijklmnopqrstuvwxyz";
    
    // プレフィックスとして使用する優先順位
    private readonly prefixOrder = "jklmnopqrstuvwxyz"; 

    // 状態管理: 現在入力待ちのプレフィックス
    private pendingPrefix: string | null = null;

    async onload() {
        this.addCommand({
            id: 'jump',
            name: 'Jump',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.handleJump(editor, view);
            }
        });
    }

    private handleJump(editor: Editor, view: MarkdownView): void {
        this.cleanup();
        this.pendingPrefix = null;

        const targets = this.getVisibleJumpTargets(editor, view);
        
        if (targets.length === 0) return;

        this.createOverlays(targets);
        this.awaitInput(editor, targets);
    }

    /**
     * ターゲット生成ロジック (2パス処理)
     */
    private getVisibleJumpTargets(editor: Editor, view: MarkdownView): JumpTarget[] {
        const potentialTargets: { line: number, top: number, left: number }[] = [];
        const lineCount = editor.lineCount();
        
        // @ts-ignore
        const contentEl = view.contentEl;
        const viewRect = contentEl.getBoundingClientRect();
        
        let lastTop = -9999;

        // --- Step 1: 有効な座標を持つ行を収集 ---
        for (let i = 0; i < lineCount; i++) {
            const coords = this.getCoords(editor, i, 0);
            if (!coords) continue;

            // 折りたたみ & 画面外判定
            if ((coords.bottom - coords.top <= 0) || (Math.abs(coords.top - lastTop) < 2)) continue;
            if (coords.bottom < viewRect.top || coords.top > viewRect.bottom) continue;

            potentialTargets.push({
                line: i,
                top: coords.top,
                left: coords.left
            });
            lastTop = coords.top;
        }

        const targetCount = potentialTargets.length;
        if (targetCount === 0) return [];

        // --- Step 2: キー構成決定 ---
        const scheme = this.calculateKeyScheme(targetCount);
        const { baseKeys, activePrefixes } = scheme;
        
        // --- Step 3: ラベル割り当て ---
        const targets: JumpTarget[] = [];
        const baseLen = baseKeys.length;
        const suffixLen = this.fullAlphabet.length; // 26

        const maxCapacity = baseLen + (activePrefixes.length * suffixLen);
        const countToProcess = Math.min(targetCount, maxCapacity);

        for (let i = 0; i < countToProcess; i++) {
            const pt = potentialTargets[i];
            let charCode = "";
            let label = "";
            let prefix: string | null = null;

            if (i < baseLen) {
                // 1ページ目 (Base keys)
                charCode = baseKeys[i];
                label = charCode;
                prefix = null;
            } else {
                // 2ページ目以降 (Prefix + Suffix)
                const offset = i - baseLen;
                const prefixIndex = Math.floor(offset / suffixLen);
                const suffixIndex = offset % suffixLen;

                if (prefixIndex < activePrefixes.length) {
                    const p = activePrefixes[prefixIndex];
                    const s = this.fullAlphabet[suffixIndex];
                    
                    charCode = s;
                    label = `${p}${s}`;
                    prefix = p;
                }
            }

            targets.push({
                line: pt.line,
                char: charCode,
                label: label,
                prefix: prefix,
                top: pt.top,
                left: pt.left
            });
        }

        return targets;
    }

    /**
     * ターゲット総数に応じてプレフィックス数とベースキー配列を計算
     */
    private calculateKeyScheme(count: number): KeyScheme {
        const full = this.fullAlphabet.split('');
        const maxPrefixes = this.prefixOrder.length;

        for (let p = 0; p <= maxPrefixes; p++) {
            const baseCount = 26 - p;
            const extendedCount = p * 26;
            const capacity = baseCount + extendedCount;

            if (capacity >= count || p === maxPrefixes) {
                const activePrefixes = this.prefixOrder.slice(0, p).split('');
                const baseKeys = full.filter(char => !activePrefixes.includes(char));
                return { baseKeys, activePrefixes };
            }
        }
        return { baseKeys: full, activePrefixes: [] };
    }

    private getCoords(editor: Editor, line: number, ch: number): { left: number, top: number, bottom: number } | null {
        // @ts-ignore
        const cm = (editor as any).cm;
        if (!cm) return null;

        if (typeof cm.coordsAtPos === 'function') { // CM6
            const offset = editor.posToOffset({ line, ch });
            const rect = cm.coordsAtPos(offset);
            return rect ? { left: rect.left, top: rect.top, bottom: rect.bottom } : null;
        } 
        if (typeof cm.charCoords === 'function') { // CM5
            const rect = cm.charCoords({ line, ch }, "window");
            return rect ? { left: rect.left, top: rect.top, bottom: rect.bottom } : null;
        }
        return null;
    }

    /**
     * 文字からMonokaiカラーを取得する (グループ固定)
     */
    private getColorForChar(char: string): string {
        const c = char.toLowerCase();
        // a-e: Yellow
        if (/[a-e]/.test(c)) return MONOKAI.yellow;
        // f-j: Green
        if (/[f-j]/.test(c)) return MONOKAI.green;
        // k-o: Orange
        if (/[k-o]/.test(c)) return MONOKAI.orange;
        // p-t: Purple
        if (/[p-t]/.test(c)) return MONOKAI.purple;
        // u-z: Blue
        if (/[u-z]/.test(c)) return MONOKAI.blue;
        
        return MONOKAI.red; // Fallback
    }

    /**
     * オーバーレイ作成
     */
    private createOverlays(targets: JumpTarget[]): void {
        this.overlayContainer = document.createElement('div');
        this.overlayContainer.addClass('jump-plugin-overlay-container');
        
        Object.assign(this.overlayContainer.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: '9999'
        });

        // フォントサイズ設定
        const MAX_FONT_SIZE = 26; // 最大サイズを大きく設定
        const MIN_FONT_SIZE = 14;

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const nextTarget = targets[i + 1];

            // --- フォントサイズ計算（行間調整） ---
            let fontSize = MAX_FONT_SIZE;
            
            if (nextTarget) {
                const availableHeight = nextTarget.top - target.top;
                // 枠線なし、padding極小のため、availableHeightのほぼ全てを使える
                // 少しだけマージン(1px程度)を持たせる
                const allowedFontSize = availableHeight - 1; 
                
                if (allowedFontSize < MAX_FONT_SIZE) {
                    fontSize = Math.max(MIN_FONT_SIZE, allowedFontSize);
                }
            }

            // --- 配色決定 ---
            // サフィックス文字（target.char）に基づいて色を決定
            const bgColor = this.getColorForChar(target.char);
            
            // 背景が明るいMonokaiカラーなので、文字色は背景色に近い濃い色にする
            const textColor = '#272822'; 

            const el = document.createElement('div');
            el.textContent = target.label;
            
            Object.assign(el.style, {
                position: 'absolute',
                top: `${target.top}px`,
                left: `${target.left}px`,
                backgroundColor: bgColor,
                color: textColor,
                // border削除
                border: 'none', 
                fontSize: `${fontSize}px`,
                fontFamily: 'monospace',
                fontWeight: '900', // Bold
                // padding縮小
                padding: '0 2px', 
                borderRadius: '2px',
                // 境界線代わりの影（控えめに）
                boxShadow: '0 1px 3px rgba(0,0,0,0.5)', 
                lineHeight: '1',
                // ベースライン調整: 文字が大きいので少し上にずらす
                transform: 'translateY(-3px)', 
                zIndex: '10000',
                transition: 'opacity 0.1s, transform 0.1s',
                whiteSpace: 'nowrap'
            });

            target.element = el;
            this.overlayContainer?.appendChild(el);
        }

        document.body.appendChild(this.overlayContainer);
    }

    /**
     * プレフィックス入力時の表示フィルタリング
     */
    private updateOverlayVisibility(): void {
        const children = this.overlayContainer?.children;
        if (!children) return;

        for (let i = 0; i < children.length; i++) {
            const el = children[i] as HTMLElement;
            const text = el.textContent || "";
            
            let shouldShow = false;

            if (this.pendingPrefix === null) {
                // 何も押されていない時は全て表示
                shouldShow = true;
            } else {
                // プレフィックス入力済み
                if (text.startsWith(this.pendingPrefix)) {
                    shouldShow = true;
                } else {
                    shouldShow = false;
                }
            }

            if (shouldShow) {
                el.style.opacity = '1';
                if (this.pendingPrefix) {
                    // 選択中は少し強調
                    el.style.transform = 'translateY(-3px) scale(1.05)';
                    el.style.zIndex = '10001';
                    // 選択中は白枠をつけて強調しても良いかもしれないが、
                    // 要望通り枠線なしを基本とする
                } else {
                    el.style.transform = 'translateY(-3px)';
                    el.style.zIndex = '10000';
                }
            } else {
                el.style.opacity = '0.05'; // ほぼ透明に
                el.style.transform = 'translateY(-3px)';
                el.style.zIndex = '9999';
            }
        }
    }

    private awaitInput(editor: Editor, targets: JumpTarget[]): void {
        this.keyHandler = (e: KeyboardEvent) => {
            if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
            if (e.isComposing || e.key === 'Process' || e.keyCode === 229) return;

            e.preventDefault();
            e.stopPropagation();

            const inputChar = e.key;

            // --- プレフィックス判定 ---
            const isPrefixChar = targets.some(t => t.prefix === inputChar);

            if (isPrefixChar && this.pendingPrefix === null) {
                this.pendingPrefix = inputChar;
                this.updateOverlayVisibility();
                return;
            }

            // --- キャンセル判定 ---
            if (this.pendingPrefix !== null && inputChar === this.pendingPrefix) {
                this.pendingPrefix = null;
                this.updateOverlayVisibility();
                return;
            }

            // --- ジャンプ判定 ---
            const target = targets.find(t => {
                if (this.pendingPrefix !== null) {
                    return t.prefix === this.pendingPrefix && t.char === inputChar;
                }
                return t.prefix === null && t.char === inputChar;
            });

            if (target) {
                this.executeJump(editor, target);
            } else {
                this.cleanup();
            }
        };

        window.addEventListener('keydown', this.keyHandler, { capture: true });
    }

    private executeJump(editor: Editor, target: JumpTarget): void {
        editor.setCursor({ line: target.line, ch: 0 });
        this.cleanup();
    }

    private cleanup(): void {
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }
        if (this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler, { capture: true });
            this.keyHandler = null;
        }
        this.pendingPrefix = null;
    }

    onunload() {
        this.cleanup();
    }
}
