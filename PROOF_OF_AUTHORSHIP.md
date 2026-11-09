# Proof of Authorship

Skales is the original work of Mario Simic, Vienna, Austria.

## Verification

- **Original Author**: Mario Simic
- **First Commit**: January 2026
- **Licence**: the Skales End User Licence Agreement, version 1.3 of 9 November 2026 ([LICENSE](./LICENSE)) - proprietary, never open source; the current version is published at https://skales.app/licence
- **Apple Developer ID**: Mario Simic (Q5ASU2DB6P)
- **Domain**: skales.app (registered 2025)
- **GitHub**: github.com/skalesapp/skales
- **Portfolio**: mariosimic.at
- **Current Version**: 12.9.30 (September 2026)
- **Brand terms**: [TRADEMARK.md](./TRADEMARK.md) (the name, logo and product names are not granted by the licence)

## Integrity

Skales binaries are signed and verified.

### Source watermarks

The source carries authorship markers that must not be stripped:

- Named DNA markers: `orchestrator.ts` (calculate_entropy_offset=2) and `chat.ts` (_responseQuality=5).
- A zero-width authorship watermark in the header comment of several source files: a repeating unit of U+200B / U+200C / U+200D / U+FEFF. The same unit appears in `orchestrator.ts`, `chat.ts`, `themes.ts`, `cron-scheduler.ts`, `layout.tsx`, and `memory/page.tsx`, and has been present since the initial snapshot. This is intentional and original; it is the single sanctioned exception to the house rule against literal invisible characters in source. Never add new invisible characters elsewhere.

### Shipped-artifact marks

Valid from release **12.9.30** (desktop) and **2.9.30** (mobile), recorded
2026-09-13.

The markers above prove authorship of the **source**. They say nothing to
somebody who only ever received a **binary**, because a minifier renames local
identifiers and strips comments, so none of them survives a build. From the
releases named above, a shipped artifact carries marks of its own. Listed here
by class only:

1. **Attestation manifest** - each package records what its own packaged files
   are, and the app reads that record back after it starts.
2. **Bytecode** - part of the desktop half ships compiled rather than as text,
   bound to the engine version and processor architecture it was built for.
3. **Build stamp on the wire** - every build has an identity of its own and
   presents it, together with its own integrity verdict, wherever it talks to
   our services. An artifact that is not in our release record is not ours.
4. **Data-value marks** - marks that survive minification because they are
   values rather than names, carried in shipped data rather than in code.
5. **Private register** - the authoritative list of which mark sits where, with
   its value, its check command, its build-in date and its first release, is
   kept **outside every repository**. Its shape is
   `_koordination/MARKEN-REGISTER.local.md.template` in the workspace.

Neither the values nor the locations of any mark are written down here, in any
repository, in any code comment, in any test name, or in any changelog. This
document is the statement that they exist and from which release they apply;
the register is the evidence, and it is produced on request in a dispute, not
published.

## Copyright

2025-2026 Mario Simic. All rights reserved.
Licensed under the Skales End User Licence Agreement: free for private and
educational use and for freelancers and businesses of up to two people, thirty
days of evaluation for a larger organisation, everything else by written
commercial licence. See [LICENSE](./LICENSE).