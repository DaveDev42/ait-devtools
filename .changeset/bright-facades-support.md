---
'@ait-co/devtools': patch
---

Support `@apps-in-toss/web-framework` 3.0.1 GA while retaining the verified 2.10.8 line.

The unplugin now selects a versioned mock facade from the consumer's installed SDK major (or the explicit `sdkVersion` option), and the package exposes `/mock/2x` and `/mock/3x` for manual aliases. The 3.x facade adds the new domain namespaces, synchronous host constants, bridge factories, capability metadata, declared-age API, and updated ad contracts. CI now checks the complete runtime export surface and type compatibility of both SDK versions.
