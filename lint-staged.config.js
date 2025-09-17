export default {
    "**/*.ts": [
        () => "tsc --noEmit",
        "biome check .",
    ],
    "*": [
        "biome check .",
    ]
}