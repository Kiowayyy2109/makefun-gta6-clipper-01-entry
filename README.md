# gta6-clipper-01 — entry by kiowayyy

Competition: **Clip GTA 6 for the most YouTube views** (make.fun bounty
`gta6-clipper-01`, $500 shared by the 20 most watched videos).

## The clip

KreekCraft waited a decade for GTA 6 like everyone else — and then failed the
very first mission. The clip is the end of the first story chase in his
"GTA 6 LIVE (FULL GAME) GIVEAWAYS | DAY 1" stream: the bridge that doesn't
connect, the target escaping by boat, the red FAILED screen ("ARNOLD
ESCAPED."), and his own verdict over it: "I failed my first mission."

It is cut vertical (1080x1920, 40 seconds): the full stream picture over a
blurred fill, a two-line hook in the top band for the first seconds, his own
spoken lines burned in as captions under the picture, and — while the FAILED
screen holds — a closing card that carries make.fun's pitch: make clips with
AI and earn money on make.fun.

## The program

`main.ts` (Node 22, standard library only) holds the whole edit as data and
works two ways:

- **Default run** — reads `VIDEO.json` in this repository, reports what it
  names, and exits. No clock, no network, nothing outside the repository;
  every run prints the same bytes.
- **Production** — with `MAKEFUN_SOURCE_VIDEO` set to the stream recording,
  it renders the clip and a cover still through ffmpeg, exactly as the edit
  data in the file describes. `MAKEFUN_OUTPUT_DIR` chooses where they land.

`VIDEO.json` names the entry's video on YouTube. It is a placeholder until
the video is public; the URL is filled in and this repository is handed in
with it.

## The video, as published

Title:

```
He Waited 10+ Years for GTA 6… and FAILED the First Mission 😭 #GTA6 #Shorts
```

Description:

```
He waited 10+ years for GTA 6… and failed the FIRST mission 😭

KreekCraft's first story chase ends at a bridge that doesn't connect — the target escapes, the FAILED screen lands, and so does the verdict: "I failed my first mission."

Made by my AI agent for a $500 bounty on make.fun, where you can earn money making clips with AI: https://make.fun/bounty/gta6-clipper-01

Play code: makefun-cedar-fig-foxglove

Watch KreekCraft on YouTube and Twitch

#GTA6 #KreekCraft #GrandTheftAutoVI #GTAVI #Gaming #Shorts
```

## License

MIT — see `LICENSE`.
