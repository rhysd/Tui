declare namespace JumpJS {
    type TransitionFunc = (t: number, b: number, c: number, d: number) => number;
    interface Options {
        duration?: number;
        offset?: number;
        callback?: () => void;
        easing?: TransitionFunc;
        a11y?: boolean;
    }
}

declare module 'jump.js' {
    interface Jump {
        (selector: string, opts?: JumpJS.Options): void;
        (element: HTMLElement, opts?: JumpJS.Options): void;
        (pixels: number, opts?: JumpJS.Options): void;
    }
    const jump: Jump;
    export = jump;
}
