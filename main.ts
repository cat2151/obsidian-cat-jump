import { Editor, MarkdownView, Plugin } from 'obsidian';

// --- Interfaces ---

interface JumpTarget {
    line: number;
    char: string;
    label: string;
    prefix: string | null;
    top: number;
    left: number;
    element?: HTMLElement;
}

interface RawTarget {
    line: number;
    top: number;
    left: number;
}

interface KeyScheme {
    baseKeys: string[];
    activePrefixes: string[];
}

// --- Constants ---

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

const UI_CONSTANTS = {
    MAX_FONT_SIZE: 26,
    MIN_FONT_SIZE: 14,
    Z_INDEX_BASE: 10000,
    Z_INDEX_ACTIVE: 10001
};

// --- Services ---

/**
 * 座標計算とターゲット候補の抽出を担当
 */
class CoordinateService {
    static getVisibleTargets(editor: Editor, view: MarkdownView): RawTarget[] {
        const lineCount = editor.lineCount();
        // @ts-ignore
        const viewRect = view.contentEl.getBoundingClientRect();

        const targets: RawTarget[] = [];
        let lastTop = -9999;

        for (let i = 0; i < lineCount; i++) {
            const coords = this.getLineCoords(editor, i);

            if (this.isValidTarget(coords, viewRect, lastTop)) {
                targets.push({ line: i, top: coords!.top, left: coords!.left });
                lastTop = coords!.top;
            }
        }
        return targets;
    }

    private static getLineCoords(editor: Editor, line: number): { left: number, top: number, bottom: number } | null {
        // @ts-ignore
        const cm = (editor as any).cm;
        if (!cm) return null;

        return typeof cm.coordsAtPos === 'function'
            ? this.getCoordsCM6(editor, cm, line)
            : this.getCoordsCM5(cm, line);
    }

    private static getCoordsCM6(editor: Editor, cm: any, line: number) {
        const offset = editor.posToOffset({ line, ch: 0 });
        return cm.coordsAtPos(offset);
    }

    private static getCoordsCM5(cm: any, line: number) {
        return cm.charCoords({ line, ch: 0 }, "window");
    }

    private static isValidTarget(coords: any, viewRect: DOMRect, lastTop: number): boolean {
        if (!coords) return false;
        // 折り畳み判定 & 行間判定
        if (coords.bottom - coords.top <= 0) return false;
        if (Math.abs(coords.top - lastTop) < 2) return false;
        // 画面外判定
        if (coords.bottom < viewRect.top || coords.top > viewRect.bottom) return false;

        return true;
    }
}

/**
 * キー配列の計算と文字の割り当てを担当
 */
class KeyAssignmentService {
    private readonly fullAlphabet = "abcdefghijklmnopqrstuvwxyz";
    private readonly prefixOrder = "jklmnopqrstuvwxyz";

    assignKeys(rawTargets: RawTarget[]): JumpTarget[] {
        const count = rawTargets.length;
        if (count === 0) return [];

        const scheme = this.calculateScheme(count);
        return this.generateJumpTargets(rawTargets, scheme);
    }

    private calculateScheme(count: number): KeyScheme {
        const full = this.fullAlphabet.split('');
        const maxPrefixes = this.prefixOrder.length;

        for (let p = 0; p <= maxPrefixes; p++) {
            const capacity = (26 - p) + (p * 26);
            if (capacity >= count || p === maxPrefixes) {
                const activePrefixes = this.prefixOrder.slice(0, p).split('');
                const baseKeys = full.filter(c => !activePrefixes.includes(c));
                return { baseKeys, activePrefixes };
            }
        }
        return { baseKeys: full, activePrefixes: [] };
    }

    private generateJumpTargets(rawTargets: RawTarget[], scheme: KeyScheme): JumpTarget[] {
        const { baseKeys, activePrefixes } = scheme;
        const baseLen = baseKeys.length;
        const suffixLen = this.fullAlphabet.length;

        // 生成可能な最大数で打ち切る
        const maxCount = baseLen + (activePrefixes.length * suffixLen);
        const processCount = Math.min(rawTargets.length, maxCount);

        const result: JumpTarget[] = [];

        for (let i = 0; i < processCount; i++) {
            const raw = rawTargets[i];

            if (i < baseLen) {
                result.push(this.createBaseTarget(raw, baseKeys[i]));
            } else {
                const offset = i - baseLen;
                result.push(this.createExtendedTarget(raw, offset, activePrefixes, suffixLen));
            }
        }
        return result;
    }

