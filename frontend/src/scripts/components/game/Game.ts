
export function Game() {

    const container = document.createElement("canvas");
    container.id = "game-canvas";
    container.classList.add("w-full", "aspect-ratio-[16/9]", "flex", "z-100");

    return container.outerHTML;
}