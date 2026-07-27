# Internal-only content (DO NOT INGEST)

Put confidential Neo SOPs, pricing sheets, customer contracts, and employee procedures here.
Files in this folder are **not** loaded by the RAG ingest pipeline (`knowledge/` walker skips only if we add an allowlist — currently ingest walks all `knowledge/**/*.md` EXCEPT this file is named without being under a section used in prompts… 

**Important:** To keep this private, do **not** place secrets here with a `.md` extension that would be walked.

Safer pattern: use `../private/` outside `knowledge/` for true secrets.

This file documents the policy only.
