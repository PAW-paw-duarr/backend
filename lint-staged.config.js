export default {
    "**/*.ts": [
        () => "tsc --noEmit",
        "biome lint --write .",
        "biome format . --fix"
    ],
    "*": [
        "biome format . --write"
    ]
}