    private createBaseTarget(raw: RawTarget, key: string): JumpTarget {
        return {
            ...raw,
            char: key,
            label: key,
            prefix: null
        };
    }

    private createExtendedTarget(raw: RawTarget, offset: number, prefixes: string[], suffixLen: number): JumpTarget {
        const prefixIndex = Math.floor(offset / suffixLen);
        const suffixIndex = offset % suffixLen;

        // 安全策（通常ここには来ない）
        if (prefixIndex >= prefixes.length) return this.createBaseTarget(raw, "?");

        const p = prefixes[prefixIndex];
        const s = this.fullAlphabet[suffixIndex];

        return {
            ...raw,
            char: s,
            label: `${p}${s}`,
            prefix: p
        };
    }
}

/**
 * DOM要素の生成とスタイル適用を担当
 */
class OverlayService {
    private container: HTMLElement | null = null;

    render(targets: JumpTarget[]): void {
        this.remove();
        this.container = this.createContainer();

        targets.forEach((target, i) => {
            const nextTop = targets[i + 1]?.top;
            const marker = this.createMarkerElement(target, nextTop);
            target.element = marker;
            this.container?.appendChild(marker);
        });

        document.body.appendChild(this.container);
    }

    updateVisibility(pendingPrefix: string | null): void {
        if (!this.container) return;
        const children = Array.from(this.container.children) as HTMLElement[];

        children.forEach(el => {
            const text = el.textContent || "";
            const isMatch = this.shouldShow(text, pendingPrefix);
            this.applyVisibilityStyle(el, isMatch, !!pendingPrefix);
        });
    }

    remove(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }

    // --- Internal Helper Methods ---

    private createContainer(): HTMLElement {
        const el = document.createElement('div');
        el.addClass('jump-plugin-overlay-container');
        Object.assign(el.style, {
            position: 'fixed',
            top: '0', left: '0',
            width: '100vw', height: '100vh',
            pointerEvents: 'none',
            zIndex: '9999'
        });
        return el;
    }

    private createMarkerElement(target: JumpTarget, nextTargetTop?: number): HTMLElement {
        const fontSize = this.calculateFontSize(target.top, nextTargetTop);
        const bgColor = this.getColorForChar(target.char);

        const el = document.createElement('div');
        el.textContent = target.label;

        // スタイルオブジェクトを取得して適用
        const styles = this.getMarkerStyles(target, fontSize, bgColor);
        Object.assign(el.style, styles);

        return el;
    }

    private calculateFontSize(currentTop: number, nextTop?: number): number {
        if (!nextTop) return UI_CONSTANTS.MAX_FONT_SIZE;

        const availableHeight = nextTop - currentTop;
        const allowedSize = availableHeight - 1; // マージン考慮

        if (allowedSize < UI_CONSTANTS.MAX_FONT_SIZE) {
            return Math.max(UI_CONSTANTS.MIN_FONT_SIZE, allowedSize);
        }
        return UI_CONSTANTS.MAX_FONT_SIZE;
    }

    private getMarkerStyles(target: JumpTarget, fontSize: number, bgColor: string): Partial<CSSStyleDeclaration> {
        return {
            position: 'absolute',
            top: `${target.top}px`,
            left: `${target.left}px`,
            backgroundColor: bgColor,
            color: '#272822', // Dark Text
            fontSize: `${fontSize}px`,
            fontFamily: 'monospace',
            fontWeight: '900',
            padding: '0 2px',
            borderRadius: '2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
            lineHeight: '1',
            transform: 'translateY(-3px)', // Baseline adjustment
            zIndex: String(UI_CONSTANTS.Z_INDEX_BASE),
            transition: 'opacity 0.1s, transform 0.1s',
            whiteSpace: 'nowrap',
            border: 'none'
        };
    }

    private shouldShow(label: string, prefix: string | null): boolean {
        if (prefix === null) return true;
        return label.startsWith(prefix);
    }

    private applyVisibilityStyle(el: HTMLElement, isVisible: boolean, isFiltering: boolean): void {
        if (isVisible) {
            el.style.opacity = '1';
            el.style.zIndex = isFiltering ? String(UI_CONSTANTS.Z_INDEX_ACTIVE) : String(UI_CONSTANTS.Z_INDEX_BASE);
            el.style.transform = isFiltering ? 'translateY(-3px) scale(1.05)' : 'translateY(-3px)';
        } else {
            el.style.opacity = '0.05';
            el.style.zIndex = '9999';
            el.style.transform = 'translateY(-3px)';
        }
    }

