# Context for Codex

Project: Ultimate Topology Studio, Site release v111.
This ZIP is the existing multi-file project, not a request to rebuild it from scratch.

Read SOURCE_EXPORT.md, README.md, CHANGELOG.md, package.json and applicable repository instructions first.
Keep existing Device Specifications, CLI Interface Mapping, License Matrix and network business rules intact.

The most recent unfinished task is a high-detail Buddha statue for the Japanese temple.
The public runtime was restored to the stable v108 sculpture. A newly generated neural candidate and Blender source are retained privately under assets-source/sculpt/neural-v109/.
The candidate is not quality-approved as matching the Meshy reference. TRELLIS and InstantMesh public generation attempts were blocked by GPU quota.

Important hosting finding: production Sites static assets were served before the Worker despite the supplied run_worker_first setting. Do not assume a Worker route can protect an existing public static asset. The candidate was removed from public assets; build-worker.mjs contains a guard against reintroducing that folder.

Do not publish customer PowerPoint source decks. Keep existing exports free of Symphony branding as requested.

This export itself does not authorize a new deployment or other project changes; follow the user's next task.
