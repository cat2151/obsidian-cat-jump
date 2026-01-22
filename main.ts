import { Editor, MarkdownView, Plugin } from 'obsidian';

/**
 * ジャンプ先の情報を保持するインターフェース
 */
interface JumpTarget {
    line: number;
    char: string;       // 実際の入力判定文字 (例: "a")
    label: string;      // 表示用のラベル (例: "a", ";a")
    isSecondPage: boolean; // セミコロン(;)が必要な2ページ目かどうか
    top: number;
    left: number;
    element?: HTMLElement; // DOM要素への参照
}

export default class JumpPlugin extends Plugin {
    // コンテナ類の参照
    private overlayContainer: HTMLElement | null = null;
    
    // イベントハンドラの参照
    private keyHandler: ((e: KeyboardEvent) => void) | null = null;

    // ジャンプに使用する基本キー配列 (a-z, A-Z)
    private readonly jumpKeys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    // 状態管理
    private isSemicolonPending: boolean = false; // ";" が押されたかどうかのフラグ

    async onload() {
        this.addCommand({
            id: 'jump',
            name: 'Jump',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.handleJump(editor, view);
            }
        });
    }

    /**
     * Jumpコマンドのメイン処理フロー
     */
    private handleJump(editor: Editor, view: MarkdownView): void {
        // 1. クリーンアップ & 初期化
        this.cleanup();
        this.isSemicolonPending = false;

        // 2. ターゲット取得
        const targets = this.getVisibleJumpTargets(editor, view);
        
        if (targets.length === 0) {
            return;
        }

        // 3. オーバーレイ表示（ここでサイズ調整を行う）
        this.createOverlays(targets);

        // 4. 入力待機
        this.awaitInput(editor, targets);
    }

    /**
     * 表示範囲内の行を特定し、ターゲット情報を生成する
     */
    private getVisibleJumpTargets(editor: Editor, view: MarkdownView): JumpTarget[] {
        const targets: JumpTarget[] = [];
        const lineCount = editor.lineCount();
        
        // @ts-ignore: contentEl is accessible
        const contentEl = view.contentEl;
        const viewRect = contentEl.getBoundingClientRect();
        
        let keyIndex = 0;
        let lastTop = -9999;
        
        // 最大割当可能数: キー配列長 + (セミコロン + キー配列長)
        const maxKeys = this.jumpKeys.length * 2;

        for (let i = 0; i < lineCount; i++) {
            if (keyIndex >= maxKeys) break;

            const coords = this.getCoords(editor, i, 0);
            if (!coords) continue;

            // 折りたたみ判定 & 画面外判定
            // coords.bottom - coords.top <= 0 : 高さが0なら非表示
            if ((coords.bottom - coords.top <= 0) || (Math.abs(coords.top - lastTop) < 2)) continue;
            
            // 完全に画面外ならスキップ
            if (coords.bottom < viewRect.top || coords.top > viewRect.bottom) continue;

            // キー割り当てロジック
            let charCode = "";
            let label = "";
            let isSecondPage = false;

            if (keyIndex < this.jumpKeys.length) {
                // 1ページ目 (a-Z)
                charCode = this.jumpKeys[keyIndex];
                label = charCode;
                isSecondPage = false;
            } else {
                // 2ページ目 (; + a-Z)
                const adjustedIndex = keyIndex - this.jumpKeys.length;
                charCode = this.jumpKeys[adjustedIndex];
                label = `;${charCode}`;
                isSecondPage = true;
            }

            targets.push({
                line: i,
                char: charCode,
                label: label,
                isSecondPage: isSecondPage,
                top: coords.top,
                left: coords.left
            });
            
            lastTop = coords.top;
            keyIndex++;
        }

        return targets;
    }

    /**
     * 座標取得ヘルパー
     */
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
     * オーバーレイDOM作成
     * ここで隣接するターゲットとの距離を計算し、フォントサイズを動的に変更する
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

        // 定数設定
        const MAX_FONT_SIZE = 20; // 基本の最大フォントサイズ
        const MIN_FONT_SIZE = 12; // 縮小する場合の最小限界
        const PADDING_V = 4;      // 上下のpadding合計 (2px + 2px)
        const BORDER_V = 2;       // 上下のborder合計 (1px + 1px)
        const MARGIN = 2;         // ラベル間の最低マージン

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const nextTarget = targets[i + 1]; // 次の行のターゲット（存在すれば）

            // デフォルトサイズ
            let fontSize = MAX_FONT_SIZE;

            // 次の行が存在する場合、隙間を計算してリサイズ判定を行う
            if (nextTarget) {
                const availableHeight = nextTarget.top - target.top;
                
                // ラベルに必要な高さ = fontSize + padding + border
                // したがって、許容できるfontSize = 利用可能な高さ - padding - border - マージン
                const allowedFontSize = availableHeight - PADDING_V - BORDER_V - MARGIN;

                if (allowedFontSize < MAX_FONT_SIZE) {
                    fontSize = Math.max(MIN_FONT_SIZE, allowedFontSize);
                }
            }

            const el = document.createElement('div');
            el.textContent = target.label;
            
            Object.assign(el.style, {
                position: 'absolute',
                top: `${target.top}px`,
                left: `${target.left}px`,
                backgroundColor: '#FFD700', // Gold
                color: '#000000',
                border: '1px solid #000000',
                fontSize: `${fontSize}px`, // 動的に計算したサイズを適用
                fontFamily: 'monospace',
                fontWeight: '900',
                padding: '2px 6px',
                borderRadius: '4px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                lineHeight: '1',
                transform: 'translateY(-2px)', // 少し上にずらして行のベースラインに合わせる
                zIndex: '10000',
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap' // 折り返し防止
            });

            target.element = el;
            this.overlayContainer?.appendChild(el);
        }

        document.body.appendChild(this.overlayContainer);
    }

    /**
     * セミコロンモードに入った時の表示更新（無関係なラベルを隠す）
     */
    private filterOverlaysForSemicolon(): void {
        const children = this.overlayContainer?.children;
        if (!children) return;

        for (let i = 0; i < children.length; i++) {
            const el = children[i] as HTMLElement;
            // ラベルが ";" で始まらないものは薄くする
            if (!el.textContent?.startsWith(';')) {
                el.style.opacity = '0.1';
            } else {
                // ";" で始まるものは強調
                el.style.backgroundColor = '#FFA500';
                el.style.borderColor = 'white';
            }
        }
    }

    /**
     * 入力待機
     */
    private awaitInput(editor: Editor, targets: JumpTarget[]): void {
        this.keyHandler = (e: KeyboardEvent) => {
            // 修飾キー単体は無視
            if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;

            // IME入力中 (Processキーなど) は何もせず無視する
            if (e.isComposing || e.key === 'Process' || e.keyCode === 229) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const inputChar = e.key;

            // --- A. セミコロン入力時の処理 ---
            if (inputChar === ';') {
                if (this.isSemicolonPending) {
                    this.cleanup(); // 2回押したらキャンセル扱い
                } else {
                    this.isSemicolonPending = true;
                    this.filterOverlaysForSemicolon();
                }
                return;
            }

            // --- B. 文字入力によるジャンプ判定 ---
            const target = targets.find(t => {
                if (this.isSemicolonPending) {
                    // セミコロン待機中: 2ページ目かつ文字一致
                    return t.isSecondPage && t.char === inputChar;
                } else {
                    // 通常時: 1ページ目かつ文字一致
                    return !t.isSecondPage && t.char === inputChar;
                }
            });

            if (target) {
                this.executeJump(editor, target);
            } else {
                // 不正なキーなら終了
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
        
        this.isSemicolonPending = false;
    }

    onunload() {
        this.cleanup();
    }
}