    private getColorForChar(char: string): string {
        const c = char.toLowerCase();
        if (/[a-e]/.test(c)) return MONOKAI.yellow;
        if (/[f-j]/.test(c)) return MONOKAI.green;
        if (/[k-o]/.test(c)) return MONOKAI.orange;
        if (/[p-t]/.test(c)) return MONOKAI.purple;
        if (/[u-z]/.test(c)) return MONOKAI.blue;
        return MONOKAI.red;
    }
}

/**
 * 入力イベントの監視と制御フローを担当
 */
class InputHandler {
    private keyListener: ((e: KeyboardEvent) => void) | null = null;
    private pendingPrefix: string | null = null;

    constructor(
        private overlayService: OverlayService,
        private onJump: (target: JumpTarget) => void,
        private onCancel: () => void
    ) {}

    start(targets: JumpTarget[]): void {
        this.pendingPrefix = null;
        this.keyListener = (e) => this.handleKey(e, targets);
        window.addEventListener('keydown', this.keyListener, { capture: true });
    }

    stop(): void {
        if (this.keyListener) {
            window.removeEventListener('keydown', this.keyListener, { capture: true });
            this.keyListener = null;
        }
    }

    private handleKey(e: KeyboardEvent, targets: JumpTarget[]): void {
        if (this.shouldIgnoreKey(e)) return;

        e.preventDefault();
        e.stopPropagation();

        const inputChar = e.key;

        if (this.tryJump(targets, inputChar)) return;
        if (this.trySetPrefix(targets, inputChar)) return;

        this.onCancel();
    }

    private shouldIgnoreKey(e: KeyboardEvent): boolean {
        return (
            ["Shift", "Control", "Alt", "Meta", "NonConvert"].includes(e.key) ||
            e.isComposing ||
            e.key === 'Process' ||
            e.keyCode === 229
        );
    }

    /**
     * ジャンプ成立判定
     */
    private tryJump(targets: JumpTarget[], input: string): boolean {
        const target = targets.find(t => {
            if (this.pendingPrefix !== null) {
                return t.prefix === this.pendingPrefix && t.char === input;
            }
            return t.prefix === null && t.char === input;
        });

        if (target) {
            this.onJump(target);
            return true;
        }
        return false;
    }

    /**
     * プレフィックス開始判定
     */
    private trySetPrefix(targets: JumpTarget[], input: string): boolean {
        // すでにプレフィックス入力中の場合は変更不可
        if (this.pendingPrefix !== null) return false;

        const isPrefixStart = targets.some(t => t.prefix === input);
        if (isPrefixStart) {
            this.pendingPrefix = input;
            this.overlayService.updateVisibility(this.pendingPrefix);
            return true;
        }
        return false;
    }
}

// --- Main Plugin Class ---

export default class JumpPlugin extends Plugin {
    private coordinateService = CoordinateService;
    private keyAssignmentService = new KeyAssignmentService();
    private overlayService = new OverlayService();
    private inputHandler: InputHandler | null = null;

    async onload() {
        this.addCommand({
            id: 'jump',
            name: 'Jump',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.initiateJump(editor, view);
            }
        });
    }

    private initiateJump(editor: Editor, view: MarkdownView): void {
        // 1. クリーンアップ (多重起動防止)
        this.cleanup();

        // 2. ターゲット抽出
        const rawTargets = this.coordinateService.getVisibleTargets(editor, view);
        if (rawTargets.length === 0) return;

        // 3. キー割り当て
        const targets = this.keyAssignmentService.assignKeys(rawTargets);

        // 4. UI描画
        this.overlayService.render(targets);

        // 5. 入力待ち開始
        this.inputHandler = new InputHandler(
            this.overlayService,
            (target) => this.executeJump(editor, target), // Jump Callback
            () => this.cleanup()                          // Cancel Callback
        );
        this.inputHandler.start(targets);
    }

    private executeJump(editor: Editor, target: JumpTarget): void {
        editor.setCursor({ line: target.line, ch: 0 });
        this.cleanup();
    }

    private cleanup(): void {
        this.inputHandler?.stop();
        this.inputHandler = null;
        this.overlayService.remove();
    }

    onunload() {
        this.cleanup();
    }
}
