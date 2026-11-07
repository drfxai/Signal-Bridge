# EA distribution verification — 2026-11-07

Website, portal Setup and Telegram Mini App use the same reviewed compiled downloads.
Customer activation codes remain in authenticated account endpoints and are never
embedded in either public executable or its download metadata.

| Product | Public route | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Signal Bridge 0.29.1 | `/download/DrFX_SignalBridge_EA.ex5` | 295534 | `b217d1052e10556414eb0d82fcac2cfbeaf06b9a2455400096e41621a7014e59` |
| Scalper Pro, current compiled build | `/download/DrFX_Scalper_Pro.ex5` | 207554 | `a3f6ee91d469b6ba20eb07a59b43564f1dec54b0cceb6c67e62da3589a0ca815` |

The Worker checks the EX5 signature, exact size and SHA-256 before returning an
attachment. It rejects source files, unknown filenames, truncated data, HTML and
replaced binaries. GET and HEAD are supported. Failure returns 503 and a retry
instruction rather than a misleading downloadable file.

Signal Bridge is retrieved from the existing official `ea-latest` release.
Its MQL5 source matches the source at release commit
`46d43af0a13faf15b9367af3d898548d7041829a` in this review. Scalper is read through
the existing static assets binding; its downloaded production hash matches the
tracked binary. No fresh compiler run or broker execution is implied by this check.

## Updating a binary

Review compiler output and execution checks first. Then update the binary source,
version, byte count and digest together in `site/src/ea-downloads.mjs`. Changing
the mutable GitHub release alone intentionally makes the verified download fail
until its reviewed metadata is updated. Keep the two public routes stable.

## Remaining release boundaries

- Automatic LIVE trading remains disabled; current EA execution restrictions are
  unchanged. Broker validation still requires MT5, including reconnect, netting,
  hedging and risk controls.
- The existing public repository contains proprietary MQL5 source and its history.
  Public website downloads are compiled only, but the repository itself cannot be
  described as a compiled-only distribution. A private build repository is needed
  to protect future source changes; deleting a current file cannot revoke old copies.
- See `PUBLIC_RELEASE_CHECKLIST.md` for payment-provider, real-device, IP provenance
  and commercial checks that automated website tests cannot certify.
